// =========================================
// Crop Data with Evolution Chains (v3 - Idle Tycoon)
// =========================================

// Evolution tiers for ALL crops
const CROP_EVOLUTION_TIERS = {
  wheat: [
    { tier: 1, name: 'Wheat', icon: '🌾', valueMult: 1, ability: null, desc: 'Basic golden wheat.' },
    { tier: 2, name: 'Golden Wheat', icon: '🌾', valueMult: 5, ability: 'speed10', desc: 'Glowing golden aura.' },
    { tier: 3, name: 'Crystal Wheat', icon: '💎', valueMult: 20, ability: 'double5', desc: 'Translucent crystal stalks.' },
    { tier: 4, name: 'Plasma Wheat', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Pulsing with energy.' },
    { tier: 5, name: 'Quantum Wheat', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Holographic, phase-shifting.' },
    { tier: 6, name: 'Cosmic Wheat', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Starfield pattern.' },
    { tier: 7, name: 'OMEGA Wheat', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Supernova wheat.' },
    { tier: 8, name: 'OMEGA Wheat', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Transcendent wheat beyond all realities.' },
  ],
  corn: [
    { tier: 1, name: 'Corn', icon: '🌽', valueMult: 1, ability: null, desc: 'Golden ears of corn.' },
    { tier: 2, name: 'Sweet Corn', icon: '🌽', valueMult: 5, ability: 'speed10', desc: 'Extra sweet.' },
    { tier: 3, name: 'Candy Corn', icon: '🍬', valueMult: 20, ability: 'double5', desc: 'Magically sweet.' },
    { tier: 4, name: 'Fire Corn', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Burns with flavor.' },
    { tier: 5, name: 'Neon Corn', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Glows in the dark.' },
    { tier: 6, name: 'Void Corn', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'From the void itself.' },
    { tier: 7, name: 'OMEGA Corn', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Ultimate corn beyond dimensions.' },
    { tier: 8, name: 'OMEGA Corn', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Transcendent corn of infinite kernels.' },
  ],
  carrot: [
    { tier: 1, name: 'Carrot', icon: '🥕', valueMult: 1, ability: null, desc: 'Crunchy and nutritious.' },
    { tier: 2, name: 'Giant Carrot', icon: '🥕', valueMult: 5, ability: 'speed10', desc: 'Massive root vegetable.' },
    { tier: 3, name: 'Golden Carrot', icon: '🥕', valueMult: 20, ability: 'double5', desc: 'Shining gold.' },
    { tier: 4, name: 'Crystal Carrot', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Transparent crystal.' },
    { tier: 5, name: 'Laser Carrot', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Shoots beams of light.' },
    { tier: 6, name: 'Quantum Carrot', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Exists in superposition.' },
    { tier: 7, name: 'OMEGA Carrot', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Galactic vegetable.' },
    { tier: 8, name: 'OMEGA Carrot', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The ultimate root.' },
  ],
  tomato: [
    { tier: 1, name: 'Tomato', icon: '🍅', valueMult: 1, ability: null, desc: 'Juicy red tomatoes.' },
    { tier: 2, name: 'Cherry Tomato', icon: '🍅', valueMult: 5, ability: 'speed10', desc: 'Small but potent.' },
    { tier: 3, name: 'Sun Tomato', icon: '☀️', valueMult: 20, ability: 'double5', desc: 'Radiates warmth and light.' },
    { tier: 4, name: 'Lava Tomato', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Burns with inner fire.' },
    { tier: 5, name: 'Plasma Tomato', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Pulsing with raw energy.' },
    { tier: 6, name: 'Nebula Tomato', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Born in a nebula.' },
    { tier: 7, name: 'OMEGA Tomato', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Stellar tomato.' },
    { tier: 8, name: 'OMEGA Tomato', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Transcendent fruit.' },
  ],
  strawberry: [
    { tier: 1, name: 'Strawberry', icon: '🍓', valueMult: 1, ability: null, desc: 'Sweet strawberries.' },
    { tier: 2, name: 'Wild Strawberry', icon: '🍓', valueMult: 5, ability: 'speed10', desc: 'Untamed flavor.' },
    { tier: 3, name: 'Royal Strawberry', icon: '👑', valueMult: 20, ability: 'double5', desc: 'Fit for royalty.' },
    { tier: 4, name: 'Diamond Strawberry', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Hard as diamond.' },
    { tier: 5, name: 'Rainbow Strawberry', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Every color, every flavor.' },
    { tier: 6, name: 'Celestial Strawberry', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Heaven-sent berry.' },
    { tier: 7, name: 'OMEGA Strawberry', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Cosmic berry of the stars.' },
    { tier: 8, name: 'OMEGA Strawberry', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The final berry.' },
  ],
  pumpkin: [
    { tier: 1, name: 'Pumpkin', icon: '🎃', valueMult: 1, ability: null, desc: 'Big orange pumpkin.' },
    { tier: 2, name: 'Giant Pumpkin', icon: '🎃', valueMult: 5, ability: 'speed10', desc: 'Massive size!' },
    { tier: 3, name: 'Jack-O Pumpkin', icon: '🎃', valueMult: 20, ability: 'double5', desc: 'Carved and glowing.' },
    { tier: 4, name: 'Crystal Pumpkin', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Transparent beauty.' },
    { tier: 5, name: 'Phantom Pumpkin', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Haunted energy.' },
    { tier: 6, name: 'Void Pumpkin', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'From the void itself.' },
    { tier: 7, name: 'OMEGA Pumpkin', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Planet-sized flavor.' },
    { tier: 8, name: 'OMEGA Pumpkin', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The cosmic gourd.' },
  ],
  sunflower: [
    { tier: 1, name: 'Sunflower', icon: '🌻', valueMult: 1, ability: null, desc: 'Bright sunflower.' },
    { tier: 2, name: 'Tall Sunflower', icon: '🌻', valueMult: 5, ability: 'speed10', desc: 'Tower of gold.' },
    { tier: 3, name: 'Radiant Sunflower', icon: '☀️', valueMult: 20, ability: 'double5', desc: 'Blinding radiance.' },
    { tier: 4, name: 'Solar Sunflower', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Harnesses the sun.' },
    { tier: 5, name: 'Plasma Sunflower', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Pure plasma petals.' },
    { tier: 6, name: 'Supernova Sunflower', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'About to explode.' },
    { tier: 7, name: 'OMEGA Sunflower', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'A miniature star.' },
    { tier: 8, name: 'OMEGA Sunflower', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The sun itself.' },
  ],
  watermelon: [
    { tier: 1, name: 'Watermelon', icon: '🍉', valueMult: 1, ability: null, desc: 'Refreshing melon.' },
    { tier: 2, name: 'Sugar Watermelon', icon: '🍉', valueMult: 5, ability: 'speed10', desc: 'Extra juicy.' },
    { tier: 3, name: 'Golden Watermelon', icon: '🏆', valueMult: 20, ability: 'double5', desc: 'Solid gold rind.' },
    { tier: 4, name: 'Frost Watermelon', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Ice-cold inside.' },
    { tier: 5, name: 'Electric Watermelon', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Crackling with charge.' },
    { tier: 6, name: 'Galactic Watermelon', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Infinite slices.' },
    { tier: 7, name: 'OMEGA Watermelon', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Planetary melon.' },
    { tier: 8, name: 'OMEGA Watermelon', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Universal fruit.' },
  ],
  cotton: [
    { tier: 1, name: 'Cotton', icon: '☁️', valueMult: 1, ability: null, desc: 'Soft cotton.' },
    { tier: 2, name: 'Fluffy Cotton', icon: '☁️', valueMult: 5, ability: 'speed10', desc: 'Extra fluffy and soft.' },
    { tier: 3, name: 'Cloud Cotton', icon: '⛅', valueMult: 20, ability: 'double5', desc: 'Lighter than air.' },
    { tier: 4, name: 'Silver Cotton', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Silver-threaded fibers.' },
    { tier: 5, name: 'Lightning Cotton', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Charged with electricity.' },
    { tier: 6, name: 'Astral Cotton', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Woven from starlight.' },
    { tier: 7, name: 'OMEGA Cotton', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Stardust fibers.' },
    { tier: 8, name: 'OMEGA Cotton', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Universal fabric.' },
  ],
  rice: [
    { tier: 1, name: 'Rice', icon: '🍚', valueMult: 1, ability: null, desc: 'Grain of prosperity.' },
    { tier: 2, name: 'Jasmine Rice', icon: '🍚', valueMult: 5, ability: 'speed10', desc: 'Fragrant and fine.' },
    { tier: 3, name: 'Pearl Rice', icon: '🍚', valueMult: 20, ability: 'double5', desc: 'Each grain a pearl.' },
    { tier: 4, name: 'Crystal Rice', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Each grain a gem.' },
    { tier: 5, name: 'Platinum Rice', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Platinum-infused grains.' },
    { tier: 6, name: 'Cosmic Rice', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Infinite grains.' },
    { tier: 7, name: 'OMEGA Rice', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Harvested from stars.' },
    { tier: 8, name: 'OMEGA Rice', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The final grain.' },
  ],
  sugarcane: [
    { tier: 1, name: 'Sugarcane', icon: '🎋', valueMult: 1, ability: null, desc: 'Sweet stalks of sugarcane.' },
    { tier: 2, name: 'Sweet Sugarcane', icon: '🎋', valueMult: 5, ability: 'speed10', desc: 'Extra sweet and tall.' },
    { tier: 3, name: 'Amber Sugarcane', icon: '🎋', valueMult: 20, ability: 'double5', desc: 'Amber-hued sweetness.' },
    { tier: 4, name: 'Honey Sugarcane', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Dripping with honey.' },
    { tier: 5, name: 'Caramel Sugarcane', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Caramelized perfection.' },
    { tier: 6, name: 'Golden Sugarcane', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Pure liquid gold.' },
    { tier: 7, name: 'OMEGA Sugarcane', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Crystallized starlight.' },
    { tier: 8, name: 'OMEGA Sugarcane', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Infinite sweetness incarnate.' },
  ],
  coffee_bean: [
    { tier: 1, name: 'Coffee Bean', icon: '☕', valueMult: 1, ability: null, desc: 'Rich coffee beans.' },
    { tier: 2, name: 'Arabica Coffee', icon: '☕', valueMult: 5, ability: 'speed10', desc: 'Premium arabica blend.' },
    { tier: 3, name: 'Dark Roast Coffee', icon: '☕', valueMult: 20, ability: 'double5', desc: 'Deep, dark flavor.' },
    { tier: 4, name: 'Espresso Coffee', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Concentrated power shot.' },
    { tier: 5, name: 'Thunder Coffee', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Lightning in a cup.' },
    { tier: 6, name: 'Quantum Coffee', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Brewed across dimensions.' },
    { tier: 7, name: 'OMEGA Coffee', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Cosmic caffeine surge.' },
    { tier: 8, name: 'OMEGA Coffee Bean', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The ultimate brew of reality.' },
  ],
  lavender: [
    { tier: 1, name: 'Lavender', icon: '💜', valueMult: 1, ability: null, desc: 'Fragrant purple flowers.' },
    { tier: 2, name: 'Purple Lavender', icon: '💜', valueMult: 5, ability: 'speed10', desc: 'Deep purple hue.' },
    { tier: 3, name: 'Royal Lavender', icon: '👑', valueMult: 20, ability: 'double5', desc: 'Fit for a queen.' },
    { tier: 4, name: 'Enchanted Lavender', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Magical fragrance.' },
    { tier: 5, name: 'Ethereal Lavender', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Ghostly, shimmering petals.' },
    { tier: 6, name: 'Spirit Lavender', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Woven from pure spirit.' },
    { tier: 7, name: 'OMEGA Lavender', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Cosmic aroma of the universe.' },
    { tier: 8, name: 'OMEGA Lavender', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Transcendent bloom of infinity.' },
  ],
  grape: [
    { tier: 1, name: 'Grape', icon: '🍇', valueMult: 1, ability: null, desc: 'Plump juicy grapes.' },
    { tier: 2, name: 'Wine Grape', icon: '🍇', valueMult: 5, ability: 'speed10', desc: 'Perfect for fine wine.' },
    { tier: 3, name: 'Crystal Grape', icon: '🍇', valueMult: 20, ability: 'double5', desc: 'Sparkling crystal clusters.' },
    { tier: 4, name: 'Amethyst Grape', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Each grape a gemstone.' },
    { tier: 5, name: 'Plasma Grape', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Crackling with energy.' },
    { tier: 6, name: 'Celestial Grape', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Harvested from the heavens.' },
    { tier: 7, name: 'OMEGA Grape', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Vintage of the cosmos.' },
    { tier: 8, name: 'OMEGA Grape', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The eternal vine.' },
  ],
  olive: [
    { tier: 1, name: 'Olive', icon: '🫒', valueMult: 1, ability: null, desc: 'Rich, savory olives.' },
    { tier: 2, name: 'Green Olive', icon: '🫒', valueMult: 5, ability: 'speed10', desc: 'Vibrant green harvest.' },
    { tier: 3, name: 'Golden Olive', icon: '🫒', valueMult: 20, ability: 'double5', desc: 'Gilded in gold.' },
    { tier: 4, name: 'Platinum Olive', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Precious metal fruit.' },
    { tier: 5, name: 'Ancient Olive', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Thousand-year wisdom.' },
    { tier: 6, name: 'Eternal Olive', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Timeless and undying.' },
    { tier: 7, name: 'OMEGA Olive', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Olive of the ancients.' },
    { tier: 8, name: 'OMEGA Olive', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The immortal fruit.' },
  ],
  cinnamon: [
    { tier: 1, name: 'Cinnamon', icon: '🟤', valueMult: 1, ability: null, desc: 'Warm, fragrant bark.' },
    { tier: 2, name: 'Bark Cinnamon', icon: '🟤', valueMult: 5, ability: 'speed10', desc: 'Thick aromatic bark.' },
    { tier: 3, name: 'Fire Cinnamon', icon: '🔥', valueMult: 20, ability: 'double5', desc: 'Burning with spice.' },
    { tier: 4, name: 'Ember Cinnamon', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Glowing ember bark.' },
    { tier: 5, name: 'Phoenix Cinnamon', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Reborn from ashes.' },
    { tier: 6, name: 'Inferno Cinnamon', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Raging inferno spice.' },
    { tier: 7, name: 'OMEGA Cinnamon', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Burns across dimensions.' },
    { tier: 8, name: 'OMEGA Cinnamon', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The eternal flame spice.' },
  ],
  vanilla: [
    { tier: 1, name: 'Vanilla', icon: '🤍', valueMult: 1, ability: null, desc: 'Smooth vanilla pods.' },
    { tier: 2, name: 'Cream Vanilla', icon: '🤍', valueMult: 5, ability: 'speed10', desc: 'Rich and creamy.' },
    { tier: 3, name: 'Ivory Vanilla', icon: '🤍', valueMult: 20, ability: 'double5', desc: 'Pale ivory elegance.' },
    { tier: 4, name: 'Pearl Vanilla', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Lustrous pearl sheen.' },
    { tier: 5, name: 'Moonlight Vanilla', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Bathed in moonlight.' },
    { tier: 6, name: 'Aurora Vanilla', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Shimmering northern lights.' },
    { tier: 7, name: 'OMEGA Vanilla', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Celestial vanilla essence.' },
    { tier: 8, name: 'OMEGA Vanilla', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The purest flavor in existence.' },
  ],
  mint: [
    { tier: 1, name: 'Mint', icon: '🌿', valueMult: 1, ability: null, desc: 'Cool refreshing mint.' },
    { tier: 2, name: 'Fresh Mint', icon: '🌿', valueMult: 5, ability: 'speed10', desc: 'Extra crisp and fresh.' },
    { tier: 3, name: 'Frost Mint', icon: '❄️', valueMult: 20, ability: 'double5', desc: 'Ice-cold leaves.' },
    { tier: 4, name: 'Ice Mint', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Frozen solid mint.' },
    { tier: 5, name: 'Glacier Mint', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Ancient glacier coolness.' },
    { tier: 6, name: 'Arctic Mint', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Absolute zero freshness.' },
    { tier: 7, name: 'OMEGA Mint', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Chill of deep space.' },
    { tier: 8, name: 'OMEGA Mint', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The coldest force in the universe.' },
  ],
  blueberry: [
    { tier: 1, name: 'Blueberry', icon: '🫐', valueMult: 1, ability: null, desc: 'Plump blueberries.' },
    { tier: 2, name: 'Wild Blueberry', icon: '🫐', valueMult: 5, ability: 'speed10', desc: 'Wild and untamed.' },
    { tier: 3, name: 'Sapphire Blueberry', icon: '🫐', valueMult: 20, ability: 'double5', desc: 'Deep sapphire blue.' },
    { tier: 4, name: 'Indigo Blueberry', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Rich indigo hue.' },
    { tier: 5, name: 'Midnight Blueberry', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Dark as midnight.' },
    { tier: 6, name: 'Cosmic Blueberry', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Plucked from the cosmos.' },
    { tier: 7, name: 'OMEGA Blueberry', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Berry of the void.' },
    { tier: 8, name: 'OMEGA Blueberry', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The ultimate blue fruit.' },
  ],
  avocado: [
    { tier: 1, name: 'Avocado', icon: '🥑', valueMult: 1, ability: null, desc: 'Creamy avocado.' },
    { tier: 2, name: 'Ripe Avocado', icon: '🥑', valueMult: 5, ability: 'speed10', desc: 'Perfectly ripe.' },
    { tier: 3, name: 'Guac-Gold Avocado', icon: '🥑', valueMult: 20, ability: 'double5', desc: 'Worth its weight in gold.' },
    { tier: 4, name: 'Emerald Avocado', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Deep emerald green.' },
    { tier: 5, name: 'Jade Avocado', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Carved from jade stone.' },
    { tier: 6, name: 'Forest Avocado', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Spirit of the ancient forest.' },
    { tier: 7, name: 'OMEGA Avocado', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Avocado of the world tree.' },
    { tier: 8, name: 'OMEGA Avocado', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The cosmic green fruit.' },
  ],
  saffron: [
    { tier: 1, name: 'Saffron', icon: '🧡', valueMult: 1, ability: null, desc: 'Precious saffron threads.' },
    { tier: 2, name: 'Thread Saffron', icon: '🧡', valueMult: 5, ability: 'speed10', desc: 'Fine golden threads.' },
    { tier: 3, name: 'Golden Saffron', icon: '🧡', valueMult: 20, ability: 'double5', desc: 'Pure gold strands.' },
    { tier: 4, name: 'Crimson Saffron', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Deep crimson luxury.' },
    { tier: 5, name: 'Royal Saffron', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Reserved for kings.' },
    { tier: 6, name: 'Imperial Saffron', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Imperial treasure.' },
    { tier: 7, name: 'OMEGA Saffron', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Worth more than galaxies.' },
    { tier: 8, name: 'OMEGA Saffron', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The most precious spice ever.' },
  ],
  dragon_fruit: [
    { tier: 1, name: 'Dragon Fruit', icon: '🐉', valueMult: 1, ability: null, desc: 'Exotic dragon fruit.' },
    { tier: 2, name: 'Pink Dragon Fruit', icon: '🐉', valueMult: 5, ability: 'speed10', desc: 'Vibrant pink flesh.' },
    { tier: 3, name: 'Flame Dragon Fruit', icon: '🔥', valueMult: 20, ability: 'double5', desc: 'Wreathed in flame.' },
    { tier: 4, name: 'Magma Dragon Fruit', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Molten core inside.' },
    { tier: 5, name: 'Dragon Dragon Fruit', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'A real dragon guards it.' },
    { tier: 6, name: 'Wyvern Dragon Fruit', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Wings of the wyvern.' },
    { tier: 7, name: 'OMEGA Dragon Fruit', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Elder dragon essence.' },
    { tier: 8, name: 'OMEGA Dragon Fruit', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The mythical dragon fruit.' },
  ],
  ginger: [
    { tier: 1, name: 'Ginger', icon: '🫚', valueMult: 1, ability: null, desc: 'Spicy ginger root.' },
    { tier: 2, name: 'Root Ginger', icon: '🫚', valueMult: 5, ability: 'speed10', desc: 'Deep and pungent.' },
    { tier: 3, name: 'Spicy Ginger', icon: '🫚', valueMult: 20, ability: 'double5', desc: 'Extra kick of heat.' },
    { tier: 4, name: 'Fire Root Ginger', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Burning underground.' },
    { tier: 5, name: 'Lava Root Ginger', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Grows in lava flows.' },
    { tier: 6, name: 'Magma Ginger', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Forged in the mantle.' },
    { tier: 7, name: 'OMEGA Ginger', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Root of the earth core.' },
    { tier: 8, name: 'OMEGA Ginger', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The primordial root.' },
  ],
  chili_pepper: [
    { tier: 1, name: 'Chili Pepper', icon: '🌶️', valueMult: 1, ability: null, desc: 'Fiery chili pepper.' },
    { tier: 2, name: 'Hot Chili Pepper', icon: '🌶️', valueMult: 5, ability: 'speed10', desc: 'Seriously hot.' },
    { tier: 3, name: 'Blaze Chili Pepper', icon: '🔥', valueMult: 20, ability: 'double5', desc: 'Sets things ablaze.' },
    { tier: 4, name: 'Inferno Chili Pepper', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Inescapable heat.' },
    { tier: 5, name: 'Hellfire Chili Pepper', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'From the depths of hell.' },
    { tier: 6, name: 'Nova Chili Pepper', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Explosive supernova heat.' },
    { tier: 7, name: 'OMEGA Chili Pepper', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Hotter than any star.' },
    { tier: 8, name: 'OMEGA Chili Pepper', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The ultimate heat source.' },
  ],
  lemongrass: [
    { tier: 1, name: 'Lemongrass', icon: '🪴', valueMult: 1, ability: null, desc: 'Citrusy lemongrass.' },
    { tier: 2, name: 'Fresh Lemongrass', icon: '🪴', valueMult: 5, ability: 'speed10', desc: 'Bright and zesty.' },
    { tier: 3, name: 'Citrus Lemongrass', icon: '🪴', valueMult: 20, ability: 'double5', desc: 'Intense citrus burst.' },
    { tier: 4, name: 'Electric Lemongrass', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Shocking citrus charge.' },
    { tier: 5, name: 'Storm Lemongrass', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Thunderstorm in a stalk.' },
    { tier: 6, name: 'Tempest Lemongrass', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Raging tempest of flavor.' },
    { tier: 7, name: 'OMEGA Lemongrass', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Storm of the cosmos.' },
    { tier: 8, name: 'OMEGA Lemongrass', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The eternal storm herb.' },
  ],
  rocket_fuel: [
    { tier: 1, name: 'Rocket Fuel', icon: '🚀', valueMult: 1, ability: null, desc: 'Volatile rocket fuel plant.' },
    { tier: 2, name: 'Fuel Rocket Fuel', icon: '🚀', valueMult: 5, ability: 'speed10', desc: 'Refined fuel blend.' },
    { tier: 3, name: 'Propellant Rocket Fuel', icon: '🚀', valueMult: 20, ability: 'double5', desc: 'High-grade propellant.' },
    { tier: 4, name: 'Jet Rocket Fuel', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Jet-grade combustion.' },
    { tier: 5, name: 'Hyperdrive Rocket Fuel', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Faster than light.' },
    { tier: 6, name: 'Warp Rocket Fuel', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Bends spacetime.' },
    { tier: 7, name: 'OMEGA Rocket Fuel', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Powers entire galaxies.' },
    { tier: 8, name: 'OMEGA Rocket Fuel', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'Infinite energy source.' },
  ],
  nebula_fruit: [
    { tier: 1, name: 'Nebula Fruit', icon: '🔮', valueMult: 1, ability: null, desc: 'Mysterious nebula fruit.' },
    { tier: 2, name: 'Misty Nebula Fruit', icon: '🔮', valueMult: 5, ability: 'speed10', desc: 'Shrouded in mist.' },
    { tier: 3, name: 'Cloudy Nebula Fruit', icon: '🔮', valueMult: 20, ability: 'double5', desc: 'Dense cosmic clouds.' },
    { tier: 4, name: 'Storm Nebula Fruit', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Raging space storms.' },
    { tier: 5, name: 'Supernova Nebula Fruit', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Born from a supernova.' },
    { tier: 6, name: 'Dimension Nebula Fruit', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Opens dimensional rifts.' },
    { tier: 7, name: 'OMEGA Nebula Fruit', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Essence of the nebula.' },
    { tier: 8, name: 'OMEGA Nebula Fruit', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The primordial cosmic fruit.' },
  ],
  void_mushroom: [
    { tier: 1, name: 'Void Mushroom', icon: '🍄', valueMult: 1, ability: null, desc: 'Dark void mushroom.' },
    { tier: 2, name: 'Shadow Void Mushroom', icon: '🍄', valueMult: 5, ability: 'speed10', desc: 'Casts deep shadows.' },
    { tier: 3, name: 'Dark Void Mushroom', icon: '🍄', valueMult: 20, ability: 'double5', desc: 'Absorbs all light.' },
    { tier: 4, name: 'Abyss Void Mushroom', icon: '💎', valueMult: 100, ability: 'double10', desc: 'From the deepest abyss.' },
    { tier: 5, name: 'Oblivion Void Mushroom', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Erases existence.' },
    { tier: 6, name: 'Entropy Void Mushroom', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Entropy incarnate.' },
    { tier: 7, name: 'OMEGA Void Mushroom', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Fungus of the void.' },
    { tier: 8, name: 'OMEGA Void Mushroom', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The end of all things.' },
  ],
  stardust_berry: [
    { tier: 1, name: 'Stardust Berry', icon: '⭐', valueMult: 1, ability: null, desc: 'Glittering stardust berry.' },
    { tier: 2, name: 'Spark Stardust Berry', icon: '⭐', valueMult: 5, ability: 'speed10', desc: 'Sparkling with energy.' },
    { tier: 3, name: 'Glitter Stardust Berry', icon: '⭐', valueMult: 20, ability: 'double5', desc: 'Covered in cosmic glitter.' },
    { tier: 4, name: 'Shine Stardust Berry', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Blinding radiance.' },
    { tier: 5, name: 'Radiance Stardust Berry', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Pure concentrated light.' },
    { tier: 6, name: 'Starburst Stardust Berry', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Explodes with starlight.' },
    { tier: 7, name: 'OMEGA Stardust Berry', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Berry of a dying star.' },
    { tier: 8, name: 'OMEGA Stardust Berry', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The ultimate stellar fruit.' },
  ],
  cosmic_corn: [
    { tier: 1, name: 'Cosmic Corn', icon: '🌌', valueMult: 1, ability: null, desc: 'Corn from beyond the stars.' },
    { tier: 2, name: 'Nebula Cosmic Corn', icon: '🌌', valueMult: 5, ability: 'speed10', desc: 'Grown in nebula clouds.' },
    { tier: 3, name: 'Galaxy Cosmic Corn', icon: '🌌', valueMult: 20, ability: 'double5', desc: 'Each kernel a galaxy.' },
    { tier: 4, name: 'Universe Cosmic Corn', icon: '💎', valueMult: 100, ability: 'double10', desc: 'Contains a universe.' },
    { tier: 5, name: 'Multiverse Cosmic Corn', icon: '⚡', valueMult: 500, ability: 'autoReplant', desc: 'Spans the multiverse.' },
    { tier: 6, name: 'INFINITY Cosmic Corn', icon: '🔮', valueMult: 2500, ability: 'bonusXP', desc: 'Infinite cosmic power.' },
    { tier: 7, name: 'OMEGA Cosmic Corn', icon: '🌌', valueMult: 15000, ability: 'passiveCoins', desc: 'Beyond infinity itself.' },
    { tier: 8, name: 'OMEGA Cosmic Corn', icon: '💫', valueMult: 100000, ability: 'globalBoost50', desc: 'The final crop. The end of farming.' },
  ],
};

// Evolution level thresholds
const EVOLUTION_LEVELS = [1, 10, 25, 50, 100, 200, 500, 1000];

// Base crop data with FAST timers for idle tycoon feel
const CROPS_DATA = {
  wheat: {
    id: 'wheat', name: 'Wheat', icon: '🌾',
    cost: 5, growthTime: 10, sellPrice: 10, xp: 5, unlockLevel: 1,
    stages: ['🟫', '🌱', '🌿', '🌾'],
    description: 'A staple grain. Quick to grow and always useful.',
    color: '#D4A574'
  },
  corn: {
    id: 'corn', name: 'Corn', icon: '🌽',
    cost: 10, growthTime: 20, sellPrice: 22, xp: 10, unlockLevel: 1,
    stages: ['🟫', '🌱', '🌿', '🌽'],
    description: 'Golden ears of corn. Great for feeding chickens!',
    color: '#F4D03F'
  },
  carrot: {
    id: 'carrot', name: 'Carrot', icon: '🥕',
    cost: 15, growthTime: 30, sellPrice: 35, xp: 15, unlockLevel: 2,
    stages: ['🟫', '🌱', '🌿', '🥕'],
    description: 'Crunchy and nutritious. Pigs love them.',
    color: '#E67E22'
  },
  tomato: {
    id: 'tomato', name: 'Tomato', icon: '🍅',
    cost: 25, growthTime: 45, sellPrice: 55, xp: 25, unlockLevel: 3,
    stages: ['🟫', '🌱', '🌿', '🍅'],
    description: 'Juicy red tomatoes, fresh from the vine.',
    color: '#E74C3C'
  },
  strawberry: {
    id: 'strawberry', name: 'Strawberry', icon: '🍓',
    cost: 40, growthTime: 60, sellPrice: 90, xp: 40, unlockLevel: 5,
    stages: ['🟫', '🌱', '🌿', '🍓'],
    description: 'Sweet strawberries. Perfect for smoothies!',
    color: '#FF6B6B'
  },
  pumpkin: {
    id: 'pumpkin', name: 'Pumpkin', icon: '🎃',
    cost: 60, growthTime: 90, sellPrice: 140, xp: 60, unlockLevel: 7,
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
    cost: 120, growthTime: 180, sellPrice: 320, xp: 120, unlockLevel: 13,
    stages: ['🟫', '🌱', '🌿', '🍉'],
    description: 'Refreshing watermelons. A summer favorite!',
    color: '#2ECC71'
  },
  cotton: {
    id: 'cotton', name: 'Cotton', icon: '☁️',
    cost: 150, growthTime: 240, sellPrice: 400, xp: 150, unlockLevel: 15,
    stages: ['🟫', '🌱', '🌿', '☁️'],
    description: 'Soft cotton bolls. Essential for textiles.',
    color: '#ECF0F1'
  },
  rice: {
    id: 'rice', name: 'Rice', icon: '🍚',
    cost: 200, growthTime: 300, sellPrice: 550, xp: 200, unlockLevel: 16,
    stages: ['🟫', '🌱', '🌿', '🍚'],
    description: 'Paddies of rice. The grain of prosperity.',
    color: '#FAD7A0'
  },
  sugarcane: {
    id: 'sugarcane', name: 'Sugarcane', icon: '🎋',
    cost: 180, growthTime: 240, sellPrice: 480, xp: 180, unlockLevel: 10,
    stages: ['🟫', '🌱', '🌿', '🎋'],
    description: 'Tall stalks of sugarcane. Sweet and profitable.',
    color: '#82E0AA'
  },
  coffee_bean: {
    id: 'coffee_bean', name: 'Coffee Bean', icon: '☕',
    cost: 250, growthTime: 300, sellPrice: 600, xp: 220, unlockLevel: 18,
    stages: ['🟫', '🌱', '🌿', '☕'],
    description: 'Rich coffee beans. The world runs on these.',
    color: '#6F4E37'
  },
  lavender: {
    id: 'lavender', name: 'Lavender', icon: '💜',
    cost: 200, growthTime: 270, sellPrice: 520, xp: 200, unlockLevel: 21,
    stages: ['🟫', '🌱', '🌿', '💜'],
    description: 'Fragrant lavender fields. Calming and valuable.',
    color: '#9B59B6'
  },
  grape: {
    id: 'grape', name: 'Grape', icon: '🍇',
    cost: 300, growthTime: 360, sellPrice: 750, xp: 280, unlockLevel: 23,
    stages: ['🟫', '🌱', '🌿', '🍇'],
    description: 'Plump juicy grapes. Perfect for wine.',
    color: '#8E44AD'
  },
  olive: {
    id: 'olive', name: 'Olive', icon: '🫒',
    cost: 280, growthTime: 330, sellPrice: 700, xp: 260, unlockLevel: 24,
    stages: ['🟫', '🌱', '🌿', '🫒'],
    description: 'Rich, savory olives from ancient trees.',
    color: '#7D8B69'
  },
  cinnamon: {
    id: 'cinnamon', name: 'Cinnamon', icon: '🟤',
    cost: 350, growthTime: 420, sellPrice: 900, xp: 320, unlockLevel: 26,
    stages: ['🟫', '🌱', '🌿', '🟤'],
    description: 'Warm, fragrant cinnamon bark. A prized spice.',
    color: '#A0522D'
  },
  vanilla: {
    id: 'vanilla', name: 'Vanilla', icon: '🤍',
    cost: 400, growthTime: 480, sellPrice: 1050, xp: 380, unlockLevel: 28,
    stages: ['🟫', '🌱', '🌿', '🤍'],
    description: 'Smooth vanilla pods. The queen of flavors.',
    color: '#F5F5DC'
  },
  mint: {
    id: 'mint', name: 'Mint', icon: '🌿',
    cost: 300, growthTime: 360, sellPrice: 780, xp: 290, unlockLevel: 31,
    stages: ['🟫', '🌱', '🌿', '🌿'],
    description: 'Cool refreshing mint. A versatile herb.',
    color: '#3EB489'
  },
  blueberry: {
    id: 'blueberry', name: 'Blueberry', icon: '🫐',
    cost: 350, growthTime: 400, sellPrice: 880, xp: 330, unlockLevel: 33,
    stages: ['🟫', '🌱', '🌿', '🫐'],
    description: 'Plump blueberries bursting with flavor.',
    color: '#4169E1'
  },
  avocado: {
    id: 'avocado', name: 'Avocado', icon: '🥑',
    cost: 450, growthTime: 540, sellPrice: 1200, xp: 420, unlockLevel: 37,
    stages: ['🟫', '🌱', '🌿', '🥑'],
    description: 'Creamy avocados. Green gold of the farm.',
    color: '#568203'
  },
  saffron: {
    id: 'saffron', name: 'Saffron', icon: '🧡',
    cost: 800, growthTime: 900, sellPrice: 2500, xp: 700, unlockLevel: 41,
    stages: ['🟫', '🌱', '🌿', '🧡'],
    description: 'Precious saffron threads. Worth more than gold.',
    color: '#FF8C00'
  },
  dragon_fruit: {
    id: 'dragon_fruit', name: 'Dragon Fruit', icon: '🐉',
    cost: 600, growthTime: 600, sellPrice: 1600, xp: 550, unlockLevel: 46,
    stages: ['🟫', '🌱', '🌿', '🐉'],
    description: 'Exotic dragon fruit. Scales of fire and ice.',
    color: '#FF1493'
  },
  ginger: {
    id: 'ginger', name: 'Ginger', icon: '🫚',
    cost: 350, growthTime: 420, sellPrice: 920, xp: 340, unlockLevel: 51,
    stages: ['🟫', '🌱', '🌿', '🫚'],
    description: 'Spicy ginger root. A kick in every bite.',
    color: '#C4A35A'
  },
  chili_pepper: {
    id: 'chili_pepper', name: 'Chili Pepper', icon: '🌶️',
    cost: 400, growthTime: 450, sellPrice: 1000, xp: 380, unlockLevel: 53,
    stages: ['🟫', '🌱', '🌿', '🌶️'],
    description: 'Fiery chili peppers. Handle with care!',
    color: '#CC0000'
  },
  lemongrass: {
    id: 'lemongrass', name: 'Lemongrass', icon: '🪴',
    cost: 380, growthTime: 430, sellPrice: 960, xp: 360, unlockLevel: 55,
    stages: ['🟫', '🌱', '🌿', '🪴'],
    description: 'Citrusy lemongrass. Fragrant and refreshing.',
    color: '#C8D96F'
  },
  rocket_fuel: {
    id: 'rocket_fuel', name: 'Rocket Fuel', icon: '🚀',
    cost: 1000, growthTime: 600, sellPrice: 3000, xp: 900, unlockLevel: 62,
    stages: ['🟫', '🌱', '🌿', '🚀'],
    description: 'Volatile rocket fuel plant. Extremely profitable!',
    color: '#FF4500'
  },
  nebula_fruit: {
    id: 'nebula_fruit', name: 'Nebula Fruit', icon: '🔮',
    cost: 2000, growthTime: 300, sellPrice: 6000, xp: 1500, unlockLevel: 66,
    stages: ['🟫', '🌱', '🌿', '🔮'],
    description: 'Mysterious fruit from the depths of a nebula.',
    color: '#7B68EE'
  },
  void_mushroom: {
    id: 'void_mushroom', name: 'Void Mushroom', icon: '🍄',
    cost: 2500, growthTime: 360, sellPrice: 7500, xp: 1800, unlockLevel: 67,
    stages: ['🟫', '🌱', '🌿', '🍄'],
    description: 'Dark mushroom from the void between worlds.',
    color: '#2C003E'
  },
  stardust_berry: {
    id: 'stardust_berry', name: 'Stardust Berry', icon: '⭐',
    cost: 3000, growthTime: 420, sellPrice: 9000, xp: 2200, unlockLevel: 69,
    stages: ['🟫', '🌱', '🌿', '⭐'],
    description: 'Glittering berries made of pure stardust.',
    color: '#FFD700'
  },
  cosmic_corn: {
    id: 'cosmic_corn', name: 'Cosmic Corn', icon: '🌌',
    cost: 5000, growthTime: 240, sellPrice: 15000, xp: 3500, unlockLevel: 70,
    stages: ['🟫', '🌱', '🌿', '🌌'],
    description: 'The ultimate crop. Corn from beyond the cosmos.',
    color: '#191970'
  }
};

// Per-item upgrade track definitions
const UPGRADE_TRACKS = {
  speed: { name: 'Growth Speed', icon: '⚡', maxLevel: 50, perLevel: 0.02, desc: '-2% time per level' },
  value: { name: 'Sell Value', icon: '💰', maxLevel: 50, perLevel: 0.10, desc: '+10% value per level' },
  double: { name: 'Double Harvest', icon: '🎯', maxLevel: 30, perLevel: 0.02, desc: '+2% chance per level' },
  autoReplant: { name: 'Auto-Replant', icon: '✨', maxLevel: 20, perLevel: 0.05, desc: '+5% chance per level' },
  critical: { name: 'Critical Harvest', icon: '🌟', maxLevel: 20, perLevel: 0.01, desc: '+1% chance for 5x', reqTier: 4 },
  synergy: { name: 'Synergy', icon: '🔗', maxLevel: 10, perLevel: 0.03, desc: '+3% all same type', reqTier: 6 },
};

// Upgrade cost formula: baseCost * 1.15^level
function getUpgradeCost(baseCost, level) {
  return Math.floor(baseCost * Math.pow(1.15, level));
}
