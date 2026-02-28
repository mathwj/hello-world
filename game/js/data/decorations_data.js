/**
 * decorations_data.js
 *
 * Complete decoration catalogue for the farm simulation game.
 * Contains 12 themed sets (72 items) and 30 standalone decorations (102 total).
 *
 * Each item schema:
 *   id      {string}  Unique snake_case identifier
 *   name    {string}  Display name
 *   icon    {string}  Emoji icon
 *   cost    {number}  Price in coins
 *   beauty  {number}  Beauty score contribution
 *   source  {string}  Acquisition source key (matches DECORATION_SOURCES)
 *   desc    {string}  Short flavour description
 */

const DECORATION_SETS = {

  // -------------------------------------------------------
  // 1. STARTER FARM  --  Cheap basics every new farmer needs
  // -------------------------------------------------------
  starter_farm: {
    name: 'Starter Farm',
    icon: '\uD83C\uDFE1',
    bonus: { type: 'beauty', value: 0.05, desc: '+5% farm beauty' },
    items: [
      { id: 'wooden_fence',  name: 'Wooden Fence',  icon: '\uD83E\uDEB5', cost: 50,  beauty: 5,  source: 'shop', desc: 'A rustic wooden fence to mark your territory.' },
      { id: 'hay_bale',      name: 'Hay Bale',      icon: '\uD83C\uDF3E', cost: 80,  beauty: 6,  source: 'shop', desc: 'A golden bale of freshly cut hay.' },
      { id: 'scarecrow',     name: 'Scarecrow',     icon: '\uD83E\uDDCC', cost: 120, beauty: 8,  source: 'shop', desc: 'Keeps the crows away and the charm up.' },
      { id: 'water_well',    name: 'Water Well',    icon: '\uD83D\uDEBF', cost: 200, beauty: 12, source: 'shop', desc: 'A classic stone well brimming with fresh water.' },
      { id: 'mailbox',       name: 'Mailbox',       icon: '\uD83D\uDCEB', cost: 100, beauty: 7,  source: 'shop', desc: 'Check daily for letters from neighbouring farms.' },
      { id: 'bench',         name: 'Bench',         icon: '\uD83E\uDE91', cost: 150, beauty: 9,  source: 'shop', desc: 'Take a seat and enjoy the countryside view.' }
    ]
  },

  // -------------------------------------------------------
  // 2. FLOWER GARDEN  --  Blooming beauties that attract wildlife
  // -------------------------------------------------------
  flower_garden: {
    name: 'Flower Garden',
    icon: '\uD83C\uDF3A',
    bonus: { type: 'beauty_butterfly', value: 0.10, desc: '+10% beauty, attracts butterflies' },
    items: [
      { id: 'rose_bush',       name: 'Rose Bush',       icon: '\uD83C\uDF39', cost: 200, beauty: 14, source: 'shop', desc: 'Fragrant red roses that bloom all season long.' },
      { id: 'tulip_bed',       name: 'Tulip Bed',       icon: '\uD83C\uDF37', cost: 180, beauty: 12, source: 'shop', desc: 'A vibrant bed of multi-coloured tulips.' },
      { id: 'sunflower_patch', name: 'Sunflower Patch', icon: '\uD83C\uDF3B', cost: 250, beauty: 16, source: 'shop', desc: 'Tall sunflowers that always face the light.' },
      { id: 'lily_pond',       name: 'Lily Pond',       icon: '\uD83E\uDEB7', cost: 400, beauty: 22, source: 'shop', desc: 'A serene pond dotted with floating lilies.' },
      { id: 'wisteria_arch',   name: 'Wisteria Arch',   icon: '\uD83C\uDF3C', cost: 350, beauty: 20, source: 'shop', desc: 'A delicate arch dripping with purple wisteria.' },
      { id: 'flower_cart',     name: 'Flower Cart',     icon: '\uD83D\uDED2', cost: 300, beauty: 18, source: 'shop', desc: 'A charming cart overflowing with mixed bouquets.' }
    ]
  },

  // -------------------------------------------------------
  // 3. COUNTRY LIVING  --  Pastoral touches with a CPS bonus
  // -------------------------------------------------------
  country_living: {
    name: 'Country Living',
    icon: '\uD83C\uDFDC\uFE0F',
    bonus: { type: 'cps', value: 0.05, desc: '+5% coins per second' },
    items: [
      { id: 'windmill',         name: 'Windmill',         icon: '\uD83C\uDFE1', cost: 500, beauty: 25, source: 'shop', desc: 'A wooden windmill that turns lazily in the breeze.' },
      { id: 'barn_cat_statue',  name: 'Barn Cat Statue',  icon: '\uD83D\uDC08', cost: 300, beauty: 18, source: 'shop', desc: 'A stone tribute to every barn cat that ever lived.' },
      { id: 'rocking_chair',    name: 'Rocking Chair',    icon: '\uD83E\uDE91', cost: 200, beauty: 14, source: 'shop', desc: 'Perfect for watching the sunset over the fields.' },
      { id: 'picnic_table',     name: 'Picnic Table',     icon: '\uD83C\uDF7D\uFE0F', cost: 250, beauty: 16, source: 'shop', desc: 'A sturdy table for outdoor family meals.' },
      { id: 'stone_path',       name: 'Stone Path',       icon: '\uD83E\uDEA8', cost: 150, beauty: 10, source: 'shop', desc: 'Flat stones laid in a winding garden path.' },
      { id: 'lantern',          name: 'Lantern',          icon: '\uD83C\uDFEE', cost: 180, beauty: 12, source: 'shop', desc: 'An oil lantern that glows warmly at dusk.' }
    ]
  },

  // -------------------------------------------------------
  // 4. COZY COTTAGE  --  Home-sweet-home with offline earnings
  // -------------------------------------------------------
  cozy_cottage: {
    name: 'Cozy Cottage',
    icon: '\uD83C\uDFE0',
    bonus: { type: 'offline_earnings', value: 0.03, desc: '+3% offline earnings' },
    items: [
      { id: 'cottage_mailbox', name: 'Cottage Mailbox', icon: '\uD83D\uDCEE', cost: 400, beauty: 22, source: 'quest', desc: 'A quaint mailbox wrapped in ivy.' },
      { id: 'welcome_mat',     name: 'Welcome Mat',     icon: '\uD83E\uDEE0', cost: 200, beauty: 14, source: 'quest', desc: 'A woven mat that greets every visitor.' },
      { id: 'window_box',      name: 'Window Box',      icon: '\uD83C\uDF3A', cost: 300, beauty: 18, source: 'quest', desc: 'A planter bursting with petunias and geraniums.' },
      { id: 'chimney_smoke',   name: 'Chimney Smoke',   icon: '\uD83C\uDF2B\uFE0F', cost: 500, beauty: 26, source: 'quest', desc: 'Gentle smoke curling from a cozy hearth.' },
      { id: 'door_wreath',     name: 'Door Wreath',     icon: '\uD83C\uDF3F', cost: 250, beauty: 16, source: 'quest', desc: 'A handmade wreath of dried herbs and berries.' },
      { id: 'bird_house',      name: 'Bird House',      icon: '\uD83D\uDC26', cost: 350, beauty: 20, source: 'quest', desc: 'A tiny house that welcomes songbirds to your yard.' }
    ]
  },

  // -------------------------------------------------------
  // 5. MEDIEVAL  --  Castle-grade prestige pieces
  // -------------------------------------------------------
  medieval: {
    name: 'Medieval',
    icon: '\uD83C\uDFF0',
    bonus: { type: 'beauty', value: 0.10, desc: '+10% farm beauty' },
    items: [
      { id: 'castle_tower',  name: 'Castle Tower',  icon: '\uD83C\uDFF0', cost: 2000, beauty: 50, source: 'achievement', desc: 'A towering stone turret straight from the Middle Ages.' },
      { id: 'knight_statue', name: 'Knight Statue', icon: '\u2694\uFE0F',  cost: 1500, beauty: 40, source: 'achievement', desc: 'A gallant knight frozen in gleaming armour.' },
      { id: 'dragon_flag',   name: 'Dragon Flag',   icon: '\uD83D\uDC09', cost: 800,  beauty: 28, source: 'achievement', desc: 'A fearsome banner bearing a crimson dragon.' },
      { id: 'stone_wall',    name: 'Stone Wall',    icon: '\uD83E\uDDF1', cost: 600,  beauty: 22, source: 'achievement', desc: 'Thick rampart blocks hewn from mountain granite.' },
      { id: 'catapult',      name: 'Catapult',      icon: '\uD83E\uDE79', cost: 1200, beauty: 35, source: 'achievement', desc: 'A siege engine repurposed as a farm attraction.' },
      { id: 'drawbridge',    name: 'Drawbridge',    icon: '\uD83C\uDF09', cost: 1800, beauty: 45, source: 'achievement', desc: 'Lower the bridge and welcome friends to your realm.' }
    ]
  },

  // -------------------------------------------------------
  // 6. BEACH PARTY  --  Summer vibes and happy animals
  // -------------------------------------------------------
  beach_party: {
    name: 'Beach Party',
    icon: '\uD83C\uDFD6\uFE0F',
    bonus: { type: 'animal_happiness', value: 0.05, desc: '+5% animal happiness' },
    items: [
      { id: 'beach_umbrella', name: 'Beach Umbrella', icon: '\u26F1\uFE0F',  cost: 800, beauty: 28, source: 'event', desc: 'A colourful parasol that screams summer.' },
      { id: 'surfboard',      name: 'Surfboard',      icon: '\uD83C\uDFC4', cost: 600, beauty: 22, source: 'event', desc: 'Ride the waves, even on a landlocked farm.' },
      { id: 'sandcastle',     name: 'Sandcastle',     icon: '\uD83C\uDFF0', cost: 400, beauty: 18, source: 'event', desc: 'An elaborate castle sculpted from golden sand.' },
      { id: 'tiki_torch',     name: 'Tiki Torch',     icon: '\uD83D\uDD25', cost: 500, beauty: 20, source: 'event', desc: 'A bamboo torch that flickers in the evening breeze.' },
      { id: 'hammock',        name: 'Hammock',        icon: '\uD83D\uDECF\uFE0F', cost: 700, beauty: 25, source: 'event', desc: 'Sway gently between two palm trees.' },
      { id: 'beach_ball',     name: 'Beach Ball',     icon: '\uD83C\uDFD0', cost: 300, beauty: 15, source: 'event', desc: 'A bouncy ball in red, white, and blue.' }
    ]
  },

  // -------------------------------------------------------
  // 7. SPOOKY HALLOWEEN  --  Autumn frights with pumpkin power
  // -------------------------------------------------------
  spooky_halloween: {
    name: 'Spooky Halloween',
    icon: '\uD83C\uDF83',
    bonus: { type: 'pumpkin_value', value: 0.05, desc: '+5% pumpkin crop value' },
    items: [
      { id: 'jack_o_lantern', name: 'Jack-O-Lantern',  icon: '\uD83C\uDF83', cost: 600, beauty: 22, source: 'event', desc: 'A grinning pumpkin that glows in the dark.' },
      { id: 'ghost',          name: 'Ghost',           icon: '\uD83D\uDC7B', cost: 500, beauty: 20, source: 'event', desc: 'A friendly phantom hovering above the crops.' },
      { id: 'spider_web',     name: 'Spider Web',      icon: '\uD83D\uDD78\uFE0F', cost: 300, beauty: 14, source: 'event', desc: 'Silky strands strung between the fence posts.' },
      { id: 'cauldron',       name: 'Cauldron',        icon: '\uD83E\uDDEA', cost: 700, beauty: 25, source: 'event', desc: 'A bubbling pot of mysterious green brew.' },
      { id: 'tombstone',      name: 'Tombstone',       icon: '\uD83E\uDEA6', cost: 400, beauty: 18, source: 'event', desc: 'Here lies the last farmer who skipped watering day.' },
      { id: 'bat_mobile',     name: 'Bat Mobile',      icon: '\uD83E\uDD87', cost: 800, beauty: 28, source: 'event', desc: 'A swarm of bats circling a spooky perch.' }
    ]
  },

  // -------------------------------------------------------
  // 8. WINTER WONDERLAND  --  Frosty decor with production boost
  // -------------------------------------------------------
  winter_wonderland: {
    name: 'Winter Wonderland',
    icon: '\u2744\uFE0F',
    bonus: { type: 'production_speed', value: 0.05, desc: '+5% all production speed' },
    items: [
      { id: 'snowman',                name: 'Snowman',                icon: '\u2603\uFE0F',  cost: 500,  beauty: 20, source: 'event', desc: 'A jolly snowman with a carrot nose and top hat.' },
      { id: 'ice_sculpture',          name: 'Ice Sculpture',          icon: '\uD83E\uDDCA', cost: 1000, beauty: 35, source: 'event', desc: 'A glistening swan carved from pure ice.' },
      { id: 'sled',                   name: 'Sled',                   icon: '\uD83D\uDEF7', cost: 400,  beauty: 18, source: 'event', desc: 'A vintage wooden sled propped against the barn.' },
      { id: 'hot_cocoa_stand',        name: 'Hot Cocoa Stand',        icon: '\u2615',       cost: 800,  beauty: 28, source: 'event', desc: 'Warm up with a steaming mug of cocoa.' },
      { id: 'frozen_fountain',        name: 'Frozen Fountain',        icon: '\u26F2',       cost: 1200, beauty: 40, source: 'event', desc: 'A grand fountain suspended mid-splash in ice.' },
      { id: 'northern_lights_display', name: 'Northern Lights Display', icon: '\uD83C\uDF0C', cost: 1500, beauty: 48, source: 'event', desc: 'A holographic aurora that dances across the sky.' }
    ]
  },

  // -------------------------------------------------------
  // 9. SPACE AGE  --  High-tech decor for prestigious players
  // -------------------------------------------------------
  space_age: {
    name: 'Space Age',
    icon: '\uD83D\uDE80',
    bonus: { type: 'cps', value: 0.10, desc: '+10% coins per second' },
    items: [
      { id: 'rocket',           name: 'Rocket',           icon: '\uD83D\uDE80', cost: 5000, beauty: 60, source: 'shop', desc: 'A sleek rocket ready for interstellar harvests.' },
      { id: 'satellite_dish',   name: 'Satellite Dish',   icon: '\uD83D\uDCE1', cost: 3000, beauty: 40, source: 'shop', desc: 'Picks up crop forecasts from orbit.' },
      { id: 'moon_rock',        name: 'Moon Rock',        icon: '\uD83C\uDF15', cost: 2000, beauty: 30, source: 'shop', desc: 'A genuine chunk of lunar regolith.' },
      { id: 'alien_statue',     name: 'Alien Statue',     icon: '\uD83D\uDC7D', cost: 4000, beauty: 50, source: 'shop', desc: 'A monument to our extraterrestrial friends.' },
      { id: 'ufo',              name: 'UFO',              icon: '\uD83D\uDEF8', cost: 6000, beauty: 70, source: 'shop', desc: 'An unidentified farming object hovering silently.' },
      { id: 'holographic_tree', name: 'Holographic Tree', icon: '\uD83C\uDF34', cost: 3500, beauty: 45, source: 'shop', desc: 'A shimmering tree projected from hard light.' }
    ]
  },

  // -------------------------------------------------------
  // 10. CRYSTAL COLLECTION  --  Dungeon spoils with artifact synergy
  // -------------------------------------------------------
  crystal_collection: {
    name: 'Crystal Collection',
    icon: '\uD83D\uDC8E',
    bonus: { type: 'artifact_power', value: 0.08, desc: '+8% artifact power' },
    items: [
      { id: 'crystal_tree',          name: 'Crystal Tree',          icon: '\uD83C\uDF32', cost: 4000, beauty: 50, source: 'dungeon', desc: 'A tree with branches of pure quartz crystal.' },
      { id: 'amethyst_cluster',      name: 'Amethyst Cluster',      icon: '\uD83D\uDD2E', cost: 3000, beauty: 40, source: 'dungeon', desc: 'A jagged cluster of deep purple amethyst.' },
      { id: 'diamond_fountain',      name: 'Diamond Fountain',      icon: '\uD83D\uDCA7', cost: 5000, beauty: 60, source: 'dungeon', desc: 'Water cascades over a bed of raw diamonds.' },
      { id: 'prism_path',            name: 'Prism Path',            icon: '\uD83C\uDF08', cost: 2000, beauty: 30, source: 'dungeon', desc: 'A walkway that refracts sunlight into rainbows.' },
      { id: 'rainbow_arch',          name: 'Rainbow Arch',          icon: '\uD83C\uDF08', cost: 3500, beauty: 45, source: 'dungeon', desc: 'A dazzling arch that shifts through every hue.' },
      { id: 'crystal_cave_entrance', name: 'Crystal Cave Entrance', icon: '\uD83D\uDC8E', cost: 6000, beauty: 70, source: 'dungeon', desc: 'The glittering mouth of a gem-studded cavern.' }
    ]
  },

  // -------------------------------------------------------
  // 11. ENCHANTED FOREST  --  Magical scenery with rare drops
  // -------------------------------------------------------
  enchanted_forest: {
    name: 'Enchanted Forest',
    icon: '\uD83C\uDF33',
    bonus: { type: 'rare_drop', value: 0.05, desc: '+5% rare drop chance' },
    items: [
      { id: 'mushroom_house',   name: 'Mushroom House',   icon: '\uD83C\uDF44', cost: 3000, beauty: 40, source: 'museum', desc: 'A cosy toadstool home for woodland sprites.' },
      { id: 'fairy_circle',     name: 'Fairy Circle',     icon: '\uD83E\uDDDA', cost: 2500, beauty: 35, source: 'museum', desc: 'A ring of mushrooms humming with fey magic.' },
      { id: 'glowing_tree',     name: 'Glowing Tree',     icon: '\uD83C\uDF33', cost: 4000, beauty: 50, source: 'museum', desc: 'An ancient tree whose bark pulses with soft light.' },
      { id: 'magic_well',       name: 'Magic Well',       icon: '\u2728',       cost: 3500, beauty: 45, source: 'museum', desc: 'Toss a coin and make a wish that might come true.' },
      { id: 'enchanted_bridge', name: 'Enchanted Bridge', icon: '\uD83C\uDF09', cost: 5000, beauty: 60, source: 'museum', desc: 'A mossy stone bridge over a glimmering stream.' },
      { id: 'spirit_lantern',   name: 'Spirit Lantern',   icon: '\uD83D\uDD6F\uFE0F', cost: 2000, beauty: 30, source: 'museum', desc: 'A floating lantern guided by a gentle spirit.' }
    ]
  },

  // -------------------------------------------------------
  // 12. OMEGA SET  --  End-game prestige decorations
  // -------------------------------------------------------
  omega_set: {
    name: 'Omega Set',
    icon: '\u2734\uFE0F',
    bonus: { type: 'everything', value: 0.15, desc: '+15% to all bonuses' },
    items: [
      { id: 'omega_obelisk',    name: 'OMEGA Obelisk',    icon: '\uD83D\uDDFF',  cost: 50000, beauty: 150, source: 'ascension', desc: 'A monolith inscribed with the secrets of the cosmos.' },
      { id: 'reality_rift',     name: 'Reality Rift',     icon: '\uD83C\uDF00', cost: 40000, beauty: 130, source: 'ascension', desc: 'A tear in space-time that hums with raw energy.' },
      { id: 'dimension_portal', name: 'Dimension Portal', icon: '\uD83D\uDD73\uFE0F', cost: 60000, beauty: 170, source: 'ascension', desc: 'Step through to glimpse infinite parallel farms.' },
      { id: 'time_crystal',     name: 'Time Crystal',     icon: '\u23F3',       cost: 45000, beauty: 140, source: 'ascension', desc: 'A shard of frozen time that glows with possibility.' },
      { id: 'infinity_fountain', name: 'Infinity Fountain', icon: '\u267E\uFE0F', cost: 55000, beauty: 160, source: 'ascension', desc: 'Water flows upward in an endless loop of wonder.' },
      { id: 'cosmic_garden',    name: 'Cosmic Garden',    icon: '\uD83C\uDF0C', cost: 70000, beauty: 180, source: 'ascension', desc: 'A garden of nebulae and stardust in full bloom.' }
    ]
  }
};


