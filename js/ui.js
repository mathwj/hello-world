/* =============================================
   DEEP SPACE INC. — UI SYSTEM
   Currency display, tap button, floating numbers,
   generators, buy toggle, tabs, tooltips, modals
   ============================================= */
'use strict';

const UI = (() => {
  let currentTab = 'generators';
  let buyAmount = 1;       // 1, 10, 100, or 'max'
  let floatingNumbers = []; // pool for floating "+₡X" animations

  // 5.1 Phase-specific tap labels
  const TAP_CONFIG = {
    1: { label: 'SCAVENGE', icon: '\uD83D\uDD27' },
    2: { label: 'DEPLOY',   icon: '\uD83D\uDEF0' },
    3: { label: 'MINE',     icon: '\u26CF' },
    4: { label: 'TERRAFORM', icon: '\uD83C\uDF3F' },
    5: { label: 'HARVEST',  icon: '\u2604' },
    6: { label: 'SCAN',     icon: '\uD83D\uDCE1' },
    7: { label: 'EXPLORE',  icon: '\uD83D\uDD2D' },
    8: { label: 'EXPLORE',  icon: '\uD83D\uDD2D' },
    9: { label: 'EXPLORE',  icon: '\uD83D\uDD2D' }
  };

  // ---------- Init ----------

  function init() {
    setupTabs();
    setupBuyToggle();
    setupTapButton();
    setupMenuButtons();
    updateAll();
  }

  // ---------- Tab Management ----------

  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (btn) btn.classList.add('active');
    const panel = document.getElementById('panel-' + tab);
    if (panel) panel.classList.add('active');

    // Show buy toggle only on generators tab
    const buyToggle = document.getElementById('buy-toggle');
    if (buyToggle) buyToggle.style.display = (tab === 'generators') ? 'flex' : 'none';

    refreshPanel(tab);
  }

  function refreshPanel(tab) {
    switch (tab) {
      case 'generators': updateGenerators(); break;
      case 'upgrades': updateUpgrades(); break;
      case 'achievements': updateAchievements(); break;
      case 'stats': updateStats(); break;
      case 'settings': updateSettings(); break;
    }
  }

  // ---------- 4.3 Buy Amount Toggle ----------

  function setupBuyToggle() {
    document.querySelectorAll('.buy-amt').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.amount;
        buyAmount = (val === 'max') ? 'max' : parseInt(val);
        document.querySelectorAll('.buy-amt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateGenerators();
      });
    });
  }

  function getBuyAmount() { return buyAmount; }

  // ---------- 5.1 Tap Button ----------

  function setupTapButton() {
    const btn = document.getElementById('tap-btn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Engine.doTap(false);
    });
    // Prevent double-tap zoom on mobile
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      Engine.doTap(false);
    });
  }

  // ---------- Menu Buttons ----------

  function setupMenuButtons() {
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', () => switchTab('settings'));
  }

  // ---------- 5.2 Tap Feedback ----------

  function onTap(amount) {
    const s = State.get();
    // Button press animation (5.2.1)
    const btn = document.getElementById('tap-btn');
    if (btn) {
      btn.classList.remove('tap-press');
      void btn.offsetWidth; // force reflow
      btn.classList.add('tap-press');
    }
    // Floating number (5.2.2)
    spawnFloatingNumber('+' + Num.currency(amount, '\u20A1'), false);
    // Particle burst (5.2.3) — handled by CSS
  }

  function onAutoTap(amount) {
    // Auto-tap: smaller, lighter floating number (5.4)
    spawnFloatingNumber('+' + Num.currency(amount, '\u20A1'), true);
  }

  function spawnFloatingNumber(text, isAuto) {
    const container = document.getElementById('floating-numbers');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'floating-number' + (isAuto ? ' auto' : '');
    el.textContent = text;
    // Random horizontal offset
    el.style.left = (40 + Math.random() * 20) + '%';
    container.appendChild(el);
    // Remove after animation
    setTimeout(() => el.remove(), 900);
  }

  // ---------- Tooltip on long-press / hover (2.3) ----------

  function showTooltip(el, fullValue) {
    let tip = document.getElementById('number-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'number-tooltip';
      document.body.appendChild(tip);
    }
    tip.textContent = fullValue;
    const rect = el.getBoundingClientRect();
    tip.style.left = rect.left + 'px';
    tip.style.top = (rect.top - 30) + 'px';
    tip.classList.add('visible');
  }

  function hideTooltip() {
    const tip = document.getElementById('number-tooltip');
    if (tip) tip.classList.remove('visible');
  }

  // ---------- Per-Tick UI Update ----------

  function updateTick() {
    updateCurrencyBar();
    updateTapButton();
    // Update auto-tap badge visibility
    const badge = document.getElementById('auto-tap-badge');
    if (badge) {
      const s = State.get();
      badge.classList.toggle('hidden', s.autoTapPerSecond <= 0);
    }
  }

  // ---------- Currency Bar (Section 3) ----------

  function updateCurrencyBar() {
    const s = State.get();
    const bar = document.getElementById('currency-bar');
    if (!bar) return;

    // Build currency display — show only active currencies
    let html = '';
    // Credits always visible
    html += currencyChip('credits', '\u20A1', s.credits, s.creditsPerSecond, '#FFD700');
    // RP — Phase 2+
    if (s.highestPhaseReached >= 2) {
      html += currencyChip('rp', 'RP', s.researchPoints, s.rpPerSecond, '#4A90D9');
    }
    // Ore — Phase 3+
    if (s.highestPhaseReached >= 3) {
      html += currencyChip('ore', 'Ore', s.lunarOre, s.orePerSecond, '#A8A8A8');
    }
    // RM — Phase 5+
    if (s.highestPhaseReached >= 5) {
      html += currencyChip('rm', 'RM', s.rareMinerals, s.rmPerSecond, '#9B59B6');
    }
    // AS — Phase 6+
    if (s.highestPhaseReached >= 6 && s.alienSignals > 0) {
      html += currencyChip('as', 'AS', s.alienSignals, 0, '#2ECC71');
    }
    // SD — Phase 7+
    if (s.highestPhaseReached >= 7) {
      html += currencyChip('sd', 'SD', s.stardust, s.sdPerSecond, '#F0E6FF');
    }
    // CD — after first prestige
    if (s.totalPrestigeCount > 0 || s.cosmicDust > 0) {
      html += currencyChip('cd', 'CD', s.cosmicDust, 0, '#FF69B4');
    }

    bar.innerHTML = html;
  }

  function currencyChip(id, symbol, amount, perSec, color) {
    let display = '<div class="currency-chip" data-currency="' + id + '" style="color:' + color + '">';
    display += '<span class="currency-symbol">' + symbol + '</span>';
    display += '<span class="currency-amount" data-full="' + Num.formatFull(amount) + '">' + Num.format(amount) + '</span>';
    if (perSec > 0) {
      display += '<span class="currency-rate">' + Num.perSec(perSec, '') + '</span>';
    }
    display += '</div>';
    return display;
  }

  // ---------- Tap Button Update (5.1) ----------

  function updateTapButton() {
    const s = State.get();
    const cfg = TAP_CONFIG[s.currentPhase] || TAP_CONFIG[1];
    const icon = document.getElementById('tap-icon');
    const label = document.getElementById('tap-label');
    if (icon) icon.textContent = cfg.icon;
    if (label) label.textContent = cfg.label;
  }

  // ---------- Phase Name ----------

  function updatePhaseName() {
    const s = State.get();
    const names = {
      1: 'PHASE 1: THE JUNKYARD',
      2: 'PHASE 2: LOW EARTH ORBIT',
      3: 'PHASE 3: THE MOON',
      4: 'PHASE 4: MARS',
      5: 'PHASE 5: ASTEROID BELT',
      6: 'PHASE 6: JUPITER',
      7: 'PHASE 7: INTERSTELLAR',
      8: 'PHASE 8: GALAXY MAP',
      9: 'PHASE 9: MULTIVERSE'
    };
    const el = document.getElementById('phase-name');
    if (el) el.textContent = names[s.currentPhase] || 'DEEP SPACE INC.';
  }

  // ---------- Generators Panel ----------

  function updateGenerators() {
    const s = State.get();
    const panel = document.getElementById('panel-generators');
    if (!panel) return;

    if (typeof GameData === 'undefined' || !GameData.GENERATORS) {
      panel.innerHTML = '<div class="empty-msg">No generators available yet.</div>';
      return;
    }

    // Get generators for current phase
    const phaseKey = String(s.currentPhase);
    const gens = GameData.GENERATORS[phaseKey];
    if (!gens || gens.length === 0) {
      panel.innerHTML = '<div class="empty-msg">No generators in this phase.</div>';
      return;
    }

    let html = '';
    for (const gen of gens) {
      const owned = s.generators[gen.id] || 0;
      const growth = gen.growth || 1.15;
      const currency = gen.costCurrency || 'credits';
      const currInfo = State.getCurrencyInfo(currency) || { symbol: '\u20A1', color: '#FFD700' };

      let cost, costLabel;
      if (buyAmount === 'max') {
        const result = Num.maxAffordable(gen.baseCost, growth, owned, State.getCurrency(currency));
        cost = result.totalCost;
        costLabel = result.count > 0 ? Num.currency(cost, currInfo.symbol) + ' (\u00D7' + result.count + ')' : 'MAX';
      } else {
        cost = Num.costBulk(gen.baseCost, growth, owned, buyAmount);
        costLabel = Num.currency(cost, currInfo.symbol);
      }

      const canBuy = State.canAfford(currency, cost) && cost > 0;
      const output = gen.output || {};
      const outputStr = Object.entries(output).map(([k, v]) => {
        const ci = State.getCurrencyInfo(k);
        return (ci ? ci.symbol : k) + Num.format(v * owned);
      }).join(' ');

      html += '<div class="generator-row' + (canBuy ? ' affordable' : '') + '" data-gen="' + gen.id + '">';
      html += '  <div class="gen-info">';
      html += '    <div class="gen-name">' + gen.name + '</div>';
      html += '    <div class="gen-desc">' + (gen.desc || '') + '</div>';
      html += '    <div class="gen-output">' + (owned > 0 ? outputStr + '/sec' : '') + '</div>';
      html += '  </div>';
      html += '  <div class="gen-right">';
      html += '    <div class="gen-count">' + owned + '</div>';
      html += '    <button class="gen-buy-btn' + (canBuy ? '' : ' disabled') + '" data-gen="' + gen.id + '">';
      html += costLabel;
      html += '    </button>';
      html += '  </div>';
      html += '</div>';
    }

    // Rocket parts (Phase 1 only)
    if (s.currentPhase === 1 && typeof GameData !== 'undefined' && GameData.ROCKET_PARTS) {
      html += '<div class="section-divider">ROCKET ASSEMBLY</div>';
      for (const part of GameData.ROCKET_PARTS) {
        const owned = s.rocketParts[part.id];
        const canBuy = !owned && s.credits >= part.cost;
        html += '<div class="generator-row rocket-part' + (owned ? ' owned' : '') + (canBuy ? ' affordable' : '') + '">';
        html += '  <div class="gen-info">';
        html += '    <div class="gen-name">' + part.name + (owned ? ' \u2705' : '') + '</div>';
        html += '  </div>';
        html += '  <div class="gen-right">';
        if (!owned) {
          html += '    <button class="gen-buy-btn rocket-part-btn' + (canBuy ? '' : ' disabled') + '" data-part="' + part.id + '">';
          html += Num.currency(part.cost, '\u20A1');
          html += '    </button>';
        }
        html += '  </div>';
        html += '</div>';
      }

      // Launch button
      if (Object.values(s.rocketParts).every(v => v) && s.currentPhase === 1) {
        html += '<button id="launch-btn" class="launch-btn">LAUNCH ROCKET \uD83D\uDE80</button>';
      }
    }

    panel.innerHTML = html;

    // Bind buy buttons
    panel.querySelectorAll('.gen-buy-btn[data-gen]').forEach(btn => {
      btn.addEventListener('click', () => Engine.buyGenerator(btn.dataset.gen, buyAmount));
    });
    panel.querySelectorAll('.rocket-part-btn').forEach(btn => {
      btn.addEventListener('click', () => Engine.buyRocketPart(btn.dataset.part));
    });
    const launchBtn = panel.querySelector('#launch-btn');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => Engine.launchRocket());
    }
  }

  // ---------- Upgrades Panel ----------

  function updateUpgrades() {
    const s = State.get();
    const panel = document.getElementById('panel-upgrades');
    if (!panel) return;

    if (typeof GameData === 'undefined' || !GameData.UPGRADES) {
      panel.innerHTML = '<div class="empty-msg">No upgrades available yet.</div>';
      return;
    }

    const phaseKey = String(s.currentPhase);
    const upgrades = GameData.UPGRADES[phaseKey] || [];

    let html = '';
    for (const up of upgrades) {
      const purchased = s.upgradesPurchased[up.id];
      const currency = up.currency || 'credits';
      const currInfo = State.getCurrencyInfo(currency) || { symbol: '\u20A1' };
      const canBuy = !purchased && State.canAfford(currency, up.cost);

      html += '<div class="upgrade-row' + (purchased ? ' purchased' : '') + (canBuy ? ' affordable' : '') + '">';
      html += '  <div class="up-info">';
      html += '    <div class="up-name">' + up.name + (purchased ? ' \u2705' : '') + '</div>';
      html += '    <div class="up-desc">' + (up.desc || '') + '</div>';
      html += '  </div>';
      if (!purchased) {
        html += '  <button class="up-buy-btn' + (canBuy ? '' : ' disabled') + '" data-up="' + up.id + '">';
        html += Num.currency(up.cost, currInfo.symbol);
        html += '  </button>';
      }
      html += '</div>';
    }

    if (upgrades.length === 0) {
      html = '<div class="empty-msg">No upgrades available for this phase.</div>';
    }

    panel.innerHTML = html;

    panel.querySelectorAll('.up-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => Engine.buyUpgrade(btn.dataset.up));
    });
  }

  // ---------- Rocket Assembly Display ----------

  function updateRocketAssembly() {
    // Visual in scene area — updated by updateGenerators
    updateGenerators();
  }

  // ---------- Achievements Panel ----------

  function updateAchievements() {
    const s = State.get();
    const panel = document.getElementById('panel-achievements');
    if (!panel) return;

    if (typeof GameData === 'undefined' || !GameData.ACHIEVEMENTS) {
      panel.innerHTML = '<div class="empty-msg">Achievements coming soon...</div>';
      return;
    }

    const unlocked = Object.keys(s.achievements).length;
    const total = GameData.ACHIEVEMENTS.length;

    let html = '<div class="ach-header">' + unlocked + ' / ' + total + ' Unlocked</div>';
    for (const ach of GameData.ACHIEVEMENTS) {
      const done = s.achievements[ach.id];
      html += '<div class="ach-row' + (done ? ' unlocked' : '') + '">';
      html += '  <div class="ach-icon">' + (done ? '\uD83C\uDFC6' : '\uD83D\uDD12') + '</div>';
      html += '  <div class="ach-info">';
      html += '    <div class="ach-name">' + (done ? ach.name : '???') + '</div>';
      html += '    <div class="ach-desc">' + (done ? ach.desc : 'Keep playing to discover...') + '</div>';
      html += '  </div>';
      html += '</div>';
    }

    panel.innerHTML = html;
  }

  // ---------- Stats Panel ----------

  function updateStats() {
    const s = State.get();
    const panel = document.getElementById('panel-stats');
    if (!panel) return;

    let html = '<div class="stats-section">';
    html += statRow('Total Play Time', Num.time(s.totalPlayTimeSeconds));
    html += statRow('Current Phase', s.currentPhase);
    html += statRow('Highest Phase', s.highestPhaseReached);
    html += statRow('Total Taps', Num.format(s.totalTaps));
    html += statRow('Credits Earned (All Time)', Num.currency(s.creditsAllTimeEarned, '\u20A1'));
    html += statRow('Credits/sec', Num.perSec(s.creditsPerSecond, '\u20A1'));
    html += statRow('Credits/tap', Num.currency(s.creditsPerTap, '\u20A1'));
    html += statRow('Prestige Count', s.totalPrestigeCount);
    if (s.cosmicDust > 0) html += statRow('Cosmic Dust', Num.format(s.cosmicDust));
    html += statRow('CD Multiplier', s.cosmicDustMultiplier.toFixed(2) + 'x');
    html += '</div>';

    panel.innerHTML = html;
  }

  function statRow(label, value) {
    return '<div class="stat-row"><span class="stat-label">' + label + '</span><span class="stat-value">' + value + '</span></div>';
  }

  // ---------- Settings Panel ----------

  function updateSettings() {
    const s = State.get();
    const panel = document.getElementById('panel-settings');
    if (!panel) return;

    let html = '<div class="settings-section">';
    html += '<div class="setting-row">';
    html += '  <span>Number Format</span>';
    html += '  <select id="setting-numformat">';
    html += '    <option value="abbreviated"' + (s.settings.numberFormat === 'abbreviated' ? ' selected' : '') + '>Abbreviated</option>';
    html += '    <option value="scientific"' + (s.settings.numberFormat === 'scientific' ? ' selected' : '') + '>Scientific</option>';
    html += '  </select>';
    html += '</div>';
    html += '<div class="setting-row">';
    html += '  <span>Music Volume</span>';
    html += '  <input type="range" id="setting-music" min="0" max="100" value="' + (s.settings.musicVolume * 100) + '">';
    html += '</div>';
    html += '<div class="setting-row">';
    html += '  <span>SFX Volume</span>';
    html += '  <input type="range" id="setting-sfx" min="0" max="100" value="' + (s.settings.sfxVolume * 100) + '">';
    html += '</div>';
    html += '<div class="settings-actions">';
    html += '  <button id="btn-save">Save Game</button>';
    html += '  <button id="btn-export">Export Save</button>';
    html += '  <button id="btn-import">Import Save</button>';
    html += '  <button id="btn-reset" class="danger-btn">Hard Reset</button>';
    html += '</div>';
    html += '</div>';

    panel.innerHTML = html;

    // Bind settings controls
    const numFmt = document.getElementById('setting-numformat');
    if (numFmt) numFmt.addEventListener('change', () => { s.settings.numberFormat = numFmt.value; });
    const musicVol = document.getElementById('setting-music');
    if (musicVol) musicVol.addEventListener('input', () => { s.settings.musicVolume = musicVol.value / 100; });
    const sfxVol = document.getElementById('setting-sfx');
    if (sfxVol) sfxVol.addEventListener('input', () => { s.settings.sfxVolume = sfxVol.value / 100; });

    const saveBtn = document.getElementById('btn-save');
    if (saveBtn) saveBtn.addEventListener('click', () => { State.save(); showToast('Game saved!'); });
    const exportBtn = document.getElementById('btn-export');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      const b64 = State.exportSave();
      navigator.clipboard.writeText(b64).then(() => showToast('Save copied to clipboard!'));
    });
    const importBtn = document.getElementById('btn-import');
    if (importBtn) importBtn.addEventListener('click', () => {
      const b64 = prompt('Paste your save data:');
      if (b64 && State.importSave(b64)) {
        showToast('Save imported! Reloading...');
        setTimeout(() => location.reload(), 500);
      } else if (b64) {
        showToast('Invalid save data!');
      }
    });
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure? This will DELETE all progress permanently!')) {
        State.hardReset();
        location.reload();
      }
    });
  }

  // ---------- Achievement Banner ----------

  function showAchievementBanner(ach) {
    const banner = document.getElementById('achievement-banner');
    if (!banner) return;
    banner.innerHTML = '<div class="ach-banner-icon">\uD83C\uDFC6</div><div class="ach-banner-text"><div class="ach-banner-title">Achievement Unlocked!</div><div class="ach-banner-name">' + ach.name + '</div></div>';
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 3500);
  }

  // ---------- Toast Notifications (Section 32) ----------

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---------- Phase Transition ----------

  function playPhaseTransition(phase) {
    updatePhaseName();
    updateTapButton();
    showToast('Welcome to Phase ' + phase + '!');
    updateAll();
  }

  // ---------- Offline Earnings Modal ----------

  function showOfflineEarnings(earnings) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;

    let html = '<div class="modal-title">Welcome Back!</div>';
    html += '<div class="modal-body">';
    html += '<p>You were away for ' + Num.time(earnings.seconds) + '</p>';
    if (earnings.credits > 0) html += '<p>+' + Num.currency(earnings.credits, '\u20A1') + ' Credits</p>';
    if (earnings.rp > 0) html += '<p>+' + Num.format(earnings.rp) + ' RP</p>';
    if (earnings.ore > 0) html += '<p>+' + Num.format(earnings.ore) + ' Ore</p>';
    html += '</div>';
    html += '<button class="modal-close-btn" id="close-offline-modal">Collect</button>';

    content.innerHTML = html;
    overlay.classList.remove('hidden');

    document.getElementById('close-offline-modal').addEventListener('click', () => {
      overlay.classList.add('hidden');
    });
  }

  // ---------- Show/Hide Tabs ----------

  function showTab(tabId) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.classList.remove('hidden');
  }

  function hideTab(tabId) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('hidden');
  }

  // ---------- Full Update ----------

  function updateAll() {
    updatePhaseName();
    updateCurrencyBar();
    updateTapButton();
    updateGenerators();
    if (currentTab !== 'generators') refreshPanel(currentTab);
  }

  return {
    init, updateTick, updateAll,
    updateCurrencyBar, updateTapButton, updatePhaseName,
    updateGenerators, updateUpgrades, updateRocketAssembly,
    updateAchievements, updateStats, updateSettings,
    onTap, onAutoTap, spawnFloatingNumber,
    showAchievementBanner, showToast, showOfflineEarnings,
    playPhaseTransition, switchTab, showTab, hideTab,
    getBuyAmount, refreshPanel
  };
})();
