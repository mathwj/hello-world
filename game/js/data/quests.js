// Quest configuration data
const QUESTS_DATA = {
  // ==================== TUTORIAL QUESTS ====================
  tutorial_plant: {
    id: 'tutorial_plant', type: 'tutorial', order: 1,
    title: 'Green Thumb', npc: 'Mayor Oak',
    dialogue: 'Welcome to your new farm! Let\'s start by planting some wheat. Click a plowed plot and select wheat from the seed menu!',
    objectives: [{ type: 'plant', target: 'wheat', count: 3, label: 'Plant 3 Wheat' }],
    rewards: { coins: 20, xp: 15 },
    nextQuest: 'tutorial_harvest'
  },
  tutorial_harvest: {
    id: 'tutorial_harvest', type: 'tutorial', order: 2,
    title: 'Reap What You Sow', npc: 'Mayor Oak',
    dialogue: 'Your wheat is ready! Click on the golden crops to harvest them. They\'ll go straight to your barn.',
    objectives: [{ type: 'harvest', target: 'wheat', count: 3, label: 'Harvest 3 Wheat' }],
    rewards: { coins: 30, xp: 20 },
    nextQuest: 'tutorial_sell'
  },
  tutorial_sell: {
    id: 'tutorial_sell', type: 'tutorial', order: 3,
    title: 'Market Day', npc: 'Mayor Oak',
    dialogue: 'Great harvest! Now open your barn and sell some wheat to earn coins. You\'ll need them to grow your farm!',
    objectives: [{ type: 'sell', target: 'any', count: 3, label: 'Sell 3 items' }],
    rewards: { coins: 25, xp: 20 },
    nextQuest: 'tutorial_buy_crop'
  },
  tutorial_buy_crop: {
    id: 'tutorial_buy_crop', type: 'tutorial', order: 4,
    title: 'Variety is the Spice', npc: 'Mayor Oak',
    dialogue: 'Now try planting different crops! Open the shop and buy some corn seeds. Variety keeps the farm interesting.',
    objectives: [{ type: 'plant', target: 'corn', count: 2, label: 'Plant 2 Corn' }],
    rewards: { coins: 30, xp: 25 },
    nextQuest: 'tutorial_level_up'
  },
  tutorial_level_up: {
    id: 'tutorial_level_up', type: 'tutorial', order: 5,
    title: 'Rising Star', npc: 'Mayor Oak',
    dialogue: 'You\'re doing amazing! Keep planting and harvesting to earn XP and reach Level 2!',
    objectives: [{ type: 'reach_level', target: 2, count: 1, label: 'Reach Level 2' }],
    rewards: { coins: 50, xp: 0, gems: 1 },
    nextQuest: 'tutorial_chicken'
  },
  tutorial_chicken: {
    id: 'tutorial_chicken', type: 'tutorial', order: 6,
    title: 'Feathered Friends', npc: 'Farmer Betty',
    dialogue: 'Now you can raise animals! Build a Chicken Coop and buy your first chicken. Feed it corn to get eggs!',
    objectives: [
      { type: 'build', target: 'coop', count: 1, label: 'Build a Chicken Coop' },
      { type: 'buy_animal', target: 'chicken', count: 1, label: 'Buy a Chicken' }
    ],
    rewards: { coins: 80, xp: 40 },
    nextQuest: 'tutorial_feed'
  },
  tutorial_feed: {
    id: 'tutorial_feed', type: 'tutorial', order: 7,
    title: 'Feeding Time', npc: 'Farmer Betty',
    dialogue: 'Your chicken looks hungry! Feed it some corn from your barn. After eating, it\'ll start producing eggs!',
    objectives: [{ type: 'feed_animal', target: 'chicken', count: 1, label: 'Feed a Chicken' }],
    rewards: { coins: 40, xp: 30 },
    nextQuest: 'tutorial_collect'
  },
  tutorial_collect: {
    id: 'tutorial_collect', type: 'tutorial', order: 8,
    title: 'Egg-cellent!', npc: 'Farmer Betty',
    dialogue: 'Your chicken laid some eggs! Tap on it to collect them. Animal products are very valuable!',
    objectives: [{ type: 'collect_product', target: 'eggs', count: 1, label: 'Collect Eggs' }],
    rewards: { coins: 50, xp: 35 },
    nextQuest: 'tutorial_bakery'
  },
  tutorial_bakery: {
    id: 'tutorial_bakery', type: 'tutorial', order: 9,
    title: 'Baker\'s Dozen', npc: 'Chef Pierre',
    dialogue: 'Bonjour! Build a Bakery and let me show you how to turn wheat into delicious bread! Processed goods sell for more!',
    objectives: [{ type: 'build', target: 'bakery', count: 1, label: 'Build a Bakery' }],
    rewards: { coins: 100, xp: 50 },
    nextQuest: 'tutorial_produce'
  },
  tutorial_produce: {
    id: 'tutorial_produce', type: 'tutorial', order: 10,
    title: 'Fresh From the Oven', npc: 'Chef Pierre',
    dialogue: 'Magnifique! Now use your bakery to make some bread. Select the bread recipe and add wheat from your barn!',
    objectives: [{ type: 'produce', target: 'bread', count: 1, label: 'Produce 1 Bread' }],
    rewards: { coins: 60, xp: 40, gems: 2 },
    nextQuest: null
  },

  // ==================== MAIN STORY QUESTS ====================
  main_town_supply: {
    id: 'main_town_supply', type: 'main', order: 1, requiredLevel: 3,
    title: 'Town Supply Run', npc: 'Mayor Oak',
    dialogue: 'The town market needs fresh produce! Can you deliver wheat and corn to keep the townspeople fed?',
    objectives: [
      { type: 'sell', target: 'wheat', count: 10, label: 'Sell 10 Wheat' },
      { type: 'sell', target: 'corn', count: 5, label: 'Sell 5 Corn' }
    ],
    rewards: { coins: 100, xp: 60 },
    nextQuest: 'main_bakery_order'
  },
  main_bakery_order: {
    id: 'main_bakery_order', type: 'main', order: 2, requiredLevel: 4,
    title: 'The Bakery Order', npc: 'Chef Pierre',
    dialogue: 'The town bakery needs bread! Produce 5 loaves to fill the order.',
    objectives: [{ type: 'produce', target: 'bread', count: 5, label: 'Produce 5 Bread' }],
    rewards: { coins: 200, xp: 100 },
    nextQuest: 'main_animal_farm'
  },
  main_animal_farm: {
    id: 'main_animal_farm', type: 'main', order: 3, requiredLevel: 5,
    title: 'Animal Farm', npc: 'Farmer Betty',
    dialogue: 'Your farm needs more animals! Build a barn and get a goat for fresh milk!',
    objectives: [
      { type: 'build', target: 'barn', count: 1, label: 'Build a Barn' },
      { type: 'buy_animal', target: 'goat', count: 1, label: 'Buy a Goat' }
    ],
    rewards: { coins: 250, xp: 120, gems: 1 },
    nextQuest: 'main_harvest_fest'
  },
  main_harvest_fest: {
    id: 'main_harvest_fest', type: 'main', order: 4, requiredLevel: 7,
    title: 'Harvest Festival', npc: 'Mayor Oak',
    dialogue: 'The annual Harvest Festival is coming! We need lots of different crops. Can you help?',
    objectives: [
      { type: 'harvest', target: 'carrot', count: 10, label: 'Harvest 10 Carrots' },
      { type: 'harvest', target: 'tomato', count: 8, label: 'Harvest 8 Tomatoes' },
      { type: 'harvest', target: 'corn', count: 15, label: 'Harvest 15 Corn' }
    ],
    rewards: { coins: 400, xp: 200, gems: 2 },
    nextQuest: 'main_dairy_dreams'
  },
  main_dairy_dreams: {
    id: 'main_dairy_dreams', type: 'main', order: 5, requiredLevel: 8,
    title: 'Dairy Dreams', npc: 'Chef Pierre',
    dialogue: 'The town wants cheese! Build a dairy and start producing this golden delight.',
    objectives: [
      { type: 'build', target: 'dairy', count: 1, label: 'Build a Dairy' },
      { type: 'produce', target: 'cheese', count: 3, label: 'Produce 3 Cheese' }
    ],
    rewards: { coins: 500, xp: 250 },
    nextQuest: 'main_orchard'
  },
  main_orchard: {
    id: 'main_orchard', type: 'main', order: 6, requiredLevel: 10,
    title: 'Orchard Dreams', npc: 'Farmer Betty',
    dialogue: 'It\'s time to plant some fruit trees! Orchards are a great long-term investment.',
    objectives: [
      { type: 'plant_tree', target: 'apple', count: 2, label: 'Plant 2 Apple Trees' },
      { type: 'harvest_tree', target: 'apple', count: 3, label: 'Harvest 3 Apples' }
    ],
    rewards: { coins: 300, xp: 180, gems: 2 },
    nextQuest: 'main_expand'
  },
  main_expand: {
    id: 'main_expand', type: 'main', order: 7, requiredLevel: 10,
    title: 'Growing Pains', npc: 'Mayor Oak',
    dialogue: 'Your farm is thriving! It\'s time to expand. Purchase a new land plot to make room for more!',
    objectives: [{ type: 'expand_land', target: 'any', count: 1, label: 'Expand your farm once' }],
    rewards: { coins: 500, xp: 300, gems: 3 },
    nextQuest: 'main_big_farm'
  },
  main_big_farm: {
    id: 'main_big_farm', type: 'main', order: 8, requiredLevel: 12,
    title: 'The Big Farm', npc: 'Mayor Oak',
    dialogue: 'You\'re becoming a farming legend! Build a pigsty and raise some pigs for their truffle-hunting skills!',
    objectives: [
      { type: 'build', target: 'pigsty', count: 1, label: 'Build a Pigsty' },
      { type: 'buy_animal', target: 'pig', count: 1, label: 'Buy a Pig' }
    ],
    rewards: { coins: 600, xp: 350, gems: 2 },
    nextQuest: 'main_textile'
  },
  main_textile: {
    id: 'main_textile', type: 'main', order: 9, requiredLevel: 14,
    title: 'Textile Tycoon', npc: 'Chef Pierre',
    dialogue: 'The town needs fabrics! Build a textile mill and produce cloth from wool.',
    objectives: [
      { type: 'build', target: 'textile_mill', count: 1, label: 'Build a Textile Mill' },
      { type: 'produce', target: 'cloth', count: 3, label: 'Produce 3 Cloth' }
    ],
    rewards: { coins: 800, xp: 400, gems: 3 },
    nextQuest: 'main_master'
  },
  main_master: {
    id: 'main_master', type: 'main', order: 10, requiredLevel: 20,
    title: 'Master Farmer', npc: 'Mayor Oak',
    dialogue: 'You\'ve done it! You\'re the most accomplished farmer in the valley. Keep growing!',
    objectives: [
      { type: 'reach_level', target: 20, count: 1, label: 'Reach Level 20' },
      { type: 'expand_land', target: 'any', count: 3, label: 'Expand farm 3 times total' }
    ],
    rewards: { coins: 2000, xp: 1000, gems: 10 },
    nextQuest: null
  },

  // ==================== DAILY QUEST TEMPLATES ====================
  // These are templates; the actual daily quests are generated from these
};

