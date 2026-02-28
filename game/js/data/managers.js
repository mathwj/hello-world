// =============================================================================
// managers.js — Complete 30-Manager Roster for Farm Simulation Game
// =============================================================================
// Each manager provides a unique bonus, has a rarity tier, and can be leveled
// up to 50. Every level adds ~2% of the base bonus value (so level 50 doubles
// the base). Portrait upgrades unlock at levels 10, 25, and 50.
// =============================================================================

const MANAGERS_DATA = {

  // ---------------------------------------------------------------------------
  // COMMON (5) — Drop Rate: 40%
  // ---------------------------------------------------------------------------

  farmer_joe: {
    id: 'farmer_joe',
    name: 'Farmer Joe',
    rarity: 'common',
    icon: '\u{1F468}\u200D\u{1F33E}',
    bonus: { type: 'cropSpeed', value: 0.05 },
    lore: 'Been farming since before you were born.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  milkmaid_mary: {
    id: 'milkmaid_mary',
    name: 'Milkmaid Mary',
    rarity: 'common',
    icon: '\u{1F469}\u200D\u{1F33E}',
    bonus: { type: 'animalValue', value: 0.05 },
    lore: 'Every cow deserves a gentle hand.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  baker_bob: {
    id: 'baker_bob',
    name: 'Baker Bob',
    rarity: 'common',
    icon: '\u{1F468}\u200D\u{1F373}',
    bonus: { type: 'buildingSpeed', value: 0.05 },
    lore: 'The secret? Always preheat.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  trucker_tom: {
    id: 'trucker_tom',
    name: 'Trucker Tom',
    rarity: 'common',
    icon: '\u{1F69A}',
    bonus: { type: 'orderRewards', value: 0.05 },
    lore: "I'll deliver in rain, snow, or apocalypse.",
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  gardener_grace: {
    id: 'gardener_grace',
    name: 'Gardener Grace',
    rarity: 'common',
    icon: '\u{1F33A}',
    bonus: { type: 'beautyBonus', value: 0.05 },
    lore: 'A farm without flowers is just dirt.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  // ---------------------------------------------------------------------------
  // RARE (7) — Drop Rate: 30%
  // ---------------------------------------------------------------------------

  old_macdonald: {
    id: 'old_macdonald',
    name: 'Old MacDonald',
    rarity: 'rare',
    icon: '\u{1F920}',
    bonus: { type: 'cropSpeed', value: 0.12 },
    lore: "E-I-E-I-Oh yeah, I'm THAT MacDonald.",
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  dr_greenthumb: {
    id: 'dr_greenthumb',
    name: 'Dr. Greenthumb',
    rarity: 'rare',
    icon: '\u{1F9D1}\u200D\u{1F52C}',
    bonus: { type: 'treeProduction', value: 0.12 },
    lore: 'Plants talk. You just have to listen.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  chef_pierre: {
    id: 'chef_pierre',
    name: 'Chef Pierre',
    rarity: 'rare',
    icon: '\u{1F468}\u200D\u{1F373}',
    bonus: { type: 'recipeValue', value: 0.12 },
    lore: 'Magnifique! Every dish is art.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  captain_salt: {
    id: 'captain_salt',
    name: 'Captain Salt',
    rarity: 'rare',
    icon: '\u2693',
    bonus: { type: 'boatOrders', value: 0.15 },
    lore: 'The sea brings gold to those who wait.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  ranger_rick: {
    id: 'ranger_rick',
    name: 'Ranger Rick',
    rarity: 'rare',
    icon: '\u{1F98A}',
    bonus: { type: 'animalSpeed', value: 0.10 },
    lore: 'Animals are family, not inventory.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  miner_mike: {
    id: 'miner_mike',
    name: 'Miner Mike',
    rarity: 'rare',
    icon: '\u26CF\uFE0F',
    bonus: { type: 'oreProduction', value: 0.15 },
    lore: "There's always gold if you dig deep enough.",
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  silk_sandra: {
    id: 'silk_sandra',
    name: 'Silk Sandra',
    rarity: 'rare',
    icon: '\u{1F9F5}',
    bonus: { type: 'textileOutput', value: 0.15 },
    lore: 'Fabric is just crops in disguise.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  // ---------------------------------------------------------------------------
  // EPIC (7) — Drop Rate: 18%
  // ---------------------------------------------------------------------------

  professor_flora: {
    id: 'professor_flora',
    name: 'Professor Flora',
    rarity: 'epic',
    icon: '\u{1F338}',
    bonus: { type: 'cropValue', value: 0.20 },
    lore: "I've cataloged 10,000 species. Yours are... adequate.",
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  baron_von_coin: {
    id: 'baron_von_coin',
    name: 'Baron von Coin',
    rarity: 'epic',
    icon: '\u{1F3A9}',
    bonus: { type: 'passiveIncome', value: 0.20 },
    lore: "Money doesn't grow on trees? Clearly you haven't upgraded yours.",
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  luna_the_witch: {
    id: 'luna_the_witch',
    name: 'Luna the Witch',
    rarity: 'epic',
    icon: '\u{1F9D9}\u200D\u2640\uFE0F',
    bonus: { type: 'potionEffect', value: 0.20 },
    lore: 'Double, double, toil and... actually, this is pretty easy.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  robo_farmer: {
    id: 'robo_farmer',
    name: 'Robo-Farmer',
    rarity: 'epic',
    icon: '\u{1F916}',
    bonus: { type: 'machineEfficiency', value: 0.20 },
    lore: 'OPTIMIZING. OPTIMIZING. OPTIMIZATION COMPLETE.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  queen_bee: {
    id: 'queen_bee',
    name: 'Queen Bee',
    rarity: 'epic',
    icon: '\u{1F478}',
    bonus: { type: 'beeProducts', value: 0.25 },
    lore: 'The hive provides. The hive ALWAYS provides.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  shadow_merchant: {
    id: 'shadow_merchant',
    name: 'Shadow Merchant',
    rarity: 'epic',
    icon: '\u{1F575}\uFE0F',
    bonus: { type: 'everything', value: 0.15 },
    lore: 'I trade in things more valuable than gold.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  samurai_sato: {
    id: 'samurai_sato',
    name: 'Samurai Sato',
    rarity: 'epic',
    icon: '\u2694\uFE0F',
    bonus: { type: 'allSpeed', value: 0.20 },
    lore: 'True mastery is evolution without end.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  // ---------------------------------------------------------------------------
  // LEGENDARY (6) — Drop Rate: 9%
  // ---------------------------------------------------------------------------

  lady_fortuna: {
    id: 'lady_fortuna',
    name: 'Lady Fortuna',
    rarity: 'legendary',
    icon: '\u{1F340}',
    bonus: { type: 'luckyProc', value: 0.10 },
    lore: 'Some call it luck. I call it inevitability.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  grand_chef_valentina: {
    id: 'grand_chef_valentina',
    name: 'Grand Chef Valentina',
    rarity: 'legendary',
    icon: '\u{1F469}\u200D\u{1F373}',
    bonus: { type: 'recipeOutput', value: 0.25 },
    lore: 'In my kitchen, EVERYTHING is a masterpiece.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  archdruid_oakhart: {
    id: 'archdruid_oakhart',
    name: 'Archdruid Oakhart',
    rarity: 'legendary',
    icon: '\u{1F333}',
    bonus: { type: 'allProduction', value: 0.30 },
    lore: 'The earth remembers. The earth provides.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  iron_king: {
    id: 'iron_king',
    name: 'Iron King',
    rarity: 'legendary',
    icon: '\u{1F3F0}',
    bonus: { type: 'buildingSpeed', value: 0.25 },
    lore: 'I built an empire from a single forge.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  chrono: {
    id: 'chrono',
    name: 'Chrono',
    rarity: 'legendary',
    icon: '\u231B',
    bonus: { type: 'allTimers', value: -0.15 },
    lore: 'Time is merely a suggestion.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  gaia: {
    id: 'gaia',
    name: 'Gaia',
    rarity: 'legendary',
    icon: '\u{1F30D}',
    bonus: { type: 'everything', value: 0.25 },
    lore: 'I am the land. The land is me.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  // ---------------------------------------------------------------------------
  // MYTHIC (5) — Drop Rate: 3%
  // ---------------------------------------------------------------------------

  nebula: {
    id: 'nebula',
    name: 'Nebula',
    rarity: 'mythic',
    icon: '\u{1F30C}',
    bonus: { type: 'cosmicBonus', value: 0.35 },
    lore: 'The universe is just a very large farm.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  the_architect: {
    id: 'the_architect',
    name: 'The Architect',
    rarity: 'mythic',
    icon: '\u{1F4D0}',
    bonus: { type: 'buildingOutput', value: 0.30 },
    lore: "I don't build structures. I build destiny.",
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  quantum_farmer: {
    id: 'quantum_farmer',
    name: 'Quantum Farmer',
    rarity: 'mythic',
    icon: '\u269B\uFE0F',
    bonus: { type: 'evolveSpeed', value: 0.20 },
    lore: "Schr\u00F6dinger's crop: both harvested and growing.",
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  omega_prime: {
    id: 'omega_prime',
    name: 'Omega Prime',
    rarity: 'mythic',
    icon: '\u{1F4AB}',
    bonus: { type: 'everything', value: 0.50 },
    lore: 'I am the beginning AND the end.',
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  },

  the_eternal: {
    id: 'the_eternal',
    name: 'The Eternal',
    rarity: 'mythic',
    icon: '\u267E\uFE0F',
    bonus: { type: 'everything', value: 1.00 },
    lore: "You've farmed across time, space, and reality. I am your reward.",
    maxLevel: 50,
    levelBonus: 0.02,
    portraitTiers: [10, 25, 50]
  }
};

// =============================================================================
// Rarity Tiers
// =============================================================================
// dropRate values across all tiers sum to 1.00 (100%).
// baseBonus is a multiplier applied to the manager's bonus at level 1.
// =============================================================================

const MANAGER_RARITIES = {
  common:    { name: 'Common',    color: '#9E9E9E', dropRate: 0.40, baseBonus: 1   },
  rare:      { name: 'Rare',      color: '#2196F3', dropRate: 0.30, baseBonus: 1.5 },
  epic:      { name: 'Epic',      color: '#9C27B0', dropRate: 0.18, baseBonus: 2   },
  legendary: { name: 'Legendary', color: '#FF9800', dropRate: 0.09, baseBonus: 3   },
  mythic:    { name: 'Mythic',    color: '#F44336', dropRate: 0.03, baseBonus: 5   }
};

// =============================================================================
// Manager Slot Configuration
// =============================================================================
// Players start with 6 active manager slots and can unlock up to 10.
// =============================================================================

const MANAGER_SLOTS = {
  base: 6,
  max: 10
};
