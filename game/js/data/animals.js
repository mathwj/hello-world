// Animal configuration data - Idle Tycoon Edition
const ANIMALS_DATA = {
  chicken: {
    id: 'chicken', name: 'Chicken', icon: '🐔',
    cost: 50, feedRequired: { corn: 2 }, productionTime: 15,
    product: 'eggs', productIcon: '🥚', productName: 'Eggs',
    productQuantity: 3, productValue: 15,
    penType: 'coop', unlockLevel: 2, maxPerPen: 6,
    description: 'Clucks around the farm and lays fresh eggs daily.',
    idleFrames: ['🐔', '🐓', '🐔', '🐣']
  },
  goat: {
    id: 'goat', name: 'Goat', icon: '🐐',
    cost: 150, feedRequired: { wheat: 3 }, productionTime: 45,
    product: 'goat_milk', productIcon: '🥛', productName: 'Goat Milk',
    productQuantity: 1, productValue: 60,
    penType: 'barn', unlockLevel: 5, maxPerPen: 4,
    description: 'A friendly goat that produces creamy milk.',
    idleFrames: ['🐐', '🐐', '🐑', '🐐']
  },
  sheep: {
    id: 'sheep', name: 'Sheep', icon: '🐑',
    cost: 250, feedRequired: { corn: 4 }, productionTime: 50,
    product: 'wool', productIcon: '🧶', productName: 'Wool',
    productQuantity: 1, productValue: 90,
    penType: 'barn', unlockLevel: 7, maxPerPen: 4,
    description: 'Fluffy sheep that provides warm wool.',
    idleFrames: ['🐑', '🐑', '🐏', '🐑']
  },
  cow: {
    id: 'cow', name: 'Cow', icon: '🐄',
    cost: 300, feedRequired: { wheat: 5 }, productionTime: 60,
    product: 'milk', productIcon: '🥛', productName: 'Milk',
    productQuantity: 2, productValue: 80,
    penType: 'barn', unlockLevel: 8, maxPerPen: 4,
    description: 'A gentle cow that gives rich, creamy milk.',
    idleFrames: ['🐄', '🐮', '🐄', '🐂']
  },
  bee: {
    id: 'bee', name: 'Bee Hive', icon: '🐝',
    cost: 200, feedRequired: {}, productionTime: 40,
    product: 'honey', productIcon: '🍯', productName: 'Honey',
    productQuantity: 1, productValue: 70,
    penType: 'hive', unlockLevel: 10, maxPerPen: 1,
    needsFlowers: true, flowerRadius: 3,
    description: 'Busy bees make sweet honey. Needs flowers nearby!',
    idleFrames: ['🐝', '🐝', '🐝', '🐝']
  },
  pig: {
    id: 'pig', name: 'Pig', icon: '🐷',
    cost: 400, feedRequired: { carrot: 5 }, productionTime: 90,
    product: 'truffle', productIcon: '🍄', productName: 'Truffle',
    productQuantity: 1, productValue: 150,
    penType: 'pigsty', unlockLevel: 12, maxPerPen: 4,
    description: 'Adorable pig with a nose for truffles!',
    idleFrames: ['🐷', '🐖', '🐷', '🐽']
  },
  horse: {
    id: 'horse', name: 'Horse', icon: '🐴',
    cost: 800, feedRequired: { wheat: 8 }, productionTime: 120,
    product: null, productIcon: null, productName: null,
    productQuantity: 0, productValue: 0,
    penType: 'stable', unlockLevel: 15, maxPerPen: 2,
    isDecorative: true, speedBoost: 1.5,
    description: 'A majestic horse. Boosts your movement speed!',
    idleFrames: ['🐴', '🐎', '🐴', '🏇']
  }
};

