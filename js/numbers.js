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
    if (num < 1e15) {
      return Math.floor(num).toLocaleString('en-US');
    }
    return num.toExponential(6);
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
  function bulkCost(baseCost, growthRate, owned, count) {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += baseCost * Math.pow(growthRate, owned + i);
    }
    return total;
  }

  // How many can we buy with `budget` starting at `owned`
  function maxAffordable(baseCost, growthRate, owned, budget) {
    let count = 0;
    let total = 0;
    while (true) {
      const next = baseCost * Math.pow(growthRate, owned + count);
      if (total + next > budget) break;
      total += next;
      count++;
      if (count > 10000) break; // safety
    }
    return { count, totalCost: total };
  }

  function nextCost(baseCost, growthRate, owned) {
    return baseCost * Math.pow(growthRate, owned);
  }

  return { format, formatFull, formatPerSec, formatCurrency, formatTime, bulkCost, maxAffordable, nextCost };
})();
