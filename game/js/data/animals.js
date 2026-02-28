// Animal configuration data
const ANIMALS_DATA = {
  chicken: {
    id: 'chicken', name: 'Chicken', icon: '🐔',
    cost: 50, feedRequired: { corn: 2 }, productionTime: 30,
    product: 'eggs', productIcon: '🥚', productName: 'Eggs',
    productQuantity: 3, productValue: 15,
    penType: 'coop', unlockLevel: 2, maxPerPen: 6,
    description: 'Clucks around the farm and lays fresh eggs daily.',
    idleFrames: ['🐔', '🐓', '🐔', '🐣']
  },
  goat: {
    id: 'goat', name: 'Goat', icon: '🐐',
    cost: 150, feedRequired: { wheat: 3 }, productionTime: 120,
    product: 'goat_milk', productIcon: '🥛', productName: 'Goat Milk',
    productQuantity: 1, productValue: 60,
    penType: 'barn', unlockLevel: 5, maxPerPen: 4,
    description: 'A friendly goat that produces creamy milk.',
    idleFrames: ['🐐', '🐐', '🐑', '🐐']
  },
  sheep: {
    id: 'sheep', name: 'Sheep', icon: '🐑',
    cost: 250, feedRequired: { corn: 4 }, productionTime: 180,
    product: 'wool', productIcon: '🧶', productName: 'Wool',
    productQuantity: 1, productValue: 90,
    penType: 'barn', unlockLevel: 7, maxPerPen: 4,
    description: 'Fluffy sheep that provides warm wool.',
    idleFrames: ['🐑', '🐑', '🐏', '🐑']
  },
  cow: {
    id: 'cow', name: 'Cow', icon: '🐄',
    cost: 300, feedRequired: { wheat: 5 }, productionTime: 240,
    product: 'milk', productIcon: '🥛', productName: 'Milk',
    productQuantity: 2, productValue: 80,
    penType: 'barn', unlockLevel: 8, maxPerPen: 4,
    description: 'A gentle cow that gives rich, creamy milk.',
    idleFrames: ['🐄', '🐮', '🐄', '🐂']
  },
  bee: {
    id: 'bee', name: 'Bee Hive', icon: '🐝',
    cost: 200, feedRequired: {}, productionTime: 120,
    product: 'honey', productIcon: '🍯', productName: 'Honey',
    productQuantity: 1, productValue: 70,
    penType: 'hive', unlockLevel: 10, maxPerPen: 1,
    needsFlowers: true, flowerRadius: 3,
    description: 'Busy bees make sweet honey. Needs flowers nearby!',
    idleFrames: ['🐝', '🐝', '🐝', '🐝']
  },
  pig: {
    id: 'pig', name: 'Pig', icon: '🐷',
    cost: 400, feedRequired: { carrot: 5 }, productionTime: 360,
    product: 'truffle', productIcon: '🍄', productName: 'Truffle',
    productQuantity: 1, productValue: 150,
    penType: 'pigsty', unlockLevel: 12, maxPerPen: 4,
    description: 'Adorable pig with a nose for truffles!',
    idleFrames: ['🐷', '🐖', '🐷', '🐽']
  },
  horse: {
    id: 'horse', name: 'Horse', icon: '🐴',
    cost: 800, feedRequired: { wheat: 8 }, productionTime: 480,
    product: null, productIcon: null, productName: null,
    productQuantity: 0, productValue: 0,
    penType: 'stable', unlockLevel: 15, maxPerPen: 2,
    isDecorative: true, speedBoost: 1.5,
    description: 'A majestic horse. Boosts your movement speed!',
    idleFrames: ['🐴', '🐎', '🐴', '🏇']
  }
};

const ANIMAL_PENS_DATA = {
  coop: {
    id: 'coop', name: 'Chicken Coop', icon: '🏠',
    cost: 100, size: { w: 2, h: 2 }, capacity: 6,
    unlockLevel: 2, buildTime: 1,
    description: 'A cozy coop for up to 6 chickens.',
    acceptsAnimals: ['chicken']
  },
  barn: {
    id: 'barn', name: 'Barn', icon: '🏚️',
    cost: 300, size: { w: 3, h: 2 }, capacity: 4,
    unlockLevel: 5, buildTime: 5,
    description: 'A spacious barn for cows, goats, and sheep.',
    acceptsAnimals: ['cow', 'goat', 'sheep']
  },
  pigsty: {
    id: 'pigsty', name: 'Pigsty', icon: '🏗️',
    cost: 350, size: { w: 2, h: 2 }, capacity: 4,
    unlockLevel: 12, buildTime: 5,
    description: 'A muddy pigsty where pigs feel right at home.',
    acceptsAnimals: ['pig']
  },
  stable: {
    id: 'stable', name: 'Stable', icon: '🏛️',
    cost: 600, size: { w: 3, h: 2 }, capacity: 2,
    unlockLevel: 15, buildTime: 10,
    description: 'An elegant stable for your horses.',
    acceptsAnimals: ['horse']
  },
  hive: {
    id: 'hive', name: 'Beehive', icon: '🐝',
    cost: 200, size: { w: 1, h: 1 }, capacity: 1,
    unlockLevel: 10, buildTime: 2,
    description: 'A buzzing beehive. Place near flowers!',
    acceptsAnimals: ['bee']
  }
};