// =============================================================
//  STANDALONE DECORATIONS  (30 items, not part of any set)
// =============================================================

const STANDALONE_DECORATIONS = [

  // --- Gacha / Mystery Barn (10) ---
  { id: 'golden_statue',     name: 'Golden Statue',     icon: '\uD83C\uDFC6', cost: 5000,  beauty: 50,  source: 'gacha', desc: 'A gleaming golden figure that inspires awe.' },
  { id: 'rainbow_bridge',    name: 'Rainbow Bridge',    icon: '\uD83C\uDF08', cost: 8000,  beauty: 80,  source: 'gacha', desc: 'A prismatic bridge connecting sky and earth.' },
  { id: 'crystal_mushroom',  name: 'Crystal Mushroom',  icon: '\uD83C\uDF44', cost: 3000,  beauty: 40,  source: 'gacha', desc: 'A translucent mushroom that chimes in the wind.' },
  { id: 'starfall_lamp',     name: 'Starfall Lamp',     icon: '\uD83C\uDF1F', cost: 4000,  beauty: 45,  source: 'gacha', desc: 'A lamp that catches and stores falling stars.' },
  { id: 'ancient_totem',     name: 'Ancient Totem',     icon: '\uD83D\uDDFF', cost: 6000,  beauty: 55,  source: 'gacha', desc: 'A weathered totem carved by a forgotten people.' },
  { id: 'magic_mirror',      name: 'Magic Mirror',      icon: '\uD83E\uDE9E', cost: 5000,  beauty: 50,  source: 'gacha', desc: 'Ask it a question and it might just answer.' },
  { id: 'phoenix_perch',     name: 'Phoenix Perch',     icon: '\uD83D\uDD25', cost: 7000,  beauty: 65,  source: 'gacha', desc: 'A golden perch scorched by phoenix flame.' },
  { id: 'void_orb',          name: 'Void Orb',          icon: '\u26AB',       cost: 9000,  beauty: 75,  source: 'gacha', desc: 'A sphere of absolute darkness that absorbs light.' },
  { id: 'dragon_egg_display', name: 'Dragon Egg Display', icon: '\uD83E\uDD5A', cost: 10000, beauty: 90,  source: 'gacha', desc: 'A fossilised dragon egg on a velvet cushion.' },
  { id: 'cosmic_windchime',  name: 'Cosmic Windchime',  icon: '\uD83C\uDFB6', cost: 12000, beauty: 100, source: 'gacha', desc: 'Chimes that ring with the music of the spheres.' },

  // --- Guild Shop (5) ---
  { id: 'guild_banner',       name: 'Guild Banner',       icon: '\uD83D\uDEA9', cost: 2000, beauty: 30, source: 'guild', desc: 'Fly your guild colours with pride.' },
  { id: 'war_trophy',         name: 'War Trophy',         icon: '\u2694\uFE0F',  cost: 3000, beauty: 40, source: 'guild', desc: 'A trophy from a hard-fought guild battle.' },
  { id: 'guild_garden',       name: 'Guild Garden',       icon: '\uD83C\uDF3B', cost: 4000, beauty: 50, source: 'guild', desc: 'A communal garden tended by guild members.' },
  { id: 'alliance_stone',     name: 'Alliance Stone',     icon: '\uD83E\uDEA8', cost: 5000, beauty: 55, source: 'guild', desc: 'A monument to unbreakable guild alliances.' },
  { id: 'champions_pedestal', name: "Champion's Pedestal", icon: '\uD83C\uDFC5', cost: 8000, beauty: 70, source: 'guild', desc: 'Only the guild champion may stand atop this stone.' },

  // --- Leaderboard Rewards (5) ---
  { id: 'bronze_trophy',  name: 'Bronze Trophy',  icon: '\uD83E\uDD49', cost: 1000,  beauty: 20,  source: 'leaderboard', desc: 'Third place never looked so good.' },
  { id: 'silver_trophy',  name: 'Silver Trophy',  icon: '\uD83E\uDD48', cost: 2000,  beauty: 35,  source: 'leaderboard', desc: 'A polished silver cup for the runner-up.' },
  { id: 'gold_trophy',    name: 'Gold Trophy',    icon: '\uD83E\uDD47', cost: 5000,  beauty: 60,  source: 'leaderboard', desc: 'The undisputed mark of a farming champion.' },
  { id: 'diamond_trophy', name: 'Diamond Trophy', icon: '\uD83D\uDC8E', cost: 10000, beauty: 85,  source: 'leaderboard', desc: 'A trophy forged from a single flawless diamond.' },
  { id: 'eternal_trophy', name: 'Eternal Trophy', icon: '\uD83D\uDC51', cost: 20000, beauty: 100, source: 'leaderboard', desc: 'An everlasting testament to farming greatness.' },

  // --- Crafting (5) ---
  { id: 'herb_garden_box', name: 'Herb Garden Box', icon: '\uD83C\uDF3F', cost: 500,  beauty: 15, source: 'craft', desc: 'A hand-built box of basil, thyme, and rosemary.' },
  { id: 'mosaic_path',     name: 'Mosaic Path',     icon: '\uD83C\uDFA8', cost: 800,  beauty: 20, source: 'craft', desc: 'Colourful tiles arranged in a swirling pattern.' },
  { id: 'iron_lantern',    name: 'Iron Lantern',    icon: '\uD83D\uDD6F\uFE0F', cost: 1200, beauty: 25, source: 'craft', desc: 'A wrought-iron lantern forged by hand.' },
  { id: 'gold_fountain',   name: 'Gold Fountain',   icon: '\u26F2',       cost: 3000, beauty: 45, source: 'craft', desc: 'A gilded fountain that sparkles in the sunlight.' },
  { id: 'crystal_arch',    name: 'Crystal Arch',    icon: '\uD83D\uDC8E', cost: 5000, beauty: 60, source: 'craft', desc: 'An archway of interlocking crystal shards.' },

  // --- Quest Rewards (5) ---
  { id: 'old_well',       name: 'Old Well',       icon: '\uD83E\uDEA3', cost: 300,  beauty: 10, source: 'quest', desc: 'An ancient well with stories etched into its stones.' },
  { id: 'story_signpost', name: 'Story Signpost', icon: '\uD83E\uDEA7', cost: 400,  beauty: 15, source: 'quest', desc: 'A wooden signpost pointing to legendary locations.' },
  { id: 'npc_memorial',   name: 'NPC Memorial',   icon: '\uD83D\uDDFF', cost: 600,  beauty: 20, source: 'quest', desc: 'A statue honouring a beloved village character.' },
  { id: 'legend_stone',   name: 'Legend Stone',   icon: '\uD83D\uDCDC', cost: 1000, beauty: 30, source: 'quest', desc: 'A runestone inscribed with an old farming legend.' },
  { id: 'hero_monument',  name: 'Hero Monument',  icon: '\uD83C\uDFF4', cost: 2000, beauty: 40, source: 'quest', desc: 'A grand monument to the bravest farmer of all.' }
];


