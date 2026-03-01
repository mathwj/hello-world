// events.js — Random events system, rare asteroids
'use strict';

const GameEvents = (() => {
  let eventTimer = 0;
  let eventDuration = 0;
  let currentEvent = null;
  let nextEventIn = getRandomEventInterval();
  let rareAsteroidTimer = 0;
  let nextRareAsteroidIn = getRandomAsteroidInterval();

  function getRandomEventInterval() {
    return 900 + Math.random() * 1800; // 15-45 min in seconds
  }

  function getRandomAsteroidInterval() {
    return 180 + Math.random() * 120; // 3-5 min
  }

  function processTick(dt) {
    const s = GameState.getState();

    // Event system
    if (currentEvent) {
      eventDuration -= dt;
      UI.updateEventTimer(eventDuration);
      if (eventDuration <= 0) {
        endEvent(s);
      }
    } else {
      nextEventIn -= dt;
      if (nextEventIn <= 0) {
        triggerRandomEvent(s);
        nextEventIn = getRandomEventInterval();
      }
    }

    // Rare asteroid (Phase 5+)
    if (s.currentPhase >= 5 && !s.rareAsteroidActive) {
      rareAsteroidTimer += dt;
      if (rareAsteroidTimer >= nextRareAsteroidIn) {
        rareAsteroidTimer = 0;
        nextRareAsteroidIn = getRandomAsteroidInterval();
        // Optionally trigger rare asteroid mini-event
      }
    }
  }

  function triggerRandomEvent(s) {
    const events = GameData.EVENTS;
    const eligible = events.filter(e => {
      if (e.id === 'evt_malfunction' && GameData.getTotalGenerators(s) < 1) return false;
      return true;
    });

    const event = eligible[Math.floor(Math.random() * eligible.length)];
    currentEvent = event;

    if (event.duration === 0) {
      // Instant event
      applyEventEffect(event, s);
      UI.showEventBanner(event);
      setTimeout(() => UI.hideEventBanner(), 3000);
      currentEvent = null;
    } else {
      eventDuration = event.duration;
      applyEventEffect(event, s);
      UI.showEventBanner(event);
    }
  }

  function applyEventEffect(event, s) {
    const eff = event.effect;
    if (eff.creditMultiplier) s.eventCreditMultiplier = eff.creditMultiplier;
    if (eff.tapMultiplier) s.eventTapMultiplier = eff.tapMultiplier;
    if (eff.rpMultiplier) s.eventRPMultiplier = eff.rpMultiplier;
    if (eff.energyMultiplier) {
      // Boost solar/energy generators
      s.eventCreditMultiplier = eff.energyMultiplier;
    }
    if (eff.loseCreditPercent) {
      const loss = s.credits * eff.loseCreditPercent;
      s.credits -= loss;
    }
    if (eff.skipProduction) {
      // Give X seconds worth of production
      GameState.addCurrency('credits', s.creditsPerSecond * eff.skipProduction);
      GameState.addCurrency('rp', s.rpPerSecond * eff.skipProduction);
      GameState.addCurrency('ore', s.orePerSecond * eff.skipProduction);
    }
  }

  function endEvent(s) {
    if (!currentEvent) return;
    // Reset all event multipliers
    s.eventCreditMultiplier = 1.0;
    s.eventTapMultiplier = 1.0;
    s.eventRPMultiplier = 1.0;
    currentEvent = null;
    UI.hideEventBanner();
  }

  return { processTick };
})();
