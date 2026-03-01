// numbers.js — Big number formatting and utilities
'use strict';

const NumberFormatter = (() => {
  const SUFFIXES = [
    '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
    'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'
  ];

  function format(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (num < 0) return '-' + format(-num, decimals);
    if (!isFinite(num)) return '∞';
    if (num < 1000) return Math.floor(num).toString();

    const exp = Math.floor(Math.log10(num));
    const suffixIndex = Math.floor(exp / 3);

    if (suffixIndex >= SUFFIXES.length) {
      return num.toExponential(decimals);
    }

    const divisor = Math.pow(10, suffixIndex * 3);
    const value = num / divisor;
    return value.toFixed(decimals) + SUFFIXES[suffixIndex];
  }

  function formatFull(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (!isFinite(num)) return 'Infinity';
    if (num >= 1e21) return num.toExponential(6);
    return Math.floor(num).toLocaleString('en-US');
  }

  // Scientific notation format — for settings toggle
  function formatSci(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    if (!isFinite(num)) return '∞';
    if (num < 1000) return Math.floor(num).toString();
    return num.toExponential(decimals);
  }

  function formatPerSec(num, symbol = '') {
    return symbol + format(num) + '/sec';
  }

  function formatCurrency(num, symbol = '') {
    return symbol + format(num);
  }

  function formatTime(seconds) {
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

  // Calculate cost of buying `count` generators starting at `owned`
  // Uses geometric series formula: first × (r^n - 1) / (r - 1)
  function bulkCost(baseCost, growthRate, owned, count) {
    if (count <= 0) return 0;
    if (growthRate === 1) return baseCost * count;
    const first = baseCost * Math.pow(growthRate, owned);
    return first * (Math.pow(growthRate, count) - 1) / (growthRate - 1);
  }

  // How many can we buy with `budget` starting at `owned`
  // Uses logarithmic solve: n = floor(log(budget*(r-1)/first + 1) / log(r))
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
    // Verify and adjust for floating-point edge cases
    while (n > 0 && bulkCost(baseCost, growthRate, owned, n) > budget) n--;
    while (bulkCost(baseCost, growthRate, owned, n + 1) <= budget) n++;
    const totalCost = bulkCost(baseCost, growthRate, owned, n);
    return { count: n, totalCost };
  }

  function nextCost(baseCost, growthRate, owned) {
    return baseCost * Math.pow(growthRate, owned);
  }

  function getSuffix(num) {
    if (num < 1000) return '';
    const exp = Math.floor(Math.log10(num));
    const suffixIndex = Math.floor(exp / 3);
    return suffixIndex < SUFFIXES.length ? SUFFIXES[suffixIndex] : 'e' + exp;
  }

  return { format, formatSci, formatFull, formatPerSec, formatCurrency, formatTime, bulkCost, maxAffordable, nextCost, getSuffix };
})();
