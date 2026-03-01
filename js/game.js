// game.js — Main entry point, initialization, splash screen, performance monitoring
// Section 73: Loading & Splash Screen
// Section 84: Error States & Edge Cases
// Section 90: Performance Budget & Rendering Rules
'use strict';

const Game = (() => {
  // ===== Section 73: Splash Screen System =====
  const Splash = {
    progressEl: null,
    textEl: null,
    progress: 0,
    steps: [
      { pct: 10, text: 'Loading game data...' },
      { pct: 25, text: 'Initializing state...' },
      { pct: 40, text: 'Building scene...' },
      { pct: 60, text: 'Preparing UI...' },
      { pct: 80, text: 'Loading audio...' },
      { pct: 95, text: 'Calibrating engines...' },
      { pct: 100, text: 'Ready for launch!' }
    ],

    init() {
      this.progressEl = document.getElementById('splash-loading-bar-inner');
      this.textEl = document.getElementById('splash-loading-text');
    },

    setProgress(pct, text) {
      this.progress = pct;
      if (this.progressEl) this.progressEl.style.width = pct + '%';
      if (this.textEl && text) this.textEl.textContent = text;
    },

    async animateSteps() {
      for (const step of this.steps) {
        this.setProgress(step.pct, step.text);
        await new Promise(r => setTimeout(r, 80 + Math.random() * 120));
      }
    },

    hide() {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.add('hidden');
        // Remove from DOM after transition
        setTimeout(() => {
          if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, 600);
      }
    }
  };

  // ===== Section 90: Performance Monitor =====
  const PerfMonitor = {
    frameTimes: [],
    lastFrameTime: 0,
    lowFpsCount: 0,
    perfReduced: false,
    checkInterval: null,
    targetFps: 60,
    frameBudgetMs: 16.67,

    init() {
      this.lastFrameTime = performance.now();
      // Check every 5 seconds
      this.checkInterval = setInterval(() => this.evaluate(), 5000);
    },

    recordFrame() {
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      this.frameTimes.push(delta);
      if (this.frameTimes.length > 60) this.frameTimes.shift();
    },

    getAverageFps() {
      if (this.frameTimes.length === 0) return 60;
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      return 1000 / avg;
    },

    evaluate() {
      const fps = this.getAverageFps();

      if (fps < 25 && !this.perfReduced) {
        this.lowFpsCount++;
        if (this.lowFpsCount >= 2) {
          this.enableReducedMode();
        }
      } else if (fps > 50 && this.perfReduced) {
        // FPS recovered — could re-enable effects but stay safe
        this.lowFpsCount = 0;
      } else {
        this.lowFpsCount = Math.max(0, this.lowFpsCount - 1);
      }
    },

    enableReducedMode() {
      this.perfReduced = true;
      document.getElementById('game-container').classList.add('perf-reduced');
      const warning = document.getElementById('perf-warning');
      if (warning) warning.classList.remove('hidden');
      // Auto-hide warning after 4 seconds
      setTimeout(() => {
        if (warning) warning.classList.add('hidden');
      }, 4000);

      // Reduce particle counts in game state
      const s = GameState.getState();
      s.settings.particleEffects = false;
      console.warn('Performance reduced mode enabled (FPS was < 25)');
    },

    disableReducedMode() {
      this.perfReduced = false;
      document.getElementById('game-container').classList.remove('perf-reduced');
      const s = GameState.getState();
      s.settings.particleEffects = true;
    },

    isReduced() {
      return this.perfReduced;
    },

    destroy() {
      if (this.checkInterval) clearInterval(this.checkInterval);
    }
  };

  // ===== Section 84: Error Recovery =====
  const ErrorRecovery = {
    init() {
      // Global error handler
      window.addEventListener('error', (e) => {
        console.error('Game error:', e.message, e.filename, e.lineno);
        this.showError('An error occurred. Your progress is saved.');
        // Auto-save on error
        try { GameState.save(); } catch (_) { /* swallow */ }
      });

      window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
      });
    },

    showError(message) {
      const banner = document.getElementById('error-banner');
      const text = document.getElementById('error-banner-text');
      if (!banner || !text) return;
      text.textContent = message;
      banner.classList.remove('hidden');

      const dismiss = document.getElementById('error-banner-dismiss');
      if (dismiss) {
        dismiss.onclick = () => banner.classList.add('hidden');
      }

      // Auto-dismiss after 8 seconds
      setTimeout(() => banner.classList.add('hidden'), 8000);
    },

    // Validate save data integrity
    validateSave() {
      try {
        const s = GameState.getState();
        // Check for NaN in critical numeric fields
        const numerics = ['credits', 'researchPoints', 'lunarOre', 'rareMinerals',
          'stardust', 'cosmicDust', 'totalTaps', 'creditsPerSecond'];
        for (const key of numerics) {
          if (typeof s[key] === 'number' && (isNaN(s[key]) || !isFinite(s[key]))) {
            console.warn('Correcting NaN/Infinity in state.' + key);
            s[key] = 0;
          }
        }
        // Check negative currency
        if (s.credits < 0) s.credits = 0;
        if (s.researchPoints < 0) s.researchPoints = 0;
        if (s.lunarOre < 0) s.lunarOre = 0;

        return true;
      } catch (e) {
        console.error('Save validation failed:', e);
        return false;
      }
    },

    // Attempt to recover corrupted save
    attemptRecovery() {
      this.showError('Save data appears corrupted. Attempting recovery...');
      try {
        const s = GameState.getState();
        // Reset rates — they'll be recalculated
        s.creditsPerSecond = 0;
        s.rpPerSecond = 0;
        s.orePerSecond = 0;
        s.rmPerSecond = 0;
        s.sdPerSecond = 0;
        GameState.save();
        return true;
      } catch (e) {
        this.showError('Recovery failed. You may need to reset the game in Settings.');
        return false;
      }
    }
  };

  // ===== Main Initialization =====
  async function init() {
    console.log('Deep Space Inc. initializing...');

    // Initialize splash
    Splash.init();

    // Error recovery system
    ErrorRecovery.init();

    // Merge expansion data into GameData
    Splash.setProgress(10, 'Loading game data...');
    GameData.mergeExpansionData();

    // Try to load save
    Splash.setProgress(25, 'Initializing state...');
    const loaded = GameState.load();

    if (loaded) {
      const s = GameState.getState();

      // Validate save integrity
      ErrorRecovery.validateSave();

      // Recalculate CD multiplier
      s.cosmicDustMultiplier = 1 + (s.cosmicDust * 0.01);
      GameState.applyPermanentUpgrades();
      Expansion.applyCritUpgrades(s);

      // Apply theme
      if (s.settings.theme && s.settings.theme !== 'default') {
        document.getElementById('game-container').classList.add('theme-' + s.settings.theme);
      }

      // Check for offline earnings
      Splash.setProgress(40, 'Building scene...');
      const earnings = GameState.calculateOfflineEarnings();

      Splash.setProgress(60, 'Preparing UI...');
      SceneRenderer.init();
      UI.init();
      SceneRenderer.setPhase(s.currentPhase);

      if (earnings) {
        UI.showWelcomeBack(earnings);
      }

      // Check daily reward
      Splash.setProgress(80, 'Loading audio...');
      const today = new Date().toDateString();
      if (s.dailyReward.lastClaimDate !== today) {
        setTimeout(() => {
          const reward = Engine.claimDailyReward();
          if (reward) UI.showDailyReward(reward);
        }, 1500);
      }
    } else {
      // New game
      Splash.setProgress(40, 'Building scene...');
      const s = GameState.getState();
      Engine.addLogEntry('log1');

      Splash.setProgress(60, 'Preparing UI...');
      SceneRenderer.init();
      UI.init();
    }

    Splash.setProgress(95, 'Calibrating engines...');

    // Start game engine
    Engine.start();

    // Start performance monitoring
    PerfMonitor.init();

    // Start tutorial for new players
    if (!GameState.getState().tutorialComplete) {
      setTimeout(() => Tutorial.init(), 800);
    }

    // Save on page close
    window.addEventListener('beforeunload', () => {
      GameState.save();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        GameState.save();
        if (typeof Juice !== 'undefined') Juice.MicroInteractions.showSaveIndicator();
      }
    });

    Splash.setProgress(100, 'Ready for launch!');

    // Hide splash after a short delay
    setTimeout(() => {
      Splash.hide();
    }, 400);

    console.log('Deep Space Inc. started!');
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init, PerfMonitor, ErrorRecovery, Splash };
})();
