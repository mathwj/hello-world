// tutorial.js — Tutorial/onboarding flow (Section 33: 7-Step Progressive Onboarding)
'use strict';

const Tutorial = (() => {
  // ===== 7-Step Progressive Onboarding =====
  // Step 0: Welcome → Tap SCAVENGE 5 times (spotlight tap button)
  // Step 1: Celebration — "Great! You earned credits!" (auto-advance)
  // Step 2: Buy first generator (spotlight Scrap Kid buy button)
  // Step 3: Celebrate first purchase — "Now you're earning passively!" (auto-advance)
  // Step 4: Build rocket parts (spotlight rocket assembly)
  // Step 5: Explore upgrades tab (spotlight upgrades tab)
  // Step 6: Launch rocket / phase transition (spotlight launch)
  // Step 7: Welcome to Phase 2 — RP introduction (auto-advance center)

  const steps = [
    {
      id: 0,
      target: '#tap-btn',
      title: 'Welcome to Deep Space Inc.!',
      text: 'You\'re a junkyard captain with big dreams. Tap SCAVENGE to earn your first credits — every space empire starts somewhere!',
      hint: 'Tap 5 times to continue',
      waitFor: () => GameState.getState().totalTaps >= 5,
      spotlight: true,
      position: 'above',
      onComplete: () => {
        if (typeof Juice !== 'undefined' && Juice.Confetti) {
          Juice.Confetti.burst('small');
        }
      }
    },
    {
      id: 1,
      title: 'Great Job, Captain!',
      text: 'You earned your first credits! \u20A1 Credits are your basic currency — you\'ll need them for everything. Let\'s put them to work.',
      auto: true,
      duration: 3500,
      position: 'center',
      onComplete: () => {
        // Switch to generators tab if not already visible
        if (typeof UI !== 'undefined' && UI.switchTab) UI.switchTab('generators');
      }
    },
    {
      id: 2,
      target: '#panel-generators .generator-row:first-child .gen-buy-btn',
      title: 'Hire Your First Worker',
      text: 'Workers earn credits automatically, even while you\'re away! Hire a Scrap Kid to start building your empire.',
      hint: 'Buy a Scrap Kid to continue',
      waitFor: () => GameState.getState().generators['p1g1'] >= 1,
      spotlight: true,
      position: 'above',
      onComplete: () => {
        if (typeof Juice !== 'undefined' && Juice.Confetti) {
          Juice.Confetti.burst('small');
        }
      }
    },
    {
      id: 3,
      title: 'Earning on Autopilot!',
      text: 'Nice! Your Scrap Kid is now earning credits every second — no tapping needed. Keep hiring more workers and upgrading them to grow faster!',
      auto: true,
      duration: 4000,
      position: 'center'
    },
    {
      id: 4,
      target: '#rocket-assembly',
      title: 'Build Your Rocket',
      text: 'Your ultimate goal: collect all 5 rocket parts and launch into space! Each part costs credits — keep earning and building.',
      hint: 'Buy any rocket part to continue',
      waitFor: () => Object.values(GameState.getState().rocketParts).some(v => v),
      spotlight: true,
      position: 'below'
    },
    {
      id: 5,
      target: '.tab-btn[data-tab="upgrades"]',
      title: 'Power Up!',
      text: 'Upgrades multiply your earnings permanently. Check the Upgrades tab regularly — new boosts unlock as you progress!',
      hint: 'Tap to explore upgrades',
      auto: true,
      duration: 4000,
      spotlight: true,
      position: 'above'
    },
    {
      id: 6,
      target: '.launch-btn',
      title: 'Blast Off!',
      text: 'All rocket parts assembled! Tap LAUNCH to leave the junkyard behind and blast off into Low Earth Orbit — Phase 2 awaits!',
      hint: 'Launch when ready',
      waitFor: () => GameState.getState().rocketLaunched,
      spotlight: true,
      position: 'above',
      onComplete: () => {
        if (typeof Juice !== 'undefined') {
          if (Juice.Confetti) Juice.Confetti.burst('launch');
          if (Juice.ScreenFlash) Juice.ScreenFlash.fire('#ffffff', 500);
        }
      }
    },
    {
      id: 7,
      title: 'Welcome to Phase 2!',
      text: 'You\'ve reached Low Earth Orbit! New currency unlocked: Research Points (RP). Use RP to unlock powerful technologies in the Research tab. The entire universe is yours to explore!',
      auto: true,
      duration: 6000,
      position: 'center'
    }
  ];

  let active = false;
  let currentStep = 0;
  let checkInterval = null;
  let totalSteps = steps.length;
  let _prevState = {}; // Track state changes for reactive feedback

  function init() {
    const s = GameState.getState();
    if (s.tutorialComplete || s.tutorialStep >= totalSteps) return;

    currentStep = s.tutorialStep || 0;
    active = true;
    _prevState = {
      totalTaps: s.totalTaps,
      credits: s.credits
    };

    // Setup skip and next button handlers
    const skipBtn = document.getElementById('tutorial-skip');
    const nextBtn = document.getElementById('tutorial-next');
    if (skipBtn) skipBtn.addEventListener('click', skip);
    if (nextBtn) nextBtn.addEventListener('click', () => {
      const step = steps[currentStep];
      if (step && step.auto) nextStep();
    });

    showStep(currentStep);
    startChecking();
  }

  function startChecking() {
    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(() => {
      if (!active) return;
      const step = steps[currentStep];
      if (!step) { complete(); return; }

      if (step.waitFor && step.waitFor()) {
        // Fire completion callback before advancing
        if (step.onComplete) {
          try { step.onComplete(); } catch (e) { /* ignore */ }
        }
        nextStep();
      }
    }, 500);
  }

  function showStep(idx) {
    const step = steps[idx];
    if (!step) { complete(); return; }

    const overlay = document.getElementById('tutorial-overlay');
    const tooltip = document.getElementById('tutorial-tooltip');
    const textEl = document.getElementById('tutorial-text');
    const stepIndicator = document.getElementById('tutorial-step-indicator');

    if (!overlay || !tooltip) return;

    // Build step indicator dots
    if (stepIndicator) {
      let dotsHtml = '';
      for (let i = 0; i < totalSteps; i++) {
        const cls = i === idx ? 'active' : (i < idx ? 'completed' : '');
        dotsHtml += '<div class="tutorial-step-dot ' + cls + '"></div>';
      }
      stepIndicator.innerHTML = dotsHtml;
    }

    // Set text content with improved formatting
    if (textEl) {
      let html = '';
      if (step.title) html += '<strong class="tutorial-title">' + step.title + '</strong><br>';
      html += '<span class="tutorial-body">' + step.text + '</span>';
      if (step.hint) html += '<br><em class="tutorial-hint">' + step.hint + '</em>';
      textEl.innerHTML = html;
    }

    overlay.classList.remove('hidden');
    overlay.classList.add('tutorial-active');

    // Position tooltip based on step config
    if (step.position === 'center') {
      tooltip.style.top = '50%';
      tooltip.style.bottom = 'auto';
      tooltip.style.transform = 'translate(-50%, -50%)';
      tooltip.classList.add('tutorial-center');
      tooltip.classList.remove('tutorial-bottom');
    } else {
      tooltip.style.top = 'auto';
      tooltip.style.bottom = '15%';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.classList.add('tutorial-bottom');
      tooltip.classList.remove('tutorial-center');
    }

    // Show/hide next button
    const nextBtn = document.getElementById('tutorial-next');
    if (nextBtn) {
      nextBtn.style.display = step.auto ? 'inline-block' : 'none';
    }

    // Auto-advance for auto steps
    if (step.auto) {
      setTimeout(() => {
        if (active && currentStep === idx) {
          if (step.onComplete) {
            try { step.onComplete(); } catch (e) { /* ignore */ }
          }
          overlay.classList.add('hidden');
          nextStep();
        }
      }, step.duration || 3000);
    }

    // Spotlight target element with smooth repositioning
    if (step.target && step.spotlight) {
      setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) {
          // Scroll element into view if needed
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });

          setTimeout(() => {
            const rect = el.getBoundingClientRect();
            const spotlight = document.getElementById('tutorial-spotlight');
            if (spotlight) {
              const padding = 10;
              spotlight.style.left = (rect.left - padding) + 'px';
              spotlight.style.top = (rect.top - padding) + 'px';
              spotlight.style.width = (rect.width + padding * 2) + 'px';
              spotlight.style.height = (rect.height + padding * 2) + 'px';
              spotlight.style.display = 'block';
              spotlight.classList.add('tutorial-spotlight-pulse');
            }
          }, 300);
        }
      }, 200);
    } else {
      const spotlight = document.getElementById('tutorial-spotlight');
      if (spotlight) {
        spotlight.style.display = 'none';
        spotlight.classList.remove('tutorial-spotlight-pulse');
      }
    }
  }

  function nextStep() {
    currentStep++;
    const s = GameState.getState();
    s.tutorialStep = currentStep;

    if (currentStep >= steps.length) {
      complete();
      return;
    }

    showStep(currentStep);
  }

  function skip() {
    // Track that user skipped for analytics
    const s = GameState.getState();
    s.stats.tutorialSkippedAtStep = currentStep;
    complete();
  }

  function complete() {
    active = false;
    if (checkInterval) clearInterval(checkInterval);

    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('tutorial-active');
    }

    const spotlight = document.getElementById('tutorial-spotlight');
    if (spotlight) {
      spotlight.style.display = 'none';
      spotlight.classList.remove('tutorial-spotlight-pulse');
    }

    const s = GameState.getState();
    s.tutorialComplete = true;

    // Show completion toast with confetti
    if (typeof Juice !== 'undefined') {
      if (Juice.ToastQueue) {
        Juice.ToastQueue.add('success', 'Tutorial Complete!', 'You\'re ready to explore the cosmos. Good luck, Captain!');
      }
      if (Juice.Confetti) {
        Juice.Confetti.burst('achievement');
      }
    }
  }

  function isActive() {
    return active;
  }

  function getCurrentStep() {
    return currentStep;
  }

  return { init, skip, complete, isActive, getCurrentStep };
})();
