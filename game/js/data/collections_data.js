/**
 * collections_data.js
 *
 * Museum collection data for the farm simulation.
 * 10 collection categories, 90 total items.
 *
 * Rarity drop rates (approximate, when source triggers):
 *   common     ~60%
 *   uncommon   ~30%
 *   rare       ~15%
 *   epic       ~5%
 *   legendary  ~1%
 */

const COLLECTIONS_DATA = {

  // ── 1. Butterflies (10 items) ─────────────────────────────────────────
  butterflies: {
    name: 'Butterflies',
    icon: '🦋',
    room: 'Butterfly Garden',
    completionReward: {
      coins: 10000,
      gems: 10,
      bonus: { type: 'cropBeauty', value: 0.10 },
      title: 'Lepidopterist'
    },
    items: [
      {
        id: 'monarch',
        name: 'Monarch',
        icon: '🦋',
        rarity: 'common',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'Orange and black wings that signal a long migration ahead.'
      },
      {
        id: 'swallowtail',
        name: 'Swallowtail',
        icon: '🦋',
        rarity: 'common',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'Elegant tailed wings that flutter gracefully in the breeze.'
      },
      {
        id: 'blue_morpho',
        name: 'Blue Morpho',
        icon: '🦋',
        rarity: 'uncommon',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'Iridescent blue wings that shimmer like liquid sapphire.'
      },
      {
        id: 'painted_lady',
        name: 'Painted Lady',
        icon: '🦋',
        rarity: 'common',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'Delicate orange-brown patterns resembling a watercolor painting.'
      },
      {
        id: 'luna_moth',
        name: 'Luna Moth',
        icon: '🦋',
        rarity: 'uncommon',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'Pale green wings with long trailing tails. Appears at night.'
      },
      {
        id: 'atlas_moth',
        name: 'Atlas Moth',
        icon: '🦋',
        rarity: 'rare',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'One of the largest moths in the world. Wingtips mimic snake heads.'
      },
      {
        id: 'glasswing',
        name: 'Glasswing',
        icon: '🦋',
        rarity: 'rare',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'Transparent wings that make it nearly invisible in flight.'
      },
      {
        id: 'emperor',
        name: 'Emperor',
        icon: '🦋',
        rarity: 'epic',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'A regal purple butterfly that only graces the finest gardens.'
      },
      {
        id: 'birdwing',
        name: 'Birdwing',
        icon: '🦋',
        rarity: 'epic',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'Massive wingspan rivals small birds. A collector\'s dream.'
      },
      {
        id: 'golden_butterfly',
        name: 'Golden Butterfly',
        icon: '🦋',
        rarity: 'legendary',
        source: 'Random spawn near flowers and growing crops. Tap to catch.',
        desc: 'Wings of pure gold dust. Legends say it grants wishes.'
      }
    ]
  },

  // ── 2. Fossils (8 items) ──────────────────────────────────────────────
  fossils: {
    name: 'Fossils',
    icon: '🦴',
    room: 'Fossil Hall',
    completionReward: {
      coins: 15000,
      gems: 12,
      bonus: { type: 'oreMiningYield', value: 0.10 },
      title: 'Paleontologist'
    },
    items: [
      {
        id: 'ammonite',
        name: 'Ammonite',
        icon: '🐚',
        rarity: 'common',
        source: 'Found clearing rocks, digging new plots, or mining ore.',
        desc: 'A spiral-shelled sea creature from millions of years ago.'
      },
      {
        id: 'trilobite',
        name: 'Trilobite',
        icon: '🪨',
        rarity: 'common',
        source: 'Found clearing rocks, digging new plots, or mining ore.',
        desc: 'An ancient armored arthropod preserved perfectly in stone.'
      },
      {
        id: 'fern_fossil',
        name: 'Fern Fossil',
        icon: '🌿',
        rarity: 'uncommon',
        source: 'Found clearing rocks, digging new plots, or mining ore.',
        desc: 'Delicate fern fronds imprinted in shale. A window to prehistory.'
      },
      {
        id: 'fish_fossil',
        name: 'Fish Fossil',
        icon: '🐟',
        rarity: 'uncommon',
        source: 'Found clearing rocks, digging new plots, or mining ore.',
        desc: 'A complete fish skeleton frozen in time within limestone.'
      },
      {
        id: 'amber',
        name: 'Amber',
        icon: '🟠',
        rarity: 'rare',
        source: 'Found clearing rocks, digging new plots, or mining ore.',
        desc: 'Golden tree resin trapping a tiny insect from another era.'
      },
      {
        id: 'dinosaur_tooth',
        name: 'Dinosaur Tooth',
        icon: '🦷',
        rarity: 'rare',
        source: 'Found clearing rocks, digging new plots, or mining ore.',
        desc: 'A massive serrated tooth from a fearsome predator long gone.'
      },
      {
        id: 'petrified_wood',
        name: 'Petrified Wood',
        icon: '🪵',
        rarity: 'epic',
        source: 'Found clearing rocks, digging new plots, or mining ore.',
        desc: 'An entire tree trunk turned to colorful crystalline stone.'
      },
      {
        id: 'crystal_skull',
        name: 'Crystal Skull',
        icon: '💀',
        rarity: 'legendary',
        source: 'Found clearing rocks, digging new plots, or mining ore.',
        desc: 'A skull carved from pure quartz. Its origin remains a mystery.'
      }
    ]
  },

  // ── 3. Gemstones (10 items) ───────────────────────────────────────────
  gemstones: {
    name: 'Gemstones',
    icon: '💎',
    room: 'Gem Vault',
    completionReward: {
      coins: 20000,
      gems: 15,
      bonus: { type: 'jewelerOutput', value: 0.10 },
      title: 'Gem Collector'
    },
    items: [
      {
        id: 'ruby',
        name: 'Ruby',
        icon: '🔴',
        rarity: 'common',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'A fiery red gem that pulses with inner warmth.'
      },
      {
        id: 'sapphire',
        name: 'Sapphire',
        icon: '🔵',
        rarity: 'common',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'Deep ocean blue, cool to the touch even in sunlight.'
      },
      {
        id: 'emerald',
        name: 'Emerald',
        icon: '🟢',
        rarity: 'uncommon',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'A lush green stone said to bring prosperity to farms.'
      },
      {
        id: 'diamond',
        name: 'Diamond',
        icon: '💎',
        rarity: 'uncommon',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'Unbreakable brilliance. Refracts light into a thousand rainbows.'
      },
      {
        id: 'amethyst',
        name: 'Amethyst',
        icon: '🟣',
        rarity: 'rare',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'Royal purple crystal once believed to ward off bad harvests.'
      },
      {
        id: 'topaz',
        name: 'Topaz',
        icon: '🟡',
        rarity: 'rare',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'Warm golden gem that glows faintly at dusk.'
      },
      {
        id: 'opal',
        name: 'Opal',
        icon: '🌈',
        rarity: 'epic',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'Swirling colors dance beneath a milky surface. Mesmerizing.'
      },
      {
        id: 'jade',
        name: 'Jade',
        icon: '🟩',
        rarity: 'epic',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'Smooth green stone revered for centuries as a symbol of luck.'
      },
      {
        id: 'moonstone',
        name: 'Moonstone',
        icon: '🌙',
        rarity: 'epic',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'Ethereal glow shifts across its surface like captured moonlight.'
      },
      {
        id: 'stardiamond',
        name: 'Stardiamond',
        icon: '⭐',
        rarity: 'legendary',
        source: 'Smelter byproduct, dungeon rewards, or mining.',
        desc: 'Born from a dying star. Contains the light of an entire galaxy.'
      }
    ]
  },

  // ── 4. Fish (12 items) ────────────────────────────────────────────────
  fish: {
    name: 'Fish',
    icon: '🐟',
    room: 'Aquarium Wing',
    completionReward: {
      coins: 25000,
      gems: 15,
      bonus: { type: 'fishingRewards', value: 0.15 },
      title: 'Master Angler'
    },
    items: [
      {
        id: 'trout',
        name: 'Trout',
        icon: '🐟',
        rarity: 'common',
        source: 'Fishing Pond mini-game.',
        desc: 'A speckled freshwater staple. Every angler\'s first catch.'
      },
      {
        id: 'salmon',
        name: 'Salmon',
        icon: '🐟',
        rarity: 'common',
        source: 'Fishing Pond mini-game.',
        desc: 'Silver-pink and determined. Swims upstream without rest.'
      },
      {
        id: 'catfish',
        name: 'Catfish',
        icon: '🐟',
        rarity: 'common',
        source: 'Fishing Pond mini-game.',
        desc: 'Whiskered bottom-feeder that prefers muddy waters.'
      },
      {
        id: 'bass',
        name: 'Bass',
        icon: '🐟',
        rarity: 'uncommon',
        source: 'Fishing Pond mini-game.',
        desc: 'A strong fighter on the line. Prized by sport fishers.'
      },
      {
        id: 'koi',
        name: 'Koi',
        icon: '🐟',
        rarity: 'uncommon',
        source: 'Fishing Pond mini-game.',
        desc: 'Ornamental beauty with vivid orange and white patterns.'
      },
      {
        id: 'pufferfish',
        name: 'Pufferfish',
        icon: '🐡',
        rarity: 'rare',
        source: 'Fishing Pond mini-game.',
        desc: 'Inflates when startled. Adorable but surprisingly dangerous.'
      },
      {
        id: 'swordfish',
        name: 'Swordfish',
        icon: '🐟',
        rarity: 'rare',
        source: 'Fishing Pond mini-game.',
        desc: 'A lightning-fast predator with a blade-like snout.'
      },
      {
        id: 'electric_eel',
        name: 'Electric Eel',
        icon: '🐍',
        rarity: 'epic',
        source: 'Fishing Pond mini-game.',
        desc: 'Generates shocking voltage. Handle with rubber gloves.'
      },
      {
        id: 'anglerfish',
        name: 'Anglerfish',
        icon: '🐟',
        rarity: 'epic',
        source: 'Fishing Pond mini-game.',
        desc: 'Deep-sea horror with a glowing lure. How did it get here?'
      },
      {
        id: 'starfish',
        name: 'Starfish',
        icon: '⭐',
        rarity: 'epic',
        source: 'Fishing Pond mini-game.',
        desc: 'Five perfect arms. Can regenerate from almost any injury.'
      },
      {
        id: 'whale_shark',
        name: 'Whale Shark',
        icon: '🦈',
        rarity: 'legendary',
        source: 'Fishing Pond mini-game.',
        desc: 'Gentle giant of the deep. Barely fits in the display tank.'
      },
      {
        id: 'ghost_fish',
        name: 'Ghost Fish',
        icon: '👻',
        rarity: 'legendary',
        source: 'Fishing Pond mini-game.',
        desc: 'Translucent and ethereal. Some say it doesn\'t truly exist.'
      }
    ]
  },

  // ── 5. Rare Seeds (8 items) ───────────────────────────────────────────
  rare_seeds: {
    name: 'Rare Seeds',
    icon: '🌱',
    room: 'Seed Vault',
    completionReward: {
      coins: 30000,
      gems: 20,
      bonus: { type: 'allSeedGrowth', value: 0.10 },
      title: 'Seed Vault'
    },
    items: [
      {
        id: 'rainbow_seed',
        name: 'Rainbow Seed',
        icon: '🌈',
        rarity: 'uncommon',
        source: 'Gacha, dungeon rewards, or prestige milestones.',
        desc: 'Shimmers with every color. What it grows is always a surprise.'
      },
      {
        id: 'shadow_seed',
        name: 'Shadow Seed',
        icon: '🖤',
        rarity: 'uncommon',
        source: 'Gacha, dungeon rewards, or prestige milestones.',
        desc: 'Absorbs light around it. Thrives in total darkness.'
      },
      {
        id: 'crystal_seed',
        name: 'Crystal Seed',
        icon: '🔮',
        rarity: 'rare',
        source: 'Gacha, dungeon rewards, or prestige milestones.',
        desc: 'Hard as diamond. The plant it produces is made of living glass.'
      },
      {
        id: 'ancient_seed',
        name: 'Ancient Seed',
        icon: '🏺',
        rarity: 'rare',
        source: 'Gacha, dungeon rewards, or prestige milestones.',
        desc: 'Dormant for millennia. Still viable after all this time.'
      },
      {
        id: 'void_seed',
        name: 'Void Seed',
        icon: '🕳️',
        rarity: 'epic',
        source: 'Gacha, dungeon rewards, or prestige milestones.',
        desc: 'Pulled from the space between worlds. Radiates cold silence.'
      },
      {
        id: 'time_seed',
        name: 'Time Seed',
        icon: '⏳',
        rarity: 'epic',
        source: 'Gacha, dungeon rewards, or prestige milestones.',
        desc: 'Ages and de-ages in a loop. Plant it and watch time bend.'
      },
      {
        id: 'cosmic_seed',
        name: 'Cosmic Seed',
        icon: '🌌',
        rarity: 'epic',
        source: 'Gacha, dungeon rewards, or prestige milestones.',
        desc: 'Contains a miniature nebula. Grows crops from starlight.'
      },
      {
        id: 'omega_seed',
        name: 'OMEGA Seed',
        icon: '🔱',
        rarity: 'legendary',
        source: 'Gacha, dungeon rewards, or prestige milestones.',
        desc: 'The final seed. Said to grow the crop that ends all hunger.'
      }
    ]
  },

  // ── 6. Ancient Relics (8 items) ───────────────────────────────────────
  ancient_relics: {
    name: 'Ancient Relics',
    icon: '🏺',
    room: 'Relic Chamber',
    completionReward: {
      coins: 35000,
      gems: 20,
      bonus: { type: 'artifactPower', value: 0.10 },
      title: 'Archaeologist'
    },
    items: [
      {
        id: 'bronze_coin',
        name: 'Bronze Coin',
        icon: '🪙',
        rarity: 'common',
        source: 'Story quests, dungeon boss drops, or guild raids.',
        desc: 'Worn and tarnished. Bears the face of a forgotten ruler.'
      },
      {
        id: 'clay_tablet',
        name: 'Clay Tablet',
        icon: '📜',
        rarity: 'common',
        source: 'Story quests, dungeon boss drops, or guild raids.',
        desc: 'Cuneiform script tells of ancient farming techniques.'
      },
      {
        id: 'stone_idol',
        name: 'Stone Idol',
        icon: '🗿',
        rarity: 'uncommon',
        source: 'Story quests, dungeon boss drops, or guild raids.',
        desc: 'A small carved figure depicting an unknown harvest deity.'
      },
      {
        id: 'golden_amulet',
        name: 'Golden Amulet',
        icon: '📿',
        rarity: 'rare',
        source: 'Story quests, dungeon boss drops, or guild raids.',
        desc: 'Warm to the touch. Faint runes glow when held under moonlight.'
      },
      {
        id: 'crystal_orb',
        name: 'Crystal Orb',
        icon: '🔮',
        rarity: 'rare',
        source: 'Story quests, dungeon boss drops, or guild raids.',
        desc: 'Swirling mists inside reveal glimpses of possible futures.'
      },
      {
        id: 'enchanted_scroll',
        name: 'Enchanted Scroll',
        icon: '📜',
        rarity: 'epic',
        source: 'Story quests, dungeon boss drops, or guild raids.',
        desc: 'The ink rearranges itself each time you unroll it.'
      },
      {
        id: 'dragon_medallion',
        name: 'Dragon Medallion',
        icon: '🐉',
        rarity: 'epic',
        source: 'Story quests, dungeon boss drops, or guild raids.',
        desc: 'Scales of a real dragon fused into a medallion of power.'
      },
      {
        id: 'infinity_key',
        name: 'Infinity Key',
        icon: '🗝️',
        rarity: 'legendary',
        source: 'Story quests, dungeon boss drops, or guild raids.',
        desc: 'Opens every lock that ever was or ever will be.'
      }
    ]
  },

  // ── 7. Animal Prints (10 items) ───────────────────────────────────────
  animal_prints: {
    name: 'Animal Prints',
    icon: '🐾',
    room: 'Naturalist Gallery',
    completionReward: {
      coins: 20000,
      gems: 15,
      bonus: { type: 'animalHappiness', value: 0.10 },
      title: 'Tracker'
    },
    items: [
      {
        id: 'feather',
        name: 'Feather',
        icon: '🪶',
        rarity: 'common',
        source: 'Random drop when collecting from animals.',
        desc: 'Soft and light. Could belong to any number of birds.'
      },
      {
        id: 'paw_print',
        name: 'Paw Print',
        icon: '🐾',
        rarity: 'common',
        source: 'Random drop when collecting from animals.',
        desc: 'A perfect impression pressed into soft mud.'
      },
      {
        id: 'hoof_print',
        name: 'Hoof Print',
        icon: '🐾',
        rarity: 'common',
        source: 'Random drop when collecting from animals.',
        desc: 'Deep and heavy. A horse or cow passed through here.'
      },
      {
        id: 'claw_mark',
        name: 'Claw Mark',
        icon: '🐾',
        rarity: 'uncommon',
        source: 'Random drop when collecting from animals.',
        desc: 'Three sharp gouges in bark. Something wild was here.'
      },
      {
        id: 'wing_pattern',
        name: 'Wing Pattern',
        icon: '🪶',
        rarity: 'uncommon',
        source: 'Random drop when collecting from animals.',
        desc: 'A dust imprint left by an outstretched wing on glass.'
      },
      {
        id: 'scale',
        name: 'Scale',
        icon: '🐍',
        rarity: 'rare',
        source: 'Random drop when collecting from animals.',
        desc: 'Iridescent and tough. Shed by a reptile in passing.'
      },
      {
        id: 'tooth',
        name: 'Tooth',
        icon: '🦷',
        rarity: 'rare',
        source: 'Random drop when collecting from animals.',
        desc: 'Sharp and curved. The previous owner didn\'t need it anymore.'
      },
      {
        id: 'fur_sample',
        name: 'Fur Sample',
        icon: '🧶',
        rarity: 'epic',
        source: 'Random drop when collecting from animals.',
        desc: 'Impossibly soft tuft. The animal it came from is rarely seen.'
      },
      {
        id: 'egg_shell',
        name: 'Egg Shell',
        icon: '🥚',
        rarity: 'epic',
        source: 'Random drop when collecting from animals.',
        desc: 'Speckled and delicate. Something extraordinary hatched here.'
      },
      {
        id: 'dragon_print',
        name: 'Dragon Print',
        icon: '🐉',
        rarity: 'legendary',
        source: 'Random drop when collecting from animals.',
        desc: 'Scorched earth in the shape of a massive claw. Unmistakable.'
      }
    ]
  },

  // ── 8. Weather Crystals (6 items) ─────────────────────────────────────
  weather_crystals: {
    name: 'Weather Crystals',
    icon: '🌦️',
    room: 'Weather Observatory',
    completionReward: {
      coins: 15000,
      gems: 12,
      bonus: { type: 'weatherBonusEffects', value: 0.10 },
      title: 'Storm Chaser'
    },
    items: [
      {
        id: 'sun_shard',
        name: 'Sun Shard',
        icon: '☀️',
        rarity: 'uncommon',
        source: 'Collected during sunny weather events.',
        desc: 'A sliver of concentrated sunlight. Warm in any season.'
      },
      {
        id: 'rain_drop',
        name: 'Rain Drop',
        icon: '💧',
        rarity: 'uncommon',
        source: 'Collected during rainy weather events.',
        desc: 'A single raindrop that never evaporates. Always cool.'
      },
      {
        id: 'snow_crystal',
        name: 'Snow Crystal',
        icon: '❄️',
        rarity: 'rare',
        source: 'Collected during snowy weather events.',
        desc: 'A perfectly symmetrical snowflake that never melts.'
      },
      {
        id: 'lightning_bolt',
        name: 'Lightning Bolt',
        icon: '⚡',
        rarity: 'rare',
        source: 'Collected during thunderstorm weather events.',
        desc: 'Frozen electricity. Crackles and hums when held close.'
      },
      {
        id: 'rainbow_fragment',
        name: 'Rainbow Fragment',
        icon: '🌈',
        rarity: 'epic',
        source: 'Collected during rainbow weather events.',
        desc: 'A solid piece of rainbow. Refracts light endlessly.'
      },
      {
        id: 'void_storm',
        name: 'Void Storm',
        icon: '🌀',
        rarity: 'legendary',
        source: 'Collected during the rarest void storm weather event.',
        desc: 'A swirling tempest trapped in crystal. Reality bends around it.'
      }
    ]
  },

  // ── 9. Recipe Scrolls (8 items) ───────────────────────────────────────
  recipe_scrolls: {
    name: 'Recipe Scrolls',
    icon: '📜',
    room: 'Artisan Library',
    completionReward: {
      coins: 25000,
      gems: 18,
      bonus: { type: 'allRecipeSpeed', value: 0.10 },
      title: 'Recipe Master'
    },
    items: [
      {
        id: 'bakers_secret',
        name: "Baker's Secret",
        icon: '🍞',
        rarity: 'common',
        source: 'Rare drop from production buildings.',
        desc: 'The key to the perfect crust. Bakers guard it with their lives.'
      },
      {
        id: 'dairy_master',
        name: 'Dairy Master',
        icon: '🧀',
        rarity: 'common',
        source: 'Rare drop from production buildings.',
        desc: 'Techniques for aging cheese to absolute perfection.'
      },
      {
        id: 'brewers_trick',
        name: "Brewer's Trick",
        icon: '🍺',
        rarity: 'uncommon',
        source: 'Rare drop from production buildings.',
        desc: 'A fermentation shortcut known only to master brewers.'
      },
      {
        id: 'weavers_knot',
        name: "Weaver's Knot",
        icon: '🧵',
        rarity: 'rare',
        source: 'Rare drop from production buildings.',
        desc: 'A legendary knot that makes any fabric twice as strong.'
      },
      {
        id: 'chefs_kiss',
        name: "Chef's Kiss",
        icon: '👨‍🍳',
        rarity: 'rare',
        source: 'Rare drop from production buildings.',
        desc: 'The final flourish that elevates any dish to a masterpiece.'
      },
      {
        id: 'alchemists_note',
        name: "Alchemist's Note",
        icon: '⚗️',
        rarity: 'epic',
        source: 'Rare drop from production buildings.',
        desc: 'Scrawled formulas for turning base metals into something more.'
      },
      {
        id: 'jewelers_eye',
        name: "Jeweler's Eye",
        icon: '👁️',
        rarity: 'epic',
        source: 'Rare drop from production buildings.',
        desc: 'Instructions for cutting gems with supernatural precision.'
      },
      {
        id: 'omega_recipe',
        name: 'OMEGA Recipe',
        icon: '📖',
        rarity: 'legendary',
        source: 'Rare drop from production buildings.',
        desc: 'The recipe to end all recipes. Contains every secret ever written.'
      }
    ]
  },

  // ── 10. Cosmic Artifacts (10 items) ───────────────────────────────────
  cosmic_artifacts: {
    name: 'Cosmic Artifacts',
    icon: '🌌',
    room: 'Planetarium',
    completionReward: {
      coins: 50000,
      gems: 30,
      bonus: { type: 'everythingCosmic', value: 0.15 },
      title: 'Cosmic Collector'
    },
    items: [
      {
        id: 'star_map',
        name: 'Star Map',
        icon: '🗺️',
        rarity: 'common',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'Charts constellations visible only from your farm at midnight.'
      },
      {
        id: 'moon_rock',
        name: 'Moon Rock',
        icon: '🌑',
        rarity: 'common',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'Grey and porous. Lighter than it looks. Smells like nothing.'
      },
      {
        id: 'solar_flare_jar',
        name: 'Solar Flare Jar',
        icon: '🌞',
        rarity: 'uncommon',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'Bottled plasma from the sun. Do not open indoors.'
      },
      {
        id: 'nebula_in_a_bottle',
        name: 'Nebula in a Bottle',
        icon: '🌌',
        rarity: 'uncommon',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'Swirling cosmic gas clouds condensed into a small flask.'
      },
      {
        id: 'black_hole_shard',
        name: 'Black Hole Shard',
        icon: '🕳️',
        rarity: 'rare',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'Impossibly dense fragment. Bends light around your fingers.'
      },
      {
        id: 'quantum_crystal',
        name: 'Quantum Crystal',
        icon: '💠',
        rarity: 'rare',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'Exists in multiple states simultaneously. Don\'t observe too hard.'
      },
      {
        id: 'time_loop_fragment',
        name: 'Time Loop Fragment',
        icon: '⏳',
        rarity: 'epic',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'A splinter of a broken time loop. Repeats the last second forever.'
      },
      {
        id: 'dimension_key',
        name: 'Dimension Key',
        icon: '🔑',
        rarity: 'epic',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'Unlocks doors to parallel realities. Use with extreme caution.'
      },
      {
        id: 'reality_anchor',
        name: 'Reality Anchor',
        icon: '⚓',
        rarity: 'epic',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'Keeps the fabric of spacetime from unraveling. Rather important.'
      },
      {
        id: 'the_singularity',
        name: 'The Singularity',
        icon: '✨',
        rarity: 'legendary',
        source: 'Space world, cosmic crops/animals, or ascension rewards.',
        desc: 'The point where all things converge. The rarest artifact in existence.'
      }
    ]
  }
};

/**
 * Reward granted when a player completes the entire museum
 * (all 10 collections, all 90 items donated).
 */
const MUSEUM_COMPLETION_REWARD = {
  coins: 1000000,
  gems: 500,
  title: 'Curator',
  decoration: 'animated_museum',
  desc: 'You completed the entire museum collection!'
};
