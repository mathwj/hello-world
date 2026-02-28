// Production buildings configuration data - Idle Tycoon Edition
const BUILDINGS_DATA = {
  bakery: {
    id: 'bakery', name: 'Bakery', icon: '🏪',
    cost: 500, size: { w: 2, h: 2 }, buildTime: 5,
    unlockLevel: 4, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 200,
    description: 'Bake delicious goods from your crops!',
    recipes: {
      bread: {
        id: 'bread', name: 'Bread', icon: '🍞',
        ingredients: { wheat: 3 },
        productionTime: 5, sellPrice: 30, xp: 15,
        description: 'Fresh-baked bread. Mmm!'
      },
      cake: {
        id: 'cake', name: 'Cake', icon: '🎂',
        ingredients: { wheat: 5, eggs: 2 },
        productionTime: 10, sellPrice: 80, xp: 35,
        description: 'A fluffy, delicious cake.'
      },
      cookie: {
        id: 'cookie', name: 'Cookie', icon: '🍪',
        ingredients: { wheat: 2, eggs: 1 },
        productionTime: 3, sellPrice: 25, xp: 12,
        description: 'Crunchy cookies, fresh from the oven.'
      }
    }
  },
  juice_bar: {
    id: 'juice_bar', name: 'Juice Bar', icon: '🧃',
    cost: 600, size: { w: 2, h: 2 }, buildTime: 5,
    unlockLevel: 6, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 250,
    description: 'Squeeze fresh juices and smoothies!',
    recipes: {
      orange_juice: {
        id: 'orange_juice', name: 'Orange Juice', icon: '🧃',
        ingredients: { orange: 3 },
        productionTime: 4, sellPrice: 80, xp: 25,
        description: 'Freshly squeezed OJ!'
      },
      green_juice: {
        id: 'green_juice', name: 'Green Juice', icon: '🥤',
        ingredients: { apple: 2, carrot: 2 },
        productionTime: 6, sellPrice: 100, xp: 35,
        description: 'Healthy and refreshing.'
      },
      smoothie: {
        id: 'smoothie', name: 'Berry Smoothie', icon: '🥤',
        ingredients: { strawberry: 3, milk: 1 },
        productionTime: 5, sellPrice: 120, xp: 40,
        description: 'A creamy berry delight.'
      }
    }
  },
  dairy: {
    id: 'dairy', name: 'Dairy', icon: '🏭',
    cost: 800, size: { w: 2, h: 2 }, buildTime: 10,
    unlockLevel: 8, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 300,
    description: 'Turn milk into cheese and more!',
    recipes: {
      cheese: {
        id: 'cheese', name: 'Cheese', icon: '🧀',
        ingredients: { milk: 2 },
        productionTime: 8, sellPrice: 120, xp: 40,
        description: 'Aged cheese, full of flavor.'
      },
      butter: {
        id: 'butter', name: 'Butter', icon: '🧈',
        ingredients: { milk: 3 },
        productionTime: 6, sellPrice: 100, xp: 30,
        description: 'Creamy, golden butter.'
      },
      yogurt: {
        id: 'yogurt', name: 'Yogurt', icon: '🥛',
        ingredients: { milk: 1, strawberry: 2 },
        productionTime: 5, sellPrice: 150, xp: 45,
        description: 'Strawberry yogurt, smooth and tangy.'
      }
    }
  },
  textile_mill: {
    id: 'textile_mill', name: 'Textile Mill', icon: '🏭',
    cost: 1000, size: { w: 3, h: 2 }, buildTime: 15,
    unlockLevel: 12, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 400,
    description: 'Weave wool and cotton into fine textiles!',
    recipes: {
      cloth: {
        id: 'cloth', name: 'Cloth', icon: '🧵',
        ingredients: { wool: 2 },
        productionTime: 8, sellPrice: 140, xp: 45,
        description: 'Fine woven cloth.'
      },
      thread: {
        id: 'thread', name: 'Thread', icon: '🧵',
        ingredients: { cotton: 3 },
        productionTime: 6, sellPrice: 100, xp: 35,
        description: 'Strong cotton thread.'
      },
      blanket: {
        id: 'blanket', name: 'Blanket', icon: '🛏️',
        ingredients: { wool: 3, cotton: 2 },
        productionTime: 12, sellPrice: 250, xp: 70,
        description: 'A warm, cozy blanket.'
      }
    }
  },
  sugar_mill: {
    id: 'sugar_mill', name: 'Sugar Mill', icon: '🏗️',
    cost: 1200, size: { w: 2, h: 2 }, buildTime: 10,
    unlockLevel: 14, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 350,
    description: 'Process crops into sweet sugar!',
    recipes: {
      sugar: {
        id: 'sugar', name: 'Sugar', icon: '🍬',
        ingredients: { corn: 5 },
        productionTime: 6, sellPrice: 90, xp: 30,
        description: 'Sweet, refined sugar.'
      },
      jam: {
        id: 'jam', name: 'Strawberry Jam', icon: '🫙',
        ingredients: { strawberry: 4, corn: 2 },
        productionTime: 8, sellPrice: 160, xp: 50,
        description: 'Homemade strawberry jam.'
      },
      syrup: {
        id: 'syrup', name: 'Maple Syrup', icon: '🍯',
        ingredients: { corn: 8 },
        productionTime: 10, sellPrice: 180, xp: 55,
        description: 'Rich, golden syrup.'
      }
    }
  }
};

