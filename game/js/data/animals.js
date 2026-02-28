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
    cost: 200, feedRequired: {}, productionTime: 30,
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
  },
  duck: {
    id: 'duck', name: 'Duck', icon: '🦆',
    cost: 350, feedRequired: { rice: 4 }, productionTime: 50,
    product: 'duck_eggs', productIcon: '🥚', productName: 'Duck Eggs',
    productQuantity: 2, productValue: 55,
    penType: 'pond', unlockLevel: 22, maxPerPen: 4,
    description: 'A cheerful duck that paddles around and lays large eggs.',
    idleFrames: ['🦆', '🦆', '🐥', '🦆']
  },
  turkey: {
    id: 'turkey', name: 'Turkey', icon: '🦃',
    cost: 500, feedRequired: { corn: 6 }, productionTime: 80,
    product: 'feathers', productIcon: '🪶', productName: 'Feathers',
    productQuantity: 5, productValue: 40,
    penType: 'coop_plus', unlockLevel: 27, maxPerPen: 6,
    description: 'A proud turkey that sheds beautiful plumage.',
    idleFrames: ['🦃', '🦃', '🐓', '🦃']
  },
  ostrich: {
    id: 'ostrich', name: 'Ostrich', icon: '🦩',
    cost: 900, feedRequired: { wheat: 10 }, productionTime: 150,
    product: 'giant_egg', productIcon: '🥚', productName: 'Giant Egg',
    productQuantity: 1, productValue: 300,
    penType: 'savanna', unlockLevel: 34, maxPerPen: 2,
    description: 'A towering ostrich that lays massive eggs.',
    idleFrames: ['🦩', '🐦', '🦩', '🦅']
  },
  llama: {
    id: 'llama', name: 'Llama', icon: '🦙',
    cost: 700, feedRequired: { wheat: 7 }, productionTime: 100,
    product: 'llama_wool', productIcon: '🧶', productName: 'Llama Wool',
    productQuantity: 1, productValue: 180,
    penType: 'barn_plus', unlockLevel: 30, maxPerPen: 4,
    description: 'A noble llama with luxuriously soft fleece.',
    idleFrames: ['🦙', '🦙', '🐪', '🦙']
  },
  alpaca: {
    id: 'alpaca', name: 'Alpaca', icon: '🦙',
    cost: 1200, feedRequired: { cotton: 8 }, productionTime: 120,
    product: 'premium_wool', productIcon: '🧣', productName: 'Premium Wool',
    productQuantity: 1, productValue: 350,
    penType: 'barn_plus', unlockLevel: 44, maxPerPen: 4,
    description: 'An elegant alpaca that produces the finest wool in the land.',
    idleFrames: ['🦙', '🐑', '🦙', '🦙']
  },
  silk_worm: {
    id: 'silk_worm', name: 'Silk Worm', icon: '🐛',
    cost: 600, feedRequired: { lavender: 5 }, productionTime: 90,
    product: 'silk', productIcon: '🎀', productName: 'Silk',
    productQuantity: 1, productValue: 250,
    penType: 'greenhouse_pen', unlockLevel: 49, maxPerPen: 4,
    description: 'A delicate silk worm that spins exquisite threads.',
    idleFrames: ['🐛', '🐛', '🦋', '🐛']
  },
  peacock: {
    id: 'peacock', name: 'Peacock', icon: '🦚',
    cost: 1500, feedRequired: { grape: 6 }, productionTime: 100,
    product: 'decorative_feather', productIcon: '🪶', productName: 'Decorative Feather',
    productQuantity: 3, productValue: 200,
    penType: 'garden', unlockLevel: 40, maxPerPen: 3,
    isDecorative: true, beautyBoost: 1.2,
    description: 'A dazzling peacock that fans its iridescent plumage. Boosts farm beauty!',
    idleFrames: ['🦚', '🦚', '🦜', '🦚']
  },
  flamingo: {
    id: 'flamingo', name: 'Flamingo', icon: '🦩',
    cost: 2000, feedRequired: { strawberry: 8 }, productionTime: 130,
    product: 'pink_feather', productIcon: '🪶', productName: 'Pink Feather',
    productQuantity: 1, productValue: 400,
    penType: 'tropical', unlockLevel: 57, maxPerPen: 2,
    description: 'A graceful flamingo that stands on one leg and drops rare pink feathers.',
    idleFrames: ['🦩', '🦩', '🌸', '🦩']
  },
  penguin: {
    id: 'penguin', name: 'Penguin', icon: '🐧',
    cost: 2500, feedRequired: { rice: 10 }, productionTime: 140,
    product: 'ice_crystal', productIcon: '❄️', productName: 'Ice Crystal',
    productQuantity: 1, productValue: 500,
    penType: 'arctic', unlockLevel: 59, maxPerPen: 3,
    description: 'A waddling penguin that conjures pristine ice crystals.',
    idleFrames: ['🐧', '🐧', '🐦', '🐧']
  },
  snow_fox: {
    id: 'snow_fox', name: 'Snow Fox', icon: '🦊',
    cost: 3000, feedRequired: { carrot: 8 }, productionTime: 120,
    product: 'silver_fur', productIcon: '🤍', productName: 'Silver Fur',
    productQuantity: 1, productValue: 600,
    penType: 'arctic', unlockLevel: 60, maxPerPen: 3,
    description: 'A cunning arctic fox with a shimmering silver coat.',
    idleFrames: ['🦊', '🦊', '🐺', '🦊']
  },
  unicorn: {
    id: 'unicorn', name: 'Unicorn', icon: '🦄',
    cost: 10000, feedRequired: { strawberry: 15 }, productionTime: 180,
    product: 'rainbow_essence', productIcon: '🌈', productName: 'Rainbow Essence',
    productQuantity: 1, productValue: 2000,
    penType: 'enchanted', unlockLevel: 50, maxPerPen: 1,
    description: 'A mythical unicorn that distills pure rainbow essence from its horn.',
    idleFrames: ['🦄', '🦄', '🌈', '🦄']
  },
  phoenix: {
    id: 'phoenix', name: 'Phoenix', icon: '🔥',
    cost: 25000, feedRequired: { chili_pepper: 20 }, productionTime: 240,
    product: 'ember', productIcon: '🔥', productName: 'Ember',
    productQuantity: 5, productValue: 1500,
    penType: 'volcanic', unlockLevel: 75, maxPerPen: 1,
    description: 'A legendary firebird reborn from its ashes, radiating eternal flame.',
    idleFrames: ['🔥', '🐦‍🔥', '🔥', '☀️']
  },
  cosmic_dragon: {
    id: 'cosmic_dragon', name: 'Cosmic Dragon', icon: '🐉',
    cost: 100000, feedRequired: { cosmic_corn: 30 }, productionTime: 300,
    product: 'dragon_scale', productIcon: '🐉', productName: 'Dragon Scale',
    productQuantity: 3, productValue: 10000,
    penType: 'space', unlockLevel: 90, maxPerPen: 1,
    description: 'An ancient dragon from beyond the stars, its scales shimmer with cosmic power.',
    idleFrames: ['🐉', '🐲', '🐉', '🌌']
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
  bee: [
    { tier: 1, name: 'Bee Hive', icon: '🐝', valueMult: 1, ability: 'None', desc: 'A basic beehive.' },
    { tier: 2, name: 'Honey Swarm', icon: '🍯', valueMult: 3, ability: 'Sweet Nectar', desc: 'Produces sweeter honey.' },
    { tier: 3, name: 'Royal Hive', icon: '👑', valueMult: 8, ability: 'Royal Jelly', desc: 'Also produces royal jelly.' },
    { tier: 4, name: 'Crystal Hive', icon: '💎', valueMult: 25, ability: 'Crystal Honey', desc: 'Crystallized premium honey.' },
    { tier: 5, name: 'Thunder Swarm', icon: '⚡', valueMult: 100, ability: 'Electric Honey', desc: 'Honey buzzes with energy.' },
    { tier: 6, name: 'Phantom Hive', icon: '👻', valueMult: 500, ability: 'Ghost Honey', desc: 'Ethereal honey production.' },
    { tier: 7, name: 'Dragon Hive', icon: '🐉', valueMult: 5000, ability: 'Dragon Nectar', desc: 'Bees feed on dragon flowers.' },
    { tier: 8, name: 'Cosmic Swarm', icon: '🌌', valueMult: 100000, ability: 'Star Honey', desc: 'Honey from cosmic flowers.' }
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
  horse: [
    { tier: 1, name: 'Horse', icon: '🐴', valueMult: 1, ability: 'Speed Boost', desc: 'A majestic farm horse.' },
    { tier: 2, name: 'Thoroughbred', icon: '🐎', valueMult: 3, ability: 'Swift Gallop', desc: 'A racing breed with 3x speed aura.' },
    { tier: 3, name: 'Mustang', icon: '🐴', valueMult: 8, ability: 'Wild Sprint', desc: 'Untamed speed boosts the whole farm.' },
    { tier: 4, name: 'Pegasus Foal', icon: '🪽', valueMult: 25, ability: 'Winged Dash', desc: 'Sprouts tiny wings for aerial speed.' },
    { tier: 5, name: 'Nightmare Steed', icon: '🔥', valueMult: 100, ability: 'Flame Trail', desc: 'Leaves a blazing trail of speed.' },
    { tier: 6, name: 'Spectral Stallion', icon: '👻', valueMult: 500, ability: 'Phase Shift', desc: 'Moves through obstacles instantly.' },
    { tier: 7, name: 'Celestial Pegasus', icon: '✨', valueMult: 5000, ability: 'Heaven Rush', desc: 'Flies across the farm in seconds.' },
    { tier: 8, name: 'Cosmic Charger', icon: '🌌', valueMult: 100000, ability: 'Warp Speed', desc: 'Bends spacetime for instant travel.' }
  ],
  duck: [
    { tier: 1, name: 'Duck', icon: '🦆', valueMult: 1, ability: 'None', desc: 'A cheerful pond duck.' },
    { tier: 2, name: 'Mallard', icon: '🦆', valueMult: 3, ability: 'Rich Yolk', desc: 'Lays eggs with richer yolks worth 3x.' },
    { tier: 3, name: 'Mandarin Duck', icon: '🦆', valueMult: 8, ability: 'Ornate Eggs', desc: 'Beautifully patterned eggs.' },
    { tier: 4, name: 'Golden Duck', icon: '🏆', valueMult: 25, ability: 'Gilded Eggs', desc: 'Eggs gleam with gold.' },
    { tier: 5, name: 'Storm Duck', icon: '⛈️', valueMult: 100, ability: 'Thunder Paddle', desc: 'Swims through storms, producing electric eggs.' },
    { tier: 6, name: 'Spectral Mallard', icon: '👻', valueMult: 500, ability: 'Phantom Quack', desc: 'Lays ethereal eggs from the spirit pond.' },
    { tier: 7, name: 'Dragon Duck', icon: '🐉', valueMult: 5000, ability: 'Drake Eggs', desc: 'Lays dragon-blessed eggs.' },
    { tier: 8, name: 'Cosmic Quacker', icon: '🌌', valueMult: 100000, ability: 'Nebula Eggs', desc: 'Eggs swirl with galactic energy.' }
  ],
  turkey: [
    { tier: 1, name: 'Turkey', icon: '🦃', valueMult: 1, ability: 'None', desc: 'A proud barnyard turkey.' },
    { tier: 2, name: 'Bronze Turkey', icon: '🦃', valueMult: 3, ability: 'Bronze Plume', desc: 'Feathers have a bronze sheen worth 3x.' },
    { tier: 3, name: 'Royal Turkey', icon: '👑', valueMult: 8, ability: 'Crown Plumage', desc: 'Regal feathers fit for royalty.' },
    { tier: 4, name: 'Golden Gobbler', icon: '🏆', valueMult: 25, ability: 'Gold Feathers', desc: 'Sheds feathers of pure gold.' },
    { tier: 5, name: 'Storm Turkey', icon: '⚡', valueMult: 100, ability: 'Lightning Plume', desc: 'Feathers crackle with static.' },
    { tier: 6, name: 'Phantom Fowl', icon: '👻', valueMult: 500, ability: 'Ghost Plume', desc: 'Ghostly feathers phase through walls.' },
    { tier: 7, name: 'Mythic Thunderbird', icon: '🦅', valueMult: 5000, ability: 'Legend Plume', desc: 'Feathers from a mythic sky beast.' },
    { tier: 8, name: 'Cosmic Gobbler', icon: '🌌', valueMult: 100000, ability: 'Star Plume', desc: 'Feathers woven from stardust.' }
  ],
  ostrich: [
    { tier: 1, name: 'Ostrich', icon: '🦩', valueMult: 1, ability: 'None', desc: 'A towering savanna bird.' },
    { tier: 2, name: 'Racing Ostrich', icon: '🦩', valueMult: 3, ability: 'Swift Layer', desc: 'Faster production from a racing breed.' },
    { tier: 3, name: 'Armored Ostrich', icon: '🛡️', valueMult: 8, ability: 'Iron Egg', desc: 'Lays eggs with a tough shell.' },
    { tier: 4, name: 'Golden Ostrich', icon: '🏆', valueMult: 25, ability: 'Gilded Egg', desc: 'Giant eggs veined with gold.' },
    { tier: 5, name: 'Thunder Strider', icon: '⚡', valueMult: 100, ability: 'Quake Egg', desc: 'Eggs that rumble with power.' },
    { tier: 6, name: 'Phantom Strider', icon: '👻', valueMult: 500, ability: 'Ghost Egg', desc: 'Ethereal giant eggs.' },
    { tier: 7, name: 'Roc Hatchling', icon: '🦅', valueMult: 5000, ability: 'Titan Egg', desc: 'Eggs the size of boulders.' },
    { tier: 8, name: 'Cosmic Strider', icon: '🌌', valueMult: 100000, ability: 'Planet Egg', desc: 'Eggs that contain tiny worlds.' }
  ],
  llama: [
    { tier: 1, name: 'Llama', icon: '🦙', valueMult: 1, ability: 'None', desc: 'A noble pack llama.' },
    { tier: 2, name: 'Huacaya Llama', icon: '🦙', valueMult: 3, ability: 'Soft Fleece', desc: 'Extra soft wool worth 3x.' },
    { tier: 3, name: 'Guard Llama', icon: '🛡️', valueMult: 8, ability: 'Protector', desc: 'Guards the barn, doubling output.' },
    { tier: 4, name: 'Golden Llama', icon: '🏆', valueMult: 25, ability: 'Sun Fleece', desc: 'Wool shimmers with golden light.' },
    { tier: 5, name: 'Storm Llama', icon: '⚡', valueMult: 100, ability: 'Thunder Fleece', desc: 'Wool charged with lightning.' },
    { tier: 6, name: 'Spirit Llama', icon: '👻', valueMult: 500, ability: 'Phantom Fleece', desc: 'Ghostly wool from the spirit realm.' },
    { tier: 7, name: 'Ancient Llama', icon: '🏛️', valueMult: 5000, ability: 'Inca Gold', desc: 'Wool blessed by ancient gods.' },
    { tier: 8, name: 'Cosmic Llama', icon: '🌌', valueMult: 100000, ability: 'Nebula Fleece', desc: 'Wool spun from nebula threads.' }
  ],
  alpaca: [
    { tier: 1, name: 'Alpaca', icon: '🦙', valueMult: 1, ability: 'None', desc: 'An elegant fiber alpaca.' },
    { tier: 2, name: 'Suri Alpaca', icon: '🦙', valueMult: 3, ability: 'Lustrous Fiber', desc: 'Silky locks worth 3x more.' },
    { tier: 3, name: 'Champion Alpaca', icon: '🏅', valueMult: 8, ability: 'Show Quality', desc: 'Award-winning fleece quality.' },
    { tier: 4, name: 'Crystal Alpaca', icon: '💎', valueMult: 25, ability: 'Diamond Fiber', desc: 'Wool embedded with crystal strands.' },
    { tier: 5, name: 'Aurora Alpaca', icon: '🌈', valueMult: 100, ability: 'Northern Lights', desc: 'Wool glows with auroral colors.' },
    { tier: 6, name: 'Phantom Alpaca', icon: '👻', valueMult: 500, ability: 'Wraith Wool', desc: 'Intangible fleece of immense value.' },
    { tier: 7, name: 'Divine Alpaca', icon: '😇', valueMult: 5000, ability: 'Holy Fleece', desc: 'Blessed wool that heals on contact.' },
    { tier: 8, name: 'Cosmic Alpaca', icon: '🌌', valueMult: 100000, ability: 'Void Fleece', desc: 'Wool from the fabric of spacetime.' }
  ],
  silk_worm: [
    { tier: 1, name: 'Silk Worm', icon: '🐛', valueMult: 1, ability: 'None', desc: 'A delicate silk spinner.' },
    { tier: 2, name: 'Mulberry Worm', icon: '🐛', valueMult: 3, ability: 'Fine Thread', desc: 'Spins finer silk worth 3x.' },
    { tier: 3, name: 'Golden Worm', icon: '🏆', valueMult: 8, ability: 'Gold Thread', desc: 'Silk interwoven with gold.' },
    { tier: 4, name: 'Crystal Larva', icon: '💎', valueMult: 25, ability: 'Crystal Silk', desc: 'Threads that glitter like diamonds.' },
    { tier: 5, name: 'Storm Spinner', icon: '⚡', valueMult: 100, ability: 'Electric Silk', desc: 'Silk that conducts lightning.' },
    { tier: 6, name: 'Phantom Weaver', icon: '👻', valueMult: 500, ability: 'Ghost Silk', desc: 'Invisible threads of immense strength.' },
    { tier: 7, name: 'Celestial Moth', icon: '🦋', valueMult: 5000, ability: 'Moonlight Silk', desc: 'Silk that glows under moonlight.' },
    { tier: 8, name: 'Cosmic Weaver', icon: '🌌', valueMult: 100000, ability: 'Starsilk', desc: 'Silk woven from strands of light.' }
  ],
  peacock: [
    { tier: 1, name: 'Peacock', icon: '🦚', valueMult: 1, ability: 'Beauty Boost', desc: 'A dazzling display bird.' },
    { tier: 2, name: 'White Peacock', icon: '🦚', valueMult: 3, ability: 'Rare Plumage', desc: 'Albino feathers worth 3x.' },
    { tier: 3, name: 'Jade Peacock', icon: '💚', valueMult: 8, ability: 'Jade Fan', desc: 'Feathers shimmer jade green.' },
    { tier: 4, name: 'Golden Peafowl', icon: '🏆', valueMult: 25, ability: 'Gold Fan', desc: 'A golden tail display of wealth.' },
    { tier: 5, name: 'Prismatic Peacock', icon: '🌈', valueMult: 100, ability: 'Rainbow Fan', desc: 'Every feather a different color.' },
    { tier: 6, name: 'Spectral Peafowl', icon: '👻', valueMult: 500, ability: 'Ghost Display', desc: 'An ethereal display mesmerizes all.' },
    { tier: 7, name: 'Phoenix Peafowl', icon: '🔥', valueMult: 5000, ability: 'Flame Fan', desc: 'Tail feathers burn with beauty.' },
    { tier: 8, name: 'Cosmic Peacock', icon: '🌌', valueMult: 100000, ability: 'Galaxy Fan', desc: 'Tail displays entire galaxies.' }
  ],
  flamingo: [
    { tier: 1, name: 'Flamingo', icon: '🦩', valueMult: 1, ability: 'None', desc: 'A graceful pink wader.' },
    { tier: 2, name: 'Scarlet Flamingo', icon: '🦩', valueMult: 3, ability: 'Deep Blush', desc: 'Deeper pink feathers worth 3x.' },
    { tier: 3, name: 'Royal Flamingo', icon: '👑', valueMult: 8, ability: 'Regal Pose', desc: 'Feathers fit for a queen.' },
    { tier: 4, name: 'Golden Flamingo', icon: '🏆', valueMult: 25, ability: 'Gilded Wing', desc: 'Wings dusted with gold.' },
    { tier: 5, name: 'Neon Flamingo', icon: '💡', valueMult: 100, ability: 'Neon Glow', desc: 'Feathers glow in neon hues.' },
    { tier: 6, name: 'Phantom Flamingo', icon: '👻', valueMult: 500, ability: 'Phantom Plume', desc: 'Ghostly pink feathers from beyond.' },
    { tier: 7, name: 'Solar Flamingo', icon: '☀️', valueMult: 5000, ability: 'Sunfire Plume', desc: 'Feathers forged in solar fire.' },
    { tier: 8, name: 'Cosmic Flamingo', icon: '🌌', valueMult: 100000, ability: 'Pulsar Plume', desc: 'Feathers pulse with cosmic radiation.' }
  ],
  penguin: [
    { tier: 1, name: 'Penguin', icon: '🐧', valueMult: 1, ability: 'None', desc: 'A waddling ice maker.' },
    { tier: 2, name: 'Emperor Penguin', icon: '🐧', valueMult: 3, ability: 'Royal Ice', desc: 'Forms purer crystals worth 3x.' },
    { tier: 3, name: 'Crested Penguin', icon: '👑', valueMult: 8, ability: 'Ice Crown', desc: 'Crystals form a frozen crown.' },
    { tier: 4, name: 'Diamond Penguin', icon: '💎', valueMult: 25, ability: 'Diamond Ice', desc: 'Ice harder than diamonds.' },
    { tier: 5, name: 'Blizzard Penguin', icon: '❄️', valueMult: 100, ability: 'Ice Storm', desc: 'Summons blizzards of crystals.' },
    { tier: 6, name: 'Phantom Penguin', icon: '👻', valueMult: 500, ability: 'Ghost Frost', desc: 'Spectral ice that never melts.' },
    { tier: 7, name: 'Frost Titan', icon: '🏔️', valueMult: 5000, ability: 'Glacier Form', desc: 'Creates entire glaciers of crystal.' },
    { tier: 8, name: 'Cosmic Penguin', icon: '🌌', valueMult: 100000, ability: 'Absolute Zero', desc: 'Crystals from the void of space.' }
  ],
  snow_fox: [
    { tier: 1, name: 'Snow Fox', icon: '🦊', valueMult: 1, ability: 'None', desc: 'A cunning arctic fox.' },
    { tier: 2, name: 'Silver Fox', icon: '🦊', valueMult: 3, ability: 'Silver Coat', desc: 'A lustrous silver pelt worth 3x.' },
    { tier: 3, name: 'Platinum Fox', icon: '🥈', valueMult: 8, ability: 'Platinum Fur', desc: 'Fur as rare as platinum.' },
    { tier: 4, name: 'Crystal Fox', icon: '💎', valueMult: 25, ability: 'Frost Pelt', desc: 'Fur embedded with ice crystals.' },
    { tier: 5, name: 'Storm Fox', icon: '⚡', valueMult: 100, ability: 'Blitz Fur', desc: 'Fur crackles with static.' },
    { tier: 6, name: 'Phantom Fox', icon: '👻', valueMult: 500, ability: 'Ghost Pelt', desc: 'Translucent fur from the spirit realm.' },
    { tier: 7, name: 'Nine-Tail Fox', icon: '🔥', valueMult: 5000, ability: 'Mystic Pelt', desc: 'Legendary fur from a mythic beast.' },
    { tier: 8, name: 'Cosmic Fox', icon: '🌌', valueMult: 100000, ability: 'Starlight Fur', desc: 'Fur woven from threads of starlight.' }
  ],
  unicorn: [
    { tier: 1, name: 'Unicorn', icon: '🦄', valueMult: 1, ability: 'None', desc: 'A mythical horned steed.' },
    { tier: 2, name: 'Radiant Unicorn', icon: '🦄', valueMult: 3, ability: 'Bright Horn', desc: 'Horn glows, producing richer essence.' },
    { tier: 3, name: 'Alicorn', icon: '🦄', valueMult: 8, ability: 'Winged Grace', desc: 'Sprouted wings amplify production.' },
    { tier: 4, name: 'Crystal Unicorn', icon: '💎', valueMult: 25, ability: 'Prism Horn', desc: 'Horn refracts light into pure essence.' },
    { tier: 5, name: 'Tempest Unicorn', icon: '⚡', valueMult: 100, ability: 'Thunder Horn', desc: 'Horn channels storms into essence.' },
    { tier: 6, name: 'Phantom Unicorn', icon: '👻', valueMult: 500, ability: 'Spirit Horn', desc: 'Horn channels ethereal energy.' },
    { tier: 7, name: 'Celestial Unicorn', icon: '✨', valueMult: 5000, ability: 'Heaven Horn', desc: 'Horn channels divine power.' },
    { tier: 8, name: 'Cosmic Unicorn', icon: '🌌', valueMult: 100000, ability: 'Infinity Horn', desc: 'Horn pierces the veil between dimensions.' }
  ],
  phoenix: [
    { tier: 1, name: 'Phoenix', icon: '🔥', valueMult: 1, ability: 'None', desc: 'A legendary firebird.' },
    { tier: 2, name: 'Crimson Phoenix', icon: '🔥', valueMult: 3, ability: 'Hot Embers', desc: 'Burns hotter, producing richer embers.' },
    { tier: 3, name: 'Solar Phoenix', icon: '☀️', valueMult: 8, ability: 'Sunfire', desc: 'Burns with the power of the sun.' },
    { tier: 4, name: 'Golden Phoenix', icon: '🏆', valueMult: 25, ability: 'Aureate Flame', desc: 'Embers turn to molten gold.' },
    { tier: 5, name: 'Blue Phoenix', icon: '💙', valueMult: 100, ability: 'Blue Flame', desc: 'Burns with an intensely hot blue fire.' },
    { tier: 6, name: 'Phantom Phoenix', icon: '👻', valueMult: 500, ability: 'Ghost Flame', desc: 'Spectral fire that burns without heat.' },
    { tier: 7, name: 'Supernova Phoenix', icon: '💥', valueMult: 5000, ability: 'Star Burst', desc: 'Explodes and reforms, showering embers.' },
    { tier: 8, name: 'Cosmic Phoenix', icon: '🌌', valueMult: 100000, ability: 'Big Bang', desc: 'Rebirths create miniature universes.' }
  ],
  cosmic_dragon: [
    { tier: 1, name: 'Cosmic Dragon', icon: '🐉', valueMult: 1, ability: 'None', desc: 'An ancient star dragon.' },
    { tier: 2, name: 'Nebula Drake', icon: '🐉', valueMult: 3, ability: 'Nebula Breath', desc: 'Scales infused with nebula energy.' },
    { tier: 3, name: 'Void Wyrm', icon: '🐲', valueMult: 8, ability: 'Void Scales', desc: 'Scales forged in the void.' },
    { tier: 4, name: 'Quasar Dragon', icon: '💎', valueMult: 25, ability: 'Quasar Core', desc: 'Heart of a quasar powers scale growth.' },
    { tier: 5, name: 'Pulsar Wyrm', icon: '⚡', valueMult: 100, ability: 'Pulsar Pulse', desc: 'Scales pulse with pulsar rhythms.' },
    { tier: 6, name: 'Phantom Dragon', icon: '👻', valueMult: 500, ability: 'Dark Matter', desc: 'Scales made of dark matter.' },
    { tier: 7, name: 'Multiverse Serpent', icon: '🌀', valueMult: 5000, ability: 'Dimensional Shed', desc: 'Sheds scales from parallel universes.' },
    { tier: 8, name: 'Omni Dragon', icon: '🌌', valueMult: 100000, ability: 'Omniscale', desc: 'Each scale contains an entire reality.' }
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
  },
  pond: {
    id: 'pond', name: 'Duck Pond', icon: '🌊',
    cost: 400, size: { w: 2, h: 2 }, capacity: 4,
    unlockLevel: 22, buildTime: 5,
    description: 'A serene pond where ducks paddle and lay eggs.',
    acceptsAnimals: ['duck']
  },
  coop_plus: {
    id: 'coop_plus', name: 'Deluxe Coop', icon: '🏡',
    cost: 500, size: { w: 2, h: 2 }, capacity: 6,
    unlockLevel: 27, buildTime: 8,
    description: 'An upgraded coop for larger poultry like turkeys.',
    acceptsAnimals: ['turkey']
  },
  savanna: {
    id: 'savanna', name: 'Savanna Enclosure', icon: '🌾',
    cost: 1000, size: { w: 3, h: 2 }, capacity: 2,
    unlockLevel: 34, buildTime: 12,
    description: 'A wide-open savanna enclosure for ostriches.',
    acceptsAnimals: ['ostrich']
  },
  barn_plus: {
    id: 'barn_plus', name: 'Deluxe Barn', icon: '🏘️',
    cost: 800, size: { w: 3, h: 2 }, capacity: 4,
    unlockLevel: 30, buildTime: 10,
    description: 'An upgraded barn for llamas and alpacas.',
    acceptsAnimals: ['llama', 'alpaca']
  },
  greenhouse_pen: {
    id: 'greenhouse_pen', name: 'Greenhouse Pen', icon: '🌿',
    cost: 700, size: { w: 2, h: 2 }, capacity: 4,
    unlockLevel: 49, buildTime: 10,
    description: 'A climate-controlled greenhouse for silk worms.',
    acceptsAnimals: ['silk_worm']
  },
  garden: {
    id: 'garden', name: 'Ornamental Garden', icon: '🌺',
    cost: 1200, size: { w: 3, h: 3 }, capacity: 3,
    unlockLevel: 40, buildTime: 15,
    description: 'A lush garden where peacocks fan their feathers.',
    acceptsAnimals: ['peacock']
  },
  tropical: {
    id: 'tropical', name: 'Tropical Lagoon', icon: '🌴',
    cost: 2000, size: { w: 3, h: 2 }, capacity: 2,
    unlockLevel: 57, buildTime: 18,
    description: 'A warm tropical lagoon for flamingos.',
    acceptsAnimals: ['flamingo']
  },
  arctic: {
    id: 'arctic', name: 'Arctic Habitat', icon: '❄️',
    cost: 2500, size: { w: 3, h: 3 }, capacity: 3,
    unlockLevel: 59, buildTime: 20,
    description: 'A frozen tundra habitat for penguins and snow foxes.',
    acceptsAnimals: ['penguin', 'snow_fox']
  },
  enchanted: {
    id: 'enchanted', name: 'Enchanted Meadow', icon: '🌈',
    cost: 8000, size: { w: 3, h: 3 }, capacity: 1,
    unlockLevel: 50, buildTime: 25,
    description: 'A magical meadow bathed in rainbow light for unicorns.',
    acceptsAnimals: ['unicorn']
  },
  volcanic: {
    id: 'volcanic', name: 'Volcanic Nest', icon: '🌋',
    cost: 20000, size: { w: 3, h: 3 }, capacity: 1,
    unlockLevel: 75, buildTime: 30,
    description: 'A smoldering volcanic crater where the phoenix is reborn.',
    acceptsAnimals: ['phoenix']
  },
  space: {
    id: 'space', name: 'Space Station', icon: '🚀',
    cost: 80000, size: { w: 4, h: 4 }, capacity: 1,
    unlockLevel: 90, buildTime: 60,
    description: 'An orbital station housing the cosmic dragon among the stars.',
    acceptsAnimals: ['cosmic_dragon']
  }
};
