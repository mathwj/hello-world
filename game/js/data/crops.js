// Crop configuration data - easily extensible
const CROPS_DATA = {
  wheat: {
    id: 'wheat', name: 'Wheat', icon: '🌾',
    cost: 5, growthTime: 2, sellPrice: 10, xp: 5, unlockLevel: 1,
    stages: ['🟫', '🌱', '🌿', '🌾'],
    description: 'A staple grain. Quick to grow and always useful.',
    color: '#D4A574'
  },
  corn: {
    id: 'corn', name: 'Corn', icon: '🌽',
    cost: 10, growthTime: 5, sellPrice: 22, xp: 10, unlockLevel: 1,
    stages: ['🟫', '🌱', '🌿', '🌽'],
    description: 'Golden ears of corn. Great for feeding chickens!',
    color: '#F4D03F'
  },
  carrot: {
    id: 'carrot', name: 'Carrot', icon: '🥕',
    cost: 15, growthTime: 8, sellPrice: 35, xp: 15, unlockLevel: 2,
    stages: ['🟫', '🌱', '🌿', '🥕'],
    description: 'Crunchy and nutritious. Pigs love them.',
    color: '#E67E22'
  },
  tomato: {
    id: 'tomato', name: 'Tomato', icon: '🍅',
    cost: 25, growthTime: 15, sellPrice: 55, xp: 25, unlockLevel: 3,
    stages: ['🟫', '🌱', '🌿', '🍅'],
    description: 'Juicy red tomatoes, fresh from the vine.',
    color: '#E74C3C'
  },
  strawberry: {
    id: 'strawberry', name: 'Strawberry', icon: '🍓',
    cost: 40, growthTime: 30, sellPrice: 90, xp: 40, unlockLevel: 5,
    stages: ['🟫', '🌱', '🌿', '🍓'],
    description: 'Sweet strawberries. Perfect for smoothies!',
    color: '#FF6B6B'
  },
  pumpkin: {
    id: 'pumpkin', name: 'Pumpkin', icon: '🎃',
    cost: 60, growthTime: 60, sellPrice: 140, xp: 60, unlockLevel: 7,
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
    cost: 120, growthTime: 240, sellPrice: 320, xp: 120, unlockLevel: 13,
    stages: ['🟫', '🌱', '🌿', '🍉'],
    description: 'Refreshing watermelons. A summer favorite!',
    color: '#2ECC71'
  },
  cotton: {
    id: 'cotton', name: 'Cotton', icon: '☁️',
    cost: 150, growthTime: 360, sellPrice: 400, xp: 150, unlockLevel: 16,
    stages: ['🟫', '🌱', '🌿', '☁️'],
    description: 'Soft cotton bolls. Essential for textiles.',
    color: '#ECF0F1'
  },
  rice: {
    id: 'rice', name: 'Rice', icon: '🍚',
    cost: 200, growthTime: 480, sellPrice: 550, xp: 200, unlockLevel: 20,
    stages: ['🟫', '🌱', '🌿', '🍚'],
    description: 'Paddies of rice. The grain of prosperity.',
    color: '#FAD7A0'
  }
};
