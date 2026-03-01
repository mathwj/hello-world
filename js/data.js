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
      { id: 'p1g7', name: 'Rocket Part Fabricator', baseCost: 1500000, growth: 1.15, output: { credits: 15000 }, icon: '\u{1F5A8}', desc: 'Turns raw scrap into rocket-grade parts' },
      { id: 'p1g8', name: 'Junkyard Negotiator', baseCost: 8000000, growth: 1.15, output: { credits: 75000 }, icon: '\u{1F4DE}', desc: 'Sells scrap at premium prices' },
      { id: 'p1g9', name: 'Satellite Dish Scavenger', baseCost: 40000000, growth: 1.15, output: { credits: 400000 }, icon: '\u{1F4E1}', desc: 'Intercepts valuable satellite data' }
    ],
    2: [
      { id: 'p2g1', name: 'Solar Panel Array', baseCost: 5000, growth: 1.15, output: { credits: 50 }, icon: '\u2600', desc: 'Converts sunlight into energy credits' },
      { id: 'p2g2', name: 'Communication Relay', baseCost: 25000, growth: 1.15, output: { credits: 200, rp: 0.5 }, icon: '\u{1F4E1}', desc: 'Relays data back to Earth' },
      { id: 'p2g3', name: 'Satellite Deployer', baseCost: 100000, growth: 1.15, output: { credits: 800, rp: 2 }, icon: '\u{1F6F0}', desc: 'Launches micro-satellites' },
      { id: 'p2g4', name: 'Space Tourism Module', baseCost: 500000, growth: 1.15, output: { credits: 4000, rp: 5 }, icon: '\u{1F680}', desc: 'Wealthy tourists see Earth from space' },
      { id: 'p2g5', name: 'Orbital Lab', baseCost: 2500000, growth: 1.15, output: { credits: 20000, rp: 20 }, icon: '\u{1F52C}', desc: 'Zero-gravity research facility' },
      { id: 'p2g6', name: 'Space Hotel', baseCost: 12000000, growth: 1.15, output: { credits: 100000, rp: 50 }, icon: '\u{1F3E8}', desc: 'A luxury orbital hotel' },
      { id: 'p2g7', name: 'Orbital Megastructure', baseCost: 60000000, growth: 1.15, output: { credits: 500000, rp: 200 }, icon: '\u{1F3D7}', desc: 'Massive modular platform' },
      { id: 'p2g8', name: 'Debris Recycler', baseCost: 300000000, growth: 1.15, output: { credits: 2500000, rp: 500 }, icon: '\u{1F9F2}', desc: 'Captures and recycles orbital debris' },
      { id: 'p2g9', name: 'Zero-G Crystal Farm', baseCost: 1500000000, growth: 1.15, output: { credits: 12000000, rp: 2000 }, icon: '\u{1F48E}', desc: 'Grows perfect crystals in microgravity' }
    ],
    3: [
      { id: 'p3g1', name: 'Lunar Drill', baseCost: 1e6, growth: 1.15, output: { credits: 50000, ore: 1 }, icon: '\u26CF', desc: 'Basic lunar drill rig' },
      { id: 'p3g2', name: 'Regolith Processor', baseCost: 5e6, growth: 1.15, output: { credits: 250000, ore: 3, rp: 1 }, icon: '\u2699', desc: 'Processes lunar regolith' },
      { id: 'p3g3', name: 'Helium-3 Extractor', baseCost: 25e6, growth: 1.15, output: { credits: 1.25e6, ore: 10, rp: 3 }, icon: '\u2622', desc: 'Extracts He-3 from soil' },
      { id: 'p3g4', name: 'Moon Base Module', baseCost: 100e6, growth: 1.15, output: { credits: 6e6, ore: 25, rp: 10 }, icon: '\u{1F3E0}', desc: 'Habitat dome', crewCapacity: 2 },
      { id: 'p3g5', name: 'Lunar Rover Fleet', baseCost: 500e6, growth: 1.15, output: { credits: 30e6, ore: 60, rp: 20 }, icon: '\u{1F697}', desc: 'Group of rovers' },
      { id: 'p3g6', name: 'Mass Driver', baseCost: 2.5e9, growth: 1.15, output: { credits: 150e6, ore: 150, rp: 50 }, icon: '\u{1F4A5}', desc: 'Electromagnetic launcher' },
      { id: 'p3g7', name: 'Lunar Megafactory', baseCost: 12e9, growth: 1.15, output: { credits: 750e6, ore: 400, rp: 150 }, icon: '\u{1F3ED}', desc: 'Large factory complex' },
      { id: 'p3g8', name: 'Space Elevator (Moon)', baseCost: 60e9, growth: 1.15, output: { credits: 3.5e9, ore: 1000, rp: 500 }, icon: '\u2195', desc: 'Tether extending upward' },
      { id: 'p3g9', name: 'Lunar Observatory', baseCost: 300e9, growth: 1.15, output: { credits: 15e9, ore: 2500, rp: 1000 }, icon: '\u{1F52D}', desc: 'Telescope dome on the lunar surface' },
      { id: 'p3g10', name: 'Dark Side Mining Complex', baseCost: 1.5e12, growth: 1.15, output: { credits: 80e9, ore: 7000, rp: 3000 }, icon: '\u26CF', desc: 'Underground complex on far side of Moon' }
    ],
    4: [
      { id: 'p4g1', name: 'Dust Collector', baseCost: 100e9, growth: 1.15, output: { credits: 1e9 }, terraform: 0.001, icon: '\u{1F32A}', desc: 'Collects Martian dust' },
      { id: 'p4g2', name: 'Atmospheric Processor', baseCost: 500e9, growth: 1.15, output: { credits: 5e9 }, terraform: 0.01, icon: '\u{1F32B}', desc: 'Adds gases to atmosphere' },
      { id: 'p4g3', name: 'Ice Melter', baseCost: 2.5e12, growth: 1.15, output: { credits: 25e9 }, terraform: 0.05, icon: '\u2744', desc: 'Melts polar ice caps' },
      { id: 'p4g4', name: 'Greenhouse Array', baseCost: 12e12, growth: 1.15, output: { credits: 120e9 }, terraform: 0.1, icon: '\u{1F33F}', desc: 'Warms the atmosphere' },
      { id: 'p4g5', name: 'Biodome', baseCost: 60e12, growth: 1.15, output: { credits: 600e9 }, terraform: 0.25, icon: '\u{1F333}', desc: 'Protected ecosystems' },
      { id: 'p4g6', name: 'Gene Lab', baseCost: 300e12, growth: 1.15, output: { credits: 3e12 }, terraform: 0.5, icon: '\u{1F9EC}', desc: 'Engineers organisms for Mars' },
      { id: 'p4g7', name: 'Colony Hub', baseCost: 1.5e15, growth: 1.15, output: { credits: 15e12 }, terraform: 1.0, icon: '\u{1F3D9}', desc: 'Full city module' },
      { id: 'p4g8', name: 'Terraform Engine', baseCost: 7.5e15, growth: 1.15, output: { credits: 75e12 }, terraform: 2.5, icon: '\u2699', desc: 'Planetary-scale machine' },
      { id: 'p4g9', name: 'Orbital Mirror Network', baseCost: 40e15, growth: 1.15, output: { credits: 400e12 }, terraform: 5.0, icon: '\u{1F58C}', desc: 'Array of mirrors warming Mars from orbit' },
      { id: 'p4g10', name: 'Planetary AI', baseCost: 200e15, growth: 1.15, output: { credits: 2e15 }, terraform: 10.0, icon: '\u{1F916}', desc: 'AI managing all terraforming simultaneously' }
    ],
    5: [
      { id: 'p5g1', name: 'Scout Probe', baseCost: 1e15, growth: 1.15, output: { credits: 100e12, rm: 0.5 }, icon: '\u{1F6F8}', desc: 'Small scout drone' },
      { id: 'p5g2', name: 'Mining Shuttle', baseCost: 10e15, growth: 1.15, output: { credits: 1e15, rm: 2 }, icon: '\u26CF', desc: 'Small ship with drill' },
      { id: 'p5g3', name: 'Mining Barge', baseCost: 100e15, growth: 1.15, output: { credits: 10e15, rm: 10 }, icon: '\u{1F6A2}', desc: 'Large bulky mining ship' },
      { id: 'p5g4', name: 'Refinery Ship', baseCost: 1e18, growth: 1.15, output: { credits: 100e15, rm: 50 }, icon: '\u{1F3ED}', desc: 'Ship with smelter' },
      { id: 'p5g5', name: 'Heavy Freighter', baseCost: 10e18, growth: 1.15, output: { credits: 1e18, rm: 200 }, icon: '\u{1F69A}', desc: 'Massive cargo hauler' },
      { id: 'p5g6', name: 'Destroyer Escort', baseCost: 100e18, growth: 1.15, output: { credits: 10e18, rm: 500 }, icon: '\u2694', desc: 'Armed escort ship' },
      { id: 'p5g7', name: 'Capital Ship', baseCost: 1e21, growth: 1.15, output: { credits: 100e18, rm: 2000 }, icon: '\u{1F680}', desc: 'Enormous flagship' },
      { id: 'p5g8', name: 'Dyson Collector', baseCost: 10e21, growth: 1.15, output: { credits: 1e21, rm: 10000 }, icon: '\u2600', desc: 'Energy collection sphere' },
      { id: 'p5g9', name: 'Warp Tug', baseCost: 100e21, growth: 1.15, output: { credits: 10e21, rm: 50000 }, icon: '\u{1F680}', desc: 'Ship with warp nacelles' },
      { id: 'p5g10', name: 'Singularity Harvester', baseCost: 1e24, growth: 1.15, output: { credits: 100e21, rm: 250000 }, icon: '\u{1F573}', desc: 'Ship orbiting a micro black hole' }
    ],
    // Phase 6 sub-zones
    '6_orbit': [
      { id: 'p6og1', name: 'Atmospheric Skimmer', baseCost: 1e21, growth: 1.15, output: { credits: 10e18 }, icon: '\u{1F32A}', desc: 'Skims Jupiter atmosphere' },
      { id: 'p6og2', name: 'Gas Scoop Mk.I', baseCost: 10e21, growth: 1.15, output: { credits: 100e18 }, icon: '\u26FD', desc: 'Scoops hydrogen gas' },
      { id: 'p6og3', name: 'Gas Scoop Mk.II', baseCost: 100e21, growth: 1.15, output: { credits: 1e21 }, icon: '\u26FD', desc: 'Advanced gas scoop' },
      { id: 'p6og4', name: 'Hydrogen Refinery', baseCost: 1e24, growth: 1.15, output: { credits: 10e21, rp: 100 }, icon: '\u{1F3ED}', desc: 'Refines hydrogen fuel' },
      { id: 'p6og5', name: 'Fusion Harvester', baseCost: 10e24, growth: 1.15, output: { credits: 100e21, rp: 500 }, icon: '\u2622', desc: 'Harvests fusion fuel' },
      { id: 'p6og6', name: 'Jupiter Orbital Station', baseCost: 100e24, growth: 1.15, output: { credits: 1e24, rp: 2000, rm: 50 }, icon: '\u{1F6F8}', desc: 'Massive orbital platform' },
      { id: 'p6og7', name: 'Metallic Hydrogen Extractor', baseCost: 1e27, growth: 1.15, output: { credits: 100e24, rp: 5000 }, icon: '\u269B', desc: 'Extracts metallic hydrogen from deep atmosphere' },
      { id: 'p6og8', name: 'Jovian Energy Siphon', baseCost: 10e27, growth: 1.15, output: { credits: 1e27, rp: 20000, rm: 200 }, icon: '\u26A1', desc: 'Siphons energy from Jupiter storms' }
    ],
    '6_io': [
      { id: 'p6ig1', name: 'Lava Skimmer', baseCost: 5000, growth: 1.15, output: { ore: 50 }, costCurrency: 'ore', icon: '\u{1F30B}', desc: 'Skims lava flows', degrades: true, degradeRate: 0.01 },
      { id: 'p6ig2', name: 'Heat-Resistant Drill', baseCost: 20000, growth: 1.15, output: { ore: 200 }, costCurrency: 'ore', icon: '\u26CF', desc: 'Drills volcanic rock', degrades: true, degradeRate: 0.01 },
      { id: 'p6ig3', name: 'Volcanic Tap', baseCost: 100000, growth: 1.15, output: { ore: 1000 }, costCurrency: 'ore', icon: '\u{1F525}', desc: 'Taps into volcanic vents', degrades: true, degradeRate: 0.005 },
      { id: 'p6ig4', name: 'Magma Refinery', baseCost: 500000, growth: 1.15, output: { ore: 5000 }, costCurrency: 'ore', icon: '\u{1F3ED}', desc: 'Refines magma into ore', degrades: true, degradeRate: 0.005 },
      { id: 'p6ig5', name: 'Core Tapper', baseCost: 2000000, growth: 1.15, output: { ore: 25000 }, costCurrency: 'ore', icon: '\u{1F4A7}', desc: 'Taps into Io\'s molten core', degrades: true, degradeRate: 0.0042 },
      { id: 'p6ig6', name: 'Lava Forge', baseCost: 10000000, growth: 1.15, output: { ore: 100000 }, costCurrency: 'ore', icon: '\u{1F525}', desc: 'Forges materials in volcanic heat', degrades: true, degradeRate: 0.0042 }
    ],
    '6_europa': [
      { id: 'p6eg1', name: 'Ice Breaker', baseCost: 10e21, growth: 1.15, output: { credits: 50e18 }, asChance: 0.01, icon: '\u2744', desc: 'Breaks through ice crust' },
      { id: 'p6eg2', name: 'Submarine Drone', baseCost: 100e21, growth: 1.15, output: { credits: 500e18 }, asChance: 0.03, icon: '\u{1F6A4}', desc: 'Explores subsurface ocean' },
      { id: 'p6eg3', name: 'Deep Ocean Lab', baseCost: 1e24, growth: 1.15, output: { credits: 5e21 }, asChance: 0.08, icon: '\u{1F52C}', desc: 'Researches alien life' },
      { id: 'p6eg4', name: 'Alien Signal Decoder', baseCost: 10e24, growth: 1.15, output: { credits: 50e21 }, asChance: 0.20, icon: '\u{1F4E1}', desc: 'Decodes alien signals' },
      { id: 'p6eg5', name: 'Hydrothermal Station', baseCost: 100e24, growth: 1.15, output: { credits: 500e21 }, asChance: 0.35, icon: '\u2668', desc: 'Studies hydrothermal vents' },
      { id: 'p6eg6', name: 'Alien Archaeology Lab', baseCost: 1e27, growth: 1.15, output: { credits: 5e24 }, asChance: 0.60, icon: '\u{1F52C}', desc: 'Excavates alien artifacts' }
    ],
    '6_ganymede': [
      { id: 'p6gg1', name: 'Ganymede Outpost', baseCost: 5e21, growth: 1.15, output: { credits: 20e18 }, crewCapacity: 5, icon: '\u{1F3E0}', desc: 'Basic outpost' },
      { id: 'p6gg2', name: 'Underground City', baseCost: 50e21, growth: 1.15, output: { credits: 200e18 }, crewCapacity: 20, icon: '\u{1F3D9}', desc: 'Subterranean city' },
      { id: 'p6gg3', name: 'Mega Habitat', baseCost: 500e21, growth: 1.15, output: { credits: 2e21 }, crewCapacity: 100, icon: '\u{1F3DF}', desc: 'Massive habitat complex' },
      { id: 'p6gg4', name: 'Planetary Citadel', baseCost: 5e24, growth: 1.15, output: { credits: 20e21 }, crewCapacity: 500, icon: '\u{1F3F0}', desc: 'Moon-spanning fortress' },
      { id: 'p6gg5', name: 'Orbital Academy', baseCost: 50e24, growth: 1.15, output: { credits: 200e21 }, crewCapacity: 2000, icon: '\u{1F393}', desc: 'Auto-trains Rookies to Trained' },
      { id: 'p6gg6', name: 'Dyson Habitat Ring', baseCost: 500e24, growth: 1.15, output: { credits: 2e24 }, crewCapacity: 10000, icon: '\u{1F300}', desc: 'Massive ring habitat' }
    ],
    '6_callisto': [
      { id: 'p6cg1', name: 'Signal Relay', baseCost: 20e21, growth: 1.15, output: {}, globalBoost: 0.02, icon: '\u{1F4E1}', desc: '+2% all income' },
      { id: 'p6cg2', name: 'Quantum Entanglement Hub', baseCost: 200e21, growth: 1.15, output: {}, globalBoost: 0.05, icon: '\u269B', desc: '+5% all income' },
      { id: 'p6cg3', name: 'Galactic Broadcast Array', baseCost: 2e24, growth: 1.15, output: {}, globalBoost: 0.15, icon: '\u{1F4E1}', desc: '+15% all income' },
      { id: 'p6cg4', name: 'Omniscient Network', baseCost: 20e24, growth: 1.15, output: {}, globalBoost: 0.50, icon: '\u{1F310}', desc: '+50% all income' },
      { id: 'p6cg5', name: 'Ansible Array', baseCost: 200e24, growth: 1.15, output: {}, globalBoost: 1.00, icon: '\u{1F4E1}', desc: '+100% all income' },
      { id: 'p6cg6', name: 'Reality Anchor', baseCost: 2e27, growth: 1.15, output: {}, globalBoost: 2.50, icon: '\u2693', desc: '+250% all income' }
    ],
    '7_haven': [
      { id: 'p7hg1', name: 'Colony Ship Landing', baseCost: 1e24, growth: 1.15, output: { credits: 10e21, sd: 1 }, icon: '\u{1F680}', desc: 'First colony on new world' },
      { id: 'p7hg2', name: 'Bio-Habitat Complex', baseCost: 10e24, growth: 1.15, output: { credits: 100e21, sd: 5 }, crewCapacity: 10, autoCrewPerHour: 1, icon: '\u{1F33F}', desc: 'Growing habitats, +1 crew/hr' },
      { id: 'p7hg3', name: 'Planetary Capital', baseCost: 100e24, growth: 1.15, output: { credits: 1e24, sd: 25 }, autoCrewPerHour: 5, icon: '\u{1F3DB}', desc: 'Capital of the colony, +5 crew/hr' },
      { id: 'p7hg4', name: 'Dyson Tree Forest', baseCost: 1e27, growth: 1.15, output: { credits: 10e24, sd: 100 }, crewBonusMultiplier: 2, icon: '\u{1F332}', desc: 'Living megastructures — all crew bonuses ×2' },
      { id: 'p7hg5', name: 'Genetic Archive', baseCost: 10e27, growth: 1.15, output: { credits: 100e24, sd: 500 }, autoCrewPerHour: 25, crewStartTier: 1, icon: '\u{1F9EC}', desc: '+25 crew/hr, all new crew start as Trained' },
      { id: 'p7hg6', name: 'World Mind', baseCost: 100e27, growth: 1.15, output: { credits: 1e27, sd: 2500 }, autoCrewPerHour: 100, crewBonusMultiplier: 3, icon: '\u{1F9E0}', desc: '+100 crew/hr, all crew bonuses ×3' }
    ],
    '7_ferrum': [
      { id: 'p7fg1', name: 'Strip Mining Drones', baseCost: 5e24, growth: 1.15, output: { ore: 10000, rm: 100, sd: 0.5 }, icon: '\u26CF', desc: 'Automated mining drones' },
      { id: 'p7fg2', name: 'Core Extractor', baseCost: 50e24, growth: 1.15, output: { ore: 50000, rm: 500, sd: 2 }, icon: '\u{1F300}', desc: 'Extracts from planet core' },
      { id: 'p7fg3', name: 'Planet Cracker', baseCost: 500e24, growth: 1.15, output: { ore: 250000, rm: 2500, sd: 10 }, icon: '\u{1F4A5}', desc: 'Cracks planets for resources' },
      { id: 'p7fg4', name: 'Matter Converter', baseCost: 5e27, growth: 1.15, output: { ore: 1000000, rm: 10000, sd: 50 }, icon: '\u269B', desc: 'Converts any matter' },
      { id: 'p7fg5', name: 'Dimensional Drill', baseCost: 50e27, growth: 1.15, output: { ore: 5000000, rm: 50000, sd: 250 }, icon: '\u{1F300}', desc: 'Drills through dimensional barriers' },
      { id: 'p7fg6', name: 'Atomic Disassembler', baseCost: 500e27, growth: 1.15, output: { ore: 25000000, rm: 250000, sd: 1000 }, icon: '\u269B', desc: 'Disassembles matter at atomic level' }
    ],
    '7_nebula': [
      { id: 'p7ng1', name: 'Cloud City', baseCost: 10e24, growth: 1.15, output: { credits: 500e21, sd: 10 }, icon: '\u2601', desc: 'Floating city in gas giant' },
      { id: 'p7ng2', name: 'Fusion Core Harvester', baseCost: 100e24, growth: 1.15, output: { credits: 5e24, sd: 50 }, icon: '\u2622', desc: 'Harvests fusion energy' },
      { id: 'p7ng3', name: 'Dyson Sphere Fragment', baseCost: 1e27, growth: 1.15, output: { credits: 50e24, sd: 250 }, icon: '\u2600', desc: 'Partial Dyson sphere' },
      { id: 'p7ng4', name: 'Star Forge', baseCost: 10e27, growth: 1.15, output: { credits: 500e24, sd: 1000 }, icon: '\u2B50', desc: 'Forges matter from starlight' },
      { id: 'p7ng5', name: 'Antimatter Collector', baseCost: 100e27, growth: 1.15, output: { credits: 5e27, sd: 5000 }, icon: '\u2622', desc: 'Collects antimatter from nebula' },
      { id: 'p7ng6', name: 'Dyson Sphere (Complete)', baseCost: 1e30, growth: 1.15, output: { credits: 50e27, sd: 25000 }, icon: '\u2600', desc: 'A complete Dyson sphere' }
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
      { id: 'u1_10', name: 'Junkyard Dog', cost: 250000, currency: 'credits', effect: { phaseMultiplier: { phase: 1, mult: 1.25 } }, desc: 'All Phase 1 generators +25%', req: { allGeneratorsPhase: 1 } },
      // Expansion B upgrades
      { id: 'u1_11', name: 'Coffee for the Team', cost: 3000, currency: 'credits', effect: { tempBoost: { mult: 1.1, duration: 300 } }, desc: 'All generators +10% for 5 min (repeatable)', repeatable: true, cooldown: 300, req: { totalGenerators: 3 } },
      { id: 'u1_12', name: 'Treasure Map', cost: 15000, currency: 'credits', effect: { luckyDropFrequency: 1.5 }, desc: 'Lucky Drops appear 50% more often', req: { totalGenerators: 20 } },
      { id: 'u1_13', name: 'Night Vision Goggles', cost: 40000, currency: 'credits', effect: { nightTapMultiplier: 2 }, desc: 'Tap x2 during Night weather (instead of x1.5)', req: { weatherSeen: 'starry_night' } },
      { id: 'u1_14', name: 'Scrapyard Expansion', cost: 150000, currency: 'credits', effect: { unlockGenerators: ['p1g8', 'p1g9'] }, desc: 'Unlock generators #8 and #9', req: { totalGenerators: 50 } },
      { id: 'u1_15', name: 'Blueprints Upgrade', cost: 500000, currency: 'credits', effect: { showProgress: true }, desc: 'Rocket parts show progress bars', req: { allRocketParts: true } },
      { id: 'u1_16', name: 'Magnet Hands', cost: 1000000, currency: 'credits', effect: { luckyDropSlowdown: 0.5 }, desc: 'Lucky Drops travel 50% slower', req: { luckyDropsCaught: 100 } },
      { id: 'u1_17', name: 'Junkyard Radio', cost: 3000000, currency: 'credits', effect: { goldenRushFrequency: 2 }, desc: 'Golden Rush happens 2x more often', req: { goldenRushCount: 3 } },
      { id: 'u1_18', name: 'Rocket Paint Job', cost: 5000000, currency: 'credits', effect: { rocketPaint: true }, desc: 'Custom rocket paint scheme', req: { allRocketParts: true } }
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
      { id: 'u2_9', name: 'Radiation Shielding', cost: 100, currency: 'rp', costSecondary: { credits: 50e6 }, effect: { unlockPhase: 3 }, desc: 'UNLOCK Phase 3: The Moon' },
      // Expansion B upgrades
      { id: 'u2_10', name: 'Orbital Mapping', cost: 30, currency: 'rp', effect: { previewPhase3: true }, desc: 'Preview Phase 3 generators' },
      { id: 'u2_11', name: 'Signal Amplifier II', cost: 75, currency: 'rp', effect: { generatorMultiplier: { target: 'p2g2', mult: 2 } }, desc: 'Comm Relay output x2 AND RP x2', req: { generator: 'p2g2', count: 15 } },
      { id: 'u2_12', name: 'Tourist Brochure', cost: 120, currency: 'rp', effect: { weatherGenBonus: { gen: 'p2g4', weather: 'aurora', mult: 3 } }, desc: 'Space Tourism x3 during Aurora', req: { generator: 'p2g4', count: 20 } },
      { id: 'u2_13', name: 'Centrifuge Lab', cost: 250, currency: 'rp', effect: { weatherGenBonus: { gen: 'p2g5', weather: 'eclipse', mult: 2 } }, desc: 'Orbital Lab RP x2 during Eclipse', req: { generator: 'p2g5', count: 10 } },
      { id: 'u2_14', name: 'Self-Replicating Panels', cost: 400, currency: 'rp', effect: { freeEvery: { gen: 'p2g1', interval: 100 } }, desc: 'Every 100th Solar Panel is free', req: { generator: 'p2g1', count: 50 } },
      { id: 'u2_15', name: 'Space Billboard', cost: 600, currency: 'rp', effect: { tapMultiplier: 5 }, desc: 'Tap value in Phase 2 x5', req: { totalTaps: 10000 } },
      { id: 'u2_16', name: 'Quantum Entanglement Comm', cost: 1000, currency: 'rp', effect: { previousZoneRate: 0.5 }, desc: 'Previous zone generators at 50% rate', req: { generator: 'p2g7', count: 5 } },
      { id: 'u2_17', name: 'ISS Partnership', cost: 2000, currency: 'rp', effect: { skipProduction: 3600 }, desc: 'One-time: earn 1 hour of income', req: { totalPhaseGenerators: { phase: 2, count: 100 } } }
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
      { id: 'u3_11', name: 'Deep Space Antenna', cost: 500, currency: 'ore', costSecondary: { credits: 10e9 }, effect: { unlockPhase: 4 }, desc: 'UNLOCK Phase 4: Mars' },
      // Expansion B upgrades
      { id: 'u3_12', name: 'Lunar GPS', cost: 100, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g5', mult: 2 } }, desc: 'Rovers produce x2', req: { generator: 'p3g5', count: 10 } },
      { id: 'u3_13', name: 'Underground Railroad', cost: 250, currency: 'ore', effect: { synergyBoost: { gens: ['p3g6', 'p3g8'], mult: 2 } }, desc: 'Mass Driver + Space Elevator both x2', req: { generator: 'p3g6', count: 5 } },
      { id: 'u3_14', name: 'Astronaut Academy', cost: 400, currency: 'ore', effect: { crewCostReduction: 0.3 }, desc: 'Crew hiring cost -30%', req: { crewHired: 10 } },
      { id: 'u3_15', name: 'Moonshine Distillery', cost: 750, currency: 'ore', effect: { phaseMultiplier: { phase: 3, mult: 1.25 } }, desc: 'All Moon credits +25%', req: { generator: 'p3g4', count: 50 } },
      { id: 'u3_16', name: 'Lunar Olympiad', cost: 1500, currency: 'ore', effect: { crewUpgradeCostReduction: 0.2 }, desc: 'Crew upgrade costs -20%', req: { veteranCrew: 5 } },
      { id: 'u3_17', name: 'Tidal Lock Advantage', cost: 3000, currency: 'ore', effect: { generatorMultiplier: { target: 'p3g10', mult: 3 } }, desc: 'Dark Side Mining Complex x3', req: { generator: 'p3g10', count: 10 } },
      { id: 'u3_18', name: 'He-3 Fusion Reactor', cost: 2000, currency: 'rp', effect: { generatorMultiplier: { target: 'p3g3', mult: 3 }, phaseMultiplier: { phase: 3, mult: 1.15 } }, desc: 'He-3 Extractor x3 + Moon +15%', req: { generator: 'p3g3', count: 25 } },
      { id: 'u3_19', name: 'Earth-Moon Laser Link', cost: 5000, currency: 'rp', effect: { previousZoneMultiplier: 2 }, desc: 'Previous zone income x2 on Moon', req: { generator: 'p3g8', count: 5 } }
    ],
    4: [
      { id: 'u4_1', name: 'Martian Soil Analysis', cost: 1000, currency: 'ore', effect: { generatorMultiplier: { target: 'p4g1', mult: 3 } }, desc: 'Dust Collector x3' },
      { id: 'u4_2', name: 'CO2 Compression', cost: 2000, currency: 'ore', effect: { generatorMultiplier: { target: 'p4g2', mult: 2 }, terraformMultiplier: 1.5 }, desc: 'Atmo Processor x2, terraform x1.5' },
      { id: 'u4_3', name: 'Solar Reflector Array', cost: 5000, currency: 'rp', effect: { generatorMultiplier: { target: 'p4g3', mult: 3 }, terraformMultiplier: 1.5 }, desc: 'Ice Melter x3, terraform x1.5' },
      { id: 'u4_4', name: 'UV-Resistant Glass', cost: 5000, currency: 'ore', effect: { generatorMultiplier: { target: 'p4g4', mult: 2 } }, desc: 'Greenhouse x2' },
      { id: 'u4_5', name: 'Extremophile Bacteria', cost: 10000, currency: 'rp', effect: { generatorMultiplier: { target: 'p4g5', mult: 3 }, terraformMultiplier: 2 }, desc: 'Biodome x3, terraform x2' },
      { id: 'u4_6', name: 'CRISPR Terraforming', cost: 10000, currency: 'ore', effect: { generatorMultiplier: { target: 'p4g6', mult: 2 } }, desc: 'Gene Lab x2' },
      { id: 'u4_7', name: 'Self-Expanding Colony', cost: 500e15, currency: 'credits', effect: { generatorMultiplier: { target: 'p4g7', mult: 3 } }, desc: 'Colony Hub x3' },
      { id: 'u4_8', name: 'Planetary Core Tap', cost: 50000, currency: 'rp', costSecondary: { ore: 25000 }, effect: { generatorMultiplier: { target: 'p4g8', mult: 2 }, phaseMultiplier: { phase: 4, mult: 2 } }, desc: 'Terraform Engine x2 + Mars credits x2' },
      // Expansion B upgrades
      { id: 'u4_9', name: 'Water Reclamation', cost: 3000, currency: 'ore', effect: { terraformMultiplier: 1.25 }, desc: 'Terraform speed +25%', req: { terraformPercent: 15 } },
      { id: 'u4_10', name: 'Deimos Mining Station', cost: 8000, currency: 'ore', effect: { passiveOre: 500 }, desc: '+500 Ore/sec passive from Deimos', req: { terraformPercent: 30 } },
      { id: 'u4_11', name: 'Olympus Mons Observatory', cost: 15000, currency: 'rp', effect: { phaseRPMultiplier: { phase: 4, mult: 3 } }, desc: 'All Mars RP x3', req: { terraformPercent: 40 } },
      { id: 'u4_12', name: 'Valles Marineris Highway', cost: 20000, currency: 'ore', effect: { phaseCostReduction: { phase: 4, reduction: 0.2 } }, desc: 'Mars generator costs -20%', req: { terraformPercent: 50 } },
      { id: 'u4_13', name: 'Mars Internet', cost: 30000, currency: 'rp', effect: { generatorMultiplier: { target: 'p4g7', mult: 3 }, phaseMultiplier: { phase: 4, mult: 1.5 } }, desc: 'Colony Hub x3, Mars credits x1.5', req: { terraformPercent: 60 } },
      { id: 'u4_14', name: 'Phobos Space Dock', cost: 50000, currency: 'rp', effect: { phase5CostReduction: 0.1 }, desc: 'Phase 5 ships 10% cheaper', req: { terraformPercent: 70 } },
      { id: 'u4_15', name: 'Mars Parliament', cost: 5e15, currency: 'credits', effect: { generatorMultiplier: { target: 'p4g7', mult: 5 } }, desc: 'Colony Hub x5 + Governor title', req: { terraformPercent: 80 } },
      { id: 'u4_16', name: 'World Tree', cost: 100000, currency: 'ore', costSecondary: { rp: 100000 }, effect: { terraformMultiplier: 3, phaseMultiplier: { phase: 4, mult: 2 } }, desc: 'Terraform x3 + Mars generators x2', req: { terraformPercent: 90 } }
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
      { id: 'u5_10', name: 'Warp Theory Research', cost: 50000, currency: 'rm', effect: { unlockPhase: 6 }, desc: 'UNLOCK Phase 6: Jupiter' },
      // Expansion B upgrades
      { id: 'u5_11', name: 'Drone Swarm Protocol', cost: 200, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g1', mult: 3 } }, desc: 'Scout Probes x3 + produce 0.1 RM each', req: { generator: 'p5g1', count: 50 } },
      { id: 'u5_12', name: 'Magnetic Grapple', cost: 500, currency: 'rm', effect: { multiGenMultiplier: { targets: ['p5g2', 'p5g3'], mult: 2 } }, desc: 'Mining Shuttle x2, Mining Barge x2', req: { generator: 'p5g2', count: 25 } },
      { id: 'u5_13', name: 'Forge Ship', cost: 1000, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g4', mult: 3 } }, desc: 'Refinery Ship x3', req: { generator: 'p5g4', count: 25 } },
      { id: 'u5_14', name: 'Convoy Formation', cost: 2500, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g5', mult: 2 }, phaseMultiplier: { phase: 5, mult: 1.05 } }, desc: 'Freighter x2 + all ships +5%', req: { generator: 'p5g5', count: 15 } },
      { id: 'u5_15', name: 'Battlegroup Tactics', cost: 5000, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g6', mult: 3 } }, desc: 'Destroyer x3 + fleet immunity', req: { generator: 'p5g6', count: 10 } },
      { id: 'u5_16', name: "Admiral's Bridge", cost: 10000, currency: 'rm', effect: { capitalShipBoost: 1.1 }, desc: 'Capital Ship boosts all ships x1.1 each', req: { generator: 'p5g7', count: 5 } },
      { id: 'u5_17', name: 'Micro Black Hole Engine', cost: 25000, currency: 'rm', effect: { generatorMultiplier: { target: 'p5g10', mult: 3 } }, desc: 'Singularity Harvester x3', req: { generator: 'p5g10', count: 5 } },
      { id: 'u5_18', name: 'Belt Monopoly', cost: 50000, currency: 'rm', effect: { phaseMultiplier: { phase: 5, mult: 2 } }, desc: 'ALL ships x2 + asteroids x3 freq', req: { totalPhaseGenerators: { phase: 5, count: 500 } } }
    ],
    6: [
      { id: 'u6_1', name: 'Volcanic Shielding', cost: 10000, currency: 'ore', effect: { reduceDegradation: 0.5 }, desc: 'Io degradation -50%' },
      { id: 'u6_2', name: 'Ice Drilling Tech', cost: 50e21, currency: 'credits', effect: { phaseMultiplier: { phase: '6_europa', mult: 2 } }, desc: 'Europa generators x2' },
      { id: 'u6_3', name: 'Signal Amplifier', cost: 100e21, currency: 'credits', effect: { asChanceMultiplier: 2 }, desc: 'Alien Signal detection x2' },
      { id: 'u6_4', name: 'Jovian Trade Routes', cost: 500e21, currency: 'credits', effect: { phaseMultiplier: { phase: 6, mult: 2 } }, desc: 'All Jupiter generators x2' },
      { id: 'u6_5', name: 'Reinforced Extractors', cost: 50000, currency: 'ore', effect: { generatorMultiplier: { target: 'p6ig3', mult: 2 } }, desc: 'Volcanic Tap x2', req: { generator: 'p6ig3', count: 10 } },
      { id: 'u6_6', name: 'Callisto Comm Grid', cost: 1e24, currency: 'credits', effect: { generatorMultiplier: { target: 'p6cg1', mult: 3 } }, desc: 'Signal Relay x3', req: { generator: 'p6cg1', count: 5 } },
      { id: 'u6_7', name: 'Ganymede Academy', cost: 200e21, currency: 'credits', effect: { crewCapacityMultiplier: 2 }, desc: 'All Ganymede crew capacity x2', req: { generator: 'p6gg2', count: 5 } },
      { id: 'u6_8', name: 'Metallic Hydrogen Cells', cost: 5e24, currency: 'credits', effect: { generatorMultiplier: { target: 'p6og7', mult: 3 } }, desc: 'Metallic Hydrogen Extractor x3', req: { generator: 'p6og7', count: 5 } },
      { id: 'u6_9', name: 'Deep Europa Sonar', cost: 50e24, currency: 'credits', effect: { asChanceMultiplier: 3 }, desc: 'Alien Signal detection x3', req: { generator: 'p6eg4', count: 10 } },
      { id: 'u6_10', name: 'Io Core Stabilizer', cost: 500000, currency: 'ore', effect: { reduceDegradation: 0.25, generatorMultiplier: { target: 'p6ig5', mult: 2 } }, desc: 'Core Tapper x2, degradation -75% total', req: { generator: 'p6ig5', count: 10 } },
      { id: 'u6_11', name: 'Jovian Weather Prediction', cost: 10e24, currency: 'credits', effect: { phaseMultiplier: { phase: '6_orbit', mult: 3 } }, desc: 'Orbit generators x3', req: { generator: 'p6og5', count: 10 } },
      { id: 'u6_12', name: 'Moon Synergy Network', cost: 100e24, currency: 'credits', effect: { phaseMultiplier: { phase: 6, mult: 3 } }, desc: 'All Jupiter sub-zones x3', req: { generator: 'p6cg3', count: 5 } },
      { id: 'u6_13', name: 'Alien Artifact Decoder', cost: 500e24, currency: 'credits', costSecondary: { as: 10 }, effect: { asBonus: true }, desc: 'Unlock alien artifact bonuses from AS', req: { generator: 'p6eg5', count: 5 } },
      { id: 'u6_14', name: 'Interstellar Beacon', cost: 1e27, currency: 'credits', costSecondary: { as: 25 }, effect: { unlockPhase: 7 }, desc: 'UNLOCK Phase 7: Interstellar' }
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

  // ========== TERRAFORM MILESTONES (Phase 4) ==========
  const TERRAFORM_MILESTONES = [
    { percent: 5, effect: { phaseMultiplier: { phase: 4, mult: 1.2 } }, desc: 'Mars generators +20%' },
    { percent: 10, effect: { phaseMultiplier: { phase: 4, mult: 1.5 } }, desc: 'Mars generators +50%' },
    { percent: 25, effect: { globalRPMultiplier: 3 }, logEntry: 'log9', desc: 'First Rain — all RP x3' },
    { percent: 50, effect: { unlockArtifacts: true }, desc: 'Unlock alien artifact fragments' },
    { percent: 75, effect: { globalOreMultiplier: 2 }, desc: 'All ore production x2' },
    { percent: 90, effect: { globalCreditMultiplier: 2 }, desc: 'All credits x2' },
    { percent: 100, effect: { phaseMultiplier: { phase: 4, mult: 5 } }, logEntry: 'log10', desc: 'New Earth — Mars generators x5' }
  ];

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
    { id: 'cd_architect', name: 'Cosmic Architect', cost: 10000, effect: { unlockMultiverse: true }, desc: 'Unlock Phase 9: The Multiverse' },
    // ===== EXPANSION C: New CD Shop Items (Section 59) =====
    { id: 'cd_luckystart', name: 'Lucky Start', cost: 20, effect: { luckyStart: true }, desc: 'Start each run with 3 random boosters' },
    { id: 'cd_eggmagnet', name: 'Egg Magnet', cost: 40, effect: { eggMagnet: true }, desc: 'Start each run with 1 Gold Egg' },
    { id: 'cd_contractvip', name: 'Contract VIP', cost: 60, effect: { contractVIP: true }, desc: 'Start with 3 half-complete contracts' },
    { id: 'cd_collection', name: 'Collection Memory', cost: 150, effect: { keepCollection: true }, desc: 'Collection progress persists through prestige' },
    { id: 'cd_weatherctrl', name: 'Weather Control', cost: 100, effect: { weatherControl: true }, desc: 'Choose your weather per phase' },
    { id: 'cd_doubledrops', name: 'Double Drops', cost: 200, effect: { doubleDrops: true }, desc: 'Lucky Drops appear 2x as frequently' },
    { id: 'cd_triplecrit', name: 'Triple Critical', cost: 350, effect: { tripleCrit: true }, desc: 'Critical tap chance permanently tripled' },
    { id: 'cd_goldenage', name: 'Golden Age', cost: 500, effect: { goldenAge: true }, desc: 'Golden Rush every 5 min instead of 10-20' },
    { id: 'cd_synmemory', name: 'Synergy Memory', cost: 400, effect: { synergyMemory: true }, desc: 'Synergies auto-unlock on generator re-purchase' },
    { id: 'cd_eggslot4', name: 'Egg Slot 4', cost: 150, effect: { eggSlots: 4 }, desc: '4th egg incubation slot' },
    { id: 'cd_eggslot5', name: 'Egg Slot 5', cost: 150, effect: { eggSlots: 5 }, desc: '5th egg incubation slot', req: 'cd_eggslot4' },
    { id: 'cd_combo', name: 'Combo Persistence', cost: 250, effect: { comboTimer: 1.5 }, desc: 'Combo timer 0.8s \u2192 1.5s' },
    { id: 'cd_supercrit', name: 'Super Critical Boost', cost: 750, effect: { superCritBoost: true }, desc: 'Super Critical chance 0.1% \u2192 0.5%' },
    { id: 'cd_autocollect', name: 'Auto-Collector', cost: 1000, effect: { autoCollect: true }, desc: 'Lucky Drops and Flying Bonuses auto-collected' },
    { id: 'cd_skip5', name: 'Instant Phase 5', cost: 1500, effect: { skipToPhase: 5 }, desc: 'Option to start runs at Phase 5', req: 'cd_skip3' },
    { id: 'cd_skip7', name: 'Instant Phase 7', cost: 5000, effect: { skipToPhase: 7 }, desc: 'Option to start runs at Phase 7', req: 'cd_skip5' },
    { id: 'cd_cosmicegg', name: 'Cosmic Egg on Prestige', cost: 2000, effect: { cosmicEggOnPrestige: true }, desc: 'Each prestige grants 1 Cosmic Egg' },
    { id: 'cd_mastery', name: 'Mastery Bonus', cost: 3000, effect: { masteryBonus: true }, desc: 'Diamond-tier upgrades give +1% global income' }
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
    { id: 'ach_secret_first_contact', name: 'First Contact', desc: 'Collect first Alien Signal', reward: { rp: 1000 }, check: s => s.alienSignals >= 1, secret: true, category: 'secret' },
    { id: 'ach_first_legend', name: 'First Legend', desc: 'Upgrade an astronaut to Legendary', reward: { ore: 50000 }, check: s => s.crew.astronauts.some(a => a.tier >= 4), secret: false, category: 'crew' },
    { id: 'ach_completionist', name: 'Completionist', desc: 'Own all generator types across all phases', reward: { cosmicDust: 1000 }, check: s => checkAllGeneratorTypesOwned(s), secret: true, category: 'secret' },
    { id: 'ach_lucky_find', name: 'Lucky Find', desc: 'Find 3 Rare Asteroids in a row', reward: { rm: 500 }, check: s => (s.stats.consecutiveAsteroids || 0) >= 3, secret: true, category: 'secret' },
    // ===== EXPANSION B: Speed Achievements =====
    { id: 'ach_speed_rocket', name: 'Quick Builder', desc: 'Complete rocket in under 5 min', reward: { credits: 25000 }, check: s => s.stats.rocketBuildTime > 0 && s.stats.rocketBuildTime < 300, category: 'speed' },
    { id: 'ach_speed_p2', name: 'Escape Velocity', desc: 'Reach Phase 2 in under 15 min', reward: { rp: 25 }, check: s => s.stats.phaseReachTime && s.stats.phaseReachTime[2] > 0 && s.stats.phaseReachTime[2] < 900, category: 'speed' },
    { id: 'ach_speed_p3', name: 'Lunar Express', desc: 'Reach Phase 3 in under 30 min', reward: { ore: 100 }, check: s => s.stats.phaseReachTime && s.stats.phaseReachTime[3] > 0 && s.stats.phaseReachTime[3] < 1800, category: 'speed' },
    { id: 'ach_speed_p4', name: 'Mars or Bust', desc: 'Reach Phase 4 in under 2 hours', reward: { ore: 1000 }, check: s => s.stats.phaseReachTime && s.stats.phaseReachTime[4] > 0 && s.stats.phaseReachTime[4] < 7200, category: 'speed' },
    { id: 'ach_speed_p7', name: 'Light Speed', desc: 'Reach Phase 7 in under 24 hours', reward: { sd: 500 }, check: s => s.stats.phaseReachTime && s.stats.phaseReachTime[7] > 0 && s.stats.phaseReachTime[7] < 86400, category: 'speed' },
    // ===== Combo Achievements =====
    { id: 'ach_combo10', name: 'Combo Starter', desc: 'Reach a x10 combo', reward: { credits: 5000 }, check: s => s.combo.bestAllTime >= 10, category: 'combo' },
    { id: 'ach_combo25', name: 'Combo Adept', desc: 'Reach a x25 combo', reward: { credits: 100000 }, check: s => s.combo.bestAllTime >= 25, category: 'combo' },
    { id: 'ach_combo50', name: 'Combo Master', desc: 'Reach a x50 combo', reward: { credits: 10e6 }, check: s => s.combo.bestAllTime >= 50, category: 'combo' },
    { id: 'ach_combo75', name: 'Combo Legend', desc: 'Reach a x75 combo', reward: { credits: 1e9 }, check: s => s.combo.bestAllTime >= 75, category: 'combo' },
    { id: 'ach_combo100', name: 'MEGA FRENZY', desc: 'Reach a x100 combo', reward: { cosmicDust: 10 }, check: s => s.combo.bestAllTime >= 100, category: 'combo' },
    // ===== Critical Tap Achievements =====
    { id: 'ach_crit1', name: 'Lucky Strike', desc: 'Land first critical tap', reward: { credits: 1000 }, check: s => (s.stats.totalCritTaps || 0) >= 1, category: 'critical' },
    { id: 'ach_crit50', name: 'Critical Thinking', desc: 'Land 50 critical taps', reward: { credits: 500000 }, check: s => (s.stats.totalCritTaps || 0) >= 50, category: 'critical' },
    { id: 'ach_crit500', name: 'Critical Mass', desc: 'Land 500 critical taps', reward: { credits: 500e6 }, check: s => (s.stats.totalCritTaps || 0) >= 500, category: 'critical' },
    { id: 'ach_supercrit1', name: 'Super Critical', desc: 'Land first Super Critical tap', reward: { cosmicDust: 5 }, check: s => (s.stats.totalSuperCritTaps || 0) >= 1, category: 'critical' },
    { id: 'ach_supercrit3', name: 'Lightning Rod', desc: 'Land 3 Super Criticals', reward: { cosmicDust: 25 }, check: s => (s.stats.totalSuperCritTaps || 0) >= 3, category: 'critical' },
    // ===== Collection Achievements =====
    { id: 'ach_coll_rocks', name: 'Rock Collector', desc: 'Complete Space Rocks set', reward: { cosmicDust: 25 }, check: s => s.collections && s.collections.completedSets && s.collections.completedSets.includes('space_rocks'), category: 'collection' },
    { id: 'ach_coll_badges', name: 'Badge Hunter', desc: 'Complete Crew Badges set', reward: { cosmicDust: 25 }, check: s => s.collections && s.collections.completedSets && s.collections.completedSets.includes('crew_badges'), category: 'collection' },
    { id: 'ach_coll_relics', name: 'Alien Archaeologist', desc: 'Complete Alien Relics set', reward: { cosmicDust: 50 }, check: s => s.collections && s.collections.completedSets && s.collections.completedSets.includes('alien_relics'), category: 'collection' },
    { id: 'ach_coll_ships', name: 'Fleet Museum', desc: 'Complete Ship Models set', reward: { cosmicDust: 25 }, check: s => s.collections && s.collections.completedSets && s.collections.completedSets.includes('ship_models'), category: 'collection' },
    { id: 'ach_coll_wonders', name: 'Cosmic Tourist', desc: 'Complete Cosmic Wonders set', reward: { cosmicDust: 50 }, check: s => s.collections && s.collections.completedSets && s.collections.completedSets.includes('cosmic_wonders'), category: 'collection' },
    { id: 'ach_coll_all', name: 'Completionist Supreme', desc: 'Complete ALL collection sets', reward: { cosmicDust: 200 }, check: s => s.collections && s.collections.completedSets && s.collections.completedSets.length >= 5, category: 'collection' },
    // ===== Lucky Drop Achievements =====
    { id: 'ach_drop1', name: 'Eagle Eye', desc: 'Tap first Lucky Drop', reward: { credits: 500 }, check: s => (s.stats.luckyDropsCaught || 0) >= 1, category: 'luckyDrop' },
    { id: 'ach_drop50', name: 'Quick Hands', desc: 'Tap 50 Lucky Drops', reward: { credits: 1e6 }, check: s => (s.stats.luckyDropsCaught || 0) >= 50, category: 'luckyDrop' },
    { id: 'ach_drop200', name: 'Drop Hunter', desc: 'Tap 200 Lucky Drops', reward: { credits: 1e9 }, check: s => (s.stats.luckyDropsCaught || 0) >= 200, category: 'luckyDrop' },
    { id: 'ach_cdFragment', name: 'Cosmic Fragment Finder', desc: 'Catch a Cosmic Fragment (CD drop)', reward: { cosmicDust: 5 }, check: s => (s.stats.cosmicFragmentsCaught || 0) >= 1, category: 'luckyDrop' },
    { id: 'ach_rain10', name: 'Rain Dancer', desc: 'Tap 10 items during a Currency Rain', reward: { credits: 0, special: 'minuteCredits' }, check: s => (s.stats.maxRainCatch || 0) >= 10, category: 'luckyDrop' },
    // ===== Egg Achievements =====
    { id: 'ach_egg1', name: 'First Hatch', desc: 'Hatch first egg', reward: { credits: 0, special: 'bronzeEgg' }, check: s => (s.stats.eggsHatched || 0) >= 1, category: 'egg' },
    { id: 'ach_egg10', name: 'Egg Collector', desc: 'Hatch 10 eggs', reward: { credits: 0, special: 'silverEgg' }, check: s => (s.stats.eggsHatched || 0) >= 10, category: 'egg' },
    { id: 'ach_egg50', name: 'Egg Master', desc: 'Hatch 50 eggs', reward: { credits: 0, special: 'goldEgg' }, check: s => (s.stats.eggsHatched || 0) >= 50, category: 'egg' },
    { id: 'ach_cosmic5', name: 'Cosmic Nursery', desc: 'Hatch 5 Cosmic Eggs', reward: { credits: 0, special: 'voidEgg' }, check: s => (s.stats.cosmicEggsHatched || 0) >= 5, category: 'egg' },
    { id: 'ach_void1', name: 'Void Walker', desc: 'Hatch a Void Egg', reward: { cosmicDust: 50 }, check: s => (s.stats.voidEggsHatched || 0) >= 1, category: 'egg' },
    // ===== Contract Achievements =====
    { id: 'ach_contract1', name: 'Contractor', desc: 'Complete first contract', reward: { credits: 0, special: 'incomeBonus300' }, check: s => (s.stats.contractsCompleted || 0) >= 1, category: 'contract' },
    { id: 'ach_contract10', name: 'Freelancer', desc: 'Complete 10 contracts', reward: { credits: 0, special: 'incomeBonus600' }, check: s => (s.stats.contractsCompleted || 0) >= 10, category: 'contract' },
    { id: 'ach_contract50', name: 'Professional', desc: 'Complete 50 contracts', reward: { cosmicDust: 10 }, check: s => (s.stats.contractsCompleted || 0) >= 50, category: 'contract' },
    { id: 'ach_contract100', name: 'Mogul', desc: 'Complete 100 contracts', reward: { cosmicDust: 50 }, check: s => (s.stats.contractsCompleted || 0) >= 100, category: 'contract' },
    { id: 'ach_specialContract', name: 'Special Agent', desc: 'Complete a Special Contract', reward: { cosmicDust: 25 }, check: s => (s.stats.specialContractsCompleted || 0) >= 1, category: 'contract' },
    // ===== Synergy Achievements =====
    { id: 'ach_syn1', name: 'First Synergy', desc: 'Unlock first generator synergy', reward: { credits: 0, special: 'incomeBonus120' }, check: s => s.synergies && s.synergies.unlocked && s.synergies.unlocked.length >= 1, category: 'synergy' },
    { id: 'ach_syn5', name: 'Synergy Network', desc: 'Unlock 5 synergies', reward: { credits: 0, special: 'synergyBoost1.5' }, check: s => s.synergies && s.synergies.unlocked && s.synergies.unlocked.length >= 5, category: 'synergy' },
    { id: 'ach_syn10', name: 'Synergy Master', desc: 'Unlock 10 synergies', reward: { credits: 0, special: 'synergyBoost2' }, check: s => s.synergies && s.synergies.unlocked && s.synergies.unlocked.length >= 10, category: 'synergy' },
    { id: 'ach_synCross', name: 'Cross-Phase Link', desc: 'Unlock first cross-phase synergy', reward: { cosmicDust: 10 }, check: s => s.synergies && s.synergies.unlocked && s.synergies.unlocked.some(id => id.startsWith('syn_cross')), category: 'synergy' },
    { id: 'ach_synAll', name: 'Fully Connected', desc: 'Unlock all synergies', reward: { cosmicDust: 100 }, check: s => s.synergies && s.synergies.unlocked && s.synergies.unlocked.length >= 15, category: 'synergy' },
    // ===== Weather Achievements =====
    { id: 'ach_weather10', name: 'Storm Chaser', desc: 'Experience 10 different weather types', reward: { credits: 0, special: 'incomeBonus300' }, check: s => s.stats.weatherTypesExperienced && s.stats.weatherTypesExperienced.length >= 10, category: 'weather' },
    { id: 'ach_weatherP1', name: 'Meteorologist', desc: 'Experience all weather in Phase 1', reward: { credits: 1e6 }, check: s => s.stats.p1WeatherComplete, category: 'weather' },
    { id: 'ach_lightning100', name: 'Lightning Catcher', desc: 'Earn 100 free taps from lightning', reward: { credits: 10e6 }, check: s => (s.stats.lightningTaps || 0) >= 100, category: 'weather' },
    { id: 'ach_marsSunset', name: 'Blue Sunset', desc: 'Witness a Mars sunset', reward: { ore: 500 }, check: s => s.stats.marsSunsetSeen, category: 'weather' },
    { id: 'ach_eclipse3', name: 'Eclipse Watcher', desc: 'Experience eclipses in 3 phases', reward: { cosmicDust: 5 }, check: s => s.stats.eclipsePhases && s.stats.eclipsePhases.length >= 3, category: 'weather' },
    // ===== Milestone Achievements =====
    { id: 'ach_badge1', name: 'First Badge', desc: 'Earn first milestone badge', reward: { credits: 10000 }, check: s => (s.stats.totalMilestoneBadges || 0) >= 1, category: 'milestone' },
    { id: 'ach_bronze10', name: 'Bronze Age', desc: '10 generators with Bronze badges', reward: { credits: 1e6 }, check: s => (s.stats.bronzeBadges || 0) >= 10, category: 'milestone' },
    { id: 'ach_silver5', name: 'Silver Lining', desc: '5 generators with Silver badges', reward: { credits: 100e6 }, check: s => (s.stats.silverBadges || 0) >= 5, category: 'milestone' },
    { id: 'ach_gold3', name: 'Golden Era', desc: '3 generators with Gold badges', reward: { credits: 10e9 }, check: s => (s.stats.goldBadges || 0) >= 3, category: 'milestone' },
    { id: 'ach_diamond1', name: 'Diamond Standard', desc: '1 generator with Diamond badge', reward: { cosmicDust: 50 }, check: s => (s.stats.diamondBadges || 0) >= 1, category: 'milestone' },
    { id: 'ach_gen500single', name: 'Cosmic Limit', desc: 'Reach 500 on any generator', reward: { cosmicDust: 200 }, check: s => { for (const k in s.generators) { if (s.generators[k] >= 500) return true; } return false; }, category: 'milestone' },
    // ===== Booster Achievements =====
    { id: 'ach_booster1', name: 'Power Up', desc: 'Activate first booster', reward: { credits: 0, special: 'creditSurge' }, check: s => (s.stats.boostersActivated || 0) >= 1, category: 'booster' },
    { id: 'ach_booster2active', name: 'Double Boost', desc: '2 boosters active simultaneously', reward: { credits: 0, special: 'luckyStar' }, check: s => (s.stats.maxSimultaneousBoosters || 0) >= 2, category: 'booster' },
    { id: 'ach_booster3active', name: 'Triple Stack', desc: '3 boosters active simultaneously', reward: { credits: 0, special: 'goldenTouch' }, check: s => (s.stats.maxSimultaneousBoosters || 0) >= 3, category: 'booster' },
    { id: 'ach_legendaryBooster', name: 'Legendary Power', desc: 'Activate a Legendary booster', reward: { cosmicDust: 25 }, check: s => s.stats.legendaryBoosterUsed, category: 'booster' },
    { id: 'ach_booster100', name: 'Boost Addict', desc: 'Activate 100 boosters total', reward: { cosmicDust: 10 }, check: s => (s.stats.boostersActivated || 0) >= 100, category: 'booster' },
    // ===== Fun / Secret Achievements =====
    { id: 'ach_nightowl', name: 'Night Owl', desc: 'Play 2+ hours after midnight', reward: { credits: 0, special: 'hourCredits7200' }, check: s => s.stats.nightOwlEarned, secret: true, category: 'secret' },
    { id: 'ach_earlybird', name: 'Early Bird', desc: 'Play before 6 AM', reward: { credits: 0, special: 'hourCredits3600' }, check: s => s.stats.earlyBirdEarned, secret: true, category: 'secret' },
    { id: 'ach_weekend', name: 'Weekend Warrior', desc: 'Play on Sat and Sun same weekend', reward: { credits: 0, special: 'goldEgg' }, check: s => s.stats.weekendWarriorEarned, secret: true, category: 'secret' },
    { id: 'ach_maxstack', name: 'Max Stack', desc: 'Have 5 boosters in inventory', reward: { credits: 0, special: 'cosmicEgg' }, check: s => s.boosters && s.boosters.inventory && s.boosters.inventory.length >= 5, secret: true, category: 'secret' },
    { id: 'ach_taptaptap', name: 'Tap Tap Tap', desc: 'Tap 50 times in 10 seconds', reward: { credits: 0, special: 'title_speedDemon' }, check: s => s.stats.fastTapRecord >= 50, secret: true, category: 'secret' },
    { id: 'ach_wrongbutton', name: 'Wrong Button', desc: 'Try to buy unaffordable 20 times', reward: { credits: 0, special: 'title_dreamer' }, check: s => (s.stats.failedPurchases || 0) >= 20, secret: true, category: 'secret' },
    { id: 'ach_backtobasics', name: 'Back to Basics', desc: 'Return to Phase 1 after Phase 8', reward: { credits: 0, special: 'p1x100' }, check: s => s.stats.returnedToP1AfterP8, secret: true, category: 'secret' },
    { id: 'ach_theanswer', name: 'The Answer', desc: 'Own exactly 42 of any generator', reward: { rp: 42 }, check: s => { for (const k in s.generators) { if (s.generators[k] === 42) return true; } return false; }, secret: true, category: 'secret' }
  ];

  function getTotalGenerators(state) {
    let total = 0;
    for (const key in state.generators) {
      total += (state.generators[key] || 0);
    }
    return total;
  }

  function checkAllGeneratorTypesOwned(state) {
    for (const key in GENERATORS) {
      for (const gen of GENERATORS[key]) {
        if ((state.generators[gen.id] || 0) < 1) return false;
      }
    }
    return true;
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
    { id: 'log30', trigger: 'artifact5', title: 'Ancient Records V', text: "The final record: 'If you're reading this, you've already gone too far. But perhaps you'll succeed where we failed. Good luck, little ones.'" },
    // ===== EXPANSION B: Log Entries 31-80 =====
    { id: 'log31', trigger: 'gen100', title: 'The Machine', text: "It's no longer a scrappy operation. It's an empire of moving parts, each one humming with purpose." },
    { id: 'log32', trigger: 'firstGoldenRush', title: 'Gold Fever', text: "Everything turned gold. For thirty beautiful seconds, the universe was generous beyond measure." },
    { id: 'log33', trigger: 'combo50', title: 'The Flow', text: "My hands moved on their own. Tap after tap. I couldn't stop. I didn't want to." },
    { id: 'log34', trigger: 'firstSuperCrit', title: 'Lightning', text: "It hit different. One tap, and the whole system lit up like a supernova. Power beyond measure." },
    { id: 'log35', trigger: 'firstLuckyDrop', title: 'The Gift', text: "Something floated past. Instinct told me to grab it. Best instinct I ever had." },
    { id: 'log36', trigger: 'firstEggHatch', title: 'The Egg', text: "We found it drifting. Nobody knew what it was. When it opened... wonder." },
    { id: 'log37', trigger: 'voidEggHatch', title: 'The Void', text: "The black egg. It shouldn't exist. What came out of it... changed everything." },
    { id: 'log38', trigger: 'firstContract', title: 'Working for Hire', text: "Took on a job today. Felt good to have a clear goal for once." },
    { id: 'log39', trigger: 'firstBooster', title: 'Power Up', text: "It's like caffeine for the entire operation. Everything, faster, better, MORE." },
    { id: 'log40', trigger: 'firstSynergy', title: 'Connection', text: "When the drill and the processor work together... it's more than the sum of parts." },
    { id: 'log41', trigger: 'firstCollectionSet', title: 'The Set', text: "I looked at the collection. All of them, together. Something clicked. A resonance." },
    { id: 'log42', trigger: 'gen1000', title: 'The Swarm', text: "A thousand machines. A thousand purposes. All humming in concert." },
    { id: 'log43', trigger: 'earn1T', title: 'Trillionaire', text: "A number so large it lost meaning. But the machines still wanted more." },
    { id: 'log44', trigger: 'nightOwl', title: 'Sleepless', text: "3 AM. The stars are brighter when everyone else is asleep." },
    { id: 'log45', trigger: 'fullCollection', title: 'Everything', text: "I have it all. Every rock, every badge, every blueprint. And yet I want more." },
    { id: 'log46', trigger: 'marsSnow', title: 'White Mars', text: "Snow on Mars. White on red. My crew stood in silence, catching flakes." },
    { id: 'log47', trigger: 'tap10000', title: 'These Hands', text: "Ten thousand taps. My hands built an empire, one click at a time." },
    { id: 'log48', trigger: 'anomalySystem', title: 'The Anomaly', text: "The instruments went haywire. Reality itself felt... thinner here." },
    { id: 'log49', trigger: 'challengeComplete', title: 'The Test', text: "They said it couldn't be done. Constraints make you creative." },
    { id: 'log50', trigger: 'allGoldMilestones', title: 'The Golden Age', text: "Every machine, perfected. Every system, optimized. This is peak." },
    { id: 'log51', trigger: 'lightningFreeTaps', title: "Thor's Gift", text: "Lightning struck the antenna. Instead of damage... free energy." },
    { id: 'log52', trigger: 'drops100', title: 'Fortune Favors', text: "I've learned to watch the skies. Not for danger \u2014 for gifts." },
    { id: 'log53', trigger: 'crew100', title: 'The Hundred', text: "One hundred souls trust me with their lives. The weight of that..." },
    { id: 'log54', trigger: 'allLegendaryCrew', title: 'Legends', text: "Every last one of them \u2014 Legendary. I'm surrounded by the best." },
    { id: 'log55', trigger: 'boosters50', title: 'Addicted to Speed', text: "The boost wears off and everything feels... slow. Need another one." },
    { id: 'log56', trigger: 'cosmicEggHatch', title: 'Cosmic Birth', text: "Twenty-four hours of waiting. When the cosmic egg opened... tears." },
    { id: 'log57', trigger: 'gen500single', title: 'Obsession', text: "Five hundred. Of the same thing. Am I efficient or insane? Both." },
    { id: 'log58', trigger: 'ioRepair50', title: 'Sisyphus', text: "Fix it. It breaks. Fix it again. But each time... a little more ore." },
    { id: 'log59', trigger: 'mirrorComplete', title: 'Through the Mirror', text: "Everything backwards. Start from the stars, end in the junkyard. And somehow... it made sense." },
    { id: 'log60', trigger: 'allWeather', title: 'Every Sky', text: "I've seen sunrises on six worlds. Lightning on Earth. Blue sunsets on Mars. Every sky tells a story." },
    // Entries 61-80: Multiverse, mastery, and philosophical reflections
    { id: 'log61', trigger: 'multiverse_alpha', title: 'Universe-\u03B1', text: "The first universe beyond our own. Same laws, different constants. Gravity pulls harder here." },
    { id: 'log62', trigger: 'multiverse_beta', title: 'Universe-\u03B2', text: "In this universe, light moves slower. Everything has a dreamlike quality." },
    { id: 'log63', trigger: 'multiverse_gamma', title: 'Universe-\u03B3', text: "Antimatter is the norm here. Our instruments screamed warnings, but beauty knows no polarity." },
    { id: 'log64', trigger: 'multiverse_delta', title: 'Universe-\u03B4', text: "Time flows backwards. We watched stars un-die and planets un-form. It was deeply unsettling." },
    { id: 'log65', trigger: 'multiverse_epsilon', title: 'Universe-\u03B5', text: "The mirror universe. Everything we built here, we built in reverse. End to beginning." },
    { id: 'log66', trigger: 'prestige20', title: 'The Pattern', text: "Twenty cycles. I see the pattern now. The universe isn't random. It's a spiral, always returning, always ascending." },
    { id: 'log67', trigger: 'prestige30', title: 'Memory', text: "Thirty rebirths. I remember every single one. Every first tap, every first launch, every first star." },
    { id: 'log68', trigger: 'prestige40', title: 'Purpose', text: "Forty cycles in. The question changed from 'why?' to 'why not?' Build. Explore. Transcend. Repeat." },
    { id: 'log69', trigger: 'galacticCore2', title: 'Return to the Core', text: "The core welcomed me back like an old friend. 'You again,' it seemed to say. 'Still searching?'" },
    { id: 'log70', trigger: 'galacticCore5', title: 'The Core Knows', text: "Five visits. Each time the core reveals something new. A memory. A truth. A whisper of what lies beyond." },
    { id: 'log71', trigger: 'allPhases1run', title: 'Full Journey', text: "Phase 1 to 8 in one run. The complete journey. Every step remembered, every phase cherished." },
    { id: 'log72', trigger: 'totalGen10k', title: 'Ten Thousand', text: "Ten thousand generators. Each one a story. Each one a purpose. The hum is deafening and beautiful." },
    { id: 'log73', trigger: 'allAchievements', title: 'Perfection', text: "Every achievement. Every challenge. Every secret. I've done it all. And yet... the universe still has more." },
    { id: 'log74', trigger: 'trueEndgame', title: 'The Question', text: "At the end of everything, there's a question: 'Was it worth it?' The answer is always the same." },
    { id: 'log75', trigger: 'infiniteLoop', title: 'Infinity', text: "The loop has no end. The junkyard has no end. The stars have no end. And neither do I." },
    { id: 'log76', trigger: 'alienLegacy', title: 'The Architects', text: "We finally understand what the Architects were building. Not a machine. Not a weapon. A message: 'Keep going.'" },
    { id: 'log77', trigger: 'cosmicHarmony', title: 'Harmony', text: "All systems in perfect balance. All phases producing. All crew legendary. This is what harmony looks like." },
    { id: 'log78', trigger: 'lastSecret', title: 'The Last Secret', text: "There was one thing I never found. Hidden in the code of the universe itself. A name. My name." },
    { id: 'log79', trigger: 'philosopherStone', title: 'Transmutation', text: "Turn scrap into gold. Turn gold into stars. Turn stars into meaning. The philosopher's stone was always just... effort." },
    { id: 'log80', trigger: 'finalEntry', title: 'The End and the Beginning', text: "If anyone ever reads this log, know that it started with a junkyard. And a dream. And one tap." }
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
    { id: 'evt_wormhole', name: 'Wormhole Shortcut', duration: 10, effect: { skipProduction: 3600 }, desc: 'Tap for 1 hour of production!', type: 'positive', icon: '\u{1F300}' },
    { id: 'evt_alientrader', name: 'Alien Trader', duration: 60, effect: { alienTrader: true }, desc: 'Exchange currencies at favorable rates!', type: 'positive', icon: '\u{1F6F8}' },
    { id: 'evt_mysterysignal', name: 'Mysterious Signal', duration: 0, effect: { grantAS: 1 }, desc: '+1 Alien Signal detected!', type: 'positive', icon: '\u{1F4E1}', phaseReq: 6 },
    // ===== EXPANSION B: 20 New Events =====
    { id: 'evt_doubledown', name: 'Double Down', duration: 300, effect: { doublePurchaseChance: 0.5 }, desc: '50% chance of 2-for-1 on purchases!', type: 'positive', icon: '\u{1F3B2}' },
    { id: 'evt_inspiration', name: 'Inspiration Wave', duration: 180, effect: { rpMultiplier: 10 }, desc: 'RP generation x10!', type: 'positive', icon: '\u{1F9E0}', phaseReq: 2 },
    { id: 'evt_spacewhale', name: 'Space Whale', duration: 30, effect: { tappableBonus: 'whale' }, desc: 'Tap the whale for 5 min income!', type: 'positive', icon: '\u{1F40B}', phaseReq: 2 },
    { id: 'evt_cometgift', name: "Comet's Gift", duration: 0, effect: { randomCurrencyBonus: 600 }, desc: 'Random currency +10 min income!', type: 'positive', icon: '\u2604', phaseReq: 3 },
    { id: 'evt_moonquake', name: 'Moonquake', duration: 120, effect: { phaseMultiplierTemp: { phase: 3, mult: 5 } }, desc: 'Moon generators x5!', type: 'positive', icon: '\u{1F30D}', phaseReq: 3 },
    { id: 'evt_timecrystal', name: 'Time Crystal Found', duration: 0, effect: { skipProduction: 3600 }, desc: '1 hour of all production!', type: 'positive', icon: '\u231B', phaseReq: 4 },
    { id: 'evt_fleetrally', name: 'Fleet Rally', duration: 180, effect: { phaseMultiplierTemp: { phase: 5, mult: 5 } }, desc: 'All ships produce x5!', type: 'positive', icon: '\u{1F680}', phaseReq: 5 },
    { id: 'evt_jupitereye', name: "Jupiter's Eye", duration: 60, effect: { tappableBonus: 'jupiterEye' }, desc: 'Tap the red eye for SD bonus!', type: 'positive', icon: '\u{1F441}', phaseReq: 6 },
    { id: 'evt_alienbroadcast', name: 'Alien Broadcast', duration: 120, effect: { asMultiplier: 10 }, desc: 'AS detection rates x10!', type: 'positive', icon: '\u{1F4E1}', phaseReq: 6 },
    { id: 'evt_warpsurge', name: 'Warp Surge', duration: 30, effect: { sdMultiplier: 20 }, desc: 'SD production x20!', type: 'positive', icon: '\u26A1', phaseReq: 7 },
    { id: 'evt_dimensionalrift', name: 'Dimensional Rift', duration: 60, effect: { tappableBonus: 'rift' }, desc: 'Tap objects for bonus credits!', type: 'positive', icon: '\u{1F573}', phaseReq: 7 },
    { id: 'evt_stellarnursery', name: 'Stellar Nursery', duration: 300, effect: { sdMultiplier: 3 }, desc: 'SD x3 + free star system chance!', type: 'positive', icon: '\u{1F31F}', phaseReq: 8 },
    { id: 'evt_cosmiclottery', name: 'Cosmic Lottery', duration: 0, effect: { randomLotteryReward: true }, desc: 'Random reward!', type: 'positive', icon: '\u{1F3B0}' },
    { id: 'evt_prestigepreview', name: 'Prestige Preview', duration: 10, effect: { prestigePreview: true }, desc: 'Shows potential prestige CD', type: 'neutral', icon: '\u{1F52E}', phaseReq: 5 },
    { id: 'evt_quantumflux', name: 'Quantum Fluctuation', duration: 180, effect: { costFluctuation: true }, desc: 'Costs fluctuate 50%-150%!', type: 'neutral', icon: '\u269B' },
    { id: 'evt_stardustshower', name: 'Stardust Shower', duration: 120, effect: { sdRain: true }, desc: 'Tap falling SD!', type: 'positive', icon: '\u2728', phaseReq: 7 },
    { id: 'evt_alienaid', name: 'Alien Aid Package', duration: 0, effect: { alienCarePackage: true }, desc: '1 booster + 1 egg!', type: 'positive', icon: '\u{1F6F8}', phaseReq: 6 },
    { id: 'evt_gravitywell', name: 'Gravity Well', duration: 300, effect: { dropAttraction: true }, desc: 'Drops attracted to center!', type: 'positive', icon: '\u{1F300}' },
    { id: 'evt_ghostship', name: 'Ghost Ship', duration: 20, effect: { tappableBonus: 'ghostShip' }, desc: 'Tap 10x for rare collection item!', type: 'positive', icon: '\u{1F47B}', phaseReq: 5 },
    { id: 'evt_solarsailrace', name: 'Solar Sail Race', duration: 60, effect: { tappableBonus: 'solarSail' }, desc: 'Tap for speed = credits + RP!', type: 'positive', icon: '\u26F5', phaseReq: 2 }
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

  // ========== SPECIAL STAR SYSTEMS (Phase 8) ==========
  const SPECIAL_STAR_SYSTEMS = [
    {
      type: 'blackHole', name: 'Black Hole System', rarity: 0.05,
      desc: 'Time dilates near the event horizon — offline earnings ×10 permanently.',
      effect: { offlineMultiplierBonus: 10 },
      minSystems: 10,
      logEntry: 'log20'
    },
    {
      type: 'nebula', name: 'Nebula System', rarity: 0.08,
      desc: 'Dense gas clouds generate 100 SD/sec passively.',
      effect: { passiveSD: 100 },
      minSystems: 5
    },
    {
      type: 'ancientRuins', name: 'Ancient Civilization Ruins', rarity: 0.03,
      desc: 'Remnants of the Architects — one-time massive resource cache and lore fragments.',
      effect: { oneTimeCredits: 1e30, oneTimeRP: 1e6, loreFragments: 1 },
      minSystems: 15,
      logEntry: 'log26'
    },
    {
      type: 'galacticCore', name: 'Galactic Core', rarity: 0.01,
      desc: 'The blazing heart of the galaxy. All production x10 while stationed here.',
      effect: { allProductionMult: 10 },
      minSystems: 25,
      logEntry: 'log21'
    }
  ];

  // ========== ANOMALY BONUSES (Phase 8) ==========
  const ANOMALY_BONUSES = [
    {
      id: 'anom_time_dilation', name: 'Time Dilation Field',
      desc: 'All generators run ×3 speed for 1 hour.',
      effect: { tempSpeedMult: 3, duration: 3600 }
    },
    {
      id: 'anom_resource_cache', name: 'Resource Cache',
      desc: 'Instantly gain 1 hour\'s worth of all currencies.',
      effect: { skipProduction: 3600 }
    },
    {
      id: 'anom_alien_benefactor', name: 'Alien Benefactor',
      desc: 'Permanent +10% to all income for this run.',
      effect: { permanentCreditMult: 1.1 }
    },
    {
      id: 'anom_wormhole', name: 'Wormhole',
      desc: 'Permanently reduces all star system costs by 10%.',
      effect: { permanentSystemCostReduction: 0.10 }
    },
    {
      id: 'anom_dark_matter', name: 'Dark Matter',
      desc: 'Prestige reward ×1.5 (permanent for this run).',
      effect: { prestigeRewardMult: 1.5 }
    }
  ];

  // ========== RARE ASTEROID CONFIG (Phase 5) ==========
  const RARE_ASTEROID = {
    tapsRequired: 100,
    timeLimit: 15,           // seconds to mine before it floats away
    spawnInterval: [180, 300], // 3-5 min
    rewards: {
      ore: () => GameState.getState().orePerSecond * 600,     // 10 min ore
      rm: () => GameState.getState().rmPerSecond * 300,       // 5 min RM
      credits: () => GameState.getState().creditsPerSecond * 300
    },
    criticalChance: 0.1 // 10% chance of a critical asteroid with 3x reward
  };

  // ========== ALIEN ARTIFACT FRAGMENTS (Phase 4 Mars) ==========
  const ARTIFACT_FRAGMENTS = {
    spawnInterval: [60, 120],   // 60-120s after 50% terraform
    minTerraform: 50,
    totalForDecoder: 10,        // collect 10 to decode
    decoderBonuses: [
      { fragments: 10, bonus: 'Unlock Ancient Records I lore entry', logEntry: 'log26' },
      { fragments: 20, bonus: 'All Mars generators +50%', effect: { phaseMultiplier: { phase: '4', mult: 1.5 } } },
      { fragments: 30, bonus: 'Unlock Ancient Records II lore entry', logEntry: 'log27' },
      { fragments: 40, bonus: 'Terraform speed +100%', effect: { terraformMultiplier: 2 } },
      { fragments: 50, bonus: 'Unlock Ancient Records III lore entry + massive credit bonus', logEntry: 'log28', creditBonus: 1e18 }
    ]
  };

  // ========== MULTIVERSE UNIVERSES (Phase 9) ==========
  const UNIVERSES = [
    { id: 'uni_speed', name: 'Universe-\u03B1 (Speed)', rules: 'Everything 10x faster but 10x more expensive', reward: 5 },
    { id: 'uni_scarce', name: 'Universe-\u03B2 (Scarcity)', rules: 'Only 3 generator types per phase', reward: 10 },
    { id: 'uni_abundance', name: 'Universe-\u03B3 (Abundance)', rules: 'Start with 1B credits but no tapping', reward: 3 },
    { id: 'uni_challenge', name: 'Universe-\u03B4 (Challenge)', rules: 'Generators degrade unless maintained', reward: 15 },
    { id: 'uni_mirror', name: 'Universe-\u03B5 (Mirror)', rules: 'Phase order reversed', reward: 20 },
    { id: 'uni_endless', name: 'Universe-\u221E (Endless)', rules: 'No prestige, infinite scaling', reward: 1 },
    { id: 'uni_mystery', name: 'Universe-??? (Mystery)', rules: 'Random combination of 3 rules', reward: 10 },
    // ===== EXPANSION C: New Universes (Section 60) =====
    { id: 'uni_chaos', name: 'Universe-\u03B6 (Chaos)', rules: 'Every 60s, two random generators swap outputs', reward: 12 },
    { id: 'uni_pacifist', name: 'Universe-\u03B7 (Pacifist)', rules: 'No fleet/ships — reach galaxy without mining ships', reward: 18 },
    { id: 'uni_rush', name: 'Universe-\u03B8 (Rush Hour)', rules: '3x speed but 3x costs', reward: 8 },
    { id: 'uni_dark', name: 'Universe-\u03B9 (Dark)', rules: 'No background — navigate by numbers alone', reward: 15, bonusTitle: 'Blind Navigator' },
    { id: 'uni_collection', name: 'Universe-\u03BA (Collection)', rules: 'Complete 3 collection sets to finish', reward: 25 },
    { id: 'uni_bossrush', name: 'Universe-\u03BB (Boss Rush)', rules: 'Each phase transition requires a boss mini-game', reward: 20 }
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
    { id: 'it_speed', name: 'Speed Lines Background', cost: 10, desc: 'Animated speed lines' },
    // ===== EXPANSION C: New IT Shop Items (Section 60) =====
    { id: 'it_animated_bg', name: 'Animated Background', cost: 30, desc: 'Extra animated elements (shooting stars, animals)' },
    { id: 'it_particle_color', name: 'Custom Particle Color', cost: 15, desc: 'Choose the color of your tap particles' },
    { id: 'it_giant_nums', name: 'Giant Numbers', cost: 10, desc: 'Floating +\u20A1 numbers are 2x bigger' },
    { id: 'it_vip', name: 'VIP Nameplate', cost: 20, desc: 'Gold border around your name in stats' },
    { id: 'it_jukebox', name: 'Soundtrack Jukebox', cost: 25, desc: 'Play any phase music in any phase' },
    { id: 'it_aura', name: 'Lucky Aura', cost: 35, desc: 'Permanent subtle aura around your rocket' },
    { id: 'it_prestige_anim', name: 'Prestige Animation Selector', cost: 40, desc: 'Choose from 5 different Big Bang animations' },
    { id: 'it_phase_anim', name: 'Phase Skip Animation', cost: 15, desc: 'Faster, cooler phase transition animations' },
    { id: 'it_confetti2x', name: 'Double Confetti', cost: 10, desc: 'All confetti bursts are 2x bigger' },
    { id: 'it_alien_font', name: 'Alien Language Font', cost: 20, desc: 'Display all text in alien symbols (for fun)' }
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

  // ========== PRESTIGE MILESTONES (Section 59) ==========
  const PRESTIGE_MILESTONES = [
    { count: 1, cdBonus: 50, desc: 'Welcome to the Cosmic Dust Shop!' },
    { count: 3, cdBonus: 0, desc: 'Unlock Challenge Runs', unlockChallenges: true },
    { count: 5, cdBonus: 100, desc: '+100 CD + 1 Cosmic Egg', cosmicEgg: true },
    { count: 10, cdBonus: 250, desc: '+250 CD + 1 Void Egg + "Eternal" title', voidEgg: true, title: 'Eternal' },
    { count: 25, cdBonus: 1000, desc: '+1000 CD + "Starborn" rocket skin', rocketSkin: 'starborn' },
    { count: 50, cdBonus: 5000, desc: '+5000 CD + permanent x2 all income', permanentMult: 2 },
    { count: 100, cdBonus: 25000, desc: '"The Centennial" + all future prestige CD doubled', title: 'The Centennial', rocketSkin: 'infinite', cdDoubled: true }
  ];

  // Merge expansion data when available (Expansion loads before GameData is consumed)
  function mergeExpansionData() {
    if (typeof Expansion !== 'undefined') {
      // Add expansion achievements
      for (const ach of Expansion.EXPANSION_ACHIEVEMENTS) {
        if (!ACHIEVEMENTS.find(a => a.id === ach.id)) {
          ACHIEVEMENTS.push(ach);
        }
      }
      // Add expansion CD shop items
      for (const item of Expansion.EXPANSION_CD_SHOP) {
        if (!CD_SHOP.find(i => i.id === item.id)) {
          CD_SHOP.push(item);
        }
      }
      // Add expansion log entries
      for (const log of Expansion.EXPANSION_LOG) {
        if (!CAPTAINS_LOG.find(l => l.id === log.id)) {
          CAPTAINS_LOG.push(log);
        }
      }
    }
  }

  return {
    PHASES, ROCKET_PARTS, GENERATORS, UPGRADES, CD_SHOP, RESEARCH,
    ACHIEVEMENTS, CAPTAINS_LOG, EVENTS, DAILY_REWARDS, STAR_SYSTEM_TYPES,
    SPECIAL_STAR_SYSTEMS, ANOMALY_BONUSES, RARE_ASTEROID, ARTIFACT_FRAGMENTS,
    TERRAFORM_MILESTONES, UNIVERSES, IT_SHOP, ASTRONAUT_NAMES, CREW_TIERS,
    PRESTIGE_MILESTONES, getTotalGenerators, mergeExpansionData
  };
})();
