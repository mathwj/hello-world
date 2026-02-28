// =========================================
// Toast Notifications & Floating Text
// =========================================

class NotificationManager {
  constructor() {
    this.container = document.getElementById('toast-container');
  }

  toast(message, type = '') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    this.container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2600);
  }

  // Floating text effect at screen position
  floatText(text, x, y, className = 'coins') {
    const el = document.createElement('div');
    el.className = `float-text ${className}`;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1300);
  }

  // Show coins earned
  showCoins(amount, x, y) {
    this.floatText(`+${amount} 🪙`, x, y, 'coins');
  }

  // Show XP earned
  showXP(amount, x, y) {
    this.floatText(`+${amount} XP`, x, y, 'xp');
  }

  // Show loss
  showLoss(text, x, y) {
    this.floatText(text, x, y, 'negative');
  }

  // Level up celebration
  levelUp(level) {
    this.toast(`🎉 Level Up! You're now Level ${level}!`, 'levelup');
  }

  // Quest complete
  questComplete(title) {
    this.toast(`📜 Quest Complete: ${title}`, 'reward');
  }

  // Warning
  warn(message) {
    this.toast(`⚠️ ${message}`, 'warning');
  }

  // Error
  error(message) {
    this.toast(`❌ ${message}`, 'error');
  }

  // Info
  info(message) {
    this.toast(message);
  }

  // Reward
  reward(message) {
    this.toast(message, 'reward');
  }
}
