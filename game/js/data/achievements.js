// =========================================
// Achievement System Data
// =========================================

const ACHIEVEMENTS_DATA = {
  // === Farming Mastery ===
  first_harvest: {
    id: 'first_harvest', category: 'farming', title: 'First Harvest',
    description: 'Harvest your very first crop.', icon: '🌱',
    condition: { stat: 'cropsHarvested', target: 1 },
    rewards: { coins: 50 }, points: 5
  },
  green_thumb: {
    id: 'green_thumb', category: 'farming', title: 'Green Thumb',
    description: 'Harvest 100 crops.', icon: '🌿',
    condition: { stat: 'cropsHarvested', target: 100 },
    rewards: { coins: 200 }, points: 10
  },
  master_farmer_ach: {
    id: 'master_farmer_ach', category: 'farming', title: 'Master Farmer',
    description: 'Harvest 1,000 crops.', icon: '👨‍🌾',
    condition: { stat: 'cropsHarvested', target: 1000 },
    rewards: { coins: 500, gems: 5 }, points: 25
  },
  speed_farmer: {
    id: 'speed_farmer', category: 'farming', title: 'Speed Farmer',
    description: 'Plant 20 crops in under 30 seconds.', icon: '⚡',
    condition: { stat: 'speedPlant20', target: 1 },
    rewards: { coins: 200 }, points: 15
  },
  no_waste: {
    id: 'no_waste', category: 'farming', title: 'No Waste',
    description: 'Harvest 50 crops without any withering.', icon: '♻️',
    condition: { stat: 'harvestStreak', target: 50 },
    rewards: { coins: 300 }, points: 15
  },
  planting_spree: {
    id: 'planting_spree', category: 'farming', title: 'Planting Spree',
    description: 'Plant 500 total crops.', icon: '🌾',
    condition: { stat: 'cropsPlanted', target: 500 },
    rewards: { coins: 300, gems: 2 }, points: 15
  },

  // === Animal Lover ===
  first_friend: {
    id: 'first_friend', category: 'animals', title: 'First Friend',
    description: 'Buy your first animal.', icon: '🐔',
    condition: { stat: 'animalsBought', target: 1 },
    rewards: { coins: 50 }, points: 5
  },
  full_barn: {
    id: 'full_barn', category: 'animals', title: 'Full Barn',
    description: 'Own 10 animals at the same time.', icon: '🏚️',
    condition: { stat: 'totalAnimalsOwned', target: 10 },
    rewards: { coins: 300 }, points: 15
  },
  egg_collector: {
    id: 'egg_collector', category: 'animals', title: 'Egg Collector',
    description: 'Collect 100 eggs total.', icon: '🥚',
    condition: { stat: 'eggsCollected', target: 100 },
    rewards: { coins: 200, gems: 2 }, points: 10
  },
  animal_whisperer: {
    id: 'animal_whisperer', category: 'animals', title: 'Animal Whisperer',
    description: 'Feed animals 50 times.', icon: '💕',
    condition: { stat: 'animalsFed', target: 50 },
    rewards: { coins: 250 }, points: 10
  },

  // === Production Pro ===
  bakers_dozen: {
    id: 'bakers_dozen', category: 'production', title: "Baker's Dozen",
    description: 'Produce 13 items in the Bakery.', icon: '🍞',
    condition: { stat: 'bakeryProduced', target: 13 },
    rewards: { coins: 200 }, points: 10
  },
  factory_owner: {
    id: 'factory_owner', category: 'production', title: 'Factory Owner',
    description: 'Build every production building.', icon: '🏭',
    condition: { stat: 'buildingsBuilt', target: 5 },
    rewards: { gems: 10 }, points: 25
  },
  supply_chain: {
    id: 'supply_chain', category: 'production', title: 'Supply Chain Master',
    description: 'Produce 500 total goods.', icon: '📦',
    condition: { stat: 'itemsProduced', target: 500 },
    rewards: { coins: 1000 }, points: 30
  },

  // === Wealth & Progress ===
  first_thousand: {
    id: 'first_thousand', category: 'wealth', title: 'First Thousand',
    description: 'Earn 1,000 total coins.', icon: '🪙',
    condition: { stat: 'totalCoinsEarned', target: 1000 },
    rewards: { coins: 100 }, points: 5
  },
  ten_thousand: {
    id: 'ten_thousand', category: 'wealth', title: 'Wealthy Farmer',
    description: 'Earn 10,000 total coins.', icon: '💰',
    condition: { stat: 'totalCoinsEarned', target: 10000 },
    rewards: { coins: 500, gems: 3 }, points: 15
  },
  hundred_thousand: {
    id: 'hundred_thousand', category: 'wealth', title: 'Rich Farmer',
    description: 'Earn 100,000 total coins.', icon: '🤑',
    condition: { stat: 'totalCoinsEarned', target: 100000 },
    rewards: { coins: 2000, gems: 10 }, points: 30
  },
  millionaire: {
    id: 'millionaire', category: 'wealth', title: 'Millionaire Farmer',
    description: 'Earn 1,000,000 total coins.', icon: '💎',
    condition: { stat: 'totalCoinsEarned', target: 1000000 },
    rewards: { gems: 50 }, points: 50
  },
  land_baron: {
    id: 'land_baron', category: 'wealth', title: 'Land Baron',
    description: 'Expand your farm to maximum size.', icon: '🗺️',
    condition: { stat: 'expansionsBought', target: 5 },
    rewards: { gems: 20 }, points: 30
  },
  seller_supreme: {
    id: 'seller_supreme', category: 'wealth', title: 'Seller Supreme',
    description: 'Sell 500 items total.', icon: '🏪',
    condition: { stat: 'itemsSold', target: 500 },
    rewards: { coins: 500, gems: 3 }, points: 15
  },

  // === Dedication ===
  level_5: {
    id: 'level_5', category: 'dedication', title: 'Getting Started',
    description: 'Reach Level 5.', icon: '⭐',
    condition: { stat: 'playerLevel', target: 5 },
    rewards: { coins: 100, gems: 1 }, points: 5
  },
  level_10: {
    id: 'level_10', category: 'dedication', title: 'Experienced Farmer',
    description: 'Reach Level 10.', icon: '🌟',
    condition: { stat: 'playerLevel', target: 10 },
    rewards: { coins: 300, gems: 3 }, points: 15
  },
  level_20: {
    id: 'level_20', category: 'dedication', title: 'Veteran Farmer',
    description: 'Reach Level 20.', icon: '🏅',
    condition: { stat: 'playerLevel', target: 20 },
    rewards: { coins: 1000, gems: 10 }, points: 30
  },
  level_30: {
    id: 'level_30', category: 'dedication', title: 'Legendary Farmer',
    description: 'Reach Level 30.', icon: '🏆',
    condition: { stat: 'playerLevel', target: 30 },
    rewards: { coins: 3000, gems: 20 }, points: 50
  },
  quest_master: {
    id: 'quest_master', category: 'dedication', title: 'Quest Master',
    description: 'Complete 50 quests.', icon: '📜',
    condition: { stat: 'questsCompleted', target: 50 },
    rewards: { coins: 500, gems: 5 }, points: 20
  },
  order_master: {
    id: 'order_master', category: 'dedication', title: 'Order Master',
    description: 'Complete 100 delivery orders.', icon: '🚚',
    condition: { stat: 'ordersCompleted', target: 100 },
    rewards: { coins: 500, gems: 10 }, points: 25
  },
  tree_hugger: {
    id: 'tree_hugger', category: 'dedication', title: 'Tree Hugger',
    description: 'Plant 10 fruit trees.', icon: '🌳',
    condition: { stat: 'treesPlanted', target: 10 },
    rewards: { coins: 200, gems: 2 }, points: 10
  },
  decorator: {
    id: 'decorator', category: 'dedication', title: 'Interior Decorator',
    description: 'Place 20 decorations on your farm.', icon: '🎨',
    condition: { stat: 'decorationsPlaced', target: 20 },
    rewards: { coins: 200, gems: 2 }, points: 10
  },

  // === Collection ===
  butterfly_starter: {
    id: 'butterfly_starter', category: 'collection', title: 'Bug Catcher',
    description: 'Discover 3 different butterflies.', icon: '🦋',
    condition: { stat: 'butterfliesFound', target: 3 },
    rewards: { coins: 150, gems: 2 }, points: 10
  },
  gem_finder: {
    id: 'gem_finder', category: 'collection', title: 'Gem Finder',
    description: 'Discover 3 different gemstones.', icon: '💎',
    condition: { stat: 'gemstonesFound', target: 3 },
    rewards: { coins: 200, gems: 3 }, points: 10
  },
  master_collector: {
    id: 'master_collector', category: 'collection', title: 'Master Collector',
    description: 'Complete any collection category.', icon: '📚',
    condition: { stat: 'collectionsCompleted', target: 1 },
    rewards: { coins: 500, gems: 5 }, points: 25
  },

  // === Mastery ===
  first_mastery: {
    id: 'first_mastery', category: 'mastery', title: 'Crop Specialist',
    description: 'Reach Bronze mastery on any crop.', icon: '🥉',
    condition: { stat: 'masteryBronze', target: 1 },
    rewards: { coins: 200, gems: 2 }, points: 10
  },
  gold_mastery: {
    id: 'gold_mastery', category: 'mastery', title: 'Golden Hands',
    description: 'Reach Gold mastery on any crop.', icon: '🥇',
    condition: { stat: 'masteryGold', target: 1 },
    rewards: { coins: 1000, gems: 10 }, points: 30
  },
  diamond_mastery: {
    id: 'diamond_mastery', category: 'mastery', title: 'Diamond Farmer',
    description: 'Reach Diamond mastery on any crop.', icon: '💠',
    condition: { stat: 'masteryDiamond', target: 1 },
    rewards: { coins: 3000, gems: 20 }, points: 50
  },

  // === Pet ===
  pet_owner: {
    id: 'pet_owner', category: 'dedication', title: 'Pet Lover',
    description: 'Adopt your first pet.', icon: '🐕',
    condition: { stat: 'petsAdopted', target: 1 },
    rewards: { coins: 100, gems: 1 }, points: 5
  }
};

const ACHIEVEMENT_CATEGORIES = {
  farming: { name: 'Farming Mastery', icon: '🌾' },
  animals: { name: 'Animal Lover', icon: '🐔' },
  production: { name: 'Production Pro', icon: '🏭' },
  wealth: { name: 'Wealth & Progress', icon: '💰' },
  dedication: { name: 'Dedication', icon: '⭐' },
  collection: { name: 'Collections', icon: '📚' },
  mastery: { name: 'Crop Mastery', icon: '🏅' }
};
