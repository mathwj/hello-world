/* =============================================
   DEEP SPACE INC. — STATE MANAGEMENT
   Section 1: Global state, save/load, currencies
   ============================================= */
'use strict';

const State = (() => {
  const SAVE_KEY = 'deepSpaceInc_v3';
  const VERSION = '3.0.0';

  // 1.1 Full game state object — every value tracked & persisted
  function createDefault() {
    return {
      // Meta
      version: VERSION,
      firstPlayTimestamp: Date.now(),
      totalPlayTimeSeconds: 0,
      lastOnlineTimestamp: Date.now(),
      currentPhase: 1,
      highestPhaseReached: 1,
      totalPrestigeCount: 0,

      // Currencies
      credits: 0,
      creditsPerSecond: 0,        // computed each tick
      creditsPerTap: 1,
      creditsAllTimeEarned: 0,
      researchPoints: 0,
      rpPerSecond: 0,
      lunarOre: 0,
      orePerSecond: 0,
      rareMinerals: 0,
      rmPerSecond: 0,
      alienSignals: 0,
      stardust: 0,
      sdPerSecond: 0,
      cosmicDust: 0,              // prestige currency — permanent
      cosmicDustLifetime: 0,
      infinityTokens: 0,          // multiverse currency — permanent

      // Multipliers (all default 1.0)
      globalCreditMultiplier: 1.0,
      globalRPMultiplier: 1.0,
      globalOreMultiplier: 1.0,
      tapMultiplier: 1.0,
      offlineEarningsMultiplier: 0.5,
      cosmicDustMultiplier: 1.0,

      // Tap
      totalTaps: 0,
      autoTapPerSecond: 0,

      // Generators — keyed by generator id, value = count owned
      generators: {},

      // Upgrades purchased — keyed by upgrade id
      upgradesPurchased: {},

      // Rocket Parts (Phase 1)
      rocketParts: {
        hull: false,
        engine: false,
        fuelTank: false,
        noseCone: false,
        navigationComputer: false
      },

      // Crew
      crew: {
        totalAstronauts: 0,
        astronauts: [],
        maxCapacity: 0
      },

      // Fleet (Phase 5+)
      fleet: {
        ships: [],
        totalShips: 0
      },

      // Terraforming (Phase 4)
      terraforming: {
        marsPercent: 0.0,
        marsPerSecond: 0.0
      },

      // Star Systems (Phase 7-8)
      starSystems: {
        discovered: ['sol'],
        colonized: ['sol'],
        currentSystem: 'sol'
      },

      // Multiverse (Phase 9)
      multiverse: {
        universesCompleted: [],
        currentUniverse: null
      },

      // Achievements — keyed by id, value = { unlocked, timestamp }
      achievements: {},

      // Daily Rewards
      dailyReward: {
        lastClaimDate: null,
        currentStreak: 0,
        longestStreak: 0
      },

      // Captain's Log entries
      captainsLog: [],

      // Settings
      settings: {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        notificationsEnabled: true,
        numberFormat: 'abbreviated',
        theme: 'default'
      },

      // Tutorial
      tutorialStep: 0,
      tutorialComplete: false
    };
  }

  let state = createDefault();

  function get() { return state; }

  // ---------- Save / Load ----------

  function save() {
    try {
      state.lastOnlineTimestamp = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || !saved.version) return false;
      // Shallow merge, then deep-merge nested objects
      const defaults = createDefault();
      state = Object.assign(defaults, saved);
      // Deep merge nested objects to ensure new fields exist
      const nested = [
        'rocketParts', 'crew', 'fleet', 'terraforming',
        'starSystems', 'multiverse', 'dailyReward', 'settings'
      ];
      for (const key of nested) {
        state[key] = Object.assign(createDefault()[key], saved[key] || {});
      }
      return true;
    } catch (e) {
      console.error('Load failed:', e);
      return false;
    }
  }

  // Export/Import: base64-encoded JSON
  function exportSave() {
    save();
    return btoa(JSON.stringify(state));
  }

  function importSave(b64) {
    try {
      const saved = JSON.parse(atob(b64));
      if (!saved || !saved.version) return false;
      state = Object.assign(createDefault(), saved);
      save();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  function hardReset() {
    state = createDefault();
    localStorage.removeItem(SAVE_KEY);
  }

  // ---------- Offline Earnings (Section 27) ----------

  function calculateOfflineEarnings() {
    const offlineMs = Date.now() - state.lastOnlineTimestamp;
    const offlineSec = Math.min(offlineMs / 1000, 86400); // cap 24h
    if (offlineSec < 60) return null;
    return {
      credits: state.creditsPerSecond * offlineSec * state.offlineEarningsMultiplier,
      rp: state.rpPerSecond * offlineSec * state.offlineEarningsMultiplier,
      ore: state.orePerSecond * offlineSec * state.offlineEarningsMultiplier,
      rm: state.rmPerSecond * offlineSec * state.offlineEarningsMultiplier,
      sd: state.sdPerSecond * offlineSec * state.offlineEarningsMultiplier,
      terraforming: state.terraforming.marsPerSecond * offlineSec * state.offlineEarningsMultiplier,
      seconds: offlineSec
    };
  }

  function applyOfflineEarnings(e) {
    state.credits += e.credits;
    state.creditsAllTimeEarned += e.credits;
    state.researchPoints += e.rp;
    state.lunarOre += e.ore;
    state.rareMinerals += e.rm;
    state.stardust += e.sd;
    state.terraforming.marsPercent = Math.min(100, state.terraforming.marsPercent + e.terraforming);
  }

  // ---------- Currency Helpers (Section 3) ----------

  const CURRENCY_MAP = {
    credits:    { key: 'credits',        symbol: '₡',   color: '#FFD700' },
    rp:         { key: 'researchPoints', symbol: 'RP',  color: '#4A90D9' },
    ore:        { key: 'lunarOre',       symbol: 'Ore', color: '#A8A8A8' },
    rm:         { key: 'rareMinerals',   symbol: 'RM',  color: '#9B59B6' },
    as:         { key: 'alienSignals',   symbol: 'AS',  color: '#2ECC71' },
    sd:         { key: 'stardust',       symbol: 'SD',  color: '#F0E6FF' },
    cosmicDust: { key: 'cosmicDust',     symbol: 'CD',  color: '#FF69B4' },
    it:         { key: 'infinityTokens', symbol: 'IT',  color: '#FFD700' }
  };

  function getCurrencyInfo(id) {
    return CURRENCY_MAP[id] || null;
  }

  function getCurrency(id) {
    const info = CURRENCY_MAP[id];
    return info ? state[info.key] : 0;
  }

  function addCurrency(id, amount) {
    const info = CURRENCY_MAP[id];
    if (!info) return;
    state[info.key] += amount;
    if (id === 'credits') {
      state.creditsAllTimeEarned += amount;
    }
    if (id === 'cosmicDust') {
      state.cosmicDustLifetime += amount;
    }
  }

  function spendCurrency(id, amount) {
    if (getCurrency(id) < amount) return false;
    const info = CURRENCY_MAP[id];
    state[info.key] -= amount;
    return true;
  }

  function canAfford(id, amount) {
    return getCurrency(id) >= amount;
  }

  return {
    get, save, load, exportSave, importSave, hardReset,
    createDefault,
    calculateOfflineEarnings, applyOfflineEarnings,
    getCurrencyInfo, getCurrency, addCurrency, spendCurrency, canAfford,
    CURRENCY_MAP
  };
})();
