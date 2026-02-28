// =========================================
// Guild & Competition Data - Phase 1
// =========================================

// Guild perks unlocked at each guild level
const GUILD_PERKS = {
  1: { id: 'harvest_boost', name: 'Harvest Boost', icon: '🌾', desc: '+5% crop yield', effect: { type: 'cropYield', value: 0.05 } },
  3: { id: 'coin_boost', name: 'Coin Boost', icon: '🪙', desc: '+5% coin earnings', effect: { type: 'coinBoost', value: 0.05 } },
  5: { id: 'xp_boost', name: 'XP Boost', icon: '⭐', desc: '+10% XP gain', effect: { type: 'xpBoost', value: 0.10 } },
  8: { id: 'speed_boost', name: 'Speed Grow', icon: '⚡', desc: '5% faster crops', effect: { type: 'growthSpeed', value: 0.05 } },
  10: { id: 'guild_shop_1', name: 'Guild Shop I', icon: '🏪', desc: 'Unlock guild shop tier 1', effect: { type: 'shopTier', value: 1 } },
  12: { id: 'harvest_boost_2', name: 'Harvest Boost II', icon: '🌾', desc: '+10% crop yield', effect: { type: 'cropYield', value: 0.10 } },
  15: { id: 'energy_boost', name: 'Energy Boost', icon: '🔋', desc: '+5 max energy', effect: { type: 'maxEnergy', value: 5 } },
  18: { id: 'coin_boost_2', name: 'Coin Boost II', icon: '💰', desc: '+10% coin earnings', effect: { type: 'coinBoost', value: 0.10 } },
  20: { id: 'guild_raids', name: 'Guild Raids', icon: '⚔️', desc: 'Unlock guild raids!', effect: { type: 'unlockRaids', value: true } },
  22: { id: 'speed_boost_2', name: 'Speed Grow II', icon: '⚡', desc: '10% faster crops', effect: { type: 'growthSpeed', value: 0.10 } },
  25: { id: 'guild_shop_2', name: 'Guild Shop II', icon: '🏪', desc: 'Unlock guild shop tier 2', effect: { type: 'shopTier', value: 2 } },
  28: { id: 'xp_boost_2', name: 'XP Boost II', icon: '⭐', desc: '+20% XP gain', effect: { type: 'xpBoost', value: 0.20 } },
  30: { id: 'coin_boost_3', name: 'Coin Boost III', icon: '💎', desc: '+15% coin earnings', effect: { type: 'coinBoost', value: 0.15 } },
  33: { id: 'energy_boost_2', name: 'Energy Boost II', icon: '🔋', desc: '+10 max energy', effect: { type: 'maxEnergy', value: 10 } },
  35: { id: 'guild_shop_3', name: 'Guild Shop III', icon: '🏪', desc: 'Unlock guild shop tier 3', effect: { type: 'shopTier', value: 3 } },
  38: { id: 'speed_boost_3', name: 'Speed Grow III', icon: '⚡', desc: '15% faster crops', effect: { type: 'growthSpeed', value: 0.15 } },
  40: { id: 'mega_raids', name: 'Mega Raids', icon: '🐉', desc: 'Unlock mega raid bosses!', effect: { type: 'unlockMegaRaids', value: true } },
  42: { id: 'harvest_boost_3', name: 'Harvest Boost III', icon: '🌾', desc: '+20% crop yield', effect: { type: 'cropYield', value: 0.20 } },
  45: { id: 'xp_boost_3', name: 'XP Boost III', icon: '🌟', desc: '+30% XP gain', effect: { type: 'xpBoost', value: 0.30 } },
  50: { id: 'legendary_perk', name: 'Legendary Farm', icon: '🏆', desc: 'All boosts +50%!', effect: { type: 'allBoost', value: 0.50 } }
};

// Guild level XP thresholds
const GUILD_LEVEL_XP = [];
for (let i = 0; i <= 50; i++) {
  GUILD_LEVEL_XP[i] = Math.floor(100 * Math.pow(1.3, i));
}