// Building Evolution Tiers (6-tier for buildings)
const BUILDING_EVOLUTION_TIERS = {
  bakery: [
    { tier: 1, name: 'Bakery', icon: '🏪', speedMult: 1, valueMult: 1, desc: 'A humble bakery.' },
    { tier: 2, name: 'Artisan Bakery', icon: '🥖', speedMult: 1.5, valueMult: 2, desc: 'Artisan-quality baked goods.' },
    { tier: 3, name: 'Patisserie', icon: '🎂', speedMult: 2, valueMult: 5, desc: 'Fine French pastries.' },
    { tier: 4, name: 'Grand Bakehouse', icon: '🏰', speedMult: 3, valueMult: 15, desc: 'A massive baking operation.' },
    { tier: 5, name: 'Enchanted Oven', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Magically enhanced baking.' },
    { tier: 6, name: 'Cosmic Bakery', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Bakes goods from stardust.' }
  ],
  juice_bar: [
    { tier: 1, name: 'Juice Bar', icon: '🧃', speedMult: 1, valueMult: 1, desc: 'A simple juice bar.' },
    { tier: 2, name: 'Smoothie Shop', icon: '🥤', speedMult: 1.5, valueMult: 2, desc: 'Premium smoothies and juices.' },
    { tier: 3, name: 'Elixir Lab', icon: '🧪', speedMult: 2, valueMult: 5, desc: 'Brews magical elixirs.' },
    { tier: 4, name: 'Potion Works', icon: '🔮', speedMult: 3, valueMult: 15, desc: 'Powerful potion production.' },
    { tier: 5, name: 'Alchemist Tower', icon: '🗼', speedMult: 5, valueMult: 50, desc: 'Transmutes ingredients into gold.' },
    { tier: 6, name: 'Cosmic Brewery', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Brews cosmic energy drinks.' }
  ],
  dairy: [
    { tier: 1, name: 'Dairy', icon: '🏭', speedMult: 1, valueMult: 1, desc: 'A basic dairy factory.' },
    { tier: 2, name: 'Creamery', icon: '🧈', speedMult: 1.5, valueMult: 2, desc: 'Premium cream products.' },
    { tier: 3, name: 'Fromagerie', icon: '🧀', speedMult: 2, valueMult: 5, desc: 'Aged luxury cheeses.' },
    { tier: 4, name: 'Crystal Dairy', icon: '💎', speedMult: 3, valueMult: 15, desc: 'Crystal-infused dairy.' },
    { tier: 5, name: 'Enchanted Dairy', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Magically enhanced dairy.' },
    { tier: 6, name: 'Cosmic Dairy', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Dairy from the stars.' }
  ],
  textile_mill: [
    { tier: 1, name: 'Textile Mill', icon: '🏭', speedMult: 1, valueMult: 1, desc: 'A basic textile mill.' },
    { tier: 2, name: 'Loom Works', icon: '🧶', speedMult: 1.5, valueMult: 2, desc: 'Advanced loom technology.' },
    { tier: 3, name: 'Silk Factory', icon: '🎀', speedMult: 2, valueMult: 5, desc: 'Produces fine silk.' },
    { tier: 4, name: 'Enchanted Loom', icon: '✨', speedMult: 3, valueMult: 15, desc: 'Weaves magical fabrics.' },
    { tier: 5, name: 'Mythril Weaver', icon: '⚔️', speedMult: 5, valueMult: 50, desc: 'Weaves mythril thread.' },
    { tier: 6, name: 'Cosmic Weaver', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Weaves fabric from starlight.' }
  ],
  sugar_mill: [
    { tier: 1, name: 'Sugar Mill', icon: '🏗️', speedMult: 1, valueMult: 1, desc: 'A basic sugar mill.' },
    { tier: 2, name: 'Candy Factory', icon: '🍬', speedMult: 1.5, valueMult: 2, desc: 'Makes sweet confections.' },
    { tier: 3, name: 'Confectionery', icon: '🍫', speedMult: 2, valueMult: 5, desc: 'Artisan candy crafting.' },
    { tier: 4, name: 'Crystal Refinery', icon: '💎', speedMult: 3, valueMult: 15, desc: 'Refines sugar into crystals.' },
    { tier: 5, name: 'Enchanted Mill', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Magical sugar processing.' },
    { tier: 6, name: 'Cosmic Refinery', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Refines cosmic sweetness.' }
  ]
};
