/* =============================================
   DEEP SPACE INC. — CORE ENGINE
   Section 4-5: Game loop, tick, generators, tap
   ============================================= */
'use strict';

const Engine = (() => {
  let lastTickTime = 0;
  let tickInterval = null;
  let saveInterval = null;
  let autoTapAccum = 0;

  // ---------- 4.1 Game Tick (100ms / 10 ticks per sec) ----------

  function start() {
    lastTickTime = Date.now();
    tickInterval = setInterval(tick, 100);
    saveInterval = setInterval(() => State.save(), 30000);
  }

  function stop() {
    if (tickInterval) clearInterval(tickInterval);
    if (saveInterval) clearInterval(saveInterval);
    tickInterval = null;
    saveInterval = null;
  }

  function tick() {
    const now = Date.now();
    const dt = (now - lastTickTime) / 1000; // seconds (typically ~0.1)
    lastTickTime = now;
    const s = State.get();

    s.totalPlayTimeSeconds += dt;

    // 1. Recalculate all production rates
    recalcRates(s);

    // 2. Apply generator production × deltaTime
    if (s.creditsPerSecond > 0)  State.addCurrency('credits', s.creditsPerSecond * dt);
    if (s.rpPerSecond > 0)       State.addCurrency('rp', s.rpPerSecond * dt);
    if (s.orePerSecond > 0)      State.addCurrency('ore', s.orePerSecond * dt);
    if (s.rmPerSecond > 0)       State.addCurrency('rm', s.rmPerSecond * dt);
    if (s.sdPerSecond > 0)       State.addCurrency('sd', s.sdPerSecond * dt);

    // 3. Auto-tap
    if (s.autoTapPerSecond > 0) {
      autoTapAccum += s.autoTapPerSecond * dt;
      while (autoTapAccum >= 1) {
        autoTapAccum -= 1;
        doTap(true);
      }
    }

    // 4. Terraforming
    if (s.terraforming.marsPerSecond > 0 && s.terraforming.marsPercent < 100) {
      s.terraforming.marsPercent = Math.min(100, s.terraforming.marsPercent + s.terraforming.marsPerSecond * dt);
    }

    // 5. Update displayed numbers
    UI.updateTick();

    // 6. Check milestone triggers
    checkMilestones(s);
  }

  // ---------- 4.2 Rate Calculation ----------

  function recalcRates(s) {
    let cps = 0, rps = 0, ops = 0, rmps = 0, sdps = 0;

    // Sum all generator outputs × multipliers × cosmicDustMultiplier
    if (typeof GameData !== 'undefined' && GameData.GENERATORS) {
      for (const phaseKey in GameData.GENERATORS) {
        const gens = GameData.GENERATORS[phaseKey];
        for (const gen of gens) {
          const count = s.generators[gen.id] || 0;
          if (count <= 0) continue;
          const out = gen.output || {};
          const mult = s.cosmicDustMultiplier * s.globalCreditMultiplier;
          if (out.credits) cps += count * out.credits * mult;
          if (out.rp)      rps += count * out.rp * s.cosmicDustMultiplier * s.globalRPMultiplier;
          if (out.ore)     ops += count * out.ore * s.cosmicDustMultiplier * s.globalOreMultiplier;
          if (out.rm)      rmps += count * out.rm * s.cosmicDustMultiplier;
          if (out.sd)      sdps += count * out.sd * s.cosmicDustMultiplier;
        }
      }
    }

    s.creditsPerSecond = cps;
    s.rpPerSecond = rps;
    s.orePerSecond = ops;
    s.rmPerSecond = rmps;
    s.sdPerSecond = sdps;

    // 5.3 Tap value
    s.creditsPerTap = getBaseTapValue(s) * s.tapMultiplier * s.cosmicDustMultiplier;
  }

  // 5.3 Base tap value: Phase 1 = 1, later = 1% of CPS
  function getBaseTapValue(s) {
    if (s.currentPhase === 1 && s.creditsPerSecond <= 0) return 1;
    return Math.max(1, s.creditsPerSecond * 0.01);
  }

  // ---------- 5. Tap Mechanic ----------

  function doTap(isAuto) {
    const s = State.get();
    const amount = s.creditsPerTap;

    State.addCurrency('credits', amount);
    s.totalTaps++;

    // 5.2 Tap feedback — UI handles animation
    if (!isAuto) {
      UI.onTap(amount);
    } else {
      UI.onAutoTap(amount);
    }

    return amount;
  }

  // ---------- 4.3 Generator Purchase ----------

  function buyGenerator(genId, buyCount) {
    const s = State.get();
    const gen = findGenerator(genId);
    if (!gen) return false;

    const owned = s.generators[genId] || 0;
    const currency = gen.costCurrency || 'credits';
    const growth = gen.growth || 1.15;

    // Determine count and cost based on buy mode
    let count, totalCost;
    if (buyCount === 'max') {
      const result = Num.maxAffordable(gen.baseCost, growth, owned, State.getCurrency(currency));
      count = result.count;
      totalCost = result.totalCost;
    } else {
      count = parseInt(buyCount) || 1;
      totalCost = Num.costBulk(gen.baseCost, growth, owned, count);
    }

    if (count <= 0 || !State.canAfford(currency, totalCost)) return false;

    State.spendCurrency(currency, totalCost);
    s.generators[genId] = owned + count;

    recalcRates(s);
    UI.updateGenerators();
    UI.updateCurrencyBar();
    return true;
  }

  function findGenerator(genId) {
    if (typeof GameData === 'undefined' || !GameData.GENERATORS) return null;
    for (const key in GameData.GENERATORS) {
      for (const g of GameData.GENERATORS[key]) {
        if (g.id === genId) return g;
      }
    }
    return null;
  }

  function getNextCost(genId) {
    const s = State.get();
    const gen = findGenerator(genId);
    if (!gen) return 0;
    const owned = s.generators[genId] || 0;
    return Num.cost(gen.baseCost, gen.growth || 1.15, owned);
  }

  // ---------- Rocket Parts (Phase 1) ----------

  function buyRocketPart(partId) {
    const s = State.get();
    if (s.rocketParts[partId]) return false;
    if (typeof GameData === 'undefined') return false;

    const part = GameData.ROCKET_PARTS.find(p => p.id === partId);
    if (!part || s.credits < part.cost) return false;

    s.credits -= part.cost;
    s.rocketParts[partId] = true;

    // Check if all parts purchased → ready to launch
    if (Object.values(s.rocketParts).every(v => v)) {
      s._rocketReady = true;
    }

    UI.updateRocketAssembly();
    UI.updateCurrencyBar();
    return true;
  }

  function launchRocket() {
    const s = State.get();
    if (!Object.values(s.rocketParts).every(v => v)) return false;
    if (s.currentPhase >= 2) return false;

    s.currentPhase = 2;
    s.highestPhaseReached = Math.max(s.highestPhaseReached, 2);
    UI.playPhaseTransition(2);
    return true;
  }

  // ---------- Upgrades ----------

  function buyUpgrade(upgradeId) {
    const s = State.get();
    if (s.upgradesPurchased[upgradeId]) return false;
    if (typeof GameData === 'undefined') return false;

    let upgrade = null;
    for (const phase in GameData.UPGRADES) {
      const found = GameData.UPGRADES[phase].find(u => u.id === upgradeId);
      if (found) { upgrade = found; break; }
    }
    if (!upgrade) return false;

    const currency = upgrade.currency || 'credits';
    if (!State.canAfford(currency, upgrade.cost)) return false;

    State.spendCurrency(currency, upgrade.cost);
    s.upgradesPurchased[upgradeId] = true;

    applyEffect(upgrade.effect, s);
    recalcRates(s);
    UI.updateUpgrades();
    UI.updateCurrencyBar();
    return true;
  }

  function applyEffect(effect, s) {
    if (!effect) return;
    if (effect.tapMultiplier) s.tapMultiplier *= effect.tapMultiplier;
    if (effect.globalCreditMultiplier) s.globalCreditMultiplier *= effect.globalCreditMultiplier;
    if (effect.globalRPMultiplier) s.globalRPMultiplier *= effect.globalRPMultiplier;
    if (effect.globalOreMultiplier) s.globalOreMultiplier *= effect.globalOreMultiplier;
    if (effect.autoTap) s.autoTapPerSecond = Math.max(s.autoTapPerSecond, effect.autoTap);
  }

  // ---------- Milestones ----------

  function checkMilestones(s) {
    // Phase unlock checks, achievements, etc. — expanded in later parts
  }

  return {
    start, stop, tick, doTap,
    buyGenerator, findGenerator, getNextCost,
    buyRocketPart, launchRocket,
    buyUpgrade, applyEffect,
    recalcRates
  };
})();