// Guild shop items by tier
const GUILD_SHOP = {
  tier1: [
    { id: 'gs_speed_seed', name: 'Turbo Seed', icon: '⚡', desc: 'Instant-grow 1 crop', cost: 50, currency: 'medals', type: 'consumable', effect: 'instantGrow' },
    { id: 'gs_energy_pack', name: 'Energy Pack', icon: '🔋', desc: 'Restore 10 energy', cost: 30, currency: 'medals', type: 'consumable', effect: 'energy', value: 10 },
    { id: 'gs_coin_bag', name: 'Coin Pouch', icon: '👝', desc: 'Get 500 coins', cost: 40, currency: 'medals', type: 'consumable', effect: 'coins', value: 500 },
    { id: 'gs_xp_book', name: 'XP Tome', icon: '📖', desc: 'Get 200 XP', cost: 60, currency: 'medals', type: 'consumable', effect: 'xp', value: 200 }
  ],
  tier2: [
    { id: 'gs_golden_seed', name: 'Golden Seed', icon: '🌟', desc: 'Plant a golden crop (5x value)', cost: 150, currency: 'medals', type: 'consumable', effect: 'goldenSeed' },
    { id: 'gs_mega_energy', name: 'Mega Energy', icon: '⚡', desc: 'Full energy refill', cost: 100, currency: 'medals', type: 'consumable', effect: 'fullEnergy' },
    { id: 'gs_coin_chest', name: 'Coin Chest', icon: '💰', desc: 'Get 2000 coins', cost: 120, currency: 'medals', type: 'consumable', effect: 'coins', value: 2000 },
    { id: 'gs_guild_banner', name: 'Guild Banner', icon: '🚩', desc: 'Decorative guild banner', cost: 200, currency: 'medals', type: 'decoration', effect: 'banner' }
  ],
  tier3: [
    { id: 'gs_rain_dance', name: 'Rain Dance', icon: '🌧️', desc: 'All crops grow 2x faster for 5 min', cost: 300, currency: 'medals', type: 'consumable', effect: 'rainDance', duration: 300 },
    { id: 'gs_harvest_moon', name: 'Harvest Moon', icon: '🌕', desc: '2x harvest value for 5 min', cost: 350, currency: 'medals', type: 'consumable', effect: 'harvestMoon', duration: 300 },
    { id: 'gs_guild_trophy', name: 'Guild Trophy', icon: '🏆', desc: 'Shiny guild trophy decoration', cost: 500, currency: 'medals', type: 'decoration', effect: 'trophy' },
    { id: 'gs_mega_xp', name: 'Mega XP Tome', icon: '📚', desc: 'Get 1000 XP', cost: 250, currency: 'medals', type: 'consumable', effect: 'xp', value: 1000 }
  ]
};

