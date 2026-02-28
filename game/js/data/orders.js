// =========================================
// Order Board / Delivery System Data
// =========================================

// Order templates by difficulty tier
const ORDER_TEMPLATES = {
  easy: [
    { items: { wheat: 5 }, baseCoins: 80, baseXP: 30 },
    { items: { corn: 4 }, baseCoins: 100, baseXP: 35 },
    { items: { wheat: 3, corn: 3 }, baseCoins: 120, baseXP: 40 },
    { items: { carrot: 3 }, baseCoins: 130, baseXP: 40 },
    { items: { eggs: 3 }, baseCoins: 100, baseXP: 35 },
    { items: { tomato: 3 }, baseCoins: 150, baseXP: 45 },
    { items: { wheat: 8 }, baseCoins: 110, baseXP: 35 },
    { items: { corn: 6 }, baseCoins: 140, baseXP: 40 },
  ],
  medium: [
    { items: { bread: 3, wheat: 5 }, baseCoins: 250, baseXP: 80 },
    { items: { eggs: 6, corn: 5 }, baseCoins: 220, baseXP: 70 },
    { items: { carrot: 5, tomato: 4 }, baseCoins: 280, baseXP: 85 },
    { items: { bread: 2, eggs: 4 }, baseCoins: 240, baseXP: 75 },
    { items: { milk: 2, wheat: 8 }, baseCoins: 300, baseXP: 90 },
    { items: { strawberry: 4, corn: 6 }, baseCoins: 320, baseXP: 95 },
    { items: { wool: 2, corn: 8 }, baseCoins: 350, baseXP: 100 },
    { items: { goat_milk: 2, carrot: 5 }, baseCoins: 280, baseXP: 85 },
  ],
  hard: [
    { items: { cheese: 3, bread: 4, eggs: 6 }, baseCoins: 600, baseXP: 180 },
    { items: { bread: 5, milk: 3, wheat: 10 }, baseCoins: 550, baseXP: 160 },
    { items: { cloth: 2, wool: 3, corn: 10 }, baseCoins: 650, baseXP: 200 },
    { items: { cheese: 2, bread: 3, strawberry: 6 }, baseCoins: 700, baseXP: 220 },
    { items: { butter: 2, eggs: 8, wheat: 12 }, baseCoins: 600, baseXP: 180 },
    { items: { honey: 3, bread: 4, milk: 2 }, baseCoins: 650, baseXP: 200 },
    { items: { truffle: 2, cheese: 2, bread: 3 }, baseCoins: 900, baseXP: 280 },
    { items: { cloth: 3, cheese: 2, bread: 5 }, baseCoins: 850, baseXP: 260 },
  ]
};

// NPC names for orders
const ORDER_NPCS = [
  { name: 'Mrs. Thompson', icon: '👵' },
  { name: 'Chef Gustavo', icon: '👨‍🍳' },
  { name: 'Baker Bob', icon: '🧑‍🍳' },
  { name: 'Dr. Green', icon: '👩‍⚕️' },
  { name: 'Teacher Lily', icon: '👩‍🏫' },
  { name: 'Mayor Oak', icon: '🤵' },
  { name: 'Grandpa Joe', icon: '👴' },
  { name: 'Lady Rose', icon: '👸' },
  { name: 'Captain Fish', icon: '🧔' },
  { name: 'Little Timmy', icon: '👦' },
];

// Boat/export order templates (large orders, big rewards)
const BOAT_ORDER_TEMPLATES = [
  { items: { wheat: 20, corn: 15, bread: 8 }, baseCoins: 2000, baseXP: 500, gems: 2 },
  { items: { eggs: 15, milk: 6, cheese: 4, bread: 6 }, baseCoins: 2500, baseXP: 600, gems: 3 },
  { items: { carrot: 15, tomato: 10, strawberry: 8 }, baseCoins: 2200, baseXP: 550, gems: 2 },
  { items: { wool: 5, cloth: 3, wheat: 20, corn: 10 }, baseCoins: 2800, baseXP: 650, gems: 3 },
  { items: { bread: 10, cheese: 5, butter: 3, eggs: 10 }, baseCoins: 3500, baseXP: 800, gems: 5 },
];

