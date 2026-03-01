// tutorial.js — Tutorial/onboarding flow (Section 86: Progressive Onboarding Redesign)
'use strict';

const Tutorial = (() => {
  // ===== 5-Step Progressive Onboarding =====
  // Step 1: Welcome → Tap SCAVENGE (spotlight tap button)
  // Step 2: Buy first generator (spotlight generator panel)
  // Step 3: Build rocket parts (spotlight rocket assembly)
  // Step 4: Buy an upgrade (spotlight upgrades tab)
  // Step 5: Launch rocket / phase transition (spotlight launch)

  const steps = [
    {
      id: 0,
      target: '#tap-btn',
      title: 'Welcome, Captain!',
      text: 'Your journey begins in a junkyard. Tap SCAVENGE to collect your first credits.',
      hint: 'Tap 5 times to continue',
      waitFor: () => GameState.getState().totalTaps >= 5,
      spotlight: true,
      position: 'above'
    },
    {
      id: 1,
      target: '#panel-generators .generator-row:first-child .gen-buy-btn',
      title: 'Hire Workers',
      text: 'Spend credits to hire workers. They earn credits automatically, even when you\'re away!',
      hint: 'Buy a Scrap Kid to continue',
      waitFor: () => GameState.getState().generators['p1g1'] >= 1,
      spotlight: true,
      position: 'above'
    },
    {
      id: 2,
      target: '#rocket-assembly',
      title: 'Build Your Rocket',
      text: 'Your goal: collect enough credits to buy all 5 rocket parts and launch into space!',
      hint: 'Buy any rocket part to continue',
      waitFor: () => Object.values(GameState.getState().rocketParts).some(v => v),
      spotlight: true,
      position: 'below'
    },
    {
      id: 3,
      target: '.tab-btn[data-tab="upgrades"]',
      title: 'Upgrade Everything',
      text: 'Upgrades multiply your earnings. Check the Upgrades tab regularly for new boosts!',
      hint: 'Tap to explore upgrades',
      auto: true,
      duration: 4000,
      spotlight: true,
      position: 'above'
    },
    {
      id: 4,
      target: '.launch-btn',
      title: 'Blast Off!',
      text: 'All rocket parts assembled! Tap LAUNCH to blast off into Low Earth Orbit — a whole new phase awaits!',
      hint: 'Launch when ready',
      waitFor: () => GameState.getState().rocketLaunched,
      spotlight: true,
      position: 'above'
    },
    {
      id: 5,
      title: 'Welcome to Phase 2!',
      text: 'You\'ve reached Low Earth Orbit! New currency: Research Points (RP). Use RP to unlock powerful technologies. The universe is yours to explore!',
      auto: true,
      duration: 5000,
      position: 'center'
    }
  ];

  let active = false;
  let currentStep = 0;
  let checkInterval = null;
  let totalSteps = steps.length;

  function init() {
    const s = GameState.getState();
    if (s.tutorialComplete || s.tutorialStep >= totalSteps) return;

    currentStep = s.tutorialStep || 0;
    active = true;

    // Setup skip and next button handlers
    const skipBtn = document.getElementById('tutorial-skip');
    const nextBtn = document.getElementById('tutorial-next');
    if (skipBtn) skipBtn.addEventListener('click', complete);
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

    // Set text content
    if (textEl) {
      let html = '';
      if (step.title) html += '<strong>' + step.title + '</strong><br>';
      html += step.text;
      if (step.hint) html += '<br><em style="color:var(--phase-primary);font-size:12px;margin-top:4px;display:inline-block;">' + step.hint + '</em>';
      textEl.innerHTML = html;
    }

    overlay.classList.remove('hidden');

    // Position tooltip
    if (step.position === 'center') {
      tooltip.style.top = '50%';
      tooltip.style.bottom = 'auto';
      tooltip.style.transform = 'translate(-50%, -50%)';
    } else {
      tooltip.style.top = 'auto';
      tooltip.style.bottom = '15%';
      tooltip.style.transform = 'translateX(-50%)';
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
          overlay.classList.add('hidden');
          nextStep();
        }
      }, step.duration || 3000);
    }

    // Spotlight target element
    if (step.target && step.spotlight) {
      setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          const spotlight = document.getElementById('tutorial-spotlight');
          if (spotlight) {
            const padding = 8;
            spotlight.style.left = (rect.left - padding) + 'px';
            spotlight.style.top = (rect.top - padding) + 'px';
            spotlight.style.width = (rect.width + padding * 2) + 'px';
            spotlight.style.height = (rect.height + padding * 2) + 'px';
            spotlight.style.display = 'block';
          }
        }
      }, 200);
    } else {
      const spotlight = document.getElementById('tutorial-spotlight');
      if (spotlight) spotlight.style.display = 'none';
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

  function complete() {
    active = false;
    if (checkInterval) clearInterval(checkInterval);
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.classList.add('hidden');
    const s = GameState.getState();
    s.tutorialComplete = true;

    // Show completion toast
    if (typeof Juice !== 'undefined' && Juice.ToastQueue) {
      Juice.ToastQueue.add('success', 'Tutorial Complete!', 'You\'re ready to explore the cosmos.');
    }
  }

  function isActive() {
    return active;
  }

  function getCurrentStep() {
    return currentStep;
  }

  return { init, complete, isActive, getCurrentStep };
})();
