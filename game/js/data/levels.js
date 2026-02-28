// =============================================================================
// Level Progression Configuration — 100-Level Farm Simulation Unlock Schedule
// =============================================================================
// XP Formula: 50 * Math.pow(level, 1.8)
// Every level unlocks at least one feature, crop, animal, recipe, or bonus.
// =============================================================================

const LEVELS_DATA = [];

// ---------------------------------------------------------------------------
// LEVEL_UNLOCKS — keyed by level number
// Each entry contains an `unlocks` array and a `rewards` object.
// ---------------------------------------------------------------------------
const LEVEL_UNLOCKS = {
  1: {
    unlocks: ['Wheat', 'Corn', '4 Crop Plots', 'Basic Shop'],
    rewards: { coins: 100, gems: 0 }
  },
  2: {
    unlocks: ['Carrot', 'Chicken', 'Coop'],
    rewards: { coins: 200, gems: 1 }
  },
  3: {
    unlocks: ['Tomato', 'Apple Tree', 'Farm Expansion Slot 1'],
    rewards: { coins: 300, gems: 0 }
  },
  4: {
    unlocks: ['Bakery', 'Bread Recipe', 'Daily Quest System'],
    rewards: { coins: 500, gems: 1 }
  },
  5: {
    unlocks: ['Strawberry', 'Goat', 'Quest System'],
    rewards: { coins: 750, gems: 2 }
  },
  6: {
    unlocks: ['Juice Bar', 'Orange Tree', 'Orange Juice Recipe'],
    rewards: { coins: 1000, gems: 0 }
  },
  7: {
    unlocks: ['Pumpkin', 'Sheep', 'Pigsty Unlock'],
    rewards: { coins: 1200, gems: 2 }
  },
  8: {
    unlocks: ['Cow', 'Dairy', 'Cheese Recipe', 'Barn Expansion'],
    rewards: { coins: 1500, gems: 0 }
  },
  9: {
    unlocks: ['Green Juice Recipe', 'Farm Expansion Slot 2'],
    rewards: { coins: 1800, gems: 2 }
  },
  10: {
    unlocks: ['Sunflower', 'Beehive', 'Research Lab', 'Sugarcane'],
    rewards: { coins: 2500, gems: 3 }
  },
  11: {
    unlocks: ['Cake Recipe', 'Smoothie Recipe'],
    rewards: { coins: 3000, gems: 0 }
  },
  12: {
    unlocks: ['Pig', 'Textile Mill', 'Thread Recipe', 'Workshop'],
    rewards: { coins: 3500, gems: 3 }
  },
  13: {
    unlocks: ['Watermelon', 'Cherry Tree', 'Cloth Recipe'],
    rewards: { coins: 4000, gems: 0 }
  },
  14: {
    unlocks: ['Sugar Mill', 'Sugar Recipe', 'Jam Recipe'],
    rewards: { coins: 4500, gems: 3 }
  },
  15: {
    unlocks: ['Cotton', 'Horse', 'Stable', 'Delivery Orders', 'Pet System'],
    rewards: { coins: 5000, gems: 5 }
  },
  16: {
    unlocks: ['Rice', 'Lemonade Recipe', 'Farm Expansion 3'],
    rewards: { coins: 6000, gems: 0 }
  },
  17: {
    unlocks: ['Cocoa Tree', 'Chocolate Recipe'],
    rewards: { coins: 7000, gems: 3 }
  },
  18: {
    unlocks: ['Coffee Bean', 'Espresso Recipe'],
    rewards: { coins: 8000, gems: 0 }
  },
  19: {
    unlocks: ['Advanced Kitchen', 'Pizza Recipe'],
    rewards: { coins: 9000, gems: 5 }
  },
  20: {
    unlocks: ['Coconut Palm', 'Flour Recipe', 'Dough Recipe', 'Barn Expansion', 'Cat Pet'],
    rewards: { coins: 10000, gems: 5 }
  },
  21: {
    unlocks: ['Lavender', 'Perfume Recipe', 'Collection Museum'],
    rewards: { coins: 12000, gems: 0 }
  },
  22: {
    unlocks: ['Duck', 'Duck Eggs', 'Tailor Building'],
    rewards: { coins: 14000, gems: 5 }
  },
  23: {
    unlocks: ['Grape', 'Wine Recipe', 'Vineyard Decoration Set'],
    rewards: { coins: 16000, gems: 0 }
  },
  24: {
    unlocks: ['Olive', 'Olive Oil Recipe', 'Mediterranean Decoration Set'],
    rewards: { coins: 18000, gems: 5 }
  },
  25: {
    unlocks: ['Rabbit Pet', 'Artifact Slot 5', 'Farm Expansion 4'],
    rewards: { coins: 20000, gems: 8 }
  },
  26: {
    unlocks: ['Cinnamon', 'Pastry Recipe'],
    rewards: { coins: 23000, gems: 0 }
  },
  27: {
    unlocks: ['Turkey', 'Feather Product', 'Pillow Recipe'],
    rewards: { coins: 26000, gems: 5 }
  },
  28: {
    unlocks: ['Vanilla', 'Ice Cream Recipe'],
    rewards: { coins: 30000, gems: 0 }
  },
  29: {
    unlocks: ['Greenhouse Building'],
    rewards: { coins: 35000, gems: 8 }
  },
  30: {
    unlocks: ['Prestige System', 'Soul Seeds', 'Prestige Shop', 'Llama', 'Farm Expansion 5'],
    rewards: { coins: 40000, gems: 10 }
  },
  31: {
    unlocks: ['Mint', 'Tea Recipe', 'Herbalist'],
    rewards: { coins: 45000, gems: 0 }
  },
  32: {
    unlocks: ['Auto-Planter', 'Farmhand Worker'],
    rewards: { coins: 50000, gems: 5 }
  },
  33: {
    unlocks: ['Blueberry', 'Muffin Recipe', 'Pie Recipe'],
    rewards: { coins: 55000, gems: 0 }
  },
  34: {
    unlocks: ['Ostrich', 'Giant Egg'],
    rewards: { coins: 60000, gems: 8 }
  },
  35: {
    unlocks: ['Smelter', 'Iron Ore', 'Iron Bar Recipe'],
    rewards: { coins: 70000, gems: 10 }
  },
  36: {
    unlocks: ['Blacksmith', 'Gold Ore'],
    rewards: { coins: 80000, gems: 0 }
  },
  37: {
    unlocks: ['Avocado', 'Sushi Recipe'],
    rewards: { coins: 90000, gems: 8 }
  },
  38: {
    unlocks: ['Fishing Pond', 'Fish Product'],
    rewards: { coins: 100000, gems: 0 }
  },
  39: {
    unlocks: ['Auto-Harvester', 'Harvester Worker'],
    rewards: { coins: 110000, gems: 10 }
  },
  40: {
    unlocks: ['Peacock', 'Farm Expansion 6', 'Fox Pet'],
    rewards: { coins: 125000, gems: 15 }
  },
  41: {
    unlocks: ['Saffron'],
    rewards: { coins: 140000, gems: 0, bonus: '+5% Crop Speed' }
  },
  42: {
    unlocks: ['Jeweler', 'Gemstone Crafting'],
    rewards: { coins: 160000, gems: 10 }
  },
  43: {
    unlocks: ['Truffle Oil Recipe', 'Gourmet Tier'],
    rewards: { coins: 180000, gems: 0 }
  },
  44: {
    unlocks: ['Alpaca', 'Alpaca Wool'],
    rewards: { coins: 200000, gems: 10 }
  },
  45: {
    unlocks: ['Robotics Lab', 'Auto-Feeder'],
    rewards: { coins: 225000, gems: 0 }
  },
  46: {
    unlocks: ['Dragon Fruit', 'Exotic Smoothie Recipe'],
    rewards: { coins: 250000, gems: 12 }
  },
  47: {
    unlocks: ['Beeswax Product', 'Candle Recipe'],
    rewards: { coins: 280000, gems: 0 }
  },
  48: {
    unlocks: ['Perfumery Building'],
    rewards: { coins: 310000, gems: 12 }
  },
  49: {
    unlocks: ['Silk Worm', 'Silk Product', 'Luxury Cloth'],
    rewards: { coins: 350000, gems: 0 }
  },
  50: {
    unlocks: ['Star Fruit', 'Unicorn', 'Farm Expansion 7', 'Parrot Pet'],
    rewards: { coins: 400000, gems: 25 }
  },

  // -------------------------------------------------------------------------
  // Levels 51–55: Spice & Herb Expansion
  // -------------------------------------------------------------------------
  51: {
    unlocks: ['Ginger', 'Spice Rack Decoration'],
    rewards: { coins: 420000, gems: 5, bonus: '+3% Sell Value' }
  },
  52: {
    unlocks: ['Turmeric', 'Golden Milk Recipe'],
    rewards: { coins: 440000, gems: 8 }
  },
  53: {
    unlocks: ['Cardamom', 'Chai Recipe', 'Spice Market Decoration'],
    rewards: { coins: 460000, gems: 5 }
  },
  54: {
    unlocks: ['Chili Pepper', 'Hot Sauce Recipe', '+5 Barn Slots'],
    rewards: { coins: 480000, gems: 10 }
  },
  55: {
    unlocks: ['Lemongrass', 'Herbal Infusion Recipe', 'Tropical Avatar Outfit'],
    rewards: { coins: 500000, gems: 12 }
  },

  // -------------------------------------------------------------------------
  // Levels 56–60: Exotic Animals & Sweet Factories
  // -------------------------------------------------------------------------
  56: {
    unlocks: ['Candy Factory', 'Toffee Recipe'],
    rewards: { coins: 530000, gems: 8 }
  },
  57: {
    unlocks: ['Flamingo', 'Tropical Lagoon Decoration'],
    rewards: { coins: 560000, gems: 10, bonus: '+5% Crop Speed' }
  },
  58: {
    unlocks: ['Ice Cream Parlor', 'Sundae Recipe', 'Milkshake Recipe'],
    rewards: { coins: 590000, gems: 8 }
  },
  59: {
    unlocks: ['Penguin', 'Snow Globe Decoration', 'Winter Avatar Outfit'],
    rewards: { coins: 620000, gems: 12 }
  },
  60: {
    unlocks: ['Snow Fox Pet', 'Farm Expansion 8', 'Frozen Treat Recipe'],
    rewards: { coins: 650000, gems: 15 }
  },

  // -------------------------------------------------------------------------
  // Levels 61–65: Space Research Arc
  // -------------------------------------------------------------------------
  61: {
    unlocks: ['Space Research Center', 'Astronaut Avatar Outfit', 'Story: The Signal'],
    rewards: { coins: 700000, gems: 10 }
  },
  62: {
    unlocks: ['Rocket Fuel Crop', 'Bio-Fuel Recipe', 'Launch Pad Decoration'],
    rewards: { coins: 750000, gems: 12, bonus: '+3% Sell Value' }
  },
  63: {
    unlocks: ['Meteor Ore', 'Meteor Pickaxe', 'Cosmic Dust Product'],
    rewards: { coins: 800000, gems: 10 }
  },
  64: {
    unlocks: ['Satellite Dish Decoration', 'Alien Flower Crop', '+5 Barn Slots'],
    rewards: { coins: 850000, gems: 15 }
  },
  65: {
    unlocks: ['Space Barn', 'Anti-Gravity Planter', 'Space Cow Skin'],
    rewards: { coins: 900000, gems: 18 }
  },

  // -------------------------------------------------------------------------
  // Levels 66–70: Cosmic Crops
  // -------------------------------------------------------------------------
  66: {
    unlocks: ['Nebula Fruit', 'Starlight Jam Recipe'],
    rewards: { coins: 950000, gems: 12 }
  },
  67: {
    unlocks: ['Void Mushroom', 'Shadow Stew Recipe', 'Dark Matter Decoration'],
    rewards: { coins: 1000000, gems: 15, bonus: '+5% Crop Speed' }
  },
  68: {
    unlocks: ['Plasma Melon', 'Plasma Juice Recipe', 'Neon Farm Skin'],
    rewards: { coins: 1050000, gems: 12 }
  },
  69: {
    unlocks: ['Stardust Berry', 'Celestial Pie Recipe', 'Constellation Decoration Set'],
    rewards: { coins: 1100000, gems: 15 }
  },
  70: {
    unlocks: ['Cosmic Corn', 'Galactic Popcorn Recipe', 'Farm Expansion 9', 'Owl Pet'],
    rewards: { coins: 1200000, gems: 20 }
  },

  // -------------------------------------------------------------------------
  // Levels 71–75: Crystal Forge & Enchantment
  // -------------------------------------------------------------------------
  71: {
    unlocks: ['Crystal Shard Crop', 'Prism Decoration', 'Story: The Forge Awakens'],
    rewards: { coins: 1300000, gems: 12, bonus: '+3% Sell Value' }
  },
  72: {
    unlocks: ['Crystal Forge', 'Crystal Lens Recipe', 'Enchanted Tool Slot'],
    rewards: { coins: 1400000, gems: 18 }
  },
  73: {
    unlocks: ['Enchantment System', 'Glyph of Growth', 'Glyph of Harvest'],
    rewards: { coins: 1500000, gems: 15 }
  },
  74: {
    unlocks: ['Runic Wheat', 'Runic Corn', 'Arcane Fertilizer Recipe'],
    rewards: { coins: 1600000, gems: 15, bonus: '+5% Crop Speed' }
  },
  75: {
    unlocks: ['Runic Berries', 'Elixir Recipe', 'Mage Avatar Outfit', '+5 Barn Slots'],
    rewards: { coins: 1700000, gems: 20 }
  },

  // -------------------------------------------------------------------------
  // Levels 76–80: Dimensional Rift & Fusion
  // -------------------------------------------------------------------------
  76: {
    unlocks: ['Dimensional Rift', 'Rift Shard Product', 'Portal Decoration'],
    rewards: { coins: 1800000, gems: 15 }
  },
  77: {
    unlocks: ['Ether Blossom Crop', 'Rift Walker Avatar Outfit', 'Story: Beyond the Veil'],
    rewards: { coins: 1900000, gems: 15, bonus: '+3% Sell Value' }
  },
  78: {
    unlocks: ['Cross-World Bread Recipe', 'Cross-World Jam Recipe', 'Dimensional Spice'],
    rewards: { coins: 2000000, gems: 18 }
  },
  79: {
    unlocks: ['Void Chicken', 'Shadow Egg Product', 'Eclipse Decoration Set'],
    rewards: { coins: 2200000, gems: 18 }
  },
  80: {
    unlocks: ['Fusion Lab', 'Fusion Core Recipe', 'Farm Expansion 10', 'Phoenix Pet'],
    rewards: { coins: 2500000, gems: 25 }
  },

  // -------------------------------------------------------------------------
  // Levels 81–85: Time Warp Crops & Paradox Animals
  // -------------------------------------------------------------------------
  81: {
    unlocks: ['Chrono Wheat', 'Time Warp Fertilizer Recipe', 'Story: Tick-Tock Farm'],
    rewards: { coins: 2700000, gems: 15, bonus: '+5% Crop Speed' }
  },
  82: {
    unlocks: ['Temporal Tomato', 'Rewind Juice Recipe', 'Clockwork Decoration'],
    rewards: { coins: 2900000, gems: 18 }
  },
  83: {
    unlocks: ['Epoch Eggplant', 'Timeless Stew Recipe', 'Hourglass Decoration Set'],
    rewards: { coins: 3100000, gems: 15 }
  },
  84: {
    unlocks: ['Paradox Cow', 'Paradox Milk Product', 'Infinity Cheese Recipe'],
    rewards: { coins: 3400000, gems: 20, bonus: '+3% Sell Value' }
  },
  85: {
    unlocks: ['Paradox Chicken', 'Möbius Egg Product', 'Time Lord Avatar Outfit', '+5 Barn Slots'],
    rewards: { coins: 3700000, gems: 22 }
  },

  // -------------------------------------------------------------------------
  // Levels 86–90: Reality Engine & Omni-Crop
  // -------------------------------------------------------------------------
  86: {
    unlocks: ['Quantum Seed', 'Probability Field Decoration', 'Story: The Unraveling'],
    rewards: { coins: 4000000, gems: 18 }
  },
  87: {
    unlocks: ['Schrodinger Cat Pet', 'Entangled Flower Crop', 'Quantum Jam Recipe'],
    rewards: { coins: 4300000, gems: 20, bonus: '+5% Crop Speed' }
  },
  88: {
    unlocks: ['Reality Engine', 'Reality Shard Product', 'Worldweaver Avatar Outfit'],
    rewards: { coins: 4700000, gems: 22 }
  },
  89: {
    unlocks: ['Genesis Sapling', 'Creation Elixir Recipe', 'Prismatic Decoration Set'],
    rewards: { coins: 5000000, gems: 20, bonus: '+3% Sell Value' }
  },
  90: {
    unlocks: ['Omni-Crop', 'Universal Harvest Recipe', 'Transcendence Barn Skin'],
    rewards: { coins: 5500000, gems: 30 }
  },

  // -------------------------------------------------------------------------
  // Levels 91–95: Infinite Farm & OMEGA
  // -------------------------------------------------------------------------
  91: {
    unlocks: ['Infinity Blossom Crop', 'Eternal Juice Recipe', 'Story: The Infinite Pasture'],
    rewards: { coins: 6000000, gems: 20, bonus: '+5% Crop Speed' }
  },
  92: {
    unlocks: ['Celestial Barn Upgrade', 'Star Weaver Decoration', 'Astral Avatar Outfit'],
    rewards: { coins: 6500000, gems: 22 }
  },
  93: {
    unlocks: ['Infinite Farm Blueprint', 'Perpetual Plot', 'Auto-Expand System'],
    rewards: { coins: 7000000, gems: 25, bonus: '+3% Sell Value' }
  },
  94: {
    unlocks: ['Omega Seed', 'Omega Fertilizer Recipe', 'Singularity Decoration Set'],
    rewards: { coins: 7500000, gems: 25 }
  },
  95: {
    unlocks: ['OMEGA Worker', 'OMEGA Planter', 'OMEGA Harvester', '+10 Barn Slots'],
    rewards: { coins: 8000000, gems: 30 }
  },

  // -------------------------------------------------------------------------
  // Levels 96–99: Final Story Quests & Ultimate Recipes
  // -------------------------------------------------------------------------
  96: {
    unlocks: ['Story: The Gathering Storm', 'Ultimate Bread Recipe', 'Legacy Seed'],
    rewards: { coins: 8500000, gems: 25, bonus: '+5% Crop Speed' }
  },
  97: {
    unlocks: ['Story: Roots of Eternity', 'Ultimate Cheese Recipe', 'Eternal Bloom Decoration'],
    rewards: { coins: 9000000, gems: 28, bonus: '+3% Sell Value' }
  },
  98: {
    unlocks: ['Story: The Last Harvest', 'Ultimate Elixir Recipe', 'Mythic Avatar Outfit'],
    rewards: { coins: 9500000, gems: 30 }
  },
  99: {
    unlocks: ['Story: Dawn of the Eternal Farm', 'Ultimate Fusion Recipe', 'Legendary Farm Skin'],
    rewards: { coins: 10000000, gems: 35, bonus: '+5% Crop Speed, +5% Sell Value' }
  },

  // -------------------------------------------------------------------------
  // Level 100: ETERNAL FARMER — The Final Milestone
  // -------------------------------------------------------------------------
  100: {
    unlocks: [
      'ETERNAL FARMER Title',
      'All Content Unlocked',
      'Golden Plow Decoration',
      'Eternal Crown Avatar',
      'Infinity Dragon Pet',
      'Prestige Tier II',
      'Golden Farm Skin',
      'ETERNAL Barn',
      'Story: The Eternal Farmer'
    ],
    rewards: { coins: 15000000, gems: 500, bonus: '+10% Crop Speed, +10% Sell Value, +10% XP Gain' }
  }
};

