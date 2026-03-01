// tutorial.js — Tutorial/onboarding flow
'use strict';

const Tutorial = (() => {
  const steps = [
    {
      id: 0,
      target: '#tap-btn',
      text: 'Welcome to Deep Space Inc.! Tap SCAVENGE to earn your first credits.',
      waitFor: () => GameState.getState().totalTaps >= 5
    },
    {
      id: 1,
      target: '.generator-row:first-child .gen-buy-btn',
      text: 'Hire a Scrap Kid to earn credits automatically!',
      waitFor: () => GameState.getState().generators['p1g1'] >= 1
    },
    {
      id: 2,
      target: '.rocket-parts-section',
      text: 'Your goal: buy all rocket parts and launch into space!',
      waitFor: () => Object.values(GameState.getState().rocketParts).some(v => v)
    },
    {
      id: 3,
      text: 'One part down! Keep earning to buy the rest.',
      auto: true,
      duration: 3000
    },
    {
      id: 4,
      target: '.launch-btn',
      text: "She's ready! Tap LAUNCH to blast off!",
      waitFor: () => GameState.getState().rocketLaunched
    }
  ];

  let active = false;
  let currentStep = 0;
  let checkInterval = null;

  function init() {
    const s = GameState.getState();
    if (s.tutorialComplete || s.tutorialStep >= 5) return;

    currentStep = s.tutorialStep || 0;
    active = true;
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

    tooltip.textContent = step.text;
    overlay.classList.remove('hidden');

    if (step.auto) {
      setTimeout(() => {
        overlay.classList.add('hidden');
        nextStep();
      }, step.duration || 3000);
    }

    if (step.target) {
      // Highlight target element
      setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) {
          const rect = el.getBoundingClientRect();
          const spotlight = document.getElementById('tutorial-spotlight');
          spotlight.style.left = rect.left - 5 + 'px';
          spotlight.style.top = rect.top - 5 + 'px';
          spotlight.style.width = rect.width + 10 + 'px';
          spotlight.style.height = rect.height + 10 + 'px';
        }
      }, 100);
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
    overlay.classList.add('hidden');
    const s = GameState.getState();
    s.tutorialComplete = true;
  }

  return { init, complete };
})();
