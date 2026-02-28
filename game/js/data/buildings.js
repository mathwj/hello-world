// Production buildings configuration data - Idle Tycoon Edition
const BUILDINGS_DATA = {
  // ============================================================
  // PRODUCTION BUILDINGS (15)
  // ============================================================
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
        productionTime: 10, sellPrice: 30, xp: 15,
        description: 'Fresh-baked bread. Mmm!'
      },
      cake: {
        id: 'cake', name: 'Cake', icon: '🎂',
        ingredients: { wheat: 2, eggs: 2, sugar: 1 },
        productionTime: 25, sellPrice: 120, xp: 35,
        description: 'A fluffy, delicious cake.'
      },
      muffin: {
        id: 'muffin', name: 'Muffin', icon: '🧁',
        ingredients: { blueberry: 2, wheat: 2, eggs: 1 },
        productionTime: 20, sellPrice: 100, xp: 30,
        description: 'A soft blueberry muffin.'
      },
      croissant: {
        id: 'croissant', name: 'Croissant', icon: '🥐',
        ingredients: { wheat: 3, butter: 2 },
        productionTime: 30, sellPrice: 180, xp: 50,
        description: 'Buttery, flaky croissant.'
      },
      pastry: {
        id: 'pastry', name: 'Pastry', icon: '🥮',
        ingredients: { dough: 2, cinnamon: 1, sugar: 1 },
        productionTime: 35, sellPrice: 250, xp: 65,
        description: 'A sweet cinnamon pastry.'
      },
      pizza: {
        id: 'pizza', name: 'Pizza', icon: '🍕',
        ingredients: { dough: 1, tomato: 1, cheese: 1 },
        productionTime: 30, sellPrice: 200, xp: 55,
        description: 'Classic homemade pizza.'
      },
      gourmet_pizza: {
        id: 'gourmet_pizza', name: 'Gourmet Pizza', icon: '🍕',
        ingredients: { pizza: 1, truffle: 1, olive_oil: 1 },
        productionTime: 45, sellPrice: 600, xp: 120,
        description: 'Truffle-topped gourmet pizza.'
      },
      pie: {
        id: 'pie', name: 'Pie', icon: '🥧',
        ingredients: { apple: 3, wheat: 2, sugar: 1 },
        productionTime: 30, sellPrice: 160, xp: 45,
        description: 'Warm apple pie, just like grandma made.'
      },
      baguette: {
        id: 'baguette', name: 'Baguette', icon: '🥖',
        ingredients: { wheat: 5, butter: 1 },
        productionTime: 20, sellPrice: 140, xp: 40,
        description: 'Crispy French baguette.'
      },
      cinnamon_roll: {
        id: 'cinnamon_roll', name: 'Cinnamon Roll', icon: '🧇',
        ingredients: { dough: 2, cinnamon: 2, sugar: 1, cream: 1 },
        productionTime: 40, sellPrice: 350, xp: 85,
        description: 'Warm, gooey cinnamon roll.'
      },
      wedding_cake: {
        id: 'wedding_cake', name: 'Wedding Cake', icon: '🎂',
        ingredients: { cake: 3, cream: 2, strawberry: 5, vanilla: 1 },
        productionTime: 90, sellPrice: 1500, xp: 300,
        description: 'An extravagant multi-tier wedding cake.'
      },
      dragon_bread: {
        id: 'dragon_bread', name: 'Dragon Bread', icon: '🐉',
        ingredients: { dragon_fruit: 3, cosmic_corn: 5, ember: 2 },
        productionTime: 120, sellPrice: 8000, xp: 1500,
        description: 'Legendary bread forged in dragonfire.'
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
        ingredients: { milk: 3 },
        productionTime: 20, sellPrice: 120, xp: 40,
        description: 'Aged cheese, full of flavor.'
      },
      butter: {
        id: 'butter', name: 'Butter', icon: '🧈',
        ingredients: { milk: 5 },
        productionTime: 15, sellPrice: 90, xp: 30,
        description: 'Creamy, golden butter.'
      },
      cream: {
        id: 'cream', name: 'Cream', icon: '🥛',
        ingredients: { milk: 4 },
        productionTime: 12, sellPrice: 70, xp: 25,
        description: 'Rich, fresh cream.'
      },
      yogurt: {
        id: 'yogurt', name: 'Yogurt', icon: '🥛',
        ingredients: { milk: 3, strawberry: 2 },
        productionTime: 25, sellPrice: 150, xp: 45,
        description: 'Strawberry yogurt, smooth and tangy.'
      },
      smoothie: {
        id: 'smoothie', name: 'Smoothie', icon: '🥤',
        ingredients: { milk: 2, strawberry: 3 },
        productionTime: 18, sellPrice: 150, xp: 40,
        description: 'A creamy strawberry smoothie.'
      },
      ice_cream: {
        id: 'ice_cream', name: 'Ice Cream', icon: '🍦',
        ingredients: { cream: 3, sugar: 2, vanilla: 1 },
        productionTime: 35, sellPrice: 300, xp: 80,
        description: 'Rich, creamy vanilla ice cream.'
      },
      goat_cheese: {
        id: 'goat_cheese', name: 'Goat Cheese', icon: '🧀',
        ingredients: { goat_milk: 3, mint: 1 },
        productionTime: 25, sellPrice: 180, xp: 50,
        description: 'Tangy artisan goat cheese.'
      },
      aged_cheese: {
        id: 'aged_cheese', name: 'Aged Cheese', icon: '🧀',
        ingredients: { cheese: 5 },
        productionTime: 1800, sellPrice: 800, xp: 200,
        description: 'Exquisite cheese aged for 30 minutes!'
      },
      royal_smoothie: {
        id: 'royal_smoothie', name: 'Royal Smoothie', icon: '🥤',
        ingredients: { dragon_fruit: 3, cream: 2, honey: 1 },
        productionTime: 30, sellPrice: 500, xp: 120,
        description: 'A smoothie fit for royalty.'
      },
      cosmic_yogurt: {
        id: 'cosmic_yogurt', name: 'Cosmic Yogurt', icon: '🌌',
        ingredients: { stardust_berry: 3, milk: 2 },
        productionTime: 45, sellPrice: 5000, xp: 800,
        description: 'Yogurt infused with cosmic stardust.'
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
        productionTime: 8, sellPrice: 80, xp: 25,
        description: 'Freshly squeezed OJ!'
      },
      green_juice: {
        id: 'green_juice', name: 'Green Juice', icon: '🥤',
        ingredients: { apple: 2, carrot: 2 },
        productionTime: 10, sellPrice: 100, xp: 35,
        description: 'Healthy and refreshing.'
      },
      lemonade: {
        id: 'lemonade', name: 'Lemonade', icon: '🍋',
        ingredients: { sugarcane: 2, mint: 1 },
        productionTime: 10, sellPrice: 90, xp: 30,
        description: 'Sweet and tangy lemonade.'
      },
      smoothie_berry: {
        id: 'smoothie_berry', name: 'Berry Smoothie', icon: '🥤',
        ingredients: { strawberry: 3, milk: 1 },
        productionTime: 12, sellPrice: 120, xp: 40,
        description: 'A creamy berry delight.'
      },
      tea: {
        id: 'tea', name: 'Tea', icon: '🍵',
        ingredients: { mint: 2, honey: 1 },
        productionTime: 15, sellPrice: 130, xp: 40,
        description: 'Soothing herbal tea.'
      },
      espresso: {
        id: 'espresso', name: 'Espresso', icon: '☕',
        ingredients: { coffee_bean: 3 },
        productionTime: 10, sellPrice: 150, xp: 45,
        description: 'A bold shot of espresso.'
      },
      exotic_smoothie: {
        id: 'exotic_smoothie', name: 'Exotic Smoothie', icon: '🥤',
        ingredients: { dragon_fruit: 2, coconut: 1, cream: 1 },
        productionTime: 20, sellPrice: 400, xp: 100,
        description: 'A tropical exotic blend.'
      },
      cosmic_elixir: {
        id: 'cosmic_elixir', name: 'Cosmic Elixir', icon: '🌌',
        ingredients: { nebula_fruit: 2, stardust_berry: 1, honey: 1 },
        productionTime: 30, sellPrice: 4000, xp: 600,
        description: 'An elixir brewed from nebula fruit.'
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
        ingredients: { sugarcane: 5 },
        productionTime: 8, sellPrice: 90, xp: 30,
        description: 'Sweet, refined sugar.'
      },
      syrup: {
        id: 'syrup', name: 'Syrup', icon: '🍯',
        ingredients: { sugarcane: 8 },
        productionTime: 12, sellPrice: 180, xp: 55,
        description: 'Rich, golden syrup.'
      },
      candy: {
        id: 'candy', name: 'Candy', icon: '🍬',
        ingredients: { sugar: 3, strawberry: 2 },
        productionTime: 15, sellPrice: 200, xp: 60,
        description: 'Sweet strawberry candy.'
      },
      caramel: {
        id: 'caramel', name: 'Caramel', icon: '🍮',
        ingredients: { sugar: 4, cream: 2 },
        productionTime: 20, sellPrice: 280, xp: 70,
        description: 'Smooth, buttery caramel.'
      },
      jam: {
        id: 'jam', name: 'Strawberry Jam', icon: '🫙',
        ingredients: { strawberry: 4, sugar: 2 },
        productionTime: 15, sellPrice: 160, xp: 50,
        description: 'Homemade strawberry jam.'
      }
    }
  },

  textile_mill: {
    id: 'textile_mill', name: 'Textile Mill', icon: '🧵',
    cost: 1000, size: { w: 3, h: 2 }, buildTime: 15,
    unlockLevel: 12, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 400,
    description: 'Weave wool and cotton into fine textiles!',
    recipes: {
      thread: {
        id: 'thread', name: 'Thread', icon: '🧵',
        ingredients: { cotton: 3 },
        productionTime: 8, sellPrice: 100, xp: 35,
        description: 'Strong cotton thread.'
      },
      cloth: {
        id: 'cloth', name: 'Cloth', icon: '🧶',
        ingredients: { wool: 2, thread: 1 },
        productionTime: 12, sellPrice: 140, xp: 45,
        description: 'Fine woven cloth.'
      },
      rope: {
        id: 'rope', name: 'Rope', icon: '🪢',
        ingredients: { cotton: 5 },
        productionTime: 10, sellPrice: 120, xp: 40,
        description: 'Sturdy braided rope.'
      },
      luxury_cloth: {
        id: 'luxury_cloth', name: 'Luxury Cloth', icon: '🎀',
        ingredients: { silk: 2, cloth: 1 },
        productionTime: 25, sellPrice: 500, xp: 120,
        description: 'Exquisite silk-blended fabric.'
      },
      silk_fabric: {
        id: 'silk_fabric', name: 'Silk Fabric', icon: '🪡',
        ingredients: { silk: 3, thread: 2 },
        productionTime: 30, sellPrice: 600, xp: 140,
        description: 'Pure, shimmering silk fabric.'
      }
    }
  },

  tailor: {
    id: 'tailor', name: 'Tailor', icon: '👔',
    cost: 2000, size: { w: 2, h: 2 }, buildTime: 20,
    unlockLevel: 22, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 600,
    description: 'Craft fine garments and accessories!',
    recipes: {
      pillow: {
        id: 'pillow', name: 'Pillow', icon: '🛏️',
        ingredients: { cloth: 2, wool: 3 },
        productionTime: 20, sellPrice: 250, xp: 65,
        description: 'A soft, fluffy pillow.'
      },
      dress: {
        id: 'dress', name: 'Dress', icon: '👗',
        ingredients: { luxury_cloth: 2, thread: 3 },
        productionTime: 40, sellPrice: 800, xp: 180,
        description: 'An elegant designer dress.'
      },
      hat: {
        id: 'hat', name: 'Hat', icon: '🎩',
        ingredients: { cloth: 1, feathers: 3 },
        productionTime: 15, sellPrice: 200, xp: 55,
        description: 'A stylish feathered hat.'
      },
      bag: {
        id: 'bag', name: 'Bag', icon: '👜',
        ingredients: { cloth: 2, rope: 1 },
        productionTime: 20, sellPrice: 300, xp: 75,
        description: 'A handcrafted tote bag.'
      },
      royal_garment: {
        id: 'royal_garment', name: 'Royal Garment', icon: '👘',
        ingredients: { luxury_cloth: 3, silk: 2, gold_bar: 1 },
        productionTime: 60, sellPrice: 2000, xp: 400,
        description: 'A regal garment worthy of a monarch.'
      }
    }
  },

  workshop: {
    id: 'workshop', name: 'Workshop', icon: '🔨',
    cost: 1500, size: { w: 2, h: 2 }, buildTime: 15,
    unlockLevel: 12, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 500,
    description: 'Craft essential goods and ingredients!',
    recipes: {
      flour: {
        id: 'flour', name: 'Flour', icon: '🌾',
        ingredients: { wheat: 5 },
        productionTime: 8, sellPrice: 30, xp: 15,
        description: 'Finely ground wheat flour.'
      },
      dough: {
        id: 'dough', name: 'Dough', icon: '🫓',
        ingredients: { flour: 2, eggs: 1 },
        productionTime: 10, sellPrice: 80, xp: 30,
        description: 'Soft, ready-to-bake dough.'
      },
      chocolate: {
        id: 'chocolate', name: 'Chocolate', icon: '🍫',
        ingredients: { cocoa: 3, sugar: 1, milk: 1 },
        productionTime: 20, sellPrice: 200, xp: 60,
        description: 'Rich, velvety chocolate.'
      },
      olive_oil: {
        id: 'olive_oil', name: 'Olive Oil', icon: '🫒',
        ingredients: { olive: 5 },
        productionTime: 15, sellPrice: 350, xp: 90,
        description: 'Premium cold-pressed olive oil.'
      },
      potion_growth: {
        id: 'potion_growth', name: 'Growth Potion', icon: '🧪',
        ingredients: { mint: 3, honey: 2, lavender: 1 },
        productionTime: 25, sellPrice: 400, xp: 100,
        description: 'A potion that accelerates growth.'
      },
      truffle_oil: {
        id: 'truffle_oil', name: 'Truffle Oil', icon: '🍄',
        ingredients: { truffle: 2, olive_oil: 1 },
        productionTime: 30, sellPrice: 800, xp: 200,
        description: 'Luxurious truffle-infused oil.'
      }
    }
  },

  advanced_kitchen: {
    id: 'advanced_kitchen', name: 'Advanced Kitchen', icon: '👨‍🍳',
    cost: 3000, size: { w: 3, h: 3 }, buildTime: 25,
    unlockLevel: 19, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 800,
    description: 'Prepare gourmet meals with rare ingredients!',
    recipes: {
      pizza_gourmet: {
        id: 'pizza_gourmet', name: 'Gourmet Pizza', icon: '🍕',
        ingredients: { dough: 1, tomato: 2, cheese: 2, olive_oil: 1 },
        productionTime: 30, sellPrice: 350, xp: 90,
        description: 'Wood-fired gourmet pizza.'
      },
      sushi: {
        id: 'sushi', name: 'Sushi', icon: '🍣',
        ingredients: { rice: 3, avocado: 1, fish: 2 },
        productionTime: 25, sellPrice: 450, xp: 110,
        description: 'Fresh, expertly rolled sushi.'
      },
      truffle_pasta: {
        id: 'truffle_pasta', name: 'Truffle Pasta', icon: '🍝',
        ingredients: { dough: 2, truffle: 1, cream: 1, cheese: 1 },
        productionTime: 40, sellPrice: 700, xp: 160,
        description: 'Decadent truffle cream pasta.'
      },
      feast: {
        id: 'feast', name: 'Feast', icon: '🍽️',
        ingredients: { bread: 2, cheese: 2, wine: 1, cake: 1 },
        productionTime: 60, sellPrice: 1200, xp: 280,
        description: 'A grand feast for the whole village.'
      },
      dimensional_feast: {
        id: 'dimensional_feast', name: 'Dimensional Feast', icon: '🌌',
        ingredients: { cosmic_corn: 5, dragon_scale: 1, rainbow_essence: 1 },
        productionTime: 120, sellPrice: 200000, xp: 5000,
        description: 'A reality-bending banquet from another dimension.'
      }
    }
  },

  greenhouse: {
    id: 'greenhouse', name: 'Greenhouse', icon: '🏡',
    cost: 5000, size: { w: 3, h: 3 }, buildTime: 30,
    unlockLevel: 29, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 1000,
    description: 'Grows crops 2x faster in a controlled environment!',
    recipes: {}
  },

  herbalist: {
    id: 'herbalist', name: 'Herbalist', icon: '🌿',
    cost: 4000, size: { w: 2, h: 2 }, buildTime: 25,
    unlockLevel: 31, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 900,
    description: 'Brew herbal remedies and fragrant oils!',
    recipes: {
      tea_blend: {
        id: 'tea_blend', name: 'Tea Blend', icon: '🍵',
        ingredients: { mint: 2, lavender: 2, honey: 1 },
        productionTime: 15, sellPrice: 250, xp: 65,
        description: 'A calming herbal tea blend.'
      },
      essential_oil: {
        id: 'essential_oil', name: 'Essential Oil', icon: '💧',
        ingredients: { lavender: 5, olive: 2 },
        productionTime: 25, sellPrice: 300, xp: 80,
        description: 'Pure lavender essential oil.'
      },
      herbal_remedy: {
        id: 'herbal_remedy', name: 'Herbal Remedy', icon: '🌿',
        ingredients: { mint: 3, ginger: 2, honey: 2 },
        productionTime: 30, sellPrice: 450, xp: 110,
        description: 'A potent herbal healing remedy.'
      },
      perfume_base: {
        id: 'perfume_base', name: 'Perfume Base', icon: '🌸',
        ingredients: { lavender: 5, essential_oil: 2 },
        productionTime: 35, sellPrice: 600, xp: 150,
        description: 'A concentrated perfume base.'
      }
    }
  },

  smelter: {
    id: 'smelter', name: 'Smelter', icon: '⚒️',
    cost: 6000, size: { w: 3, h: 3 }, buildTime: 30,
    unlockLevel: 35, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 1200,
    description: 'Smelt ores into valuable metal bars!',
    recipes: {
      iron_bar: {
        id: 'iron_bar', name: 'Iron Bar', icon: '🔩',
        ingredients: { iron_ore: 3 },
        productionTime: 20, sellPrice: 200, xp: 60,
        description: 'A solid iron bar.'
      },
      gold_bar: {
        id: 'gold_bar', name: 'Gold Bar', icon: '🥇',
        ingredients: { gold_ore: 3 },
        productionTime: 30, sellPrice: 500, xp: 120,
        description: 'A gleaming gold bar.'
      },
      steel: {
        id: 'steel', name: 'Steel', icon: '⚙️',
        ingredients: { iron_bar: 2, coal: 1 },
        productionTime: 25, sellPrice: 350, xp: 90,
        description: 'Hardened steel alloy.'
      },
      alloy: {
        id: 'alloy', name: 'Alloy', icon: '🔗',
        ingredients: { iron_bar: 1, gold_bar: 1 },
        productionTime: 35, sellPrice: 600, xp: 150,
        description: 'A rare iron-gold alloy.'
      }
    }
  },

  blacksmith: {
    id: 'blacksmith', name: 'Blacksmith', icon: '⚔️',
    cost: 8000, size: { w: 3, h: 3 }, buildTime: 35,
    unlockLevel: 36, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 1500,
    description: 'Forge tools, horseshoes, and enchanted items!',
    recipes: {
      horseshoe: {
        id: 'horseshoe', name: 'Horseshoe', icon: '🧲',
        ingredients: { iron_bar: 2 },
        productionTime: 15, sellPrice: 250, xp: 70,
        description: 'A lucky horseshoe.'
      },
      jewelry_base: {
        id: 'jewelry_base', name: 'Jewelry Base', icon: '💍',
        ingredients: { gold_bar: 1, iron_bar: 1 },
        productionTime: 20, sellPrice: 400, xp: 100,
        description: 'A base setting for fine jewelry.'
      },
      steel_tool: {
        id: 'steel_tool', name: 'Steel Tool', icon: '🔧',
        ingredients: { steel: 2 },
        productionTime: 25, sellPrice: 500, xp: 130,
        description: 'A precision-crafted steel tool.'
      },
      enchanted_bar: {
        id: 'enchanted_bar', name: 'Enchanted Bar', icon: '✨',
        ingredients: { alloy: 2, gemstone: 1 },
        productionTime: 40, sellPrice: 1200, xp: 280,
        description: 'An alloy bar imbued with magical energy.'
      }
    }
  },

  jeweler: {
    id: 'jeweler', name: 'Jeweler', icon: '💎',
    cost: 12000, size: { w: 2, h: 2 }, buildTime: 40,
    unlockLevel: 42, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 2000,
    description: 'Craft dazzling jewelry and enchanted gems!',
    recipes: {
      ring: {
        id: 'ring', name: 'Ring', icon: '💍',
        ingredients: { gold_bar: 1, gemstone: 1 },
        productionTime: 20, sellPrice: 800, xp: 200,
        description: 'A beautiful gemstone ring.'
      },
      necklace: {
        id: 'necklace', name: 'Necklace', icon: '📿',
        ingredients: { gold_bar: 2, gemstone: 2 },
        productionTime: 30, sellPrice: 1500, xp: 350,
        description: 'An elegant gemstone necklace.'
      },
      crown: {
        id: 'crown', name: 'Crown', icon: '👑',
        ingredients: { gold_bar: 5, gemstone: 3, diamond: 1 },
        productionTime: 60, sellPrice: 8000, xp: 1500,
        description: 'A magnificent royal crown.'
      },
      enchanted_gem: {
        id: 'enchanted_gem', name: 'Enchanted Gem', icon: '💠',
        ingredients: { gemstone: 3, alloy: 1 },
        productionTime: 35, sellPrice: 1200, xp: 300,
        description: 'A gemstone pulsing with magic.'
      },
      cosmic_jewel: {
        id: 'cosmic_jewel', name: 'Cosmic Jewel', icon: '🌟',
        ingredients: { diamond: 2, stardust_berry: 3, gold_bar: 3 },
        productionTime: 90, sellPrice: 15000, xp: 3000,
        description: 'A jewel that contains a tiny universe.'
      }
    }
  },

  perfumery: {
    id: 'perfumery', name: 'Perfumery', icon: '🌸',
    cost: 15000, size: { w: 2, h: 2 }, buildTime: 35,
    unlockLevel: 48, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 2500,
    description: 'Create exquisite perfumes and fragrances!',
    recipes: {
      perfume: {
        id: 'perfume', name: 'Perfume', icon: '🌹',
        ingredients: { perfume_base: 2, essential_oil: 1, vanilla: 2 },
        productionTime: 30, sellPrice: 1500, xp: 350,
        description: 'A captivating signature perfume.'
      },
      cologne: {
        id: 'cologne', name: 'Cologne', icon: '🧴',
        ingredients: { lavender: 5, mint: 3, essential_oil: 1 },
        productionTime: 25, sellPrice: 1000, xp: 250,
        description: 'A fresh, invigorating cologne.'
      },
      scented_candle: {
        id: 'scented_candle', name: 'Scented Candle', icon: '🕯️',
        ingredients: { beeswax: 2, essential_oil: 1, vanilla: 1 },
        productionTime: 20, sellPrice: 600, xp: 150,
        description: 'A warm, aromatic candle.'
      },
      aromatic_oil: {
        id: 'aromatic_oil', name: 'Aromatic Oil', icon: '💧',
        ingredients: { essential_oil: 3, lavender: 3, mint: 2 },
        productionTime: 35, sellPrice: 800, xp: 200,
        description: 'A complex blend of aromatic oils.'
      }
    }
  },

  candy_factory: {
    id: 'candy_factory', name: 'Candy Factory', icon: '🍭',
    cost: 10000, size: { w: 3, h: 3 }, buildTime: 30,
    unlockLevel: 56, maxSlots: 1, maxUpgradeSlots: 3,
    slotUpgradeCost: 1800,
    description: 'Mass-produce sweets and confections!',
    recipes: {
      chocolate_bar: {
        id: 'chocolate_bar', name: 'Chocolate Bar', icon: '🍫',
        ingredients: { chocolate: 2, sugar: 1 },
        productionTime: 15, sellPrice: 300, xp: 80,
        description: 'A delicious chocolate bar.'
      },
      gummy_bear: {
        id: 'gummy_bear', name: 'Gummy Bear', icon: '🐻',
        ingredients: { sugar: 3, fruit_juice: 2 },
        productionTime: 20, sellPrice: 350, xp: 90,
        description: 'Chewy, fruity gummy bears.'
      },
      lollipop: {
        id: 'lollipop', name: 'Lollipop', icon: '🍭',
        ingredients: { sugar: 5, honey: 1 },
        productionTime: 10, sellPrice: 200, xp: 55,
        description: 'A swirly, colorful lollipop.'
      },
      candy_box: {
        id: 'candy_box', name: 'Candy Box', icon: '🎁',
        ingredients: { chocolate_bar: 2, gummy_bear: 2, lollipop: 2 },
        productionTime: 40, sellPrice: 1500, xp: 350,
        description: 'An assorted box of premium candies.'
      }
    }
  },

  // ============================================================
  // UTILITY BUILDINGS (10) - No recipes
  // ============================================================
  research_lab: {
    id: 'research_lab', name: 'Research Lab', icon: '🔬',
    cost: 2000, size: { w: 2, h: 2 }, buildTime: 15,
    unlockLevel: 10, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Unlock the research tree to discover new technologies!',
    recipes: {}
  },

  market_stand: {
    id: 'market_stand', name: 'Market Stand', icon: '🏪',
    cost: 3000, size: { w: 2, h: 2 }, buildTime: 10,
    unlockLevel: 15, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Passive NPC sales generate coins while you sleep!',
    recipes: {}
  },

  warehouse: {
    id: 'warehouse', name: 'Warehouse', icon: '📦',
    cost: 4000, size: { w: 3, h: 3 }, buildTime: 20,
    unlockLevel: 18, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Extra storage for goods and materials!',
    recipes: {}
  },

  delivery_board: {
    id: 'delivery_board', name: 'Delivery Board', icon: '📋',
    cost: 0, size: { w: 1, h: 1 }, buildTime: 0,
    unlockLevel: 10, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Order fulfillment for coins and XP rewards!',
    recipes: {}
  },

  boat_dock: {
    id: 'boat_dock', name: 'Boat Dock', icon: '🚢',
    cost: 8000, size: { w: 4, h: 3 }, buildTime: 30,
    unlockLevel: 15, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Export orders overseas for big rewards!',
    recipes: {}
  },

  mystery_barn: {
    id: 'mystery_barn', name: 'Mystery Barn', icon: '🎰',
    cost: 5000, size: { w: 2, h: 2 }, buildTime: 15,
    unlockLevel: 10, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Gacha pulls for rare items and surprises!',
    recipes: {}
  },

  museum: {
    id: 'museum', name: 'Museum', icon: '🏛️',
    cost: 3000, size: { w: 3, h: 3 }, buildTime: 20,
    unlockLevel: 21, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Collection display for rare artifacts and treasures!',
    recipes: {}
  },

  fun_barn: {
    id: 'fun_barn', name: 'Fun Barn', icon: '🎪',
    cost: 5000, size: { w: 3, h: 3 }, buildTime: 20,
    unlockLevel: 25, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Mini-games for bonus rewards and fun!',
    recipes: {}
  },

  robotics_lab: {
    id: 'robotics_lab', name: 'Robotics Lab', icon: '🤖',
    cost: 20000, size: { w: 3, h: 3 }, buildTime: 45,
    unlockLevel: 45, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Worker evolution through advanced robotics!',
    recipes: {}
  },

  crystal_forge: {
    id: 'crystal_forge', name: 'Crystal Forge', icon: '🔮',
    cost: 50000, size: { w: 3, h: 3 }, buildTime: 60,
    unlockLevel: 72, maxSlots: 0, maxUpgradeSlots: 0,
    slotUpgradeCost: 0,
    description: 'Artifact enchanting with mystical crystals!',
    recipes: {}
  }
};

