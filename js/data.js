// data.js — All game data: generators, upgrades, achievements, phases, etc.
'use strict';

const GameData = (() => {

  // ========== PHASES ==========
  const PHASES = {
    1: { name: 'THE JUNKYARD', location: 'Earth', tapLabel: 'SCAVENGE', tapIcon: '\u{1F527}', color: '#D4722C' },
    2: { name: 'LOW EARTH ORBIT', location: 'Space', tapLabel: 'DEPLOY', tapIcon: '\u{1F6F0}', color: '#1E90FF' },
    3: { name: 'THE MOON', location: 'Moon', tapLabel: 'MINE', tapIcon: '\u26CF', color: '#B0B0B0' },
    4: { name: 'MARS', location: 'Mars', tapLabel: 'TERRAFORM', tapIcon: '\u{1F33F}', color: '#C1440E' },
    5: { name: 'THE ASTEROID BELT', location: 'Asteroids', tapLabel: 'HARVEST', tapIcon: '\u2604', color: '#C0C0C0' },
    6: { name: 'JUPITER SYSTEM', location: 'Jupiter', tapLabel: 'SCAN', tapIcon: '\u{1F4E1}', color: '#E8A04C' },
    7: { name: 'INTERSTELLAR', location: 'Alpha Centauri', tapLabel: 'EXPLORE', tapIcon: '\u{1F52D}', color: '#50C878' },
    8: { name: 'THE GALAXY', location: 'Milky Way', tapLabel: 'EXPLORE', tapIcon: '\u{1F52D}', color: '#1A0533' },
    9: { name: 'THE MULTIVERSE', location: 'Beyond', tapLabel: 'EXPLORE', tapIcon: '\u221E', color: '#FFD700' }
  };

  // ========== ROCKET PARTS (Phase 1) ==========
  const ROCKET_PARTS = [
    { id: 'hull', name: 'Scrap Hull', cost: 50, desc: 'Silver metallic cylinder with rivets and patches' },
    { id: 'engine', name: 'Basic Engine', cost: 200, desc: 'Dark gray cone with orange glow at base' },
    { id: 'fuelTank', name: 'Fuel Tank', cost: 500, desc: 'White cylinder with FUEL stenciled on side' },
    { id: 'noseCone', name: 'Nose Cone', cost: 1000, desc: 'Red pointed cone with a small window' },
    { id: 'navigationComputer', name: 'Navigation Computer', cost: 2500, desc: 'Small blue screen panel on hull side' }
  ];

  // ========== GENERATORS BY PHASE ==========
  // currency: 'credits','rp','ore','rm','as','sd'
  const GENERATORS = {
    1: [
      { id: 'p1g1', name: 'Scrap Kid', baseCost: 100, growth: 1.15, output: { credits: 1 }, icon: '\u{1F466}', desc: 'A neighborhood kid picking through junk' },
      { id: 'p1g2', name: 'Scavenger', baseCost: 500, growth: 1.15, output: { credits: 5 }, icon: '\u{1F575}', desc: 'A seasoned junkyard scavenger' },
      { id: 'p1g3', name: 'Scavenger Team', baseCost: 2500, growth: 1.15, output: { credits: 25 }, icon: '\u{1F46B}', desc: 'A small team stripping down vehicles' },
      { id: 'p1g4', name: 'Junkyard Crane', baseCost: 12000, growth: 1.15, output: { credits: 120 }, icon: '\u{1F3D7}', desc: 'A rusty but functional crane' },
      { id: 'p1g5', name: 'Metal Detector Drone', baseCost: 60000, growth: 1.15, output: { credits: 600 }, icon: '\u{1F681}', desc: 'An autonomous drone scanning for metals' },
      { id: 'p1g6', name: 'Scrap Processing Plant', baseCost: 300000, growth: 1.15, output: { credits: 3000 }, icon: '\u{1F3ED}', desc: 'A mini-factory refining scrap' },
      { id: 'p1g7', name: 'Rocket Part Fabricator', baseCost: 1500000, growth: 1.15, output: { credits: 15000 }, icon: '\u{1F5A8}', desc: 'Turns raw scrap into rocket-grade parts' }
    ],
    2: [
      { id: 'p2g1', name: 'Solar Panel Array', baseCost: 5000, growth: 1.15, output: { credits: 50 }, icon: '\u2600', desc: 'Converts sunlight into energy credits' },
      { id: 'p2g2', name: 'Communication Relay', baseCost: 25000, growth: 1.15, output: { credits: 200, rp: 0.5 }, icon: '\u{1F4E1}', desc: 'Relays data back to Earth' },
      { id: 'p2g3', name: 'Satellite Deployer', baseCost: 100000, growth: 1.15, output: { credits: 800, rp: 2 }, icon: '\u{1F6F0}', desc: 'Launches micro-satellites' },
      { id: 'p2g4', name: 'Space Tourism Module', baseCost: 500000, growth: 1.15, output: { credits: 4000, rp: 5 }, icon: '\u{1F680}', desc: 'Wealthy tourists see Earth from space' },
      { id: 'p2g5', name: 'Orbital Lab', baseCost: 2500000, growth: 1.15, output: { credits: 20000, rp: 20 }, icon: '\u{1F52C}', desc: 'Zero-gravity research facility' },
      { id: 'p2g6', name: 'Space Hotel', baseCost: 12000000, growth: 1.15, output: { credits: 100000, rp: 50 }, icon: '\u{1F3E8}', desc: 'A luxury orbital hotel' },
      { id: 'p2g7', name: 'Orbital Megastructure', baseCost: 60000000, growth: 1.15, output: { credits: 500000, rp: 200 }, icon: '\u{1F3D7}', desc: 'Massive modular platform' }
    ],
    3: [
      { id: 'p3g1', name: 'Lunar Drill', baseCost: 1e6, growth: 1.15, output: { credits: 50000, ore: 1 }, icon: '\u26CF', desc: 'Basic lunar drill rig' },
      { id: 'p3g2', name: 'Regolith Processor', baseCost: 5e6, growth: 1.15, output: { credits: 250000, ore: 3, rp: 1 }, icon: '\u2699', desc: 'Processes lunar regolith' },
      { id: 'p3g3', name: 'Helium-3 Extractor', baseCost: 25e6, growth: 1.15, output: { credits: 1.25e6, ore: 10, rp: 3 }, icon: '\u2622', desc: 'Extracts He-3 from soil' },
      { id: 'p3g4', name: 'Moon Base Module', baseCost: 100e6, growth: 1.15, output: { credits: 6e6, ore: 25, rp: 10 }, icon: '\u{1F3E0}', desc: 'Habitat dome', crewCapacity: 2 },
      { id: 'p3g5', name: 'Lunar Rover Fleet', baseCost: 500e6, growth: 1.15, output: { credits: 30e6, ore: 60, rp: 20 }, icon: '\u{1F697}', desc: 'Group of rovers' },
      { id: 'p3g6', name: 'Mass Driver', baseCost: 2.5e9, growth: 1.15, output: { credits: 150e6, ore: 150, rp: 50 }, icon: '\u{1F4A5}', desc: 'Electromagnetic launcher' },
      { id: 'p3g7', name: 'Lunar Megafactory', baseCost: 12e9, growth: 1.15, output: { credits: 750e6, ore: 400, rp: 150 }, icon: '\u{1F3ED}', desc: 'Large factory complex' },
      { id: 'p3g8', name: 'Space Elevator (Moon)', baseCost: 60e9, growth: 1.15, output: { credits: 3.5e9, ore: 1000, rp: 500 }, icon: '\u2195', desc: 'Tether extending upward' }
    ],
    4: [
      { id: 'p4g1', name: 'Dust Collector', baseCost: 100e9, growth: 1.15, output: { credits: 1e9 }, terraform: 0, icon: '\u{1F32A}', desc: 'Collects Martian dust' },
      { id: 'p4g2', name: 'Atmospheric Processor', baseCost: 500e9, growth: 1.15, output: { credits: 5e9 }, terraform: 0.01, icon: '\u{1F32B}', desc: 'Adds gases to atmosphere' },
      { id: 'p4g3', name: 'Ice Melter', baseCost: 2.5e12, growth: 1.15, output: { credits: 25e9 }, terraform: 0.05, icon: '\u2744', desc: 'Melts polar ice caps' },
      { id: 'p4g4', name: 'Greenhouse Array', baseCost: 12e12, growth: 1.15, output: { credits: 120e9 }, terraform: 0.1, icon: '\u{1F33F}', desc: 'Warms the atmosphere' },
      { id: 'p4g5', name: 'Biodome', baseCost: 60e12, growth: 1.15, output: { credits: 600e9 }, terraform: 0.25, icon: '\u{1F333}', desc: 'Protected ecosystems' },
      { id: 'p4g6', name: 'Gene Lab', baseCost: 300e12, growth: 1.15, output: { credits: 3e12 }, terraform: 0.5, icon: '\u{1F9EC}', desc: 'Engineers organisms for Mars' },
      { id: 'p4g7', name: 'Colony Hub', baseCost: 1.5e15, growth: 1.15, output: { credits: 15e12 }, terraform: 1.0, icon: '\u{1F3D9}', desc: 'Full city module' },
      { id: 'p4g8', name: 'Terraform Engine', baseCost: 7.5e15, growth: 1.15, output: { credits: 75e12 }, terraform: 2.5, icon: '\u2699', desc: 'Planetary-scale machine' }
    ],
    5: [
      { id: 'p5g1', name: 'Scout Probe', baseCost: 1e15, growth: 1.15, output: { credits: 100e12, rm: 0.5 }, icon: '\u{1F6F8}', desc: 'Small scout drone' },
      { id: 'p5g2', name: 'Mining Shuttle', baseCost: 10e15, growth: 1.15, output: { credits: 1e15, rm: 2 }, icon: '\u26CF', desc: 'Small ship with drill' },
      { id: 'p5g3', name: 'Mining Barge', baseCost: 100e15, growth: 1.15, output: { credits: 10e15, rm: 10 }, icon: '\u{1F6A2}', desc: 'Large bulky mining ship' },
      { id: 'p5g4', name: 'Refinery Ship', baseCost: 1e18, growth: 1.15, output: { credits: 100e15, rm: 50 }, icon: '\u{1F3ED}', desc: 'Ship with smelter' },
      { id: 'p5g5', name: 'Heavy Freighter', baseCost: 10e18, growth: 1.15, output: { credits: 1e18, rm: 200 }, icon: '\u{1F69A}', desc: 'Massive cargo hauler' },
      { id: 'p5g6', name: 'Destroyer Escort', baseCost: 100e18, growth: 1.15, output: { credits: 10e18, rm: 500 }, icon: '\u2694', desc: 'Armed escort ship' },
      { id: 'p5g7', name: 'Capital Ship', baseCost: 1e21, growth: 1.15, output: { credits: 100e18, rm: 2000 }, icon: '\u{1F680}', desc: 'Enormous flagship' },
      { id: 'p5g8', name: 'Dyson Collector', baseCost: 10e21, growth: 1.15, output: { credits: 1e21, rm: 10000 }, icon: '\u2600', desc: 'Energy collection sphere' }
    ],
    // Phase 6 sub-zones
    '6_orbit': [
      { id: 'p6og1', name: 'Atmospheric Skimmer', baseCost: 1e21, growth: 1.15, output: { credits: 10e18 }, icon: '\u{1F32A}', desc: 'Skims Jupiter atmosphere' },
      { id: 'p6og2', name: 'Gas Scoop Mk.I', baseCost: 10e21, growth: 1.15, output: { credits: 100e18 }, icon: '\u26FD', desc: 'Scoops hydrogen gas' },
      { id: 'p6og3', name: 'Gas Scoop Mk.II', baseCost: 100e21, growth: 1.15, output: { credits: 1e21 }, icon: '\u26FD', desc: 'Advanced gas scoop' },
      { id: 'p6og4', name: 'Hydrogen Refinery', baseCost: 1e24, growth: 1.15, output: { credits: 10e21, rp: 100 }, icon: '\u{1F3ED}', desc: 'Refines hydrogen fuel' },
      { id: 'p6og5', name: 'Fusion Harvester', baseCost: 10e24, growth: 1.15, output: { credits: 100e21, rp: 500 }, icon: '\u2622', desc: 'Harvests fusion fuel' },
      { id: 'p6og6', name: 'Jupiter Orbital Station', baseCost: 100e24, growth: 1.15, output: { credits: 1e24, rp: 2000, rm: 50 }, icon: '\u{1F6F8}', desc: 'Massive orbital platform' }
    ],
    '6_io': [
      { id: 'p6ig1', name: 'Lava Skimmer', baseCost: 5000, growth: 1.15, output: { ore: 50 }, costCurrency: 'ore', icon: '\u{1F30B}', desc: 'Skims lava flows', degrades: true, degradeRate: 0.01 },
      { id: 'p6ig2', name: 'Heat-Resistant Drill', baseCost: 20000, growth: 1.15, output: { ore: 200 }, costCurrency: 'ore', icon: '\u26CF', desc: 'Drills volcanic rock', degrades: true, degradeRate: 0.01 },
      { id: 'p6ig3', name: 'Volcanic Tap', baseCost: 100000, growth: 1.15, output: { ore: 1000 }, costCurrency: 'ore', icon: '\u{1F525}', desc: 'Taps into volcanic vents', degrades: true, degradeRate: 0.005 },
      { id: 'p6ig4', name: 'Magma Refinery', baseCost: 500000, growth: 1.15, output: { ore: 5000 }, costCurrency: 'ore', icon: '\u{1F3ED}', desc: 'Refines magma into ore', degrades: true, degradeRate: 0.005 }
    ],
    '6_europa': [
      { id: 'p6eg1', name: 'Ice Breaker', baseCost: 10e21, growth: 1.15, output: { credits: 50e18 }, asChance: 0.01, icon: '\u2744', desc: 'Breaks through ice crust' },
      { id: 'p6eg2', name: 'Submarine Drone', baseCost: 100e21, growth: 1.15, output: { credits: 500e18 }, asChance: 0.03, icon: '\u{1F6A4}', desc: 'Explores subsurface ocean' },
      { id: 'p6eg3', name: 'Deep Ocean Lab', baseCost: 1e24, growth: 1.15, output: { credits: 5e21 }, asChance: 0.08, icon: '\u{1F52C}', desc: 'Researches alien life' },
      { id: 'p6eg4', name: 'Alien Signal Decoder', baseCost: 10e24, growth: 1.15, output: { credits: 50e21 }, asChance: 0.20, icon: '\u{1F4E1}', desc: 'Decodes alien signals' }
    ],
    '6_ganymede': [
      { id: 'p6gg1', name: 'Ganymede Outpost', baseCost: 5e21, growth: 1.15, output: { credits: 20e18 }, crewCapacity: 5, icon: '\u{1F3E0}', desc: 'Basic outpost' },
      { id: 'p6gg2', name: 'Underground City', baseCost: 50e21, growth: 1.15, output: { credits: 200e18 }, crewCapacity: 20, icon: '\u{1F3D9}', desc: 'Subterranean city' },
      { id: 'p6gg3', name: 'Mega Habitat', baseCost: 500e21, growth: 1.15, output: { credits: 2e21 }, crewCapacity: 100, icon: '\u{1F3DF}', desc: 'Massive habitat complex' },
      { id: 'p6gg4', name: 'Planetary Citadel', baseCost: 5e24, growth: 1.15, output: { credits: 20e21 }, crewCapacity: 500, icon: '\u{1F3F0}', desc: 'Moon-spanning fortress' }
    ],
    '6_callisto': [
      { id: 'p6cg1', name: 'Signal Relay', baseCost: 20e21, growth: 1.15, output: {}, globalBoost: 0.02, icon: '\u{1F4E1}', desc: '+2% all income' },
      { id: 'p6cg2', name: 'Quantum Entanglement Hub', baseCost: 200e21, growth: 1.15, output: {}, globalBoost: 0.05, icon: '\u269B', desc: '+5% all income' },
      { id: 'p6cg3', name: 'Galactic Broadcast Array', baseCost: 2e24, growth: 1.15, output: {}, globalBoost: 0.15, icon: '\u{1F4E1}', desc: '+15% all income' },
      { id: 'p6cg4', name: 'Omniscient Network', baseCost: 20e24, growth: 1.15, output: {}, globalBoost: 0.50, icon: '\u{1F310}', desc: '+50% all income' }
    ],
    '7_haven': [
      { id: 'p7hg1', name: 'Colony Ship Landing', baseCost: 1e24, growth: 1.15, output: { credits: 10e21, sd: 1 }, icon: '\u{1F680}', desc: 'First colony on new world' },
      { id: 'p7hg2', name: 'Bio-Habitat Complex', baseCost: 10e24, growth: 1.15, output: { credits: 100e21, sd: 5 }, crewCapacity: 10, icon: '\u{1F33F}', desc: 'Growing habitats' },
      { id: 'p7hg3', name: 'Planetary Capital', baseCost: 100e24, growth: 1.15, output: { credits: 1e24, sd: 25 }, icon: '\u{1F3DB}', desc: 'Capital of the colony' },
      { id: 'p7hg4', name: 'Dyson Tree Forest', baseCost: 1e27, growth: 1.15, output: { credits: 10e24, sd: 100 }, icon: '\u{1F332}', desc: 'Living megastructures' }
    ],
    '7_ferrum': [
      { id: 'p7fg1', name: 'Strip Mining Drones', baseCost: 5e24, growth: 1.15, output: { ore: 10000, rm: 100, sd: 0.5 }, icon: '\u26CF', desc: 'Automated mining drones' },
      { id: 'p7fg2', name: 'Core Extractor', baseCost: 50e24, growth: 1.15, output: { ore: 50000, rm: 500, sd: 2 }, icon: '\u{1F300}', desc: 'Extracts from planet core' },
      { id: 'p7fg3', name: 'Planet Cracker', baseCost: 500e24, growth: 1.15, output: { ore: 250000, rm: 2500, sd: 10 }, icon: '\u{1F4A5}', desc: 'Cracks planets for resources' },
      { id: 'p7fg4', name: 'Matter Converter', baseCost: 5e27, growth: 1.15, output: { ore: 1000000, rm: 10000, sd: 50 }, icon: '\u269B', desc: 'Converts any matter' }
    ],
    '7_nebula': [
      { id: 'p7ng1', name: 'Cloud City', baseCost: 10e24, growth: 1.15, output: { credits: 500e21, sd: 10 }, icon: '\u2601', desc: 'Floating city in gas giant' },
      { id: 'p7ng2', name: 'Fusion Core Harvester', baseCost: 100e24, growth: 1.15, output: { credits: 5e24, sd: 50 }, icon: '\u2622', desc: 'Harvests fusion energy' },
      { id: 'p7ng3', name: 'Dyson Sphere Fragment', baseCost: 1e27, growth: 1.15, output: { credits: 50e24, sd: 250 }, icon: '\u2600', desc: 'Partial Dyson sphere' },
      { id: 'p7ng4', name: 'Star Forge', baseCost: 10e27, growth: 1.15, output: { credits: 500e24, sd: 1000 }, icon: '\u2B50', desc: 'Forges matter from starlight' }
    ],
    8: [
      { id: 'p8g1', name: 'Star System Colony', baseCost: 1e27, growth: 1.15, output: { credits: 100e24, sd: 100 }, icon: '\u2B50', desc: 'Colony in a new star system' },
      { id: 'p8g2', name: 'Warp Gate', baseCost: 10e27, growth: 1.15, output: { credits: 1e27, sd: 500 }, icon: '\u{1F300}', desc: 'Connects star systems' },
      { id: 'p8g3', name: 'Galactic Trade Hub', baseCost: 100e27, growth: 1.15, output: { credits: 10e27, sd: 2500 }, icon: '\u{1F4B0}', desc: 'Center of galactic trade' },
      { id: 'p8g4', name: 'Galactic Megastructure', baseCost: 1e30, growth: 1.15, output: { credits: 100e27, sd: 10000 }, icon: '\u{1F3D7}', desc: 'Galaxy-spanning structure' }
    ]
  };

  // ========== UPGRADES BY PHASE ==========
  const UPGRADES = {
    1: [
      { id: 'u1_1', name: 'Sharper Eyes', cost: 200, currency: 'credits', effect: { tapMultiplier: 2 }, desc: 'Tap value x2', req: { generator: 'p1g1', count: 5 } },
      { id: 'u1_2', name: 'Bigger Bags', cost: 1000, currency: 'credits', effect: { generatorMultiplier: { target: 'p1g1', mult: 2 } }, desc: 'Scrap Kid output x2', req: { generator: 'p1g1', count: 10 } },
      { id: 'u1_3', name: 'Pro Metal Detector', cost: 5000, currency: 'credits', effect: { generatorMultiplier: { target: 'p1g2', mult: 2 } }, desc: 'Scavenger output x2', req: { generator: 'p1g2', count: 5 } },
      { id: 'u1_4', name: 'Teamwork Training', cost: 25000, currency: 'credits', effect: { generatorMultiplier: { target: 'p1g3', mult: 3 } }, desc: 'Scavenger Team output x3', req: { generator: 'p1g3', count: 5 } },
      { id: 'u1_5', name: 'Hydraulic Upgrade', cost: 100000, currency: 'credits', effect: { generatorMultiplier: { target: 'p1g4', mult: 2 } }, desc: 'Crane output x2', req: { generator: 'p1g4', count: 5 } },
      { id: 'u1_6', name: 'AI Pathfinding', cost: 500000, currency: 'credits', effect: { generatorMultiplier: { target: 'p1g5', mult: 3 } }, desc: 'Drone output x3', req: { generator: 'p1g5', count: 5 } },
      { id: 'u1_7', name: 'Blast Furnace', cost: 2000000, currency: 'credits', effect: { generatorMultiplier: { target: 'p1g6', mult: 2 } }, desc: 'Processing Plant output x2', req: { generator: 'p1g6', count: 5 } },
      { id: 'u1_8', name: 'Quantum Printer', cost: 10000000, currency: 'credits', effect: { generatorMultiplier: { target: 'p1g7', mult: 3 } }, desc: 'Fabricator output x3', req: { generator: 'p1g7', count: 5 } },
      { id: 'u1_9', name: 'Lucky Find', cost: 50000, currency: 'credits', effect: { luckyTap: true }, desc: '10% chance per tap for x10 credits', req: { totalTaps: 500 } },
      { id: 'u1_10', name: 'Junkyard Dog', cost: 250000, currency: 'credits', effect: { phaseMultiplier: { phase: 1, mult: 1.25 } }, desc: 'All Phase 1 generators +25%', req: { allGeneratorsPhase: 1 } }
    ],
    2: [
      { id: 'u2_1', name: 'Efficient Thrusters', cost: 10, currency: 'rp', effect: { phaseMultiplier: { phase: 2, mult: 2 } }, desc: 'All Phase 2 generators x2 credits' },
      { id: 'u2_2', name: 'Photovoltaic Boost', cost: 25, currency: 'rp', effect: { generatorMultiplier: { target: 'p2g1', mult: 3 } }, desc: 'Solar Panel output x3', req: { generator: 'p2g1', count: 10 } },
      { id: 'u2_3', name: 'Lightweight Alloy', cost: 50, currency: 'rp', effect: { phase3CostReduction: 0.5 }, desc: 'Phase 3 unlock cost -50%' },
      { id: 'u2_4', name: 'Auto-Tap Satellite', cost: 100, currency: 'rp', effect: { autoTap: 3 }, desc: 'Auto-tap at 3 taps/sec' },
      { id: 'u2_5', name: 'Gravity Sling Maneuver', cost: 150, currency: 'rp', effect: { globalCreditMultiplier: 1.5 }, desc: 'All credits/sec x1.5', req: { generator: 'p2g5', count: 5 } },
      { id: 'u2_6', name: 'Data Compression', cost: 200, currency: 'rp', effect: { globalRPMultiplier: 2 }, desc: 'All RP generation x2', req: { generator: 'p2g2', count: 10 } },
      { id: 'u2_7', name: 'Space Advertising', cost: 300, currency: 'rp', effect: { generatorMultiplier: { target: 'p2g4', mult: 5 } }, desc: 'Space Tourism x5', req: { generator: 'p2g4', count: 10 } },
      { id: 'u2_8', name: 'Zero-G Manufacturing', cost: 500, currency: 'rp', effect: { unlockBonusGenerator: true }, desc: 'Unlock Microgravity Factory', req: { generator: 'p2g7', count: 5 } },
      { id: 'u2_9', name: 'Radiation Shielding', cost: 100, currency: 'rp', costSecondary: { credits: 50e6 }, effect: { unlockPhase: 3 }, desc: 'UNLOCK Phase 3: The Moon' }
    ],
    3: [
      { id: 'u3_1', name: 'Diamond Drill Bits', cost: 50, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g1', mult: 3 } }, desc: 'Lunar Drill output x3' },
      { id: 'u3_2', name: 'Efficient Refining', cost: 100, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g2', mult: 2 } }, desc: 'Regolith Processor x2' },
      { id: 'u3_3', name: 'Isotope Separation', cost: 200, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g3', mult: 3 } }, desc: 'He-3 Extractor x3' },
      { id: 'u3_4', name: 'Habitat Expansion', cost: 300, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g4', mult: 2 }, unlockCrew: true }, desc: 'Moon Base x2 + unlock Crew' },
      { id: 'u3_5', name: 'All-Terrain Treads', cost: 150, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g5', mult: 2 } }, desc: 'Rover Fleet x2' },
      { id: 'u3_6', name: 'Superconducting Rails', cost: 500, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g6', mult: 3 } }, desc: 'Mass Driver x3' },
      { id: 'u3_7', name: 'Automated Assembly', cost: 1000, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g7', mult: 2 } }, desc: 'Megafactory x2' },
      { id: 'u3_8', name: 'Carbon Nanotube Cable', cost: 2000, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g8', mult: 3 } }, desc: 'Space Elevator x3' },
      { id: 'u3_9', name: 'Lunar Tunneling Network', cost: 500, currency: 'rp', effect: { phaseMultiplier: { phase: 3, mult: 1.5 } }, desc: 'All Moon generators x1.5' },
      { id: 'u3_10', name: 'Deep Core Mining', cost: 1000, currency: 'rp', effect: { globalOreMultiplier: 2 }, desc: 'Ore production globally x2' },
      { id: 'u3_11', name: 'Deep Space Antenna', cost: 500, currency: 'ore', costSecondary: { credits: 10e9 }, effect: { unlockPhase: 4 }, desc: 'UNLOCK Phase 4: Mars' }
    ],
    4: [
      { id: 'u4_1', name: 'Martian Soil Analysis', cost: 1000, currency: 'ore', effect: { generatorMultiplier: { target: 'p4g1', mult: 3 } }, desc: 'Dust Collector x3' },
      { id: 'u4_2', name: 'CO2 Compression', cost: 2000, currency: 'ore', effect: { generatorMultiplier: { target: 'p4g2', mult: 2 }, terraformMultiplier: 1.5 }, desc: 'Atmo Processor x2, terraform x1.5' },
      { id: 'u4_3', name: 'Solar Reflector Array', cost: 5000, currency: 'rp', effect: { generatorMultiplier: { target: 'p4g3', mult: 3 }, terraformMultiplier: 1.5 }, desc: 'Ice Melter x3, terraform x1.5' },
      { id: 'u4_4', name: 'UV-Resistant Glass', cost: 5000, currency: 'ore', effect: { generatorMultiplier: { target: 'p4g4', mult: 2 } }, desc: 'Greenhouse x2' },
      { id: 'u4_5', name: 'Extremophile Bacteria', cost: 10000, currency: 'rp', effect: { generatorMultiplier: { target: 'p4g5', mult: 3 }, terraformMultiplier: 2 }, desc: 'Biodome x3, terraform x2' },
      { id: 'u4_6', name: 'CRISPR Terraforming', cost: 10000, currency: 'ore', effect: { generatorMultiplier: { target: 'p4g6', mult: 2 } }, desc: 'Gene Lab x2' },
      { id: 'u4_7', name: 'Self-Expanding Colony', cost: 500e15, currency: 'credits', effect: { generatorMultiplier: { target: 'p4g7', mult: 3 } }, desc: 'Colony Hub x3' },
      { id: 'u4_8', name: 'Planetary Core Tap', cost: 50000, currency: 'rp', costSecondary: { ore: 25000 }, effect: { generatorMultiplier: { target: 'p4g8', mult: 2 }, phaseMultiplier: { phase: 4, mult: 2 } }, desc: 'Terraform Engine x2 + Mars credits x2' }
    ],
    5: [
      { id: 'u5_1', name: 'Advanced Scanners', cost: 50, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g1', mult: 3 } }, desc: 'Scout Probe x3' },
      { id: 'u5_2', name: 'Plasma Drills', cost: 100, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g2', mult: 2 } }, desc: 'Mining Shuttle x2' },
      { id: 'u5_3', name: 'Automated Barges', cost: 250, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g3', mult: 3 } }, desc: 'Mining Barge x3' },
      { id: 'u5_4', name: 'Nano-Refinement', cost: 500, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g4', mult: 2 } }, desc: 'Refinery Ship x2' },
      { id: 'u5_5', name: 'Anti-Gravity Cargo', cost: 1000, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g5', mult: 3 } }, desc: 'Heavy Freighter x3' },
      { id: 'u5_6', name: 'Shield Generators', cost: 2500, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g6', mult: 2 } }, desc: 'Destroyer x2' },
      { id: 'u5_7', name: "Admiral's Command", cost: 5000, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g7', mult: 3 }, phaseMultiplier: { phase: 5, mult: 1.5 } }, desc: 'Capital Ship x3 + all ships x1.5' },
      { id: 'u5_8', name: 'Quantum Computers', cost: 10000, currency: 'rm', effect: { globalRPMultiplier: 10 }, desc: 'All RP generation x10' },
      { id: 'u5_9', name: 'Anti-Gravity Engines', cost: 25000, currency: 'rm', effect: { phaseMultiplier: { phase: 5, mult: 5 } }, desc: 'All ship output x5' },
      { id: 'u5_10', name: 'Warp Theory Research', cost: 50000, currency: 'rm', effect: { unlockPhase: 6 }, desc: 'UNLOCK Phase 6: Jupiter' }
    ],
    6: [
      { id: 'u6_1', name: 'Volcanic Shielding', cost: 10000, currency: 'ore', effect: { reduceDegradation: 0.5 }, desc: 'Io degradation -50%' },
      { id: 'u6_2', name: 'Ice Drilling Tech', cost: 50e21, currency: 'credits', effect: { phaseMultiplier: { phase: '6_europa', mult: 2 } }, desc: 'Europa generators x2' },
      { id: 'u6_3', name: 'Signal Amplifier', cost: 100e21, currency: 'credits', effect: { asChanceMultiplier: 2 }, desc: 'Alien Signal detection x2' },
      { id: 'u6_4', name: 'Jovian Trade Routes', cost: 500e21, currency: 'credits', effect: { phaseMultiplier: { phase: 6, mult: 2 } }, desc: 'All Jupiter generators x2' }
    ],
    7: [
      { id: 'u7_1', name: 'Interstellar Trade Routes', cost: 100, currency: 'sd', effect: { globalCreditMultiplier: 10 }, desc: 'All credit generation x10' },
      { id: 'u7_2', name: 'Alien Diplomacy', cost: 250, currency: 'sd', effect: { currencyExchange: true }, desc: 'Unlock currency exchange' },
      { id: 'u7_3', name: 'FTL Communication', cost: 500, currency: 'sd', effect: { allZonesFullRate: true }, desc: 'All zones produce at full rate' },
      { id: 'u7_4', name: 'Dyson Sphere Complete', cost: 1000, currency: 'sd', effect: { globalCreditMultiplier: 100 }, desc: 'Energy production x100' },
      { id: 'u7_5', name: 'Galactic Beacon', cost: 2500, currency: 'sd', effect: { revealSystems: true }, desc: 'Reveals nearby star systems' },
      { id: 'u7_6', name: 'Terraforming Nanobots', cost: 5000, currency: 'sd', effect: { autoTerraform: true }, desc: 'Barren worlds auto-terraform' },
      { id: 'u7_7', name: 'FTL Drive Mk.II', cost: 10000, currency: 'sd', effect: { unlockPhase: 8 }, desc: 'UNLOCK Phase 8: Galaxy Map' }
    ],
    8: [
      { id: 'u8_1', name: 'Long-Range Scanners', cost: 50000, currency: 'sd', effect: { revealSystemTypes: true }, desc: 'Reveal system types before buying' },
      { id: 'u8_2', name: 'Warp Gate Network', cost: 200000, currency: 'sd', effect: { systemCostReduction: 0.25 }, desc: 'System costs -25%' },
      { id: 'u8_3', name: 'Galactic Federation', cost: 500000, currency: 'sd', effect: { allSystemsMultiplier: 2 }, desc: 'All systems produce x2' },
      { id: 'u8_4', name: 'Multiversal Sensors', cost: 1000000, currency: 'sd', effect: { revealMultiverse: true }, desc: 'Reveal Phase 9 portal' }
    ]
  };

  // ========== COSMIC DUST SHOP ==========
  const CD_SHOP = [
    { id: 'cd_start1', name: 'Starting Boost I', cost: 5, effect: { startingCredits: 10000 }, desc: 'Start each run with 10K credits' },
    { id: 'cd_start2', name: 'Starting Boost II', cost: 25, effect: { startingCredits: 1e6 }, desc: 'Start with 1M credits', req: 'cd_start1' },
    { id: 'cd_start3', name: 'Starting Boost III', cost: 100, effect: { startingCredits: 1e9 }, desc: 'Start with 1B credits', req: 'cd_start2' },
    { id: 'cd_quick', name: 'Quick Launch', cost: 15, effect: { rocketCostReduction: 0.5 }, desc: 'Rocket parts cost 50% less' },
    { id: 'cd_skip1', name: 'Skip Junkyard', cost: 50, effect: { skipToPhase: 2 }, desc: 'Option to start at Phase 2' },
    { id: 'cd_skip2', name: 'Skip to Moon', cost: 150, effect: { skipToPhase: 3 }, desc: 'Option to start at Phase 3', req: 'cd_skip1' },
    { id: 'cd_skip3', name: 'Skip to Mars', cost: 500, effect: { skipToPhase: 4 }, desc: 'Option to start at Phase 4', req: 'cd_skip2' },
    { id: 'cd_autotap', name: 'Auto-Tap Permanent', cost: 30, effect: { permanentAutoTap: 5 }, desc: 'Auto-tap 5/sec from start' },
    { id: 'cd_autolaunch', name: 'Auto-Launch', cost: 75, effect: { autoLaunch: true }, desc: 'Auto-launch when rocket complete' },
    { id: 'cd_warp1', name: 'Warp Speed I', cost: 100, effect: { speedMultiplier: 2 }, desc: 'All generators x2 speed' },
    { id: 'cd_warp2', name: 'Warp Speed II', cost: 500, effect: { speedMultiplier: 5 }, desc: 'All generators x5 speed', req: 'cd_warp1' },
    { id: 'cd_warp3', name: 'Warp Speed III', cost: 2500, effect: { speedMultiplier: 10 }, desc: 'All generators x10 speed', req: 'cd_warp2' },
    { id: 'cd_crew', name: 'Quantum Memory', cost: 250, effect: { keepCrew: true }, desc: 'Keep all crew through prestige' },
    { id: 'cd_fleet', name: 'Fleet Recall', cost: 300, effect: { keepFleet: true }, desc: 'Keep fleet through prestige' },
    { id: 'cd_terraform', name: 'Terraform Memory', cost: 200, effect: { startTerraform: 50 }, desc: 'Mars starts at 50% terraformed' },
    { id: 'cd_passive', name: 'Multiverse Engine', cost: 500, effect: { passiveCD: 1 }, desc: 'Earn 1 CD per hour passively' },
    { id: 'cd_crunch', name: 'Big Crunch', cost: 1000, effect: { prestigeMultiplier: 2 }, desc: 'Prestige yields x2 CD' },
    { id: 'cd_bounce', name: 'Big Bounce', cost: 3000, effect: { prestigeMultiplier: 5 }, desc: 'Prestige yields x5 CD', req: 'cd_crunch' },
    { id: 'cd_sleep', name: 'Sleep Mode', cost: 50, effect: { offlineMultiplier: 0.75 }, desc: 'Offline earnings 75%' },
    { id: 'cd_dream', name: 'Dream Engine', cost: 200, effect: { offlineMultiplier: 1.0 }, desc: 'Offline earnings 100%', req: 'cd_sleep' },
    { id: 'cd_architect', name: 'Cosmic Architect', cost: 10000, effect: { unlockMultiverse: true }, desc: 'Unlock Phase 9: The Multiverse' }
  ];

  // ========== RESEARCH TREE ==========
  const RESEARCH = [
    // Tier 1
    { id: 'r1_1', name: 'Efficient Solar Cells', cost: 10, tier: 1, effect: { generatorMultiplier: { target: 'p2g1', mult: 1.5 } }, desc: '+50% Solar Panel output' },
    { id: 'r1_2', name: 'Improved Communications', cost: 25, tier: 1, effect: { globalRPMultiplier: 1.5 }, desc: '+50% all RP income' },
    { id: 'r1_3', name: 'Space Engineering', cost: 50, tier: 1, effect: { generatorCostReduction: 0.8 }, desc: '-20% all generator costs' },
    // Tier 2
    { id: 'r2_1', name: 'Deep Mining Techniques', cost: 100, tier: 2, effect: { globalOreMultiplier: 2 }, desc: '+100% Ore income', req: 'r1_2' },
    { id: 'r2_2', name: 'Crew Quarters Design', cost: 200, tier: 2, effect: { crewCapacityMultiplier: 1.5 }, desc: '+50% crew capacity', req: 'r1_3' },
    { id: 'r2_3', name: 'Rocket Fuel Efficiency', cost: 300, tier: 2, effect: { transitionCostReduction: 0.7 }, desc: 'Phase transitions cost 30% less', req: 'r1_3' },
    // Tier 3
    { id: 'r3_1', name: 'Atmospheric Science', cost: 500, tier: 3, effect: { terraformMultiplier: 2 }, desc: '+100% terraform speed', req: 'r2_1' },
    { id: 'r3_2', name: 'Genetic Engineering', cost: 1000, tier: 3, effect: { generatorMultiplier: { target: 'p4g5', mult: 3 } }, desc: 'Biodome output x3', req: 'r2_1' },
    { id: 'r3_3', name: 'Mars Colony Planning', cost: 1500, tier: 3, effect: { generatorCostReductionSpecific: { target: 'p4g7', mult: 0.5 } }, desc: 'Colony Hub cost -50%', req: 'r2_2' },
    // Tier 4
    { id: 'r4_1', name: 'Ship Automation', cost: 3000, tier: 4, effect: { phaseMultiplier: { phase: 5, mult: 2 } }, desc: 'All fleet output x2', req: 'r3_1' },
    { id: 'r4_2', name: 'Asteroid Cartography', cost: 5000, tier: 4, effect: { rareAsteroidFrequency: 2 }, desc: 'Rare Asteroids 2x more frequent', req: 'r3_2' },
    { id: 'r4_3', name: 'Weapons Technology', cost: 7500, tier: 4, effect: { generatorMultiplier: { target: 'p5g6', mult: 1.1 } }, desc: 'Destroyers +10% fleet output', req: 'r3_3' },
    // Tier 5
    { id: 'r5_1', name: 'Alien Linguistics', cost: 10000, tier: 5, effect: { asChanceMultiplier: 3 }, desc: 'Alien Signal detection x3', req: 'r4_1' },
    { id: 'r5_2', name: 'Jovian Gas Chemistry', cost: 15000, tier: 5, effect: { phaseMultiplier: { phase: '6_orbit', mult: 3 } }, desc: 'Gas Giant generators x3', req: 'r4_2' },
    { id: 'r5_3', name: 'Warp Field Theory', cost: 25000, tier: 5, effect: { phase7CostReduction: 0.5 }, desc: 'Phase 7 unlock cost -50%', req: 'r4_3' },
    // Tier 6
    { id: 'r6_1', name: 'Interstellar Navigation', cost: 50000, tier: 6, effect: { systemCostReduction: 0.3 }, desc: 'Star system costs -30%', req: 'r5_1' },
    { id: 'r6_2', name: 'Dyson Sphere Engineering', cost: 100000, tier: 6, effect: { sdMultiplier: 5 }, desc: 'SD production x5', req: 'r5_2' },
    { id: 'r6_3', name: 'Multiverse Theory', cost: 250000, tier: 6, effect: { prestigeMultiplier: 1.25 }, desc: 'CD from prestige +25%', req: 'r5_3' }
  ];

  // ========== ACHIEVEMENTS ==========
  const ACHIEVEMENTS = [
    // Progression
    { id: 'ach_first_gen', name: 'First Steps', desc: 'Buy your first generator', reward: { credits: 500 }, category: 'progression' },
    { id: 'ach_all_parts', name: 'Assembly Required', desc: 'Purchase all 5 rocket parts', reward: { credits: 5000 }, category: 'progression' },
    { id: 'ach_launch', name: 'Liftoff!', desc: 'Launch your first rocket', reward: { credits: 10000 }, category: 'progression' },
    { id: 'ach_moon', name: 'To the Moon!', desc: 'Reach Phase 3', reward: { rp: 50 }, category: 'progression' },
    { id: 'ach_mars', name: 'The Red Planet', desc: 'Reach Phase 4', reward: { ore: 500 }, category: 'progression' },
    { id: 'ach_belt', name: 'Belt Miner', desc: 'Reach Phase 5', reward: { rm: 100 }, category: 'progression' },
    { id: 'ach_jupiter', name: 'Giant Steps', desc: 'Reach Phase 6', reward: { credits: 1e21 }, category: 'progression' },
    { id: 'ach_interstellar', name: 'Interstellar Pioneer', desc: 'Reach Phase 7', reward: { sd: 1000 }, category: 'progression' },
    { id: 'ach_galaxy', name: 'Galaxy Explorer', desc: 'Reach Phase 8', reward: { sd: 5000 }, category: 'progression' },
    { id: 'ach_prestige', name: 'Big Bang', desc: 'Complete first prestige', reward: { cosmicDust: 50 }, category: 'progression' },
    { id: 'ach_multiverse', name: 'Multiverse Traveler', desc: 'Reach Phase 9', reward: { cosmicDust: 100 }, category: 'progression' },
    // Earning
    { id: 'ach_earn1k', name: 'Pocket Change', desc: 'Earn 1,000 credits total', reward: { credits: 100 }, check: s => s.creditsAllTimeEarned >= 1000, category: 'earning' },
    { id: 'ach_earn1m', name: 'Getting Rich', desc: 'Earn 1M credits total', reward: { credits: 10000 }, check: s => s.creditsAllTimeEarned >= 1e6, category: 'earning' },
    { id: 'ach_earn1b', name: 'Millionaire', desc: 'Earn 1B credits total', reward: { credits: 1e6 }, check: s => s.creditsAllTimeEarned >= 1e9, category: 'earning' },
    { id: 'ach_earn1t', name: 'Billionaire', desc: 'Earn 1T credits total', reward: { credits: 1e9 }, check: s => s.creditsAllTimeEarned >= 1e12, category: 'earning' },
    { id: 'ach_earn1qa', name: 'Tycoon', desc: 'Earn 1Qa credits total', reward: { credits: 1e12 }, check: s => s.creditsAllTimeEarned >= 1e15, category: 'earning' },
    { id: 'ach_earn1qi', name: 'Mogul', desc: 'Earn 1Qi credits total', reward: { credits: 1e15 }, check: s => s.creditsAllTimeEarned >= 1e18, category: 'earning' },
    { id: 'ach_earn1sx', name: 'Space Bezos', desc: 'Earn 1Sx credits total', reward: { credits: 1e18 }, check: s => s.creditsAllTimeEarned >= 1e21, category: 'earning' },
    // Tapping
    { id: 'ach_tap1', name: 'First Tap', desc: 'Tap 1 time', reward: { credits: 10 }, check: s => s.totalTaps >= 1, category: 'tapping' },
    { id: 'ach_tap100', name: 'Clicker', desc: 'Tap 100 times', reward: { credits: 1000 }, check: s => s.totalTaps >= 100, category: 'tapping' },
    { id: 'ach_tap1k', name: 'Tapper', desc: 'Tap 1,000 times', reward: { credits: 50000 }, check: s => s.totalTaps >= 1000, category: 'tapping' },
    { id: 'ach_tap10k', name: 'Addicted', desc: 'Tap 10,000 times', reward: { credits: 5e6 }, check: s => s.totalTaps >= 10000, category: 'tapping' },
    { id: 'ach_tap100k', name: 'Carpal Tunnel', desc: 'Tap 100,000 times', reward: { credits: 1e9 }, check: s => s.totalTaps >= 100000, category: 'tapping' },
    { id: 'ach_tap1m', name: 'Infinite Tapper', desc: 'Tap 1,000,000 times', reward: { credits: 1e12 }, check: s => s.totalTaps >= 1000000, category: 'tapping' },
    // Generator
    { id: 'ach_gen100', name: 'Factory Floor', desc: 'Own 100 total generators', reward: { credits: 100000 }, check: s => getTotalGenerators(s) >= 100, category: 'generator' },
    { id: 'ach_gen500', name: 'Industrial Complex', desc: 'Own 500 total generators', reward: { credits: 10e6 }, check: s => getTotalGenerators(s) >= 500, category: 'generator' },
    { id: 'ach_gen1k', name: 'Mega Corporation', desc: 'Own 1,000 total generators', reward: { credits: 1e9 }, check: s => getTotalGenerators(s) >= 1000, category: 'generator' },
    { id: 'ach_gen5k', name: 'Galactic Empire', desc: 'Own 5,000 total generators', reward: { credits: 1e12 }, check: s => getTotalGenerators(s) >= 5000, category: 'generator' },
    // Crew
    { id: 'ach_crew1', name: 'First Hire', desc: 'Hire 1 astronaut', reward: { ore: 100 }, check: s => s.crew.totalAstronauts >= 1, category: 'crew' },
    { id: 'ach_crew10', name: 'Small Crew', desc: 'Hire 10 astronauts', reward: { ore: 1000 }, check: s => s.crew.totalAstronauts >= 10, category: 'crew' },
    { id: 'ach_crew100', name: 'Battalion', desc: 'Hire 100 astronauts', reward: { ore: 10000 }, check: s => s.crew.totalAstronauts >= 100, category: 'crew' },
    { id: 'ach_crew1k', name: 'Space Army', desc: 'Hire 1,000 astronauts', reward: { ore: 100000 }, check: s => s.crew.totalAstronauts >= 1000, category: 'crew' },
    // Terraforming
    { id: 'ach_terra10', name: 'First Breath', desc: 'Reach 10% Mars terraforming', reward: { credits: 100e9 }, check: s => s.terraforming.marsPercent >= 10, category: 'terraform' },
    { id: 'ach_terra50', name: 'Green Mars', desc: 'Reach 50% Mars terraforming', reward: { credits: 10e12 }, check: s => s.terraforming.marsPercent >= 50, category: 'terraform' },
    { id: 'ach_terra100', name: 'Blue Mars', desc: 'Reach 100% Mars terraforming', reward: { credits: 1e15 }, check: s => s.terraforming.marsPercent >= 100, category: 'terraform' },
    // Prestige
    { id: 'ach_pres1', name: 'Rebirth', desc: 'Prestige 1 time', reward: { cosmicDust: 100 }, check: s => s.totalPrestigeCount >= 1, category: 'prestige' },
    { id: 'ach_pres5', name: 'Cycle', desc: 'Prestige 5 times', reward: { cosmicDust: 500 }, check: s => s.totalPrestigeCount >= 5, category: 'prestige' },
    { id: 'ach_pres10', name: 'Eternal', desc: 'Prestige 10 times', reward: { cosmicDust: 2000 }, check: s => s.totalPrestigeCount >= 10, category: 'prestige' },
    { id: 'ach_pres25', name: 'Cosmic Being', desc: 'Prestige 25 times', reward: { cosmicDust: 10000 }, check: s => s.totalPrestigeCount >= 25, category: 'prestige' },
    { id: 'ach_pres50', name: 'Beyond Infinity', desc: 'Prestige 50 times', reward: { cosmicDust: 50000 }, check: s => s.totalPrestigeCount >= 50, category: 'prestige' },
    // Secret
    { id: 'ach_secret_patience', name: 'Patience', desc: 'Wait 24h without tapping', reward: { credits: 0, special: 'hourCredits' }, secret: true, category: 'secret' },
    { id: 'ach_secret_speed', name: 'Speed Runner', desc: 'Reach Phase 5 in 1 hour', reward: { cosmicDust: 500 }, secret: true, category: 'secret' },
    { id: 'ach_secret_first_contact', name: 'First Contact', desc: 'Collect first Alien Signal', reward: { rp: 1000 }, check: s => s.alienSignals >= 1, secret: true, category: 'secret' }
  ];

  function getTotalGenerators(state) {
    let total = 0;
    for (const key in state.generators) {
      total += (state.generators[key] || 0);
    }
    return total;
  }

  // ========== CAPTAIN'S LOG ==========
  const CAPTAINS_LOG = [
    { id: 'log1', trigger: 'gameStart', title: 'Day One', text: "They said I was crazy for buying rocket parts from a junkyard. Maybe they're right. But every great journey starts with a single, slightly rusty step." },
    { id: 'log2', trigger: 'firstPart', title: 'The Hull', text: "It's more rust than metal, but it'll hold. Probably. I spent all afternoon hammering out dents and welding patches over the biggest holes." },
    { id: 'log3', trigger: 'allParts', title: "She's Ready", text: "Against all odds, she's complete. A real rocket, built from trash and dreams. The neighbors think I've lost my mind." },
    { id: 'log4', trigger: 'launch', title: 'Liftoff', text: "The ground shook. The sky split open. And then... silence. Beautiful, perfect silence. I'm floating above everything I've ever known." },
    { id: 'log5', trigger: 'phase2', title: 'Orbit', text: "I can see my house from here. Actually, I can see everything from here. The Earth is so small, so fragile. And so beautiful." },
    { id: 'log6', trigger: 'phase3', title: 'Moonfall', text: "One small step for a junkyard mechanic. The Moon is desolate but majestic. Every crater tells a story billions of years old." },
    { id: 'log7', trigger: 'firstCrew', title: 'The Crew', text: "I'm not alone anymore. Hired our first astronaut today. Their eyes lit up when they saw the view from the observation deck." },
    { id: 'log8', trigger: 'phase4', title: 'Red Dust', text: "Mars is... desolate. But I see potential in every grain of red sand. We're going to turn this dead world into a paradise." },
    { id: 'log9', trigger: 'terraform25', title: 'First Rain', text: "It rained on Mars today. Actual rain. I stood outside in the thin atmosphere and cried. Nobody told me terraforming would be this emotional." },
    { id: 'log10', trigger: 'terraform100', title: 'New Earth', text: "Mars is green. Blue skies. Oceans. I can barely remember the red dust. We did the impossible." },
    { id: 'log11', trigger: 'phase5', title: 'The Belt', text: "Rocks as far as the eye can see. Every one of them is worth a fortune. Time to build a fleet." },
    { id: 'log12', trigger: 'firstCapitalShip', title: 'Flagship', text: "She's magnificent. A ship that could take on anything in the void. I stood on the bridge and felt like a proper captain for the first time." },
    { id: 'log13', trigger: 'phase6', title: 'The Giant', text: "Jupiter fills the entire viewport. You don't understand how BIG it is until you're floating next to it. I feel like an ant beside a mountain." },
    { id: 'log14', trigger: 'europaOcean', title: 'Under the Ice', text: "We broke through. Beneath Europa's ice... an ocean. Vast, dark, and teeming with possibility. And something is down there..." },
    { id: 'log15', trigger: 'firstAS', title: 'The Signal', text: "It's not random noise. It's structured. Intentional. Mathematical. We are not alone in this universe." },
    { id: 'log16', trigger: 'tenAS', title: 'The Message', text: "We decoded it. Coordinates. Someone... or something... wants us to come. Alpha Centauri. 4.37 light-years away." },
    { id: 'log17', trigger: 'phase7', title: 'New Suns', text: "Two suns rise over an alien horizon. 4.37 light-years from home, and yet... it feels like coming home to somewhere I've never been." },
    { id: 'log18', trigger: 'firstColony7', title: 'Colony', text: "We built something here. A home, far from home. Children will grow up under alien skies and think it's perfectly normal." },
    { id: 'log19', trigger: 'phase8', title: 'The Galaxy', text: "Billions of stars. Each one a possible home. Where do we go from here? The answer is: everywhere." },
    { id: 'log20', trigger: 'blackHole', title: 'Event Horizon', text: "Time moves differently here. I've seen things I can't explain. The light bends around us like water around a stone." },
    { id: 'log21', trigger: 'galacticCore', title: 'The Core', text: "The center of everything. A light so bright it blinds every sensor. I feel like I'm staring into the face of creation itself." },
    { id: 'log22', trigger: 'firstPrestige', title: 'Big Bang', text: "Everything collapsed. And then... began again. But I remember. I remember all of it. The junkyard. The stars. Everything." },
    { id: 'log23', trigger: 'prestige5', title: 'The Cycle', text: "Five times now. Each time I learn more. Each time I go further. Each time I understand a little more about what this universe really is." },
    { id: 'log24', trigger: 'prestige10', title: 'Wisdom', text: "I've lived a thousand lifetimes. The universe is a teacher. Patient, infinite, and endlessly surprising." },
    { id: 'log25', trigger: 'phase9', title: 'Beyond', text: "There are other universes. Infinite possibilities. Infinite me's. Each one building, exploring, reaching for the stars." },
    { id: 'log26', trigger: 'artifact1', title: 'Ancient Records I', text: "The artifact speaks of a civilization that spanned galaxies. They called themselves the Architects." },
    { id: 'log27', trigger: 'artifact2', title: 'Ancient Records II', text: "The Architects built wonders beyond our comprehension. Dyson spheres were their smallest projects." },
    { id: 'log28', trigger: 'artifact3', title: 'Ancient Records III', text: "Something happened. A cataclysm that unmade their civilization in an instant. They left these beacons as warnings." },
    { id: 'log29', trigger: 'artifact4', title: 'Ancient Records IV', text: "The warning is clear: 'Do not open the door at the center of everything.' But what door? And what's behind it?" },
    { id: 'log30', trigger: 'artifact5', title: 'Ancient Records V', text: "The final record: 'If you're reading this, you've already gone too far. But perhaps you'll succeed where we failed. Good luck, little ones.'" }
  ];

  // ========== EVENTS ==========
  const EVENTS = [
    { id: 'evt_solar', name: 'Solar Storm', duration: 300, effect: { energyMultiplier: 3 }, desc: 'Energy generators x3!', type: 'positive', icon: '\u2600' },
    { id: 'evt_meteor', name: 'Meteor Shower', duration: 180, effect: { tapMultiplier: 5 }, desc: 'Tap value x5!', type: 'positive', icon: '\u2604' },
    { id: 'evt_blackmarket', name: 'Black Market Deal', duration: 30, effect: { costReduction: 0.5 }, desc: 'All costs -50%!', type: 'positive', icon: '\u{1F3AD}' },
    { id: 'evt_malfunction', name: 'Equipment Malfunction', duration: 300, effect: { randomGeneratorStop: true }, desc: 'A generator stopped!', type: 'negative', icon: '\u26A0' },
    { id: 'evt_radiation', name: 'Cosmic Radiation Burst', duration: 120, effect: { rpMultiplier: 5 }, desc: 'RP generation x5!', type: 'positive', icon: '\u2622' },
    { id: 'evt_goldRush', name: 'Gold Rush', duration: 180, effect: { creditMultiplier: 10 }, desc: 'Credits x10!', type: 'positive', icon: '\u{1F4B0}' },
    { id: 'evt_tax', name: 'Tax Collector', duration: 0, effect: { loseCreditPercent: 0.05 }, desc: 'Lost 5% of credits!', type: 'negative', icon: '\u{1F4DC}' },
    { id: 'evt_wormhole', name: 'Wormhole Shortcut', duration: 10, effect: { skipProduction: 3600 }, desc: 'Tap for 1 hour of production!', type: 'positive', icon: '\u{1F300}' }
  ];

  // ========== DAILY REWARDS ==========
  const DAILY_REWARDS = [
    { day: 1, type: 'credits', amount: 300, desc: '5 min worth of credits' },
    { day: 2, type: 'rp', amount: 300, desc: '5 min worth of RP' },
    { day: 3, type: 'ore', amount: 300, desc: '5 min worth of Ore' },
    { day: 4, type: 'credits', amount: 600, desc: '10 min worth of credits' },
    { day: 5, type: 'random', desc: 'Random rare bonus' },
    { day: 6, type: 'credits', amount: 1800, desc: '30 min worth of credits' },
    { day: 7, type: 'cosmicDust', amount: 5, desc: '5 Cosmic Dust!' }
  ];

  // ========== STAR SYSTEM TYPES (Phase 8) ==========
  const STAR_SYSTEM_TYPES = [
    { type: 'lush', name: 'Lush System', creditMult: 2, bonus: '+200% crew capacity', rarity: 0.25 },
    { type: 'barren', name: 'Barren System', creditMult: 3, bonus: '+500% Ore production', rarity: 0.25 },
    { type: 'gas', name: 'Gas System', creditMult: 2, bonus: '+300% SD production', rarity: 0.20 },
    { type: 'frozen', name: 'Frozen System', creditMult: 1.5, bonus: '+1000% RP production', rarity: 0.15 },
    { type: 'anomaly', name: 'Anomaly System', creditMult: 5, bonus: 'Random rare bonus', rarity: 0.10 },
    { type: 'ancient', name: 'Ancient Ruins', creditMult: 1, bonus: 'One-time massive bonus + lore', rarity: 0.05 }
  ];

  // ========== MULTIVERSE UNIVERSES (Phase 9) ==========
  const UNIVERSES = [
    { id: 'uni_speed', name: 'Universe-\u03B1 (Speed)', rules: 'Everything 10x faster but 10x more expensive', reward: 5 },
    { id: 'uni_scarce', name: 'Universe-\u03B2 (Scarcity)', rules: 'Only 3 generator types per phase', reward: 10 },
    { id: 'uni_abundance', name: 'Universe-\u03B3 (Abundance)', rules: 'Start with 1B credits but no tapping', reward: 3 },
    { id: 'uni_challenge', name: 'Universe-\u03B4 (Challenge)', rules: 'Generators degrade unless maintained', reward: 15 },
    { id: 'uni_mirror', name: 'Universe-\u03B5 (Mirror)', rules: 'Phase order reversed', reward: 20 },
    { id: 'uni_endless', name: 'Universe-\u221E (Endless)', rules: 'No prestige, infinite scaling', reward: 1 },
    { id: 'uni_mystery', name: 'Universe-??? (Mystery)', rules: 'Random combination of 3 rules', reward: 10 }
  ];

  // ========== INFINITY TOKEN SHOP ==========
  const IT_SHOP = [
    { id: 'it_golden', name: 'Golden Rocket Skin', cost: 10, desc: 'Rocket appears gold in all phases' },
    { id: 'it_neon', name: 'Neon Trail', cost: 15, desc: 'Rocket leaves a neon trail' },
    { id: 'it_names', name: 'Star Name Customizer', cost: 5, desc: 'Rename your star systems' },
    { id: 'it_title', name: 'Custom Title', cost: 20, desc: 'Display a custom title' },
    { id: 'it_dark', name: 'Dark Mode Theme', cost: 10, desc: 'Alternative dark UI theme' },
    { id: 'it_retro', name: 'Retro Pixel Theme', cost: 25, desc: '8-bit pixel art style' },
    { id: 'it_rainbow', name: 'Rainbow Particles', cost: 15, desc: 'Rainbow particle effects' },
    { id: 'it_speed', name: 'Speed Lines Background', cost: 10, desc: 'Animated speed lines' }
  ];

  // ========== ASTRONAUT NAMES ==========
  const ASTRONAUT_NAMES = [
    'Yuri K.', 'Sally R.', 'Buzz A.', 'Valentina T.', 'Mae J.', 'Neil A.',
    'John G.', 'Alan S.', 'Christa M.', 'Peggy W.', 'Scott K.', 'Chris H.',
    'Tim P.', 'Sunita W.', 'Yang L.', 'Takao D.', 'Samantha C.', 'Luca P.',
    'Karen N.', 'Jessica M.', 'Kate R.', 'David S.', 'Mark K.', 'Eileen C.',
    'Frank B.', 'Alexei L.', 'Koichi W.', 'Thomas P.', 'Aki H.', 'Oleg K.',
    'Sergei K.', 'Roberta B.', 'Judith R.', 'Ellen O.', 'Shannon L.', 'Bonnie D.',
    'Kalpana C.', 'Liu Y.', 'Jing H.', 'Viktor A.', 'Gennady P.', 'Paolo N.',
    'Alexander G.', 'Andreas M.', 'Soichi N.', 'Naoko Y.', 'Chiaki M.', 'Mamoru M.'
  ];

  const CREW_TIERS = [
    { name: 'Rookie', bonus: 0.05, upgradeCost: null },
    { name: 'Trained', bonus: 0.12, upgradeCost: { ore: 500, rp: 100 } },
    { name: 'Veteran', bonus: 0.25, upgradeCost: { ore: 2000, rp: 500 } },
    { name: 'Elite', bonus: 0.50, upgradeCost: { ore: 10000, rp: 2500 } },
    { name: 'Legendary', bonus: 1.00, upgradeCost: { ore: 50000, rp: 10000 } }
  ];

  return {
    PHASES, ROCKET_PARTS, GENERATORS, UPGRADES, CD_SHOP, RESEARCH,
    ACHIEVEMENTS, CAPTAINS_LOG, EVENTS, DAILY_REWARDS, STAR_SYSTEM_TYPES,
    UNIVERSES, IT_SHOP, ASTRONAUT_NAMES, CREW_TIERS, getTotalGenerators
  };
})();