// Raid boss definitions
const RAID_BOSSES = {
  mega_worm: {
    id: 'mega_worm', name: 'Mega Worm', icon: '🪱',
    hp: 10000, timeLimit: 300, minGuildLevel: 20,
    description: 'A giant worm threatening to devour all your crops!',
    phases: [
      { hpPercent: 1.0, name: 'Burrowing', ability: 'Eats crops', dmgMult: 1.0 },
      { hpPercent: 0.5, name: 'Enraged', ability: 'Faster eating', dmgMult: 1.5 },
      { hpPercent: 0.2, name: 'Desperate', ability: 'Earthquake!', dmgMult: 2.0 }
    ],
    rewards: {
      coins: 5000, xp: 2000, medals: 100,
      loot: [
        { item: 'gs_golden_seed', chance: 0.3 },
        { item: 'gs_rain_dance', chance: 0.2 },
        { item: 'gs_harvest_moon', chance: 0.15 }
      ]
    }
  },
  storm_eagle: {
    id: 'storm_eagle', name: 'Storm Eagle', icon: '🦅',
    hp: 25000, timeLimit: 300, minGuildLevel: 25,
    description: 'A massive eagle bringing storms to your farm!',
    phases: [
      { hpPercent: 1.0, name: 'Circling', ability: 'Wind gusts', dmgMult: 1.0 },
      { hpPercent: 0.6, name: 'Diving', ability: 'Lightning strikes', dmgMult: 1.5 },
      { hpPercent: 0.3, name: 'Fury', ability: 'Tornado!', dmgMult: 2.0 }
    ],
    rewards: {
      coins: 12000, xp: 5000, medals: 250,
      loot: [
        { item: 'gs_golden_seed', chance: 0.5 },
        { item: 'gs_rain_dance', chance: 0.3 },
        { item: 'gs_harvest_moon', chance: 0.25 },
        { item: 'gs_mega_xp', chance: 0.2 }
      ]
    }
  },
  frost_giant: {
    id: 'frost_giant', name: 'Frost Giant', icon: '❄️',
    hp: 50000, timeLimit: 300, minGuildLevel: 30,
    description: 'A towering frost giant freezing everything!',
    phases: [
      { hpPercent: 1.0, name: 'Approaching', ability: 'Cold snap', dmgMult: 1.0 },
      { hpPercent: 0.5, name: 'Freezing', ability: 'Blizzard', dmgMult: 1.8 },
      { hpPercent: 0.2, name: 'Desperate', ability: 'Ice Age!', dmgMult: 2.5 }
    ],
    rewards: {
      coins: 25000, xp: 10000, medals: 500,
      loot: [
        { item: 'gs_golden_seed', chance: 0.6 },
        { item: 'gs_rain_dance', chance: 0.4 },
        { item: 'gs_harvest_moon', chance: 0.35 },
        { item: 'gs_mega_xp', chance: 0.3 }
      ]
    }
  },
  dragon_king: {
    id: 'dragon_king', name: 'Dragon King', icon: '🐉',
    hp: 100000, timeLimit: 300, minGuildLevel: 40,
    description: 'The legendary Dragon King! The ultimate raid boss!',
    phases: [
      { hpPercent: 1.0, name: 'Landing', ability: 'Fire breath', dmgMult: 1.0 },
      { hpPercent: 0.7, name: 'Rampaging', ability: 'Flame carpet', dmgMult: 1.5 },
      { hpPercent: 0.4, name: 'Inferno', ability: 'Meteor shower', dmgMult: 2.0 },
      { hpPercent: 0.15, name: 'Last Stand', ability: 'Apocalypse!', dmgMult: 3.0 }
    ],
    rewards: {
      coins: 50000, xp: 25000, medals: 1000,
      loot: [
        { item: 'gs_golden_seed', chance: 0.8 },
        { item: 'gs_rain_dance', chance: 0.5 },
        { item: 'gs_harvest_moon', chance: 0.5 },
        { item: 'gs_mega_xp', chance: 0.4 },
        { item: 'gs_guild_trophy', chance: 0.1 }
      ]
    }
  }
};