const DAILY_QUEST_TEMPLATES = [
  { id: 'daily_harvest', title: 'Busy Harvester', objectives: [{ type: 'harvest', target: 'any', count: 20, label: 'Harvest 20 crops' }], rewards: { coins: 50, xp: 30 } },
  { id: 'daily_plant', title: 'Planting Spree', objectives: [{ type: 'plant', target: 'any', count: 15, label: 'Plant 15 crops' }], rewards: { coins: 40, xp: 25 } },
  { id: 'daily_sell', title: 'Market Rush', objectives: [{ type: 'sell', target: 'any', count: 10, label: 'Sell 10 items' }], rewards: { coins: 60, xp: 35 } },
  { id: 'daily_eggs', title: 'Egg Collector', objectives: [{ type: 'collect_product', target: 'eggs', count: 5, label: 'Collect 5 Eggs' }], rewards: { coins: 45, xp: 25 } },
  { id: 'daily_feed', title: 'Animal Carer', objectives: [{ type: 'feed_animal', target: 'any', count: 5, label: 'Feed 5 animals' }], rewards: { coins: 55, xp: 30 } },
  { id: 'daily_produce', title: 'Factory Worker', objectives: [{ type: 'produce', target: 'any', count: 3, label: 'Produce 3 goods' }], rewards: { coins: 70, xp: 40 } },
  { id: 'daily_wheat', title: 'Wheat Fields', objectives: [{ type: 'harvest', target: 'wheat', count: 30, label: 'Harvest 30 Wheat' }], rewards: { coins: 45, xp: 25 } },
  { id: 'daily_variety', title: 'Crop Variety', objectives: [{ type: 'plant', target: 'carrot', count: 5, label: 'Plant 5 Carrots' }, { type: 'plant', target: 'tomato', count: 5, label: 'Plant 5 Tomatoes' }], rewards: { coins: 60, xp: 35 } },
  { id: 'daily_money', title: 'Profit Day', objectives: [{ type: 'earn_coins', target: 'any', count: 200, label: 'Earn 200 coins' }], rewards: { coins: 80, xp: 45 } },
  { id: 'daily_xp', title: 'Hard Worker', objectives: [{ type: 'earn_xp', target: 'any', count: 100, label: 'Earn 100 XP' }], rewards: { coins: 50, xp: 50 } }
];
