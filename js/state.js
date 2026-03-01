// state.js — Game state management, save/load, prestige
'use strict';

const GameState = (() => {
  const SAVE_KEY = 'deepSpaceInc_save';
  const BACKUP_KEY = 'deepSpaceInc_backup';
  const VERSION = '2.0.0';
  const MAX_OFFLINE_SECONDS = 86400; // 24h cap per Section 32

  // Simple hash for save integrity (not cryptographic, just tamper-detection)
  function computeHash(obj) {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash = hash & hash; // Convert to 32-bit int
    }
    return 'dsi_' + Math.abs(hash).toString(36);
  }

  // Clock manipulation detection
  let _lastTickTimestamp = Date.now();
  let _clockWarnings = 0;

  function checkClockManipulation() {
    const now = Date.now();
    const delta = now - _lastTickTimestamp;
    _lastTickTimestamp = now;

    // If time jumped forward by more than 5 minutes in a single check, suspicious
    if (delta > 300000 && delta < 1000) {
      // Time went backwards — clear manipulation
      _clockWarnings++;
      return 'backward';
    }
    // Large forward jump while game is running (not offline)
    if (delta > 300000) {
      _clockWarnings++;
      return 'forward';
    }
    return null;
  }

  function getClockWarnings() {
    return _clockWarnings;
  }

  function resetClockCheck() {
    _lastTickTimestamp = Date.now();
  }

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
        ships: [],
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

      // Terraform milestone flags
      _terraMile5: false,
      _terraMile10: false,
      _terraMile25: false,
      _terraMile50: false,
      _terraMile75: false,
      _terraMile90: false,
      _terraMile100: false,

      // Anomaly state
      _nextSystemDiscount: 0,
      _tempSpeedMult: 1,
      _tempSpeedEndTime: 0,
      _permanentSystemDiscount: 0,
      _prestigeRewardMult: 1,
      _passiveSD: 0,
      _autoCrewAccum: 0,

      settings: {
        musicVolume: 0.7,
        sfxVolume: 0.8,
        notificationsEnabled: true,
        numberFormat: 'abbreviated',
        particleEffects: true,
        screenShake: true,
        confirmPrestige: true,
        autoSaveInterval: 30,
        // Section 80: Theme system
        theme: 'default',
        purchasedThemes: ['default'],
        // Section 85: Accessibility settings
        reducedMotion: false,
        highContrast: false,
        colorblindMode: 'none', // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
        largeText: false,
        screenReaderAnnouncements: true,
        hapticFeedback: true,
        // Section 90: Performance
        targetFps: 60,
        lowPowerMode: false
      },

      // Stats tracking
      stats: {
        totalGeneratorsEverPurchased: 0,
        totalCrewEverHired: 0,
        totalAlienSignalsDecoded: 0,
        totalStarSystemsColonized: 1,
        fastestPhaseReach: {},
        lastTapTime: 0,
        noTapDuration: 0,
        consecutiveAsteroids: 0,
        // Expansion B stats
        phaseReachTime: {},
        rocketBuildTime: 0,
        totalCritTaps: 0,
        totalSuperCritTaps: 0,
        luckyDropsCaught: 0,
        cosmicFragmentsCaught: 0,
        maxRainCatch: 0,
        eggsHatched: 0,
        cosmicEggsHatched: 0,
        voidEggsHatched: 0,
        contractsCompleted: 0,
        specialContractsCompleted: 0,
        weatherTypesExperienced: [],
        p1WeatherComplete: false,
        lightningTaps: 0,
        marsSunsetSeen: false,
        eclipsePhases: [],
        totalMilestoneBadges: 0,
        bronzeBadges: 0,
        silverBadges: 0,
        goldBadges: 0,
        diamondBadges: 0,
        boostersActivated: 0,
        maxSimultaneousBoosters: 0,
        legendaryBoosterUsed: false,
        nightOwlEarned: false,
        earlyBirdEarned: false,
        weekendWarriorEarned: false,
        fastTapRecord: 0,
        failedPurchases: 0,
        returnedToP1AfterP8: false,
        challengesCompleted: 0,
        goldenRushCount: 0,
        // Expansion B: Mini-game stats
        miniGamesPlayed: 0,
        miniGameHighScores: {},
        miniGamesWon: 0,
        // Expansion B: Egg warm taps
        eggWarmTaps: 0,
        // Expansion B: Booster tracking
        boostersCollected: 0,
        legendaryBoostersCollected: 0,
        // Expansion B: Synergy tracking
        synergiesActivated: 0,
        // Expansion B: Additional stats
        miniGameTypesPlayed: [],
        miniGamePerfect: false,
        completedChallengeTypes: [],
        challengeTypesCompleted: 0,
        contractStreak: 0,
        bronzeEggsHatched: 0,
        silverEggsHatched: 0,
        goldEggsHatched: 0,
        eggTypesHatched: 0,
        creditBoostersUsed: 0,
        rpBoostersUsed: 0,
        rareBoosterUsed: false,
        epicBoosterUsed: false,
        ioRepairs: 0,
        europaASFound: 0,
        ganymedeFullCrew: false,
        callistoMaxed: false,
        allPhasesIn1Hr: false,
        doublePrestige: false,
        playedFriday13: false,
        playedNewYear: false,
        terraformTime: 0,
        lastPrestigeTimestamp: 0
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

      // Challenge Runs
      challenge: {
        active: false,
        typeId: null,
        startTime: 0,
        elapsed: 0,
        completed: false,
        startPrestigeCount: 0
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
      },

      // ===== EXPANSION C: New State Fields (Section 61) =====

      // Prestige milestone tracking
      prestigeMilestonesClaimed: {},

      // Audio preferences
      audio: {
        jukeboxPhase: null,
        particleColor: null
      },

      // IT shop purchased items
      itShopPurchased: {},

      // Permanent multiplier from prestige milestones
      permanentPrestigeMult: 1.0,

      // CD doubled flag (from 100th prestige milestone)
      cdDoubledPermanent: false
    };
  }

  let state = createDefaultState();

  function getState() {
    return state;
  }

  function save() {
    try {
      state.lastOnlineTimestamp = Date.now();
      state.totalPlayTimeSeconds += (Date.now() - (state._lastSaveTimestamp || Date.now())) / 1000;
      state._lastSaveTimestamp = Date.now();

      // Create save envelope with integrity hash
      const saveData = { ...state };
      delete saveData._hash; // Don't include old hash in computation
      const hash = computeHash(saveData);

      const envelope = {
        data: state,
        hash: hash,
        savedAt: Date.now(),
        version: VERSION
      };

      const json = JSON.stringify(envelope);
      localStorage.setItem(SAVE_KEY, json);

      // Rotating backup — save backup every 5th save
      if (!state._saveCount) state._saveCount = 0;
      state._saveCount++;
      if (state._saveCount % 5 === 0) {
        localStorage.setItem(BACKUP_KEY, json);
      }
    } catch (e) {
      console.error('Save failed:', e);
    }
  }

  function _applySavedData(saved) {
    state = Object.assign(createDefaultState(), saved);
    // Ensure nested objects are properly merged
    const defaults = createDefaultState();
    state.rocketParts = Object.assign(defaults.rocketParts, saved.rocketParts || {});
    state.crew = Object.assign(defaults.crew, saved.crew || {});
    state.terraforming = Object.assign(defaults.terraforming, saved.terraforming || {});
    state.starSystems = Object.assign(defaults.starSystems, saved.starSystems || {});
    state.multiverse = Object.assign(defaults.multiverse, saved.multiverse || {});
    state.dailyReward = Object.assign(defaults.dailyReward, saved.dailyReward || {});
    state.fleet = Object.assign(defaults.fleet, saved.fleet || {});
    state.settings = Object.assign(defaults.settings, saved.settings || {});
    state.stats = Object.assign(defaults.stats, saved.stats || {});
    // Expansion v2.0 nested merges
    state.combo = Object.assign(defaults.combo, saved.combo || {});
    state.criticalTaps = Object.assign(defaults.criticalTaps, saved.criticalTaps || {});
    state.luckyDrops = Object.assign(defaults.luckyDrops, saved.luckyDrops || {});
    state.synergies = Object.assign(defaults.synergies, saved.synergies || {});
    state.collection = Object.assign(defaults.collection, saved.collection || {});
    state.contracts = Object.assign(defaults.contracts, saved.contracts || {});
    state.boosters = Object.assign(defaults.boosters, saved.boosters || {});
    state.eggs = Object.assign(defaults.eggs, saved.eggs || {});
    state.weather = Object.assign(defaults.weather, saved.weather || {});
    state.streaks = Object.assign(defaults.streaks, saved.streaks || {});
    state.rocket = Object.assign(defaults.rocket, saved.rocket || {});
    state.titles = Object.assign(defaults.titles, saved.titles || {});
    state.goldenRush = Object.assign(defaults.goldenRush, saved.goldenRush || {});
    state.flyingBonus = Object.assign(defaults.flyingBonus, saved.flyingBonus || {});
    state.challenge = Object.assign(defaults.challenge, saved.challenge || {});
    // Expansion C nested merges
    state.audio = Object.assign(defaults.audio, saved.audio || {});

    // Initialize clock check baseline
    state._lastSaveTimestamp = Date.now();
    resetClockCheck();
  }

  function load() {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return false;

      const parsed = JSON.parse(json);

      // Support new envelope format (with hash) and legacy flat format
      let saved, integrityOk = true;
      if (parsed && parsed.data && parsed.hash) {
        // New envelope format — verify integrity
        saved = parsed.data;
        const checkData = { ...saved };
        delete checkData._hash;
        const expectedHash = computeHash(checkData);
        if (expectedHash !== parsed.hash) {
          console.warn('Save integrity mismatch — possible tampering detected');
          integrityOk = false;
          // Try backup save
          const backupJson = localStorage.getItem(BACKUP_KEY);
          if (backupJson) {
            try {
              const backup = JSON.parse(backupJson);
              if (backup && backup.data && backup.hash) {
                const backupCheck = { ...backup.data };
                delete backupCheck._hash;
                if (computeHash(backupCheck) === backup.hash) {
                  console.info('Loaded from backup save instead');
                  saved = backup.data;
                  integrityOk = true;
                }
              }
            } catch (be) { /* backup also corrupt, use primary anyway */ }
          }
        }
      } else if (parsed && parsed.version) {
        // Legacy flat format (no envelope)
        saved = parsed;
      } else {
        return false;
      }

      if (saved && saved.version) {
        _applySavedData(saved);

        // Anti-cheat: clock manipulation check on load
        const now = Date.now();
        if (state.lastOnlineTimestamp > now + 60000) {
          // Last save is in the future — clock was set forward then back
          console.warn('Clock manipulation detected: save timestamp is in the future');
          state.lastOnlineTimestamp = now;
          _clockWarnings++;
        }

        // Mark integrity status in state for UI to display if needed
        if (!integrityOk) {
          state._saveIntegrityFailed = true;
        }

        return true;
      }
    } catch (e) {
      console.error('Load failed:', e);
      // Attempt backup recovery
      try {
        const backupJson = localStorage.getItem(BACKUP_KEY);
        if (backupJson) {
          const backup = JSON.parse(backupJson);
          const saved = backup.data || backup;
          if (saved && saved.version) {
            _applySavedData(saved);
            console.info('Recovered from backup save');
            return true;
          }
        }
      } catch (be) {
        console.error('Backup recovery also failed:', be);
      }
    }
    return false;
  }

  function exportSave() {
    save();
    const envelope = {
      data: state,
      hash: computeHash(state),
      exportedAt: Date.now(),
      version: VERSION
    };
    const json = JSON.stringify(envelope);
    return btoa(unescape(encodeURIComponent(json)));
  }

  function importSave(b64) {
    try {
      const json = decodeURIComponent(escape(atob(b64)));
      const parsed = JSON.parse(json);

      // Support envelope and legacy formats
      let saved;
      if (parsed && parsed.data && parsed.hash) {
        saved = parsed.data;
        // Verify integrity
        const checkData = { ...saved };
        delete checkData._hash;
        if (computeHash(checkData) !== parsed.hash) {
          console.warn('Imported save integrity mismatch — loading anyway');
        }
      } else if (parsed && parsed.version) {
        saved = parsed;
      } else {
        return false;
      }

      if (saved && saved.version) {
        _applySavedData(saved);
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
    localStorage.removeItem(SAVE_KEY);
  }

  function calculateOfflineEarnings() {
    const now = Date.now();
    const offlineMs = now - state.lastOnlineTimestamp;

    // Anti-cheat: if lastOnlineTimestamp is in the future, clock was manipulated
    if (offlineMs < 0) {
      console.warn('Clock manipulation detected: negative offline time');
      _clockWarnings++;
      state.lastOnlineTimestamp = now;
      return null;
    }

    const offlineSec = Math.min(offlineMs / 1000, MAX_OFFLINE_SECONDS); // cap 24h

    if (offlineSec < 60) return null; // less than 1 min, skip

    const earnings = {
      credits: state.creditsPerSecond * offlineSec * state.offlineEarningsMultiplier,
      rp: state.rpPerSecond * offlineSec * state.offlineEarningsMultiplier,
      ore: state.orePerSecond * offlineSec * state.offlineEarningsMultiplier,
      rm: state.rmPerSecond * offlineSec * state.offlineEarningsMultiplier,
      sd: state.sdPerSecond * offlineSec * state.offlineEarningsMultiplier,
      terraforming: state.terraforming.marsPerSecond * offlineSec * state.offlineEarningsMultiplier,
      time: offlineSec,
      capped: offlineMs / 1000 > MAX_OFFLINE_SECONDS // Indicate if earnings were capped
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
    // Anomaly Dark Matter prestige reward multiplier
    if (state._prestigeRewardMult > 1) cd *= state._prestigeRewardMult;
    // Expansion C: 100th prestige milestone doubles all CD
    if (state.cdDoubledPermanent) cd *= 2;
    return Math.floor(cd);
  }

  function performPrestige() {
    const cdEarned = calculatePrestigeReward();
    if (cdEarned <= 0) return 0;

    const keepCrew = state.cdShopPurchased['cd_crew'];
    const keepFleet = state.cdShopPurchased['cd_fleet'];
    const savedCrew = keepCrew ? { ...state.crew } : null;
    const savedFleet = keepFleet ? { ...state.fleet } : null;

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
      combo: { current: 0, bestThisSession: 0, bestAllTime: state.combo.bestAllTime, lastTapTimestamp: 0 },
      // Permanent anomaly/star system effects
      _permanentSystemDiscount: state._permanentSystemDiscount,
      _prestigeRewardMult: state._prestigeRewardMult,
      _passiveSD: state._passiveSD,
      // Expansion C permanent data
      prestigeMilestonesClaimed: state.prestigeMilestonesClaimed,
      itShopPurchased: state.itShopPurchased,
      audio: state.audio,
      permanentPrestigeMult: state.permanentPrestigeMult,
      cdDoubledPermanent: state.cdDoubledPermanent
    };

    // Check prestige milestones
    const newPrestigeCount = permanent.totalPrestigeCount;
    if (typeof GameData !== 'undefined' && GameData.PRESTIGE_MILESTONES) {
      for (const m of GameData.PRESTIGE_MILESTONES) {
        if (newPrestigeCount >= m.count && !permanent.prestigeMilestonesClaimed[m.count]) {
          permanent.prestigeMilestonesClaimed[m.count] = true;
          if (m.cdBonus > 0) {
            permanent.cosmicDust += m.cdBonus;
            permanent.cosmicDustLifetime += m.cdBonus;
          }
          if (m.title) {
            permanent.titles.unlocked.push(m.title);
          }
          if (m.rocketSkin) {
            if (!permanent.rocket.unlockedSkins.includes(m.rocketSkin)) {
              permanent.rocket.unlockedSkins.push(m.rocketSkin);
            }
          }
          if (m.permanentMult) {
            permanent.permanentPrestigeMult *= m.permanentMult;
          }
          if (m.cdDoubled) {
            permanent.cdDoubledPermanent = true;
          }
        }
      }
    }

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
    if (keepFleet) {
      state.fleet = { unlocked: true, ships: savedFleet.ships || [], totalShips: savedFleet.totalShips || 0 };
    }

    // Starting terraform from CD shop
    if (state.cdShopPurchased['cd_terraform']) {
      state.terraforming.marsPercent = 50;
    }

    // ===== Section 59.2: Prestige also awards eggs + boosters =====
    // Award 1-3 random eggs based on lifetime earnings tier
    const earningsTier = state.cosmicDustLifetime >= 10000 ? 3 :
                         state.cosmicDustLifetime >= 1000 ? 2 : 1;
    const eggTiers = ['bronze', 'silver', 'gold', 'cosmic'];
    const eggCount = Math.min(earningsTier, 3);
    for (let i = 0; i < eggCount; i++) {
      const tierIdx = Math.min(earningsTier - 1 + (Math.random() < 0.3 ? 1 : 0), eggTiers.length - 1);
      const eggType = 'egg_' + eggTiers[tierIdx];
      if (state.eggs.slots.length < state.eggs.maxSlots) {
        state.eggs.slots.push({ type: eggType, startTime: Date.now(), duration: (tierIdx + 1) * 3600000 });
      } else {
        // Try to fill an empty slot
        const emptyIdx = state.eggs.slots.findIndex(e => e === null);
        if (emptyIdx >= 0) {
          state.eggs.slots[emptyIdx] = { type: eggType, startTime: Date.now(), duration: (tierIdx + 1) * 3600000 };
        }
      }
    }
    // Award 1 random booster (rarity based on earnings tier)
    const boosterRarities = ['common', 'uncommon', 'rare', 'legendary'];
    const boosterRarity = boosterRarities[Math.min(earningsTier - 1, boosterRarities.length - 1)];
    const boosterTypes = ['boost_credits', 'boost_tap', 'boost_rp', 'boost_all', 'boost_lucky', 'boost_xp'];
    const boosterType = boosterTypes[Math.floor(Math.random() * boosterTypes.length)];
    if (!state.boosters.inventory) state.boosters.inventory = [];
    if (state.boosters.inventory.length < 5) {
      state.boosters.inventory.push({ type: boosterType, rarity: boosterRarity });
    }
    // CD shop: cosmic egg on prestige
    if (state.cdShopPurchased['cd_cosmicegg']) {
      const emptyIdx = state.eggs.slots.findIndex(e => e === null);
      if (emptyIdx >= 0) {
        state.eggs.slots[emptyIdx] = { type: 'egg_cosmic', startTime: Date.now(), duration: 86400000 };
      }
    }
    // CD shop: lucky start — 3 random boosters
    if (state.cdShopPurchased['cd_luckystart']) {
      for (let i = 0; i < 3 && state.boosters.inventory.length < 5; i++) {
        const bt = boosterTypes[Math.floor(Math.random() * boosterTypes.length)];
        state.boosters.inventory.push({ type: bt, rarity: 'uncommon' });
      }
    }
    // CD shop: egg magnet — 1 Gold Egg
    if (state.cdShopPurchased['cd_eggmagnet']) {
      const emptyIdx = state.eggs.slots.findIndex(e => e === null);
      if (emptyIdx >= 0) {
        state.eggs.slots[emptyIdx] = { type: 'egg_gold', startTime: Date.now(), duration: 7200000 };
      }
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
    // Expansion C CD shop effects
    if (shop['cd_triplecrit']) state.criticalTaps.chance = Math.max(state.criticalTaps.chance, 0.06);
    if (shop['cd_supercrit']) state.criticalTaps.superChance = Math.max(state.criticalTaps.superChance, 0.005);
    if (shop['cd_eggslot4']) state.eggs.maxSlots = Math.max(state.eggs.maxSlots, 4);
    if (shop['cd_eggslot5']) state.eggs.maxSlots = Math.max(state.eggs.maxSlots, 5);
    // Ensure egg slots array matches maxSlots
    while (state.eggs.slots.length < state.eggs.maxSlots) state.eggs.slots.push(null);
    // Permanent prestige multiplier
    if (state.permanentPrestigeMult > 1) {
      state.globalCreditMultiplier *= state.permanentPrestigeMult;
    }
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
    createDefaultState,
    checkClockManipulation, getClockWarnings, resetClockCheck
  };
})();
