// Decoration items configuration data
const DECORATIONS_DATA = {
  // Fences & Walls
  wooden_fence: { id: 'wooden_fence', name: 'Wooden Fence', icon: '🪵', cost: 10, costType: 'coins', category: 'fences', unlockLevel: 1, beautyScore: 1, description: 'A rustic wooden fence.' },
  stone_wall: { id: 'stone_wall', name: 'Stone Wall', icon: '🧱', cost: 25, costType: 'coins', category: 'fences', unlockLevel: 3, beautyScore: 2, description: 'A sturdy stone wall.' },
  white_picket: { id: 'white_picket', name: 'White Picket Fence', icon: '⬜', cost: 15, costType: 'coins', category: 'fences', unlockLevel: 2, beautyScore: 2, description: 'A classic white picket fence.' },

  // Paths & Roads
  dirt_path: { id: 'dirt_path', name: 'Dirt Path', icon: '🟫', cost: 5, costType: 'coins', category: 'paths', unlockLevel: 1, beautyScore: 1, description: 'A simple dirt path.' },
  stone_path: { id: 'stone_path', name: 'Stone Path', icon: '⬛', cost: 15, costType: 'coins', category: 'paths', unlockLevel: 3, beautyScore: 2, description: 'Neatly laid stone path.' },
  brick_road: { id: 'brick_road', name: 'Brick Road', icon: '🟧', cost: 30, costType: 'coins', category: 'paths', unlockLevel: 6, beautyScore: 3, description: 'A charming brick road.' },

  // Garden & Flowers
  red_flowers: { id: 'red_flowers', name: 'Red Flowers', icon: '🌹', cost: 20, costType: 'coins', category: 'garden', unlockLevel: 1, beautyScore: 3, isFlower: true, description: 'Beautiful red roses.' },
  yellow_flowers: { id: 'yellow_flowers', name: 'Yellow Flowers', icon: '🌼', cost: 20, costType: 'coins', category: 'garden', unlockLevel: 1, beautyScore: 3, isFlower: true, description: 'Bright yellow daisies.' },
  tulips: { id: 'tulips', name: 'Tulips', icon: '🌷', cost: 30, costType: 'coins', category: 'garden', unlockLevel: 4, beautyScore: 4, isFlower: true, description: 'Elegant tulips in bloom.' },
  lavender: { id: 'lavender', name: 'Lavender', icon: '💜', cost: 35, costType: 'coins', category: 'garden', unlockLevel: 5, beautyScore: 4, isFlower: true, description: 'Fragrant purple lavender.' },
  bush: { id: 'bush', name: 'Decorative Bush', icon: '🌳', cost: 15, costType: 'coins', category: 'garden', unlockLevel: 2, beautyScore: 2, description: 'A well-trimmed bush.' },

  // Furniture & Outdoor
  bench: { id: 'bench', name: 'Garden Bench', icon: '🪑', cost: 40, costType: 'coins', category: 'furniture', unlockLevel: 3, beautyScore: 3, description: 'A comfy spot to rest.' },
  lamp_post: { id: 'lamp_post', name: 'Lamp Post', icon: '🪔', cost: 50, costType: 'coins', category: 'furniture', unlockLevel: 5, beautyScore: 4, description: 'Lights up the farm at night.' },
  well: { id: 'well', name: 'Water Well', icon: '⛲', cost: 80, costType: 'coins', category: 'furniture', unlockLevel: 4, beautyScore: 5, description: 'An old stone water well.' },
  scarecrow: { id: 'scarecrow', name: 'Scarecrow', icon: '🎃', cost: 30, costType: 'coins', category: 'furniture', unlockLevel: 2, beautyScore: 2, description: 'Keeps the crows away!' },
  mailbox: { id: 'mailbox', name: 'Mailbox', icon: '📫', cost: 25, costType: 'coins', category: 'furniture', unlockLevel: 1, beautyScore: 2, description: 'A cute farm mailbox.' },
  fountain: { id: 'fountain', name: 'Fountain', icon: '⛲', cost: 200, costType: 'coins', category: 'furniture', unlockLevel: 8, beautyScore: 8, description: 'An elegant garden fountain.' },
  windmill_deco: { id: 'windmill_deco', name: 'Windmill', icon: '🌀', cost: 500, costType: 'coins', category: 'furniture', unlockLevel: 12, beautyScore: 12, description: 'A beautiful decorative windmill.' },
  pond: { id: 'pond', name: 'Duck Pond', icon: '🦆', cost: 150, costType: 'coins', category: 'furniture', unlockLevel: 6, beautyScore: 6, description: 'A peaceful duck pond.' },

  // Seasonal & Special
  flag: { id: 'flag', name: 'Farm Flag', icon: '🚩', cost: 5, costType: 'gems', category: 'special', unlockLevel: 1, beautyScore: 5, description: 'Show your farm pride!' },
  statue: { id: 'statue', name: 'Golden Statue', icon: '🏆', cost: 15, costType: 'gems', category: 'special', unlockLevel: 10, beautyScore: 15, description: 'A gleaming golden farmer statue.' },
  rainbow: { id: 'rainbow', name: 'Rainbow Arch', icon: '🌈', cost: 10, costType: 'gems', category: 'special', unlockLevel: 8, beautyScore: 10, description: 'A magical rainbow over your farm.' },
  balloon: { id: 'balloon', name: 'Hot Air Balloon', icon: '🎈', cost: 20, costType: 'gems', category: 'special', unlockLevel: 15, beautyScore: 20, description: 'A colorful balloon floating above.' },
};

const DECORATION_CATEGORIES = {
  fences: { name: 'Fences & Walls', icon: '🪵' },
  paths: { name: 'Paths & Roads', icon: '🟫' },
  garden: { name: 'Garden & Flowers', icon: '🌹' },
  furniture: { name: 'Furniture & Outdoor', icon: '🪑' },
  special: { name: 'Special & Premium', icon: '⭐' }
};
