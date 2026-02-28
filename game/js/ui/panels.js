// =========================================
// Panel/Modal Manager (v2 - Enhanced)
// =========================================

class PanelManager {
  constructor(game) {
    this.game = game;
    this.activePanel = null;
    this.overlay = document.getElementById('panel-overlay');

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activePanel) this.close();
    });
  }

  open(panelType, data = {}) {
    Audio.sfx('click');
    const content = this.buildPanel(panelType, data);
    if (!content) return;

    this.overlay.innerHTML = '';
    this.overlay.appendChild(content);
    this.overlay.classList.add('active');
    this.activePanel = panelType;
  }

  close() {
    this.overlay.classList.remove('active');
    this.activePanel = null;
    // Restore farm tab as active when panel closes
    if (this.game) {
      this.game.activeNav = 'farm';
      document.querySelectorAll('[data-nav]').forEach(t => {
        t.classList.toggle('active', t.dataset.nav === 'farm');
      });
      this.game.showFarmContext();
    }
  }

  isOpen() {
    return this.activePanel !== null;
  }

  buildPanel(type, data) {
    switch (type) {
      case 'shop': return this.buildShopPanel();
      case 'inventory': return this.buildInventoryPanel();
      case 'quests': return this.buildQuestPanel();
      case 'settings': return this.buildSettingsPanel();
      case 'avatar': return this.buildAvatarPanel();
      case 'building': return this.buildBuildingPanel(data);
      case 'animal_pen': return this.buildAnimalPenPanel(data);
      case 'confirm': return this.buildConfirmPanel(data);
      case 'welcome_back': return this.buildWelcomeBackPanel(data);
      case 'expansion': return this.buildExpansionPanel();
      // New panels
      case 'orders': return this.buildOrdersPanel();
      case 'achievements': return this.buildAchievementsPanel();
      case 'daily_login': return this.buildDailyLoginPanel();
      case 'collections': return this.buildCollectionsPanel();
      case 'mastery': return this.buildMasteryPanel();
      case 'pet': return this.buildPetPanel();
      case 'market': return this.buildMarketPanel();
      // Guild & Competition panels
      case 'guild': return this.buildGuildPanel();
      case 'guild_raid': return this.buildGuildRaidPanel();
      case 'leaderboard': return this.buildLeaderboardPanel();
      case 'tournament': return this.buildTournamentPanel();
      case 'challenge': return this.buildChallengePanel(data);
      default: return null;
    }
  }

  createPanelFrame(title, icon = '') {
    const panel = document.createElement('div');
    panel.className = 'panel';

    const header = document.createElement('div');
    header.className = 'panel-header';
    header.innerHTML = `<h2>${icon} ${title}</h2>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'panel-close';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => this.close();
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'panel-body';

    panel.appendChild(header);
    panel.body = body;
    panel.appendChild(body);
    return panel;
  }

  // ==================== SHOP ====================
  buildShopPanel() {
    const panel = this.createPanelFrame('Shop', '🛒');
    const state = this.game.state.get();
    const level = state.player.level;

    const tabs = document.createElement('div');
    tabs.className = 'panel-tabs';
    const tabNames = [
      { id: 'seeds', label: '🌱 Seeds' },
      { id: 'trees', label: '🌳 Trees' },
      { id: 'animals', label: '🐔 Animals' },
      { id: 'pens', label: '🏠 Pens' },
      { id: 'buildings', label: '🏪 Buildings' },
      { id: 'decorations', label: '🌸 Decor' },
      { id: 'expansion', label: '🗺️ Land' },
      { id: 'pets', label: '🐕 Pets' }
    ];

    let activeTab = 'seeds';
    const renderTab = (tabId) => {
      activeTab = tabId;
      tabs.querySelectorAll('.panel-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === tabId)
      );
      panel.body.innerHTML = '';
      switch (tabId) {
        case 'seeds': this.renderSeedsTab(panel.body, level); break;
        case 'trees': this.renderTreesTab(panel.body, level); break;
        case 'animals': this.renderAnimalsTab(panel.body, level); break;
        case 'pens': this.renderPensTab(panel.body, level); break;
        case 'buildings': this.renderBuildingsTab(panel.body, level); break;
        case 'decorations': this.renderDecorationsTab(panel.body, level); break;
        case 'expansion': this.renderExpansionTab(panel.body, level); break;
        case 'pets': this.renderPetsTab(panel.body); break;
      }
    };

    tabNames.forEach(t => {
      const tab = document.createElement('div');
      tab.className = 'panel-tab' + (t.id === activeTab ? ' active' : '');
      tab.textContent = t.label;
      tab.dataset.tab = t.id;
      tab.onclick = () => renderTab(t.id);
      tabs.appendChild(tab);
    });

    panel.insertBefore(tabs, panel.body);
    renderTab('seeds');
    return panel;
  }

  renderSeedsTab(container, level) {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    Object.values(CROPS_DATA).forEach(crop => {
      const locked = crop.unlockLevel > level;
      const item = document.createElement('div');
      item.className = 'shop-item' + (locked ? ' locked' : '');

      // Market price info
      let priceTag = '';
      if (this.game.market.isHot(crop.id)) {
        priceTag = ' <span style="color:#E65100;font-size:0.7rem;">🔥 HOT</span>';
      } else if (this.game.market.isCold(crop.id)) {
        priceTag = ' <span style="color:#1565C0;font-size:0.7rem;">❄️ LOW</span>';
      }

      item.innerHTML = `
        <div class="item-icon">${crop.icon}</div>
        <div class="item-name">${crop.name}${priceTag}</div>
        <div class="item-cost">🪙 ${crop.cost}</div>
        <div class="item-info">⏱️ ${Utils.formatTime(crop.growthTime)} | 💰 ${crop.sellPrice}</div>
        ${locked ? `<div class="item-level">Lvl ${crop.unlockLevel}</div>` : ''}
      `;
      if (!locked) {
        item.onclick = () => {
          this.game.selectCropToPlant(crop.id);
          this.close();
        };
      }
      grid.appendChild(item);
    });
    container.appendChild(grid);
  }

  renderTreesTab(container, level) {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    Object.values(TREES_DATA).forEach(tree => {
      const locked = tree.unlockLevel > level;
      const item = document.createElement('div');
      item.className = 'shop-item' + (locked ? ' locked' : '');
      item.innerHTML = `
        <div class="item-icon">${tree.icon}</div>
        <div class="item-name">${tree.name}</div>
        <div class="item-cost">🪙 ${tree.cost}</div>
        <div class="item-info">🍎 ${tree.fruitName} (${tree.fruitSellPrice}🪙)</div>
        ${locked ? `<div class="item-level">Lvl ${tree.unlockLevel}</div>` : ''}
      `;
      if (!locked) {
        item.onclick = () => {
          this.game.selectTreeToPlant(tree.id);
          this.close();
        };
      }
      grid.appendChild(item);
    });
    container.appendChild(grid);
  }

  renderAnimalsTab(container, level) {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    Object.values(ANIMALS_DATA).forEach(animal => {
      const locked = animal.unlockLevel > level;
      const item = document.createElement('div');
      item.className = 'shop-item' + (locked ? ' locked' : '');
      const productInfo = animal.product
        ? `${animal.productIcon} ${animal.productName} (${animal.productValue}🪙)`
        : '🐎 Decorative / Speed boost';
      item.innerHTML = `
        <div class="item-icon">${animal.icon}</div>
        <div class="item-name">${animal.name}</div>
        <div class="item-cost">🪙 ${animal.cost}</div>
        <div class="item-info">${productInfo}</div>
        ${locked ? `<div class="item-level">Lvl ${animal.unlockLevel}</div>` : ''}
      `;
      if (!locked) {
        item.onclick = () => {
          this.game.selectAnimalToBuy(animal.id);
          this.close();
        };
      }
      grid.appendChild(item);
    });
    container.appendChild(grid);
  }

  renderPensTab(container, level) {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    Object.values(ANIMAL_PENS_DATA).forEach(pen => {
      const locked = pen.unlockLevel > level;
      const item = document.createElement('div');
      item.className = 'shop-item' + (locked ? ' locked' : '');
      item.innerHTML = `
        <div class="item-icon">${pen.icon}</div>
        <div class="item-name">${pen.name}</div>
        <div class="item-cost">🪙 ${pen.cost}</div>
        <div class="item-info">Holds ${pen.capacity} animals</div>
        ${locked ? `<div class="item-level">Lvl ${pen.unlockLevel}</div>` : ''}
      `;
      if (!locked) {
        item.onclick = () => {
          this.game.selectBuildingToPlace('pen', pen.id);
          this.close();
        };
      }
      grid.appendChild(item);
    });
    container.appendChild(grid);
  }

  renderBuildingsTab(container, level) {
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    Object.values(BUILDINGS_DATA).forEach(bld => {
      const locked = bld.unlockLevel > level;
      const item = document.createElement('div');
      item.className = 'shop-item' + (locked ? ' locked' : '');
      const recipeNames = Object.values(bld.recipes).map(r => r.name).join(', ');
      item.innerHTML = `
        <div class="item-icon">${bld.icon}</div>
        <div class="item-name">${bld.name}</div>
        <div class="item-cost">🪙 ${bld.cost}</div>
        <div class="item-info">${recipeNames}</div>
        ${locked ? `<div class="item-level">Lvl ${bld.unlockLevel}</div>` : ''}
      `;
      if (!locked) {
        item.onclick = () => {
          this.game.selectBuildingToPlace('production', bld.id);
          this.close();
        };
      }
      grid.appendChild(item);
    });
    container.appendChild(grid);
  }

  renderDecorationsTab(container, level) {
    Object.entries(DECORATION_CATEGORIES).forEach(([catId, cat]) => {
      const catTitle = document.createElement('h3');
      catTitle.style.cssText = 'font-size: 0.9rem; margin: 12px 0 6px; color: #6D4C41;';
      catTitle.textContent = `${cat.icon} ${cat.name}`;
      container.appendChild(catTitle);

      const grid = document.createElement('div');
      grid.className = 'shop-grid';

      Object.values(DECORATIONS_DATA).filter(d => d.category === catId).forEach(deco => {
        const locked = deco.unlockLevel > level;
        const costIcon = deco.costType === 'gems' ? '💎' : '🪙';
        const item = document.createElement('div');
        item.className = 'shop-item' + (locked ? ' locked' : '');
        item.innerHTML = `
          <div class="item-icon">${deco.icon}</div>
          <div class="item-name">${deco.name}</div>
          <div class="item-cost">${costIcon} ${deco.cost}</div>
          ${locked ? `<div class="item-level">Lvl ${deco.unlockLevel}</div>` : ''}
        `;
        if (!locked) {
          item.onclick = () => {
            this.game.selectDecorationToPlace(deco.id);
            this.close();
          };
        }
        grid.appendChild(item);
      });
      container.appendChild(grid);
    });
  }

  renderExpansionTab(container, level) {
    const state = this.game.state.get();
    const purchased = state.farm.expansionsPurchased;

    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    LAND_EXPANSIONS.forEach(exp => {
      const bought = purchased.includes(exp.id);
      const locked = exp.unlockLevel > level;
      const item = document.createElement('div');
      item.className = 'shop-item' + (locked || bought ? ' locked' : '');
      item.innerHTML = `
        <div class="item-icon">🗺️</div>
        <div class="item-name">${exp.label}</div>
        <div class="item-cost">${bought ? '✅ Owned' : `🪙 ${exp.cost}`}</div>
        <div class="item-info">${exp.size.rows}x${exp.size.cols} tiles</div>
        ${locked && !bought ? `<div class="item-level">Lvl ${exp.unlockLevel}</div>` : ''}
      `;
      if (!locked && !bought) {
        item.onclick = () => {
          this.game.buyExpansion(exp);
          this.close();
        };
      }
      grid.appendChild(item);
    });
    container.appendChild(grid);
  }

  renderPetsTab(container) {
    if (typeof PETS_DATA === 'undefined') {
      container.innerHTML = '<p class="empty-state">Pets coming soon!</p>';
      return;
    }

    const state = this.game.state.get();
    const grid = document.createElement('div');
    grid.className = 'shop-grid';

    Object.entries(PETS_DATA).forEach(([id, pet]) => {
      const owned = state.pet && state.pet.typeId === id;
      const item = document.createElement('div');
      item.className = 'shop-item pet-card' + (owned ? ' locked' : '');
      item.innerHTML = `
        <div class="item-icon">${pet.icon}</div>
        <div class="item-name">${pet.name}</div>
        <div class="item-cost">${owned ? '✅ Adopted' : `🪙 ${pet.cost}`}</div>
        <div class="item-info">${pet.perk}</div>
      `;
      if (!owned && !state.pet) {
        item.onclick = () => {
          this.game.pet.adopt(id);
          this.open('shop');
        };
      }
      grid.appendChild(item);
    });
    container.appendChild(grid);
  }

  // ==================== INVENTORY ====================
  buildInventoryPanel() {
    const panel = this.createPanelFrame('Barn', '🏚️');
    const state = this.game.state.get();
    const inv = state.inventory;
    const totalItems = this.game.state.getTotalItems();

    const capBar = document.createElement('div');
    capBar.className = 'barn-capacity';
    const capPct = totalItems / inv.capacity;
    capBar.innerHTML = `
      <span>📦 ${totalItems}/${inv.capacity}</span>
      <div class="progress-bar" style="flex:1">
        <div class="fill" style="width:${capPct * 100}%; background:${capPct > 0.9 ? '#F44336' : capPct > 0.7 ? '#FF9800' : '#4CAF50'}"></div>
      </div>
    `;
    panel.body.appendChild(capBar);

    const actions = document.createElement('div');
    actions.className = 'inventory-actions';
    const sellAllBtn = document.createElement('button');
    sellAllBtn.className = 'btn btn-confirm btn-sm';
    sellAllBtn.textContent = '💰 Sell All';
    sellAllBtn.onclick = () => {
      this.game.sellAll();
      this.open('inventory');
    };
    actions.appendChild(sellAllBtn);

    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'btn btn-primary btn-sm';
    const upgradeCost = Math.floor(inv.capacity * 3);
    upgradeBtn.textContent = `📦 Expand (+10) 🪙${upgradeCost}`;
    upgradeBtn.onclick = () => {
      this.game.upgradeBarn(upgradeCost);
      this.open('inventory');
    };
    actions.appendChild(upgradeBtn);
    panel.body.appendChild(actions);

    const grid = document.createElement('div');
    grid.className = 'inventory-grid';

    const allItems = this.getAllItemInfo();
    if (allItems.length === 0) {
      grid.innerHTML = '<p class="empty-state">Your barn is empty! Harvest crops to fill it up.</p>';
    }

    allItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'inventory-item';
      el.innerHTML = `
        <div class="item-count">x${item.quantity}</div>
        <div class="item-icon">${item.icon}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-sell">Sell: 🪙${item.sellPrice}</div>
      `;
      el.onclick = () => {
        this.game.sellItem(item.id, 1);
        this.open('inventory');
      };
      el.oncontextmenu = (e) => {
        e.preventDefault();
        this.game.sellItem(item.id, item.quantity);
        this.open('inventory');
      };
      grid.appendChild(el);
    });

    panel.body.appendChild(grid);
    return panel;
  }

  getAllItemInfo() {
    const inv = this.game.state.get().inventory.items;
    const items = [];

    for (const [id, qty] of Object.entries(inv)) {
      if (qty <= 0) continue;
      let info = this.getItemInfo(id);
      if (info) {
        items.push({ ...info, id, quantity: qty });
      }
    }
    return items;
  }

  getItemInfo(id) {
    if (CROPS_DATA[id]) {
      const c = CROPS_DATA[id];
      return { name: c.name, icon: c.icon, sellPrice: c.sellPrice };
    }
    for (const t of Object.values(TREES_DATA)) {
      if (t.id === id || t.fruitName.toLowerCase().replace(/\s/g, '_') === id) {
        return { name: t.fruitName, icon: t.fruitIcon, sellPrice: t.fruitSellPrice };
      }
    }
    for (const a of Object.values(ANIMALS_DATA)) {
      if (a.product === id) {
        return { name: a.productName, icon: a.productIcon, sellPrice: a.productValue };
      }
    }
    for (const b of Object.values(BUILDINGS_DATA)) {
      for (const r of Object.values(b.recipes)) {
        if (r.id === id) {
          return { name: r.name, icon: r.icon, sellPrice: r.sellPrice };
        }
      }
    }
    return { name: id, icon: '📦', sellPrice: 1 };
  }

  // ==================== ORDERS ====================
  buildOrdersPanel() {
    const panel = this.createPanelFrame('Order Board', '📦');
    const state = this.game.state.get();

    // Tabs: Orders and Market
    const tabs = document.createElement('div');
    tabs.className = 'panel-tabs';
    const tabNames = [
      { id: 'orders', label: '📋 Orders' },
      { id: 'market', label: '📈 Market' }
    ];

    let activeTab = 'orders';
    const renderTab = (tabId) => {
      activeTab = tabId;
      tabs.querySelectorAll('.panel-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === tabId));
      panel.body.innerHTML = '';
      switch (tabId) {
        case 'orders': this.renderOrdersList(panel.body, state); break;
        case 'market': this.renderMarketPrices(panel.body, state); break;
      }
    };

    tabNames.forEach(t => {
      const tab = document.createElement('div');
      tab.className = 'panel-tab' + (t.id === activeTab ? ' active' : '');
      tab.textContent = t.label;
      tab.dataset.tab = t.id;
      tab.onclick = () => renderTab(t.id);
      tabs.appendChild(tab);
    });

    panel.insertBefore(tabs, panel.body);
    renderTab('orders');
    return panel;
  }

  renderOrdersList(container, state) {
    this.game.orders.ensureState();
    const orders = state.orders?.board || [];

    if (orders.length === 0) {
      container.innerHTML = '<p class="empty-state">No orders available right now. Check back soon!</p>';
      return;
    }

    orders.forEach((order, idx) => {
      const card = document.createElement('div');
      card.className = 'order-card';

      let itemsHtml = '';
      let canComplete = true;
      Object.entries(order.items).forEach(([itemId, needed]) => {
        const info = this.getItemInfo(itemId);
        const have = this.game.state.getItemCount(itemId);
        const fulfilled = have >= needed;
        if (!fulfilled) canComplete = false;
        itemsHtml += `
          <div class="order-item ${fulfilled ? 'fulfilled' : ''}">
            <span>${info.icon} ${info.name}</span>
            <span class="${fulfilled ? 'done' : 'needed'}">${have}/${needed}</span>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="order-header">
          <span class="order-npc">${order.npcIcon} ${order.npc}</span>
          <span class="order-tier ${order.difficulty}">${order.difficulty.toUpperCase()}</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-rewards">
          <span>🪙 ${order.coins}</span>
          <span>⭐ ${order.xp} XP</span>
        </div>
      `;

      if (canComplete) {
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-confirm btn-sm';
        completeBtn.style.marginTop = '8px';
        completeBtn.style.width = '100%';
        completeBtn.textContent = '📦 Deliver Order!';
        completeBtn.onclick = () => {
          this.game.orders.completeOrder(idx);
          this.open('orders');
        };
        card.appendChild(completeBtn);
      }

      container.appendChild(card);
    });
  }

  renderMarketPrices(container, state) {
    this.game.market.ensureState();
    const market = state.market;

    const info = document.createElement('div');
    info.style.cssText = 'padding: 8px; font-size: 0.85rem; color: #6D4C41; text-align:center; margin-bottom:8px;';
    info.textContent = 'Prices change daily! Sell hot items for bonus coins.';
    container.appendChild(info);

    // Hot items
    if (market.hotItems && market.hotItems.length > 0) {
      const hotSection = document.createElement('div');
      hotSection.innerHTML = '<h3 class="section-title">🔥 Hot Items (Price Up!)</h3>';
      const hotGrid = document.createElement('div');
      hotGrid.className = 'market-prices';
      market.hotItems.forEach(itemId => {
        const crop = CROPS_DATA[itemId];
        if (!crop) return;
        const mod = market.priceModifiers[itemId] || 1;
        const newPrice = Math.floor(crop.sellPrice * mod);
        const el = document.createElement('div');
        el.className = 'market-item hot';
        el.innerHTML = `
          <span>${crop.icon} ${crop.name}</span>
          <span class="price">🪙 ${newPrice} <small>(+${Math.round((mod - 1) * 100)}%)</small></span>
        `;
        hotGrid.appendChild(el);
      });
      hotSection.appendChild(hotGrid);
      container.appendChild(hotSection);
    }

    // Cold items
    if (market.coldItems && market.coldItems.length > 0) {
      const coldSection = document.createElement('div');
      coldSection.innerHTML = '<h3 class="section-title">❄️ Low Demand (Price Down)</h3>';
      const coldGrid = document.createElement('div');
      coldGrid.className = 'market-prices';
      market.coldItems.forEach(itemId => {
        const crop = CROPS_DATA[itemId];
        if (!crop) return;
        const mod = market.priceModifiers[itemId] || 1;
        const newPrice = Math.floor(crop.sellPrice * mod);
        const el = document.createElement('div');
        el.className = 'market-item cold';
        el.innerHTML = `
          <span>${crop.icon} ${crop.name}</span>
          <span class="price">🪙 ${newPrice} <small>(${Math.round((mod - 1) * 100)}%)</small></span>
        `;
        coldGrid.appendChild(el);
      });
      coldSection.appendChild(coldGrid);
      container.appendChild(coldSection);
    }
  }

  // ==================== ACHIEVEMENTS ====================
  buildAchievementsPanel() {
    const panel = this.createPanelFrame('Achievements', '🏆');
    const state = this.game.state.get();

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'panel-tabs';
    const tabNames = [
      { id: 'achievements', label: '🏆 Trophies' },
      { id: 'mastery', label: '🌾 Mastery' },
      { id: 'stats', label: '📊 Stats' }
    ];

    let activeTab = 'achievements';
    const renderTab = (tabId) => {
      activeTab = tabId;
      tabs.querySelectorAll('.panel-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === tabId));
      panel.body.innerHTML = '';
      switch (tabId) {
        case 'achievements': this.renderAchievementsList(panel.body, state); break;
        case 'mastery': this.renderMasteryList(panel.body, state); break;
        case 'stats': this.renderStatistics(panel.body, state); break;
      }
    };

    tabNames.forEach(t => {
      const tab = document.createElement('div');
      tab.className = 'panel-tab' + (t.id === activeTab ? ' active' : '');
      tab.textContent = t.label;
      tab.dataset.tab = t.id;
      tab.onclick = () => renderTab(t.id);
      tabs.appendChild(tab);
    });

    panel.insertBefore(tabs, panel.body);
    renderTab('achievements');
    return panel;
  }

  renderAchievementsList(container, state) {
    if (typeof ACHIEVEMENTS_DATA === 'undefined') {
      container.innerHTML = '<p class="empty-state">Achievements coming soon!</p>';
      return;
    }

    this.game.achievements.ensureState();
    const unlocked = state.achievements?.unlocked || [];
    const score = state.achievements?.score || 0;

    // Score header
    const scoreEl = document.createElement('div');
    scoreEl.className = 'score-header';
    scoreEl.innerHTML = `<span>🏆 Achievement Score</span><span>${score} pts</span>`;
    container.appendChild(scoreEl);

    const total = Object.keys(ACHIEVEMENTS_DATA).length;
    const progressInfo = document.createElement('div');
    progressInfo.style.cssText = 'text-align:center;font-size:0.8rem;color:#8D6E63;margin-bottom:12px;';
    progressInfo.textContent = `${unlocked.length}/${total} unlocked`;
    container.appendChild(progressInfo);

    // Achievement cards
    Object.entries(ACHIEVEMENTS_DATA).forEach(([id, ach]) => {
      const isUnlocked = unlocked.includes(id);
      const card = document.createElement('div');
      card.className = 'achievement-card' + (isUnlocked ? ' unlocked' : '');

      const stats = this.game.achievements.getStats();
      const currentVal = stats[ach.condition.stat] || 0;
      const progress = Math.min(1, currentVal / ach.condition.target);

      card.innerHTML = `
        <div class="ach-icon">${isUnlocked ? '🏆' : '🔒'}</div>
        <div class="ach-info">
          <div class="ach-title">${ach.title}</div>
          <div class="ach-desc">${ach.description}</div>
          ${!isUnlocked ? `
            <div class="progress-bar" style="height:6px;margin-top:4px;">
              <div class="fill" style="width:${progress * 100}%"></div>
            </div>
            <div style="font-size:0.7rem;color:#999;margin-top:2px;">${currentVal}/${ach.condition.target}</div>
          ` : ''}
        </div>
        <div class="ach-points">${ach.points}pts</div>
      `;
      container.appendChild(card);
    });
  }

  renderMasteryList(container, state) {
    if (typeof MASTERY_LEVELS === 'undefined') {
      container.innerHTML = '<p class="empty-state">Crop mastery coming soon!</p>';
      return;
    }

    this.game.mastery.ensureState();

    const info = document.createElement('div');
    info.style.cssText = 'padding: 8px; font-size: 0.85rem; color: #6D4C41; text-align:center; margin-bottom:8px;';
    info.textContent = 'Harvest crops repeatedly to earn mastery bonuses!';
    container.appendChild(info);

    Object.entries(CROPS_DATA).forEach(([cropId, crop]) => {
      const m = this.game.mastery.getCropMastery(cropId);
      const card = document.createElement('div');
      card.className = 'mastery-card';

      let progressHtml = '';
      if (m.nextLevel) {
        const progress = m.harvests / m.nextLevel.harvests;
        progressHtml = `
          <div class="progress-bar" style="height:6px;margin-top:4px;">
            <div class="fill" style="width:${Math.min(progress * 100, 100)}%"></div>
          </div>
          <div style="font-size:0.7rem;color:#999;">${m.harvests}/${m.nextLevel.harvests} to ${m.nextLevel.label}</div>
        `;
      } else if (m.level.level !== 'none') {
        progressHtml = '<div style="font-size:0.7rem;color:#FFD700;">MAX LEVEL!</div>';
      }

      let bonusHtml = '';
      if (m.level.bonus) {
        const b = m.level.bonus;
        if (b.sellBonus) bonusHtml += `<span>💰+${Math.round(b.sellBonus * 100)}%</span> `;
        if (b.timeReduction) bonusHtml += `<span>⏱️-${Math.round(b.timeReduction * 100)}%</span> `;
        if (b.doubleChance) bonusHtml += `<span>🎲${Math.round(b.doubleChance * 100)}% x2</span>`;
      }

      card.innerHTML = `
        <div class="mastery-icon">${crop.icon}</div>
        <div class="mastery-info">
          <div class="mastery-title">${crop.name}</div>
          <div class="mastery-level">${m.level.icon || '⬜'} ${m.level.label}</div>
          ${bonusHtml ? `<div class="mastery-bonuses">${bonusHtml}</div>` : ''}
          ${progressHtml}
        </div>
        <div class="mastery-harvests">${m.harvests} harvested</div>
      `;
      container.appendChild(card);
    });
  }

  renderStatistics(container, state) {
    const st = state.statistics;
    const stats = [
      { label: '🌾 Crops Planted', value: st.cropsPlanted || 0 },
      { label: '🌻 Crops Harvested', value: st.cropsHarvested || 0 },
      { label: '🌳 Trees Planted', value: st.treesPlanted || 0 },
      { label: '🐔 Animals Fed', value: st.animalsFed || 0 },
      { label: '🥚 Products Collected', value: st.productsCollected || 0 },
      { label: '🏗️ Buildings Built', value: st.buildingsBuilt || 0 },
      { label: '💰 Items Sold', value: st.itemsSold || 0 },
      { label: '🏭 Items Produced', value: st.itemsProduced || 0 },
      { label: '📜 Quests Completed', value: st.questsCompleted || 0 },
      { label: '📦 Orders Completed', value: st.ordersCompleted || 0 },
      { label: '🗺️ Expansions Bought', value: st.expansionsBought || 0 },
      { label: '🌸 Decorations Placed', value: st.decorationsPlaced || 0 },
      { label: '💎 Total Coins Earned', value: state.player.totalCoinsEarned || 0 },
      { label: '⭐ Player Level', value: state.player.level },
    ];

    const grid = document.createElement('div');
    grid.className = 'stats-grid';

    stats.forEach(s => {
      const item = document.createElement('div');
      item.className = 'stat-item';
      item.innerHTML = `<span class="stat-label">${s.label}</span><span class="stat-value">${Utils.formatNumber(s.value)}</span>`;
      grid.appendChild(item);
    });

    container.appendChild(grid);
  }

  // ==================== DAILY LOGIN ====================
  buildDailyLoginPanel() {
    const panel = this.createPanelFrame('Daily Rewards', '📅');

    if (typeof LOGIN_REWARDS === 'undefined') {
      panel.body.innerHTML = '<p class="empty-state">Daily rewards coming soon!</p>';
      return panel;
    }

    this.game.loginRewards.ensureState();
    const state = this.game.state.get();
    const lr = state.loginRewards;
    const today = new Date().toDateString();
    const canClaim = lr.lastClaimDate !== today;

    // Streak badge
    if (lr.streak > 1) {
      const streak = document.createElement('div');
      streak.className = 'streak-badge';
      streak.innerHTML = `🔥 ${lr.streak} Day Streak!${lr.streak >= 7 ? ' <small>(1.5x bonus!)</small>' : ''}`;
      panel.body.appendChild(streak);
    }

    // Calendar grid
    const calendar = document.createElement('div');
    calendar.className = 'login-calendar';

    LOGIN_REWARDS.forEach((reward, idx) => {
      const dayNum = idx + 1;
      const claimed = lr.claimedDays.includes(dayNum);
      const isToday = dayNum === lr.currentDay + 1 && canClaim;

      const day = document.createElement('div');
      day.className = 'login-day' + (claimed ? ' claimed' : '') + (isToday ? ' today' : '');
      day.innerHTML = `
        <div class="day-num">Day ${dayNum}</div>
        <div class="day-icon">${reward.icon}</div>
        <div class="day-reward">${reward.label}</div>
        ${claimed ? '<div class="day-check">✅</div>' : ''}
      `;

      if (isToday && canClaim) {
        day.onclick = () => {
          this.game.loginRewards.claim();
          this.open('daily_login');
        };
      }

      calendar.appendChild(day);
    });

    panel.body.appendChild(calendar);
    return panel;
  }

  // ==================== COLLECTIONS ====================
  buildCollectionsPanel() {
    const panel = this.createPanelFrame('Collections', '📚');

    if (typeof COLLECTIONS_DATA === 'undefined') {
      panel.body.innerHTML = '<p class="empty-state">Collections coming soon!</p>';
      return panel;
    }

    this.game.collections.ensureState();
    const state = this.game.state.get();

    Object.entries(COLLECTIONS_DATA).forEach(([catId, cat]) => {
      const found = state.collections?.[catId] || [];
      const isComplete = found.length >= cat.items.length;

      const category = document.createElement('div');
      category.className = 'collection-category' + (isComplete ? ' complete' : '');

      category.innerHTML = `
        <h3 class="section-title">${cat.icon} ${cat.name} (${found.length}/${cat.items.length})${isComplete ? ' ✅' : ''}</h3>
      `;

      const itemsGrid = document.createElement('div');
      itemsGrid.className = 'collection-items';

      cat.items.forEach(item => {
        const discovered = found.includes(item.id);
        const el = document.createElement('div');
        el.className = 'collection-item' + (discovered ? ' found' : '');
        el.innerHTML = `
          <div class="coll-icon">${discovered ? item.icon : '❓'}</div>
          <div class="coll-name">${discovered ? item.name : '???'}</div>
          ${discovered ? `<div class="coll-rarity">${item.rarity}</div>` : ''}
        `;
        itemsGrid.appendChild(el);
      });

      category.appendChild(itemsGrid);

      if (isComplete) {
        const prizeEl = document.createElement('div');
        prizeEl.style.cssText = 'text-align:center;font-size:0.8rem;color:#4CAF50;font-weight:700;padding:4px;';
        prizeEl.textContent = `Grand Prize: 🪙${cat.grandPrize.coins || 0} + 💎${cat.grandPrize.gems || 0}`;
        category.appendChild(prizeEl);
      }

      panel.body.appendChild(category);
    });

    return panel;
  }

  // ==================== MASTERY (standalone) ====================
  buildMasteryPanel() {
    const panel = this.createPanelFrame('Crop Mastery', '🌾');
    const state = this.game.state.get();
    this.renderMasteryList(panel.body, state);
    return panel;
  }

  // ==================== PET ====================
  buildPetPanel() {
    const panel = this.createPanelFrame('Pet Companion', '🐕');

    if (typeof PETS_DATA === 'undefined') {
      panel.body.innerHTML = '<p class="empty-state">Pets coming soon!</p>';
      return panel;
    }

    const state = this.game.state.get();
    this.game.pet.ensureState();

    if (state.pet) {
      const petData = PETS_DATA[state.pet.typeId];
      if (petData) {
        panel.body.innerHTML = `
          <div style="text-align:center;padding:16px;">
            <div style="font-size:4rem;">${petData.icon}</div>
            <h3 style="margin:8px 0;">${state.pet.name}</h3>
            <p style="color:#6D4C41;font-size:0.85rem;">${petData.perk}</p>
            <p style="color:#999;font-size:0.8rem;">Finds coins for you every few minutes!</p>
          </div>
        `;
      }
    } else {
      panel.body.innerHTML = '<p class="empty-state">Visit the Shop > Pets tab to adopt a pet!</p>';
    }

    return panel;
  }

  // ==================== MARKET ====================
  buildMarketPanel() {
    const panel = this.createPanelFrame('Market Prices', '📈');
    const state = this.game.state.get();
    this.renderMarketPrices(panel.body, state);
    return panel;
  }

  // ==================== QUESTS ====================
  buildQuestPanel() {
    const panel = this.createPanelFrame('Quests', '📜');
    const state = this.game.state.get();

    const tabs = document.createElement('div');
    tabs.className = 'panel-tabs';
    const tabNames = [
      { id: 'active', label: '📋 Active' },
      { id: 'daily', label: '🔄 Daily' },
      { id: 'completed', label: '✅ Done' }
    ];

    let activeTab = 'active';
    const renderTab = (tabId) => {
      activeTab = tabId;
      tabs.querySelectorAll('.panel-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === tabId));
      panel.body.innerHTML = '';
      switch (tabId) {
        case 'active': this.renderActiveQuests(panel.body, state); break;
        case 'daily': this.renderDailyQuests(panel.body, state); break;
        case 'completed': this.renderCompletedQuests(panel.body, state); break;
      }
    };

    tabNames.forEach(t => {
      const tab = document.createElement('div');
      tab.className = 'panel-tab' + (t.id === activeTab ? ' active' : '');
      tab.textContent = t.label;
      tab.dataset.tab = t.id;
      tab.onclick = () => renderTab(t.id);
      tabs.appendChild(tab);
    });

    panel.insertBefore(tabs, panel.body);
    renderTab('active');
    return panel;
  }

  renderActiveQuests(container, state) {
    const list = document.createElement('div');
    list.className = 'quest-list';
    const activeQuests = state.quests.active;

    const questEntries = Object.keys(activeQuests);
    if (questEntries.length === 0) {
      list.innerHTML = '<p class="empty-state">No active quests. Keep leveling up!</p>';
      container.appendChild(list);
      return;
    }

    questEntries.forEach(qId => {
      const questData = QUESTS_DATA[qId];
      if (!questData) return;
      const progress = activeQuests[qId].progress || {};
      const isComplete = this.game.isQuestComplete(qId);

      const el = document.createElement('div');
      el.className = 'quest-item' + (isComplete ? ' completed' : '');

      let objectivesHtml = '';
      questData.objectives.forEach((obj, idx) => {
        const current = progress[idx] || 0;
        const done = current >= obj.count;
        objectivesHtml += `
          <div class="quest-objective ${done ? 'done' : ''}">
            <div class="check">${done ? '✓' : ''}</div>
            <span>${obj.label}</span>
            <span class="progress-text">${current}/${obj.count}</span>
          </div>
        `;
      });

      el.innerHTML = `
        <div class="quest-header">
          <span class="quest-title">${questData.title}</span>
          <span class="quest-npc">— ${questData.npc}</span>
        </div>
        <div class="quest-dialogue">"${questData.dialogue}"</div>
        <div class="quest-objectives">${objectivesHtml}</div>
        <div class="quest-rewards">
          ${questData.rewards.coins ? `<span>🪙 ${questData.rewards.coins}</span>` : ''}
          ${questData.rewards.xp ? `<span>⭐ ${questData.rewards.xp} XP</span>` : ''}
          ${questData.rewards.gems ? `<span>💎 ${questData.rewards.gems}</span>` : ''}
        </div>
      `;

      if (isComplete) {
        const claimBtn = document.createElement('button');
        claimBtn.className = 'btn btn-confirm btn-sm';
        claimBtn.style.marginTop = '8px';
        claimBtn.textContent = '🎁 Claim Reward';
        claimBtn.onclick = () => {
          this.game.claimQuestReward(qId);
          this.open('quests');
        };
        el.appendChild(claimBtn);
      }

      list.appendChild(el);
    });

    container.appendChild(list);
  }

  renderDailyQuests(container, state) {
    const list = document.createElement('div');
    list.className = 'quest-list';

    if (!state.quests.dailyQuests || state.quests.dailyQuests.length === 0) {
      list.innerHTML = '<p class="empty-state">Daily quests refresh each day!</p>';
      container.appendChild(list);
      return;
    }

    state.quests.dailyQuests.forEach(dq => {
      const isComplete = dq.objectives.every((obj, idx) => (dq.progress[idx] || 0) >= obj.count);
      const el = document.createElement('div');
      el.className = 'quest-item' + (isComplete ? ' completed' : '');

      let objectivesHtml = '';
      dq.objectives.forEach((obj, idx) => {
        const current = dq.progress[idx] || 0;
        const done = current >= obj.count;
        objectivesHtml += `
          <div class="quest-objective ${done ? 'done' : ''}">
            <div class="check">${done ? '✓' : ''}</div>
            <span>${obj.label}</span>
            <span class="progress-text">${current}/${obj.count}</span>
          </div>
        `;
      });

      el.innerHTML = `
        <div class="quest-header"><span class="quest-title">${dq.title}</span></div>
        <div class="quest-objectives">${objectivesHtml}</div>
        <div class="quest-rewards">
          ${dq.rewards.coins ? `<span>🪙 ${dq.rewards.coins}</span>` : ''}
          ${dq.rewards.xp ? `<span>⭐ ${dq.rewards.xp} XP</span>` : ''}
        </div>
      `;

      if (isComplete && !dq.claimed) {
        const claimBtn = document.createElement('button');
        claimBtn.className = 'btn btn-confirm btn-sm';
        claimBtn.style.marginTop = '8px';
        claimBtn.textContent = '🎁 Claim';
        claimBtn.onclick = () => {
          this.game.claimDailyQuestReward(dq);
          this.open('quests');
        };
        el.appendChild(claimBtn);
      }

      list.appendChild(el);
    });

    container.appendChild(list);
  }

  renderCompletedQuests(container, state) {
    const list = document.createElement('div');
    list.className = 'quest-list';
    const completed = state.quests.completed;

    if (completed.length === 0) {
      list.innerHTML = '<p class="empty-state">Complete quests to see them here!</p>';
    } else {
      completed.forEach(qId => {
        const questData = QUESTS_DATA[qId];
        if (!questData) return;
        const el = document.createElement('div');
        el.className = 'quest-item completed';
        el.innerHTML = `
          <div class="quest-header">
            <span class="quest-title">✅ ${questData.title}</span>
            <span class="quest-npc">— ${questData.npc || 'Daily'}</span>
          </div>
        `;
        list.appendChild(el);
      });
    }
    container.appendChild(list);
  }

  // ==================== SETTINGS ====================
  buildSettingsPanel() {
    const panel = this.createPanelFrame('Settings', '⚙️');
    const state = this.game.state.get();
    const settings = state.settings;

    panel.body.innerHTML = `
      <div style="padding: 8px;">
        <div style="margin-bottom: 16px;">
          <label style="font-weight:700; font-size:0.9rem;">🎵 Music</label>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
            <button id="settings-music-toggle" class="btn btn-sm ${settings.musicEnabled ? 'btn-confirm' : 'btn-danger'}">${settings.musicEnabled ? 'ON' : 'OFF'}</button>
            <input type="range" id="settings-music-vol" min="0" max="100" value="${settings.musicVolume * 100}" style="flex:1">
          </div>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="font-weight:700; font-size:0.9rem;">🔊 Sound Effects</label>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
            <button id="settings-sfx-toggle" class="btn btn-sm ${settings.sfxEnabled ? 'btn-confirm' : 'btn-danger'}">${settings.sfxEnabled ? 'ON' : 'OFF'}</button>
            <input type="range" id="settings-sfx-vol" min="0" max="100" value="${settings.sfxVolume * 100}" style="flex:1">
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #E0E0E0;margin:16px 0;">
        <div style="margin-bottom: 16px;">
          <label style="font-weight:700; font-size:0.9rem;">👤 Player Name</label>
          <input type="text" id="settings-name" value="${state.player.name}" maxlength="20" style="display:block;width:100%;margin-top:4px;padding:8px;border:2px solid #CCC;border-radius:8px;font-size:0.9rem;font-family:inherit;">
        </div>
        <div style="display:flex; gap:8px;">
          <button id="settings-save" class="btn btn-confirm" style="flex:1">💾 Save Settings</button>
        </div>
        <hr style="border:none;border-top:1px solid #E0E0E0;margin:16px 0;">
        <div style="text-align:center;">
          <button id="settings-reset" class="btn btn-danger btn-sm">🗑️ Reset Game (Delete Save)</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      document.getElementById('settings-music-toggle')?.addEventListener('click', () => {
        const on = Audio.toggleMusic();
        state.settings.musicEnabled = on;
        this.open('settings');
      });
      document.getElementById('settings-sfx-toggle')?.addEventListener('click', () => {
        const on = Audio.toggleSfx();
        state.settings.sfxEnabled = on;
        this.open('settings');
      });
      document.getElementById('settings-music-vol')?.addEventListener('input', (e) => {
        const v = e.target.value / 100;
        Audio.setMusicVolume(v);
        state.settings.musicVolume = v;
      });
      document.getElementById('settings-sfx-vol')?.addEventListener('input', (e) => {
        const v = e.target.value / 100;
        Audio.setSfxVolume(v);
        state.settings.sfxVolume = v;
      });
      document.getElementById('settings-save')?.addEventListener('click', () => {
        const name = document.getElementById('settings-name')?.value?.trim();
        if (name) state.player.name = name;
        this.game.state.save();
        this.game.notify.toast('Settings saved!', 'reward');
        this.close();
      });
      document.getElementById('settings-reset')?.addEventListener('click', () => {
        if (confirm('Are you sure? This will delete ALL your progress!')) {
          this.game.state.deleteSave();
          location.reload();
        }
      });
    }, 50);

    return panel;
  }

  // ==================== AVATAR ====================
  buildAvatarPanel() {
    const panel = this.createPanelFrame('Avatar', '👤');
    const state = this.game.state.get();
    const avatar = state.player.avatar;

    const bodies = ['👨‍🌾', '👩‍🌾', '🧑‍🌾', '👦', '👧', '🧔', '👱‍♀️', '👴', '👵'];
    const skinColors = ['#FFDAB9', '#F4C2A1', '#D4A574', '#C68642', '#8D5524', '#5C3A1E'];

    panel.body.innerHTML = `
      <div style="padding:8px; text-align:center;">
        <div class="avatar-preview" id="avatar-preview">${avatar.body}</div>
        <h3 style="font-size:0.9rem; margin-bottom:8px;">Choose Your Farmer</h3>
        <div class="avatar-options" id="avatar-bodies"></div>
        <h3 style="font-size:0.9rem; margin: 12px 0 8px;">Skin Color</h3>
        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-bottom:16px;" id="avatar-colors"></div>
        <button class="btn btn-confirm" id="avatar-save">✅ Save Avatar</button>
      </div>
    `;

    setTimeout(() => {
      const bodiesEl = document.getElementById('avatar-bodies');
      bodies.forEach(b => {
        const opt = document.createElement('div');
        opt.className = 'avatar-option' + (avatar.body === b ? ' selected' : '');
        opt.textContent = b;
        opt.onclick = () => {
          avatar.body = b;
          document.getElementById('avatar-preview').textContent = b;
          bodiesEl.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        };
        bodiesEl.appendChild(opt);
      });

      const colorsEl = document.getElementById('avatar-colors');
      skinColors.forEach(c => {
        const opt = document.createElement('div');
        opt.className = 'color-option' + (avatar.skinColor === c ? ' selected' : '');
        opt.style.background = c;
        opt.onclick = () => {
          avatar.skinColor = c;
          colorsEl.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        };
        colorsEl.appendChild(opt);
      });

      document.getElementById('avatar-save')?.addEventListener('click', () => {
        this.game.state.save();
        this.game.updateHUD();
        this.game.notify.toast('Avatar updated!', 'reward');
        this.close();
      });
    }, 50);

    return panel;
  }

  // ==================== BUILDING PRODUCTION ====================
  buildBuildingPanel(data) {
    const building = data.building;
    const bldData = BUILDINGS_DATA[building.typeId];
    if (!bldData) return null;

    const panel = this.createPanelFrame(bldData.name, bldData.icon);
    const state = this.game.state.get();

    for (let i = 0; i < (building.slots || 1); i++) {
      const slot = document.createElement('div');
      slot.className = 'production-slot';

      const production = building.production?.[i];
      if (production && production.recipeId) {
        const recipe = bldData.recipes[production.recipeId];
        const elapsed = Utils.now() - production.startedAt;
        const remaining = Math.max(0, recipe.productionTime - elapsed);
        const progress = 1 - (remaining / recipe.productionTime);

        if (remaining <= 0) {
          slot.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:1.5rem;">${recipe.icon}</span>
              <div>
                <div style="font-weight:700;">${recipe.name}</div>
                <div style="color:#4CAF50;font-weight:700;">Ready to collect!</div>
              </div>
            </div>
          `;
          const collectBtn = document.createElement('button');
          collectBtn.className = 'btn btn-confirm btn-sm';
          collectBtn.style.marginTop = '8px';
          collectBtn.textContent = '📦 Collect';
          collectBtn.onclick = () => {
            this.game.collectProduction(building, i);
            this.open('building', data);
          };
          slot.appendChild(collectBtn);
        } else {
          slot.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:1.5rem;">${recipe.icon}</span>
              <div style="flex:1;">
                <div style="font-weight:700;">${recipe.name}</div>
                <div style="font-size:0.8rem;color:#FF8F00;">⏱️ ${Utils.formatTime(remaining)}</div>
                <div class="progress-bar"><div class="fill" style="width:${progress * 100}%"></div></div>
              </div>
            </div>
          `;
        }
        slot.classList.add('active');
      } else {
        slot.innerHTML = `<div style="text-align:center;color:#999;font-size:0.85rem;">Empty slot — select a recipe below</div>`;

        const recipes = document.createElement('div');
        recipes.className = 'recipe-selector';

        Object.values(bldData.recipes).forEach(recipe => {
          const canProduce = Object.entries(recipe.ingredients).every(
            ([item, qty]) => this.game.state.hasItem(item, qty)
          );
          const rEl = document.createElement('div');
          rEl.className = 'recipe-item' + (canProduce ? '' : ' disabled');
          const ingText = Object.entries(recipe.ingredients)
            .map(([item, qty]) => {
              const info = this.getItemInfo(item);
              return `${info.icon}x${qty}`;
            }).join(' ');
          rEl.innerHTML = `
            <div class="recipe-icon">${recipe.icon}</div>
            <div class="recipe-name">${recipe.name}</div>
            <div class="recipe-ingredients">${ingText}</div>
            <div style="font-size:0.6rem;color:#4CAF50;">💰 ${recipe.sellPrice} | ⏱️ ${Utils.formatTime(recipe.productionTime)}</div>
          `;
          if (canProduce) {
            rEl.onclick = () => {
              this.game.startProduction(building, i, recipe.id);
              this.open('building', data);
            };
          }
          recipes.appendChild(rEl);
        });
        slot.appendChild(recipes);
      }

      panel.body.appendChild(slot);
    }

    return panel;
  }

  // ==================== ANIMAL PEN ====================
  buildAnimalPenPanel(data) {
    const pen = data.pen;
    const penData = ANIMAL_PENS_DATA[pen.typeId];
    if (!penData) return null;

    const panel = this.createPanelFrame(penData.name, penData.icon);
    const state = this.game.state.get();
    const animals = state.animals.filter(a => a.penId === pen.id);

    panel.body.innerHTML = `
      <div style="margin-bottom:8px;font-size:0.85rem;color:#6D4C41;">
        Animals: ${animals.length}/${penData.capacity} | Accepts: ${penData.acceptsAnimals.map(a => ANIMALS_DATA[a]?.icon || a).join(' ')}
      </div>
    `;

    animals.forEach(animal => {
      const aData = ANIMALS_DATA[animal.typeId];
      if (!aData) return;

      const el = document.createElement('div');
      el.className = 'production-slot';

      let statusHtml = '';
      if (animal.productReady) {
        statusHtml = `<div style="color:#4CAF50;font-weight:700;">🎁 ${aData.productName} ready!</div>`;
      } else if (animal.fed) {
        const elapsed = Utils.now() - animal.fedAt;
        const remaining = Math.max(0, aData.productionTime - elapsed);
        const progress = 1 - (remaining / aData.productionTime);
        statusHtml = `
          <div style="font-size:0.8rem;color:#FF8F00;">⏱️ ${Utils.formatTime(remaining)}</div>
          <div class="progress-bar"><div class="fill" style="width:${progress * 100}%"></div></div>
        `;
      } else {
        const feedReqs = Object.entries(aData.feedRequired)
          .map(([item, qty]) => `${CROPS_DATA[item]?.icon || item}x${qty}`)
          .join(' ');
        statusHtml = `<div style="color:#FF9800;font-size:0.8rem;">🍽️ Hungry! Needs: ${feedReqs}</div>`;
      }

      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:2rem;">${aData.icon}</span>
          <div style="flex:1;">
            <div style="font-weight:700;">${aData.name}</div>
            ${statusHtml}
          </div>
        </div>
      `;

      const btnContainer = document.createElement('div');
      btnContainer.style.cssText = 'display:flex;gap:6px;margin-top:8px;';

      if (animal.productReady && aData.product) {
        const collectBtn = document.createElement('button');
        collectBtn.className = 'btn btn-confirm btn-sm';
        collectBtn.textContent = `📦 Collect ${aData.productName}`;
        collectBtn.onclick = () => {
          this.game.collectAnimalProduct(animal);
          this.open('animal_pen', data);
        };
        btnContainer.appendChild(collectBtn);
      }

      if (!animal.fed && !animal.productReady) {
        const canFeed = Object.entries(aData.feedRequired).every(
          ([item, qty]) => this.game.state.hasItem(item, qty)
        );
        const feedBtn = document.createElement('button');
        feedBtn.className = 'btn btn-primary btn-sm';
        feedBtn.textContent = '🍽️ Feed';
        feedBtn.disabled = !canFeed;
        feedBtn.onclick = () => {
          this.game.feedAnimal(animal);
          this.open('animal_pen', data);
        };
        btnContainer.appendChild(feedBtn);
      }

      el.appendChild(btnContainer);
      panel.body.appendChild(el);
    });

    if (animals.length < penData.capacity) {
      const addInfo = document.createElement('div');
      addInfo.style.cssText = 'text-align:center;padding:12px;color:#999;font-size:0.85rem;';
      addInfo.textContent = `${penData.capacity - animals.length} slot(s) available. Buy animals from the Shop!`;
      panel.body.appendChild(addInfo);
    }

    return panel;
  }

  // ==================== CONFIRM DIALOG ====================
  buildConfirmPanel(data) {
    const panel = this.createPanelFrame(data.title || 'Confirm', '');
    panel.body.innerHTML = `
      <div class="confirm-dialog">
        <div class="icon">${data.icon || '❓'}</div>
        <h3>${data.message}</h3>
        <p>${data.detail || ''}</p>
        <div class="buttons">
          <button class="btn btn-danger" id="confirm-cancel">Cancel</button>
          <button class="btn btn-confirm" id="confirm-ok">${data.confirmText || 'Confirm'}</button>
        </div>
      </div>
    `;
    setTimeout(() => {
      document.getElementById('confirm-cancel')?.addEventListener('click', () => this.close());
      document.getElementById('confirm-ok')?.addEventListener('click', () => {
        this.close();
        if (data.onConfirm) data.onConfirm();
      });
    }, 50);
    return panel;
  }

  // ==================== WELCOME BACK ====================
  buildWelcomeBackPanel(data) {
    const panel = this.createPanelFrame('Welcome Back!', '🌅');
    let html = '<div class="welcome-back"><h3>While you were away...</h3>';

    if (data.cropsReady > 0) {
      html += `<div class="summary-item"><span>🌾 Crops Ready</span><span>${data.cropsReady}</span></div>`;
    }
    if (data.cropsWithered > 0) {
      html += `<div class="summary-item"><span>🥀 Crops Withered</span><span>${data.cropsWithered}</span></div>`;
    }
    if (data.productsReady > 0) {
      html += `<div class="summary-item"><span>🥚 Products Ready</span><span>${data.productsReady}</span></div>`;
    }
    if (data.treeFruitsReady > 0) {
      html += `<div class="summary-item"><span>🍎 Fruits Ready</span><span>${data.treeFruitsReady}</span></div>`;
    }
    if (data.energyGained > 0) {
      html += `<div class="summary-item"><span>⚡ Energy Restored</span><span>+${data.energyGained}</span></div>`;
    }

    html += `<button class="btn btn-confirm" style="margin-top:16px;" onclick="game.panels.close()">Let's Farm! 🌱</button></div>`;
    panel.body.innerHTML = html;
    return panel;
  }

  // ==================== GUILD PANEL ====================
  buildGuildPanel() {
    const panel = this.createPanelFrame('Guild', '🏰');
    const guild = this.game.guild.ensureState();

    if (!guild.joined) {
      // Show create/join screen
      let html = '<div class="guild-welcome">';
      html += '<h3>Join a Guild!</h3>';
      html += '<p>Team up with other farmers for bonuses, raids, and rewards!</p>';

      // Create guild section
      html += '<div class="guild-create-section">';
      html += '<h4>Create New Guild (500 coins)</h4>';
      html += '<input type="text" id="guild-name-input" placeholder="Guild Name" maxlength="20" class="guild-input">';
      html += '<input type="text" id="guild-motto-input" placeholder="Guild Motto" maxlength="40" class="guild-input">';
      html += '<button class="btn btn-primary guild-create-btn" onclick="';
      html += "const name=document.getElementById('guild-name-input').value.trim();";
      html += "const motto=document.getElementById('guild-motto-input').value.trim();";
      html += "if(!name){game.notify.warn('Enter a guild name!');return;}";
      html += "const r=game.guild.createGuild(name,'🏰',motto);";
      html += "game.notify.toast(r.message,r.success?'reward':'error');";
      html += "if(r.success)game.panels.open('guild');";
      html += '">Create Guild 🏰</button>';
      html += '</div>';

      // Join existing guilds
      html += '<div class="guild-join-section"><h4>Or Join an Existing Guild</h4>';
      GUILD_TEMPLATES.forEach((template, idx) => {
        html += `<div class="guild-template" onclick="
          const r=game.guild.joinGuild(${idx});
          game.notify.toast(r.message,r.success?'reward':'error');
          if(r.success)game.panels.open('guild');
        ">`;
        html += `<div class="guild-template-header">`;
        html += `<span class="guild-template-icon">${template.icon}</span>`;
        html += `<span class="guild-template-name">${template.name}</span>`;
        html += `<span class="guild-template-level">Lv.${template.level}</span>`;
        html += `</div>`;
        html += `<div class="guild-template-motto">"${template.motto}"</div>`;
        html += `<div class="guild-template-members">${template.memberIds.length} members</div>`;
        html += `</div>`;
      });
      html += '</div></div>';

      panel.body.innerHTML = html;
      return panel;
    }

    // Guild is joined - show tabs
    const tabs = document.createElement('div');
    tabs.className = 'panel-tabs';
    const tabNames = [
      { id: 'info', label: '🏰 Info' },
      { id: 'members', label: '👥 Members' },
      { id: 'chat', label: '💬 Chat' },
      { id: 'perks', label: '⭐ Perks' },
      { id: 'raid', label: '⚔️ Raid' },
      { id: 'shop', label: '🛒 Shop' }
    ];

    let activeTab = 'info';
    const renderTab = (tabId) => {
      activeTab = tabId;
      tabs.querySelectorAll('.panel-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === tabId)
      );
      panel.body.innerHTML = '';
      switch (tabId) {
        case 'info': this.renderGuildInfoTab(panel.body); break;
        case 'members': this.renderGuildMembersTab(panel.body); break;
        case 'chat': this.renderGuildChatTab(panel.body); break;
        case 'perks': this.renderGuildPerksTab(panel.body); break;
        case 'raid': this.renderGuildRaidTab(panel.body); break;
        case 'shop': this.renderGuildShopTab(panel.body); break;
      }
    };

    tabNames.forEach(t => {
      const tab = document.createElement('div');
      tab.className = 'panel-tab' + (t.id === activeTab ? ' active' : '');
      tab.textContent = t.label;
      tab.dataset.tab = t.id;
      tab.onclick = () => renderTab(t.id);
      tabs.appendChild(tab);
    });

    panel.insertBefore(tabs, panel.body);
    renderTab('info');
    return panel;
  }

  renderGuildInfoTab(container) {
    const guild = this.game.guild.ensureState();
    const xpNeeded = GUILD_LEVEL_XP[guild.level] || 999999;
    const xpPct = Math.min(100, Math.floor((guild.xp / xpNeeded) * 100));

    let html = '<div class="guild-info">';
    html += `<div class="guild-header-big">`;
    html += `<span class="guild-icon-big">${guild.icon}</span>`;
    html += `<div><h3>${guild.name}</h3><p class="guild-motto">"${guild.motto}"</p></div>`;
    html += `</div>`;

    html += `<div class="guild-stats-grid">`;
    html += `<div class="guild-stat"><span class="guild-stat-label">Level</span><span class="guild-stat-value">${guild.level}</span></div>`;
    html += `<div class="guild-stat"><span class="guild-stat-label">Members</span><span class="guild-stat-value">${guild.members.length + 1}</span></div>`;
    html += `<div class="guild-stat"><span class="guild-stat-label">Medals</span><span class="guild-stat-value">🎖️ ${Utils.formatNumber(guild.medals)}</span></div>`;
    html += `<div class="guild-stat"><span class="guild-stat-label">Donated</span><span class="guild-stat-value">🪙 ${Utils.formatNumber(guild.totalDonated)}</span></div>`;
    html += `</div>`;

    html += `<div class="guild-xp-section">`;
    html += `<div class="guild-xp-label">Guild XP: ${Utils.formatNumber(guild.xp)} / ${Utils.formatNumber(xpNeeded)}</div>`;
    html += `<div class="guild-xp-bar"><div class="guild-xp-fill" style="width:${xpPct}%"></div></div>`;
    html += `</div>`;

    // Donate section
    html += `<div class="guild-donate-section">`;
    html += `<h4>💰 Donate Coins</h4>`;
    const amounts = [100, 500, 1000, 5000];
    html += `<div class="donate-buttons">`;
    amounts.forEach(amt => {
      html += `<button class="btn btn-donate" onclick="
        const r=game.guild.donate(${amt});
        game.notify.toast(r.message,r.success?'reward':'error');
        game.panels.open('guild');
      ">🪙 ${Utils.formatNumber(amt)}</button>`;
    });
    html += `</div></div>`;

    // Leave guild
    html += `<button class="btn btn-danger guild-leave-btn" onclick="
      if(confirm('Leave this guild?')){game.guild.leaveGuild();game.panels.open('guild');}
    ">Leave Guild</button>`;

    html += '</div>';
    container.innerHTML = html;
  }

  renderGuildMembersTab(container) {
    const members = this.game.guild.getMemberList();
    let html = '<div class="guild-members-list">';

    members.forEach((member, idx) => {
      const statusDot = member.isOnline ? '🟢' : '⚫';
      html += `<div class="guild-member ${member.isPlayer ? 'is-player' : ''}">`;
      html += `<span class="member-rank">#${idx + 1}</span>`;
      html += `<span class="member-icon">${member.icon}</span>`;
      html += `<div class="member-info">`;
      html += `<span class="member-name">${statusDot} ${member.name}${member.isPlayer ? ' (You)' : ''}</span>`;
      html += `<span class="member-details">Lv.${member.level} • Power: ${Utils.formatNumber(member.farmPower)}</span>`;
      html += `</div>`;
      if (!member.isPlayer) {
        html += `<button class="btn btn-small btn-challenge" onclick="game.panels.open('challenge',{opponentId:'${member.id}'})">⚔️</button>`;
      }
      html += `</div>`;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  renderGuildChatTab(container) {
    const guild = this.game.guild.ensureState();
    let html = '<div class="guild-chat">';
    html += '<div class="guild-chat-messages" id="guild-chat-messages">';

    guild.chatLog.forEach(msg => {
      const timeAgo = Math.floor(Utils.now() - msg.time);
      const timeStr = timeAgo < 60 ? 'now' : timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m` : `${Math.floor(timeAgo / 3600)}h`;
      const isSystem = msg.from === 'System';
      html += `<div class="chat-msg ${isSystem ? 'system' : ''}">`;
      html += `<span class="chat-name">${msg.from}</span>`;
      html += `<span class="chat-text">${msg.message}</span>`;
      html += `<span class="chat-time">${timeStr}</span>`;
      html += `</div>`;
    });

    html += '</div>';

    // Quick chat buttons
    html += '<div class="guild-chat-actions">';
    const quickMessages = ['Hey everyone! 👋', 'Great job! ⭐', 'Let\'s raid! ⚔️', 'Need help! 🆘'];
    quickMessages.forEach(msg => {
      html += `<button class="btn btn-chat" onclick="
        game.guild.addChatMessage(game.state.get().player.name,'${msg.replace(/'/g, "\\'")}');
        game.guild.simulateNPCReaction('reaction');
        setTimeout(()=>game.panels.open('guild'),500);
      ">${msg}</button>`;
    });
    html += '</div></div>';
    container.innerHTML = html;

    // Scroll chat to bottom
    setTimeout(() => {
      const chatEl = document.getElementById('guild-chat-messages');
      if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
    }, 50);
  }

  renderGuildPerksTab(container) {
    const guild = this.game.guild.ensureState();
    let html = '<div class="guild-perks-list">';

    const sortedPerks = Object.entries(GUILD_PERKS).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    sortedPerks.forEach(([lvl, perk]) => {
      const unlocked = guild.level >= parseInt(lvl);
      html += `<div class="guild-perk ${unlocked ? 'unlocked' : 'locked'}">`;
      html += `<span class="perk-level">Lv.${lvl}</span>`;
      html += `<span class="perk-icon">${perk.icon}</span>`;
      html += `<div class="perk-info">`;
      html += `<span class="perk-name">${perk.name}</span>`;
      html += `<span class="perk-desc">${perk.desc}</span>`;
      html += `</div>`;
      html += `<span class="perk-status">${unlocked ? '✅' : '🔒'}</span>`;
      html += `</div>`;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  renderGuildRaidTab(container) {
    const guild = this.game.guild.ensureState();
    const raidStatus = this.game.guild.getRaidStatus();

    let html = '<div class="guild-raid-section">';

    if (raidStatus) {
      // Active raid
      const hpPct = Math.floor(raidStatus.hpPercent * 100);
      html += `<div class="raid-active">`;
      html += `<div class="raid-boss-display">`;
      html += `<span class="raid-boss-big-icon">${raidStatus.boss.icon}</span>`;
      html += `<h3>${raidStatus.boss.name}</h3>`;
      html += `<p class="raid-phase">${raidStatus.phase.name} — ${raidStatus.phase.ability}</p>`;
      html += `</div>`;
      html += `<div class="raid-hp-display">`;
      html += `<div class="raid-hp-bar-big"><div class="raid-hp-fill-big" style="width:${hpPct}%"></div></div>`;
      html += `<span>${Utils.formatNumber(raidStatus.currentHp)} / ${Utils.formatNumber(raidStatus.maxHp)}</span>`;
      html += `</div>`;
      html += `<div class="raid-timer-big">⏱️ ${Utils.formatTime(raidStatus.timeRemaining)}</div>`;

      // Participants
      html += `<div class="raid-participants"><h4>Damage Dealt</h4>`;
      const sorted = Object.entries(raidStatus.participants).sort((a, b) => b[1] - a[1]);
      sorted.forEach(([name, dmg]) => {
        html += `<div class="raid-participant"><span>${name}</span><span>${Utils.formatNumber(dmg)} dmg</span></div>`;
      });
      html += `</div>`;

      html += `<p class="raid-tip">Harvest crops and sell items to deal damage!</p>`;
      html += `</div>`;
    } else {
      // Boss selection
      const canRaid = guild.level >= 20;
      if (!canRaid) {
        html += `<div class="raid-locked"><p>🔒 Raids unlock at Guild Level 20 (current: ${guild.level})</p></div>`;
      } else {
        const cooldownRemaining = Math.max(0, 300 - (Utils.now() - guild.raidCooldown));
        if (cooldownRemaining > 0) {
          html += `<p class="raid-cooldown">⏱️ Raid cooldown: ${Utils.formatTime(cooldownRemaining)}</p>`;
        }

        html += `<h4>Choose a Boss</h4>`;
        Object.values(RAID_BOSSES).forEach(boss => {
          const canFight = guild.level >= boss.minGuildLevel && cooldownRemaining <= 0;
          html += `<div class="raid-boss-card ${canFight ? '' : 'locked'}">`;
          html += `<div class="raid-boss-header">`;
          html += `<span class="raid-boss-icon">${boss.icon}</span>`;
          html += `<div><strong>${boss.name}</strong><br><small>${boss.description}</small></div>`;
          html += `</div>`;
          html += `<div class="raid-boss-stats">`;
          html += `<span>HP: ${Utils.formatNumber(boss.hp)}</span>`;
          html += `<span>Time: ${Utils.formatTime(boss.timeLimit)}</span>`;
          html += `<span>Req: Lv.${boss.minGuildLevel}</span>`;
          html += `</div>`;
          html += `<div class="raid-boss-rewards">`;
          html += `<span>🪙 ${Utils.formatNumber(boss.rewards.coins)}</span>`;
          html += `<span>⭐ ${Utils.formatNumber(boss.rewards.xp)}</span>`;
          html += `<span>🎖️ ${boss.rewards.medals}</span>`;
          html += `</div>`;
          if (canFight) {
            html += `<button class="btn btn-primary raid-start-btn" onclick="
              const r=game.guild.startRaid('${boss.id}');
              game.notify.toast(r.message,r.success?'reward':'error');
              if(r.success)game.panels.open('guild');
            ">Start Raid ⚔️</button>`;
          } else if (guild.level < boss.minGuildLevel) {
            html += `<span class="raid-req-locked">🔒 Guild Lv.${boss.minGuildLevel}</span>`;
          }
          html += `</div>`;
        });
      }

      // Raid history
      if (guild.raidHistory.length > 0) {
        html += `<div class="raid-history"><h4>Recent Raids</h4>`;
        guild.raidHistory.slice(-5).reverse().forEach(raid => {
          const boss = RAID_BOSSES[raid.bossId];
          html += `<div class="raid-history-entry ${raid.success ? 'success' : 'failed'}">`;
          html += `<span>${boss?.icon || '?'} ${boss?.name || raid.bossId}</span>`;
          html += `<span>${raid.success ? '✅ Victory' : '❌ Failed'}</span>`;
          html += `<span>${Utils.formatNumber(raid.damage)} dmg</span>`;
          html += `</div>`;
        });
        html += `</div>`;
      }
    }

    html += '</div>';
    container.innerHTML = html;
  }

  renderGuildShopTab(container) {
    const guild = this.game.guild.ensureState();
    const items = this.game.guild.getAvailableShopItems();

    let html = '<div class="guild-shop-section">';
    html += `<p class="guild-medals-display">🎖️ Guild Medals: <strong>${Utils.formatNumber(guild.medals)}</strong></p>`;

    if (items.length === 0) {
      html += '<p class="guild-shop-locked">🔒 Guild Shop unlocks at Guild Level 10</p>';
    } else {
      html += '<div class="guild-shop-grid">';
      items.forEach(item => {
        const canAfford = guild.medals >= item.cost;
        html += `<div class="guild-shop-item ${canAfford ? '' : 'locked'}">`;
        html += `<span class="shop-item-icon">${item.icon}</span>`;
        html += `<span class="shop-item-name">${item.name}</span>`;
        html += `<span class="shop-item-desc">${item.desc}</span>`;
        html += `<button class="btn ${canAfford ? 'btn-primary' : 'btn-disabled'}" ${canAfford ? `onclick="
          const r=game.guild.buyShopItem('${item.id}');
          game.notify.toast(r.message,r.success?'reward':'error');
          game.panels.open('guild');
        "` : 'disabled'}>🎖️ ${item.cost}</button>`;
        html += `</div>`;
      });
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // ==================== LEADERBOARD PANEL ====================
  buildLeaderboardPanel() {
    const panel = this.createPanelFrame('Leaderboards', '🏆');

    const tabs = document.createElement('div');
    tabs.className = 'panel-tabs';
    const tabNames = [
      { id: 'rankings', label: '🏆 Rankings' },
      { id: 'tournaments', label: '🎯 Tournaments' },
      { id: 'challenges', label: '⚔️ Challenges' }
    ];

    let activeTab = 'rankings';
    const renderTab = (tabId) => {
      activeTab = tabId;
      tabs.querySelectorAll('.panel-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.tab === tabId)
      );
      panel.body.innerHTML = '';
      switch (tabId) {
        case 'rankings': this.renderRankingsTab(panel.body); break;
        case 'tournaments': this.renderTournamentsTab(panel.body); break;
        case 'challenges': this.renderChallengesTab(panel.body); break;
      }
    };

    tabNames.forEach(t => {
      const tab = document.createElement('div');
      tab.className = 'panel-tab' + (t.id === activeTab ? ' active' : '');
      tab.textContent = t.label;
      tab.dataset.tab = t.id;
      tab.onclick = () => renderTab(t.id);
      tabs.appendChild(tab);
    });

    panel.insertBefore(tabs, panel.body);
    renderTab('rankings');
    return panel;
  }

  renderRankingsTab(container) {
    let html = '<div class="leaderboard-section">';

    // Category selector
    html += '<div class="lb-categories">';
    const categories = Object.values(LEADERBOARD_CATEGORIES);
    const defaultCat = 'farmPower';

    categories.forEach(cat => {
      html += `<button class="btn btn-lb-cat ${cat.id === defaultCat ? 'active' : ''}" data-cat="${cat.id}" onclick="
        document.querySelectorAll('.btn-lb-cat').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        const entries=game.competition.generateLeaderboard('${cat.id}');
        let h='';
        entries.slice(0,15).forEach(e=>{
          const medal=e.rank===1?'🥇':e.rank===2?'🥈':e.rank===3?'🥉':'';
          h+='<div class=\\'lb-entry '+(e.isPlayer?'is-player':'')+'\\'>'+
            '<span class=\\'lb-rank\\'>'+medal+(medal?'':'#'+e.rank)+'</span>'+
            '<span class=\\'lb-icon\\'>'+e.icon+'</span>'+
            '<div class=\\'lb-info\\'><span class=\\'lb-name\\'>'+e.name+'</span>'+(e.guildName?'<span class=\\'lb-guild\\'>'+e.guildName+'</span>':'')+'</div>'+
            '<span class=\\'lb-score\\'>'+Utils.formatNumber(e.score)+'</span></div>';
        });
        document.getElementById('lb-entries').innerHTML=h;
      ">${cat.icon} ${cat.name}</button>`;
    });
    html += '</div>';

    // Initial leaderboard
    const entries = this.game.competition.generateLeaderboard(defaultCat);
    html += '<div class="lb-entries" id="lb-entries">';
    entries.slice(0, 15).forEach(entry => {
      const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
      html += `<div class="lb-entry ${entry.isPlayer ? 'is-player' : ''}">`;
      html += `<span class="lb-rank">${medal || '#' + entry.rank}</span>`;
      html += `<span class="lb-icon">${entry.icon}</span>`;
      html += `<div class="lb-info"><span class="lb-name">${entry.name}</span>`;
      if (entry.guildName) html += `<span class="lb-guild">${entry.guildName}</span>`;
      html += `</div>`;
      html += `<span class="lb-score">${Utils.formatNumber(entry.score)}</span>`;
      html += `</div>`;
    });
    html += '</div></div>';

    container.innerHTML = html;
  }

  renderTournamentsTab(container) {
    const comp = this.game.competition.ensureState();
    let html = '<div class="tournament-section">';

    // Active tournament
    const status = this.game.competition.getTournamentStatus();
    if (status) {
      html += `<div class="tournament-active">`;
      html += `<h4>${status.type.icon} ${status.type.name} — In Progress!</h4>`;
      html += `<p class="tourney-timer">⏱️ ${Utils.formatTime(status.timeRemaining)}</p>`;
      html += `<div class="tourney-standings">`;
      status.standings.slice(0, 8).forEach(s => {
        html += `<div class="tourney-entry ${s.isPlayer ? 'is-player' : ''}">`;
        html += `<span class="tourney-rank">#${s.rank}</span>`;
        html += `<span class="tourney-name">${s.name}</span>`;
        html += `<span class="tourney-score">${Utils.formatNumber(s.score)}</span>`;
        html += `</div>`;
      });
      html += `</div></div>`;
    } else {
      // Tournament selection
      html += `<h4>Start a Tournament</h4>`;
      const cooldownRemaining = Math.max(0, 600 - (Utils.now() - comp.tournamentCooldown));
      if (cooldownRemaining > 0) {
        html += `<p class="tourney-cooldown">⏱️ Cooldown: ${Utils.formatTime(cooldownRemaining)}</p>`;
      }

      Object.values(TOURNAMENT_TYPES).forEach(type => {
        const canStart = cooldownRemaining <= 0;
        html += `<div class="tournament-card">`;
        html += `<div class="tournament-header"><span>${type.icon}</span><strong>${type.name}</strong></div>`;
        html += `<p>${type.description}</p>`;
        html += `<div class="tournament-rewards">`;
        type.rewards.slice(0, 3).forEach(r => {
          const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉';
          html += `<span>${medal} 🪙${Utils.formatNumber(r.coins)} 🎖️${r.medals}</span>`;
        });
        html += `</div>`;
        if (canStart) {
          html += `<button class="btn btn-primary" onclick="
            const r=game.competition.startTournament('${type.id}');
            game.notify.toast(r.message,r.success?'reward':'error');
            if(r.success)game.panels.close();
          ">Start ${type.name}!</button>`;
        }
        html += `</div>`;
      });
    }

    // History
    if (comp.tournamentHistory.length > 0) {
      html += `<div class="tournament-history"><h4>Recent Results</h4>`;
      comp.tournamentHistory.slice(-5).reverse().forEach(t => {
        const type = TOURNAMENT_TYPES[t.typeId];
        html += `<div class="tourney-history-entry">`;
        html += `<span>${type?.icon || '🎯'} ${type?.name || t.typeId}</span>`;
        html += `<span>Rank #${t.rank}</span>`;
        html += `<span>Score: ${Utils.formatNumber(t.score)}</span>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  renderChallengesTab(container) {
    const comp = this.game.competition.ensureState();
    const guild = this.game.guild.ensureState();
    let html = '<div class="challenge-section">';

    // Active challenge
    const status = this.game.competition.getChallengeStatus();
    if (status) {
      html += `<div class="challenge-active">`;
      html += `<h4>${status.type.icon} ${status.type.name}</h4>`;
      html += `<p>vs ${status.opponentName}</p>`;
      html += `<div class="challenge-scores">`;
      html += `<div class="challenge-player ${status.isWinning ? 'winning' : ''}">`;
      html += `<span>You</span><span class="challenge-score">${Utils.formatNumber(status.playerScore)}</span>`;
      html += `</div>`;
      html += `<span class="challenge-vs">VS</span>`;
      html += `<div class="challenge-opponent ${!status.isWinning ? 'winning' : ''}">`;
      html += `<span>${status.opponentName}</span><span class="challenge-score">${Utils.formatNumber(status.opponentScore)}</span>`;
      html += `</div></div>`;
      html += `<p class="challenge-timer">⏱️ ${Utils.formatTime(status.timeRemaining)}</p>`;
      html += `</div>`;
    } else if (guild.joined) {
      html += `<h4>Challenge a Guild Member!</h4>`;
      html += `<p>Pick a challenge type, then pick an opponent.</p>`;

      Object.values(CHALLENGE_TYPES).forEach(type => {
        html += `<div class="challenge-type-card">`;
        html += `<span class="challenge-icon">${type.icon}</span>`;
        html += `<div><strong>${type.name}</strong><br><small>${type.description}</small></div>`;
        html += `<div class="challenge-reward-preview">Winner: 🪙${type.reward.winner.coins}</div>`;
        html += `</div>`;
      });

      // Opponent selection
      html += `<h4>Pick an Opponent</h4>`;
      guild.members.forEach(memberId => {
        const npc = NPC_GUILD_MEMBERS.find(n => n.id === memberId);
        if (!npc) return;
        html += `<div class="challenge-opponent-card">`;
        html += `<span>${npc.icon}</span>`;
        html += `<span>${npc.name} (Lv.${npc.level})</span>`;
        html += `<div class="challenge-btns">`;
        Object.values(CHALLENGE_TYPES).forEach(type => {
          html += `<button class="btn btn-small" onclick="
            const r=game.competition.startChallenge('${type.id}','${npc.id}');
            game.notify.toast(r.message,r.success?'reward':'error');
            if(r.success)game.panels.close();
          ">${type.icon}</button>`;
        });
        html += `</div></div>`;
      });
    } else {
      html += '<p>Join a guild to challenge other farmers!</p>';
    }

    // History
    if (comp.challengeHistory.length > 0) {
      html += `<div class="challenge-history"><h4>Recent Challenges</h4>`;
      comp.challengeHistory.slice(-5).reverse().forEach(c => {
        const type = CHALLENGE_TYPES[c.typeId];
        html += `<div class="challenge-history-entry ${c.won ? 'won' : 'lost'}">`;
        html += `<span>${type?.icon || '⚔️'} vs ${c.opponent}</span>`;
        html += `<span>${c.won ? '✅ Won' : '❌ Lost'}</span>`;
        html += `<span>${Utils.formatNumber(c.playerScore)} vs ${Utils.formatNumber(c.opponentScore)}</span>`;
        html += `</div>`;
      });
      html += `</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // Stub panels for direct navigation
  buildGuildRaidPanel() {
    return this.buildGuildPanel();
  }

  buildTournamentPanel() {
    return this.buildLeaderboardPanel();
  }

  buildChallengePanel(data) {
    if (data && data.opponentId) {
      // Quick-start a challenge panel
      return this.buildLeaderboardPanel();
    }
    return this.buildLeaderboardPanel();
  }
}