// Daily login reward calendar (28 days)
const LOGIN_REWARDS = [
  // Week 1
  { day: 1, type: 'coins', amount: 50, icon: '🪙', label: '50 Coins' },
  { day: 2, type: 'coins', amount: 75, icon: '🪙', label: '75 Coins' },
  { day: 3, type: 'coins', amount: 100, icon: '🪙', label: '100 Coins' },
  { day: 4, type: 'coins', amount: 100, icon: '🪙', label: '100 Coins' },
  { day: 5, type: 'coins', amount: 150, icon: '🪙', label: '150 Coins' },
  { day: 6, type: 'coins', amount: 150, icon: '🪙', label: '150 Coins' },
  { day: 7, type: 'gems', amount: 2, icon: '💎', label: '2 Gems' },
  // Week 2
  { day: 8, type: 'coins', amount: 200, icon: '🪙', label: '200 Coins' },
  { day: 9, type: 'coins', amount: 250, icon: '🪙', label: '250 Coins' },
  { day: 10, type: 'coins', amount: 300, icon: '🪙', label: '300 Coins' },
  { day: 11, type: 'coins', amount: 300, icon: '🪙', label: '300 Coins' },
  { day: 12, type: 'coins', amount: 400, icon: '🪙', label: '400 Coins' },
  { day: 13, type: 'gems', amount: 3, icon: '💎', label: '3 Gems' },
  { day: 14, type: 'coins', amount: 500, icon: '🪙', label: '500 Coins' },
  // Week 3
  { day: 15, type: 'coins', amount: 500, icon: '🪙', label: '500 Coins' },
  { day: 16, type: 'coins', amount: 600, icon: '🪙', label: '600 Coins' },
  { day: 17, type: 'gems', amount: 3, icon: '💎', label: '3 Gems' },
  { day: 18, type: 'coins', amount: 700, icon: '🪙', label: '700 Coins' },
  { day: 19, type: 'coins', amount: 800, icon: '🪙', label: '800 Coins' },
  { day: 20, type: 'gems', amount: 5, icon: '💎', label: '5 Gems' },
  { day: 21, type: 'coins', amount: 1000, icon: '🪙', label: '1,000 Coins' },
  // Week 4
  { day: 22, type: 'coins', amount: 1000, icon: '🪙', label: '1,000 Coins' },
  { day: 23, type: 'coins', amount: 1200, icon: '🪙', label: '1,200 Coins' },
  { day: 24, type: 'gems', amount: 5, icon: '💎', label: '5 Gems' },
  { day: 25, type: 'coins', amount: 1500, icon: '🪙', label: '1,500 Coins' },
  { day: 26, type: 'coins', amount: 1500, icon: '🪙', label: '1,500 Coins' },
  { day: 27, type: 'gems', amount: 8, icon: '💎', label: '8 Gems' },
  { day: 28, type: 'special', amount: 10, icon: '🎁', label: 'Grand Prize: 10 Gems + 3,000 Coins' },
];