// ---------------------------------------------------------------------------
// Generate the LEVELS_DATA array from LEVEL_UNLOCKS and the XP formula
// ---------------------------------------------------------------------------
(function generateLevels() {
  var cumulativeXP = 0;
  var maxLevel = 100;

  for (var i = 1; i <= maxLevel; i++) {
    // XP formula: 50 * level^1.8  (level 1 starts at 0 so the player begins there)
    var xpRequired = (i === 1) ? 0 : Math.floor(50 * Math.pow(i, 1.8));
    cumulativeXP += xpRequired;

    var levelData = LEVEL_UNLOCKS[i];

    LEVELS_DATA.push({
      level: i,
      xpRequired: xpRequired,
      cumulativeXP: cumulativeXP,
      unlocks: levelData ? levelData.unlocks : [],
      rewards: levelData ? levelData.rewards : { coins: 0, gems: 0 }
    });
  }
})();

// ---------------------------------------------------------------------------
// LAND_EXPANSIONS — 10 progressive farm expansions
// ---------------------------------------------------------------------------
const LAND_EXPANSIONS = [
  {
    id: 'expand_1',
    cost: 500,
    costType: 'coins',
    size: { rows: 4, cols: 4 },
    direction: 'right',
    unlockLevel: 3,
    label: 'East Field'
  },
  {
    id: 'expand_2',
    cost: 1500,
    costType: 'coins',
    size: { rows: 4, cols: 4 },
    direction: 'bottom',
    unlockLevel: 9,
    label: 'South Meadow'
  },
  {
    id: 'expand_3',
    cost: 4000,
    costType: 'coins',
    size: { rows: 4, cols: 4 },
    direction: 'right',
    unlockLevel: 16,
    label: 'Far East Fields'
  },
  {
    id: 'expand_4',
    cost: 10000,
    costType: 'coins',
    size: { rows: 4, cols: 8 },
    direction: 'bottom',
    unlockLevel: 25,
    label: 'Grand Pasture'
  },
  {
    id: 'expand_5',
    cost: 25000,
    costType: 'coins',
    size: { rows: 8, cols: 4 },
    direction: 'right',
    unlockLevel: 30,
    label: 'Hilltop Haven'
  },
  {
    id: 'expand_6',
    cost: 60000,
    costType: 'coins',
    size: { rows: 8, cols: 8 },
    direction: 'bottom',
    unlockLevel: 40,
    label: 'Sunset Valley'
  },
  {
    id: 'expand_7',
    cost: 150000,
    costType: 'coins',
    size: { rows: 8, cols: 8 },
    direction: 'right',
    unlockLevel: 50,
    label: 'Starfall Plains'
  },
  {
    id: 'expand_8',
    cost: 400000,
    costType: 'coins',
    size: { rows: 8, cols: 8 },
    direction: 'bottom',
    unlockLevel: 60,
    label: 'Frozen Tundra'
  },
  {
    id: 'expand_9',
    cost: 1000000,
    costType: 'coins',
    size: { rows: 12, cols: 8 },
    direction: 'right',
    unlockLevel: 70,
    label: 'Cosmic Plateau'
  },
  {
    id: 'expand_10',
    cost: 2500000,
    costType: 'coins',
    size: { rows: 12, cols: 12 },
    direction: 'bottom',
    unlockLevel: 80,
    label: 'Dimensional Expanse'
  }
];