// =============================================================
//  DECORATION SOURCES  --  Human-readable source labels
// =============================================================

const DECORATION_SOURCES = {
  shop:        'Shop',
  gacha:       'Mystery Barn',
  guild:       'Guild Shop',
  leaderboard: 'Leaderboard',
  craft:       'Crafting',
  quest:       'Quest Reward',
  event:       'Seasonal Event',
  achievement: 'Achievements',
  dungeon:     'Dungeon Rewards',
  museum:      'Museum Rewards',
  ascension:   'Ascension Rewards'
};


// =============================================================
//  HELPERS
// =============================================================

/**
 * Returns the total number of decorations defined in this module.
 * @returns {number}
 */
function getTotalDecorationCount() {
  const setItemCount = Object.values(DECORATION_SETS)
    .reduce((sum, set) => sum + set.items.length, 0);
  return setItemCount + STANDALONE_DECORATIONS.length;
}

/**
 * Finds a decoration by its unique id across all sets and standalone items.
 * @param {string} id
 * @returns {object|null}
 */
function findDecorationById(id) {
  for (const set of Object.values(DECORATION_SETS)) {
    const found = set.items.find(item => item.id === id);
    if (found) return { ...found, setKey: Object.keys(DECORATION_SETS).find(k => DECORATION_SETS[k] === set) };
  }
  const standalone = STANDALONE_DECORATIONS.find(item => item.id === id);
  if (standalone) return { ...standalone, setKey: null };
  return null;
}

