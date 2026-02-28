// Tree configuration data
const TREES_DATA = {
  apple: {
    id: 'apple', name: 'Apple Tree', icon: '🍎',
    cost: 100, matureTime: 3600, fruitCycle: 14400,
    fruitSellPrice: 30, fruitIcon: '🍎', fruitName: 'Apple',
    xpPerHarvest: 15, unlockLevel: 3,
    stages: ['🌱', '🌳', '🍎'],
    description: 'A lovely apple tree. Bears fruit every few hours.',
    color: '#E74C3C'
  },
  orange: {
    id: 'orange', name: 'Orange Tree', icon: '🍊',
    cost: 200, matureTime: 7200, fruitCycle: 21600,
    fruitSellPrice: 50, fruitIcon: '🍊', fruitName: 'Orange',
    xpPerHarvest: 25, unlockLevel: 6,
    stages: ['🌱', '🌳', '🍊'],
    description: 'Produces sweet, juicy oranges.',
    color: '#F39C12'
  },
  cherry: {
    id: 'cherry', name: 'Cherry Tree', icon: '🍒',
    cost: 350, matureTime: 10800, fruitCycle: 28800,
    fruitSellPrice: 80, fruitIcon: '🍒', fruitName: 'Cherry',
    xpPerHarvest: 40, unlockLevel: 10,
    stages: ['🌱', '🌳', '🍒'],
    description: 'Beautiful cherry blossoms and tasty fruit.',
    color: '#C0392B'
  },
  cocoa: {
    id: 'cocoa', name: 'Cocoa Tree', icon: '🍫',
    cost: 500, matureTime: 14400, fruitCycle: 43200,
    fruitSellPrice: 130, fruitIcon: '🍫', fruitName: 'Cocoa',
    xpPerHarvest: 65, unlockLevel: 15,
    stages: ['🌱', '🌳', '🍫'],
    description: 'Tropical cocoa beans for making chocolate.',
    color: '#6D4C41'
  },
  coconut: {
    id: 'coconut', name: 'Coconut Palm', icon: '🥥',
    cost: 800, matureTime: 21600, fruitCycle: 86400,
    fruitSellPrice: 250, fruitIcon: '🥥', fruitName: 'Coconut',
    xpPerHarvest: 100, unlockLevel: 20,
    stages: ['🌱', '🌴', '🥥'],
    description: 'A tall palm tree. Coconuts take a while but are valuable!',
    color: '#8D6E63'
  }
};