// Pet data
const PETS_DATA = {
  dog: { id: 'dog', name: 'Dog', icon: '🐕', idleFrames: ['🐕', '🐶', '🐕', '🦮'], unlockLevel: 1, cost: 0, description: 'A loyal companion who fetches small gifts!' },
  cat: { id: 'cat', name: 'Cat', icon: '🐈', idleFrames: ['🐈', '🐱', '🐈', '😺'], unlockLevel: 5, cost: 200, description: 'A curious cat who naps in sunny spots.' },
  bunny: { id: 'bunny', name: 'Bunny', icon: '🐇', idleFrames: ['🐇', '🐰', '🐇', '🐰'], unlockLevel: 8, cost: 300, description: 'A fluffy bunny that hops around the farm.' },
  parrot: { id: 'parrot', name: 'Parrot', icon: '🦜', idleFrames: ['🦜', '🦜', '🐦', '🦜'], unlockLevel: 12, cost: 500, description: 'A colorful parrot that sits on your shoulder!' },
  turtle: { id: 'turtle', name: 'Turtle', icon: '🐢', idleFrames: ['🐢', '🐢', '🐢', '🐢'], unlockLevel: 15, cost: 400, description: 'A slow but steady companion.' },
  fox: { id: 'fox', name: 'Fox', icon: '🦊', idleFrames: ['🦊', '🦊', '🦊', '🦊'], unlockLevel: 20, cost: 1000, description: 'A clever fox with a nose for treasure.' },
};

// Collection / Museum data
const COLLECTIONS_DATA = {
  butterflies: {
    id: 'butterflies', name: 'Butterflies & Insects', icon: '🦋',
    grandPrize: { coins: 500, gems: 5 },
    items: [
      { id: 'monarch', name: 'Monarch Butterfly', icon: '🦋', rarity: 'common', dropChance: 0.08 },
      { id: 'blue_morph', name: 'Blue Morpho', icon: '🦋', rarity: 'uncommon', dropChance: 0.05 },
      { id: 'swallowtail', name: 'Swallowtail', icon: '🦋', rarity: 'uncommon', dropChance: 0.04 },
      { id: 'luna_moth', name: 'Luna Moth', icon: '🦋', rarity: 'rare', dropChance: 0.02 },
      { id: 'firefly', name: 'Firefly', icon: '🪲', rarity: 'common', dropChance: 0.06 },
      { id: 'ladybug', name: 'Ladybug', icon: '🐞', rarity: 'common', dropChance: 0.08 },
      { id: 'dragonfly', name: 'Dragonfly', icon: '🪰', rarity: 'rare', dropChance: 0.02 },
      { id: 'golden_beetle', name: 'Golden Beetle', icon: '🪲', rarity: 'legendary', dropChance: 0.005 },
    ]
  },
  wildflowers: {
    id: 'wildflowers', name: 'Wildflowers & Rare Plants', icon: '🌺',
    grandPrize: { coins: 500, gems: 5 },
    items: [
      { id: 'daisy', name: 'Wild Daisy', icon: '🌼', rarity: 'common', dropChance: 0.08 },
      { id: 'bluebell', name: 'Bluebell', icon: '🔔', rarity: 'uncommon', dropChance: 0.05 },
      { id: 'orchid', name: 'Wild Orchid', icon: '🌸', rarity: 'rare', dropChance: 0.02 },
      { id: 'venus_flytrap', name: 'Venus Flytrap', icon: '🌿', rarity: 'rare', dropChance: 0.02 },
      { id: 'four_leaf', name: 'Four-Leaf Clover', icon: '🍀', rarity: 'legendary', dropChance: 0.005 },
      { id: 'sunrose', name: 'Sun Rose', icon: '🌹', rarity: 'uncommon', dropChance: 0.04 },
    ]
  },
  gemstones: {
    id: 'gemstones', name: 'Gemstones & Minerals', icon: '💎',
    grandPrize: { coins: 800, gems: 8 },
    items: [
      { id: 'quartz', name: 'Quartz Crystal', icon: '🔮', rarity: 'common', dropChance: 0.06 },
      { id: 'amethyst', name: 'Amethyst', icon: '💜', rarity: 'uncommon', dropChance: 0.04 },
      { id: 'emerald', name: 'Emerald', icon: '💚', rarity: 'rare', dropChance: 0.02 },
      { id: 'ruby', name: 'Ruby', icon: '❤️', rarity: 'rare', dropChance: 0.015 },
      { id: 'sapphire', name: 'Sapphire', icon: '💙', rarity: 'rare', dropChance: 0.015 },
      { id: 'diamond_gem', name: 'Diamond', icon: '💎', rarity: 'legendary', dropChance: 0.003 },
    ]
  },
  artifacts: {
    id: 'artifacts', name: 'Ancient Artifacts', icon: '🏺',
    grandPrize: { coins: 1000, gems: 10 },
    items: [
      { id: 'old_coin', name: 'Ancient Coin', icon: '🪙', rarity: 'common', dropChance: 0.05 },
      { id: 'pottery', name: 'Clay Pottery', icon: '🏺', rarity: 'uncommon', dropChance: 0.03 },
      { id: 'arrowhead', name: 'Arrowhead', icon: '🔺', rarity: 'uncommon', dropChance: 0.03 },
      { id: 'fossil', name: 'Ancient Fossil', icon: '🦴', rarity: 'rare', dropChance: 0.015 },
      { id: 'golden_idol', name: 'Golden Idol', icon: '🗿', rarity: 'legendary', dropChance: 0.003 },
    ]
  },
  feathers: {
    id: 'feathers', name: 'Bird Feathers', icon: '🪶',
    grandPrize: { coins: 400, gems: 4 },
    items: [
      { id: 'robin_feather', name: 'Robin Feather', icon: '🪶', rarity: 'common', dropChance: 0.07 },
      { id: 'blue_jay', name: 'Blue Jay Feather', icon: '🪶', rarity: 'uncommon', dropChance: 0.04 },
      { id: 'owl_feather', name: 'Owl Feather', icon: '🪶', rarity: 'uncommon', dropChance: 0.035 },
      { id: 'peacock_feather', name: 'Peacock Feather', icon: '🪶', rarity: 'rare', dropChance: 0.015 },
      { id: 'phoenix_feather', name: 'Phoenix Feather', icon: '🔥', rarity: 'legendary', dropChance: 0.003 },
    ]
  }
};

