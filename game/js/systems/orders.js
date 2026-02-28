// =========================================
// Order Board System
// =========================================

class OrderSystem {
  constructor(game) {
    this.game = game;
  }

  // Initialize order board state if missing
  ensureState() {
    const s = this.game.state.get();
    if (!s.orders) {
      s.orders = { board: [], lastRefresh: 0, completed: 0 };
    }
    if (!s.boat) {
      s.boat = { order: null, lastArrival: 0, available: false };
    }
  }

  // Generate orders for the board
  refreshOrders() {
    this.ensureState();
    const s = this.game.state.get();
    const level = s.player.level;
    const now = Utils.now();

    // Generate 6 orders: 3 easy, 2 medium, 1 hard
    const board = [];
    const easyPool = Utils.shuffle(ORDER_TEMPLATES.easy);
    const medPool = Utils.shuffle(ORDER_TEMPLATES.medium);
    const hardPool = Utils.shuffle(ORDER_TEMPLATES.hard);

    for (let i = 0; i < 3 && i < easyPool.length; i++) {
      board.push(this.createOrder(easyPool[i], 'easy', now));
    }
    if (level >= 4) {
      for (let i = 0; i < 2 && i < medPool.length; i++) {
        board.push(this.createOrder(medPool[i], 'medium', now));
      }
    }
    if (level >= 8) {
      for (let i = 0; i < 1 && i < hardPool.length; i++) {
        board.push(this.createOrder(hardPool[i], 'hard', now));
      }
    }

    s.orders.board = board;
    s.orders.lastRefresh = now;
  }

  createOrder(template, difficulty, now) {
    const npc = ORDER_NPCS[Math.floor(Math.random() * ORDER_NPCS.length)];
    const levelMult = 1 + (this.game.state.get().player.level - 1) * 0.03;
    return {
      id: Utils.uid(),
      items: { ...template.items },
      filled: {},
      coins: Math.floor(template.baseCoins * levelMult),
      xp: Math.floor(template.baseXP * levelMult),
      difficulty,
      npc: npc.name,
      npcIcon: npc.icon,
      createdAt: now,
      bonusExpiry: now + 3600, // 1 hour bonus window
    };
  }

  // Check if board needs refresh (replace completed orders)
  update() {
    this.ensureState();
    const s = this.game.state.get();
    if (!s.orders.board || s.orders.board.length === 0) {
      this.refreshOrders();
    }

    // Check boat availability (every 8 "hours" = 480s in speed mode)
    if (s.player.level >= 15) {
      const now = Utils.now();
      if (!s.boat.available && (now - s.boat.lastArrival) > 480) {
        this.generateBoatOrder();
      }
    }
  }

  // Fill an order item
  fillOrderItem(orderId, itemId) {
    this.ensureState();
    const s = this.game.state.get();
    const order = s.orders.board.find(o => o.id === orderId);
    if (!order) return false;

    const needed = order.items[itemId] || 0;
    const filled = order.filled[itemId] || 0;
    const remaining = needed - filled;
    if (remaining <= 0) return false;

    const available = this.game.state.getItemCount(itemId);
    const toFill = Math.min(remaining, available);
    if (toFill <= 0) {
      this.game.notify.error(`You don't have any ${itemId}!`);
      return false;
    }

    this.game.state.removeItem(itemId, toFill);
    order.filled[itemId] = filled + toFill;
    Audio.sfx('click');
    this.game.state.save();
    return true;
  }

  // Check if order is complete
  isOrderComplete(order) {
    return Object.entries(order.items).every(
      ([item, qty]) => (order.filled[item] || 0) >= qty
    );
  }

  // Count completable orders
  getCompletableCount() {
    this.ensureState();
    const s = this.game.state.get();
    const board = s.orders.board || [];
    let count = 0;
    board.forEach(order => {
      const canComplete = Object.entries(order.items).every(
        ([item, qty]) => this.game.state.getItemCount(item) >= qty
      );
      if (canComplete) count++;
    });
    return count;
  }

