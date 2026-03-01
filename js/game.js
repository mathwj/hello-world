// game.js — Main entry point, initialization
'use strict';

const Game = (() => {
  function init() {
    console.log('Deep Space Inc. initializing...');

    // Merge expansion data into GameData
    GameData.mergeExpansionData();

    // Try to load save
    const loaded = GameState.load();

    if (loaded) {
      const s = GameState.getState();
      // Recalculate CD multiplier
      s.cosmicDustMultiplier = 1 + (s.cosmicDust * 0.01);
      GameState.applyPermanentUpgrades();
      Expansion.applyCritUpgrades(s);

      // Check for offline earnings
      const earnings = GameState.calculateOfflineEarnings();
      if (earnings) {
        // Initialize UI first so modal can show
        SceneRenderer.init();
        UI.init();
        SceneRenderer.setPhase(s.currentPhase);
        UI.showWelcomeBack(earnings);
      } else {
        SceneRenderer.init();
        UI.init();
        SceneRenderer.setPhase(s.currentPhase);
      }

      // Check daily reward
      const today = new Date().toDateString();
      if (s.dailyReward.lastClaimDate !== today) {
        setTimeout(() => {
          const reward = Engine.claimDailyReward();
          if (reward) UI.showDailyReward(reward);
        }, 1500);
      }
    } else {
      // New game
      const s = GameState.getState();
      Engine.addLogEntry('log1');
      SceneRenderer.init();
      UI.init();
    }

    // Start game engine
    Engine.start();

    // Start tutorial for new players
    if (!GameState.getState().tutorialComplete) {
      setTimeout(() => Tutorial.init(), 500);
    }

    // Save on page close
    window.addEventListener('beforeunload', () => {
      GameState.save();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) GameState.save();
    });

    console.log('Deep Space Inc. started!');
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
