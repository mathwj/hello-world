// =========================================
// Utility Functions
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

  // Format large numbers
  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
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
  }
};