// Animal Evolution Tiers
const ANIMAL_EVOLUTION_TIERS = {
  chicken: [
    { tier: 1, name: 'Chicken', icon: '🐔', valueMult: 1, ability: 'None', desc: 'A basic barnyard chicken.' },
    { tier: 2, name: 'Golden Hen', icon: '🐔', valueMult: 3, ability: 'Golden Eggs', desc: 'Lays golden-tinted eggs worth 3x.' },
    { tier: 3, name: 'Prize Rooster', icon: '🐓', valueMult: 8, ability: 'Double Clutch', desc: 'Produces double the eggs per cycle.' },
    { tier: 4, name: 'Phoenix Chick', icon: '🐣', valueMult: 25, ability: 'Fast Hatch', desc: 'Production time halved.' },
    { tier: 5, name: 'Thunderbird', icon: '⚡', valueMult: 100, ability: 'Storm Eggs', desc: 'Eggs crackle with energy.' },
    { tier: 6, name: 'Celestial Fowl', icon: '✨', valueMult: 500, ability: 'Star Eggs', desc: 'Lays eggs that shimmer with starlight.' },
    { tier: 7, name: 'Dragon Hen', icon: '🐉', valueMult: 5000, ability: 'Dragon Eggs', desc: 'Lays rare dragon eggs.' },
    { tier: 8, name: 'Cosmic Rooster', icon: '🌌', valueMult: 100000, ability: 'Cosmic Clutch', desc: 'Eggs contain miniature galaxies.' }
  ],
  cow: [
    { tier: 1, name: 'Cow', icon: '🐄', valueMult: 1, ability: 'None', desc: 'A gentle dairy cow.' },
    { tier: 2, name: 'Jersey Cow', icon: '🐄', valueMult: 3, ability: 'Rich Cream', desc: 'Produces creamier milk worth 3x.' },
    { tier: 3, name: 'Highland Cow', icon: '🐮', valueMult: 8, ability: 'Hardy', desc: 'Never needs feeding twice.' },
    { tier: 4, name: 'Crystal Cow', icon: '💎', valueMult: 25, ability: 'Crystal Milk', desc: 'Milk sparkles with gems.' },
    { tier: 5, name: 'Moo-nicorn', icon: '🦄', valueMult: 100, ability: 'Rainbow Milk', desc: 'Produces rainbow-colored milk.' },
    { tier: 6, name: 'Nebula Bull', icon: '🌟', valueMult: 500, ability: 'Astral Dairy', desc: 'Produces cosmic cream.' },
    { tier: 7, name: 'Titan Ox', icon: '🐂', valueMult: 5000, ability: 'Mega Yield', desc: '10x production quantity.' },
    { tier: 8, name: 'Eternal Auroch', icon: '🌌', valueMult: 100000, ability: 'Infinite Dairy', desc: 'Auto-produces without feeding.' }
  ],
  goat: [
    { tier: 1, name: 'Goat', icon: '🐐', valueMult: 1, ability: 'None', desc: 'A friendly milk goat.' },
    { tier: 2, name: 'Alpine Goat', icon: '🐐', valueMult: 3, ability: 'Mountain Milk', desc: 'Richer milk from mountain breeds.' },
    { tier: 3, name: 'Cashmere Goat', icon: '🐑', valueMult: 8, ability: 'Luxury Fiber', desc: 'Also produces cashmere.' },
    { tier: 4, name: 'Golden Goat', icon: '🏆', valueMult: 25, ability: 'Midas Touch', desc: 'Products are gold-plated.' },
    { tier: 5, name: 'Thunder Ram', icon: '⚡', valueMult: 100, ability: 'Storm Charge', desc: 'Electrified production speed.' },
    { tier: 6, name: 'Spirit Ibex', icon: '👻', valueMult: 500, ability: 'Phantom Yield', desc: 'Produces ghost milk.' },
    { tier: 7, name: 'Mythic Satyr', icon: '🎵', valueMult: 5000, ability: 'Enchanted Dairy', desc: 'Music enhances production.' },
    { tier: 8, name: 'Void Capricorn', icon: '🌌', valueMult: 100000, ability: 'Dimensional Dairy', desc: 'Milk from another dimension.' }
  ],
  sheep: [
    { tier: 1, name: 'Sheep', icon: '🐑', valueMult: 1, ability: 'None', desc: 'A fluffy wool sheep.' },
    { tier: 2, name: 'Merino', icon: '🐑', valueMult: 3, ability: 'Fine Wool', desc: 'Produces premium quality wool.' },
    { tier: 3, name: 'Ram', icon: '🐏', valueMult: 8, ability: 'Tough Fleece', desc: 'Double wool per shearing.' },
    { tier: 4, name: 'Crystal Lamb', icon: '💎', valueMult: 25, ability: 'Crystal Fiber', desc: 'Wool glimmers with crystals.' },
    { tier: 5, name: 'Storm Sheep', icon: '⛈️', valueMult: 100, ability: 'Lightning Wool', desc: 'Electrically charged wool.' },
    { tier: 6, name: 'Cloud Ram', icon: '☁️', valueMult: 500, ability: 'Cloud Fleece', desc: 'Wool lighter than air.' },
    { tier: 7, name: 'Mythic Fleece', icon: '🏛️', valueMult: 5000, ability: 'Golden Fleece', desc: 'The legendary golden fleece.' },
    { tier: 8, name: 'Astral Lamb', icon: '🌌', valueMult: 100000, ability: 'Starweave', desc: 'Wool woven from starlight.' }
  ],
  pig: [
    { tier: 1, name: 'Pig', icon: '🐷', valueMult: 1, ability: 'None', desc: 'A truffle-hunting pig.' },
    { tier: 2, name: 'Iberian Pig', icon: '🐖', valueMult: 3, ability: 'Fine Nose', desc: 'Finds rarer truffles.' },
    { tier: 3, name: 'Boar', icon: '🐗', valueMult: 8, ability: 'Wild Forager', desc: 'Finds double truffles.' },
    { tier: 4, name: 'Golden Pig', icon: '🏆', valueMult: 25, ability: 'Gold Digger', desc: 'Finds gold nuggets too.' },
    { tier: 5, name: 'War Boar', icon: '⚔️', valueMult: 100, ability: 'Battle Truffle', desc: 'Finds battle-enhanced truffles.' },
    { tier: 6, name: 'Spirit Swine', icon: '👻', valueMult: 500, ability: 'Ghost Truffle', desc: 'Finds phantom truffles.' },
    { tier: 7, name: 'Dragon Boar', icon: '🐉', valueMult: 5000, ability: 'Dragon Truffle', desc: 'Finds legendary dragon truffles.' },
    { tier: 8, name: 'Cosmic Pig', icon: '🌌', valueMult: 100000, ability: 'Void Truffle', desc: 'Finds truffles from the void.' }
  ],
  bee: [
    { tier: 1, name: 'Bee Hive', icon: '🐝', valueMult: 1, ability: 'None', desc: 'A basic beehive.' },
    { tier: 2, name: 'Honey Swarm', icon: '🍯', valueMult: 3, ability: 'Sweet Nectar', desc: 'Produces sweeter honey.' },
    { tier: 3, name: 'Royal Hive', icon: '👑', valueMult: 8, ability: 'Royal Jelly', desc: 'Also produces royal jelly.' },
    { tier: 4, name: 'Crystal Hive', icon: '💎', valueMult: 25, ability: 'Crystal Honey', desc: 'Crystallized premium honey.' },
    { tier: 5, name: 'Thunder Swarm', icon: '⚡', valueMult: 100, ability: 'Electric Honey', desc: 'Honey buzzes with energy.' },
    { tier: 6, name: 'Phantom Hive', icon: '👻', valueMult: 500, ability: 'Ghost Honey', desc: 'Ethereal honey production.' },
    { tier: 7, name: 'Dragon Hive', icon: '🐉', valueMult: 5000, ability: 'Dragon Nectar', desc: 'Bees feed on dragon flowers.' },
    { tier: 8, name: 'Cosmic Swarm', icon: '🌌', valueMult: 100000, ability: 'Star Honey', desc: 'Honey from cosmic flowers.' }
  ]
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
