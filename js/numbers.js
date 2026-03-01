/* =============================================
   DEEP SPACE INC. — NUMBER SYSTEM & FORMATTING
   Section 2: Big numbers, abbreviations, display
   ============================================= */
'use strict';

const Num = (() => {
  // 2.2 Abbreviation table — up to Vigintillion, then scientific
  const SUFFIXES = [
    { exp: 3,  label: 'K' },
    { exp: 6,  label: 'M' },
    { exp: 9,  label: 'B' },
    { exp: 12, label: 'T' },
    { exp: 15, label: 'Qa' },
    { exp: 18, label: 'Qi' },
    { exp: 21, label: 'Sx' },
    { exp: 24, label: 'Sp' },
    { exp: 27, label: 'Oc' },
    { exp: 30, label: 'No' },
    { exp: 33, label: 'Dc' },
    { exp: 36, label: 'UDc' },
    { exp: 39, label: 'DDc' },
    { exp: 42, label: 'TDc' },
    { exp: 45, label: 'QaDc' },
    { exp: 48, label: 'QiDc' },
    { exp: 51, label: 'SxDc' },
    { exp: 54, label: 'SpDc' },
    { exp: 57, label: 'OcDc' },
    { exp: 60, label: 'NoDc' },
    { exp: 63, label: 'Vg' }
  ];

  // 2.3 Format number for display (abbreviated mode)
  function format(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num < 0) return '-' + format(-num, decimals);
    if (!isFinite(num)) return '∞';
    // Under 1,000: exact integer
    if (num < 1000) return Math.floor(num).toString();
    // 1e66+: scientific notation
    if (num >= 1e66) return num.toExponential(decimals);
    // Find best suffix (walk backwards)
    for (let i = SUFFIXES.length - 1; i >= 0; i--) {
      const s = SUFFIXES[i];
      const threshold = Math.pow(10, s.exp);
      if (num >= threshold) {
        return (num / threshold).toFixed(decimals) + s.label;
      }
    }
    return Math.floor(num).toString();
  }

  // Scientific notation format
  function formatSci(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num < 1000) return Math.floor(num).toString();
    return num.toExponential(decimals);
  }

  // Full number with commas — for tooltips / long-press
  function formatFull(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (!isFinite(num)) return 'Infinity';
    if (num >= 1e21) return num.toExponential(6);
    return Math.floor(num).toLocaleString('en-US');
  }

  // Per-second display: "₡1.50M/sec"
  function perSec(num, symbol) {
    return (symbol || '') + format(num) + '/sec';
  }

  // Format with currency symbol
  function currency(num, symbol) {
    return (symbol || '') + format(num);
  }

  // Format time durations
  function time(seconds) {
    if (seconds < 60) return Math.floor(seconds) + 's';
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return m + 'm ' + s + 's';
    }
    if (seconds < 86400) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      return h + 'h ' + m + 'm';
    }
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    return d + 'd ' + h + 'h';
  }

  // 4.3 Generator cost: cost(n) = baseCost × growthRate^n
  function cost(baseCost, growthRate, owned) {
    return baseCost * Math.pow(growthRate, owned);
  }

  // Bulk cost: sum of next `count` purchases (geometric series)
  function costBulk(baseCost, growthRate, owned, count) {
    if (count <= 0) return 0;
    if (growthRate === 1) return baseCost * count;
    const first = baseCost * Math.pow(growthRate, owned);
    return first * (Math.pow(growthRate, count) - 1) / (growthRate - 1);
  }

  // Max affordable count given a budget
  function maxAffordable(baseCost, growthRate, owned, budget) {
    if (budget <= 0) return { count: 0, totalCost: 0 };
    const first = baseCost * Math.pow(growthRate, owned);
    if (first > budget) return { count: 0, totalCost: 0 };
    if (growthRate === 1) {
      const n = Math.floor(budget / baseCost);
      return { count: n, totalCost: baseCost * n };
    }
    // Solve: first × (r^n - 1)/(r - 1) <= budget
    let n = Math.floor(Math.log(budget * (growthRate - 1) / first + 1) / Math.log(growthRate));
    if (n <= 0) n = 1;
    // Verify and adjust
    while (n > 0 && costBulk(baseCost, growthRate, owned, n) > budget) n--;
    while (costBulk(baseCost, growthRate, owned, n + 1) <= budget) n++;
    const total = costBulk(baseCost, growthRate, owned, n);
    return { count: n, totalCost: total };
  }

  return { format, formatSci, formatFull, perSec, currency, time, cost, costBulk, maxAffordable };
})();
