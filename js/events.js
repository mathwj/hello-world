// events.js — Random events system, rare asteroids, artifact fragments
'use strict';

const GameEvents = (() => {
  let eventTimer = 0;
  let eventDuration = 0;
  let currentEvent = null;
  let nextEventIn = getRandomEventInterval();
  let rareAsteroidTimer = 0;
  let nextRareAsteroidIn = getRandomAsteroidInterval();

  // Mini-game timers
  let miniGameTimer = 0;
  let nextMiniGameIn = getRandomMiniGameInterval();

  // Rare asteroid state
  let asteroidActive = false;
  let asteroidTapsRemaining = 0;
  let asteroidTimeLeft = 0;
  let asteroidIsCritical = false;

  // Alien artifact fragment state
  let artifactTimer = 0;
  let nextArtifactIn = getRandomArtifactInterval();
  let artifactVisible = false;

  function getRandomEventInterval() {
    return 900 + Math.random() * 1800; // 15-45 min in seconds
  }

  function getRandomAsteroidInterval() {
    const cfg = GameData.RARE_ASTEROID;
    return cfg.spawnInterval[0] + Math.random() * (cfg.spawnInterval[1] - cfg.spawnInterval[0]);
  }

  function getRandomArtifactInterval() {
    const cfg = GameData.ARTIFACT_FRAGMENTS;
    return cfg.spawnInterval[0] + Math.random() * (cfg.spawnInterval[1] - cfg.spawnInterval[0]);
  }

  function getRandomMiniGameInterval() {
    return 1800 + Math.random() * 1800; // 30-60 min in seconds
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
    if (s.currentPhase >= 5) {
      if (asteroidActive) {
        asteroidTimeLeft -= dt;
        UI.updateRareAsteroid(asteroidTapsRemaining, asteroidTimeLeft, asteroidIsCritical);
        if (asteroidTimeLeft <= 0) {
          dismissAsteroid(false);
        }
      } else {
        rareAsteroidTimer += dt;
        if (rareAsteroidTimer >= nextRareAsteroidIn) {
          rareAsteroidTimer = 0;
          nextRareAsteroidIn = getRandomAsteroidInterval();
          spawnRareAsteroid();
        }
      }
    }

    // Mini-game trigger (Phase 2+, not during another mini-game)
    if (s.currentPhase >= 2 && !MiniGames.isActive()) {
      miniGameTimer += dt;
      if (miniGameTimer >= nextMiniGameIn) {
        miniGameTimer = 0;
        nextMiniGameIn = getRandomMiniGameInterval();
        triggerMiniGame(s);
      }
    }

    // Alien artifact fragments (Phase 4+, terraform >= 50%)
    if (s.currentPhase >= 4 && s.terraforming.marsPercent >= GameData.ARTIFACT_FRAGMENTS.minTerraform) {
      if (!artifactVisible) {
        artifactTimer += dt;
        if (artifactTimer >= nextArtifactIn) {
          artifactTimer = 0;
          nextArtifactIn = getRandomArtifactInterval();
          artifactVisible = true;
          UI.showArtifactFragment();
        }
      }
    }
  }

  function triggerRandomEvent(s) {
    const events = GameData.EVENTS;
    const eligible = events.filter(e => {
      if (e.id === 'evt_malfunction' && GameData.getTotalGenerators(s) < 1) return false;
      if (e.phaseReq && s.currentPhase < e.phaseReq) return false;
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
    if (eff.grantAS) {
      GameState.addCurrency('as', eff.grantAS);
      s.stats.totalAlienSignalsDecoded = (s.stats.totalAlienSignalsDecoded || 0) + eff.grantAS;
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

  // ========== RARE ASTEROID (Phase 5+) ==========
  function spawnRareAsteroid() {
    const cfg = GameData.RARE_ASTEROID;
    asteroidActive = true;
    asteroidTapsRemaining = cfg.tapsRequired;
    asteroidTimeLeft = cfg.timeLimit;
    asteroidIsCritical = Math.random() < cfg.criticalChance;
    UI.showRareAsteroid(asteroidIsCritical);
  }

  function tapRareAsteroid() {
    if (!asteroidActive) return;
    asteroidTapsRemaining--;
    UI.updateRareAsteroid(asteroidTapsRemaining, asteroidTimeLeft, asteroidIsCritical);

    if (asteroidTapsRemaining <= 0) {
      dismissAsteroid(true);
    }
  }

  function dismissAsteroid(mined) {
    asteroidActive = false;
    UI.hideRareAsteroid();

    const s = GameState.getState();
    if (mined) {
      const cfg = GameData.RARE_ASTEROID;
      const mult = asteroidIsCritical ? 3 : 1;
      const oreReward = cfg.rewards.ore() * mult;
      const rmReward = cfg.rewards.rm() * mult;
      const creditReward = cfg.rewards.credits() * mult;

      GameState.addCurrency('ore', oreReward);
      GameState.addCurrency('rm', rmReward);
      GameState.addCurrency('credits', creditReward);

      // Track consecutive asteroid finds for achievement
      s.stats.consecutiveAsteroids = (s.stats.consecutiveAsteroids || 0) + 1;

      UI.showEventBanner({
        name: asteroidIsCritical ? 'CRITICAL Asteroid Mined!' : 'Rare Asteroid Mined!',
        desc: 'Ore +' + NumberFormatter.format(oreReward) + ', RM +' + NumberFormatter.format(rmReward),
        icon: '\u2604',
        type: 'positive'
      });
      setTimeout(() => UI.hideEventBanner(), 3000);
    } else {
      // Reset consecutive streak on miss
      s.stats.consecutiveAsteroids = 0;

      UI.showEventBanner({
        name: 'Asteroid Escaped!',
        desc: 'The rare asteroid floated away...',
        icon: '\u2604',
        type: 'negative'
      });
      setTimeout(() => UI.hideEventBanner(), 2000);
    }
  }

  // ========== ALIEN ARTIFACT FRAGMENTS (Phase 4) ==========
  function collectArtifactFragment() {
    if (!artifactVisible) return;
    artifactVisible = false;
    UI.hideArtifactFragment();

    const s = GameState.getState();
    s.alienArtifacts = (s.alienArtifacts || 0) + 1;

    // Check milestones
    const milestones = GameData.ARTIFACT_FRAGMENTS.decoderBonuses;
    for (const m of milestones) {
      if (s.alienArtifacts === m.fragments) {
        if (m.logEntry) {
          Engine.addLogEntry(m.logEntry);
        }
        if (m.effect) {
          if (m.effect.phaseMultiplier) {
            const pm = m.effect.phaseMultiplier;
            s.phaseMultipliers[pm.phase] = (s.phaseMultipliers[pm.phase] || 1) * pm.mult;
          }
          if (m.effect.terraformMultiplier) {
            s.terraformMultiplier = (s.terraformMultiplier || 1) * m.effect.terraformMultiplier;
          }
        }
        if (m.creditBonus) {
          GameState.addCurrency('credits', m.creditBonus);
        }

        UI.showEventBanner({
          name: 'Artifact Milestone: ' + m.fragments,
          desc: m.bonus,
          icon: '\uD83D\uDD2E',
          type: 'positive'
        });
        setTimeout(() => UI.hideEventBanner(), 4000);
        break;
      }
    }
  }

  // ========== MINI-GAME TRIGGERS ==========
  function triggerMiniGame(s) {
    // Choose which mini-game based on current phase and randomness
    const available = ['asteroid_dodger'];
    if (s.currentPhase >= 3) available.push('gravity_slingshot');
    if (s.currentPhase >= 3) available.push('meteor_defense');
    if (s.currentPhase >= 4) available.push('constellation_connect');
    if (s.currentPhase >= 6) available.push('wormhole_runner');
    // Signal Decoder triggers from alien signals
    // Alien Language triggers from artifact finds
    // Black Hole Orbit triggers from visiting black hole in Phase 8

    const type = available[Math.floor(Math.random() * available.length)];

    const descriptions = {
      asteroid_dodger: 'Dodge asteroids for credits!',
      gravity_slingshot: 'Slingshot a probe for RP!',
      meteor_defense: 'Destroy the incoming meteor!',
      constellation_connect: 'Connect the stars!',
      wormhole_runner: 'Navigate the wormhole!'
    };

    // Show offer banner instead of auto-starting
    UI.showEventBanner({
      name: 'Mini-Game Available!',
      desc: descriptions[type] || 'A new challenge!',
      icon: '\uD83C\uDFAE',
      type: 'positive'
    });

    // Store pending mini-game for player to accept
    s._pendingMiniGame = type;
    setTimeout(() => {
      UI.hideEventBanner();
      // Auto-dismiss if not accepted within 30s
      if (s._pendingMiniGame === type) {
        s._pendingMiniGame = null;
      }
    }, 30000);
  }

  function acceptMiniGame() {
    const s = GameState.getState();
    if (!s._pendingMiniGame) return;
    const type = s._pendingMiniGame;
    s._pendingMiniGame = null;
    UI.hideEventBanner();
    MiniGames.startGame(type);
  }

  function triggerSignalDecoder() {
    if (MiniGames.isActive()) return;
    MiniGames.startGame('signal_decoder');
  }

  function triggerAlienLanguage() {
    if (MiniGames.isActive()) return;
    MiniGames.startGame('alien_language');
  }

  function triggerBlackHoleOrbit() {
    if (MiniGames.isActive()) return;
    MiniGames.startGame('black_hole_orbit');
  }

  function isAsteroidActive() { return asteroidActive; }
  function isArtifactVisible() { return artifactVisible; }

  return {
    processTick, tapRareAsteroid, collectArtifactFragment,
    isAsteroidActive, isArtifactVisible,
    acceptMiniGame, triggerSignalDecoder,
    triggerAlienLanguage, triggerBlackHoleOrbit
  };
})();