// Building Evolution Tiers (6-tier for production buildings)
const BUILDING_EVOLUTION_TIERS = {
  bakery: [
    { tier: 1, name: 'Bakery', icon: '🏪', speedMult: 1, valueMult: 1, desc: 'A humble bakery.' },
    { tier: 2, name: 'Artisan Bakery', icon: '🥖', speedMult: 1.5, valueMult: 2, desc: 'Artisan-quality baked goods.' },
    { tier: 3, name: 'Patisserie', icon: '🎂', speedMult: 2, valueMult: 5, desc: 'Fine French pastries.' },
    { tier: 4, name: 'Grand Bakehouse', icon: '🏰', speedMult: 3, valueMult: 15, desc: 'A massive baking operation.' },
    { tier: 5, name: 'Enchanted Oven', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Magically enhanced baking.' },
    { tier: 6, name: 'Cosmic Bakery', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Bakes goods from stardust.' }
  ],
  dairy: [
    { tier: 1, name: 'Dairy', icon: '🏭', speedMult: 1, valueMult: 1, desc: 'A basic dairy factory.' },
    { tier: 2, name: 'Creamery', icon: '🧈', speedMult: 1.5, valueMult: 2, desc: 'Premium cream products.' },
    { tier: 3, name: 'Fromagerie', icon: '🧀', speedMult: 2, valueMult: 5, desc: 'Aged luxury cheeses.' },
    { tier: 4, name: 'Crystal Dairy', icon: '💎', speedMult: 3, valueMult: 15, desc: 'Crystal-infused dairy.' },
    { tier: 5, name: 'Enchanted Dairy', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Magically enhanced dairy.' },
    { tier: 6, name: 'Cosmic Dairy', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Dairy from the stars.' }
  ],
  juice_bar: [
    { tier: 1, name: 'Juice Bar', icon: '🧃', speedMult: 1, valueMult: 1, desc: 'A simple juice bar.' },
    { tier: 2, name: 'Smoothie Shop', icon: '🥤', speedMult: 1.5, valueMult: 2, desc: 'Premium smoothies and juices.' },
    { tier: 3, name: 'Elixir Lab', icon: '🧪', speedMult: 2, valueMult: 5, desc: 'Brews magical elixirs.' },
    { tier: 4, name: 'Potion Works', icon: '🔮', speedMult: 3, valueMult: 15, desc: 'Powerful potion production.' },
    { tier: 5, name: 'Alchemist Tower', icon: '🗼', speedMult: 5, valueMult: 50, desc: 'Transmutes ingredients into gold.' },
    { tier: 6, name: 'Cosmic Brewery', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Brews cosmic energy drinks.' }
  ],
  sugar_mill: [
    { tier: 1, name: 'Sugar Mill', icon: '🏗️', speedMult: 1, valueMult: 1, desc: 'A basic sugar mill.' },
    { tier: 2, name: 'Sweet Refinery', icon: '🍬', speedMult: 1.5, valueMult: 2, desc: 'Makes sweet confections.' },
    { tier: 3, name: 'Confectionery', icon: '🍫', speedMult: 2, valueMult: 5, desc: 'Artisan candy crafting.' },
    { tier: 4, name: 'Crystal Refinery', icon: '💎', speedMult: 3, valueMult: 15, desc: 'Refines sugar into crystals.' },
    { tier: 5, name: 'Enchanted Mill', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Magical sugar processing.' },
    { tier: 6, name: 'Cosmic Refinery', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Refines cosmic sweetness.' }
  ],
  textile_mill: [
    { tier: 1, name: 'Textile Mill', icon: '🧵', speedMult: 1, valueMult: 1, desc: 'A basic textile mill.' },
    { tier: 2, name: 'Loom Works', icon: '🧶', speedMult: 1.5, valueMult: 2, desc: 'Advanced loom technology.' },
    { tier: 3, name: 'Silk Factory', icon: '🎀', speedMult: 2, valueMult: 5, desc: 'Produces fine silk.' },
    { tier: 4, name: 'Enchanted Loom', icon: '✨', speedMult: 3, valueMult: 15, desc: 'Weaves magical fabrics.' },
    { tier: 5, name: 'Mythril Weaver', icon: '⚔️', speedMult: 5, valueMult: 50, desc: 'Weaves mythril thread.' },
    { tier: 6, name: 'Cosmic Weaver', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Weaves fabric from starlight.' }
  ],
  tailor: [
    { tier: 1, name: 'Tailor', icon: '👔', speedMult: 1, valueMult: 1, desc: 'A modest tailor shop.' },
    { tier: 2, name: 'Fashion Studio', icon: '👗', speedMult: 1.5, valueMult: 2, desc: 'Trendy fashion designs.' },
    { tier: 3, name: 'Couture House', icon: '🎭', speedMult: 2, valueMult: 5, desc: 'High-end couture fashion.' },
    { tier: 4, name: 'Royal Atelier', icon: '👑', speedMult: 3, valueMult: 15, desc: 'Garments fit for royalty.' },
    { tier: 5, name: 'Enchanted Tailor', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Weaves enchantments into cloth.' },
    { tier: 6, name: 'Cosmic Couturier', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Designs outfits from nebulae.' }
  ],
  workshop: [
    { tier: 1, name: 'Workshop', icon: '🔨', speedMult: 1, valueMult: 1, desc: 'A basic workshop.' },
    { tier: 2, name: 'Craftsman Studio', icon: '🪚', speedMult: 1.5, valueMult: 2, desc: 'Skilled craftsmanship.' },
    { tier: 3, name: 'Master Workshop', icon: '⚙️', speedMult: 2, valueMult: 5, desc: 'Master-level crafting.' },
    { tier: 4, name: 'Arcane Workshop', icon: '🔮', speedMult: 3, valueMult: 15, desc: 'Infuses magic into crafts.' },
    { tier: 5, name: 'Mythical Forge', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Forges mythical creations.' },
    { tier: 6, name: 'Cosmic Workshop', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Crafts with cosmic materials.' }
  ],
  advanced_kitchen: [
    { tier: 1, name: 'Advanced Kitchen', icon: '👨‍🍳', speedMult: 1, valueMult: 1, desc: 'A professional kitchen.' },
    { tier: 2, name: 'Chef Studio', icon: '🍳', speedMult: 1.5, valueMult: 2, desc: 'A chef-grade kitchen.' },
    { tier: 3, name: 'Gourmet Kitchen', icon: '🍽️', speedMult: 2, valueMult: 5, desc: 'Michelin-star quality.' },
    { tier: 4, name: 'Royal Kitchen', icon: '👑', speedMult: 3, valueMult: 15, desc: 'Cooks for kings and queens.' },
    { tier: 5, name: 'Enchanted Kitchen', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Meals cook themselves.' },
    { tier: 6, name: 'Cosmic Kitchen', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Prepares interdimensional cuisine.' }
  ],
  greenhouse: [
    { tier: 1, name: 'Greenhouse', icon: '🏡', speedMult: 1, valueMult: 1, desc: 'A basic greenhouse.' },
    { tier: 2, name: 'Garden Dome', icon: '🌱', speedMult: 1.5, valueMult: 2, desc: 'Improved growing conditions.' },
    { tier: 3, name: 'Botanical Garden', icon: '🌿', speedMult: 2, valueMult: 5, desc: 'Rare plant cultivation.' },
    { tier: 4, name: 'Enchanted Grove', icon: '🌳', speedMult: 3, valueMult: 15, desc: 'Magically accelerated growth.' },
    { tier: 5, name: 'Worldtree Nursery', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Grows legendary plants.' },
    { tier: 6, name: 'Cosmic Biome', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Cultivates alien flora.' }
  ],
  herbalist: [
    { tier: 1, name: 'Herbalist', icon: '🌿', speedMult: 1, valueMult: 1, desc: 'A simple herbalist hut.' },
    { tier: 2, name: 'Apothecary', icon: '🧴', speedMult: 1.5, valueMult: 2, desc: 'Professional herbal remedies.' },
    { tier: 3, name: 'Alchemist Lab', icon: '🧪', speedMult: 2, valueMult: 5, desc: 'Advanced herbal alchemy.' },
    { tier: 4, name: 'Druid Circle', icon: '🍀', speedMult: 3, valueMult: 15, desc: 'Ancient druidic knowledge.' },
    { tier: 5, name: 'Enchanted Garden', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Herbs grow with magic.' },
    { tier: 6, name: 'Cosmic Herbarium', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Cultivates cosmic herbs.' }
  ],
  smelter: [
    { tier: 1, name: 'Smelter', icon: '⚒️', speedMult: 1, valueMult: 1, desc: 'A basic ore smelter.' },
    { tier: 2, name: 'Foundry', icon: '🔥', speedMult: 1.5, valueMult: 2, desc: 'Industrial-grade smelting.' },
    { tier: 3, name: 'Blast Furnace', icon: '🌋', speedMult: 2, valueMult: 5, desc: 'Extreme-heat processing.' },
    { tier: 4, name: 'Arcane Forge', icon: '🔮', speedMult: 3, valueMult: 15, desc: 'Magic-enhanced smelting.' },
    { tier: 5, name: 'Dragon Forge', icon: '🐉', speedMult: 5, valueMult: 50, desc: 'Heated by dragonfire.' },
    { tier: 6, name: 'Cosmic Smelter', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Smelts with stellar plasma.' }
  ],
  blacksmith: [
    { tier: 1, name: 'Blacksmith', icon: '⚔️', speedMult: 1, valueMult: 1, desc: 'A basic blacksmith shop.' },
    { tier: 2, name: 'Armory', icon: '🛡️', speedMult: 1.5, valueMult: 2, desc: 'Professional arms crafting.' },
    { tier: 3, name: 'Master Smithy', icon: '🔨', speedMult: 2, valueMult: 5, desc: 'Master-forged equipment.' },
    { tier: 4, name: 'Runic Forge', icon: '🔮', speedMult: 3, valueMult: 15, desc: 'Inscribes runes into metal.' },
    { tier: 5, name: 'Legendary Anvil', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Forges legendary weapons.' },
    { tier: 6, name: 'Cosmic Smithy', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Forges with cosmic ore.' }
  ],
  jeweler: [
    { tier: 1, name: 'Jeweler', icon: '💎', speedMult: 1, valueMult: 1, desc: 'A modest jeweler shop.' },
    { tier: 2, name: 'Gem Cutter', icon: '💠', speedMult: 1.5, valueMult: 2, desc: 'Precision gem cutting.' },
    { tier: 3, name: 'Royal Jeweler', icon: '👑', speedMult: 2, valueMult: 5, desc: 'Jewels fit for royalty.' },
    { tier: 4, name: 'Enchanted Jeweler', icon: '🔮', speedMult: 3, valueMult: 15, desc: 'Enchants gems with power.' },
    { tier: 5, name: 'Mythic Lapidary', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Cuts mythical gemstones.' },
    { tier: 6, name: 'Cosmic Jeweler', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Crafts jewels from starlight.' }
  ],
  perfumery: [
    { tier: 1, name: 'Perfumery', icon: '🌸', speedMult: 1, valueMult: 1, desc: 'A quaint perfume shop.' },
    { tier: 2, name: 'Fragrance House', icon: '🌹', speedMult: 1.5, valueMult: 2, desc: 'Designer fragrances.' },
    { tier: 3, name: 'Essence Studio', icon: '🧴', speedMult: 2, valueMult: 5, desc: 'Rare essence extraction.' },
    { tier: 4, name: 'Enchanted Distillery', icon: '🔮', speedMult: 3, valueMult: 15, desc: 'Distills magical scents.' },
    { tier: 5, name: 'Ethereal Perfumery', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Captures ethereal aromas.' },
    { tier: 6, name: 'Cosmic Perfumery', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Bottles the scent of nebulae.' }
  ],
  candy_factory: [
    { tier: 1, name: 'Candy Factory', icon: '🍭', speedMult: 1, valueMult: 1, desc: 'A small candy factory.' },
    { tier: 2, name: 'Sweet Shop', icon: '🍬', speedMult: 1.5, valueMult: 2, desc: 'Artisan sweets and treats.' },
    { tier: 3, name: 'Chocolate Works', icon: '🍫', speedMult: 2, valueMult: 5, desc: 'Premium chocolate production.' },
    { tier: 4, name: 'Enchanted Confectionery', icon: '🔮', speedMult: 3, valueMult: 15, desc: 'Magically delicious candy.' },
    { tier: 5, name: 'Wonka Factory', icon: '✨', speedMult: 5, valueMult: 50, desc: 'Pure imagination in candy form.' },
    { tier: 6, name: 'Cosmic Candy Lab', icon: '🌌', speedMult: 10, valueMult: 200, desc: 'Candy made from stardust.' }
  ]
};