  // Complete/submit an order (by index)
  completeOrder(orderIdx) {
    this.ensureState();
    const s = this.game.state.get();
    if (orderIdx < 0 || orderIdx >= s.orders.board.length) return;

    const order = s.orders.board[orderIdx];

    // Check player has all items
    const canComplete = Object.entries(order.items).every(
      ([item, qty]) => this.game.state.getItemCount(item) >= qty
    );
    if (!canComplete) return;

    // Consume items from inventory
    Object.entries(order.items).forEach(([item, qty]) => {
      this.game.state.removeItem(item, qty);
    });

    // Calculate bonus
    const now = Utils.now();
    const hasBonus = now < order.bonusExpiry;
    const coinMult = hasBonus ? 1.5 : 1;

    const coins = Math.floor(order.coins * coinMult);
    this.game.state.addCoins(coins);
    const levelUps = this.game.state.addXP(order.xp);

    s.orders.completed++;
    s.statistics.ordersCompleted = (s.statistics.ordersCompleted || 0) + 1;

    // Remove from board and add a new one
    s.orders.board.splice(orderIdx, 1);
    this.addReplacementOrder();

    Audio.sfx('quest_complete');
    this.game.notify.reward(`📦 Order delivered! +🪙${coins} +⭐${order.xp}XP${hasBonus ? ' (BONUS!)' : ''}`);

    this.game.updateQuestProgress('complete_order', 'any', 1);
    levelUps.forEach(lu => this.game.handleLevelUp(lu));
    this.game.checkAchievements();
    this.game.state.save();
  }

  addReplacementOrder() {
    const s = this.game.state.get();
    const level = s.player.level;
    const now = Utils.now();

    // Pick a random difficulty based on level
    let pool, diff;
    const r = Math.random();
    if (level >= 8 && r < 0.15) { pool = ORDER_TEMPLATES.hard; diff = 'hard'; }
    else if (level >= 4 && r < 0.5) { pool = ORDER_TEMPLATES.medium; diff = 'medium'; }
    else { pool = ORDER_TEMPLATES.easy; diff = 'easy'; }

    const template = pool[Math.floor(Math.random() * pool.length)];
    s.orders.board.push(this.createOrder(template, diff, now));
  }

  // Boat order system
  generateBoatOrder() {
    this.ensureState();
    const s = this.game.state.get();
    const template = BOAT_ORDER_TEMPLATES[Math.floor(Math.random() * BOAT_ORDER_TEMPLATES.length)];
    const npc = { name: 'Captain Barnacle', icon: '⛵' };

    s.boat.order = {
      id: Utils.uid(),
      items: { ...template.items },
      filled: {},
      coins: template.baseCoins,
      xp: template.baseXP,
      gems: template.gems || 0,
      npc: npc.name,
      npcIcon: npc.icon,
      createdAt: Utils.now(),
      expiresAt: Utils.now() + 3600, // 1 hour to fill
    };
    s.boat.available = true;
    this.game.notify.info('⛵ A trade ship has arrived! Check the Order Board!');
  }

  fillBoatItem(itemId) {
    this.ensureState();
    const s = this.game.state.get();
    if (!s.boat.order) return false;

    const order = s.boat.order;
    const needed = order.items[itemId] || 0;
    const filled = order.filled[itemId] || 0;
    const remaining = needed - filled;
    if (remaining <= 0) return false;

    const available = this.game.state.getItemCount(itemId);
    const toFill = Math.min(remaining, available);
    if (toFill <= 0) return false;

    this.game.state.removeItem(itemId, toFill);
    order.filled[itemId] = filled + toFill;
    Audio.sfx('click');
    this.game.state.save();
    return true;
  }

  completeBoatOrder() {
    this.ensureState();
    const s = this.game.state.get();
    if (!s.boat.order) return;

    const order = s.boat.order;
    const isComplete = Object.entries(order.items).every(
      ([item, qty]) => (order.filled[item] || 0) >= qty
    );
    if (!isComplete) return;

    this.game.state.addCoins(order.coins);
    const levelUps = this.game.state.addXP(order.xp);
    if (order.gems) this.game.state.addGems(order.gems);

    s.boat.order = null;
    s.boat.available = false;
    s.boat.lastArrival = Utils.now();

    Audio.sfx('quest_complete');
    this.game.notify.reward(`⛵ Ship loaded! +🪙${order.coins} +⭐${order.xp}XP${order.gems ? ` +💎${order.gems}` : ''}`);
    levelUps.forEach(lu => this.game.handleLevelUp(lu));
    this.game.checkAchievements();
    this.game.state.save();
  }
}
