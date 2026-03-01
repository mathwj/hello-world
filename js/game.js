/* =============================================
   DEEP SPACE INC. — GAME BOOTSTRAP
   Main entry point: init, load, start
   ============================================= */
'use strict';

const Game = (() => {
  function init() {
    console.log('Deep Space Inc. initializing...');

    // Load save (if exists)
    const loaded = State.load();

    if (loaded) {
      const s = State.get();
      // 1.2 Recalculate computed values
      s.cosmicDustMultiplier = 1 + (s.cosmicDust * 0.01);

      // 1.3 Check offline earnings
      const earnings = State.calculateOfflineEarnings();

      // Init UI
      UI.init();

      if (earnings) {
        State.applyOfflineEarnings(earnings);
        UI.showOfflineEarnings(earnings);
      }
    } else {
      // New game
      UI.init();
    }

    // Start the 100ms tick engine (Section 4.1)
    Engine.start();

    // Save on page close / tab switch (Section 1.3)
    window.addEventListener('beforeunload', () => State.save());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) State.save();
    });

    console.log('Deep Space Inc. started!');
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
