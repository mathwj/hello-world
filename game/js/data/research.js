/**
 * Research Tree Data
 *
 * Complete research tree for the farm simulation game.
 * 70 nodes across 7 branches: Agriculture, Animal Husbandry, Industry,
 * Automation, Economics, Prestige Power, and Cosmic.
 *
 * Cost formula: baseCost * Math.pow(1.5, level)
 */

const RESEARCH_TREE = {

  // ─────────────────────────────────────────────
  //  AGRICULTURE BRANCH  (12 nodes, baseCost 100)
  // ─────────────────────────────────────────────
  agriculture: {
    name: 'Agriculture',
    icon: '🌾',
    baseCost: 100,
    nodes: [
      {
        id: 'fertile_soil',
        name: 'Fertile Soil',
        icon: '🌱',
        maxLevel: 20,
        effectPerLevel: 3,
        effectType: 'crop_growth_speed',
        description: '+3% crop growth speed per level',
        prereqs: []
      },
      {
        id: 'rich_harvest',
        name: 'Rich Harvest',
        icon: '💰',
        maxLevel: 20,
        effectPerLevel: 5,
        effectType: 'crop_sell_value',
        description: '+5% crop sell value per level',
        prereqs: [{ nodeId: 'fertile_soil', level: 5 }]
      },
      {
        id: 'double_sprout',
        name: 'Double Sprout',
        icon: '🌿',
        maxLevel: 15,
        effectPerLevel: 2,
        effectType: 'double_harvest_chance',
        description: '+2% double harvest chance per level',
        prereqs: [{ nodeId: 'fertile_soil', level: 10 }]
      },
      {
        id: 'seed_mastery',
        name: 'Seed Mastery',
        icon: '🌰',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'seed_cost_reduction',
        description: '-5% seed cost per level',
        prereqs: [{ nodeId: 'rich_harvest', level: 5 }]
      },
      {
        id: 'quick_replant',
        name: 'Quick Replant',
        icon: '♻️',
        maxLevel: 15,
        effectPerLevel: 4,
        effectType: 'auto_replant_chance',
        description: '+4% auto-replant chance per level',
        prereqs: [{ nodeId: 'double_sprout', level: 5 }]
      },
      {
        id: 'photosynthesis',
        name: 'Photosynthesis',
        icon: '☀️',
        maxLevel: 10,
        effectPerLevel: 1,
        effectType: 'passive_coins_while_growing',
        description: '+1% coins while crops are growing per level',
        prereqs: [{ nodeId: 'rich_harvest', level: 10 }]
      },
      {
        id: 'hybrid_vigor',
        name: 'Hybrid Vigor',
        icon: '🧬',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'crop_xp_bonus',
        description: '+5% XP from crops per level',
        prereqs: [{ nodeId: 'seed_mastery', level: 5 }]
      },
      {
        id: 'mega_fertilizer',
        name: 'Mega Fertilizer',
        icon: '💊',
        maxLevel: 10,
        effectPerLevel: 8,
        effectType: 'tier4_plus_crop_speed',
        description: '+8% speed for Tier 4+ crops per level',
        prereqs: [{ nodeId: 'quick_replant', level: 10 }]
      },
      {
        id: 'weather_resist',
        name: 'Weather Resist',
        icon: '🌤️',
        maxLevel: 5,
        effectPerLevel: 10,
        effectType: 'negative_weather_reduction',
        description: '-10% negative weather effects per level',
        prereqs: [{ nodeId: 'photosynthesis', level: 5 }]
      },
      {
        id: 'evolution_catalyst',
        name: 'Evolution Catalyst',
        icon: '⚗️',
        maxLevel: 10,
        effectPerLevel: 3,
        effectType: 'evolution_speed',
        description: '+3% evolution speed per level',
        prereqs: [{ nodeId: 'mega_fertilizer', level: 5 }]
      },
      {
        id: 'quantum_seeds',
        name: 'Quantum Seeds',
        icon: '🔮',
        maxLevel: 5,
        effectPerLevel: 5,
        effectType: 'skip_growth_stage_chance',
        description: '5% chance to skip a growth stage per level',
        prereqs: [{ nodeId: 'evolution_catalyst', level: 5 }]
      },
      {
        id: 'harvest_singularity',
        name: 'Harvest Singularity',
        icon: '🌟',
        maxLevel: 1,
        effectPerLevel: 90,
        effectType: 'all_crop_timer_reduction',
        description: 'Capstone: ALL crop timers reduced by 90%',
        prereqs: [
          { nodeId: 'fertile_soil', level: 20 },
          { nodeId: 'rich_harvest', level: 20 },
          { nodeId: 'double_sprout', level: 15 },
          { nodeId: 'seed_mastery', level: 10 },
          { nodeId: 'quick_replant', level: 15 },
          { nodeId: 'photosynthesis', level: 10 },
          { nodeId: 'hybrid_vigor', level: 10 },
          { nodeId: 'mega_fertilizer', level: 10 },
          { nodeId: 'weather_resist', level: 5 },
          { nodeId: 'evolution_catalyst', level: 10 },
          { nodeId: 'quantum_seeds', level: 5 }
        ]
      }
    ]
  },

  // ─────────────────────────────────────────────────
  //  ANIMAL HUSBANDRY BRANCH  (12 nodes, baseCost 100)
  // ─────────────────────────────────────────────────
  animal_husbandry: {
    name: 'Animal Husbandry',
    icon: '🐄',
    baseCost: 100,
    nodes: [
      {
        id: 'better_feed',
        name: 'Better Feed',
        icon: '🥬',
        maxLevel: 20,
        effectPerLevel: 3,
        effectType: 'animal_production_speed',
        description: '+3% animal production speed per level',
        prereqs: []
      },
      {
        id: 'premium_products',
        name: 'Premium Products',
        icon: '⭐',
        maxLevel: 20,
        effectPerLevel: 5,
        effectType: 'animal_product_value',
        description: '+5% animal product value per level',
        prereqs: [{ nodeId: 'better_feed', level: 5 }]
      },
      {
        id: 'happy_animals',
        name: 'Happy Animals',
        icon: '❤️',
        maxLevel: 15,
        effectPerLevel: 4,
        effectType: 'happiness_retention',
        description: '+4% happiness retention per level',
        prereqs: [{ nodeId: 'better_feed', level: 10 }]
      },
      {
        id: 'breeding',
        name: 'Breeding',
        icon: '🐣',
        maxLevel: 10,
        effectPerLevel: 2,
        effectType: 'bonus_product_chance',
        description: '+2% bonus product chance per level',
        prereqs: [{ nodeId: 'premium_products', level: 5 }]
      },
      {
        id: 'gentle_touch',
        name: 'Gentle Touch',
        icon: '🤲',
        maxLevel: 15,
        effectPerLevel: 3,
        effectType: 'product_quality_bonus',
        description: '+3% product quality bonus per level',
        prereqs: [{ nodeId: 'happy_animals', level: 5 }]
      },
      {
        id: 'herd_mentality',
        name: 'Herd Mentality',
        icon: '🐏',
        maxLevel: 10,
        effectPerLevel: 1,
        effectType: 'same_type_bonus',
        description: '+1% bonus per same type owned per level',
        prereqs: [{ nodeId: 'breeding', level: 5 }]
      },
      {
        id: 'natural_diet',
        name: 'Natural Diet',
        icon: '🥗',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'feed_cost_reduction',
        description: '-5% feed cost per level',
        prereqs: [{ nodeId: 'premium_products', level: 10 }]
      },
      {
        id: 'evolution_instinct',
        name: 'Evolution Instinct',
        icon: '🧬',
        maxLevel: 10,
        effectPerLevel: 3,
        effectType: 'animal_evolution_speed',
        description: '+3% evolution speed for animals per level',
        prereqs: [{ nodeId: 'gentle_touch', level: 10 }]
      },
      {
        id: 'alpha_bonus',
        name: 'Alpha Bonus',
        icon: '👑',
        maxLevel: 5,
        effectPerLevel: 2,
        effectType: 'highest_tier_aura',
        description: 'Highest-tier animal gives +2% to all others per level',
        prereqs: [{ nodeId: 'herd_mentality', level: 5 }]
      },
      {
        id: 'wild_call',
        name: 'Wild Call',
        icon: '🐺',
        maxLevel: 5,
        effectPerLevel: 3,
        effectType: 'double_product_chance',
        description: '3% chance for 2x product per level',
        prereqs: [{ nodeId: 'evolution_instinct', level: 5 }]
      },
      {
        id: 'mythic_bond',
        name: 'Mythic Bond',
        icon: '🦄',
        maxLevel: 5,
        effectPerLevel: 20,
        effectType: 'mythic_animal_bonus',
        description: 'Mythic+ animals produce +20% more per level',
        prereqs: [{ nodeId: 'alpha_bonus', level: 3 }]
      },
      {
        id: 'beast_communion',
        name: 'Beast Communion',
        icon: '🌟',
        maxLevel: 1,
        effectPerLevel: 90,
        effectType: 'all_animal_timer_reduction',
        description: 'Capstone: ALL animal timers reduced by 90%',
        prereqs: [
          { nodeId: 'better_feed', level: 20 },
          { nodeId: 'premium_products', level: 20 },
          { nodeId: 'happy_animals', level: 15 },
          { nodeId: 'breeding', level: 10 },
          { nodeId: 'gentle_touch', level: 15 },
          { nodeId: 'herd_mentality', level: 10 },
          { nodeId: 'natural_diet', level: 10 },
          { nodeId: 'evolution_instinct', level: 10 },
          { nodeId: 'alpha_bonus', level: 5 },
          { nodeId: 'wild_call', level: 5 },
          { nodeId: 'mythic_bond', level: 5 }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────
  //  INDUSTRY BRANCH  (10 nodes, baseCost 200)
  // ──────────────────────────────────────────
  industry: {
    name: 'Industry',
    icon: '🏭',
    baseCost: 200,
    nodes: [
      {
        id: 'efficient_machines',
        name: 'Efficient Machines',
        icon: '⚙️',
        maxLevel: 20,
        effectPerLevel: 3,
        effectType: 'building_speed',
        description: '+3% building speed per level',
        prereqs: []
      },
      {
        id: 'quality_control',
        name: 'Quality Control',
        icon: '✅',
        maxLevel: 20,
        effectPerLevel: 5,
        effectType: 'goods_sell_value',
        description: '+5% goods sell value per level',
        prereqs: [{ nodeId: 'efficient_machines', level: 5 }]
      },
      {
        id: 'batch_processing',
        name: 'Batch Processing',
        icon: '📦',
        maxLevel: 10,
        effectPerLevel: 1,
        effectType: 'extra_output_per_10',
        description: '+1 extra output per 10 productions per level',
        prereqs: [{ nodeId: 'efficient_machines', level: 10 }]
      },
      {
        id: 'supply_chain',
        name: 'Supply Chain',
        icon: '🔗',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'recipe_input_reduction',
        description: '-5% recipe input requirements per level',
        prereqs: [{ nodeId: 'quality_control', level: 5 }]
      },
      {
        id: 'multi_queue',
        name: 'Multi Queue',
        icon: '📋',
        maxLevel: 5,
        effectPerLevel: 1,
        effectType: 'production_queue_slot',
        description: '+1 production queue slot per level',
        prereqs: [{ nodeId: 'batch_processing', level: 5 }]
      },
      {
        id: 'master_recipes',
        name: 'Master Recipes',
        icon: '📖',
        maxLevel: 10,
        effectPerLevel: 3,
        effectType: 'double_output_chance',
        description: '+3% double output chance per level',
        prereqs: [{ nodeId: 'supply_chain', level: 5 }]
      },
      {
        id: 'factory_upgrade',
        name: 'Factory Upgrade',
        icon: '🏭',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'building_bonus_per_level',
        description: '+5% building bonus per level',
        prereqs: [{ nodeId: 'multi_queue', level: 3 }]
      },
      {
        id: 'luxury_expertise',
        name: 'Luxury Expertise',
        icon: '💎',
        maxLevel: 5,
        effectPerLevel: 15,
        effectType: 'long_chain_value_bonus',
        description: '+15% value for 4+ step chain products per level',
        prereqs: [{ nodeId: 'master_recipes', level: 5 }]
      },
      {
        id: 'automation_sync',
        name: 'Automation Sync',
        icon: '🤖',
        maxLevel: 5,
        effectPerLevel: 10,
        effectType: 'worker_effectiveness',
        description: 'Workers +10% more effective per level',
        prereqs: [{ nodeId: 'factory_upgrade', level: 5 }]
      },
      {
        id: 'free_materials',
        name: 'Free Materials',
        icon: '🌟',
        maxLevel: 1,
        effectPerLevel: 25,
        effectType: 'no_input_chance',
        description: 'Capstone: 25% chance production uses NO inputs',
        prereqs: [
          { nodeId: 'efficient_machines', level: 20 },
          { nodeId: 'quality_control', level: 20 },
          { nodeId: 'batch_processing', level: 10 },
          { nodeId: 'supply_chain', level: 10 },
          { nodeId: 'multi_queue', level: 5 },
          { nodeId: 'master_recipes', level: 10 },
          { nodeId: 'factory_upgrade', level: 10 },
          { nodeId: 'luxury_expertise', level: 5 },
          { nodeId: 'automation_sync', level: 5 }
        ]
      }
    ]
  },

  // ────────────────────────────────────────────
  //  AUTOMATION BRANCH  (10 nodes, baseCost 200)
  // ────────────────────────────────────────────
  automation: {
    name: 'Automation',
    icon: '🤖',
    baseCost: 200,
    nodes: [
      {
        id: 'worker_training',
        name: 'Worker Training',
        icon: '👷',
        maxLevel: 20,
        effectPerLevel: 3,
        effectType: 'worker_speed',
        description: '+3% worker speed per level',
        prereqs: []
      },
      {
        id: 'machine_tuning',
        name: 'Machine Tuning',
        icon: '🔧',
        maxLevel: 20,
        effectPerLevel: 3,
        effectType: 'machine_efficiency',
        description: '+3% machine efficiency per level',
        prereqs: [{ nodeId: 'worker_training', level: 5 }]
      },
      {
        id: 'overtime',
        name: 'Overtime',
        icon: '⏰',
        maxLevel: 10,
        effectPerLevel: 2,
        effectType: 'surge_speed_bonus',
        description: '+2% faster during surge per level',
        prereqs: [{ nodeId: 'worker_training', level: 10 }]
      },
      {
        id: 'precision_gears',
        name: 'Precision Gears',
        icon: '⚙️',
        maxLevel: 10,
        effectPerLevel: 2,
        effectType: 'machine_downtime_reduction',
        description: '-2% machine downtime per level',
        prereqs: [{ nodeId: 'machine_tuning', level: 10 }]
      },
      {
        id: 'multi_task',
        name: 'Multi Task',
        icon: '🔄',
        maxLevel: 5,
        effectPerLevel: 1,
        effectType: 'simultaneous_task',
        description: '+1 simultaneous task per level',
        prereqs: [{ nodeId: 'overtime', level: 5 }]
      },
      {
        id: 'conveyor_speed',
        name: 'Conveyor Speed',
        icon: '🏗️',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'transfer_speed',
        description: '+5% transfer speed per level',
        prereqs: [{ nodeId: 'precision_gears', level: 5 }]
      },
      {
        id: 'smart_routing',
        name: 'Smart Routing',
        icon: '🗺️',
        maxLevel: 5,
        effectPerLevel: 10,
        effectType: 'path_reduction',
        description: 'Paths 10% shorter per level',
        prereqs: [{ nodeId: 'conveyor_speed', level: 5 }]
      },
      {
        id: 'evolution_bots',
        name: 'Evolution Bots',
        icon: '🤖',
        maxLevel: 5,
        effectPerLevel: 3,
        effectType: 'auto_evolve_speed',
        description: 'Auto-evolve 3% faster per level',
        prereqs: [{ nodeId: 'multi_task', level: 3 }]
      },
      {
        id: 'perpetual_motion',
        name: 'Perpetual Motion',
        icon: '♾️',
        maxLevel: 5,
        effectPerLevel: 5,
        effectType: 'offline_machine_efficiency',
        description: 'Machines run at 5% efficiency during offline per level',
        prereqs: [{ nodeId: 'smart_routing', level: 3 }]
      },
      {
        id: 'perfect_automation',
        name: 'Perfect Automation',
        icon: '🌟',
        maxLevel: 1,
        effectPerLevel: 100,
        effectType: 'full_efficiency',
        description: 'Capstone: 100% efficiency always',
        prereqs: [
          { nodeId: 'worker_training', level: 20 },
          { nodeId: 'machine_tuning', level: 20 },
          { nodeId: 'overtime', level: 10 },
          { nodeId: 'precision_gears', level: 10 },
          { nodeId: 'multi_task', level: 5 },
          { nodeId: 'conveyor_speed', level: 10 },
          { nodeId: 'smart_routing', level: 5 },
          { nodeId: 'evolution_bots', level: 5 },
          { nodeId: 'perpetual_motion', level: 5 }
        ]
      }
    ]
  },

  // ────────────────────────────────────────────
  //  ECONOMICS BRANCH  (10 nodes, baseCost 150)
  // ────────────────────────────────────────────
  economics: {
    name: 'Economics',
    icon: '💰',
    baseCost: 150,
    nodes: [
      {
        id: 'haggling',
        name: 'Haggling',
        icon: '🤝',
        maxLevel: 20,
        effectPerLevel: 3,
        effectType: 'all_sell_prices',
        description: '+3% all sell prices per level',
        prereqs: []
      },
      {
        id: 'order_bonus',
        name: 'Order Bonus',
        icon: '📦',
        maxLevel: 15,
        effectPerLevel: 5,
        effectType: 'delivery_rewards',
        description: '+5% delivery rewards per level',
        prereqs: [{ nodeId: 'haggling', level: 5 }]
      },
      {
        id: 'market_insight',
        name: 'Market Insight',
        icon: '📊',
        maxLevel: 10,
        effectPerLevel: 1,
        effectType: 'price_prediction',
        description: 'See price predictions (accuracy improves per level)',
        prereqs: [{ nodeId: 'haggling', level: 10 }]
      },
      {
        id: 'bulk_deals',
        name: 'Bulk Deals',
        icon: '🏪',
        maxLevel: 10,
        effectPerLevel: 3,
        effectType: 'shop_price_reduction',
        description: '-3% shop prices per level',
        prereqs: [{ nodeId: 'order_bonus', level: 5 }]
      },
      {
        id: 'export_mastery',
        name: 'Export Mastery',
        icon: '🚢',
        maxLevel: 10,
        effectPerLevel: 8,
        effectType: 'boat_order_rewards',
        description: '+8% boat order rewards per level',
        prereqs: [{ nodeId: 'order_bonus', level: 10 }]
      },
      {
        id: 'coin_magnet',
        name: 'Coin Magnet',
        icon: '🧲',
        maxLevel: 10,
        effectPerLevel: 2,
        effectType: 'passive_coin_generation',
        description: '+2% passive coin generation per level',
        prereqs: [{ nodeId: 'market_insight', level: 5 }]
      },
      {
        id: 'lucky_sales',
        name: 'Lucky Sales',
        icon: '🍀',
        maxLevel: 10,
        effectPerLevel: 3,
        effectType: 'jackpot_sale_chance',
        description: '3% chance of 5x sale value per level',
        prereqs: [{ nodeId: 'bulk_deals', level: 5 }]
      },
      {
        id: 'gem_finder',
        name: 'Gem Finder',
        icon: '💎',
        maxLevel: 5,
        effectPerLevel: 1,
        effectType: 'harvest_gem_drop',
        description: '1% chance harvest drops a gem per level',
        prereqs: [{ nodeId: 'coin_magnet', level: 5 }]
      },
      {
        id: 'investment_returns',
        name: 'Investment Returns',
        icon: '📈',
        maxLevel: 5,
        effectPerLevel: 2,
        effectType: 'coin_return_over_time',
        description: '2% of coins spent return within 1hr per level',
        prereqs: [{ nodeId: 'lucky_sales', level: 5 }]
      },
      {
        id: 'midas_economy',
        name: 'Midas Economy',
        icon: '🌟',
        maxLevel: 1,
        effectPerLevel: 1000,
        effectType: 'sell_price_multiplier',
        description: 'Capstone: ALL sell prices multiplied by 10x',
        prereqs: [
          { nodeId: 'haggling', level: 20 },
          { nodeId: 'order_bonus', level: 15 },
          { nodeId: 'market_insight', level: 10 },
          { nodeId: 'bulk_deals', level: 10 },
          { nodeId: 'export_mastery', level: 10 },
          { nodeId: 'coin_magnet', level: 10 },
          { nodeId: 'lucky_sales', level: 10 },
          { nodeId: 'gem_finder', level: 5 },
          { nodeId: 'investment_returns', level: 5 }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────────────
  //  PRESTIGE POWER BRANCH  (8 nodes, baseCost 500)
  // ──────────────────────────────────────────────────
  prestige_power: {
    name: 'Prestige Power',
    icon: '💀',
    baseCost: 500,
    unlockCondition: 'Unlocks after first prestige',
    nodes: [
      {
        id: 'soul_amplifier',
        name: 'Soul Amplifier',
        icon: '💀',
        maxLevel: 20,
        effectPerLevel: 3,
        effectType: 'soul_seeds_per_prestige',
        description: '+3% Soul Seeds per prestige per level',
        prereqs: []
      },
      {
        id: 'quick_start',
        name: 'Quick Start',
        icon: '🚀',
        maxLevel: 10,
        effectPerLevel: 1,
        effectType: 'starting_level_bonus',
        description: 'Start runs +1 level higher per level',
        prereqs: [{ nodeId: 'soul_amplifier', level: 5 }]
      },
      {
        id: 'memory_echo',
        name: 'Memory Echo',
        icon: '🧠',
        maxLevel: 10,
        effectPerLevel: 2,
        effectType: 'upgrade_retention',
        description: 'Retain 2% of upgrade levels per level',
        prereqs: [{ nodeId: 'soul_amplifier', level: 10 }]
      },
      {
        id: 'dimensional_recall',
        name: 'Dimensional Recall',
        icon: '🌀',
        maxLevel: 5,
        effectPerLevel: 5,
        effectType: 'coin_retention',
        description: 'Keep 5% coins through prestige per level',
        prereqs: [{ nodeId: 'quick_start', level: 5 }]
      },
      {
        id: 'prestige_speed',
        name: 'Prestige Speed',
        icon: '⚡',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'prestige_xp_bonus',
        description: '+5% XP during prestige per level',
        prereqs: [{ nodeId: 'memory_echo', level: 5 }]
      },
      {
        id: 'soul_resonance',
        name: 'Soul Resonance',
        icon: '✨',
        maxLevel: 5,
        effectPerLevel: 0.5,
        effectType: 'soul_seed_compound',
        description: 'Each Soul Seed grants +0.5% extra per level',
        prereqs: [{ nodeId: 'dimensional_recall', level: 3 }]
      },
      {
        id: 'instant_unlock',
        name: 'Instant Unlock',
        icon: '🔓',
        maxLevel: 5,
        effectPerLevel: 3,
        effectType: 'early_building_unlock',
        description: 'Buildings available 3 levels earlier per level',
        prereqs: [{ nodeId: 'prestige_speed', level: 5 }]
      },
      {
        id: 'double_seeds',
        name: 'Double Seeds',
        icon: '🌟',
        maxLevel: 1,
        effectPerLevel: 100,
        effectType: 'soul_seed_doubler',
        description: 'Capstone: Soul Seeds doubled on every prestige',
        prereqs: [
          { nodeId: 'soul_amplifier', level: 20 },
          { nodeId: 'quick_start', level: 10 },
          { nodeId: 'memory_echo', level: 10 },
          { nodeId: 'dimensional_recall', level: 5 },
          { nodeId: 'prestige_speed', level: 10 },
          { nodeId: 'soul_resonance', level: 5 },
          { nodeId: 'instant_unlock', level: 5 }
        ]
      }
    ]
  },

  // ──────────────────────────────────────────────────────────
  //  COSMIC BRANCH  (8 nodes, baseCost 1000, requires P10+)
  // ──────────────────────────────────────────────────────────
  cosmic: {
    name: 'Cosmic',
    icon: '🌌',
    baseCost: 1000,
    unlockCondition: 'Requires Prestige 10+',
    nodes: [
      {
        id: 'stardust_collection',
        name: 'Stardust Collection',
        icon: '⭐',
        maxLevel: 20,
        effectPerLevel: 5,
        effectType: 'cosmic_resource_generation',
        description: '+5% cosmic resource generation per level',
        prereqs: []
      },
      {
        id: 'alien_agriculture',
        name: 'Alien Agriculture',
        icon: '👽',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'alien_crop_speed',
        description: 'Alien crops grow 5% faster per level',
        prereqs: [{ nodeId: 'stardust_collection', level: 5 }]
      },
      {
        id: 'dimensional_farming',
        name: 'Dimensional Farming',
        icon: '🌀',
        maxLevel: 10,
        effectPerLevel: 3,
        effectType: 'all_worlds_bonus',
        description: 'All worlds +3% production per level',
        prereqs: [{ nodeId: 'stardust_collection', level: 10 }]
      },
      {
        id: 'cosmic_animals',
        name: 'Cosmic Animals',
        icon: '🐉',
        maxLevel: 10,
        effectPerLevel: 5,
        effectType: 'cosmic_animal_bonus',
        description: 'Cosmic animals +5% production per level',
        prereqs: [{ nodeId: 'alien_agriculture', level: 5 }]
      },
      {
        id: 'void_harvesting',
        name: 'Void Harvesting',
        icon: '🕳️',
        maxLevel: 5,
        effectPerLevel: 3,
        effectType: 'rare_item_chance',
        description: '3% chance for rare items per level',
        prereqs: [{ nodeId: 'dimensional_farming', level: 5 }]
      },
      {
        id: 'multiverse_trade',
        name: 'Multiverse Trade',
        icon: '🌐',
        maxLevel: 5,
        effectPerLevel: 10,
        effectType: 'cross_world_input_reduction',
        description: 'Cross-world recipes -10% inputs per level',
        prereqs: [{ nodeId: 'cosmic_animals', level: 5 }]
      },
      {
        id: 'reality_bending',
        name: 'Reality Bending',
        icon: '🔮',
        maxLevel: 5,
        effectPerLevel: 10,
        effectType: 'all_branch_bonus',
        description: '+10% to ALL other research branches per level',
        prereqs: [
          { nodeId: 'void_harvesting', level: 3 },
          { nodeId: 'multiverse_trade', level: 3 }
        ]
      },
      {
        id: 'omniscience',
        name: 'Omniscience',
        icon: '🌟',
        maxLevel: 1,
        effectPerLevel: 1,
        effectType: 'ultra_evolution_tier',
        description: 'Capstone: Unlock ULTRA 9th evolution tier',
        prereqs: [
          { nodeId: 'stardust_collection', level: 20 },
          { nodeId: 'alien_agriculture', level: 10 },
          { nodeId: 'dimensional_farming', level: 10 },
          { nodeId: 'cosmic_animals', level: 10 },
          { nodeId: 'void_harvesting', level: 5 },
          { nodeId: 'multiverse_trade', level: 5 },
          { nodeId: 'reality_bending', level: 5 }
        ]
      }
    ]
  }
};

/**
 * Calculate the cost of upgrading a research node to the next level.
 *
 * Formula: baseCost * Math.pow(1.5, level)
 *
 * @param {string} branch   - The branch key (e.g. 'agriculture', 'cosmic')
 * @param {string} nodeId   - The node id within the branch (e.g. 'fertile_soil')
 * @param {number} level    - The current level (cost returned is for level -> level+1)
 * @returns {number|null}   - The cost in research points, or null if invalid
 */
function getResearchCost(branch, nodeId, level) {
  const branchData = RESEARCH_TREE[branch];
  if (!branchData) {
    console.warn(`getResearchCost: Unknown branch "${branch}"`);
    return null;
  }

  const node = branchData.nodes.find(n => n.id === nodeId);
  if (!node) {
    console.warn(`getResearchCost: Unknown node "${nodeId}" in branch "${branch}"`);
    return null;
  }

  if (level < 0 || level >= node.maxLevel) {
    console.warn(
      `getResearchCost: Level ${level} out of range for "${nodeId}" (max ${node.maxLevel})`
    );
    return null;
  }

  return Math.floor(branchData.baseCost * Math.pow(1.5, level));
}
