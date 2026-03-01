// state.js — Game state management, save/load, prestige
'use strict';

const GameState = (() => {
  const SAVE_KEY = 'deepSpaceInc_save';
  const VERSION = '2.0.0';

  function createDefaultState() {
    return {
      version: VERSION,
      firstPlayTimestamp: Date.now(),
      totalPlayTimeSeconds: 0,
      lastOnlineTimestamp: Date.now(),
      currentPhase: 1,
      highestPhaseReached: 1,
      totalPrestigeCount: 0,
      currentRunStartTime: Date.now(),

      credits: 0,
      creditsPerSecond: 0,
      creditsPerTap: 1,
      creditsAllTimeEarned: 0,
      creditsThisRunEarned: 0,
      researchPoints: 0,
      rpPerSecond: 0,
      lunarOre: 0,
      orePerSecond: 0,
      rareMinerals: 0,
      rmPerSecond: 0,
      alienSignals: 0,
      stardust: 0,
      sdPerSecond: 0,
      cosmicDust: 0,
      cosmicDustLifetime: 0,
      infinityTokens: 0,

      globalCreditMultiplier: 1.0,
      globalRPMultiplier: 1.0,
      globalOreMultiplier: 1.0,
      tapMultiplier: 1.0,
      offlineEarningsMultiplier: 0.5,
      cosmicDustMultiplier: 1.0,
      terraformMultiplier: 1.0,
      eventCreditMultiplier: 1.0,
      eventTapMultiplier: 1.0,
      eventRPMultiplier: 1.0,
      callistoBoost: 0,

      totalTaps: 0,
      autoTapPerSecond: 0,
      luckyTapEnabled: false,

      generators: {},
      generatorMultipliers: {},
      phaseMultipliers: {},

      upgradesPurchased: {},
      researchPurchased: {},
      cdShopPurchased: {},

      rocketParts: {
        hull: false,
        engine: false,
        fuelTank: false,
        noseCone: false,
        navigationComputer: false
      },
      rocketLaunched: false,

      crew: {
        totalAstronauts: 0,
        astronauts: [],
        maxCapacity: 0,
        unlocked: false
      },

      fleet: {
        unlocked: false,
        totalShips: 0
      },

      terraforming: {
        marsPercent: 0.0,
        marsPerSecond: 0.0
      },

      starSystems: {
        discovered: ['sol'],
        colonized: ['sol'],
        currentSystem: 'sol',
        totalSystems: 1
      },

      multiverse: {
        unlocked: false,
        universesCompleted: [],
        currentUniverse: null
      },

      achievements: {},
      captainsLog: ['log1'],

      dailyReward: {
        lastClaimDate: null,
        currentStreak: 0,
        longestStreak: 0
      },

      activeEvent: null,
      lastEventTime: 0,
      lastASCheckTime: 0,
      rareAsteroidActive: false,
      lastRareAsteroidTime: 0,

      tutorialStep: 0,
      tutorialComplete: false,

      // Phase 6 sub-zone tracking
      currentSubZone: null,
      ioEfficiency: {},

      // Alien artifact fragments
      alienArtifacts: 0,
      artifactDecoderPurchased: false,

      // Anomaly state
      _nextSystemDiscount: 0,
      _tempSpeedMult: 1,
      _tempSpeedEndTime: 0,

      settings: {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        notificationsEnabled: true,
        numberFormat: 'abbreviated',
        particleEffects: true,
        screenShake: true,
        confirmPrestige: true,
        autoSaveInterval: 30
      },

      // Stats tracking
      stats: {
        totalGeneratorsEverPurchased: 0,
        totalCrewEverHired: 0,
        totalAlienSignalsDecoded: 0,
        totalStarSystemsColonized: 1,
        fastestPhaseReach: {},
        lastTapTime: 0,
        noTapDuration: 0
      },

      // ===== EXPANSION v2.0 FIELDS =====

      // Combo System
      combo: {
        current: 0,
        bestThisSession: 0,
        bestAllTime: 0,
        lastTapTimestamp: 0
      },

      // Critical Taps
      criticalTaps: {
        chance: 0.02,
        multiplier: 10,
        superChance: 0.001,
        superMultiplier: 100,
        totalCriticals: 0,
        totalSuperCriticals: 0
      },

      // Lucky Drops
      luckyDrops: {
        totalCaught: 0,
        totalMissed: 0,
        lastDropTimestamp: 0,
        cosmicFragmentsCaught: 0,
        nextDropIn: 30 + Math.random() * 60
      },

      // Generator Milestones
      generatorMilestones: {},

      // Synergies
      synergies: {
        unlocked: []
      },

      // Upgrade Tiers
      upgradeTiers: {},

      // Collection Album
      collection: {
        items: {},
        setsCompleted: []
      },

      // Contracts
      contracts: {
        active: [],
        completed: 0,
        lastRefresh: 0,
        lastGenerated: 0
      },

      // Boosters
      boosters: {
        inventory: [],
        active: [],
        totalUsed: 0
      },

      // Eggs
      eggs: {
        slots: [null, null, null],
        maxSlots: 3,
        totalHatched: 0
      },

      // Weather
      weather: {
        current: 'default',
        lastChange: 0,
        nextChangeIn: 600 + Math.random() * 1200
      },

      // Streaks
      streaks: {
        purchaseStreak: 0,
        lastPurchaseTimestamp: 0,
        idleStreakStartTimestamp: Date.now(),
        idleStreakBonus: 0
      },

      // Rocket Skin
      rocket: {
        currentSkin: 'default',
        unlockedSkins: ['default'],
        paintColor: null
      },

      // Titles
      titles: {
        current: 'Captain',
        unlocked: ['Captain']
      },

      // Golden Rush
      goldenRush: {
        active: false,
        generatorId: null,
        endTime: 0,
        nextRushIn: 600 + Math.random() * 600
      },

      // Flying Bonus
      flyingBonus: {
        nextIn: 300 + Math.random() * 600
      }
    };
  }

  let state = createDefaultState();

  function getState() {
    return state;
  }

  function save() {
    try {
      state.lastOnlineTimestamp = Date.now();
      const json = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, json);
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  function load() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return false;
      const saved = JSON.parse(json);
      if (saved && saved.version) {
        state = Object.assign(createDefaultState(), saved);
        // Ensure nested objects are properly merged
        state.rocketParts = Object.assign(createDefaultState().rocketParts, saved.rocketParts || {});
        state.crew = Object.assign(createDefaultState().crew, saved.crew || {});
        state.terraforming = Object.assign(createDefaultState().terraforming, saved.terraforming || {});
        state.starSystems = Object.assign(createDefaultState().starSystems, saved.starSystems || {});
        state.multiverse = Object.assign(createDefaultState().multiverse, saved.multiverse || {});
        state.dailyReward = Object.assign(createDefaultState().dailyReward, saved.dailyReward || {});
        state.settings = Object.assign(createDefaultState().settings, saved.settings || {});
        state.stats = Object.assign(createDefaultState().stats, saved.stats || {});
        // Expansion v2.0 nested merges
        state.combo = Object.assign(createDefaultState().combo, saved.combo || {});
        state.criticalTaps = Object.assign(createDefaultState().criticalTaps, saved.criticalTaps || {});
        state.luckyDrops = Object.assign(createDefaultState().luckyDrops, saved.luckyDrops || {});
        state.synergies = Object.assign(createDefaultState().synergies, saved.synergies || {});
        state.collection = Object.assign(createDefaultState().collection, saved.collection || {});
        state.contracts = Object.assign(createDefaultState().contracts, saved.contracts || {});
        state.boosters = Object.assign(createDefaultState().boosters, saved.boosters || {});
        state.eggs = Object.assign(createDefaultState().eggs, saved.eggs || {});
        state.weather = Object.assign(createDefaultState().weather, saved.weather || {});
        state.streaks = Object.assign(createDefaultState().streaks, saved.streaks || {});
        state.rocket = Object.assign(createDefaultState().rocket, saved.rocket || {});
        state.titles = Object.assign(createDefaultState().titles, saved.titles || {});
        state.goldenRush = Object.assign(createDefaultState().goldenRush, saved.goldenRush || {});
        state.flyingBonus = Object.assign(createDefaultState().flyingBonus, saved.flyingBonus || {});
        return true;
      }
    } catch (e) {
      console.error('Load failed:', e);
    }
    return false;
  }

  function exportSave() {
    save();
    const json = JSON.stringify(state);
    return btoa(json);
  }

  function importSave(b64) {
    try {
      const json = atob(b64);
      const saved = JSON.parse(json);
      if (saved && saved.version) {
        state = Object.assign(createDefaultState(), saved);
        save();
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
    }
    return false;
  }

  function hardReset() {
    state = createDefaultState();
    save();
  }

  function calculateOfflineEarnings() {
    const now = Date.now();
    const offlineMs = now - state.lastOnlineTimestamp;
    const offlineSec = Math.min(offlineMs / 1000, 86400); // cap 24h

    if (offlineSec < 60) return null; // less than 1 min, skip

    const earnings = {
      credits: state.creditsPerSecond * offlineSec * state.offlineEarningsMultiplier,
      rp: state.rpPerSecond * offlineSec * state.offlineEarningsMultiplier,
      ore: state.orePerSecond * offlineSec * state.offlineEarningsMultiplier,
      rm: state.rmPerSecond * offlineSec * state.offlineEarningsMultiplier,
      sd: state.sdPerSecond * offlineSec * state.offlineEarningsMultiplier,
      terraforming: state.terraforming.marsPerSecond * offlineSec * state.offlineEarningsMultiplier,
      time: offlineSec
    };

    return earnings;
  }

  function applyOfflineEarnings(earnings) {
    state.credits += earnings.credits;
    state.creditsAllTimeEarned += earnings.credits;
    state.creditsThisRunEarned += earnings.credits;
    state.researchPoints += earnings.rp;
    state.lunarOre += earnings.ore;
    state.rareMinerals += earnings.rm;
    state.stardust += earnings.sd;
    state.terraforming.marsPercent = Math.min(100, state.terraforming.marsPercent + earnings.terraforming);
  }

  function calculatePrestigeReward() {
    const lifetime = state.creditsThisRunEarned;
    if (lifetime < 1e18) return 0;
    let cd = Math.floor(150 * Math.sqrt(lifetime / 1e18));
    // Apply prestige multipliers
    if (state.cdShopPurchased['cd_crunch']) cd *= 2;
    if (state.cdShopPurchased['cd_bounce']) cd *= 5;
    // Research multiplier
    if (state.researchPurchased['r6_3']) cd *= 1.25;
    return Math.floor(cd);
  }

  function performPrestige() {
    const cdEarned = calculatePrestigeReward();
    if (cdEarned <= 0) return 0;

    const keepCrew = state.cdShopPurchased['cd_crew'];
    const keepFleet = state.cdShopPurchased['cd_fleet'];
    const savedCrew = keepCrew ? { ...state.crew } : null;

    // Save permanent data
    const permanent = {
      version: state.version,
      firstPlayTimestamp: state.firstPlayTimestamp,
      totalPlayTimeSeconds: state.totalPlayTimeSeconds,
      totalPrestigeCount: state.totalPrestigeCount + 1,
      cosmicDust: state.cosmicDust + cdEarned,
      cosmicDustLifetime: state.cosmicDustLifetime + cdEarned,
      infinityTokens: state.infinityTokens,
      achievements: state.achievements,
      captainsLog: state.captainsLog,
      cdShopPurchased: state.cdShopPurchased,
      dailyReward: state.dailyReward,
      settings: state.settings,
      stats: state.stats,
      multiverse: state.multiverse,
      tutorialComplete: true,
      // Expansion v2.0 permanent data
      rocket: state.rocket,
      titles: state.titles,
      collection: state.cdShopPurchased['cd_collection'] ? state.collection : { items: {}, setsCompleted: [] },
      combo: { current: 0, bestThisSession: 0, bestAllTime: state.combo.bestAllTime, lastTapTimestamp: 0 }
    };

    permanent.stats.totalGeneratorsEverPurchased = state.stats.totalGeneratorsEverPurchased;
    permanent.stats.totalCrewEverHired = state.stats.totalCrewEverHired;

    // Reset state
    state = createDefaultState();
    Object.assign(state, permanent);
    state.tutorialStep = 999;

    // Apply CD multiplier
    state.cosmicDustMultiplier = 1 + (state.cosmicDust * 0.01);

    // Apply CD shop persistent effects
    applyPermanentUpgrades();

    // Restore crew/fleet if applicable
    if (keepCrew && savedCrew) {
      state.crew = savedCrew;
    }

    // Starting terraform from CD shop
    if (state.cdShopPurchased['cd_terraform']) {
      state.terraforming.marsPercent = 50;
    }

    save();
    return cdEarned;
  }

  function applyPermanentUpgrades() {
    const shop = state.cdShopPurchased;
    if (shop['cd_start1']) state.credits = Math.max(state.credits, 10000);
    if (shop['cd_start2']) state.credits = Math.max(state.credits, 1e6);
    if (shop['cd_start3']) state.credits = Math.max(state.credits, 1e9);
    if (shop['cd_autotap']) state.autoTapPerSecond = Math.max(state.autoTapPerSecond, 5);
    if (shop['cd_sleep']) state.offlineEarningsMultiplier = Math.max(state.offlineEarningsMultiplier, 0.75);
    if (shop['cd_dream']) state.offlineEarningsMultiplier = 1.0;
  }

  function getCDSpeedMultiplier() {
    const shop = state.cdShopPurchased;
    if (shop['cd_warp3']) return 10;
    if (shop['cd_warp2']) return 5;
    if (shop['cd_warp1']) return 2;
    return 1;
  }

  function getGeneratorCount(genId) {
    return state.generators[genId] || 0;
  }

  function setGeneratorCount(genId, count) {
    state.generators[genId] = count;
  }

  function getGeneratorMultiplier(genId) {
    return state.generatorMultipliers[genId] || 1;
  }

  function getPhaseMultiplier(phase) {
    return state.phaseMultipliers[phase] || 1;
  }

  function addCurrency(currency, amount) {
    switch (currency) {
      case 'credits':
        state.credits += amount;
        state.creditsAllTimeEarned += amount;
        state.creditsThisRunEarned += amount;
        break;
      case 'rp': state.researchPoints += amount; break;
      case 'ore': state.lunarOre += amount; break;
      case 'rm': state.rareMinerals += amount; break;
      case 'as': state.alienSignals += amount; break;
      case 'sd': state.stardust += amount; break;
      case 'cosmicDust':
        state.cosmicDust += amount;
        state.cosmicDustLifetime += amount;
        break;
      case 'it': state.infinityTokens += amount; break;
    }
  }

  function getCurrency(currency) {
    switch (currency) {
      case 'credits': return state.credits;
      case 'rp': return state.researchPoints;
      case 'ore': return state.lunarOre;
      case 'rm': return state.rareMinerals;
      case 'as': return state.alienSignals;
      case 'sd': return state.stardust;
      case 'cosmicDust': return state.cosmicDust;
      case 'it': return state.infinityTokens;
      default: return 0;
    }
  }

  function spendCurrency(currency, amount) {
    switch (currency) {
      case 'credits': if (state.credits >= amount) { state.credits -= amount; return true; } break;
      case 'rp': if (state.researchPoints >= amount) { state.researchPoints -= amount; return true; } break;
      case 'ore': if (state.lunarOre >= amount) { state.lunarOre -= amount; return true; } break;
      case 'rm': if (state.rareMinerals >= amount) { state.rareMinerals -= amount; return true; } break;
      case 'as': if (state.alienSignals >= amount) { state.alienSignals -= amount; return true; } break;
      case 'sd': if (state.stardust >= amount) { state.stardust -= amount; return true; } break;
      case 'cosmicDust': if (state.cosmicDust >= amount) { state.cosmicDust -= amount; return true; } break;
      case 'it': if (state.infinityTokens >= amount) { state.infinityTokens -= amount; return true; } break;
    }
    return false;
  }

  function canAfford(currency, amount) {
    return getCurrency(currency) >= amount;
  }

  return {
    getState, save, load, exportSave, importSave, hardReset,
    calculateOfflineEarnings, applyOfflineEarnings,
    calculatePrestigeReward, performPrestige,
    getGeneratorCount, setGeneratorCount,
    getGeneratorMultiplier, getPhaseMultiplier,
    addCurrency, getCurrency, spendCurrency, canAfford,
    getCDSpeedMultiplier, applyPermanentUpgrades,
    createDefaultState
  };
})();
