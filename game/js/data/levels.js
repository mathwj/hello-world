// Level progression configuration
const LEVELS_DATA = [];

// Generate level data with exponential scaling
(function generateLevels() {
  let cumulativeXP = 0;
  const maxLevel = 50; // Easily extendable

  for (let i = 1; i <= maxLevel; i++) {
    let xpRequired;
    if (i === 1) {
      xpRequired = 0; // Level 1 is the starting level
    } else if (i <= 5) {
      xpRequired = Math.floor(30 * Math.pow(1.6, i - 1));
    } else if (i <= 10) {
      xpRequired = Math.floor(50 * Math.pow(1.55, i - 1));
    } else if (i <= 20) {
      xpRequired = Math.floor(80 * Math.pow(1.5, i - 1));
    } else {
      xpRequired = Math.floor(100 * Math.pow(1.45, i - 1));
    }

    cumulativeXP += xpRequired;

    LEVELS_DATA.push({
      level: i,
      xpRequired: xpRequired,
      cumulativeXP: cumulativeXP,
      rewards: {
        coins: i * 20 + 50,
        gems: (i % 5 === 0) ? Math.ceil(i / 5) : 0
      }
    });
  }
})();

// Land expansion data
const LAND_EXPANSIONS = [
  { id: 'expand_1', cost: 500, costType: 'coins', size: { rows: 4, cols: 4 }, direction: 'right', unlockLevel: 5, label: 'East Field' },
  { id: 'expand_2', cost: 1000, costType: 'coins', size: { rows: 4, cols: 4 }, direction: 'bottom', unlockLevel: 8, label: 'South Meadow' },
  { id: 'expand_3', cost: 2000, costType: 'coins', size: { rows: 4, cols: 4 }, direction: 'right', unlockLevel: 12, label: 'Far East Fields' },
  { id: 'expand_4', cost: 4000, costType: 'coins', size: { rows: 4, cols: 8 }, direction: 'bottom', unlockLevel: 16, label: 'Grand Pasture' },
  { id: 'expand_5', cost: 8000, costType: 'coins', size: { rows: 8, cols: 4 }, direction: 'right', unlockLevel: 20, label: 'Hilltop Haven' }
];
