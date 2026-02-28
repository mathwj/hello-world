// =========================================
// Utility Functions - Idle Tycoon Edition
// =========================================

const Utils = {
  // Format seconds into human readable time
  formatTime(seconds) {
    if (seconds <= 0) return 'Ready!';
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = Math.ceil(seconds % 60);
      return s > 0 ? `${m}m ${s}s` : `${m}m`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  },

  // Format large numbers with suffix notation (idle tycoon style)
  formatNumber(num) {
    if (num < 0) return '-' + Utils.formatNumber(-num);
    if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Qn';
    if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Qa';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e4) return (num / 1e3).toFixed(1) + 'K';
    if (num >= 1000) return (num / 1e3).toFixed(1) + 'K';
    if (Number.isInteger(num)) return num.toLocaleString();
    return num.toFixed(1);
  },

  // Compact format for very tight spaces
  formatCompact(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(0) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(0) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(0) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return Math.floor(num).toString();
  },

  // Format CPS (coins per second) with appropriate precision
  formatCPS(cps) {
    if (cps >= 1e6) return Utils.formatNumber(cps);
    if (cps >= 1000) return (cps / 1000).toFixed(1) + 'K';
    if (cps >= 100) return Math.floor(cps).toString();
    if (cps >= 10) return cps.toFixed(1);
    if (cps >= 1) return cps.toFixed(2);
    if (cps > 0) return cps.toFixed(3);
    return '0';
  },

  // Format multiplier display (e.g., "x1.5", "x3.2")
  formatMultiplier(mult) {
    if (mult >= 100) return 'x' + Math.floor(mult);
    if (mult >= 10) return 'x' + mult.toFixed(1);
    return 'x' + mult.toFixed(2);
  },

  // Get current timestamp in seconds
  now() {
    return Date.now() / 1000;
  },

  // Clamp value between min and max
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  // Lerp between two values
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Random integer between min and max (inclusive)
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Shuffle array
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Deep clone
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Generate unique ID
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // Throttle function
  throttle(fn, delay) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= delay) {
        last = now;
        return fn.apply(this, args);
      }
    };
  },

  // Debounce function
  debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Easing functions for animations
  easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },

  easeOutElastic(t) {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  }
};