// Crop mastery levels
const MASTERY_LEVELS = [
  { level: 'none', harvests: 0, label: 'None', icon: '' },
  { level: 'bronze', harvests: 50, label: 'Bronze', icon: '🥉', bonus: { sellBonus: 0.10 } },
  { level: 'silver', harvests: 150, label: 'Silver', icon: '🥈', bonus: { sellBonus: 0.10, doubleChance: 0.05 } },
  { level: 'gold', harvests: 500, label: 'Gold', icon: '🥇', bonus: { sellBonus: 0.10, doubleChance: 0.05, timeReduction: 0.15 } },
  { level: 'diamond', harvests: 1500, label: 'Diamond', icon: '💠', bonus: { sellBonus: 0.15, doubleChance: 0.10, timeReduction: 0.20 } },
];

// Loading screen tips
const LOADING_TIPS = [
  '🌾 Wheat grows fastest — great for beginners!',
  '🐔 Feed chickens corn to get eggs!',
  '🏪 Build a bakery to turn wheat into bread!',
  '💡 Harvest before crops wither!',
  '🌻 Sunflowers take longer but are worth more!',
  '📦 Upgrade your barn to store more items!',
  '🐄 Cows produce milk — perfect for cheese!',
  '🌳 Trees keep producing fruit forever!',
  '🚚 Complete delivery orders for big rewards!',
  '🏆 Check your achievements for bonus goals!',
  '📅 Log in daily for increasing rewards!',
  '🐕 Adopt a pet for a loyal farm companion!',
  '🦋 Discover rare collectibles while farming!',
  '💰 Dynamic market prices change daily — sell high!',
  '🥇 Master a crop to get permanent bonuses!',
  '🎪 Check the Events tab for limited-time fun!',
  '⚡ Energy regenerates over time — be patient!',
  '🗺️ Expand your farm to unlock new areas!',
  '🧀 Processed goods sell for more than raw crops!',
  '⭐ Every action earns XP — keep farming!',
];