// NPC guild member templates (simulated multiplayer)
const NPC_GUILD_MEMBERS = [
  { id: 'npc_1', name: 'Old MacDonald', icon: '👨‍🌾', level: 15, farmPower: 5000, personality: 'helpful', donateRate: 0.3, raidDPS: 50 },
  { id: 'npc_2', name: 'Farmer Jane', icon: '👩‍🌾', level: 22, farmPower: 12000, personality: 'competitive', donateRate: 0.5, raidDPS: 120 },
  { id: 'npc_3', name: 'Billy Hay', icon: '🧑‍🌾', level: 8, farmPower: 1500, personality: 'casual', donateRate: 0.1, raidDPS: 20 },
  { id: 'npc_4', name: 'Rosa Bloom', icon: '👩', level: 18, farmPower: 8000, personality: 'generous', donateRate: 0.7, raidDPS: 80 },
  { id: 'npc_5', name: 'Chuck Seeds', icon: '👨', level: 30, farmPower: 25000, personality: 'competitive', donateRate: 0.4, raidDPS: 200 },
  { id: 'npc_6', name: 'Lily Fields', icon: '👧', level: 12, farmPower: 3500, personality: 'helpful', donateRate: 0.6, raidDPS: 40 },
  { id: 'npc_7', name: 'Hank Harvest', icon: '🧔', level: 25, farmPower: 15000, personality: 'casual', donateRate: 0.2, raidDPS: 150 },
  { id: 'npc_8', name: 'Daisy Chain', icon: '👱‍♀️', level: 20, farmPower: 10000, personality: 'generous', donateRate: 0.8, raidDPS: 100 },
  { id: 'npc_9', name: 'Farmer Brown', icon: '👴', level: 35, farmPower: 35000, personality: 'competitive', donateRate: 0.3, raidDPS: 280 },
  { id: 'npc_10', name: 'Sunny Acres', icon: '👩‍🦰', level: 28, farmPower: 20000, personality: 'helpful', donateRate: 0.5, raidDPS: 180 },
  { id: 'npc_11', name: 'Cactus Carl', icon: '🤠', level: 10, farmPower: 2500, personality: 'casual', donateRate: 0.15, raidDPS: 30 },
  { id: 'npc_12', name: 'Maple May', icon: '👵', level: 40, farmPower: 50000, personality: 'generous', donateRate: 0.6, raidDPS: 350 }
];

// Pre-built guild templates for joining
const GUILD_TEMPLATES = [
  { name: 'Harvest Heroes', icon: '🌾', motto: 'Reap what we sow!', level: 5, memberIds: ['npc_1', 'npc_3', 'npc_6', 'npc_11'] },
  { name: 'Golden Farmers', icon: '🏆', motto: 'Best crops in town!', level: 15, memberIds: ['npc_2', 'npc_5', 'npc_7', 'npc_10'] },
  { name: 'Cozy Ranch', icon: '🏡', motto: 'Farming is life!', level: 8, memberIds: ['npc_4', 'npc_8', 'npc_11'] },
  { name: 'Dragon Tamers', icon: '🐉', motto: 'No boss too tough!', level: 25, memberIds: ['npc_5', 'npc_9', 'npc_12', 'npc_2', 'npc_10'] },
  { name: 'Seedling Squad', icon: '🌱', motto: 'Growing together!', level: 3, memberIds: ['npc_3', 'npc_6'] }
];

// Leaderboard categories
const LEADERBOARD_CATEGORIES = {
  farmPower: { id: 'farmPower', name: 'Farm Power', icon: '💪', desc: 'Total farm value score' },
  totalCoins: { id: 'totalCoins', name: 'Richest Farmer', icon: '💰', desc: 'Total coins earned' },
  cropsHarvested: { id: 'cropsHarvested', name: 'Master Harvester', icon: '🌾', desc: 'Total crops harvested' },
  level: { id: 'level', name: 'Highest Level', icon: '⭐', desc: 'Player level' },
  raidDamage: { id: 'raidDamage', name: 'Raid Champion', icon: '⚔️', desc: 'Total raid damage dealt' },
  guildLevel: { id: 'guildLevel', name: 'Top Guild', icon: '🏰', desc: 'Guild level ranking' }
};

