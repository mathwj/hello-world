// =========================================
// Panel/Modal Manager
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

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'panel-tabs';
    const tabNames = [
      { id: 'seeds', label: '🌱 Seeds' },
      { id: 'trees', label: '🌳 Trees' },
      { id: 'animals', label: '🐔 Animals' },
      { id: 'pens', label: '🏠 Pens' },
      { id: 'buildings', label: '🏪 Buildings' },
      { id: 'decorations', label: '🌸 Decor' },
      { id: 'expansion', label: '🗺️ Land' }
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
      item.innerHTML = `
        <div class="item-icon">${crop.icon}</div>
        <div class="item-name">${crop.name}</div>
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

  // ==================== INVENTORY ====================
  buildInventoryPanel() {
    const panel = this.createPanelFrame('Barn', '🏚️');
    const state = this.game.state.get();
    const inv = state.inventory;
    const totalItems = this.game.state.getTotalItems();

    // Capacity bar
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

    // Actions
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

    // Items grid
    const grid = document.createElement('div');
    grid.className = 'inventory-grid';

    const allItems = this.getAllItemInfo();
    if (allItems.length === 0) {
      grid.innerHTML = '<p style="text-align:center; color:#999; padding: 20px; grid-column: 1/-1;">Your barn is empty! Harvest crops to fill it up.</p>';
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
    // Check crops
    if (CROPS_DATA[id]) {
      const c = CROPS_DATA[id];
      return { name: c.name, icon: c.icon, sellPrice: c.sellPrice };
    }
    // Check tree fruits
    for (const t of Object.values(TREES_DATA)) {
      if (t.id === id || t.fruitName.toLowerCase().replace(/\s/g, '_') === id) {
        return { name: t.fruitName, icon: t.fruitIcon, sellPrice: t.fruitSellPrice };
      }
    }
    // Check animal products
    for (const a of Object.values(ANIMALS_DATA)) {
      if (a.product === id) {
        return { name: a.productName, icon: a.productIcon, sellPrice: a.productValue };
      }
    }
    // Check building products
    for (const b of Object.values(BUILDINGS_DATA)) {
      for (const r of Object.values(b.recipes)) {
        if (r.id === id) {
          return { name: r.name, icon: r.icon, sellPrice: r.sellPrice };
        }
      }
    }
    return { name: id, icon: '📦', sellPrice: 1 };
  }

  // ==================== QUESTS ====================
  buildQuestPanel() {
    const panel = this.createPanelFrame('Quests', '📜');
    const state = this.game.state.get();

    // Tabs
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
      list.innerHTML = '<p style="text-align:center; color:#999; padding: 20px;">No active quests. Keep leveling up!</p>';
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
      list.innerHTML = '<p style="text-align:center; color:#999; padding: 20px;">Daily quests refresh each day!</p>';
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
      list.innerHTML = '<p style="text-align:center; color:#999; padding: 20px;">Complete quests to see them here!</p>';
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

    // Event listeners
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

    // Production slots
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

      // Action buttons
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

    // Add animal button if not at capacity
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