/**
 * Returns all decorations available from a given source.
 * @param {string} sourceKey  A key from DECORATION_SOURCES
 * @returns {object[]}
 */
function getDecorationsBySource(sourceKey) {
  const results = [];
  for (const set of Object.values(DECORATION_SETS)) {
    results.push(...set.items.filter(item => item.source === sourceKey));
  }
  results.push(...STANDALONE_DECORATIONS.filter(item => item.source === sourceKey));
  return results;
}


// =============================================================
//  BACKWARD-COMPATIBLE FLAT LOOKUP
//  Game code expects DECORATIONS_DATA[id] with: id, name, icon,
//  cost, costType, category, unlockLevel, beautyScore, description
// =============================================================

const DECORATIONS_DATA = {};

// Map source → category for backward compat
const _srcToCat = {
  shop: 'garden', gacha: 'special', guild: 'special',
  leaderboard: 'special', craft: 'furniture', quest: 'furniture',
  event: 'seasonal', achievement: 'special', dungeon: 'exotic',
  museum: 'celestial', ascension: 'celestial'
};

// Build from sets
Object.entries(DECORATION_SETS).forEach(([setKey, set]) => {
  set.items.forEach(item => {
    DECORATIONS_DATA[item.id] = {
      id: item.id, name: item.name, icon: item.icon,
      cost: item.cost, costType: 'coins',
      category: _srcToCat[item.source] || 'special',
      unlockLevel: 1, beautyScore: item.beauty,
      description: item.desc, set: setKey
    };
  });
});

// Build from standalone
STANDALONE_DECORATIONS.forEach(item => {
  DECORATIONS_DATA[item.id] = {
    id: item.id, name: item.name, icon: item.icon,
    cost: item.cost, costType: item.cost >= 10000 ? 'gems' : 'coins',
    category: _srcToCat[item.source] || 'special',
    unlockLevel: 1, beautyScore: item.beauty,
    description: item.desc
  };
});

const DECORATION_CATEGORIES = {
  fences: { name: 'Fences & Walls', icon: '🪵' },
  paths: { name: 'Paths & Roads', icon: '🟫' },
  garden: { name: 'Garden & Flowers', icon: '🌹' },
  furniture: { name: 'Furniture & Outdoor', icon: '🪑' },
  special: { name: 'Special & Premium', icon: '⭐' },
  seasonal: { name: 'Seasonal', icon: '🎃' },
  exotic: { name: 'Exotic', icon: '🌴' },
  celestial: { name: 'Celestial', icon: '✨' }
};