// Tournament definitions
const TOURNAMENT_TYPES = {
  harvest_rush: {
    id: 'harvest_rush', name: 'Harvest Rush', icon: '🌾',
    duration: 3600, // 1 hour
    description: 'Harvest the most crops in 1 hour!',
    metric: 'cropsHarvested',
    rewards: [
      { rank: 1, coins: 5000, medals: 200, gems: 10 },
      { rank: 2, coins: 3000, medals: 100, gems: 5 },
      { rank: 3, coins: 1500, medals: 50, gems: 2 },
      { rank: 10, coins: 500, medals: 20, gems: 0 }
    ]
  },
  coin_frenzy: {
    id: 'coin_frenzy', name: 'Coin Frenzy', icon: '💰',
    duration: 3600,
    description: 'Earn the most coins in 1 hour!',
    metric: 'coinsEarned',
    rewards: [
      { rank: 1, coins: 8000, medals: 300, gems: 15 },
      { rank: 2, coins: 5000, medals: 150, gems: 8 },
      { rank: 3, coins: 2500, medals: 75, gems: 3 },
      { rank: 10, coins: 800, medals: 30, gems: 0 }
    ]
  },
  speed_farmer: {
    id: 'speed_farmer', name: 'Speed Farmer', icon: '⚡',
    duration: 1800, // 30 min
    description: 'Plant and harvest as fast as you can in 30 min!',
    metric: 'totalActions',
    rewards: [
      { rank: 1, coins: 3000, medals: 150, gems: 8 },
      { rank: 2, coins: 2000, medals: 80, gems: 4 },
      { rank: 3, coins: 1000, medals: 40, gems: 2 },
      { rank: 10, coins: 300, medals: 15, gems: 0 }
    ]
  },
  sell_master: {
    id: 'sell_master', name: 'Sell Master', icon: '🏪',
    duration: 3600,
    description: 'Sell the most valuable goods in 1 hour!',
    metric: 'totalSold',
    rewards: [
      { rank: 1, coins: 6000, medals: 250, gems: 12 },
      { rank: 2, coins: 4000, medals: 120, gems: 6 },
      { rank: 3, coins: 2000, medals: 60, gems: 3 },
      { rank: 10, coins: 600, medals: 25, gems: 0 }
    ]
  }
};

// Friend challenge types
const CHALLENGE_TYPES = {
  harvest_duel: {
    id: 'harvest_duel', name: 'Harvest Duel', icon: '⚔️',
    duration: 600, // 10 min
    metric: 'cropsHarvested',
    description: 'Who can harvest more in 10 minutes?',
    reward: { winner: { coins: 1000, medals: 50 }, loser: { coins: 200, medals: 10 } }
  },
  coin_race: {
    id: 'coin_race', name: 'Coin Race', icon: '🏁',
    duration: 600,
    metric: 'coinsEarned',
    description: 'Race to earn the most coins!',
    reward: { winner: { coins: 1500, medals: 75 }, loser: { coins: 300, medals: 15 } }
  },
  sell_showdown: {
    id: 'sell_showdown', name: 'Sell Showdown', icon: '💥',
    duration: 600,
    metric: 'totalSold',
    description: 'Sell off your goods! Highest value wins!',
    reward: { winner: { coins: 1200, medals: 60 }, loser: { coins: 250, medals: 12 } }
  }
};

// Guild chat NPC messages (simulated)
const GUILD_CHAT_MESSAGES = [
  { type: 'greeting', messages: ['Hey everyone! 👋', 'Good morning farmers!', 'Ready to farm? 🌾', 'What a beautiful day on the farm!'] },
  { type: 'help', messages: ['Anyone need help?', 'I can donate some crops!', 'Let me know if you need anything!', 'Happy to help out!'] },
  { type: 'brag', messages: ['Just hit level {level}! 🎉', 'Look at my farm! So proud!', 'Best harvest ever today!', 'My chickens are producing like crazy!'] },
  { type: 'raid', messages: ['Raid time! Let\'s go! ⚔️', 'Who\'s ready to fight?', 'I\'ll do my best in the raid!', 'Let\'s crush this boss!'] },
  { type: 'donate', messages: ['Donated some coins to the guild! 💰', 'Every little bit helps!', 'For the guild! 🏰', 'Take my coins! 🪙'] },
  { type: 'reaction', messages: ['Nice! 👍', 'Awesome! 🎉', 'Great job! ⭐', 'Wow! 😮', 'Keep it up! 💪'] }
];
