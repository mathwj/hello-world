// expansion.js — Deep Space Inc. v2.0 "Dopamine Overdrive" — All expansion systems
'use strict';

const Expansion = (() => {

  // ==================== COMBO SYSTEM ====================
  const Combo = {
    TIMEOUT: 0.8,
    TIERS: [
      { min: 1, mult: 1, label: '', color: '#ffffff', fontSize: 16 },
      { min: 5, mult: 1.5, label: 'COMBO!', color: '#FFD700', fontSize: 20 },
      { min: 10, mult: 2, label: 'COMBO!', color: '#FFA500', fontSize: 24 },
      { min: 20, mult: 3, label: 'GREAT!', color: '#FF4500', fontSize: 28 },
      { min: 35, mult: 5, label: 'AMAZING!', color: '#FF0000', fontSize: 32 },
      { min: 50, mult: 8, label: 'FRENZY!', color: '#FF1493', fontSize: 36 },
      { min: 75, mult: 12, label: 'INSANE!', color: '#9400D3', fontSize: 42 },
      { min: 100, mult: 20, label: 'MEGA FRENZY!!!', color: '#FF69B4', fontSize: 48 }
    ],

    onTap(s) {
      const now = Date.now() / 1000;
      const comboTimeout = s.cdShopPurchased && s.cdShopPurchased['cd_combo'] ? 1.5 : this.TIMEOUT;
      const prevTier = this.getTier(s.combo.current);
      if (now - s.combo.lastTapTimestamp < comboTimeout) {
        s.combo.current++;
      } else {
        s.combo.current = 1;
      }
      s.combo.lastTapTimestamp = now;
      s.combo.bestThisSession = Math.max(s.combo.bestThisSession, s.combo.current);
      s.combo.bestAllTime = Math.max(s.combo.bestAllTime, s.combo.current);

      // Return tier change info for UI shockwave effect
      const newTier = this.getTier(s.combo.current);
      return { tierChanged: prevTier !== newTier, tier: newTier };
    },

    getTier(combo) {
      for (let i = this.TIERS.length - 1; i >= 0; i--) {
        if (combo >= this.TIERS[i].min) return this.TIERS[i];
      }
      return this.TIERS[0];
    },

    getMultiplier(s) {
      return this.getTier(s.combo.current).mult;
    },

    // Returns 0-1 representing time left before combo resets
    getTimerProgress(s) {
      const now = Date.now() / 1000;
      const comboTimeout = s.cdShopPurchased && s.cdShopPurchased['cd_combo'] ? 1.5 : this.TIMEOUT;
      const elapsed = now - s.combo.lastTapTimestamp;
      return Math.max(0, 1 - (elapsed / comboTimeout));
    },

    update(s, dt) {
      const now = Date.now() / 1000;
      const comboTimeout = s.cdShopPurchased && s.cdShopPurchased['cd_combo'] ? 1.5 : this.TIMEOUT;
      if (s.combo.current > 0 && now - s.combo.lastTapTimestamp > comboTimeout) {
        s.combo.current = 0;
      }
    }
  };

  // ==================== CRITICAL TAP SYSTEM ====================
  const CriticalTap = {
    roll(s) {
      const r = Math.random();
      if (r < s.criticalTaps.superChance) {
        s.criticalTaps.totalSuperCriticals++;
        return { type: 'super', mult: s.criticalTaps.superMultiplier };
      }
      if (r < s.criticalTaps.chance) {
        s.criticalTaps.totalCriticals++;
        return { type: 'critical', mult: s.criticalTaps.multiplier };
      }
      return { type: 'normal', mult: 1 };
    }
  };

  // ==================== LUCKY DROP SYSTEM ====================
  const DROP_TYPES = [
    { id: 'gold', name: 'Gold Nugget', color: '#FFD700', weight: 40, reward: (s) => ({ currency: 'credits', amount: s.creditsPerSecond * 30 }) },
    { id: 'crystal', name: 'Crystal Shard', color: '#4A90D9', weight: 20, reward: (s) => ({ currency: 'rp', amount: s.rpPerSecond * 60 }) },
    { id: 'ore', name: 'Ore Chunk', color: '#A8A8A8', weight: 15, reward: (s) => ({ currency: 'ore', amount: s.orePerSecond * 30 }) },
    { id: 'mystery', name: 'Mystery Capsule', color: '#9B59B6', weight: 15, reward: (s) => {
      const r = Math.random();
      if (r < 0.33) return { currency: 'credits', amount: s.creditsPerSecond * 90 };
      if (r < 0.66) return { currency: 'rp', amount: s.rpPerSecond * 90 };
      return { currency: 'booster', amount: 1 };
    }},
    { id: 'rainbow', name: 'Rainbow Star', color: '#FF69B4', weight: 8, reward: (s) => ({ currency: 'all', amount: 120 }) },
    { id: 'cosmic', name: 'Cosmic Fragment', color: '#F0E6FF', weight: 2, reward: (s) => ({ currency: 'cosmicDust', amount: 1 }) }
  ];

  const LuckyDrops = {
    activeDrop: null,

    update(s, dt) {
      if (this.activeDrop) {
        this.activeDrop.x += this.activeDrop.speed * dt;
        this.activeDrop.y += Math.sin(Date.now() / 1000 * 2) * 0.3;
        if (this.activeDrop.x > 110) {
          s.luckyDrops.totalMissed++;
          this.activeDrop = null;
        }
        return;
      }
      s.luckyDrops.nextDropIn -= dt;
      const freqMult = s.cdShopPurchased && s.cdShopPurchased['cd_doubledrops'] ? 0.5 : 1;
      if (s.luckyDrops.nextDropIn <= 0) {
        this.spawn(s);
        s.luckyDrops.nextDropIn = (30 + Math.random() * 60) * freqMult;
      }
    },

    spawn(s) {
      const totalWeight = DROP_TYPES.reduce((sum, d) => sum + d.weight, 0);
      let roll = Math.random() * totalWeight;
      let dropType = DROP_TYPES[0];
      for (const d of DROP_TYPES) {
        roll -= d.weight;
        if (roll <= 0) { dropType = d; break; }
      }
      this.activeDrop = {
        type: dropType,
        x: -5,
        y: 30 + Math.random() * 40,
        speed: 15 + Math.random() * 5
      };
    },

    collect(s) {
      if (!this.activeDrop) return null;
      const drop = this.activeDrop;
      this.activeDrop = null;
      s.luckyDrops.totalCaught++;
      s.luckyDrops.lastDropTimestamp = Date.now();
      const reward = drop.type.reward(s);
      if (reward.currency === 'cosmicDust') s.luckyDrops.cosmicFragmentsCaught++;
      if (reward.currency === 'all') {
        GameState.addCurrency('credits', s.creditsPerSecond * reward.amount);
        GameState.addCurrency('rp', s.rpPerSecond * reward.amount);
        GameState.addCurrency('ore', s.orePerSecond * reward.amount);
      } else if (reward.currency === 'booster') {
        Boosters.addRandom(s);
      } else {
        GameState.addCurrency(reward.currency, reward.amount);
      }
      return { drop, reward };
    }
  };

  // ==================== GOLDEN RUSH SYSTEM ====================
  const GoldenRush = {
    update(s, dt) {
      if (s.goldenRush.active) {
        if (Date.now() > s.goldenRush.endTime) {
          s.goldenRush.active = false;
          s.goldenRush.generatorId = null;
        }
        return;
      }
      s.goldenRush.nextRushIn -= dt;
      const freqMult = s.cdShopPurchased && s.cdShopPurchased['cd_goldenage'] ? 0.5 : 1;
      if (s.goldenRush.nextRushIn <= 0) {
        this.trigger(s);
        s.goldenRush.nextRushIn = (600 + Math.random() * 600) * freqMult;
      }
    },

    trigger(s) {
      const keys = Engine.getActiveGeneratorKeysForPhase(s.currentPhase);
      const allGens = [];
      for (const key of keys) {
        const gens = GameData.GENERATORS[key];
        if (gens) {
          for (const g of gens) {
            if ((s.generators[g.id] || 0) > 0) allGens.push(g.id);
          }
        }
      }
      if (allGens.length === 0) return;
      s.goldenRush.active = true;
      s.goldenRush.generatorId = allGens[Math.floor(Math.random() * allGens.length)];
      s.goldenRush.endTime = Date.now() + 30000;
      // Trigger golden rush sound and celebration
      if (typeof AdaptiveAudio !== 'undefined' && AdaptiveAudio.playGoldenRushSound) {
        AdaptiveAudio.playGoldenRushSound();
      }
      if (typeof Juice !== 'undefined' && Juice.Celebrations) {
        Juice.Celebrations.playPreset('goldenRush');
      }
    },

    getMultiplier(s, genId) {
      if (s.goldenRush.active && s.goldenRush.generatorId === genId) return 10;
      return 1;
    }
  };

  // ==================== GENERATOR MILESTONE SYSTEM ====================
  const MILESTONES = [
    { count: 10, mult: 2, badge: '\u2605', label: 'star' },
    { count: 25, mult: 2, badge: '\u{1F949}', label: 'bronze' },
    { count: 50, mult: 2, badge: '\u{1F948}', label: 'silver' },
    { count: 100, mult: 3, badge: '\u{1F947}', label: 'gold' },
    { count: 150, mult: 2, badge: '\u{1F947}\u2728', label: 'gold+' },
    { count: 200, mult: 4, badge: '\u{1F48E}', label: 'platinum' },
    { count: 250, mult: 2, badge: '\u{1F48E}\u2728', label: 'diamond' },
    { count: 300, mult: 3, badge: '\u{1F48E}\u{1F308}', label: 'diamond+' },
    { count: 400, mult: 4, badge: '\u{1F31F}', label: 'prismatic' },
    { count: 500, mult: 10, badge: '\u221E', label: 'cosmic' }
  ];

  const Milestones = {
    check(s, genId) {
      const count = s.generators[genId] || 0;
      const prev = s.generatorMilestones[genId] || 0;
      let newMilestone = null;
      for (const m of MILESTONES) {
        if (count >= m.count && prev < m.count) {
          s.generatorMilestones[genId] = m.count;
          newMilestone = m;
        }
      }
      return newMilestone;
    },

    getCumulativeMultiplier(s, genId) {
      const count = s.generators[genId] || 0;
      let mult = 1;
      for (const m of MILESTONES) {
        if (count >= m.count) mult *= m.mult;
      }
      return mult;
    },

    getBadge(s, genId) {
      const count = s.generators[genId] || 0;
      let badge = '';
      for (const m of MILESTONES) {
        if (count >= m.count) badge = m.badge;
      }
      return badge;
    },

    getNextMilestone(s, genId) {
      const count = s.generators[genId] || 0;
      for (const m of MILESTONES) {
        if (count < m.count) return m;
      }
      return null;
    }
  };

  // ==================== SYNERGY SYSTEM ====================
  const SYNERGIES = [
    // Phase 1
    { id: 'syn_p1_1', name: 'Mentor & Student', gens: ['p1g1', 'p1g2'], minCount: 10, bonus: 1.5, phase: 1 },
    { id: 'syn_p1_2', name: 'Industrial Pipeline', gens: ['p1g4', 'p1g6'], minCount: 10, bonus: 2, phase: 1 },
    { id: 'syn_p1_3', name: 'Precision Manufacturing', gens: ['p1g5', 'p1g7'], minCount: 10, bonus: 3, target: 'p1g7', phase: 1 },
    // Phase 2
    { id: 'syn_p2_1', name: 'Powered Signal', gens: ['p2g1', 'p2g2'], minCount: 10, bonus: 2, phase: 2 },
    { id: 'syn_p2_2', name: 'Research Network', gens: ['p2g3', 'p2g5'], minCount: 10, bonus: 2, phase: 2 },
    { id: 'syn_p2_3', name: 'Tourism Empire', gens: ['p2g4', 'p2g6'], minCount: 10, bonus: 3, phase: 2 },
    // Phase 3
    { id: 'syn_p3_1', name: 'Mine & Refine', gens: ['p3g1', 'p3g2'], minCount: 10, bonus: 2, phase: 3 },
    { id: 'syn_p3_2', name: 'Exploration Force', gens: ['p3g4', 'p3g5'], minCount: 10, bonus: 2, phase: 3 },
    { id: 'syn_p3_3', name: 'Lunar Logistics', gens: ['p3g6', 'p3g8'], minCount: 10, bonus: 3, phase: 3 },
    // Phase 4
    { id: 'syn_p4_1', name: 'Dual Approach', gens: ['p4g2', 'p4g3'], minCount: 10, bonus: 2, phase: 4, terraform: true },
    { id: 'syn_p4_2', name: 'Living Mars', gens: ['p4g4', 'p4g5'], minCount: 10, bonus: 2, phase: 4 },
    { id: 'syn_p4_3', name: 'Evolving Colony', gens: ['p4g6', 'p4g7'], minCount: 10, bonus: 3, target: 'p4g7', phase: 4 },
    // Phase 5
    { id: 'syn_p5_1', name: 'Guided Mining', gens: ['p5g1', 'p5g2'], minCount: 10, bonus: 2, target: 'p5g2', phase: 5 },
    { id: 'syn_p5_2', name: 'Full Pipeline', gens: ['p5g3', 'p5g4'], minCount: 10, bonus: 2, phase: 5 },
    { id: 'syn_p5_3', name: 'Battle Fleet', gens: ['p5g5', 'p5g7'], minCount: 10, bonus: 1.5, phase: 5 },
    // Cross-Phase Synergies
    { id: 'syn_cross_1', name: 'From Junk to Jupiter', gens: ['p1g1', 'p6g1'], minCount: 100, bonus: 3, crossPhase: true, applyToPhases: [1, 6] },
    { id: 'syn_cross_2', name: 'Full Spectrum Mining', gens: ['p3g1', 'p5g3'], minCount: 50, bonus: 5, crossPhase: true, target: 'ore_rm' },
    { id: 'syn_cross_3', name: 'From Earth to Stars', gens: ['p1g1', 'p1g2', 'p1g3', 'p1g4', 'p1g5', 'p1g6', 'p1g7'], minCount: 25, bonusGens: ['p7g1', 'p7g2', 'p7g3'], bonusMinCount: 10, bonus: 2, crossPhase: true, target: 'global' },
    { id: 'syn_cross_4', name: 'Connected Empire', gens: ['p6cg1', 'p6cg2', 'p6cg3', 'p6cg4', 'p2g2'], minCount: 1, bonus: 10, crossPhase: true, target: 'rp_global' }
  ];

  const Synergies = {
    checkAll(s) {
      const newSynergies = [];
      for (const syn of SYNERGIES) {
        if (s.synergies.unlocked.includes(syn.id)) continue;
        const allMet = syn.gens.every(gid => (s.generators[gid] || 0) >= syn.minCount);
        if (allMet) {
          s.synergies.unlocked.push(syn.id);
          this.apply(s, syn);
          newSynergies.push(syn);
        }
      }
      return newSynergies;
    },

    apply(s, syn) {
      if (syn.target) {
        s.generatorMultipliers[syn.target] = (s.generatorMultipliers[syn.target] || 1) * syn.bonus;
      } else {
        for (const gid of syn.gens) {
          s.generatorMultipliers[gid] = (s.generatorMultipliers[gid] || 1) * syn.bonus;
        }
      }
    },

    isActive(s, genId) {
      for (const syn of SYNERGIES) {
        if (s.synergies.unlocked.includes(syn.id) && syn.gens.includes(genId)) return true;
      }
      return false;
    }
  };

  // ==================== COLLECTION / ARTIFACT ALBUM ====================
  const COLLECTIONS = {
    spaceRocks: {
      name: 'Space Rocks',
      items: [
        { id: 'col_sr1', name: 'Common Meteorite', rarity: 'common', hint: 'Tap 500 times on Moon' },
        { id: 'col_sr2', name: 'Iron Meteorite', rarity: 'common', hint: 'Own 50 Lunar Drills' },
        { id: 'col_sr3', name: 'Stony-Iron', rarity: 'uncommon', hint: 'Tap during Meteor Shower' },
        { id: 'col_sr4', name: 'Pallasite', rarity: 'uncommon', hint: 'Mine 10,000 total Ore' },
        { id: 'col_sr5', name: 'Lunar Anorthosite', rarity: 'rare', hint: 'Reach Moon gen milestone 100' },
        { id: 'col_sr6', name: 'Mars Shergottite', rarity: 'rare', hint: 'Reach 50% Mars terraforming' },
        { id: 'col_sr7', name: 'Carbonaceous Chondrite', rarity: 'rare', hint: 'Mine 3 Rare Asteroids' },
        { id: 'col_sr8', name: 'Vesta Fragment', rarity: 'epic', hint: 'Own 100 Mining Barges' },
        { id: 'col_sr9', name: 'Presolar Grain', rarity: 'epic', hint: 'Complete first prestige' },
        { id: 'col_sr10', name: 'Interstellar Dust', rarity: 'epic', hint: 'Reach Phase 7' },
        { id: 'col_sr11', name: 'Neutron Star Fragment', rarity: 'legendary', hint: 'Discover Black Hole system' },
        { id: 'col_sr12', name: 'Big Bang Remnant', rarity: 'legendary', hint: 'Prestige 10 times' }
      ],
      bonus: 'All Ore and RM production x5',
      bonusEffect: { globalOreMultiplier: 5, globalRMMultiplier: 5 }
    },
    crewBadges: {
      name: 'Crew Badges',
      items: [
        { id: 'col_cb1', name: 'Rookie Patch', rarity: 'common', hint: 'Hire first astronaut' },
        { id: 'col_cb2', name: 'Team Leader Pin', rarity: 'common', hint: 'Have 10 astronauts' },
        { id: 'col_cb3', name: 'Silver Wings', rarity: 'uncommon', hint: 'Upgrade to Trained' },
        { id: 'col_cb4', name: 'Gold Wings', rarity: 'uncommon', hint: 'Upgrade to Veteran' },
        { id: 'col_cb5', name: 'Commander Star', rarity: 'rare', hint: 'Have 50 astronauts' },
        { id: 'col_cb6', name: 'Diamond Wings', rarity: 'rare', hint: 'Upgrade to Elite' },
        { id: 'col_cb7', name: 'Fleet Admiral Badge', rarity: 'epic', hint: 'Have 100 astronauts' },
        { id: 'col_cb8', name: 'Legendary Crest', rarity: 'epic', hint: 'Upgrade to Legendary' },
        { id: 'col_cb9', name: 'Grand Admiral Medal', rarity: 'legendary', hint: 'Have 500 astronauts' },
        { id: 'col_cb10', name: 'Cosmic Emperor Crown', rarity: 'legendary', hint: '50 Legendary astronauts' }
      ],
      bonus: 'All crew bonuses x2',
      bonusEffect: { crewMultiplier: 2 }
    },
    alienRelics: {
      name: 'Alien Relics',
      items: [
        { id: 'col_ar1', name: 'Alien Microchip', rarity: 'uncommon', hint: 'First Alien Signal decoded' },
        { id: 'col_ar2', name: 'Alien Data Crystal', rarity: 'uncommon', hint: '5 Alien Signals decoded' },
        { id: 'col_ar3', name: 'Alien Star Map', rarity: 'rare', hint: '10 Alien Signals decoded' },
        { id: 'col_ar4', name: 'Alien Power Cell', rarity: 'rare', hint: '5 artifact fragments' },
        { id: 'col_ar5', name: 'Alien Comm Device', rarity: 'epic', hint: '10 artifact fragments' },
        { id: 'col_ar6', name: 'Alien Engine Blueprint', rarity: 'epic', hint: 'Reach Alpha Centauri' },
        { id: 'col_ar7', name: 'Alien Genome Sample', rarity: 'legendary', hint: 'Europa Deep Ocean Lab x50' },
        { id: 'col_ar8', name: 'Alien Dyson Blueprint', rarity: 'legendary', hint: 'Colonize 20 systems' }
      ],
      bonus: 'AS detection x5, SD x3',
      bonusEffect: { asChanceMultiplier: 5, sdMultiplier: 3 }
    },
    shipModels: {
      name: 'Ship Models',
      items: [
        { id: 'col_sm1', name: 'Scout Probe Model', rarity: 'common', hint: 'Own 50 Scout Probes' },
        { id: 'col_sm2', name: 'Mining Shuttle Model', rarity: 'common', hint: 'Own 50 Mining Shuttles' },
        { id: 'col_sm3', name: 'Mining Barge Model', rarity: 'uncommon', hint: 'Own 25 Mining Barges' },
        { id: 'col_sm4', name: 'Refinery Ship Model', rarity: 'uncommon', hint: 'Own 25 Refinery Ships' },
        { id: 'col_sm5', name: 'Heavy Freighter Model', rarity: 'rare', hint: 'Own 10 Heavy Freighters' },
        { id: 'col_sm6', name: 'Destroyer Model', rarity: 'rare', hint: 'Own 10 Destroyers' },
        { id: 'col_sm7', name: 'Capital Ship Model', rarity: 'epic', hint: 'Own 5 Capital Ships' },
        { id: 'col_sm8', name: 'Dyson Collector Model', rarity: 'epic', hint: 'Own 5 Dyson Collectors' }
      ],
      bonus: 'All fleet output x3',
      bonusEffect: { fleetMultiplier: 3 }
    },
    cosmicWonders: {
      name: 'Cosmic Wonders',
      items: [
        { id: 'col_cw1', name: 'Nebula Photo', rarity: 'rare', hint: 'Discover Nebula System' },
        { id: 'col_cw2', name: 'Black Hole Image', rarity: 'rare', hint: 'Discover Black Hole System' },
        { id: 'col_cw3', name: 'Pulsar Recording', rarity: 'epic', hint: 'Discover 30 star systems' },
        { id: 'col_cw4', name: 'Supernova Remnant', rarity: 'epic', hint: 'Prestige 20 times' },
        { id: 'col_cw5', name: 'Quasar Spectrum', rarity: 'legendary', hint: 'Complete Universe-alpha' },
        { id: 'col_cw6', name: 'Cosmic Web Map', rarity: 'legendary', hint: 'Colonize all 50 systems' }
      ],
      bonus: 'SD x10, CD from prestige +50%',
      bonusEffect: { sdMultiplier: 10, prestigeMultiplier: 1.5 }
    },
    // ===== EXPANSION B BATCH 2: New Collection Sets =====
    weatherLogs: {
      name: 'Weather Logs',
      items: [
        { id: 'col_wl1', name: 'Solar Flare Photo', rarity: 'common', hint: 'Experience Solar Flare weather' },
        { id: 'col_wl2', name: 'Meteor Rain Sample', rarity: 'common', hint: 'Experience Meteor Rain weather' },
        { id: 'col_wl3', name: 'Dust Storm Recording', rarity: 'uncommon', hint: 'Experience Dust Storm in Phase 4' },
        { id: 'col_wl4', name: 'Lightning Bolt Capture', rarity: 'uncommon', hint: 'Earn 50 lightning taps' },
        { id: 'col_wl5', name: 'Mars Sunset Image', rarity: 'rare', hint: 'Witness Mars sunset weather' },
        { id: 'col_wl6', name: 'Eclipse Diagram', rarity: 'rare', hint: 'Experience eclipses in 3 different phases' },
        { id: 'col_wl7', name: 'Mars Snow Crystal', rarity: 'epic', hint: 'Experience snow on Mars (60%+ terraform)' },
        { id: 'col_wl8', name: 'Perfect Storm Photo', rarity: 'legendary', hint: 'Experience all weather types in Phase 1' }
      ],
      bonus: 'Weather effects x2 strength',
      bonusEffect: { weatherEffectMultiplier: 2 }
    },
    eggSpecimens: {
      name: 'Egg Specimens',
      items: [
        { id: 'col_es1', name: 'Bronze Shell Fragment', rarity: 'common', hint: 'Hatch 5 Bronze eggs' },
        { id: 'col_es2', name: 'Silver Shell Fragment', rarity: 'common', hint: 'Hatch 5 Silver eggs' },
        { id: 'col_es3', name: 'Gold Shell Fragment', rarity: 'uncommon', hint: 'Hatch 3 Gold eggs' },
        { id: 'col_es4', name: 'Cosmic Shell Fragment', rarity: 'rare', hint: 'Hatch first Cosmic egg' },
        { id: 'col_es5', name: 'Void Shell Fragment', rarity: 'epic', hint: 'Hatch first Void egg' },
        { id: 'col_es6', name: 'Opalescent Egg Shard', rarity: 'legendary', hint: 'Hatch 100 eggs total' }
      ],
      bonus: 'Egg incubation -25%, eggs give +50% rewards',
      bonusEffect: { eggSpeedMultiplier: 0.75, eggRewardMultiplier: 1.5 }
    },
    boosterHistory: {
      name: 'Booster History',
      items: [
        { id: 'col_bh1', name: 'First Boost Medal', rarity: 'common', hint: 'Use first booster ever' },
        { id: 'col_bh2', name: 'Credit Boost Trophy', rarity: 'common', hint: 'Use 10 Credit Boosters' },
        { id: 'col_bh3', name: 'RP Boost Trophy', rarity: 'uncommon', hint: 'Use 10 RP Boosters' },
        { id: 'col_bh4', name: 'Multi-Boost Photo', rarity: 'uncommon', hint: 'Have 3 boosters active simultaneously' },
        { id: 'col_bh5', name: 'Rare Booster Record', rarity: 'rare', hint: 'Use a Rare tier booster' },
        { id: 'col_bh6', name: 'Epic Booster Record', rarity: 'epic', hint: 'Use an Epic tier booster' },
        { id: 'col_bh7', name: 'Legendary Booster Frame', rarity: 'legendary', hint: 'Use a Legendary tier booster' }
      ],
      bonus: 'Booster durations +50%',
      bonusEffect: { boosterDurationMultiplier: 1.5 }
    },
    challengeMedals: {
      name: 'Challenge Medals',
      items: [
        { id: 'col_cm1', name: 'Speed Run Medal', rarity: 'uncommon', hint: 'Complete Speed Run challenge' },
        { id: 'col_cm2', name: 'No-Tap Medal', rarity: 'uncommon', hint: 'Complete No-Tap challenge' },
        { id: 'col_cm3', name: 'One Gen Medal', rarity: 'rare', hint: 'Complete One Generator Only challenge' },
        { id: 'col_cm4', name: 'Minimalist Medal', rarity: 'rare', hint: 'Complete Minimalist challenge' },
        { id: 'col_cm5', name: 'No Upgrades Medal', rarity: 'epic', hint: 'Complete No Upgrades challenge' },
        { id: 'col_cm6', name: 'Prestige Sprint Medal', rarity: 'epic', hint: 'Complete Prestige Sprint in under 24h' },
        { id: 'col_cm7', name: 'Ultimate Challenger Trophy', rarity: 'legendary', hint: 'Complete all 6 original challenge types' }
      ],
      bonus: 'Challenge CD rewards x2',
      bonusEffect: { challengeRewardMultiplier: 2 }
    }
  };

  const Collections = {
    unlock(s, itemId) {
      if (s.collection.items[itemId]) return false;
      s.collection.items[itemId] = { found: true, timestamp: Date.now() };
      this.checkSets(s);
      return true;
    },

    checkSets(s) {
      for (const setKey in COLLECTIONS) {
        if (s.collection.setsCompleted.includes(setKey)) continue;
        const set = COLLECTIONS[setKey];
        const allFound = set.items.every(item => s.collection.items[item.id]);
        if (allFound) {
          s.collection.setsCompleted.push(setKey);
          return setKey;
        }
      }
      return null;
    },

    checkTriggers(s) {
      const newItems = [];
      // Space Rocks triggers
      if (s.totalTaps >= 500 && s.highestPhaseReached >= 3) this._tryUnlock(s, 'col_sr1', newItems);
      if ((s.generators['p3g1'] || 0) >= 50) this._tryUnlock(s, 'col_sr2', newItems);
      if (s.lunarOre >= 10000) this._tryUnlock(s, 'col_sr4', newItems);
      if (s.terraforming.marsPercent >= 50) this._tryUnlock(s, 'col_sr6', newItems);
      if ((s.generators['p5g3'] || 0) >= 100) this._tryUnlock(s, 'col_sr8', newItems);
      if (s.totalPrestigeCount >= 1) this._tryUnlock(s, 'col_sr9', newItems);
      if (s.highestPhaseReached >= 7) this._tryUnlock(s, 'col_sr10', newItems);
      if (s.totalPrestigeCount >= 10) this._tryUnlock(s, 'col_sr12', newItems);
      // Crew Badges triggers
      if (s.crew.totalAstronauts >= 1) this._tryUnlock(s, 'col_cb1', newItems);
      if (s.crew.totalAstronauts >= 10) this._tryUnlock(s, 'col_cb2', newItems);
      if (s.crew.astronauts.some(a => a.tier >= 1)) this._tryUnlock(s, 'col_cb3', newItems);
      if (s.crew.astronauts.some(a => a.tier >= 2)) this._tryUnlock(s, 'col_cb4', newItems);
      if (s.crew.totalAstronauts >= 50) this._tryUnlock(s, 'col_cb5', newItems);
      if (s.crew.astronauts.some(a => a.tier >= 3)) this._tryUnlock(s, 'col_cb6', newItems);
      if (s.crew.totalAstronauts >= 100) this._tryUnlock(s, 'col_cb7', newItems);
      if (s.crew.astronauts.some(a => a.tier >= 4)) this._tryUnlock(s, 'col_cb8', newItems);
      if (s.crew.totalAstronauts >= 500) this._tryUnlock(s, 'col_cb9', newItems);
      // Alien Relics triggers
      if (s.alienSignals >= 1) this._tryUnlock(s, 'col_ar1', newItems);
      if (s.alienSignals >= 5) this._tryUnlock(s, 'col_ar2', newItems);
      if (s.alienSignals >= 10) this._tryUnlock(s, 'col_ar3', newItems);
      if (s.alienArtifacts >= 5) this._tryUnlock(s, 'col_ar4', newItems);
      if (s.alienArtifacts >= 10) this._tryUnlock(s, 'col_ar5', newItems);
      if (s.highestPhaseReached >= 7) this._tryUnlock(s, 'col_ar6', newItems);
      // Ship Models triggers
      if ((s.generators['p5g1'] || 0) >= 50) this._tryUnlock(s, 'col_sm1', newItems);
      if ((s.generators['p5g2'] || 0) >= 50) this._tryUnlock(s, 'col_sm2', newItems);
      if ((s.generators['p5g3'] || 0) >= 25) this._tryUnlock(s, 'col_sm3', newItems);
      if ((s.generators['p5g4'] || 0) >= 25) this._tryUnlock(s, 'col_sm4', newItems);
      if ((s.generators['p5g5'] || 0) >= 10) this._tryUnlock(s, 'col_sm5', newItems);
      if ((s.generators['p5g6'] || 0) >= 10) this._tryUnlock(s, 'col_sm6', newItems);
      if ((s.generators['p5g7'] || 0) >= 5) this._tryUnlock(s, 'col_sm7', newItems);
      if ((s.generators['p5g8'] || 0) >= 5) this._tryUnlock(s, 'col_sm8', newItems);
      // Cosmic Wonders triggers
      if (s.stats.totalStarSystemsColonized >= 30) this._tryUnlock(s, 'col_cw3', newItems);
      if (s.totalPrestigeCount >= 20) this._tryUnlock(s, 'col_cw4', newItems);
      if (s.stats.totalStarSystemsColonized >= 50) this._tryUnlock(s, 'col_cw6', newItems);
      // Crew Badge: 50 Legendary astronauts
      if (s.crew.astronauts.filter(a => a.tier >= 4).length >= 50) this._tryUnlock(s, 'col_cb10', newItems);
      // Weather Logs triggers
      if (s.stats.weatherTypesExperienced && s.stats.weatherTypesExperienced.includes('flare')) this._tryUnlock(s, 'col_wl1', newItems);
      if (s.stats.weatherTypesExperienced && s.stats.weatherTypesExperienced.includes('meteor_shower')) this._tryUnlock(s, 'col_wl2', newItems);
      if (s.stats.weatherTypesExperienced && s.stats.weatherTypesExperienced.includes('dust_storm')) this._tryUnlock(s, 'col_wl3', newItems);
      if ((s.stats.lightningTaps || 0) >= 50) this._tryUnlock(s, 'col_wl4', newItems);
      if (s.stats.marsSunsetSeen) this._tryUnlock(s, 'col_wl5', newItems);
      if (s.stats.eclipsePhases && s.stats.eclipsePhases.length >= 3) this._tryUnlock(s, 'col_wl6', newItems);
      if (s.stats.weatherTypesExperienced && s.stats.weatherTypesExperienced.includes('snow')) this._tryUnlock(s, 'col_wl7', newItems);
      if (s.stats.p1WeatherComplete) this._tryUnlock(s, 'col_wl8', newItems);
      // Egg Specimens triggers
      if ((s.stats.bronzeEggsHatched || 0) >= 5) this._tryUnlock(s, 'col_es1', newItems);
      if ((s.stats.silverEggsHatched || 0) >= 5) this._tryUnlock(s, 'col_es2', newItems);
      if ((s.stats.goldEggsHatched || 0) >= 3) this._tryUnlock(s, 'col_es3', newItems);
      if ((s.stats.cosmicEggsHatched || 0) >= 1) this._tryUnlock(s, 'col_es4', newItems);
      if ((s.stats.voidEggsHatched || 0) >= 1) this._tryUnlock(s, 'col_es5', newItems);
      if ((s.stats.eggsHatched || 0) >= 100) this._tryUnlock(s, 'col_es6', newItems);
      // Booster History triggers
      if ((s.stats.boostersActivated || 0) >= 1) this._tryUnlock(s, 'col_bh1', newItems);
      if ((s.stats.creditBoostersUsed || 0) >= 10) this._tryUnlock(s, 'col_bh2', newItems);
      if ((s.stats.rpBoostersUsed || 0) >= 10) this._tryUnlock(s, 'col_bh3', newItems);
      if ((s.stats.maxSimultaneousBoosters || 0) >= 3) this._tryUnlock(s, 'col_bh4', newItems);
      if (s.stats.rareBoosterUsed) this._tryUnlock(s, 'col_bh5', newItems);
      if (s.stats.epicBoosterUsed) this._tryUnlock(s, 'col_bh6', newItems);
      if (s.stats.legendaryBoosterUsed) this._tryUnlock(s, 'col_bh7', newItems);
      // Challenge Medal triggers
      if (s.stats.completedChallengeTypes && s.stats.completedChallengeTypes.includes('speed_run')) this._tryUnlock(s, 'col_cm1', newItems);
      if (s.stats.completedChallengeTypes && s.stats.completedChallengeTypes.includes('no_tap')) this._tryUnlock(s, 'col_cm2', newItems);
      if (s.stats.completedChallengeTypes && s.stats.completedChallengeTypes.includes('one_gen')) this._tryUnlock(s, 'col_cm3', newItems);
      if (s.stats.completedChallengeTypes && s.stats.completedChallengeTypes.includes('minimalist')) this._tryUnlock(s, 'col_cm4', newItems);
      if (s.stats.completedChallengeTypes && s.stats.completedChallengeTypes.includes('no_upgrades')) this._tryUnlock(s, 'col_cm5', newItems);
      if (s.stats.completedChallengeTypes && s.stats.completedChallengeTypes.includes('prestige_sprint')) this._tryUnlock(s, 'col_cm6', newItems);
      if ((s.stats.challengeTypesCompleted || 0) >= 6) this._tryUnlock(s, 'col_cm7', newItems);
      return newItems;
    },

    _tryUnlock(s, itemId, arr) {
      if (!s.collection.items[itemId]) {
        this.unlock(s, itemId);
        arr.push(itemId);
      }
    },

    getProgress(s) {
      let total = 0, found = 0;
      for (const setKey in COLLECTIONS) {
        total += COLLECTIONS[setKey].items.length;
        for (const item of COLLECTIONS[setKey].items) {
          if (s.collection.items[item.id]) found++;
        }
      }
      return { total, found };
    }
  };

  // ==================== CONTRACT / MISSIONS SYSTEM ====================
  const CONTRACT_TEMPLATES = [
    { id: 'ct_credits1', name: 'Credit Rush I', type: 'earn', currency: 'credits', target: 10000, time: 600, reward: { credits: 50000 } },
    { id: 'ct_credits2', name: 'Credit Rush II', type: 'earn', currency: 'credits', target: 1e6, time: 1800, reward: { credits: 5e6 } },
    { id: 'ct_credits3', name: 'Credit Rush III', type: 'earn', currency: 'credits', target: 1e9, time: 3600, reward: { credits: 5e9 } },
    { id: 'ct_rp1', name: 'Research Grant I', type: 'earn', currency: 'rp', target: 50, time: 900, reward: { rp: 100 } },
    { id: 'ct_ore1', name: 'Mining Contract I', type: 'earn', currency: 'ore', target: 100, time: 1200, reward: { ore: 300 } },
    { id: 'ct_taps1', name: 'Tap Frenzy', type: 'tap', target: 200, time: 300, reward: { credits: -1 } },
    { id: 'ct_combo1', name: 'Combo Master', type: 'combo', target: 50, time: 600, reward: { rp: 50, credits: -1 } },
    { id: 'ct_buy1', name: 'Expansion Plan I', type: 'buy', target: 20, time: 900, reward: { special: 'boost1h' } },
    { id: 'ct_buy2', name: 'Expansion Plan II', type: 'buy', target: 50, time: 1800, reward: { special: 'boost1h_1.5' } },
    { id: 'ct_rp2', name: 'Research Grant II', type: 'earn', currency: 'rp', target: 500, time: 1800, reward: { rp: 1500 } },
    { id: 'ct_ore2', name: 'Mining Contract II', type: 'earn', currency: 'ore', target: 5000, time: 3600, reward: { ore: 15000 } },
    { id: 'ct_rm1', name: 'Mineral Survey', type: 'earn', currency: 'rm', target: 50, time: 1800, reward: { rm: 150 } },
    { id: 'ct_sd1', name: 'Stardust Collector', type: 'earn', currency: 'sd', target: 100, time: 3600, reward: { sd: 300 } },
    { id: 'ct_combo100', name: 'Mega Tap', type: 'combo', target: 100, time: 900, reward: { cosmicDust: 1 } },
    { id: 'ct_crit5', name: 'Critical Streak', type: 'critical', target: 5, time: 600, reward: { special: 'collection_item' } },
    { id: 'ct_daily', name: 'Daily Challenge', type: 'earn', currency: 'credits', target: 1e12, time: 7200, reward: { cosmicDust: 10 }, special: true },
    { id: 'ct_terraform', name: 'Speed Terraform', type: 'terraform', target: 10, time: 3600, reward: { special: 'terraform_perm_1.5' } },
    // ===== EXPANSION B BATCH 2: More Contract Templates =====
    { id: 'ct_credits4', name: 'Credit Rush IV', type: 'earn', currency: 'credits', target: 1e15, time: 7200, reward: { credits: 5e15 } },
    { id: 'ct_credits5', name: 'Credit Rush V', type: 'earn', currency: 'credits', target: 1e21, time: 14400, reward: { cosmicDust: 5 } },
    { id: 'ct_rp3', name: 'Research Grant III', type: 'earn', currency: 'rp', target: 5000, time: 3600, reward: { rp: 15000, special: 'boost1h' } },
    { id: 'ct_ore3', name: 'Mining Contract III', type: 'earn', currency: 'ore', target: 50000, time: 7200, reward: { ore: 150000 } },
    { id: 'ct_rm2', name: 'Mineral Expedition', type: 'earn', currency: 'rm', target: 500, time: 3600, reward: { rm: 1500 } },
    { id: 'ct_sd2', name: 'Stardust Haul', type: 'earn', currency: 'sd', target: 1000, time: 7200, reward: { sd: 3000, special: 'randomEgg' } },
    { id: 'ct_taps2', name: 'Tap Marathon', type: 'tap', target: 1000, time: 600, reward: { credits: -1, special: 'boost2h' } },
    { id: 'ct_taps3', name: 'Tap Blitz', type: 'tap', target: 5000, time: 1800, reward: { cosmicDust: 2 } },
    { id: 'ct_combo200', name: 'Combo Legend', type: 'combo', target: 200, time: 1200, reward: { cosmicDust: 5 } },
    { id: 'ct_buy3', name: 'Expansion Plan III', type: 'buy', target: 100, time: 3600, reward: { special: 'boost2h_2x' } },
    { id: 'ct_hatch1', name: 'Egg Hatcher', type: 'hatch', target: 3, time: 86400, reward: { special: 'goldEgg' } },
    { id: 'ct_hatch2', name: 'Nest Manager', type: 'hatch', target: 10, time: 172800, reward: { cosmicDust: 10 } },
    { id: 'ct_crit10', name: 'Critical Barrage', type: 'critical', target: 10, time: 900, reward: { credits: -1 } },
    { id: 'ct_collect1', name: 'Collector I', type: 'collect', target: 3, time: 86400, reward: { cosmicDust: 3 } },
    { id: 'ct_survive1', name: 'Meteor Survivor', type: 'survive', target: 1, time: 600, reward: { credits: -1, special: 'silverEgg' } },
    { id: 'ct_minigame1', name: 'Arcade Run', type: 'minigame', target: 3, time: 3600, reward: { cosmicDust: 2 } },
    { id: 'ct_weather1', name: 'Storm Rider', type: 'weather', target: 3, time: 7200, reward: { credits: -1 } },
    { id: 'ct_fleet1', name: 'Fleet Admiral', type: 'earn', currency: 'as', target: 5, time: 7200, reward: { special: 'legendaryBooster' } }
  ];

  const Contracts = {
    generate(s) {
      if (s.contracts.active.length >= 3) return;
      const templates = CONTRACT_TEMPLATES.filter(t => {
        return !s.contracts.active.some(a => a.templateId === t.id);
      });
      while (s.contracts.active.length < 3 && templates.length > 0) {
        const idx = Math.floor(Math.random() * templates.length);
        const template = templates.splice(idx, 1)[0];
        const scale = Math.max(1, s.creditsPerSecond / 100);
        s.contracts.active.push({
          templateId: template.id,
          name: template.name,
          type: template.type,
          target: template.type === 'earn' ? template.target * Math.max(1, Math.sqrt(scale)) : template.target,
          timeRemaining: template.time,
          progress: 0,
          reward: template.reward,
          startTime: Date.now()
        });
      }
      s.contracts.lastGenerated = Date.now();
    },

    update(s, dt) {
      if (s.contracts.active.length < 3 && Date.now() - s.contracts.lastGenerated > 5000) {
        this.generate(s);
      }
      for (let i = s.contracts.active.length - 1; i >= 0; i--) {
        const c = s.contracts.active[i];
        c.timeRemaining -= dt;
        if (c.timeRemaining <= 0) {
          s.contracts.active.splice(i, 1);
        }
      }
    },

    addProgress(s, type, amount) {
      for (const c of s.contracts.active) {
        if (c.type === type) {
          c.progress += amount;
        }
      }
    },

    checkCompleted(s) {
      const completed = [];
      for (let i = s.contracts.active.length - 1; i >= 0; i--) {
        const c = s.contracts.active[i];
        if (c.progress >= c.target) {
          completed.push(c);
          s.contracts.active.splice(i, 1);
          s.contracts.completed++;
          this.grantReward(s, c);
        }
      }
      return completed;
    },

    grantReward(s, contract) {
      const r = contract.reward;
      if (r.credits) {
        const amount = r.credits === -1 ? s.creditsPerSecond * 120 : r.credits;
        GameState.addCurrency('credits', amount);
      }
      if (r.rp) GameState.addCurrency('rp', r.rp);
      if (r.ore) GameState.addCurrency('ore', r.ore);
      if (r.rm) GameState.addCurrency('rm', r.rm);
      if (r.sd) GameState.addCurrency('sd', r.sd);
      if (r.cosmicDust) GameState.addCurrency('cosmicDust', r.cosmicDust);

      // Handle special rewards
      if (r.special) {
        switch (r.special) {
          case 'boost1h':
            // All generators x1.2 for 1 hour — add as active booster
            s.boosters.active.push({ type: 'boost_credits', remainingMs: 3600000, mult: 1.2, target: 'all' });
            break;
          case 'boost1h_1.5':
            s.boosters.active.push({ type: 'boost_credits', remainingMs: 3600000, mult: 1.5, target: 'all' });
            break;
          case 'boost2h':
            s.boosters.active.push({ type: 'boost_credits', remainingMs: 7200000, mult: 1.2, target: 'all' });
            break;
          case 'boost2h_2x':
            s.boosters.active.push({ type: 'boost_credits', remainingMs: 7200000, mult: 2, target: 'all' });
            break;
          case 'randomEgg':
            Eggs.addRandom(s, 'rare');
            break;
          case 'goldEgg':
            Eggs.addEgg(s, 'egg_gold');
            break;
          case 'silverEgg':
            Eggs.addEgg(s, 'egg_silver');
            break;
          case 'collection_item': {
            const newItems = Collections.checkTriggers(s);
            if (newItems.length === 0) {
              // Grant a random booster instead if no items available
              Boosters.addRandom(s, 'uncommon');
            }
            break;
          }
          case 'terraform_perm_1.5':
            s.terraformMultiplier = (s.terraformMultiplier || 1) * 1.5;
            break;
          case 'legendaryBooster':
            Boosters.addSpecific(s, 'boost_echo');
            break;
        }
      }

      // 30% chance to earn a booster on contract completion
      if (Math.random() < 0.30) {
        const booster = Boosters.grantRandom(s);
        if (booster) {
          contract._bonusBooster = booster.name;
        }
      }

      // Track contract streak
      s.stats.contractStreak = (s.stats.contractStreak || 0) + 1;
      s.stats.contractsCompleted = (s.stats.contractsCompleted || 0) + 1;
    }
  };

  // ==================== BOOSTER SYSTEM ====================
  const BOOSTER_TYPES = [
    { id: 'boost_credits', name: 'Credit Surge', duration: 300, mult: 3, target: 'credits', rarity: 'common', color: '#FFD700', icon: '\u{1F4B0}' },
    { id: 'boost_rp', name: 'Research Frenzy', duration: 300, mult: 3, target: 'rp', rarity: 'common', color: '#4A90D9', icon: '\u{1F52C}' },
    { id: 'boost_ore', name: 'Mining Fever', duration: 300, mult: 3, target: 'ore', rarity: 'common', color: '#A8A8A8', icon: '\u26CF' },
    { id: 'boost_tap', name: 'Tap Titan', duration: 180, mult: 10, target: 'tap', rarity: 'uncommon', color: '#E67E22', icon: '\u{1F4A5}' },
    { id: 'boost_autotap', name: 'Auto-Tap Overdrive', duration: 300, mult: 5, target: 'autotap', rarity: 'uncommon', color: '#F1C40F', icon: '\u26A1' },
    { id: 'boost_lucky', name: 'Lucky Star', duration: 600, mult: 3, target: 'lucky', rarity: 'uncommon', color: '#2ECC71', icon: '\u2B50' },
    { id: 'boost_golden', name: 'Golden Touch', duration: 180, mult: 5, target: 'all', rarity: 'rare', color: '#FFD700', icon: '\u{1F451}' },
    { id: 'boost_terraform', name: 'Terraform Accelerator', duration: 600, mult: 5, target: 'terraform', rarity: 'rare', color: '#C1440E', icon: '\u{1F30D}' },
    { id: 'boost_fleet', name: 'Fleet Overdrive', duration: 300, mult: 5, target: 'fleet', rarity: 'rare', color: '#9B59B6', icon: '\u{1F680}' },
    { id: 'boost_cosmic', name: 'Cosmic Alignment', duration: 120, mult: 10, target: 'all', rarity: 'epic', color: '#FF69B4', icon: '\u{1F30C}' },
    { id: 'boost_timewarp', name: 'Time Warp', duration: 0, mult: 3600, target: 'instant', rarity: 'epic', color: '#4A90D9', icon: '\u{1F552}' },
    { id: 'boost_echo', name: 'Big Bang Echo', duration: 0, mult: 0.1, target: 'prestige_preview', rarity: 'legendary', color: '#F0E6FF', icon: '\u{1F4A5}' }
  ];

  const Boosters = {
    addRandom(s, maxRarity) {
      if (s.boosters.inventory.length >= 5) return false;
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const maxIdx = maxRarity ? rarityOrder.indexOf(maxRarity) : rarityOrder.length - 1;
      const eligible = BOOSTER_TYPES.filter(b => rarityOrder.indexOf(b.rarity) <= maxIdx);
      // Weight by rarity (common more likely)
      const weights = eligible.map(b => {
        const idx = rarityOrder.indexOf(b.rarity);
        return Math.pow(0.4, idx);
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let roll = Math.random() * totalWeight;
      let selected = eligible[0];
      for (let i = 0; i < eligible.length; i++) {
        roll -= weights[i];
        if (roll <= 0) { selected = eligible[i]; break; }
      }
      s.boosters.inventory.push({ type: selected.id, rarity: selected.rarity });
      return selected;
    },

    addSpecific(s, boosterId) {
      if (s.boosters.inventory.length >= 5) return false;
      s.boosters.inventory.push({ type: boosterId, rarity: BOOSTER_TYPES.find(b => b.id === boosterId)?.rarity || 'common' });
      return true;
    },

    activate(s, inventoryIndex) {
      if (inventoryIndex < 0 || inventoryIndex >= s.boosters.inventory.length) return false;
      const item = s.boosters.inventory.splice(inventoryIndex, 1)[0];
      const boostType = BOOSTER_TYPES.find(b => b.id === item.type);
      if (!boostType) return false;

      s.boosters.totalUsed++;

      if (boostType.target === 'instant') {
        // Time Warp: instant production
        GameState.addCurrency('credits', s.creditsPerSecond * boostType.mult);
        GameState.addCurrency('rp', s.rpPerSecond * boostType.mult);
        GameState.addCurrency('ore', s.orePerSecond * boostType.mult);
        GameState.addCurrency('rm', s.rmPerSecond * boostType.mult);
        GameState.addCurrency('sd', s.sdPerSecond * boostType.mult);
        return { boostType, instant: true };
      }

      if (boostType.target === 'prestige_preview') {
        const cd = GameState.calculatePrestigeReward();
        GameState.addCurrency('cosmicDust', Math.floor(cd * boostType.mult));
        return { boostType, instant: true };
      }

      s.boosters.active.push({
        type: item.type,
        remainingMs: boostType.duration * 1000,
        mult: boostType.mult,
        target: boostType.target
      });
      return { boostType, instant: false };
    },

    update(s, dt) {
      for (let i = s.boosters.active.length - 1; i >= 0; i--) {
        s.boosters.active[i].remainingMs -= dt * 1000;
        if (s.boosters.active[i].remainingMs <= 0) {
          s.boosters.active.splice(i, 1);
        }
      }
    },

    getActiveMultiplier(s, target) {
      let mult = 1;
      for (const b of s.boosters.active) {
        if (b.target === target || b.target === 'all') {
          mult *= b.mult;
        }
      }
      return mult;
    },

    grantRandom(s) {
      const maxRarity = s.totalPrestigeCount >= 20 ? 'legendary' :
        s.totalPrestigeCount >= 10 ? 'epic' :
        s.totalPrestigeCount >= 3 ? 'rare' : 'uncommon';
      return this.addRandom(s, maxRarity);
    }
  };

  // ==================== EGG HATCHING SYSTEM ====================
  const EGG_TYPES = [
    { id: 'egg_bronze', name: 'Bronze Egg', color: '#CD7F32', duration: 1800, rarity: 'common', icon: '\u{1F95A}' },
    { id: 'egg_silver', name: 'Silver Egg', color: '#C0C0C0', duration: 7200, rarity: 'uncommon', icon: '\u{1F95A}' },
    { id: 'egg_gold', name: 'Gold Egg', color: '#FFD700', duration: 28800, rarity: 'rare', icon: '\u{1F95A}' },
    { id: 'egg_cosmic', name: 'Cosmic Egg', color: '#F0E6FF', duration: 86400, rarity: 'epic', icon: '\u{1FA90}' },
    { id: 'egg_void', name: 'Void Egg', color: '#1A0533', duration: 172800, rarity: 'legendary', icon: '\u{1F573}' }
  ];

  const Eggs = {
    addEgg(s, eggTypeId) {
      const eggType = EGG_TYPES.find(e => e.id === eggTypeId);
      if (!eggType) return false;
      const emptySlot = s.eggs.slots.findIndex(slot => slot === null);
      if (emptySlot === -1) return false;
      let duration = eggType.duration;
      if (s.cdShopPurchased && s.cdShopPurchased['cd_warmnest']) duration *= 0.75;
      if (s.cdShopPurchased && s.cdShopPurchased['cd_hotnest']) duration *= 0.5;
      s.eggs.slots[emptySlot] = {
        type: eggTypeId,
        startTime: Date.now(),
        duration: duration * 1000,
        name: eggType.name,
        color: eggType.color
      };
      return true;
    },

    addRandom(s, maxRarity) {
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const maxIdx = maxRarity ? rarityOrder.indexOf(maxRarity) : 2; // default max rare
      const eligible = EGG_TYPES.filter(e => rarityOrder.indexOf(e.rarity) <= maxIdx);
      const weights = eligible.map(e => Math.pow(0.5, rarityOrder.indexOf(e.rarity)));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let roll = Math.random() * totalWeight;
      let selected = eligible[0];
      for (let i = 0; i < eligible.length; i++) {
        roll -= weights[i];
        if (roll <= 0) { selected = eligible[i]; break; }
      }
      return this.addEgg(s, selected.id);
    },

    getProgress(egg) {
      if (!egg) return 0;
      const elapsed = Date.now() - egg.startTime;
      return Math.min(1, elapsed / egg.duration);
    },

    isReady(egg) {
      return egg && this.getProgress(egg) >= 1;
    },

    getMaxSlots(s) {
      let slots = 1;
      if (s.currentPhase >= 3) slots = 2;
      if (s.currentPhase >= 5) slots = 3;
      return slots;
    },

    tapToWarm(s, slotIndex) {
      const egg = s.eggs.slots[slotIndex];
      if (!egg || this.isReady(egg)) return false;
      // Each tap shaves off 0.5% of total duration (diminishing: min 0.1%)
      const tapCount = egg._tapWarmCount || 0;
      const reduction = Math.max(0.001, 0.005 - tapCount * 0.0002);
      const shaved = egg.duration * reduction;
      egg.startTime -= shaved; // Move start time back to reduce remaining
      egg._tapWarmCount = tapCount + 1;
      return true;
    },

    speedHatch(s, slotIndex) {
      const egg = s.eggs.slots[slotIndex];
      if (!egg) return false;
      const remaining = egg.duration - (Date.now() - egg.startTime);
      if (remaining <= 0) return false;
      const minutesLeft = Math.ceil(remaining / 60000);
      const rmCost = minutesLeft; // 1 RM per minute
      if (!GameState.canAfford('rm', rmCost)) return false;
      GameState.spendCurrency('rm', rmCost);
      egg.startTime = Date.now() - egg.duration; // Force ready
      return true;
    },

    hatch(s, slotIndex) {
      const egg = s.eggs.slots[slotIndex];
      if (!egg || !this.isReady(egg)) return null;
      s.eggs.slots[slotIndex] = null;
      s.eggs.totalHatched++;
      s.stats.eggsHatched = (s.stats.eggsHatched || 0) + 1;

      const eggType = EGG_TYPES.find(e => e.id === egg.type);
      // Track specific egg type hatches
      if (eggType.id === 'egg_cosmic') s.stats.cosmicEggsHatched = (s.stats.cosmicEggsHatched || 0) + 1;
      if (eggType.id === 'egg_void') s.stats.voidEggsHatched = (s.stats.voidEggsHatched || 0) + 1;

      // Log entries
      if (s.stats.eggsHatched === 1) Engine.addLogEntry('log36');
      if (eggType.id === 'egg_void') Engine.addLogEntry('log37');
      if (eggType.id === 'egg_cosmic' && s.stats.cosmicEggsHatched === 1) Engine.addLogEntry('log56');

      // Generate reward based on egg type
      const reward = this.generateReward(s, eggType);
      return { eggType, reward };
    },

    generateReward(s, eggType) {
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const idx = rarityOrder.indexOf(eggType.rarity);
      const timeMults = [300, 1800, 7200, 36000, 86400];
      const timeMult = timeMults[idx];
      const roll = Math.random();
      if (roll < 0.4) {
        // Currency reward
        const amount = s.creditsPerSecond * timeMult;
        GameState.addCurrency('credits', amount);
        return { type: 'credits', amount };
      }
      if (roll < 0.7) {
        // Booster reward
        const maxRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const booster = Boosters.addRandom(s, maxRarities[Math.min(idx, maxRarities.length - 1)]);
        return { type: 'booster', booster };
      }
      if (roll < 0.9 && idx >= 3) {
        // CD reward for epic/legendary
        const cdAmounts = [0, 0, 0, 5, 25];
        GameState.addCurrency('cosmicDust', cdAmounts[idx]);
        return { type: 'cosmicDust', amount: cdAmounts[idx] };
      }
      // Ore/RM reward
      const oreAmount = s.orePerSecond * timeMult;
      GameState.addCurrency('ore', Math.max(50, oreAmount));
      return { type: 'ore', amount: Math.max(50, oreAmount) };
    },

    grantRandomEgg(s) {
      // Grant a random egg (tier based on prestige count)
      const maxRarity = s.totalPrestigeCount >= 25 ? 'legendary' :
        s.totalPrestigeCount >= 10 ? 'epic' :
        s.totalPrestigeCount >= 5 ? 'rare' : 'uncommon';
      return this.addRandom(s, maxRarity);
    },

    grantEgg(s, typeId) {
      return this.addEgg(s, 'egg_' + typeId);
    }
  };

  // ==================== WEATHER SYSTEM ====================
  const WEATHER_BY_PHASE = {
    1: [
      { id: 'sunny', name: 'Sunny', effect: null, duration: [600, 1200] },
      { id: 'cloudy', name: 'Cloudy', effect: null, duration: [600, 1200] },
      { id: 'rain', name: 'Rain', effect: { creditMult: 0.9 }, duration: [300, 900] },
      { id: 'golden_hour', name: 'Golden Hour', effect: { creditMult: 1.1 }, duration: [300, 600] },
      { id: 'lightning', name: 'Lightning Storm', effect: { freeTaps: true }, duration: [180, 480] },
      { id: 'night', name: 'Starry Night', effect: { tapMult: 1.5 }, duration: [600, 900] }
    ],
    2: [
      { id: 'clear', name: 'Clear Space', effect: null, duration: [600, 1200] },
      { id: 'sunrise', name: 'Earth Sunrise', effect: { rpMult: 1.2 }, duration: [300, 600] },
      { id: 'aurora', name: 'Aurora Below', effect: { creditMult: 1.05 }, duration: [300, 900] },
      { id: 'eclipse', name: 'Solar Eclipse', effect: { rpMult: 2 }, duration: [180, 420] }
    ],
    3: [
      { id: 'earthrise', name: 'Earth Rise', effect: { creditMult: 1.1 }, duration: [300, 600] },
      { id: 'flare', name: 'Solar Flare', effect: { creditMult: 1.5 }, duration: [120, 300] },
      { id: 'meteor_shower', name: 'Meteor Shower', effect: { oreBonus: 5 }, duration: [180, 480] },
      { id: 'deep_shadow', name: 'Deep Shadow', effect: { oreMult: 1.5 }, duration: [300, 600] }
    ],
    4: [
      { id: 'clear_red', name: 'Clear Red Sky', effect: null, duration: [600, 1200] },
      { id: 'dust_storm', name: 'Dust Storm', effect: { creditMult: 0.8, terraformMult: 1.5 }, duration: [300, 900] },
      { id: 'blue_sunset', name: 'Blue Sunset', effect: { creditMult: 1.15 }, duration: [180, 420] },
      { id: 'first_rain', name: 'First Rain', effect: { terraformMult: 2 }, duration: [300, 600], minTerraform: 25 },
      { id: 'snow', name: 'Martian Snow', effect: { creditMult: 1.1 }, duration: [300, 600], minTerraform: 60 }
    ],
    5: [
      { id: 'calm', name: 'Calm Belt', effect: null, duration: [600, 1200] },
      { id: 'dense', name: 'Dense Field', effect: { rmMult: 1.5 }, duration: [300, 600] },
      { id: 'solar_wind', name: 'Solar Wind', effect: { creditMult: 1.2 }, duration: [300, 600] },
      { id: 'asteroid_cloud', name: 'Asteroid Cloud', effect: { oreMult: 2, creditMult: 0.8 }, duration: [300, 600] },
      { id: 'pirate_patrol', name: 'Pirate Patrol', effect: { creditMult: 0.7 }, duration: [180, 360] },
      { id: 'trade_route', name: 'Trade Route Bloom', effect: { creditMult: 1.8, rmMult: 1.3 }, duration: [240, 480] }
    ],
    6: [
      { id: 'red_spot', name: 'Great Red Spot', effect: { creditMult: 1.5 }, duration: [300, 600] },
      { id: 'io_eruption', name: 'Io Eruption', effect: { ioImmune: true }, duration: [300, 300] },
      { id: 'europa_geyser', name: 'Europa Geyser', effect: { asMult: 2 }, duration: [300, 300] },
      { id: 'mag_storm', name: 'Magnetic Storm', effect: { rpMult: 2 }, duration: [300, 600] },
      { id: 'radiation_belt', name: 'Radiation Belt', effect: { crewMult: 0.5, rpMult: 3 }, duration: [180, 360] },
      { id: 'callisto_eclipse', name: 'Callisto Eclipse', effect: { sdMult: 2, creditMult: 1.2 }, duration: [180, 420] },
      { id: 'ganymede_tides', name: 'Ganymede Tides', effect: { creditMult: 1.3 }, duration: [300, 600] }
    ],
    7: [
      { id: 'binary_sunrise', name: 'Binary Sunrise', effect: { sdMult: 1.5 }, duration: [300, 600] },
      { id: 'stellar_wind', name: 'Stellar Wind', effect: { creditMult: 1.1 }, duration: [300, 600] },
      { id: 'alien_aurora', name: 'Alien Aurora', effect: { crewMult: 1.5 }, duration: [300, 600] },
      { id: 'nebula_fog', name: 'Nebula Fog', effect: { sdMult: 2, creditMult: 0.9 }, duration: [300, 600] },
      { id: 'supernova_echo', name: 'Supernova Echo', effect: { sdMult: 3 }, duration: [120, 300] },
      { id: 'dark_matter_flow', name: 'Dark Matter Flow', effect: { creditMult: 1.5, rpMult: 1.5, sdMult: 1.5 }, duration: [180, 420] },
      { id: 'wormhole_proximity', name: 'Wormhole Proximity', effect: { tapMult: 3 }, duration: [120, 240] }
    ],
    8: [
      { id: 'stellar_nursery', name: 'Stellar Nursery', effect: { sdMult: 1.3 }, duration: [300, 600] },
      { id: 'cosmic_calm', name: 'Cosmic Calm', effect: null, duration: [600, 1200] },
      { id: 'galactic_tide', name: 'Galactic Tide', effect: { creditMult: 2, sdMult: 2 }, duration: [300, 600] },
      { id: 'quasar_beam', name: 'Quasar Beam', effect: { rpMult: 5 }, duration: [120, 240] },
      { id: 'dark_nebula', name: 'Dark Nebula', effect: { creditMult: 0.5, sdMult: 3 }, duration: [300, 600] },
      { id: 'cosmic_dawn', name: 'Cosmic Dawn', effect: { creditMult: 1.5, rpMult: 1.5, sdMult: 1.5, tapMult: 2 }, duration: [180, 360] }
    ],
    9: [
      { id: 'reality_glitch', name: 'Reality Glitch', effect: { creditMult: 1.5 }, duration: [120, 300] },
      { id: 'void', name: 'The Void', effect: null, duration: [600, 1200] },
      { id: 'dimension_bleed', name: 'Dimension Bleed', effect: { creditMult: 2, rpMult: 2, sdMult: 2 }, duration: [120, 300] },
      { id: 'time_loop', name: 'Time Loop', effect: { tapMult: 5 }, duration: [60, 120] },
      { id: 'entropy_wave', name: 'Entropy Wave', effect: { creditMult: 0.1, sdMult: 10 }, duration: [120, 240] }
    ]
  };

  const Weather = {
    update(s, dt) {
      s.weather.nextChangeIn -= dt;
      if (s.weather.nextChangeIn <= 0) {
        this.change(s);
      }
    },

    change(s) {
      const phase = s.currentPhase;
      const weathers = WEATHER_BY_PHASE[phase] || WEATHER_BY_PHASE[1];
      const eligible = weathers.filter(w => {
        if (w.minTerraform && s.terraforming.marsPercent < w.minTerraform) return false;
        return true;
      });
      const newWeather = eligible[Math.floor(Math.random() * eligible.length)];
      s.weather.current = newWeather.id;
      s.weather.lastChange = Date.now();
      const dur = newWeather.duration;
      s.weather.nextChangeIn = dur[0] + Math.random() * (dur[1] - dur[0]);
      // Weather transition sound
      if (typeof AdaptiveAudio !== 'undefined' && AdaptiveAudio.playWeatherTransitionSound) {
        AdaptiveAudio.playWeatherTransitionSound(newWeather.id);
      }
    },

    getCurrentEffect(s) {
      const phase = s.currentPhase;
      const weathers = WEATHER_BY_PHASE[phase] || WEATHER_BY_PHASE[1];
      const current = weathers.find(w => w.id === s.weather.current);
      return current ? current.effect : null;
    },

    getCurrentName(s) {
      const phase = s.currentPhase;
      const weathers = WEATHER_BY_PHASE[phase] || WEATHER_BY_PHASE[1];
      const current = weathers.find(w => w.id === s.weather.current);
      return current ? current.name : 'Clear';
    }
  };

  // ==================== IDLE STREAK SYSTEM ====================
  const IdleStreak = {
    update(s, dt) {
      const elapsed = (Date.now() - s.streaks.idleStreakStartTimestamp) / 1000;
      if (elapsed >= 14400) s.streaks.idleStreakBonus = 1.0;
      else if (elapsed >= 7200) s.streaks.idleStreakBonus = 0.5;
      else if (elapsed >= 3600) s.streaks.idleStreakBonus = 0.3;
      else if (elapsed >= 1800) s.streaks.idleStreakBonus = 0.15;
      else if (elapsed >= 600) s.streaks.idleStreakBonus = 0.05;
      else s.streaks.idleStreakBonus = 0;
    },

    getMultiplier(s) {
      return 1 + s.streaks.idleStreakBonus;
    }
  };

  // ==================== PURCHASE STREAK SYSTEM ====================
  const PurchaseStreak = {
    onPurchase(s) {
      const now = Date.now();
      if (now - s.streaks.lastPurchaseTimestamp < 2000) {
        s.streaks.purchaseStreak++;
      } else {
        s.streaks.purchaseStreak = 1;
      }
      s.streaks.lastPurchaseTimestamp = now;
      return s.streaks.purchaseStreak;
    },

    getDiscount(streak) {
      if (streak >= 10) return { discount: 0, label: 'Shopping Frenzy!', boostAll: true };
      if (streak >= 5) return { discount: 0.25, label: 'Spending Spree!' };
      if (streak >= 3) return { discount: 0.10, label: 'Triple Threat!' };
      if (streak >= 2) return { discount: 0.05, label: 'Double Down!' };
      return { discount: 0, label: '' };
    }
  };

  // ==================== NEXT UNLOCK TEASER ====================
  const NextUnlock = {
    get(s) {
      // Find the nearest unlock
      const phase = s.currentPhase;
      const upgrades = GameData.UPGRADES[phase] || [];
      for (const upg of upgrades) {
        if (s.upgradesPurchased[upg.id]) continue;
        if (upg.effect && upg.effect.unlockPhase) {
          const current = GameState.getCurrency(upg.currency);
          const progress = Math.min(1, current / upg.cost);
          return {
            name: upg.name,
            desc: `Phase ${upg.effect.unlockPhase}!`,
            cost: upg.cost,
            currency: upg.currency,
            have: current,
            progress
          };
        }
      }
      // Next generator milestone
      const keys = Engine.getActiveGeneratorKeysForPhase(phase);
      let closest = null;
      let closestDiff = Infinity;
      for (const key of keys) {
        const gens = GameData.GENERATORS[key];
        if (!gens) continue;
        for (const gen of gens) {
          const count = s.generators[gen.id] || 0;
          const next = Milestones.getNextMilestone(s, gen.id);
          if (next && next.count - count < closestDiff && count > 0) {
            closestDiff = next.count - count;
            closest = { genId: gen.id, genName: gen.name, next };
          }
        }
      }
      if (closest) {
        const count = s.generators[closest.genId] || 0;
        return {
          name: `${closest.genName} Milestone`,
          desc: `x${closest.next.mult} at ${closest.next.count}`,
          cost: closest.next.count,
          currency: 'count',
          have: count,
          progress: count / closest.next.count
        };
      }
      return null;
    }
  };

  // ==================== EXPANDED ACHIEVEMENTS (expansion-specific) ====================
  const EXPANSION_ACHIEVEMENTS = [
    // Combo
    { id: 'ach_combo10', name: 'Combo Starter', desc: 'Reach x10 combo', reward: { credits: 5000 }, check: s => s.combo.bestAllTime >= 10, category: 'combo' },
    { id: 'ach_combo25', name: 'Combo Adept', desc: 'Reach x25 combo', reward: { credits: 100000 }, check: s => s.combo.bestAllTime >= 25, category: 'combo' },
    { id: 'ach_combo50', name: 'Combo Master', desc: 'Reach x50 combo', reward: { credits: 10e6 }, check: s => s.combo.bestAllTime >= 50, category: 'combo' },
    { id: 'ach_combo75', name: 'Combo Legend', desc: 'Reach x75 combo', reward: { credits: 1e9 }, check: s => s.combo.bestAllTime >= 75, category: 'combo' },
    { id: 'ach_combo100', name: 'MEGA FRENZY', desc: 'Reach x100 combo', reward: { cosmicDust: 10 }, check: s => s.combo.bestAllTime >= 100, category: 'combo' },
    // Critical
    { id: 'ach_crit1', name: 'Lucky Strike', desc: 'Land first critical tap', reward: { credits: 1000 }, check: s => s.criticalTaps.totalCriticals >= 1, category: 'critical' },
    { id: 'ach_crit50', name: 'Critical Thinking', desc: 'Land 50 critical taps', reward: { credits: 500000 }, check: s => s.criticalTaps.totalCriticals >= 50, category: 'critical' },
    { id: 'ach_crit500', name: 'Critical Mass', desc: 'Land 500 critical taps', reward: { credits: 500e6 }, check: s => s.criticalTaps.totalCriticals >= 500, category: 'critical' },
    { id: 'ach_super1', name: 'Super Critical', desc: 'Land first Super Critical', reward: { cosmicDust: 5 }, check: s => s.criticalTaps.totalSuperCriticals >= 1, category: 'critical' },
    // Lucky Drops
    { id: 'ach_drop1', name: 'Eagle Eye', desc: 'Tap first Lucky Drop', reward: { credits: 500 }, check: s => s.luckyDrops.totalCaught >= 1, category: 'drops' },
    { id: 'ach_drop50', name: 'Quick Hands', desc: 'Tap 50 Lucky Drops', reward: { credits: 1e6 }, check: s => s.luckyDrops.totalCaught >= 50, category: 'drops' },
    { id: 'ach_drop200', name: 'Drop Hunter', desc: 'Tap 200 Lucky Drops', reward: { credits: 1e9 }, check: s => s.luckyDrops.totalCaught >= 200, category: 'drops' },
    { id: 'ach_cosmic_frag', name: 'Cosmic Fragment Finder', desc: 'Catch a Cosmic Fragment', reward: { cosmicDust: 5 }, check: s => s.luckyDrops.cosmicFragmentsCaught >= 1, category: 'drops' },
    // Eggs
    { id: 'ach_egg1', name: 'First Hatch', desc: 'Hatch first egg', reward: { credits: 10000 }, check: s => s.eggs.totalHatched >= 1, category: 'eggs' },
    { id: 'ach_egg10', name: 'Egg Collector', desc: 'Hatch 10 eggs', reward: { credits: 1e6 }, check: s => s.eggs.totalHatched >= 10, category: 'eggs' },
    { id: 'ach_egg50', name: 'Egg Master', desc: 'Hatch 50 eggs', reward: { credits: 1e9 }, check: s => s.eggs.totalHatched >= 50, category: 'eggs' },
    // Contracts
    { id: 'ach_contract1', name: 'Contractor', desc: 'Complete first contract', reward: { credits: 5000 }, check: s => s.contracts.completed >= 1, category: 'contracts' },
    { id: 'ach_contract10', name: 'Freelancer', desc: 'Complete 10 contracts', reward: { credits: 1e6 }, check: s => s.contracts.completed >= 10, category: 'contracts' },
    { id: 'ach_contract50', name: 'Professional', desc: 'Complete 50 contracts', reward: { cosmicDust: 10 }, check: s => s.contracts.completed >= 50, category: 'contracts' },
    // Boosters
    { id: 'ach_boost1', name: 'Power Up', desc: 'Activate first booster', reward: { credits: 5000 }, check: s => s.boosters.totalUsed >= 1, category: 'boosters' },
    { id: 'ach_boost100', name: 'Boost Addict', desc: 'Activate 100 boosters', reward: { cosmicDust: 10 }, check: s => s.boosters.totalUsed >= 100, category: 'boosters' },
    // Synergy
    { id: 'ach_syn1', name: 'First Synergy', desc: 'Unlock first synergy', reward: { credits: 50000 }, check: s => s.synergies.unlocked.length >= 1, category: 'synergy' },
    { id: 'ach_syn5', name: 'Synergy Network', desc: 'Unlock 5 synergies', reward: { credits: 10e6 }, check: s => s.synergies.unlocked.length >= 5, category: 'synergy' },
    { id: 'ach_syn10', name: 'Synergy Master', desc: 'Unlock 10 synergies', reward: { credits: 1e9 }, check: s => s.synergies.unlocked.length >= 10, category: 'synergy' }
  ];

  // ==================== TIERED UPGRADE SYSTEM ====================
  const UPGRADE_TIERS = [
    { level: 1, label: 'Bronze', costMult: 1, color: '#CD7F32' },
    { level: 2, label: 'Silver', costMult: 5, color: '#C0C0C0' },
    { level: 3, label: 'Gold', costMult: 25, color: '#FFD700' },
    { level: 4, label: 'Platinum', costMult: 125, color: '#E5E4E2' },
    { level: 5, label: 'Diamond', costMult: 625, color: '#B9F2FF' }
  ];

  const TieredUpgrades = {
    // Check if an upgrade is tierable (generator-boosting or tap-boosting, not phase-unlock)
    isTierable(upgrade) {
      if (!upgrade.effect) return false;
      if (upgrade.effect.unlockPhase) return false;
      if (upgrade.effect.unlockCrew) return false;
      if (upgrade.effect.unlockBonusGenerator) return false;
      if (upgrade.effect.currencyExchange) return false;
      if (upgrade.effect.allZonesFullRate) return false;
      if (upgrade.effect.revealSystems) return false;
      if (upgrade.effect.revealSystemTypes) return false;
      if (upgrade.effect.revealMultiverse) return false;
      if (upgrade.effect.autoTerraform) return false;
      if (upgrade.effect.skipToPhase) return false;
      // Must have a multiplier-type effect
      return !!(upgrade.effect.tapMultiplier || upgrade.effect.generatorMultiplier ||
        upgrade.effect.phaseMultiplier || upgrade.effect.globalCreditMultiplier ||
        upgrade.effect.globalRPMultiplier || upgrade.effect.globalOreMultiplier);
    },

    getCurrentTier(s, upgradeId) {
      return s.upgradeTiers[upgradeId] || 0; // 0 = not purchased, 1-5 = tier level
    },

    getNextTier(s, upgradeId) {
      const current = this.getCurrentTier(s, upgradeId);
      if (current >= 5) return null;
      return UPGRADE_TIERS[current]; // next tier to buy (0-indexed by current)
    },

    getTierCost(upgrade, tierLevel) {
      if (tierLevel <= 0 || tierLevel > 5) return Infinity;
      const tier = UPGRADE_TIERS[tierLevel - 1];
      return upgrade.cost * tier.costMult;
    },

    getTierEffectMultiplier(tierLevel) {
      // Each tier multiplies the effect further
      const mults = [1, 2, 3, 3, 5]; // Bronze=base, Silver=x2, Gold=x3, Plat=x3, Diamond=x5
      if (tierLevel < 1 || tierLevel > 5) return 1;
      return mults[tierLevel - 1];
    },

    getCumulativeMultiplier(s, upgradeId) {
      const tier = this.getCurrentTier(s, upgradeId);
      let mult = 1;
      for (let i = 0; i < tier; i++) {
        mult *= this.getTierEffectMultiplier(i + 1);
      }
      return mult;
    },

    buyTier(s, upgradeId) {
      const upgrade = findUpgradeById(upgradeId);
      if (!upgrade || !this.isTierable(upgrade)) return false;

      const currentTier = this.getCurrentTier(s, upgradeId);
      if (currentTier === 0 && !s.upgradesPurchased[upgradeId]) return false;
      if (currentTier >= 5) return false;

      const nextTierLevel = currentTier + 1;
      const cost = this.getTierCost(upgrade, nextTierLevel);
      if (!GameState.canAfford(upgrade.currency, cost)) return false;

      GameState.spendCurrency(upgrade.currency, cost);
      s.upgradeTiers[upgradeId] = nextTierLevel;

      // Apply the tier-level multiplier directly to relevant state
      const tierMult = this.getTierEffectMultiplier(nextTierLevel);
      const eff = upgrade.effect;
      if (eff.tapMultiplier) s.tapMultiplier *= tierMult;
      if (eff.generatorMultiplier) {
        const gm = eff.generatorMultiplier;
        s.generatorMultipliers[gm.target] = (s.generatorMultipliers[gm.target] || 1) * tierMult;
      }
      if (eff.phaseMultiplier) {
        const pm = eff.phaseMultiplier;
        s.phaseMultipliers[pm.phase] = (s.phaseMultipliers[pm.phase] || 1) * tierMult;
      }
      if (eff.globalCreditMultiplier) s.globalCreditMultiplier *= tierMult;
      if (eff.globalRPMultiplier) s.globalRPMultiplier *= tierMult;
      if (eff.globalOreMultiplier) s.globalOreMultiplier *= tierMult;
      if (eff.terraformMultiplier) s.terraformMultiplier *= tierMult;

      Engine.calculateRates(s);
      return nextTierLevel;
    }
  };

  function findUpgradeById(upgradeId) {
    for (const phase in GameData.UPGRADES) {
      const found = GameData.UPGRADES[phase].find(u => u.id === upgradeId);
      if (found) return found;
    }
    return null;
  }

  // ==================== ROCKET SKINS ====================
  const ROCKET_SKINS = [
    { id: 'default', name: 'OG Classic', cost: 0, desc: 'Standard evolution per phase' },
    { id: 'golden_voyager', name: 'Golden Voyager', cost: 10, desc: 'Polished gold with gold particle trail' },
    { id: 'neon_racer', name: 'Neon Racer', cost: 15, desc: 'Black with neon blue/pink edge lighting' },
    { id: 'steampunk', name: 'Steampunk', cost: 20, desc: 'Brass and copper with visible gears' },
    { id: 'crystal_ship', name: 'Crystal Ship', cost: 25, desc: 'Translucent crystalline hull' },
    { id: 'living_ship', name: 'Living Ship', cost: 30, desc: 'Organic pulsing veins' },
    { id: 'pixel_cruiser', name: 'Pixel Cruiser', cost: 15, desc: '8-bit pixel art style rocket' },
    { id: 'shadow_phantom', name: 'Shadow Phantom', cost: 20, desc: 'Matte black, visible only by starlight' },
    { id: 'nebula_paint', name: 'Nebula Paint', cost: 25, desc: 'Swirling nebula texture (animated)' },
    { id: 'void_walker', name: 'Void Walker', cost: 40, desc: 'A hole in reality' },
    { id: 'planet_eater', name: 'Planet Eater', cost: 50, desc: 'Enormous, ominous mega-ship' }
  ];

  const RocketSkins = {
    buySkin(s, skinId) {
      if (s.rocket.unlockedSkins.includes(skinId)) return false;
      const skin = ROCKET_SKINS.find(sk => sk.id === skinId);
      if (!skin) return false;
      if (!GameState.canAfford('it', skin.cost)) return false;
      GameState.spendCurrency('it', skin.cost);
      s.rocket.unlockedSkins.push(skinId);
      return true;
    },

    equipSkin(s, skinId) {
      if (!s.rocket.unlockedSkins.includes(skinId)) return false;
      s.rocket.currentSkin = skinId;
      return true;
    },

    getSkinData(skinId) {
      return ROCKET_SKINS.find(sk => sk.id === skinId) || ROCKET_SKINS[0];
    }
  };

  // ==================== EXPANDED CD SHOP ITEMS ====================
  const EXPANSION_CD_SHOP = [
    { id: 'cd_luckystart', name: 'Lucky Start', cost: 20, effect: {}, desc: 'Start each run with 3 random boosters' },
    { id: 'cd_eggmagnet', name: 'Egg Magnet', cost: 40, effect: {}, desc: 'Start each run with 1 Gold Egg' },
    { id: 'cd_collection', name: 'Collection Memory', cost: 150, effect: {}, desc: 'Collection persists through prestige' },
    { id: 'cd_doubledrops', name: 'Double Drops', cost: 200, effect: {}, desc: 'Lucky Drops appear 2x more often' },
    { id: 'cd_triplecrit', name: 'Triple Critical', cost: 350, effect: {}, desc: 'Critical tap chance tripled' },
    { id: 'cd_goldenage', name: 'Golden Age', cost: 500, effect: {}, desc: 'Golden Rush every 5 min' },
    { id: 'cd_combo', name: 'Combo Persistence', cost: 250, effect: {}, desc: 'Combo timer: 0.8s -> 1.5s' },
    { id: 'cd_supercrit', name: 'Super Critical Boost', cost: 750, effect: {}, desc: 'Super Critical: 0.1% -> 0.5%' },
    { id: 'cd_autocollect', name: 'Auto-Collector', cost: 1000, effect: {}, desc: 'Auto-collect Lucky Drops' },
    { id: 'cd_warmnest', name: 'Warm Nest', cost: 75, effect: {}, desc: 'Egg incubation -25%' },
    { id: 'cd_hotnest', name: 'Hot Nest', cost: 300, effect: {}, desc: 'Egg incubation -50%', req: 'cd_warmnest' },
    { id: 'cd_skip5', name: 'Instant Phase 5', cost: 1500, effect: { skipToPhase: 5 }, desc: 'Start runs at Phase 5', req: 'cd_skip3' },
    { id: 'cd_skip7', name: 'Instant Phase 7', cost: 5000, effect: { skipToPhase: 7 }, desc: 'Start runs at Phase 7', req: 'cd_skip5' },
    { id: 'cd_cosmic_egg', name: 'Cosmic Egg on Prestige', cost: 2000, effect: {}, desc: 'Each prestige grants Cosmic Egg' },
    { id: 'cd_mastery', name: 'Mastery Bonus', cost: 3000, effect: {}, desc: 'Each max-tier upgrade +1% global income' }
  ];

  // ==================== EXPANDED LOG ENTRIES ====================
  const EXPANSION_LOG = [
    { id: 'log31', trigger: 'gen100', title: 'The Machine', text: "It's no longer a scrappy operation. It's an empire of moving parts, each one earning its keep." },
    { id: 'log32', trigger: 'goldenRush', title: 'Gold Fever', text: "Everything turned gold. For thirty beautiful seconds, the universe was generous beyond measure." },
    { id: 'log33', trigger: 'combo50', title: 'The Flow', text: "My hands moved on their own. Tap after tap. I couldn't stop. I didn't want to. This is what they call 'the zone.'" },
    { id: 'log34', trigger: 'superCritical', title: 'Lightning', text: "It hit different. One tap, and the whole system lit up like a supernova. Pure, concentrated luck." },
    { id: 'log35', trigger: 'luckyDrop', title: 'The Gift', text: "Something floated past. Instinct told me to grab it. Best instinct I ever had." },
    { id: 'log36', trigger: 'firstEgg', title: 'The Egg', text: "We found it drifting. Nobody knew what it was. When it opened, we understood: the universe has gifts for those who wait." },
    { id: 'log37', trigger: 'firstContract', title: 'Working for Hire', text: "Took on a job today. Felt good to have a clear goal for once amidst the endless expansion." },
    { id: 'log38', trigger: 'firstBooster', title: 'Power Up', text: "It's like caffeine for the entire operation. Everything faster, better, MORE. I could get used to this." },
    { id: 'log39', trigger: 'firstSynergy', title: 'Connection', text: "When the systems work together, it's more than the sum of their parts. Synergy. Beautiful word." },
    { id: 'log40', trigger: 'firstSet', title: 'The Set', text: "I looked at the collection. All of them, together. Something clicked. A resonance that made everything stronger." }
  ];

  // ==================== MAIN UPDATE FUNCTION ====================
  function update(s, dt) {
    Combo.update(s, dt);
    LuckyDrops.update(s, dt);
    GoldenRush.update(s, dt);
    FlyingBonus.update(s, dt);
    Boosters.update(s, dt);
    Weather.update(s, dt);
    IdleStreak.update(s, dt);
    Contracts.update(s, dt);
    Challenges.updateChallenge(s, dt);

    // Check collection triggers periodically (every 5 sec)
    if (!s._lastCollectionCheck || Date.now() - s._lastCollectionCheck > 5000) {
      s._lastCollectionCheck = Date.now();
      const newCollItems = Collections.checkTriggers(s);
      for (const itemId of newCollItems) {
        UI.showCollectionNotification(itemId);
      }
      const newSyns = Synergies.checkAll(s);
      for (const syn of newSyns) {
        UI.showSynergyNotification(syn);
        if (typeof AdaptiveAudio !== 'undefined' && AdaptiveAudio.playSynergySound) {
          AdaptiveAudio.playSynergySound();
        }
      }
    }

    // Check completed contracts
    const completedContracts = Contracts.checkCompleted(s);
    for (const c of completedContracts) {
      UI.showContractCompleteNotification(c);
    }

    // Apply expansion achievements
    for (const ach of EXPANSION_ACHIEVEMENTS) {
      if (s.achievements[ach.id]) continue;
      if (ach.check && ach.check(s)) {
        Engine.unlockAchievement(ach.id);
      }
    }
  }

  // ==================== FLYING BONUS SYSTEM ====================
  const FLYING_BONUS_OBJECTS = {
    1: { name: 'Stray Cat', icon: '\u{1F408}', speed: 12.5, reward: (s) => ({ currency: 'credits', amount: s.creditsPerSecond * 60 }) },
    2: { name: 'Rogue Satellite', icon: '\u{1F6F0}', speed: 20, reward: () => ({ currency: 'rp', amount: 10 }) },
    3: { name: 'Moon Rock', icon: '\u{1FA78}', speed: 16, reward: () => ({ currency: 'ore', amount: 20 }) },
    4: { name: 'Dust Devil', icon: '\u{1F32A}', speed: 14, reward: (s) => ({ currency: 'terraform', amount: 0.5 }) },
    5: { name: 'Glowing Asteroid', icon: '\u2604', speed: 25, reward: () => ({ currency: 'rm', amount: 5 }) },
    6: { name: 'Alien Probe', icon: '\u{1F47E}', speed: 33, reward: () => ({ currency: 'as', amount: 1 }) },
    7: { name: 'Comet', icon: '\u2604', speed: 33, reward: () => ({ currency: 'sd', amount: 50 }) },
    8: { name: 'Wormhole Flash', icon: '\u{1F300}', speed: 50, reward: () => ({ currency: 'sd', amount: 500 }) },
    9: { name: 'Reality Glitch', icon: '\u26A0', speed: 66, reward: () => ({ currency: 'it', amount: 1 }) }
  };

  const FlyingBonus = {
    activeObject: null,

    update(s, dt) {
      if (this.activeObject) {
        this.activeObject.x += this.activeObject.speed * dt;
        if (this.activeObject.x > 105) {
          this.activeObject = null;
        }
        return;
      }
      if (!s.flyingBonus) return;
      s.flyingBonus.nextIn -= dt;
      if (s.flyingBonus.nextIn <= 0) {
        this.spawn(s);
        s.flyingBonus.nextIn = 300 + Math.random() * 600;
      }
    },

    spawn(s) {
      const obj = FLYING_BONUS_OBJECTS[s.currentPhase];
      if (!obj) return;
      this.activeObject = {
        phase: s.currentPhase,
        name: obj.name,
        icon: obj.icon,
        x: -5,
        y: 20 + Math.random() * 60,
        speed: obj.speed,
        reward: obj.reward
      };
    },

    collect(s) {
      if (!this.activeObject) return null;
      const obj = this.activeObject;
      this.activeObject = null;
      const reward = obj.reward(s);
      if (reward.currency === 'terraform') {
        s.terraforming.marsPercent = Math.min(100, s.terraforming.marsPercent + reward.amount);
      } else {
        GameState.addCurrency(reward.currency, reward.amount);
      }
      return { name: obj.name, reward };
    }
  };

  // Enhanced tap function integration
  function onTap(s, isAuto) {
    if (isAuto) return { type: 'normal', mult: 1, comboMult: 1, tierChanged: false };

    const comboResult = Combo.onTap(s);
    const critResult = CriticalTap.roll(s);
    const comboMult = Combo.getMultiplier(s);

    // Contract tap progress
    Contracts.addProgress(s, 'tap', 1);
    if (critResult.type !== 'normal') {
      Contracts.addProgress(s, 'critical', 1);
    }
    // Combo contract — track max combo reached
    Contracts.addProgress(s, 'combo', 0); // just a presence check
    for (const c of s.contracts.active) {
      if (c.type === 'combo') {
        c.progress = Math.max(c.progress, s.combo.current);
      }
    }

    // Log entries
    if (s.combo.current >= 50 && !s.captainsLog.includes('log33')) {
      if (typeof Engine !== 'undefined' && Engine.addLogEntry) Engine.addLogEntry('log33');
    }
    if (critResult.type === 'super' && !s.captainsLog.includes('log34')) {
      if (typeof Engine !== 'undefined' && Engine.addLogEntry) Engine.addLogEntry('log34');
    }

    // Egg warm tap — tapping accelerates egg incubation slightly
    if (s.eggs && s.eggs.slots) {
      for (let i = 0; i < s.eggs.slots.length; i++) {
        if (s.eggs.slots[i] && !Eggs.isReady(s.eggs.slots[i])) {
          Eggs.tapToWarm(s, i);
          break; // Only warm first incubating egg per tap
        }
      }
    }

    return { ...critResult, comboMult, tierChanged: comboResult.tierChanged, comboTier: comboResult.tier };
  }

  function onGeneratorBuy(s, genId, count) {
    const streak = PurchaseStreak.onPurchase(s);
    const milestone = Milestones.check(s, genId);
    Contracts.addProgress(s, 'buy', count);

    // Milestone notification
    if (milestone) {
      const gen = Engine.findGenerator(genId);
      const genName = gen ? gen.name : genId;
      UI.showMilestoneNotification(genName, milestone);
    }

    // Purchase streak notification
    const streakInfo = PurchaseStreak.getDiscount(streak);
    if (streakInfo.label) {
      UI.showToast(streakInfo.label, '#27AE60');
    }

    // Log entries
    if (GameData.getTotalGenerators(s) >= 100 && !s.captainsLog.includes('log31')) {
      Engine.addLogEntry('log31');
    }

    return { streak, milestone, streakInfo };
  }

  // Multiplier aggregation for engine
  function getBoosterCreditMult(s) {
    return Boosters.getActiveMultiplier(s, 'credits');
  }
  function getBoosterRPMult(s) {
    return Boosters.getActiveMultiplier(s, 'rp');
  }
  function getBoosterOreMult(s) {
    return Boosters.getActiveMultiplier(s, 'ore');
  }
  function getBoosterTapMult(s) {
    return Boosters.getActiveMultiplier(s, 'tap');
  }
  function getBoosterTerraformMult(s) {
    return Boosters.getActiveMultiplier(s, 'terraform');
  }
  function getWeatherCreditMult(s) {
    const effect = Weather.getCurrentEffect(s);
    return effect && effect.creditMult ? effect.creditMult : 1;
  }
  function getWeatherRPMult(s) {
    const effect = Weather.getCurrentEffect(s);
    return effect && effect.rpMult ? effect.rpMult : 1;
  }
  function getWeatherTerraformMult(s) {
    const effect = Weather.getCurrentEffect(s);
    return effect && effect.terraformMult ? effect.terraformMult : 1;
  }
  function getWeatherTapMult(s) {
    const effect = Weather.getCurrentEffect(s);
    return effect && effect.tapMult ? effect.tapMult : 1;
  }

  // Apply critical tap upgrades from CD shop
  function applyCritUpgrades(s) {
    if (s.cdShopPurchased['cd_triplecrit']) {
      s.criticalTaps.chance = 0.06;
    }
    if (s.cdShopPurchased['cd_supercrit']) {
      s.criticalTaps.superChance = 0.005;
    }
  }

  // ==================== CHALLENGE RUNS ====================
  const CHALLENGE_TYPES = [
    { id: 'speed_run', name: 'Speed Run', desc: 'Reach Phase 4 ASAP. No CD bonuses.', goal: { phase: 4 }, noCDBonus: true, duration: 604800, rewards: { top10: 50, top50: 20, all: 5 } },
    { id: 'no_tap', name: 'No-Tap Challenge', desc: 'Reach Phase 3 without manual tapping.', goal: { phase: 3 }, noManualTap: true, duration: 604800, reward: 30 },
    { id: 'one_gen', name: 'One Generator Only', desc: 'Reach Phase 5 buying only 1 gen type per phase.', goal: { phase: 5 }, oneGenPerPhase: true, duration: 604800, reward: 50 },
    { id: 'minimalist', name: 'Minimalist', desc: 'Reach Phase 3 with no more than 50 generators.', goal: { phase: 3, maxGens: 50 }, duration: 604800, reward: 40 },
    { id: 'no_upgrades', name: 'No Upgrades', desc: 'Reach Phase 4 without buying upgrades.', goal: { phase: 4 }, noUpgrades: true, duration: 604800, reward: 75 },
    { id: 'prestige_sprint', name: 'Prestige Sprint', desc: 'Full prestige cycle, fastest time.', goal: { prestige: true }, duration: 604800, rewards: { under24h: 100, under48h: 50, all: 25 } },
    // ===== EXPANSION B BATCH 2: More Challenge Types =====
    { id: 'no_crew', name: 'Solo Captain', desc: 'Reach Phase 5 without hiring any crew.', goal: { phase: 5 }, noCrew: true, duration: 604800, reward: 60 },
    { id: 'tap_only', name: 'Tap Only', desc: 'Reach Phase 3 using only tap income (no generators).', goal: { phase: 3 }, noGenerators: true, duration: 604800, reward: 80 },
    { id: 'speed_p6', name: 'Jupiter Dash', desc: 'Reach Phase 6 ASAP. No CD bonuses.', goal: { phase: 6 }, noCDBonus: true, duration: 604800, rewards: { top10: 100, top50: 50, all: 15 } },
    { id: 'speed_p8', name: 'Galaxy Sprint', desc: 'Reach Phase 8 ASAP. No CD bonuses.', goal: { phase: 8 }, noCDBonus: true, duration: 604800, rewards: { top10: 200, top50: 100, all: 30 } },
    { id: 'budget_run', name: 'Budget Run', desc: 'Reach Phase 4 spending under 1M credits total.', goal: { phase: 4, maxSpent: 1e6 }, duration: 604800, reward: 45 },
    { id: 'combo_king', name: 'Combo King', desc: 'Reach 250 combo during a prestige run.', goal: { combo: 250 }, duration: 604800, reward: 35 },
    { id: 'egg_master', name: 'Egg Master', desc: 'Hatch 10 eggs in a single run.', goal: { eggsHatched: 10 }, duration: 604800, reward: 40 },
    { id: 'no_events', name: 'Stoic', desc: 'Reach Phase 4 without triggering any events.', goal: { phase: 4 }, noEvents: true, duration: 604800, reward: 55 },
    { id: 'all_gens_equal', name: 'Equality', desc: 'Have at least 10 of every generator type in current phase.', goal: { allGensMin: 10 }, duration: 604800, reward: 30 },
    { id: 'double_prestige', name: 'Double Down', desc: 'Prestige twice in under 30 minutes.', goal: { doublePrestige: true, timeLimit: 1800 }, duration: 604800, reward: 100 }
  ];

  const Challenges = {
    getActiveChallenge(s) {
      if (!s.challenge || !s.challenge.active) return null;
      return CHALLENGE_TYPES.find(c => c.id === s.challenge.typeId);
    },

    startChallenge(s, typeId) {
      const challenge = CHALLENGE_TYPES.find(c => c.id === typeId);
      if (!challenge) return false;

      // Save current game state as backup (separate slot)
      s.challenge = {
        active: true,
        typeId: typeId,
        startTime: Date.now(),
        elapsed: 0,
        completed: false
      };
      return true;
    },

    updateChallenge(s, dt) {
      if (!s.challenge || !s.challenge.active) return;
      s.challenge.elapsed += dt;

      const challenge = this.getActiveChallenge(s);
      if (!challenge) return;

      // Check completion based on goal type
      if (challenge.goal.phase && s.currentPhase >= challenge.goal.phase) {
        this.completeChallenge(s);
      }
      if (challenge.goal.prestige && s.totalPrestigeCount > (s.challenge.startPrestigeCount || 0)) {
        this.completeChallenge(s);
      }
      if (challenge.goal.combo && s.combo.bestThisSession >= challenge.goal.combo) {
        this.completeChallenge(s);
      }
      if (challenge.goal.eggsHatched && s.eggs.totalHatched >= (s.challenge._startEggs || 0) + challenge.goal.eggsHatched) {
        this.completeChallenge(s);
      }
      if (challenge.goal.allGensMin) {
        const phaseKey = String(s.currentPhase);
        const gens = GameData.GENERATORS[phaseKey];
        if (gens && gens.every(g => (s.generators[g.id] || 0) >= challenge.goal.allGensMin)) {
          this.completeChallenge(s);
        }
      }
      if (challenge.goal.doublePrestige) {
        const prestigesSinceStart = s.totalPrestigeCount - (s.challenge.startPrestigeCount || 0);
        if (prestigesSinceStart >= 2 && s.challenge.elapsed < (challenge.goal.timeLimit || 1800)) {
          this.completeChallenge(s);
        }
      }

      // Check challenge duration expiry
      if (challenge.duration && s.challenge.elapsed > challenge.duration) {
        this.abandonChallenge(s);
      }
    },

    // Validate constraints — called from core systems to enforce challenge rules
    isActionAllowed(s, action) {
      if (!s.challenge || !s.challenge.active) return true;
      const challenge = this.getActiveChallenge(s);
      if (!challenge) return true;

      switch (action) {
        case 'manualTap':
          return !challenge.noManualTap;
        case 'buyGenerator':
          if (challenge.noGenerators) return false;
          if (challenge.goal.maxGens) {
            const totalGens = GameData.getTotalGenerators ? GameData.getTotalGenerators(s) : 0;
            return totalGens < challenge.goal.maxGens;
          }
          return true;
        case 'buyUpgrade':
          return !challenge.noUpgrades;
        case 'hireCrew':
          return !challenge.noCrew;
        default:
          return true;
      }
    },

    getProgress(s) {
      if (!s.challenge || !s.challenge.active) return null;
      const challenge = this.getActiveChallenge(s);
      if (!challenge) return null;

      if (challenge.goal.phase) {
        return { current: s.currentPhase, target: challenge.goal.phase, pct: Math.min(1, (s.currentPhase - 1) / (challenge.goal.phase - 1)) };
      }
      if (challenge.goal.combo) {
        return { current: s.combo.bestThisSession, target: challenge.goal.combo, pct: Math.min(1, s.combo.bestThisSession / challenge.goal.combo) };
      }
      if (challenge.goal.prestige) {
        const done = s.totalPrestigeCount > (s.challenge.startPrestigeCount || 0);
        return { current: done ? 1 : 0, target: 1, pct: done ? 1 : 0 };
      }
      return null;
    },

    completeChallenge(s) {
      if (!s.challenge || s.challenge.completed) return;
      s.challenge.completed = true;
      s.challenge.active = false;
      s.stats.challengesCompleted = (s.stats.challengesCompleted || 0) + 1;

      const challenge = CHALLENGE_TYPES.find(c => c.id === s.challenge.typeId);
      let cdReward = 0;
      if (challenge && challenge.rewards) {
        cdReward = challenge.rewards.all || 0;
        // Time-based rewards for sprint challenges
        if (challenge.rewards.top10 && s.challenge.elapsed < 43200) {
          cdReward = challenge.rewards.top10;
        } else if (challenge.rewards.top50 && s.challenge.elapsed < 86400) {
          cdReward = challenge.rewards.top50;
        }
        if (challenge.rewards.under24h && s.challenge.elapsed < 86400) {
          cdReward = challenge.rewards.under24h;
        } else if (challenge.rewards.under48h && s.challenge.elapsed < 172800) {
          cdReward = challenge.rewards.under48h;
        }
      } else if (challenge && challenge.reward) {
        cdReward = challenge.reward;
      }

      if (cdReward > 0) {
        GameState.addCurrency('cosmicDust', cdReward);
      }

      // Track completed challenge type
      if (!s.stats.completedChallengeTypes) s.stats.completedChallengeTypes = [];
      if (!s.stats.completedChallengeTypes.includes(s.challenge.typeId)) {
        s.stats.completedChallengeTypes.push(s.challenge.typeId);
        s.stats.challengeTypesCompleted = s.stats.completedChallengeTypes.length;
      }

      if (typeof Engine !== 'undefined' && Engine.addLogEntry) {
        Engine.addLogEntry('log49');
      }
    },

    abandonChallenge(s) {
      if (!s.challenge) return;
      s.challenge.active = false;
    }
  };

  // Aggregated SD booster multiplier
  function getBoosterSDMult(s) {
    return Boosters.getActiveMultiplier(s, 'sd');
  }
  // Aggregated fleet booster multiplier
  function getBoosterFleetMult(s) {
    return Boosters.getActiveMultiplier(s, 'fleet');
  }
  // Weather SD multiplier
  function getWeatherSDMult(s) {
    const effect = Weather.getCurrentEffect(s);
    return effect && effect.sdMult ? effect.sdMult : 1;
  }
  // Weather crew multiplier
  function getWeatherCrewMult(s) {
    const effect = Weather.getCurrentEffect(s);
    return effect && effect.crewMult ? effect.crewMult : 1;
  }

  return {
    Combo, CriticalTap, LuckyDrops, GoldenRush, FlyingBonus,
    Milestones, Synergies,
    Collections, Contracts, Boosters, Eggs, Weather, IdleStreak,
    PurchaseStreak, NextUnlock, TieredUpgrades, RocketSkins, Challenges,
    COLLECTIONS, SYNERGIES, BOOSTER_TYPES, EGG_TYPES, MILESTONES,
    EXPANSION_ACHIEVEMENTS, EXPANSION_CD_SHOP, EXPANSION_LOG,
    WEATHER_BY_PHASE, DROP_TYPES, UPGRADE_TIERS, ROCKET_SKINS,
    CHALLENGE_TYPES, FLYING_BONUS_OBJECTS,
    update, onTap, onGeneratorBuy,
    getBoosterCreditMult, getBoosterRPMult, getBoosterOreMult,
    getBoosterTapMult, getBoosterTerraformMult,
    getBoosterSDMult, getBoosterFleetMult,
    getWeatherCreditMult, getWeatherRPMult, getWeatherTerraformMult,
    getWeatherTapMult, getWeatherSDMult, getWeatherCrewMult,
    applyCritUpgrades
  };
})();
