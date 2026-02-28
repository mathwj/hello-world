// Production buildings configuration data
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
        productionTime: 10, sellPrice: 120, xp: 40,
        description: 'Aged cheese, full of flavor.'
      },
      butter: {
        id: 'butter', name: 'Butter', icon: '🧈',
        ingredients: { milk: 3 },
        productionTime: 8, sellPrice: 100, xp: 30,
        description: 'Creamy, golden butter.'
      },
      yogurt: {
        id: 'yogurt', name: 'Yogurt', icon: '🥛',
        ingredients: { milk: 1, strawberry: 2 },
        productionTime: 7, sellPrice: 150, xp: 45,
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
        productionTime: 10, sellPrice: 140, xp: 45,
        description: 'Fine woven cloth.'
      },
      thread: {
        id: 'thread', name: 'Thread', icon: '🧵',
        ingredients: { cotton: 3 },
        productionTime: 8, sellPrice: 100, xp: 35,
        description: 'Strong cotton thread.'
      },
      blanket: {
        id: 'blanket', name: 'Blanket', icon: '🛏️',
        ingredients: { wool: 3, cotton: 2 },
        productionTime: 15, sellPrice: 250, xp: 70,
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
        productionTime: 8, sellPrice: 90, xp: 30,
        description: 'Sweet, refined sugar.'
      },
      jam: {
        id: 'jam', name: 'Strawberry Jam', icon: '🫙',
        ingredients: { strawberry: 4, corn: 2 },
        productionTime: 10, sellPrice: 160, xp: 50,
        description: 'Homemade strawberry jam.'
      },
      syrup: {
        id: 'syrup', name: 'Maple Syrup', icon: '🍯',
        ingredients: { corn: 8 },
        productionTime: 12, sellPrice: 180, xp: 55,
        description: 'Rich, golden syrup.'
      }
    }
  }
};
