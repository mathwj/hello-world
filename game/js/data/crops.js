// =========================================
// Crop Data with Evolution Chains (v3 - Idle Tycoon)
// =========================================

// Evolution tiers for ALL crops
const CROP_EVOLUTION_TIERS = {
  wheat: [
    { tier: 1, name: 'Wheat', icon: '🌾', valueMult: 1, ability: null, desc: 'Basic golden wheat.' },
    { tier: 2, name: 'Premium Wheat', icon: '🌾', valueMult: 5, ability: 'speed10', desc: 'Taller, thicker, shinier.' },
    { tier: 3, name: 'Golden Wheat', icon: '🌾', valueMult: 20, ability: 'double5', desc: 'Glowing golden aura.' },
    { tier: 4, name: 'Crystal Wheat', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Translucent crystal stalks.' },
    { tier: 5, name: 'Plasma Wheat', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Pulsing with energy.' },
    { tier: 6, name: 'Quantum Wheat', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Holographic, phase-shifting.' },
    { tier: 7, name: 'Cosmic Wheat', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Starfield pattern.' },
    { tier: 8, name: 'OMEGA Wheat', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Supernova wheat.' },
  ],
  corn: [
    { tier: 1, name: 'Corn', icon: '🌽', valueMult: 1, ability: null, desc: 'Golden ears of corn.' },
    { tier: 2, name: 'Sweet Corn', icon: '🌽', valueMult: 5, ability: 'speed10', desc: 'Extra sweet.' },
    { tier: 3, name: 'Candy Corn', icon: '🍬', valueMult: 20, ability: 'double5', desc: 'Magically sweet.' },
    { tier: 4, name: 'Fire Corn', icon: '🔥', valueMult: 100, ability: 'double10', desc: 'Burns with flavor.' },
    { tier: 5, name: 'Neon Corn', icon: '💚', valueMult: 500, ability: 'autoReplant', desc: 'Glows in the dark.' },
    { tier: 6, name: 'Plasma Corn', icon: '⚡', valueMult: 2500, ability: 'bonusXP', desc: 'Crackling with energy.' },
    { tier: 7, name: 'Void Corn', icon: '🌑', valueMult: 15000, ability: 'passiveCoins', desc: 'From the void itself.' },
    { tier: 8, name: 'OMEGA Corn', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Ultimate corn.' },
  ],
  carrot: [
    { tier: 1, name: 'Carrot', icon: '🥕', valueMult: 1, ability: null, desc: 'Crunchy and nutritious.' },
    { tier: 2, name: 'Golden Carrot', icon: '🥕', valueMult: 5, ability: 'speed10', desc: 'Shining gold.' },
    { tier: 3, name: 'Crystal Carrot', icon: '💎', valueMult: 20, ability: 'double5', desc: 'Transparent crystal.' },
    { tier: 4, name: 'Rainbow Carrot', icon: '🌈', valueMult: 100, ability: 'double10', desc: 'All colors at once.' },
    { tier: 5, name: 'Plasma Carrot', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Pure energy root.' },
    { tier: 6, name: 'Quantum Carrot', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Exists in superposition.' },
    { tier: 7, name: 'Cosmic Carrot', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Galactic vegetable.' },
    { tier: 8, name: 'OMEGA Carrot', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The ultimate root.' },
  ],
  tomato: [
    { tier: 1, name: 'Tomato', icon: '🍅', valueMult: 1, ability: null, desc: 'Juicy red tomatoes.' },
    { tier: 2, name: 'Cherry Tomato', icon: '🍅', valueMult: 5, ability: 'speed10', desc: 'Small but potent.' },
    { tier: 3, name: 'Golden Tomato', icon: '🏆', valueMult: 20, ability: 'double5', desc: 'Pure golden fruit.' },
    { tier: 4, name: 'Crystal Tomato', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Crystallized perfection.' },
    { tier: 5, name: 'Lava Tomato', icon: '🌋', valueMult: 500, ability: 'autoReplant', desc: 'Burns with inner fire.' },
    { tier: 6, name: 'Quantum Tomato', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Phase-shifting fruit.' },
    { tier: 7, name: 'Cosmic Tomato', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Stellar tomato.' },
    { tier: 8, name: 'OMEGA Tomato', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Transcendent fruit.' },
  ],
  strawberry: [
    { tier: 1, name: 'Strawberry', icon: '🍓', valueMult: 1, ability: null, desc: 'Sweet strawberries.' },
    { tier: 2, name: 'Wild Strawberry', icon: '🍓', valueMult: 5, ability: 'speed10', desc: 'Untamed flavor.' },
    { tier: 3, name: 'Royal Strawberry', icon: '👑', valueMult: 20, ability: 'double5', desc: 'Fit for royalty.' },
    { tier: 4, name: 'Diamond Strawberry', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Hard as diamond.' },
    { tier: 5, name: 'Rainbow Strawberry', icon: '🌈', valueMult: 500, ability: 'autoReplant', desc: 'Every color, every flavor.' },
    { tier: 6, name: 'Nebula Strawberry', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Born in a nebula.' },
    { tier: 7, name: 'Celestial Strawberry', icon: '✨', valueMult: 15000, ability: 'passiveCoins', desc: 'Heaven-sent berry.' },
    { tier: 8, name: 'OMEGA Strawberry', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The final berry.' },
  ],
  pumpkin: [
    { tier: 1, name: 'Pumpkin', icon: '🎃', valueMult: 1, ability: null, desc: 'Big orange pumpkin.' },
    { tier: 2, name: 'Giant Pumpkin', icon: '🎃', valueMult: 5, ability: 'speed10', desc: 'Massive size!' },
    { tier: 3, name: 'Golden Pumpkin', icon: '🏆', valueMult: 20, ability: 'double5', desc: 'Gleaming gold.' },
    { tier: 4, name: 'Crystal Pumpkin', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Transparent beauty.' },
    { tier: 5, name: 'Phantom Pumpkin', icon: '👻', valueMult: 500, ability: 'autoReplant', desc: 'Haunted energy.' },
    { tier: 6, name: 'Quantum Pumpkin', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Multi-dimensional.' },
    { tier: 7, name: 'Cosmic Pumpkin', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Planet-sized flavor.' },
    { tier: 8, name: 'OMEGA Pumpkin', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The cosmic gourd.' },
  ],
  sunflower: [
    { tier: 1, name: 'Sunflower', icon: '🌻', valueMult: 1, ability: null, desc: 'Bright sunflower.' },
    { tier: 2, name: 'Giant Sunflower', icon: '🌻', valueMult: 5, ability: 'speed10', desc: 'Tower of gold.' },
    { tier: 3, name: 'Golden Sunflower', icon: '🏆', valueMult: 20, ability: 'double5', desc: 'Pure gold petals.' },
    { tier: 4, name: 'Crystal Sunflower', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Prismatic light.' },
    { tier: 5, name: 'Solar Sunflower', icon: '☀️', valueMult: 500, ability: 'autoReplant', desc: 'Harnesses the sun.' },
    { tier: 6, name: 'Quantum Sunflower', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Light-bending.' },
    { tier: 7, name: 'Stellar Sunflower', icon: '⭐', valueMult: 15000, ability: 'passiveCoins', desc: 'A miniature star.' },
    { tier: 8, name: 'OMEGA Sunflower', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The sun itself.' },
  ],
  watermelon: [
    { tier: 1, name: 'Watermelon', icon: '🍉', valueMult: 1, ability: null, desc: 'Refreshing melon.' },
    { tier: 2, name: 'Sweet Melon', icon: '🍉', valueMult: 5, ability: 'speed10', desc: 'Extra juicy.' },
    { tier: 3, name: 'Golden Melon', icon: '🏆', valueMult: 20, ability: 'double5', desc: 'Solid gold rind.' },
    { tier: 4, name: 'Crystal Melon', icon: '💎', valueMult: 100, ability: 'double10', desc: 'See-through beauty.' },
    { tier: 5, name: 'Frost Melon', icon: '❄️', valueMult: 500, ability: 'autoReplant', desc: 'Ice-cold inside.' },
    { tier: 6, name: 'Quantum Melon', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Infinite slices.' },
    { tier: 7, name: 'Cosmic Melon', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Planetary melon.' },
    { tier: 8, name: 'OMEGA Melon', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Universal fruit.' },
  ],
  cotton: [
    { tier: 1, name: 'Cotton', icon: '☁️', valueMult: 1, ability: null, desc: 'Soft cotton.' },
    { tier: 2, name: 'Silk Cotton', icon: '☁️', valueMult: 5, ability: 'speed10', desc: 'Silky smooth.' },
    { tier: 3, name: 'Golden Cotton', icon: '🏆', valueMult: 20, ability: 'double5', desc: 'Threads of gold.' },
    { tier: 4, name: 'Crystal Cotton', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Fiber optic.' },
    { tier: 5, name: 'Cloud Cotton', icon: '⛅', valueMult: 500, ability: 'autoReplant', desc: 'Lighter than air.' },
    { tier: 6, name: 'Quantum Cotton', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Woven reality.' },
    { tier: 7, name: 'Cosmic Cotton', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Stardust fibers.' },
    { tier: 8, name: 'OMEGA Cotton', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Universal fabric.' },
  ],
  rice: [
    { tier: 1, name: 'Rice', icon: '🍚', valueMult: 1, ability: null, desc: 'Grain of prosperity.' },
    { tier: 2, name: 'Jasmine Rice', icon: '🍚', valueMult: 5, ability: 'speed10', desc: 'Fragrant and fine.' },
    { tier: 3, name: 'Golden Rice', icon: '🏆', valueMult: 20, ability: 'double5', desc: 'Enriched with gold.' },
    { tier: 4, name: 'Crystal Rice', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Each grain a gem.' },
    { tier: 5, name: 'Plasma Rice', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Energy-infused.' },
    { tier: 6, name: 'Quantum Rice', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Infinite grains.' },
    { tier: 7, name: 'Cosmic Rice', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Harvested from stars.' },
    { tier: 8, name: 'OMEGA Rice', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The final grain.' },
  ],
};

// Evolution level thresholds
const EVOLUTION_LEVELS = [1, 10, 25, 50, 100, 200, 500, 1000];

// Base crop data with FAST timers for idle tycoon feel
const CROPS_DATA = {
  wheat: {
    id: 'wheat', name: 'Wheat', icon: '🌾',
    cost: 5, growthTime: 10, sellPrice: 10, xp: 5, unlockLevel: 1,
    stages: ['🟫', '🌱', '🌿', '🌾'],
    description: 'A staple grain. Quick to grow and always useful.',
    color: '#D4A574'
  },
  corn: {
    id: 'corn', name: 'Corn', icon: '🌽',
    cost: 10, growthTime: 20, sellPrice: 22, xp: 10, unlockLevel: 1,
    stages: ['🟫', '🌱', '🌿', '🌽'],
    description: 'Golden ears of corn. Great for feeding chickens!',
    color: '#F4D03F'
  },
  carrot: {
    id: 'carrot', name: 'Carrot', icon: '🥕',
    cost: 15, growthTime: 30, sellPrice: 35, xp: 15, unlockLevel: 2,
    stages: ['🟫', '🌱', '🌿', '🥕'],
    description: 'Crunchy and nutritious. Pigs love them.',
    color: '#E67E22'
  },
  tomato: {
    id: 'tomato', name: 'Tomato', icon: '🍅',
    cost: 25, growthTime: 45, sellPrice: 55, xp: 25, unlockLevel: 3,
    stages: ['🟫', '🌱', '🌿', '🍅'],
    description: 'Juicy red tomatoes, fresh from the vine.',
    color: '#E74C3C'
  },
  strawberry: {
    id: 'strawberry', name: 'Strawberry', icon: '🍓',
    cost: 40, growthTime: 60, sellPrice: 90, xp: 40, unlockLevel: 5,
    stages: ['🟫', '🌱', '🌿', '🍓'],
    description: 'Sweet strawberries. Perfect for smoothies!',
    color: '#FF6B6B'
  },
  pumpkin: {
    id: 'pumpkin', name: 'Pumpkin', icon: '🎃',
    cost: 60, growthTime: 90, sellPrice: 140, xp: 60, unlockLevel: 7,
    stages: ['🟫', '🌱', '🌿', '🎃'],
    description: 'Big orange pumpkins. Spooky and delicious!',
    color: '#F39C12'
  },
  sunflower: {
    id: 'sunflower', name: 'Sunflower', icon: '🌻',
    cost: 80, growthTime: 120, sellPrice: 200, xp: 80, unlockLevel: 10,
    stages: ['🟫', '🌱', '🌿', '🌻'],
    description: 'Tall, bright sunflowers that follow the sun.',
    color: '#F1C40F'
  },
  watermelon: {
    id: 'watermelon', name: 'Watermelon', icon: '🍉',
    cost: 120, growthTime: 180, sellPrice: 320, xp: 120, unlockLevel: 13,
    stages: ['🟫', '🌱', '🌿', '🍉'],
    description: 'Refreshing watermelons. A summer favorite!',
    color: '#2ECC71'
  },
  cotton: {
    id: 'cotton', name: 'Cotton', icon: '☁️',
    cost: 150, growthTime: 240, sellPrice: 400, xp: 150, unlockLevel: 16,
    stages: ['🟫', '🌱', '🌿', '☁️'],
    description: 'Soft cotton bolls. Essential for textiles.',
    color: '#ECF0F1'
  },
  rice: {
    id: 'rice', name: 'Rice', icon: '🍚',
    cost: 200, growthTime: 300, sellPrice: 550, xp: 200, unlockLevel: 20,
    stages: ['🟫', '🌱', '🌿', '🍚'],
    description: 'Paddies of rice. The grain of prosperity.',
    color: '#FAD7A0'
  }
};

// Per-item upgrade track definitions
const UPGRADE_TRACKS = {
  speed: { name: 'Growth Speed', icon: '⚡', maxLevel: 50, perLevel: 0.02, desc: '-2% time per level' },
  value: { name: 'Sell Value', icon: '💰', maxLevel: 50, perLevel: 0.10, desc: '+10% value per level' },
  double: { name: 'Double Harvest', icon: '🎯', maxLevel: 30, perLevel: 0.02, desc: '+2% chance per level' },
  autoReplant: { name: 'Auto-Replant', icon: '✨', maxLevel: 20, perLevel: 0.05, desc: '+5% chance per level' },
  critical: { name: 'Critical Harvest', icon: '🌟', maxLevel: 20, perLevel: 0.01, desc: '+1% chance for 5x', reqTier: 4 },
  synergy: { name: 'Synergy', icon: '🔗', maxLevel: 10, perLevel: 0.03, desc: '+3% all same type', reqTier: 6 },
};

// Upgrade cost formula: baseCost * 1.15^level
function getUpgradeCost(baseCost, level) {
  return Math.floor(baseCost * Math.pow(1.15, level));
}
