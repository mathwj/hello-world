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
}
