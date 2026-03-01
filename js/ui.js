// ui.js — All UI rendering, tab management, modals, popups
'use strict';

const UI = (() => {
  let currentTab = 'generators';
  let buyAmount = 1;
  let activePhaseView = 1;
  let floatingNumberPool = [];

  function init() {
    setupTabs();
    setupBuyToggle();
    setupTapButton();
    setupMenuButtons();
    setupTooltipLongPress();
    setupMoreSheet();
    // Initialize juice systems
    if (typeof Juice !== 'undefined') Juice.init();
    if (typeof AdaptiveAudio !== 'undefined') AdaptiveAudio.init();
    // Apply phase colors on startup
    updatePhaseColors();
    updateAll();
  }

  function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
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

    // Show/hide buy toggle
    const buyToggle = document.getElementById('buy-toggle');
    buyToggle.style.display = (tab === 'generators') ? 'flex' : 'none';

    refreshPanel(tab);
  }

  function refreshPanel(tab) {
    switch (tab) {
      case 'generators': updateGenerators(); break;
      case 'upgrades': updateUpgrades(); break;
      case 'zones': updateZones(); break;
      case 'crew': updateCrew(); break;
      case 'fleet': updateFleet(); break;
      case 'research': updateResearch(); break;
      case 'collection': updateCollection(); break;
      case 'contracts': updateContracts(); break;
      case 'boosters': updateBoosters(); break;
      case 'eggs': updateEggs(); break;
      case 'log': updateLog(); break;
      case 'stats': updateStats(); break;
      case 'prestige': updatePrestigePanel(); break;
      case 'achievements': updateAchievements(); break;
      case 'settings': updateSettings(); break;
      case 'synergies': updateSynergies(); break;
      case 'skins': updateRocketSkins(); break;
    }
  }

  function setupBuyToggle() {
    document.querySelectorAll('.buy-amt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.buy-amt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        buyAmount = btn.dataset.amount === 'max' ? 'max' : parseInt(btn.dataset.amount);
        updateGenerators();
      });
    });
  }

  function getBuyAmount() {
    return buyAmount;
  }

  function setupTapButton() {
    const tapBtn = document.getElementById('tap-btn');
    tapBtn.addEventListener('click', (e) => {
      const s = GameState.getState();
      const amount = Engine.doTap(s, false);
      animateTapButton(tapBtn);
    });

    // Prevent double-tap zoom on mobile
    tapBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      tapBtn.click();
    });

    // Lucky Drop click handler on scene area
    const sceneArea = document.getElementById('scene-area');
    sceneArea.addEventListener('click', (e) => {
      if (e.target.id === 'lucky-drop' || e.target.closest('#lucky-drop')) {
        const s = GameState.getState();
        const result = Expansion.LuckyDrops.collect(s);
        if (result) {
          const dropEl = document.getElementById('lucky-drop');
          dropEl.classList.add('hidden');
          showFloatingNumber(0, { type: 'drop', dropName: result.drop.type.name, dropColor: result.drop.type.color });
          if (!s.captainsLog.includes('log35')) Engine.addLogEntry('log35');
        }
      }
    });
  }

  function animateTapButton(btn) {
    btn.classList.remove('tap-active');
    // Force reflow so animation restarts even on rapid taps
    void btn.offsetWidth;
    btn.classList.add('tap-active');
    setTimeout(() => btn.classList.remove('tap-active'), 150);
  }

  function setupTooltipLongPress() {
    // Long-press support for tooltips on touch devices
    let longPressTimer = null;
    let activeTooltip = null;

    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest('.has-tooltip');
      if (!target) return;
      longPressTimer = setTimeout(() => {
        target.classList.add('tooltip-active');
        activeTooltip = target;
      }, 400);
    }, { passive: true });

    document.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
      if (activeTooltip) {
        activeTooltip.classList.remove('tooltip-active');
        activeTooltip = null;
      }
    }, { passive: true });

    document.addEventListener('touchmove', () => {
      clearTimeout(longPressTimer);
    }, { passive: true });
  }

  function setupMenuButtons() {
    document.getElementById('menu-btn').addEventListener('click', () => {
      switchTab('zones');
    });
    document.getElementById('settings-btn').addEventListener('click', () => {
      switchTab('settings');
    });
  }

  // ===== UPDATE FUNCTIONS =====

  function updateAll() {
    updateTopBar();
    updateCurrencyBar();
    updateTapButton();
    updateGenerators();
    updateRocketAssembly();
    updateTabVisibility();
  }

  function updateTick() {
    updateCurrencyBar();
    updateTopBar();
    // Only update active panel content to reduce DOM thrash
    if (currentTab === 'generators') updateGeneratorCosts();
    if (currentTab === 'stats') updateStats();
    if (currentTab === 'contracts') updateContracts();
    if (currentTab === 'eggs') updateEggProgress();

    // Expansion HUD updates
    updateComboDisplay();
    updateWeatherIndicator();
    updateLuckyDropDisplay();
    updateGoldenRushBanner();
    updateNextUnlockBar();
    updateIdleStreakDisplay();
    updateActiveBoosterHUD();

    // Design system: phase color sync and combo ring
    updatePhaseColors();
    updateTapComboRing();
  }

  function updateTopBar() {
    const s = GameState.getState();
    const phaseData = GameData.PHASES[s.currentPhase];
    document.getElementById('phase-name').textContent =
      'PHASE ' + s.currentPhase + ': ' + (phaseData ? phaseData.name : '');
  }

  function ttip(value) {
    // Wrap a formatted number with a tooltip showing the full unabbreviated value
    if (value < 1000) return NumberFormatter.format(value);
    return `<span class="has-tooltip">${NumberFormatter.format(value)}<span class="num-tooltip">${NumberFormatter.formatFull(value)}</span></span>`;
  }

  function updateCurrencyBar() {
    const s = GameState.getState();
    const bar = document.getElementById('currency-bar');
    const fmt = NumberFormatter.formatSmart;

    // Credits — always visible (₡ gold coin with rocket silhouette)
    let html = `<div class="currency credits" title="Credits — Main currency">
      <span class="cur-icon" style="color:#FFD700">\u{1FA99}</span>
      <span class="cur-val">${ttip(s.credits)}</span>
      <span class="cur-rate">\u20A1${fmt(s.creditsPerSecond)}/sec</span>
    </div>`;

    // Research Points — Phase 2+ (blue flask)
    if (s.highestPhaseReached >= 2) {
      html += `<div class="currency rp" title="Research Points">
        <span class="cur-icon" style="color:#4A90D9">\u{1F9EA}</span>
        <span class="cur-val">${ttip(s.researchPoints)}</span>
        ${s.rpPerSecond > 0 ? `<span class="cur-rate">${fmt(s.rpPerSecond)}/sec</span>` : ''}
      </div>`;
    }

    // Lunar Ore — Phase 3+ (gray crystal)
    if (s.highestPhaseReached >= 3) {
      html += `<div class="currency ore" title="Lunar Ore">
        <span class="cur-icon" style="color:#A8A8A8">\u{1FAA8}</span>
        <span class="cur-val">${ttip(s.lunarOre)}</span>
        ${s.orePerSecond > 0 ? `<span class="cur-rate">${fmt(s.orePerSecond)}/sec</span>` : ''}
      </div>`;
    }

    // Rare Minerals — Phase 5+ (purple gem)
    if (s.highestPhaseReached >= 5) {
      html += `<div class="currency rm" title="Rare Minerals">
        <span class="cur-icon" style="color:#9B59B6">\u{1F48E}</span>
        <span class="cur-val">${ttip(s.rareMinerals)}</span>
        ${s.rmPerSecond > 0 ? `<span class="cur-rate">${fmt(s.rmPerSecond)}/sec</span>` : ''}
      </div>`;
    }

    // Alien Signals — Phase 6+ (green waveform)
    if (s.highestPhaseReached >= 6) {
      html += `<div class="currency as" title="Alien Signals">
        <span class="cur-icon" style="color:#2ECC71">\u{1F4E1}</span>
        <span class="cur-val">${ttip(s.alienSignals)}</span>
      </div>`;
    }

    // Stardust — Phase 7+ (sparkling dust)
    if (s.highestPhaseReached >= 7) {
      html += `<div class="currency sd" title="Stardust">
        <span class="cur-icon" style="color:#F0E6FF">\u2728</span>
        <span class="cur-val">${ttip(s.stardust)}</span>
        ${s.sdPerSecond > 0 ? `<span class="cur-rate">${fmt(s.sdPerSecond)}/sec</span>` : ''}
      </div>`;
    }

    // Cosmic Dust — prestige currency (prismatic orb)
    if (s.cosmicDust > 0) {
      html += `<div class="currency cd" title="Cosmic Dust — Prestige Currency (permanent)">
        <span class="cur-icon cd-icon">\u{1F300}</span>
        <span class="cur-val">${ttip(s.cosmicDust)}</span>
      </div>`;
    }

    // Infinity Tokens — post-prestige endgame (infinity symbol)
    if (s.infinityTokens > 0) {
      html += `<div class="currency it" title="Infinity Tokens (permanent)">
        <span class="cur-icon it-icon">\u221E</span>
        <span class="cur-val">${ttip(s.infinityTokens)}</span>
      </div>`;
    }

    bar.innerHTML = html;
  }

  function updateTapButton() {
    const s = GameState.getState();
    const phaseData = GameData.PHASES[s.currentPhase];
    if (phaseData) {
      document.getElementById('tap-label').textContent = phaseData.tapLabel;
      document.getElementById('tap-icon').textContent = phaseData.tapIcon;
    }
    const badge = document.getElementById('auto-tap-badge');
    const tapBtn = document.getElementById('tap-btn');
    if (s.autoTapPerSecond > 0) {
      badge.classList.remove('hidden');
      tapBtn.classList.add('auto-tapping');
    } else {
      badge.classList.add('hidden');
      tapBtn.classList.remove('auto-tapping');
    }
  }

  function updateTabVisibility() {
    const s = GameState.getState();
    showTabBtn('crew', s.crew.unlocked);
    showTabBtn('fleet', s.fleet.unlocked || s.highestPhaseReached >= 5);
    showTabBtn('research', s.highestPhaseReached >= 2);
    showTabBtn('log', s.captainsLog.length > 0);
    showTabBtn('prestige', s.highestPhaseReached >= 8 || s.totalPrestigeCount > 0);
    // Expansion tabs
    showTabBtn('collection', Object.keys(s.collection.items).length > 0 || s.highestPhaseReached >= 3);
    showTabBtn('contracts', s.contracts.completed > 0 || s.contracts.active.length > 0 || s.highestPhaseReached >= 2);
    showTabBtn('boosters', s.boosters.inventory.length > 0 || s.boosters.totalUsed > 0 || s.highestPhaseReached >= 2);
    showTabBtn('eggs', s.eggs.totalHatched > 0 || s.eggs.slots.some(e => e !== null) || s.highestPhaseReached >= 3);
  }

  function showTabBtn(tab, visible) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (btn) btn.classList.toggle('hidden', !visible);
  }

  function showTab(tab) {
    showTabBtn(tab, true);
  }

  // ===== GENERATORS =====

  function updateGenerators() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-generators');
    const phase = s.currentPhase;
    const keys = Engine.getActiveGeneratorKeysForPhase(phase);

    // Sub-zone selector for Phase 6 and 7
    let html = '';
    if (phase === 6) {
      html += renderSubZoneSelector(['6_orbit', '6_io', '6_europa', '6_ganymede', '6_callisto'],
        ['Jupiter Orbit', 'Io', 'Europa', 'Ganymede', 'Callisto']);
    } else if (phase === 7) {
      html += renderSubZoneSelector(['7_haven', '7_ferrum', '7_nebula'],
        ["Kepler's Haven", 'Ferrum Prime', 'Nebula Giant']);
    }

    // Show rocket parts in phase 1
    if (phase === 1 && !s.rocketLaunched) {
      html += renderRocketPartsInline(s);
    }

    // Mars terraform bar
    if (phase === 4) {
      const pct = s.terraforming.marsPercent.toFixed(1);
      html += `<div class="terraform-bar">
        <div class="terraform-label">TERRAFORMING MARS: ${pct}%</div>
        <div class="progress-outer"><div class="progress-inner" style="width:${Math.min(100, pct)}%"></div></div>
        <div class="terraform-rate">+${s.terraforming.marsPerSecond.toFixed(3)}%/sec</div>
      </div>`;
    }

    // Generator list
    const activeKey = phase === 6 ? (s.currentSubZone || '6_orbit') :
      phase === 7 ? (s.currentSubZone || '7_haven') :
      String(phase);

    const gens = GameData.GENERATORS[activeKey];
    if (gens) {
      for (const gen of gens) {
        html += renderGenerator(gen, s);
      }
    }

    // Launch button
    if (phase === 1 && !s.rocketLaunched && Object.values(s.rocketParts).every(v => v)) {
      html += `<button class="launch-btn" onclick="Engine.launchRocket()">
        <span class="launch-icon">\u{1F680}</span> LAUNCH!
      </button>`;
    }

    panel.innerHTML = html;

    // Attach buy handlers
    panel.querySelectorAll('.gen-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => Engine.buyGenerator(btn.dataset.genid));
    });

    // Attach rocket part handlers
    panel.querySelectorAll('.part-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => Engine.buyRocketPart(btn.dataset.partid));
    });

    // Attach sub-zone handlers
    panel.querySelectorAll('.subzone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        s.currentSubZone = btn.dataset.zone;
        updateGenerators();
      });
    });

    // Repair buttons for Io
    panel.querySelectorAll('.repair-btn').forEach(btn => {
      btn.addEventListener('click', () => Engine.repairIoGenerator(btn.dataset.genid));
    });
  }

  function renderSubZoneSelector(zones, labels) {
    const s = GameState.getState();
    const current = s.currentSubZone || zones[0];
    let html = '<div class="subzone-selector">';
    zones.forEach((z, i) => {
      html += `<button class="subzone-btn ${z === current ? 'active' : ''}" data-zone="${z}">${labels[i]}</button>`;
    });
    html += '</div>';
    return html;
  }

  function renderRocketPartsInline(s) {
    let html = '<div class="rocket-parts-section"><h3>Rocket Assembly</h3><div class="rocket-parts-grid">';
    for (const part of GameData.ROCKET_PARTS) {
      const owned = s.rocketParts[part.id];
      let cost = part.cost;
      if (s.cdShopPurchased && s.cdShopPurchased['cd_quick']) cost *= 0.5;
      const canBuy = !owned && s.credits >= cost;
      html += `<div class="rocket-part ${owned ? 'owned' : ''} ${canBuy ? 'affordable' : ''}">
        <div class="part-name">${part.name}</div>
        <div class="part-desc">${part.desc}</div>
        ${owned ? '<div class="part-status">\u2714 Installed</div>' :
          `<button class="part-buy-btn ${canBuy ? '' : 'disabled'}" data-partid="${part.id}">\u20A1${NumberFormatter.format(cost)}</button>`}
      </div>`;
    }
    html += '</div></div>';
    return html;
  }

  function renderGenerator(gen, s) {
    const owned = s.generators[gen.id] || 0;
    const currency = gen.costCurrency || 'credits';
    const fmt = NumberFormatter.formatSmart;
    const amt = buyAmount === 'max' ?
      NumberFormatter.maxAffordable(gen.baseCost, gen.growth, owned, GameState.getCurrency(currency)).count :
      buyAmount;
    const cost = buyAmount === 'max' ?
      NumberFormatter.maxAffordable(gen.baseCost, gen.growth, owned, GameState.getCurrency(currency)).totalCost :
      NumberFormatter.bulkCost(gen.baseCost, gen.growth, owned, amt);

    const canAfford = GameState.canAfford(currency, cost) && amt > 0;
    const currencySymbol = currency === 'credits' ? '\u20A1' : currency === 'ore' ? 'Ore ' : currency.toUpperCase() + ' ';

    // Output description — uses smart format respecting user's number format preference
    let outputDesc = '';
    if (gen.output.credits) outputDesc += '\u20A1' + fmt(gen.output.credits) + '/s ';
    if (gen.output.rp) outputDesc += fmt(gen.output.rp) + ' RP/s ';
    if (gen.output.ore) outputDesc += fmt(gen.output.ore) + ' Ore/s ';
    if (gen.output.rm) outputDesc += fmt(gen.output.rm) + ' RM/s ';
    if (gen.output.sd) outputDesc += fmt(gen.output.sd) + ' SD/s ';
    if (gen.terraform) outputDesc += '+' + gen.terraform + '%/s terraform ';
    if (gen.globalBoost) outputDesc += '+' + (gen.globalBoost * 100) + '% all income ';
    if (gen.crewCapacity) outputDesc += '+' + gen.crewCapacity + ' crew ';

    let ioInfo = '';
    if (gen.degrades && owned > 0) {
      const eff = ((s.ioEfficiency[gen.id] || 1) * 100).toFixed(0);
      ioInfo = `<div class="io-eff">Efficiency: ${eff}% <button class="repair-btn" data-genid="${gen.id}">Repair</button></div>`;
    }

    return `<div class="generator-row ${canAfford ? 'affordable' : 'expensive'}">
      <div class="gen-info">
        <span class="gen-icon">${gen.icon}</span>
        <div class="gen-details">
          <div class="gen-name">${gen.name} ${getGeneratorBadgeHTML(gen.id)}</div>
          <div class="gen-output">Owned: ${owned} | ${outputDesc}</div>
          ${ioInfo}
        </div>
      </div>
      <button class="gen-buy-btn ${canAfford ? '' : 'disabled'}" data-genid="${gen.id}">
        <div class="gen-cost">${currencySymbol}${ttip(cost)}</div>
        <div class="gen-buy-label">BUY${amt > 1 ? ' x' + amt : ''}</div>
      </button>
    </div>`;
  }

  function updateGeneratorCosts() {
    // Lightweight update for generator affordability
    const s = GameState.getState();
    document.querySelectorAll('.gen-buy-btn').forEach(btn => {
      const genId = btn.dataset.genid;
      const gen = Engine.findGenerator(genId);
      if (!gen) return;
      const currency = gen.costCurrency || 'credits';
      const owned = s.generators[genId] || 0;
      const cost = NumberFormatter.nextCost(gen.baseCost, gen.growth, owned);
      const canAfford = GameState.canAfford(currency, cost);
      btn.classList.toggle('disabled', !canAfford);
      btn.closest('.generator-row')?.classList.toggle('affordable', canAfford);
      btn.closest('.generator-row')?.classList.toggle('expensive', !canAfford);
    });
  }

  function updateRocketAssembly() {
    // Handled in updateGenerators for phase 1
    if (GameState.getState().currentPhase === 1) {
      updateGenerators();
    }
  }

  // ===== UPGRADES =====

  function updateUpgrades() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-upgrades');
    const phase = s.currentPhase;
    const upgrades = GameData.UPGRADES[phase] || [];

    let html = '<h3>Upgrades - Phase ' + phase + '</h3>';

    for (const upg of upgrades) {
      if (s.upgradesPurchased[upg.id]) {
        // Check if this upgrade is tierable and show tier-up button
        const isTierable = Expansion.TieredUpgrades.isTierable(upg);
        const currentTier = isTierable ? Expansion.TieredUpgrades.getCurrentTier(s, upg.id) : 0;
        const tierLabel = currentTier > 0 ? Expansion.UPGRADE_TIERS[currentTier - 1].label : '';
        const tierColor = currentTier > 0 ? Expansion.UPGRADE_TIERS[currentTier - 1].color : '';
        const maxed = currentTier >= 5;

        if (isTierable && !maxed) {
          const nextTier = currentTier + 1;
          const nextTierData = Expansion.UPGRADE_TIERS[nextTier - 1];
          const tierCost = Expansion.TieredUpgrades.getTierCost(upg, nextTier);
          const canAffordTier = GameState.canAfford(upg.currency, tierCost);
          const currSym = upg.currency === 'credits' ? '\u20A1' : upg.currency.toUpperCase() + ' ';

          html += `<div class="upgrade-row purchased" style="border-left:3px solid ${tierColor || '#2a2a4a'}">
            <div class="upg-info">
              <div class="upg-name">\u2714 ${upg.name} ${tierLabel ? '<span class="tier-badge" style="color:' + tierColor + '">[' + tierLabel + ']</span>' : ''}</div>
              <div class="upg-desc">${upg.desc} (x${Expansion.TieredUpgrades.getCumulativeMultiplier(s, upg.id)})</div>
            </div>
            <button class="upg-buy-btn tier-btn ${canAffordTier ? '' : 'disabled'}" data-tierid="${upg.id}" style="border-color:${nextTierData.color}">
              <div class="upg-cost">${currSym}${NumberFormatter.format(tierCost)}</div>
              <div>${nextTierData.label}</div>
            </button>
          </div>`;
        } else {
          html += `<div class="upgrade-row purchased" style="border-left:3px solid ${tierColor || '#2a2a4a'}">
            <div class="upg-info">
              <div class="upg-name">\u2714 ${upg.name} ${maxed ? '<span class="tier-badge" style="color:#B9F2FF">[MASTERED]</span>' : tierLabel ? '<span class="tier-badge" style="color:' + tierColor + '">[' + tierLabel + ']</span>' : ''}</div>
              <div class="upg-desc">${upg.desc}${currentTier > 0 ? ' (x' + Expansion.TieredUpgrades.getCumulativeMultiplier(s, upg.id) + ')' : ''}</div>
            </div>
          </div>`;
        }
        continue;
      }

      // Check if requirements met (hide if not)
      if (upg.req) {
        if (upg.req.generator && (s.generators[upg.req.generator] || 0) < upg.req.count) continue;
        if (upg.req.totalTaps && s.totalTaps < upg.req.totalTaps) continue;
        if (upg.req.allGeneratorsPhase) {
          const phaseGens = GameData.GENERATORS[upg.req.allGeneratorsPhase];
          if (phaseGens && !phaseGens.every(g => (s.generators[g.id] || 0) > 0)) continue;
        }
      }

      const canAfford = GameState.canAfford(upg.currency, upg.cost) &&
        (!upg.costSecondary || Object.entries(upg.costSecondary).every(([c, a]) => GameState.canAfford(c, a)));

      const currencySymbol = upg.currency === 'credits' ? '\u20A1' : upg.currency.toUpperCase() + ' ';
      let costStr = currencySymbol + NumberFormatter.format(upg.cost);
      if (upg.costSecondary) {
        for (const [c, a] of Object.entries(upg.costSecondary)) {
          costStr += ' + ' + (c === 'credits' ? '\u20A1' : c.toUpperCase() + ' ') + NumberFormatter.format(a);
        }
      }

      html += `<div class="upgrade-row ${canAfford ? 'affordable' : 'expensive'}">
        <div class="upg-info">
          <div class="upg-name">${upg.name}</div>
          <div class="upg-desc">${upg.desc}</div>
        </div>
        <button class="upg-buy-btn ${canAfford ? '' : 'disabled'}" data-upgid="${upg.id}">
          <div class="upg-cost">${costStr}</div>
          <div>BUY</div>
        </button>
      </div>`;
    }

    if (upgrades.length === 0) {
      html += '<p class="empty-msg">No upgrades available for this phase yet.</p>';
    }

    panel.innerHTML = html;

    panel.querySelectorAll('.upg-buy-btn:not(.tier-btn)').forEach(btn => {
      btn.addEventListener('click', () => {
        Engine.buyUpgrade(btn.dataset.upgid);
      });
    });
    panel.querySelectorAll('.tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = GameState.getState();
        const result = Expansion.TieredUpgrades.buyTier(s, btn.dataset.tierid);
        if (result) {
          const tier = Expansion.UPGRADE_TIERS[result - 1];
          showToast(`Upgrade ${tier.label}! x${Expansion.TieredUpgrades.getTierEffectMultiplier(result)}`, tier.color);
        }
        updateUpgrades();
        updateCurrencyBar();
      });
    });
  }

  // ===== ZONES =====

  function updateZones() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-zones');
    let html = '<h3>Zones</h3>';

    for (let i = 1; i <= 9; i++) {
      const phaseData = GameData.PHASES[i];
      const unlocked = i <= s.highestPhaseReached;
      const isCurrent = i === s.currentPhase;

      html += `<div class="zone-row ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}"
        ${unlocked ? 'data-phase="' + i + '"' : ''}>
        <div class="zone-icon">${phaseData.tapIcon}</div>
        <div class="zone-info">
          <div class="zone-name">Phase ${i}: ${phaseData.name}</div>
          <div class="zone-location">${phaseData.location}</div>
        </div>
        ${unlocked ? '<div class="zone-status">' + (isCurrent ? '\u25C6 Current' : 'Travel') + '</div>' :
          '<div class="zone-lock">\u{1F512} Locked</div>'}
      </div>`;
    }

    panel.innerHTML = html;

    panel.querySelectorAll('.zone-row.unlocked').forEach(row => {
      row.addEventListener('click', () => {
        const phase = parseInt(row.dataset.phase);
        if (phase) {
          s.currentPhase = phase;
          updateAll();
          switchTab('generators');
        }
      });
    });
  }

  // ===== CREW =====

  function updateCrew() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-crew');

    if (!s.crew.unlocked) {
      panel.innerHTML = '<p class="empty-msg">Crew system not yet unlocked. Purchase "Habitat Expansion" on the Moon.</p>';
      return;
    }

    const crewBonus = Engine.getCrewBonus();
    const hireCost = 100 * Math.pow(1.2, s.crew.totalAstronauts);
    const canHire = s.crew.totalAstronauts < s.crew.maxCapacity && GameState.canAfford('ore', hireCost);

    let html = `<h3>Crew</h3>
      <div class="crew-summary">
        <div>Crew: ${s.crew.totalAstronauts} / ${s.crew.maxCapacity}</div>
        <div>Total Bonus: +${(crewBonus * 100).toFixed(0)}% all generators</div>
      </div>
      <div class="crew-actions">
        <button class="action-btn ${canHire ? '' : 'disabled'}" id="hire-crew-btn">
          Hire Astronaut (${NumberFormatter.format(hireCost)} Ore)
        </button>
        <button class="action-btn" id="upgrade-all-crew-btn">Upgrade All</button>
      </div>
      <div class="crew-list">`;

    for (let i = 0; i < s.crew.astronauts.length; i++) {
      const a = s.crew.astronauts[i];
      const tierName = GameData.CREW_TIERS[a.tier].name;
      const canUpgrade = a.tier < 4;
      html += `<div class="crew-row">
        <div class="crew-name">${a.name}</div>
        <div class="crew-tier tier-${a.tier}">${tierName}</div>
        <div class="crew-bonus">+${(a.bonus * 100).toFixed(0)}%</div>
        ${canUpgrade ? `<button class="crew-upgrade-btn" data-idx="${i}">Upgrade</button>` : '<span class="max-tier">MAX</span>'}
      </div>`;
    }

    html += '</div>';
    panel.innerHTML = html;

    document.getElementById('hire-crew-btn')?.addEventListener('click', () => {
      Engine.hireCrew();
    });
    document.getElementById('upgrade-all-crew-btn')?.addEventListener('click', () => {
      Engine.upgradeAllCrew();
    });
    panel.querySelectorAll('.crew-upgrade-btn').forEach(btn => {
      btn.addEventListener('click', () => Engine.upgradeCrewMember(parseInt(btn.dataset.idx)));
    });
  }

  // ===== FLEET =====

  function updateFleet() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-fleet');

    if (s.highestPhaseReached < 5) {
      panel.innerHTML = '<p class="empty-msg">Fleet unlocks at Phase 5: The Asteroid Belt.</p>';
      return;
    }

    let totalShips = 0;
    const gens = GameData.GENERATORS[5] || [];
    let html = '<h3>Fleet</h3>';

    for (const gen of gens) {
      const count = s.generators[gen.id] || 0;
      totalShips += count;
    }

    html += `<div class="fleet-summary">Total Ships: ${totalShips}</div>`;
    html += '<div class="fleet-list">';
    for (const gen of gens) {
      const count = s.generators[gen.id] || 0;
      html += `<div class="fleet-row">
        <span class="fleet-icon">${gen.icon}</span>
        <span class="fleet-name">${gen.name}</span>
        <span class="fleet-count">x${count}</span>
      </div>`;
    }
    html += '</div>';
    panel.innerHTML = html;
  }

  // ===== RESEARCH =====

  function updateResearch() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-research');

    let html = '<h3>Research Tree</h3>';
    let currentTier = 0;

    for (const res of GameData.RESEARCH) {
      if (res.tier !== currentTier) {
        if (currentTier > 0) html += '</div>';
        currentTier = res.tier;
        html += `<div class="research-tier"><h4>Tier ${currentTier}</h4>`;
      }

      const purchased = s.researchPurchased[res.id];
      const reqMet = !res.req || s.researchPurchased[res.req];
      const canAfford = reqMet && !purchased && GameState.canAfford('rp', res.cost);

      html += `<div class="research-node ${purchased ? 'purchased' : ''} ${reqMet ? '' : 'locked'} ${canAfford ? 'affordable' : ''}">
        <div class="res-name">${purchased ? '\u2714 ' : ''}${res.name}</div>
        <div class="res-desc">${res.desc}</div>
        ${!purchased ? `<button class="res-buy-btn ${canAfford ? '' : 'disabled'}" data-resid="${res.id}">
          ${reqMet ? NumberFormatter.format(res.cost) + ' RP' : '\u{1F512} Requires: ' + (res.req || '')}
        </button>` : ''}
      </div>`;
    }
    html += '</div>';

    panel.innerHTML = html;

    panel.querySelectorAll('.res-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => Engine.buyResearch(btn.dataset.resid));
    });
  }

  // ===== LOG =====

  function updateLog() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-log');
    let html = '<h3>Captain\'s Log</h3><div class="log-entries">';

    for (const logId of s.captainsLog) {
      const entry = GameData.CAPTAINS_LOG.find(l => l.id === logId);
      if (!entry) continue;
      html += `<div class="log-entry">
        <div class="log-title">${entry.title}</div>
        <div class="log-text">${entry.text}</div>
      </div>`;
    }

    html += '</div>';
    panel.innerHTML = html;
  }

  // ===== STATS =====

  function updateStats() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-stats');
    const fmt = NumberFormatter.format;
    const ft = NumberFormatter.formatTime;

    const runTime = (Date.now() - (s.currentRunStartTime || s.firstPlayTimestamp)) / 1000;

    let html = `<h3>Statistics</h3>
      <div class="stats-section">
        <h4>Current Run</h4>
        <div class="stat-row"><span>Time Elapsed</span><span>${ft(runTime)}</span></div>
        <div class="stat-row"><span>Current Phase</span><span>${s.currentPhase}</span></div>
        <div class="stat-row"><span>Credits Earned</span><span>\u20A1${fmt(s.creditsThisRunEarned)}</span></div>
        <div class="stat-row"><span>Credits/sec</span><span>\u20A1${fmt(s.creditsPerSecond)}</span></div>
        <div class="stat-row"><span>Generators Owned</span><span>${fmt(GameData.getTotalGenerators(s))}</span></div>
        <div class="stat-row"><span>Crew</span><span>${s.crew.totalAstronauts}</span></div>
        <div class="stat-row"><span>Ships</span><span>${s.fleet.totalShips || 0}</span></div>
        <div class="stat-row"><span>Mars Terraform</span><span>${s.terraforming.marsPercent.toFixed(1)}%</span></div>
      </div>
      <div class="stats-section">
        <h4>All-Time</h4>
        <div class="stat-row"><span>Total Play Time</span><span>${ft(s.totalPlayTimeSeconds)}</span></div>
        <div class="stat-row"><span>Total Taps</span><span>${fmt(s.totalTaps)}</span></div>
        <div class="stat-row"><span>Total Credits Earned</span><span>\u20A1${fmt(s.creditsAllTimeEarned)}</span></div>
        <div class="stat-row"><span>Prestige Resets</span><span>${s.totalPrestigeCount}</span></div>
        <div class="stat-row"><span>Cosmic Dust (Lifetime)</span><span>${fmt(s.cosmicDustLifetime)}</span></div>
        <div class="stat-row"><span>Highest Phase</span><span>${s.highestPhaseReached}</span></div>
        <div class="stat-row"><span>Generators Purchased</span><span>${fmt(s.stats.totalGeneratorsEverPurchased)}</span></div>
        <div class="stat-row"><span>Crew Hired</span><span>${fmt(s.stats.totalCrewEverHired)}</span></div>
        <div class="stat-row"><span>Alien Signals</span><span>${s.stats.totalAlienSignalsDecoded}</span></div>
        <div class="stat-row"><span>Star Systems</span><span>${s.stats.totalStarSystemsColonized}</span></div>
        <div class="stat-row"><span>Achievements</span><span>${Object.keys(s.achievements).length} / ${GameData.ACHIEVEMENTS.length}</span></div>
        <div class="stat-row"><span>Log Entries</span><span>${s.captainsLog.length} / ${GameData.CAPTAINS_LOG.length}</span></div>
      </div>`;

    panel.innerHTML = html;
  }

  // ===== PRESTIGE =====

  function updatePrestigePanel() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-prestige');
    const fmt = NumberFormatter.format;

    const projectedCD = GameState.calculatePrestigeReward();
    const cdMult = (1 + s.cosmicDust * 0.01).toFixed(2);

    let html = `<h3>Prestige - Big Bang</h3>
      <div class="prestige-info">
        <div class="prestige-stat">
          <span>Cosmic Dust</span><span class="cd-icon">${fmt(s.cosmicDust)} CD</span>
        </div>
        <div class="prestige-stat">
          <span>CD Multiplier</span><span>x${cdMult} all income</span>
        </div>
        <div class="prestige-stat">
          <span>This Run Earnings</span><span>\u20A1${fmt(s.creditsThisRunEarned)}</span>
        </div>
        <div class="prestige-stat">
          <span>Projected CD Reward</span><span class="cd-projected">${fmt(projectedCD)} CD</span>
        </div>
        <div class="prestige-stat">
          <span>Prestiges Completed</span><span>${s.totalPrestigeCount}</span>
        </div>
      </div>`;

    // Big Bang button
    if (s.highestPhaseReached >= 8 && projectedCD > 0) {
      html += `<button class="prestige-btn" id="prestige-btn">
        <span class="prestige-icon">\u{1F4A5}</span>
        <span>BIG BANG</span>
        <span class="prestige-reward">+${fmt(projectedCD)} CD</span>
      </button>
      <div class="prestige-warning">This will reset all progress except permanent upgrades!</div>`;
    } else {
      html += `<div class="prestige-locked">Reach the Galactic Core (Phase 8) to unlock Prestige.</div>`;
    }

    // CD Shop
    html += '<h3>Cosmic Dust Shop</h3><div class="cd-shop">';
    for (const item of GameData.CD_SHOP) {
      const purchased = s.cdShopPurchased[item.id];
      const reqMet = !item.req || s.cdShopPurchased[item.req];
      const canAfford = reqMet && !purchased && GameState.canAfford('cosmicDust', item.cost);

      html += `<div class="cd-shop-item ${purchased ? 'purchased' : ''} ${canAfford ? 'affordable' : ''} ${reqMet ? '' : 'locked'}">
        <div class="cd-item-info">
          <div class="cd-item-name">${purchased ? '\u2714 ' : ''}${item.name}</div>
          <div class="cd-item-desc">${item.desc}</div>
        </div>
        ${!purchased ? `<button class="cd-buy-btn ${canAfford ? '' : 'disabled'}" data-cdid="${item.id}">
          ${reqMet ? item.cost + ' CD' : '\u{1F512}'}
        </button>` : ''}
      </div>`;
    }
    html += '</div>';

    panel.innerHTML = html;

    document.getElementById('prestige-btn')?.addEventListener('click', () => {
      if (s.settings.confirmPrestige) {
        showModal('Confirm Prestige',
          `<p>Are you sure? You will earn <strong>${fmt(projectedCD)} CD</strong>.</p>
           <p>All progress will be reset except permanent upgrades.</p>`,
          [
            { label: 'Cancel', action: () => hideModal() },
            { label: 'BIG BANG', action: () => { hideModal(); doPrestige(); }, className: 'danger' }
          ]);
      } else {
        doPrestige();
      }
    });

    panel.querySelectorAll('.cd-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => Engine.buyCDShopItem(btn.dataset.cdid));
    });
  }

  function doPrestige() {
    const cdEarned = GameState.performPrestige();
    if (cdEarned <= 0) return;

    Engine.addLogEntry('log22');
    const s = GameState.getState();
    if (s.totalPrestigeCount === 1) Engine.unlockAchievement('ach_prestige');
    if (s.totalPrestigeCount >= 5) Engine.addLogEntry('log23');
    if (s.totalPrestigeCount >= 10) Engine.addLogEntry('log24');

    // Expansion C: Prestige rewards — random eggs and booster
    const eggCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < eggCount; i++) {
      if (typeof Expansion !== 'undefined' && Expansion.Eggs) {
        Expansion.Eggs.grantRandomEgg(s);
      }
    }
    if (typeof Expansion !== 'undefined' && Expansion.Boosters && Expansion.Boosters.grantRandom) {
      Expansion.Boosters.grantRandom(s);
    }

    // Cosmic Egg on Prestige (CD shop)
    if (s.cdShopPurchased && s.cdShopPurchased['cd_cosmicegg']) {
      if (typeof Expansion !== 'undefined' && Expansion.Eggs && Expansion.Eggs.grantEgg) {
        Expansion.Eggs.grantEgg(s, 'cosmic');
      }
    }

    // Audio & juice
    if (typeof AdaptiveAudio !== 'undefined') AdaptiveAudio.playPrestigeSound();
    if (typeof Juice !== 'undefined') {
      Juice.Haptics.prestige();
      Juice.ScreenShake.prestige();
      Juice.Confetti.prestige();
    }

    playBigBangAnimation(cdEarned);
  }

  function playBigBangAnimation(cdEarned) {
    const overlay = document.getElementById('big-bang-overlay');
    const canvas = document.getElementById('big-bang-canvas');
    const textEl = document.getElementById('big-bang-text');
    overlay.classList.remove('hidden');
    textEl.classList.add('hidden');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const startTime = Date.now();
    const totalDuration = 8000;

    // Starfield for collapse
    const bbStars = [];
    for (let i = 0; i < 200; i++) {
      bbStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5
      });
    }
    // Explosion particles
    const bbParticles = [];

    function animate() {
      const elapsed = Date.now() - startTime;
      const t = elapsed / totalDuration;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (t < 0.125) {
        // Phase 1: Zoom out to show galaxy (0-1s)
        const p = t / 0.125;
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const star of bbStars) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
        // Galaxy glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150 * (1 + p));
        grad.addColorStop(0, 'rgba(255,255,200,0.3)');
        grad.addColorStop(1, 'rgba(255,255,200,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 150 * (1 + p), 0, Math.PI * 2);
        ctx.fill();

      } else if (t < 0.375) {
        // Phase 2: Stars collapsing inward (1-3s)
        const p = (t - 0.125) / 0.25;
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const star of bbStars) {
          const sx = star.x + (cx - star.x) * p;
          const sy = star.y + (cy - star.y) * p;
          ctx.fillStyle = `rgba(255,255,${Math.floor(200 + 55 * p)},${0.8 + 0.2 * p})`;
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * (1 + p * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (t < 0.5) {
        // Phase 3: Compress to single point (3-4s)
        const p = (t - 0.375) / 0.125;
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const pointSize = 100 * (1 - p) + 3;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pointSize);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.5, 'rgba(255,255,200,0.8)');
        grad.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, pointSize, 0, Math.PI * 2);
        ctx.fill();

      } else if (t < 0.5625) {
        // Phase 4: FLASH — white screen (4-4.5s)
        const p = (t - 0.5) / 0.0625;
        ctx.fillStyle = `rgba(255,255,255,${1 - p * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Spawn explosion particles at peak
        if (bbParticles.length === 0) {
          for (let i = 0; i < 100; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 8;
            const hue = Math.random() * 360;
            bbParticles.push({
              x: cx, y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              hue: hue,
              size: 2 + Math.random() * 4,
              life: 1
            });
          }
        }

      } else if (t < 0.8125) {
        // Phase 5: Explosion expanding outward (4.5-6.5s)
        const p = (t - 0.5625) / 0.25;
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, p * 0.8)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const part of bbParticles) {
          part.x += part.vx;
          part.y += part.vy;
          part.life -= 0.005;
          if (part.life > 0) {
            ctx.fillStyle = `hsla(${part.hue},80%,60%,${part.life})`;
            ctx.beginPath();
            ctx.arc(part.x, part.y, part.size * part.life, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Center glow fading
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200 * p);
        glow.addColorStop(0, `rgba(255,255,200,${0.5 * (1 - p)})`);
        glow.addColorStop(1, 'rgba(255,255,200,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, 200 * p, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Phase 6-8: Fade to black, then text (6.5-8s)
        const p = (t - 0.8125) / 0.1875;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (p > 0.3) {
          textEl.classList.remove('hidden');
          textEl.innerHTML = `<div class="bb-line1">A new universe begins...</div>
            <div class="bb-cd-reward">+${NumberFormatter.format(cdEarned)} Cosmic Dust</div>`;
        }
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - let user click to proceed
        overlay.onclick = () => {
          overlay.classList.add('hidden');
          overlay.onclick = null;
          textEl.classList.add('hidden');
          updateAll();
          switchTab('generators');
          SceneRenderer.setPhase(GameState.getState().currentPhase);
        };
      }
    }

    requestAnimationFrame(animate);
  }

  // ===== ACHIEVEMENTS =====

  function updateAchievements() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-achievements');

    let html = '<h3>Achievements</h3>';
    const categories = ['progression', 'earning', 'tapping', 'generator', 'crew', 'terraform', 'prestige',
      'speed', 'combo', 'critical', 'collection', 'luckyDrop', 'egg', 'contract', 'synergy', 'weather',
      'milestone', 'booster', 'secret'];
    const catNames = ['Progression', 'Earning', 'Tapping', 'Generators', 'Crew', 'Terraforming', 'Prestige',
      'Speed', 'Combo', 'Critical', 'Collection', 'Lucky Drop', 'Egg', 'Contract', 'Synergy', 'Weather',
      'Milestone', 'Booster', 'Secret'];

    categories.forEach((cat, i) => {
      const achs = GameData.ACHIEVEMENTS.filter(a => a.category === cat);
      html += `<h4>${catNames[i]}</h4>`;
      for (const ach of achs) {
        const unlocked = s.achievements[ach.id];
        if (ach.secret && !unlocked) {
          html += `<div class="ach-row locked"><div class="ach-name">???</div><div class="ach-desc">Secret achievement</div></div>`;
        } else {
          html += `<div class="ach-row ${unlocked ? 'unlocked' : ''}">
            <div class="ach-name">${unlocked ? '\u2714 ' : '\u25CB '}${ach.name}</div>
            <div class="ach-desc">${ach.desc}</div>
          </div>`;
        }
      }
    });

    panel.innerHTML = html;
  }

  // ===== SETTINGS =====

  function updateSettings() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-settings');

    panel.innerHTML = `<h3>Settings</h3>
      <div class="settings-list">
        <div class="setting-row">
          <label>Music Volume</label>
          <input type="range" min="0" max="100" value="${s.settings.musicVolume * 100}" id="set-music">
        </div>
        <div class="setting-row">
          <label>SFX Volume</label>
          <input type="range" min="0" max="100" value="${s.settings.sfxVolume * 100}" id="set-sfx">
        </div>
        <div class="setting-row">
          <label>Number Format</label>
          <select id="set-numformat">
            <option value="abbreviated" ${s.settings.numberFormat === 'abbreviated' ? 'selected' : ''}>Abbreviated</option>
            <option value="scientific" ${s.settings.numberFormat === 'scientific' ? 'selected' : ''}>Scientific</option>
          </select>
        </div>
        <div class="setting-row">
          <label>Particle Effects</label>
          <input type="checkbox" id="set-particles" ${s.settings.particleEffects ? 'checked' : ''}>
        </div>
        <div class="setting-row">
          <label>Screen Shake</label>
          <input type="checkbox" id="set-shake" ${s.settings.screenShake ? 'checked' : ''}>
        </div>
        <div class="setting-row">
          <label>Confirm Prestige</label>
          <input type="checkbox" id="set-confirm" ${s.settings.confirmPrestige ? 'checked' : ''}>
        </div>
        <div class="setting-row">
          <label>Notifications</label>
          <input type="checkbox" id="set-notifications" ${s.settings.notificationsEnabled ? 'checked' : ''}>
        </div>
        <div class="setting-row">
          <label>Auto-Save Interval</label>
          <select id="set-autosave">
            <option value="15" ${s.settings.autoSaveInterval === 15 ? 'selected' : ''}>15s</option>
            <option value="30" ${s.settings.autoSaveInterval === 30 ? 'selected' : ''}>30s</option>
            <option value="60" ${s.settings.autoSaveInterval === 60 ? 'selected' : ''}>60s</option>
          </select>
        </div>
        <div class="setting-row">
          <button class="action-btn" id="export-btn">Export Save</button>
          <button class="action-btn" id="import-btn">Import Save</button>
        </div>
        <div class="setting-row">
          <button class="action-btn danger" id="reset-btn">Hard Reset</button>
        </div>
        <div class="setting-row credits-info">
          <p>Deep Space Inc. v${s.version}</p>
          <p>An idle space exploration tycoon game</p>
        </div>
      </div>`;

    // Event listeners
    document.getElementById('set-music')?.addEventListener('input', e => {
      s.settings.musicVolume = e.target.value / 100;
      if (typeof AdaptiveAudio !== 'undefined') AdaptiveAudio.setVolumes(s.settings.musicVolume, s.settings.sfxVolume);
    });
    document.getElementById('set-sfx')?.addEventListener('input', e => {
      s.settings.sfxVolume = e.target.value / 100;
      if (typeof AdaptiveAudio !== 'undefined') AdaptiveAudio.setVolumes(s.settings.musicVolume, s.settings.sfxVolume);
    });
    document.getElementById('set-numformat')?.addEventListener('change', e => {
      s.settings.numberFormat = e.target.value;
    });
    document.getElementById('set-particles')?.addEventListener('change', e => {
      s.settings.particleEffects = e.target.checked;
    });
    document.getElementById('set-shake')?.addEventListener('change', e => {
      s.settings.screenShake = e.target.checked;
    });
    document.getElementById('set-confirm')?.addEventListener('change', e => {
      s.settings.confirmPrestige = e.target.checked;
    });
    document.getElementById('set-notifications')?.addEventListener('change', e => {
      s.settings.notificationsEnabled = e.target.checked;
    });
    document.getElementById('set-autosave')?.addEventListener('change', e => {
      s.settings.autoSaveInterval = parseInt(e.target.value);
      Engine.resetSaveInterval();
    });

    document.getElementById('export-btn')?.addEventListener('click', () => {
      const b64 = GameState.exportSave();
      navigator.clipboard.writeText(b64).then(() => {
        showModal('Save Exported', '<p>Save data copied to clipboard!</p>',
          [{ label: 'OK', action: hideModal }]);
      }).catch(() => {
        showModal('Save Exported', `<textarea class="export-text" readonly>${b64}</textarea><p>Copy the text above.</p>`,
          [{ label: 'OK', action: hideModal }]);
      });
    });

    document.getElementById('import-btn')?.addEventListener('click', () => {
      showModal('Import Save', `<textarea class="import-text" id="import-text" placeholder="Paste save data here..."></textarea>`,
        [
          { label: 'Cancel', action: hideModal },
          {
            label: 'Import', action: () => {
              const txt = document.getElementById('import-text')?.value;
              if (txt && GameState.importSave(txt.trim())) {
                hideModal();
                location.reload();
              } else {
                alert('Invalid save data');
              }
            }
          }
        ]);
    });

    document.getElementById('reset-btn')?.addEventListener('click', () => {
      showModal('Hard Reset',
        `<p>Type RESET to confirm. This cannot be undone!</p>
         <input type="text" id="reset-confirm" placeholder="Type RESET">`,
        [
          { label: 'Cancel', action: hideModal },
          {
            label: 'Reset', action: () => {
              if (document.getElementById('reset-confirm')?.value === 'RESET') {
                GameState.hardReset();
                hideModal();
                location.reload();
              }
            }, className: 'danger'
          }
        ]);
    });
  }

  // ===== GALAXY MAP (Phase 8) =====

  function updateGalaxyMap() {
    // Updates handled in generators panel for phase 8
    if (GameState.getState().currentPhase === 8) {
      updateGenerators();
    }
  }

  // ===== FLOATING NUMBERS =====

  let rapidTapAccum = 0;
  let rapidTapTimer = null;
  let rapidTapEl = null;
  let lastTapTimestamps = [];

  function showFloatingNumber(amount, tapResult) {
    const container = document.getElementById('floating-numbers');
    const now = Date.now();
    const isAuto = tapResult && tapResult.isAuto;

    // Track tap rate for rapid-tap combining (manual taps only)
    if (!isAuto) {
      lastTapTimestamps.push(now);
      lastTapTimestamps = lastTapTimestamps.filter(t => now - t < 1000);
    }
    const tapsPerSec = lastTapTimestamps.filter(t => now - t < 1000).length;

    // Trigger particle burst on tap (manual taps get bigger bursts at high speed)
    const tapBtn = document.getElementById('tap-btn');
    if (tapBtn && !isAuto) {
      const rect = tapBtn.getBoundingClientRect();
      const sceneArea = document.getElementById('scene-area');
      const sceneRect = sceneArea.getBoundingClientRect();
      const px = rect.left + rect.width / 2 - sceneRect.left;
      const py = rect.top + rect.height / 2 - sceneRect.top;
      // Particles scale up with rapid tapping (spec: particles get bigger at >5/sec)
      const particleCount = tapsPerSec > 5 ? Math.min(12, 6 + tapsPerSec) : 6;
      const color = (tapResult && tapResult.type === 'critical') ? '#E74C3C' :
                    (tapResult && tapResult.type === 'super') ? '#FF69B4' : '#FFD700';
      SceneRenderer.addParticleBurst(px, py, color, particleCount);
    }

    // Handle drop-type floaters (no combining)
    if (tapResult && tapResult.type === 'drop') {
      const el = document.createElement('div');
      el.className = 'floating-num drop-float';
      el.textContent = tapResult.dropName + '!';
      el.style.color = tapResult.dropColor;
      el.style.fontSize = '18px';
      el.style.left = (40 + Math.random() * 20) + '%';
      el.style.bottom = '120px';
      container.appendChild(el);
      requestAnimationFrame(() => { el.style.transform = 'translateY(-80px)'; el.style.opacity = '0'; });
      setTimeout(() => el.remove(), 800);
      return;
    }

    // Special floaters for crits/supers (no combining, always full size)
    if (tapResult && (tapResult.type === 'super' || tapResult.type === 'critical')) {
      const el = document.createElement('div');
      el.className = 'floating-num critical-float';
      if (tapResult.type === 'super') {
        el.textContent = 'SUPER! +\u20A1' + NumberFormatter.formatSmart(amount);
        el.style.color = '#FF69B4';
        el.style.fontSize = '22px';
        el.style.textShadow = '0 0 12px rgba(255,105,180,0.8)';
      } else {
        el.textContent = 'CRIT! +\u20A1' + NumberFormatter.formatSmart(amount);
        el.style.color = '#E74C3C';
        el.style.fontSize = '20px';
        el.style.textShadow = '0 0 8px rgba(231,76,60,0.6)';
      }
      el.style.left = (40 + Math.random() * 20) + '%';
      el.style.bottom = '120px';
      container.appendChild(el);
      requestAnimationFrame(() => { el.style.transform = 'translateY(-80px)'; el.style.opacity = '0'; });
      setTimeout(() => el.remove(), 800);
      return;
    }

    // Auto-tap floaters: smaller, lighter, no combining
    if (isAuto) {
      const el = document.createElement('div');
      el.className = 'floating-num auto-tap-float';
      el.textContent = '+\u20A1' + NumberFormatter.formatSmart(amount);
      el.style.left = (42 + Math.random() * 16) + '%';
      el.style.bottom = '110px';
      el.style.fontSize = '12px';
      el.style.color = 'rgba(255,215,0,0.55)';
      container.appendChild(el);
      requestAnimationFrame(() => { el.style.transform = 'translateY(-60px)'; el.style.opacity = '0'; });
      setTimeout(() => el.remove(), 600);
      return;
    }

    // Rapid tap combining: if >5 taps/sec, accumulate into one larger floater
    if (tapsPerSec > 5) {
      rapidTapAccum += amount;
      if (rapidTapEl && rapidTapEl.parentNode) {
        rapidTapEl.textContent = '+\u20A1' + NumberFormatter.formatSmart(rapidTapAccum);
        rapidTapEl.style.fontSize = Math.min(28, 16 + tapsPerSec * 0.7) + 'px';
        rapidTapEl.style.textShadow = '0 0 ' + Math.min(16, tapsPerSec * 2) + 'px rgba(255,215,0,0.6)';
      } else {
        rapidTapEl = document.createElement('div');
        rapidTapEl.className = 'floating-num rapid-float';
        rapidTapEl.textContent = '+\u20A1' + NumberFormatter.formatSmart(rapidTapAccum);
        rapidTapEl.style.left = '45%';
        rapidTapEl.style.bottom = '120px';
        rapidTapEl.style.fontWeight = '700';
        container.appendChild(rapidTapEl);
      }
      clearTimeout(rapidTapTimer);
      rapidTapTimer = setTimeout(() => {
        if (rapidTapEl) {
          requestAnimationFrame(() => { rapidTapEl.style.transform = 'translateY(-80px)'; rapidTapEl.style.opacity = '0'; });
          setTimeout(() => { if (rapidTapEl) { rapidTapEl.remove(); rapidTapEl = null; } }, 800);
        }
        rapidTapAccum = 0;
      }, 200);
      return;
    }

    // Normal single floater
    rapidTapAccum = 0;
    const el = document.createElement('div');
    el.className = 'floating-num';
    el.textContent = '+\u20A1' + NumberFormatter.formatSmart(amount);
    el.style.left = (40 + Math.random() * 20) + '%';
    el.style.bottom = '120px';
    container.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = 'translateY(-80px)';
      el.style.opacity = '0';
    });

    setTimeout(() => el.remove(), 800);
  }

  // ===== MODALS =====

  function showModal(title, content, buttons = []) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');

    let html = `<h3>${title}</h3>${content}<div class="modal-buttons">`;
    buttons.forEach((btn, i) => {
      html += `<button class="modal-btn ${btn.className || ''}" data-idx="${i}">${btn.label}</button>`;
    });
    html += '</div>';
    modal.innerHTML = html;

    modal.querySelectorAll('.modal-btn').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        if (buttons[idx] && buttons[idx].action) buttons[idx].action();
      });
    });

    overlay.classList.remove('hidden');
  }

  function hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  // ===== TOAST NOTIFICATIONS =====

  function showToast(msg, color) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    if (color) toast.style.borderColor = color;
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function showMilestoneNotification(genName, milestone) {
    showToast(`${genName} reached ${milestone.count}! x${milestone.mult} ${milestone.badge}`, '#FFD700');
  }

  function showSynergyNotification(synergy) {
    showToast(`SYNERGY: ${synergy.name}! x${synergy.bonus}`, '#9B59B6');
  }

  function showContractCompleteNotification(contract) {
    showToast(`CONTRACT COMPLETE: ${contract.name}!`, '#27AE60');
  }

  function showCollectionNotification(itemId) {
    let itemName = itemId;
    for (const setKey in Expansion.COLLECTIONS) {
      const item = Expansion.COLLECTIONS[setKey].items.find(i => i.id === itemId);
      if (item) { itemName = item.name; break; }
    }
    showToast(`NEW COLLECTION: ${itemName}!`, '#4A90D9');
  }

  // ===== SYNERGY PANEL =====

  function updateSynergies() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-synergies');
    if (!panel) return;
    let html = '<h3>\u{1F517} Synergies</h3>';

    const allSynergies = Expansion.SYNERGIES;
    const unlocked = s.synergies.unlocked;

    let activeCount = 0;
    for (const syn of allSynergies) {
      const isUnlocked = unlocked.includes(syn.id);
      if (isUnlocked) activeCount++;
      const genNames = syn.gens.map(gid => {
        const gen = Engine.findGenerator(gid);
        return gen ? gen.name : gid;
      });
      const progress = syn.gens.map(gid => Math.min(syn.minCount, s.generators[gid] || 0));
      const allMet = progress.every(p => p >= syn.minCount);

      html += `<div class="synergy-row ${isUnlocked ? 'active' : ''}" ${!isUnlocked && !allMet ? 'style="opacity:0.5"' : ''}>
        <div class="syn-name">${syn.name} ${isUnlocked ? '\u2705' : ''}</div>
        <div class="syn-gens">${genNames.join(' + ')}</div>
        <div class="syn-progress">${isUnlocked ? 'x' + syn.bonus + ' bonus active' : progress.map((p, i) => p + '/' + syn.minCount).join(', ')}</div>
      </div>`;
    }

    if (activeCount === 0) {
      html += '<p class="empty-msg">No synergies unlocked yet. Own pairs of generators to activate synergies!</p>';
    }

    panel.innerHTML = html;
  }

  // ===== ROCKET SKINS PANEL =====

  function updateRocketSkins() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-skins');
    if (!panel) return;
    let html = '<h3>\u{1F680} Rocket Skins</h3>';
    html += `<div class="current-skin">Current: ${s.rocket.currentSkin}</div>`;

    for (const skin of Expansion.ROCKET_SKINS) {
      const owned = s.rocket.unlockedSkins.includes(skin.id);
      const equipped = s.rocket.currentSkin === skin.id;
      const canBuy = !owned && GameState.canAfford('it', skin.cost);

      html += `<div class="skin-row ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}">
        <div class="skin-info">
          <div class="skin-name">${skin.name} ${equipped ? '(EQUIPPED)' : ''}</div>
          <div class="skin-desc">${skin.desc}</div>
        </div>`;

      if (!owned && skin.cost > 0) {
        html += `<button class="skin-buy-btn ${canBuy ? '' : 'disabled'}" data-skinid="${skin.id}">
          <div>${skin.cost} IT</div><div>BUY</div>
        </button>`;
      } else if (owned && !equipped) {
        html += `<button class="skin-equip-btn" data-skinid="${skin.id}">EQUIP</button>`;
      }
      html += '</div>';
    }

    panel.innerHTML = html;

    panel.querySelectorAll('.skin-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = GameState.getState();
        if (Expansion.RocketSkins.buySkin(s, btn.dataset.skinid)) {
          showToast('Skin unlocked: ' + btn.dataset.skinid, '#FFD700');
          updateRocketSkins();
          updateCurrencyBar();
        }
      });
    });
    panel.querySelectorAll('.skin-equip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = GameState.getState();
        Expansion.RocketSkins.equipSkin(s, btn.dataset.skinid);
        updateRocketSkins();
      });
    });
  }

  // ===== BANNERS =====

  function showAchievementBanner(ach) {
    const banner = document.getElementById('achievement-banner');
    banner.innerHTML = `<div class="ach-banner-content">
      <span class="ach-banner-icon">\u{1F3C6}</span>
      <span class="ach-banner-text"><strong>${ach.name}</strong> — ${ach.desc}</span>
    </div>`;
    banner.classList.remove('hidden');
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
      banner.classList.add('hidden');
    }, 3000);
  }

  function showAlienSignalPopup() {
    showModal('ALIEN SIGNAL DETECTED!',
      '<p class="alien-signal">An alien signal has been decoded!</p><p>+1 Alien Signal</p>',
      [{ label: 'Decode', action: hideModal }]);
  }

  // ===== EVENTS =====

  function showEventBanner(event) {
    const banner = document.getElementById('event-banner');
    const typeClass = event.type === 'positive' ? 'event-positive' :
      event.type === 'negative' ? 'event-negative' : 'event-neutral';
    const isMiniGame = event.icon === '\uD83C\uDFAE';
    const playBtn = isMiniGame ? '<button class="mg-play-btn" id="mg-accept-btn">PLAY</button>' : '';
    banner.innerHTML = `<div class="event-content ${typeClass}">
      <span class="event-icon">${event.icon}</span>
      <span class="event-name">${event.name}</span>
      <span class="event-desc">${event.desc}</span>
      ${playBtn}
      <span class="event-timer" id="event-timer"></span>
    </div>`;
    banner.classList.remove('hidden');

    if (isMiniGame) {
      const btn = document.getElementById('mg-accept-btn');
      if (btn) btn.addEventListener('click', () => GameEvents.acceptMiniGame());
    }
  }

  function hideEventBanner() {
    document.getElementById('event-banner').classList.add('hidden');
  }

  function updateEventTimer(remaining) {
    const timer = document.getElementById('event-timer');
    if (timer) timer.textContent = Math.ceil(remaining) + 's';
  }

  // ===== PHASE TRANSITION =====

  function playPhaseTransition(phase) {
    const overlay = document.getElementById('transition-overlay');
    const phaseData = GameData.PHASES[phase];
    overlay.innerHTML = `<div class="transition-content">
      <div class="transition-icon">${phaseData.tapIcon}</div>
      <div class="transition-title">Phase ${phase}</div>
      <div class="transition-name">${phaseData.name}</div>
      <div class="transition-location">${phaseData.location}</div>
    </div>`;
    overlay.classList.remove('hidden');
    overlay.classList.add('active');

    // Juice: confetti, shake, flash
    if (typeof Juice !== 'undefined') {
      Juice.ScreenShake.phaseTransition();
      Juice.ScreenFlash.phaseTransition();
      Juice.Confetti.phaseUnlock();
    }
    if (typeof AdaptiveAudio !== 'undefined') AdaptiveAudio.setPhase(phase);

    // Design system: update phase colors during transition
    updatePhaseColors();

    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.classList.add('hidden');
      updateAll();
      updateTapButton();
      updateTabVisibility();
      SceneRenderer.setPhase(phase);

      // Phase transition color flash
      const container = document.getElementById('game-container');
      if (container) {
        container.classList.add('phase-transitioning');
        setTimeout(() => container.classList.remove('phase-transitioning'), 600);
      }
    }, 3000);
  }

  // ===== WELCOME BACK =====

  function showWelcomeBack(earnings) {
    const fmt = NumberFormatter.format;
    const ft = NumberFormatter.formatTime;
    let rewardList = '';
    if (earnings.credits > 0) rewardList += `<div>\u20A1${fmt(earnings.credits)}</div>`;
    if (earnings.rp > 0) rewardList += `<div>${fmt(earnings.rp)} RP</div>`;
    if (earnings.ore > 0) rewardList += `<div>${fmt(earnings.ore)} Ore</div>`;
    if (earnings.rm > 0) rewardList += `<div>${fmt(earnings.rm)} RM</div>`;
    if (earnings.sd > 0) rewardList += `<div>${fmt(earnings.sd)} SD</div>`;

    showModal('Welcome Back, Captain!',
      `<p>You were away for ${ft(earnings.time)}</p>
       <p>Your operations earned:</p>
       <div class="welcome-rewards">${rewardList}</div>`,
      [
        { label: 'COLLECT', action: () => { GameState.applyOfflineEarnings(earnings); hideModal(); } },
        { label: 'DOUBLE IT', action: () => {
          const doubled = { ...earnings };
          doubled.credits *= 2;
          doubled.rp *= 2;
          doubled.ore *= 2;
          doubled.rm *= 2;
          doubled.sd *= 2;
          doubled.terraforming *= 2;
          GameState.applyOfflineEarnings(doubled);
          hideModal();
        }}
      ]);
  }

  // ===== DAILY REWARD =====

  function showDailyReward(reward) {
    const fmt = NumberFormatter.format;
    showModal(`Day ${reward.day} Streak!`,
      `<p>${reward.reward.desc}</p>
       ${reward.amount > 0 ? `<p class="daily-amount">${fmt(reward.amount)}</p>` :
        '<p>Bonus activated!</p>'}
       <p>Streak multiplier: x${reward.multiplier.toFixed(1)}</p>`,
      [{ label: 'Claim', action: hideModal }]);
  }

  // ===== EXPANSION UI: COMBO DISPLAY =====
  function updateComboDisplay() {
    const s = GameState.getState();
    const el = document.getElementById('combo-display');
    if (!el) return;
    if (s.combo.current >= 5) {
      el.classList.remove('hidden');
      const tier = Expansion.Combo.getTier(s.combo.current);
      document.getElementById('combo-count').textContent = s.combo.current;
      document.getElementById('combo-label').textContent = tier.label;
      document.getElementById('combo-mult').textContent = 'x' + tier.mult;
      // Set color intensity by tier
      const intensity = Math.min(1, s.combo.current / 100);
      el.style.borderColor = `hsl(${50 - intensity * 50}, 100%, ${50 + intensity * 20}%)`;
    } else {
      el.classList.add('hidden');
    }
  }

  // ===== EXPANSION UI: WEATHER INDICATOR =====
  function updateWeatherIndicator() {
    const s = GameState.getState();
    const el = document.getElementById('weather-indicator');
    if (!el) return;
    const name = Expansion.Weather.getCurrentName(s);
    const effect = Expansion.Weather.getCurrentEffect(s);
    el.classList.remove('hidden');
    document.getElementById('weather-name').textContent = name + (effect ? ' \u2728' : '');
  }

  // ===== EXPANSION UI: LUCKY DROP =====
  function updateLuckyDropDisplay() {
    const s = GameState.getState();
    const el = document.getElementById('lucky-drop');
    if (!el) return;
    const drop = Expansion.LuckyDrops.activeDrop;
    if (drop) {
      el.classList.remove('hidden');
      el.style.left = drop.x + '%';
      el.style.top = drop.y + '%';
      el.style.background = drop.type.color;
      el.textContent = '\u2B50';
    } else {
      el.classList.add('hidden');
    }
  }

  // ===== EXPANSION UI: GOLDEN RUSH BANNER =====
  function updateGoldenRushBanner() {
    const s = GameState.getState();
    const el = document.getElementById('golden-rush-banner');
    if (!el) return;
    if (s.goldenRush.active) {
      el.classList.remove('hidden');
      const remaining = Math.ceil((s.goldenRush.endTime - Date.now()) / 1000);
      document.getElementById('golden-rush-text').textContent = 'GOLDEN RUSH! ' + remaining + 's';
    } else {
      el.classList.add('hidden');
    }
  }

  // ===== EXPANSION UI: NEXT UNLOCK BAR =====
  function updateNextUnlockBar() {
    const s = GameState.getState();
    const bar = document.getElementById('next-unlock-bar');
    if (!bar) return;

    // Use enhanced TeaserSystem from Juice if available, else fall back to Expansion.NextUnlock
    let teaser = null;
    if (typeof Juice !== 'undefined') {
      teaser = Juice.TeaserSystem.getNextUnlock(s);
    } else {
      teaser = Expansion.NextUnlock.get(s);
    }

    if (teaser) {
      bar.classList.remove('hidden');
      const pct = Math.floor(teaser.progress * 100);
      const infoEl = document.getElementById('next-unlock-info');
      const progressEl = document.getElementById('next-unlock-progress-inner');

      if (pct >= 100) {
        infoEl.textContent = '\u{1F389} READY! ' + teaser.name;
        bar.classList.remove('almost-there');
        bar.classList.add('ready');
      } else if (teaser.almostThere) {
        infoEl.textContent = '\u{1F512} ALMOST THERE! ' + teaser.name + ' — ' + pct + '%';
        bar.classList.add('almost-there');
        bar.classList.remove('ready');
      } else {
        infoEl.textContent = '\u{1F512} NEXT: ' + teaser.name + ' — ' + pct + '%';
        bar.classList.remove('almost-there', 'ready');
      }
      if (progressEl) progressEl.style.width = Math.min(100, pct) + '%';
    } else {
      bar.classList.add('hidden');
    }
  }

  // ===== EXPANSION UI: IDLE STREAK DISPLAY =====
  function updateIdleStreakDisplay() {
    const el = document.getElementById('idle-streak-display');
    if (!el) return;
    const s = GameState.getState();
    const bonus = s.streaks.idleStreakBonus;
    if (bonus > 0) {
      const elapsed = Math.floor((Date.now() - s.streaks.idleStreakStartTimestamp) / 1000);
      const mins = Math.floor(elapsed / 60);
      el.classList.remove('hidden');
      el.textContent = `Idle ${mins}m +${Math.round(bonus * 100)}%`;
    } else {
      el.classList.add('hidden');
    }
  }

  // ===== EXPANSION UI: ACTIVE BOOSTER HUD =====
  function updateActiveBoosterHUD() {
    const el = document.getElementById('active-boosters-hud');
    if (!el) return;
    const s = GameState.getState();
    if (s.boosters.active.length === 0) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    let html = '';
    for (const b of s.boosters.active) {
      const bt = Expansion.BOOSTER_TYPES.find(t => t.id === b.type);
      const secs = Math.ceil(b.remainingMs / 1000);
      const m = Math.floor(secs / 60);
      const sec = secs % 60;
      html += `<span class="booster-badge" style="border-color:${bt ? bt.color : '#fff'}">${bt ? bt.icon : ''} ${m}:${String(sec).padStart(2, '0')}</span>`;
    }
    el.innerHTML = html;
  }

  // ===== EXPANSION UI: COLLECTION PANEL =====
  function updateCollection() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-collection');
    if (!panel) return;
    const progress = Expansion.Collections.getProgress(s);
    let html = `<h3>\u{1F4DA} Collection Album (${progress.found}/${progress.total})</h3>`;

    for (const setKey in Expansion.COLLECTIONS) {
      const set = Expansion.COLLECTIONS[setKey];
      const completed = s.collection.setsCompleted.includes(setKey);
      const found = set.items.filter(i => s.collection.items[i.id]).length;
      html += `<div class="collection-set ${completed ? 'completed' : ''}">
        <h4>${set.name} (${found}/${set.items.length}) ${completed ? '\u2705' : ''}</h4>
        ${completed ? `<div class="set-bonus">\u{1F31F} ${set.bonus}</div>` : ''}
        <div class="collection-grid">`;
      for (const item of set.items) {
        const found = s.collection.items[item.id];
        html += `<div class="collection-item ${found ? 'found' : 'locked'} rarity-${item.rarity}">
          <div class="col-item-name">${found ? item.name : '???'}</div>
          <div class="col-item-hint">${found ? item.rarity : item.hint}</div>
        </div>`;
      }
      html += '</div></div>';
    }
    panel.innerHTML = html;
  }

  // ===== EXPANSION UI: CONTRACTS PANEL =====
  function updateContracts() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-contracts');
    if (!panel) return;
    let html = `<h3>\u{1F4CB} Contracts (${s.contracts.completed} completed)</h3>`;

    if (s.contracts.active.length === 0) {
      html += '<p class="empty-msg">No active contracts. New ones will appear shortly!</p>';
    }

    for (const c of s.contracts.active) {
      const progress = Math.min(1, c.progress / c.target);
      const timeLeft = Math.max(0, Math.ceil(c.timeRemaining));
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      html += `<div class="contract-row">
        <div class="contract-info">
          <div class="contract-name">${c.name}</div>
          <div class="contract-progress-outer">
            <div class="contract-progress-inner" style="width:${progress * 100}%"></div>
          </div>
          <div class="contract-detail">${NumberFormatter.format(c.progress)} / ${NumberFormatter.format(c.target)} — ${mins}:${String(secs).padStart(2, '0')}</div>
        </div>
      </div>`;
    }
    panel.innerHTML = html;
  }

  // ===== EXPANSION UI: BOOSTERS PANEL =====
  function updateBoosters() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-boosters');
    if (!panel) return;
    let html = `<h3>\u26A1 Boosters</h3>`;

    // Active boosters
    if (s.boosters.active.length > 0) {
      html += '<h4>Active</h4>';
      for (const b of s.boosters.active) {
        const bt = Expansion.BOOSTER_TYPES.find(t => t.id === b.type);
        const secs = Math.ceil(b.remainingMs / 1000);
        html += `<div class="booster-active" style="border-color:${bt ? bt.color : '#fff'}">
          <span class="booster-icon">${bt ? bt.icon : ''}</span>
          <span class="booster-name">${bt ? bt.name : b.type}</span>
          <span class="booster-timer">x${b.mult} — ${secs}s</span>
        </div>`;
      }
    }

    // Inventory
    html += `<h4>Inventory (${s.boosters.inventory.length}/5)</h4>`;
    if (s.boosters.inventory.length === 0) {
      html += '<p class="empty-msg">No boosters. Earn them from eggs, drops, and contracts!</p>';
    }
    s.boosters.inventory.forEach((item, idx) => {
      const bt = Expansion.BOOSTER_TYPES.find(t => t.id === item.type);
      html += `<div class="booster-item rarity-${item.rarity}" style="border-color:${bt ? bt.color : '#fff'}">
        <span class="booster-icon">${bt ? bt.icon : ''}</span>
        <div class="booster-info">
          <div class="booster-name">${bt ? bt.name : item.type}</div>
          <div class="booster-desc">${bt ? (bt.target === 'instant' ? 'Instant' : bt.duration + 's x' + bt.mult) : ''}</div>
        </div>
        <button class="booster-use-btn" onclick="(function(){ const s=GameState.getState(); Expansion.Boosters.activate(s,${idx}); UI.updateBoosters(); })()">USE</button>
      </div>`;
    });
    panel.innerHTML = html;
  }

  // ===== EXPANSION UI: EGGS PANEL =====
  function updateEggs() {
    const s = GameState.getState();
    const panel = document.getElementById('panel-eggs');
    if (!panel) return;
    let html = `<h3>\u{1F95A} Egg Incubator (${s.eggs.totalHatched} hatched)</h3>`;
    html += '<div class="egg-slots">';

    for (let i = 0; i < s.eggs.maxSlots; i++) {
      const egg = s.eggs.slots[i];
      if (egg) {
        const progress = Expansion.Eggs.getProgress(egg);
        const ready = Expansion.Eggs.isReady(egg);
        html += `<div class="egg-slot filled" style="border-color:${egg.color}">
          <div class="egg-icon" style="color:${egg.color}">\u{1F95A}</div>
          <div class="egg-name">${egg.name}</div>
          <div class="egg-progress-outer">
            <div class="egg-progress-inner" style="width:${progress * 100}%;background:${egg.color}"></div>
          </div>
          <div class="egg-status">${ready ? 'READY!' : Math.floor(progress * 100) + '%'}</div>
          ${ready ? '<button class="egg-hatch-btn" data-slot="' + i + '">HATCH</button>' : ''}
        </div>`;
      } else {
        html += `<div class="egg-slot empty">
          <div class="egg-icon">\u2B55</div>
          <div class="egg-name">Empty Slot</div>
        </div>`;
      }
    }
    html += '</div>';
    panel.innerHTML = html;

    // Attach hatch button handlers
    panel.querySelectorAll('.egg-hatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.dataset.slot);
        const s = GameState.getState();
        const egg = s.eggs.slots[slot];
        const result = Expansion.Eggs.hatch(s, slot);
        if (result) {
          const name = egg ? egg.name : 'Egg';
          showModal('Hatched!', '<p>' + name + ' hatched!</p>', [{ label: 'OK', action: hideModal }]);
        }
        updateEggs();
      });
    });
  }

  function updateEggProgress() {
    const s = GameState.getState();
    const slots = document.querySelectorAll('.egg-slot.filled');
    if (slots.length === 0) return;
    let idx = 0;
    for (let i = 0; i < s.eggs.maxSlots; i++) {
      const egg = s.eggs.slots[i];
      if (egg && idx < slots.length) {
        const progress = Expansion.Eggs.getProgress(egg);
        const bar = slots[idx].querySelector('.egg-progress-inner');
        const status = slots[idx].querySelector('.egg-status');
        if (bar) bar.style.width = (progress * 100) + '%';
        if (status) status.textContent = Expansion.Eggs.isReady(egg) ? 'READY!' : Math.floor(progress * 100) + '%';
        idx++;
      }
    }
  }

  // ===== EXPANSION UI: GENERATOR MILESTONE BADGES =====
  function getGeneratorBadgeHTML(genId) {
    const s = GameState.getState();
    const badge = Expansion.Milestones.getBadge(s, genId);
    if (!badge) return '';
    return `<span class="gen-milestone-badge">${badge}</span>`;
  }

  // ===== RARE ASTEROID (Phase 5+) =====
  function showRareAsteroid(isCritical) {
    let el = document.getElementById('rare-asteroid');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rare-asteroid';
      document.getElementById('scene-area').appendChild(el);
    }
    el.className = 'rare-asteroid' + (isCritical ? ' critical' : '');
    el.innerHTML = `<div class="asteroid-icon">${isCritical ? '\uD83C\uDF1F' : '\u2604\uFE0F'}</div>
      <div class="asteroid-label">${isCritical ? 'CRITICAL!' : 'RARE ASTEROID'}</div>
      <div class="asteroid-taps" id="asteroid-taps"></div>
      <div class="asteroid-timer" id="asteroid-timer"></div>`;
    el.classList.remove('hidden');
    el.onclick = () => GameEvents.tapRareAsteroid();
  }

  function updateRareAsteroid(tapsLeft, timeLeft, isCritical) {
    const tapsEl = document.getElementById('asteroid-taps');
    const timerEl = document.getElementById('asteroid-timer');
    if (tapsEl) tapsEl.textContent = tapsLeft + ' taps left';
    if (timerEl) timerEl.textContent = Math.ceil(timeLeft) + 's';
  }

  function hideRareAsteroid() {
    const el = document.getElementById('rare-asteroid');
    if (el) el.classList.add('hidden');
  }

  // ===== ALIEN ARTIFACT FRAGMENT (Phase 4) =====
  function showArtifactFragment() {
    let el = document.getElementById('artifact-fragment');
    if (!el) {
      el = document.createElement('div');
      el.id = 'artifact-fragment';
      document.getElementById('scene-area').appendChild(el);
    }
    el.className = 'artifact-fragment';
    el.innerHTML = '<div class="artifact-icon">\uD83D\uDD2E</div><div class="artifact-label">ARTIFACT</div>';
    el.classList.remove('hidden');
    // Random position within scene
    el.style.left = (20 + Math.random() * 60) + '%';
    el.style.top = (30 + Math.random() * 40) + '%';
    el.onclick = () => GameEvents.collectArtifactFragment();
  }

  function hideArtifactFragment() {
    const el = document.getElementById('artifact-fragment');
    if (el) el.classList.add('hidden');
  }

  // ===== DESIGN SYSTEM: PHASE COLOR SYSTEM (Section 65) =====

  let _currentPhaseClass = '';

  function updatePhaseColors() {
    const s = GameState.getState();
    const phase = s.currentPhase;
    const container = document.getElementById('game-container');
    if (!container) return;

    const newClass = 'phase-' + phase;
    if (newClass === _currentPhaseClass) return;

    // Remove old phase class
    if (_currentPhaseClass) {
      container.classList.remove(_currentPhaseClass);
    }

    // Add new phase class with transition flash
    container.classList.add(newClass);
    _currentPhaseClass = newClass;

    // Update meta theme-color for mobile browser chrome
    const themeColors = {
      1: '#0a0a2e', 2: '#1a3060', 3: '#12122a',
      4: '#3a1810', 5: '#080808', 6: '#2a1810',
      7: '#120a20', 8: '#1a0520', 9: '#050510'
    };
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = themeColors[phase] || '#0a0a1a';

    // Add combo ring class to tap button if combo is active
    updateTapComboRing();
  }

  function updateTapComboRing() {
    const s = GameState.getState();
    const tapBtn = document.getElementById('tap-btn');
    if (!tapBtn) return;
    if (s.combo && s.combo.current >= 10) {
      tapBtn.classList.add('combo-active');
    } else {
      tapBtn.classList.remove('combo-active');
    }
  }

  // ===== DESIGN SYSTEM: MORE SHEET (Section 67 Tab Bar) =====

  let moreSheetOpen = false;

  // Tab definitions for the More sheet — overflow tabs beyond the main 5
  const MORE_SHEET_TABS = [
    { tab: 'crew', icon: '\uD83D\uDC64', label: 'Crew' },
    { tab: 'fleet', icon: '\uD83D\uDE80', label: 'Fleet' },
    { tab: 'research', icon: '\uD83D\uDD2C', label: 'Research' },
    { tab: 'log', icon: '\uD83D\uDCD6', label: 'Log' },
    { tab: 'prestige', icon: '\u2733', label: 'Prestige' },
    { tab: 'collection', icon: '\uD83D\uDCDA', label: 'Album' },
    { tab: 'contracts', icon: '\uD83D\uDCCB', label: 'Contracts' },
    { tab: 'boosters', icon: '\u26A1', label: 'Boosters' },
    { tab: 'synergies', icon: '\uD83D\uDD17', label: 'Synergies' },
    { tab: 'skins', icon: '\uD83C\uDFA8', label: 'Skins' },
    { tab: 'eggs', icon: '\uD83E\uDD5A', label: 'Eggs' },
    { tab: 'settings', icon: '\u2699\uFE0F', label: 'Settings' }
  ];

  function setupMoreSheet() {
    const moreBtn = document.getElementById('more-tab-btn');
    if (!moreBtn) return;

    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMoreSheet();
    });

    const backdrop = document.getElementById('more-sheet-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => closeMoreSheet());
    }
  }

  function toggleMoreSheet() {
    if (moreSheetOpen) {
      closeMoreSheet();
    } else {
      openMoreSheet();
    }
  }

  function openMoreSheet() {
    const overlay = document.getElementById('more-sheet-overlay');
    const grid = document.getElementById('more-sheet-grid');
    if (!overlay || !grid) return;

    // Build grid of visible overflow tabs
    const s = GameState.getState();
    let html = '';

    for (const item of MORE_SHEET_TABS) {
      // Check visibility
      const tabBtn = document.querySelector('.tab-btn[data-tab="' + item.tab + '"]');
      const isVisible = tabBtn && !tabBtn.classList.contains('hidden');
      if (!isVisible && item.tab !== 'settings') continue;

      html += '<div class="more-sheet-item" data-tab="' + item.tab + '">' +
        '<span class="more-sheet-icon">' + item.icon + '</span>' +
        '<span class="more-sheet-label">' + item.label + '</span>' +
        '</div>';
    }

    grid.innerHTML = html;

    // Attach click handlers
    grid.querySelectorAll('.more-sheet-item').forEach(el => {
      el.addEventListener('click', () => {
        const tab = el.dataset.tab;
        closeMoreSheet();
        switchTab(tab);
      });
    });

    overlay.classList.remove('hidden');
    moreSheetOpen = true;
  }

  function closeMoreSheet() {
    const overlay = document.getElementById('more-sheet-overlay');
    if (overlay) overlay.classList.add('hidden');
    moreSheetOpen = false;
  }

  // ===== DESIGN SYSTEM: ENHANCED CURRENCY BAR (Section 67) =====

  // Currency chip color mapping
  const CURRENCY_COLORS = {
    credits: '#FFD700',
    rp: '#4A90D9',
    ore: '#A8A8A8',
    rm: '#9B59B6',
    as: '#2ECC71',
    sd: '#F0E6FF',
    cd: 'rainbow',
    it: '#FFD700'
  };

  // Currency icon mapping
  const CURRENCY_ICONS = {
    credits: '\u20A1',
    rp: 'RP',
    ore: 'Ore',
    rm: 'RM',
    as: 'AS',
    sd: 'SD',
    cd: 'CD',
    it: 'IT'
  };

  // ===== Section 72: Tab Transition System =====

  let lastTabIndex = 0;

  const TAB_ORDER = ['generators', 'upgrades', 'zones', 'achievements', 'stats',
    'crew', 'fleet', 'research', 'log', 'prestige', 'collection',
    'contracts', 'boosters', 'synergies', 'skins', 'eggs', 'settings'];

  function getTabIndex(tab) {
    const idx = TAB_ORDER.indexOf(tab);
    return idx >= 0 ? idx : 0;
  }

  function animateTabTransition(fromTab, toTab) {
    const toIdx = getTabIndex(toTab);
    const fromIdx = getTabIndex(fromTab);
    const panel = document.getElementById('panel-' + toTab);
    if (!panel) return;

    // Determine direction
    const direction = toIdx > fromIdx ? 'right' : 'left';
    panel.classList.remove('entering-left', 'entering-right');

    // Force reflow to restart animation
    void panel.offsetWidth;
    panel.classList.add(direction === 'right' ? 'entering-right' : 'entering-left');

    // Clean up animation class after it finishes
    setTimeout(() => {
      panel.classList.remove('entering-left', 'entering-right');
    }, 350);

    lastTabIndex = toIdx;
  }

  // ===== Section 72: Enhanced switchTab with transitions and aria =====
  const _originalSwitchTab = switchTab;

  // Override switchTab to add transitions
  switchTab = function(tab) {
    const prevTab = currentTab;

    // Update aria-selected on tab buttons
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
    });

    // Update buy toggle aria
    const buyBtns = document.querySelectorAll('.buy-amt');
    buyBtns.forEach(b => {
      b.setAttribute('aria-checked', b.classList.contains('active') ? 'true' : 'false');
    });

    _originalSwitchTab(tab);

    // Animate transition
    if (prevTab !== tab) {
      animateTabTransition(prevTab, tab);
    }

    // Close more sheet if open
    if (moreSheetOpen) closeMoreSheet();
  };

  // ===== Section 74: Confirmation Dialog System =====

  function showConfirmation(title, message, onConfirm, onCancel) {
    const overlay = document.getElementById('confirm-overlay');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');
    const backdrop = document.getElementById('confirm-backdrop');

    if (!overlay) return;

    titleEl.textContent = title;
    msgEl.textContent = message;
    overlay.classList.remove('hidden');

    // Focus trap
    okBtn.focus();

    const cleanup = () => {
      overlay.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      if (backdrop) backdrop.onclick = null;
    };

    okBtn.onclick = () => {
      cleanup();
      if (onConfirm) onConfirm();
    };

    cancelBtn.onclick = () => {
      cleanup();
      if (onCancel) onCancel();
    };

    if (backdrop) {
      backdrop.onclick = () => {
        cleanup();
        if (onCancel) onCancel();
      };
    }

    // ESC key to cancel
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        if (onCancel) onCancel();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // ===== Section 74: Welcome Back Modal Enhancement =====

  function showWelcomeBackEnhanced(earnings) {
    if (!earnings) return;
    const timeStr = formatDuration(earnings.time);
    let html = '<h3 style="text-align:center;margin-bottom:12px;">Welcome Back!</h3>';
    html += '<p style="text-align:center;color:var(--ds-text-secondary);font-size:13px;">You were away for ' + timeStr + '</p>';
    html += '<div class="welcome-back-currencies">';

    const currencies = [
      { key: 'credits', label: 'Credits', val: earnings.credits },
      { key: 'rp', label: 'Research Points', val: earnings.rp },
      { key: 'ore', label: 'Lunar Ore', val: earnings.ore },
      { key: 'rm', label: 'Rare Minerals', val: earnings.rm },
      { key: 'sd', label: 'Stardust', val: earnings.sd }
    ];

    let delay = 0;
    for (const c of currencies) {
      if (c.val > 0) {
        html += '<div class="welcome-back-row" style="animation-delay:' + delay + 'ms">';
        html += '<span class="welcome-back-label">' + c.label + '</span>';
        html += '<span class="welcome-back-value counting">+' + NumberFormatter.format(c.val) + '</span>';
        html += '</div>';
        delay += 200;
      }
    }

    html += '</div>';
    html += '<button onclick="GameState.applyOfflineEarnings(GameState.calculateOfflineEarnings());UI.hideModal();" class="btn-primary" style="width:100%;margin-top:8px;">Collect All</button>';

    showModal(html);
  }

  function formatDuration(seconds) {
    if (seconds < 60) return Math.floor(seconds) + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
    if (seconds < 86400) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return h + 'h ' + m + 'm';
    }
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    return d + 'd ' + h + 'h';
  }

  // ===== Section 83: Empty State Rendering =====

  function renderEmptyState(panelId) {
    const key = panelId.replace('panel-', '');
    const data = GameData.EMPTY_STATES[key];
    if (!data) return '';

    return '<div class="empty-state">' +
      '<div class="empty-state-icon">' + data.icon + '</div>' +
      '<div class="empty-state-title">' + data.title + '</div>' +
      '<div class="empty-state-text">' + data.text + '</div>' +
      (data.hint ? '<div class="empty-state-hint">' + data.hint + '</div>' : '') +
      '</div>';
  }

  // ===== Section 80: Theme System UI =====

  function applyTheme(themeId) {
    const s = GameState.getState();
    const container = document.getElementById('game-container');
    if (!container) return;

    // Remove all theme classes
    const themeClasses = Object.values(GameData.THEMES).map(t => t.cssClass).filter(Boolean);
    themeClasses.forEach(cls => container.classList.remove(cls));

    // Apply new theme
    const theme = GameData.THEMES[themeId];
    if (theme && theme.cssClass) {
      container.classList.add(theme.cssClass);
    }

    s.settings.theme = themeId;
  }

  function purchaseTheme(themeId) {
    const s = GameState.getState();
    const theme = GameData.THEMES[themeId];
    if (!theme) return false;
    if (s.settings.purchasedThemes.includes(themeId)) return true; // Already owned

    if (!GameState.canAfford(theme.currency, theme.cost)) return false;
    GameState.spendCurrency(theme.currency, theme.cost);
    s.settings.purchasedThemes.push(themeId);
    applyTheme(themeId);

    if (typeof Juice !== 'undefined') {
      Juice.Celebrations.play(2, { title: 'New Theme!', subtitle: theme.name, icon: '\uD83C\uDFA8' });
    }
    return true;
  }

  // ===== Section 85: Accessibility Helpers =====

  function announceToScreenReader(message) {
    const s = GameState.getState();
    if (!s.settings.screenReaderAnnouncements) return;

    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    announcer.textContent = '';
    // Brief delay so screen reader picks up the change
    setTimeout(() => { announcer.textContent = message; }, 100);
  }

  function applyAccessibilitySettings() {
    const s = GameState.getState();
    const container = document.getElementById('game-container');
    if (!container) return;

    // Reduced motion
    if (s.settings.reducedMotion) {
      container.classList.add('perf-reduced');
    } else {
      container.classList.remove('perf-reduced');
    }

    // Large text
    if (s.settings.largeText) {
      document.documentElement.style.fontSize = '16px';
    } else {
      document.documentElement.style.fontSize = '';
    }

    // Colorblind mode
    container.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (s.settings.colorblindMode !== 'none') {
      container.classList.add('colorblind-' + s.settings.colorblindMode);
    }
  }

  // ===== Section 77: Progress Bar Helpers =====

  function createProgressBar(pct, size, label) {
    const sizeClass = size === 'sm' ? 'ds-progress-sm' : size === 'lg' ? 'ds-progress-lg' : '';
    const almostClass = pct >= 90 ? 'almost-full' : '';
    let html = '<div class="ds-progress ' + sizeClass + '">';
    html += '<div class="ds-progress-fill ' + almostClass + '" style="width:' + Math.min(100, pct) + '%"></div>';
    html += '</div>';
    if (label) {
      html += '<div style="font-family:var(--ds-font-mono);font-size:var(--ds-type-caption);color:var(--ds-text-tertiary);margin-top:2px;">' + label + '</div>';
    }
    return html;
  }

  function createCircularGauge(pct, size, label) {
    const radius = size === 'sm' ? 24 : size === 'lg' ? 48 : 36;
    const strokeWidth = size === 'sm' ? 3 : size === 'lg' ? 5 : 4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - pct / 100);

    let html = '<div class="ds-ring-gauge" style="width:' + (radius * 2 + strokeWidth * 2) + 'px;height:' + (radius * 2 + strokeWidth * 2) + 'px;">';
    html += '<svg width="' + (radius * 2 + strokeWidth * 2) + '" height="' + (radius * 2 + strokeWidth * 2) + '">';
    html += '<circle class="ring-track" cx="' + (radius + strokeWidth) + '" cy="' + (radius + strokeWidth) + '" r="' + radius + '" stroke-width="' + strokeWidth + '"/>';
    html += '<circle class="ring-fill" cx="' + (radius + strokeWidth) + '" cy="' + (radius + strokeWidth) + '" r="' + radius + '" stroke-width="' + strokeWidth + '" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '"/>';
    html += '</svg>';
    if (label) {
      html += '<div class="ring-label">' + label + '</div>';
    }
    html += '</div>';
    return html;
  }

  function createTerraformMegaBar(pct) {
    let html = '<div class="ds-mega-bar">';
    html += '<div class="ds-mega-bar-fill terraform" style="width:' + Math.min(100, pct) + '%"></div>';
    html += '<div class="ds-mega-bar-label">' + pct.toFixed(1) + '% Terraformed</div>';
    html += '</div>';
    return html;
  }

  // ===== Section 84: Error State UI =====

  function showSaveError() {
    if (typeof Game !== 'undefined' && Game.ErrorRecovery) {
      Game.ErrorRecovery.showError('Save failed! Check storage space.');
    }
  }

  function showOfflineCapWarning() {
    if (typeof Juice !== 'undefined' && Juice.ToastQueue) {
      Juice.ToastQueue.add('warning', 'Offline Cap', 'Maximum 24 hours of offline earnings collected.');
    }
  }

  return {
    init, updateAll, updateTick, updateGenerators, updateUpgrades,
    updateCurrencyBar, updateRocketAssembly, updateCrew, updateFleet,
    updateResearch, updatePrestigePanel, updateGalaxyMap,
    showFloatingNumber, showModal, hideModal, showAchievementBanner,
    showEventBanner, hideEventBanner, updateEventTimer,
    playPhaseTransition, showWelcomeBack, showDailyReward,
    showAlienSignalPopup, switchTab, showTab, getBuyAmount, updateSettings,
    updateCollection, updateContracts, updateBoosters, updateEggs,
    updateSynergies, updateRocketSkins,
    showRareAsteroid, updateRareAsteroid, hideRareAsteroid,
    showArtifactFragment, hideArtifactFragment,
    showToast, showMilestoneNotification, showSynergyNotification,
    showContractCompleteNotification, showCollectionNotification,
    updatePhaseColors, updateTapComboRing, closeMoreSheet,
    // Part 8/8 additions
    showConfirmation, showWelcomeBackEnhanced, renderEmptyState,
    applyTheme, purchaseTheme, applyAccessibilitySettings,
    announceToScreenReader, createProgressBar, createCircularGauge,
    createTerraformMegaBar, showSaveError, showOfflineCapWarning,
    animateTabTransition, formatDuration
  };
})();
