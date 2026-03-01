/* =============================================
   DEEP SPACE INC. — GAME DATA
   All generators, upgrades, achievements, phases.
   Starts minimal (Part 1), expanded in Parts 2-8.
   ============================================= */
'use strict';

const GameData = (() => {

  // Phase metadata
  const PHASES = {
    1: { name: 'THE JUNKYARD', location: 'Earth' },
    2: { name: 'LOW EARTH ORBIT', location: 'Space' },
    3: { name: 'THE MOON', location: 'Moon' },
    4: { name: 'MARS', location: 'Mars' },
    5: { name: 'THE ASTEROID BELT', location: 'Asteroids' },
    6: { name: 'JUPITER SYSTEM', location: 'Jupiter' },
    7: { name: 'INTERSTELLAR', location: 'Alpha Centauri' },
    8: { name: 'THE GALAXY', location: 'Milky Way' },
    9: { name: 'THE MULTIVERSE', location: 'Beyond' }
  };

  // Rocket Parts — Phase 1 (Section 6)
  const ROCKET_PARTS = [
    { id: 'hull',               name: 'Scrap Hull',          cost: 50 },
    { id: 'engine',             name: 'Basic Engine',         cost: 200 },
    { id: 'fuelTank',           name: 'Fuel Tank',            cost: 500 },
    { id: 'noseCone',           name: 'Nose Cone',            cost: 1000 },
    { id: 'navigationComputer', name: 'Navigation Computer',  cost: 2500 }
  ];

  // Generators by phase key — populated in Parts 2+
  // Each: { id, name, desc, baseCost, growth, output: { credits?, rp?, ore?, ... }, costCurrency? }
  const GENERATORS = {
    // Phase 1 generators (placeholder — Part 2 fills these)
    '1': [
      { id: 'g1_1', name: 'Scrap Kid',       desc: 'A neighborhood kid collecting junk',   baseCost: 10,   growth: 1.15, output: { credits: 1 } },
      { id: 'g1_2', name: 'Junk Magnet',      desc: 'Magnetic crane pulls in scrap',        baseCost: 50,   growth: 1.15, output: { credits: 5 } },
      { id: 'g1_3', name: 'Salvage Drone',    desc: 'Autonomous flying scrap collector',    baseCost: 250,  growth: 1.15, output: { credits: 20 } },
      { id: 'g1_4', name: 'Scrapyard Manager', desc: 'Organizes the junkyard operations',   baseCost: 1000, growth: 1.15, output: { credits: 75 } },
      { id: 'g1_5', name: 'Recycling Plant',  desc: 'Full metal recycling facility',        baseCost: 5000, growth: 1.15, output: { credits: 300 } }
    ]
  };

  // Upgrades by phase key — populated in Parts 2+
  const UPGRADES = {
    '1': [
      { id: 'u1_1', name: 'Better Gloves',  desc: 'Tap value x2',           cost: 100,   currency: 'credits', effect: { tapMultiplier: 2 } },
      { id: 'u1_2', name: 'Scrap Finder',   desc: 'Scrap Kid output x2',    cost: 500,   currency: 'credits', effect: { globalCreditMultiplier: 1.5 } },
      { id: 'u1_3', name: 'Auto Collector',  desc: 'Auto-tap 2/sec',         cost: 2000,  currency: 'credits', effect: { autoTap: 2 } },
      { id: 'u1_4', name: 'Turbo Gloves',   desc: 'Tap value x3',           cost: 10000, currency: 'credits', effect: { tapMultiplier: 3 } }
    ]
  };

  // Achievements — populated in Parts 3+
  const ACHIEVEMENTS = [
    { id: 'ach_first_tap',   name: 'First Tap',      desc: 'Tap for the first time',         check: (s) => s.totalTaps >= 1 },
    { id: 'ach_100_taps',    name: 'Tap Enthusiast',  desc: 'Tap 100 times',                  check: (s) => s.totalTaps >= 100 },
    { id: 'ach_1000_taps',   name: 'Tap Machine',     desc: 'Tap 1,000 times',                check: (s) => s.totalTaps >= 1000 },
    { id: 'ach_first_gen',   name: 'First Hire',      desc: 'Buy your first generator',       check: null },
    { id: 'ach_all_parts',   name: 'Rocket Builder',  desc: 'Collect all rocket parts',       check: null },
    { id: 'ach_launch',      name: 'Liftoff!',        desc: 'Launch your rocket',             check: null },
    { id: 'ach_1k_credits',  name: 'Getting Started', desc: 'Earn 1,000 credits',             check: (s) => s.creditsAllTimeEarned >= 1000 },
    { id: 'ach_1m_credits',  name: 'Millionaire',     desc: 'Earn 1,000,000 credits',         check: (s) => s.creditsAllTimeEarned >= 1e6 },
    { id: 'ach_1b_credits',  name: 'Billionaire',     desc: 'Earn 1,000,000,000 credits',     check: (s) => s.creditsAllTimeEarned >= 1e9 }
  ];

  return {
    PHASES,
    ROCKET_PARTS,
    GENERATORS,
    UPGRADES,
    ACHIEVEMENTS
  };
})();
