// engine.js — Core game loop, production calculation, purchases
'use strict';

const Engine = (() => {
  let lastTickTime = Date.now();
  let tickInterval = null;
  let saveInterval = null;
  let autoTapAccum = 0;

  function start() {
    lastTickTime = Date.now();
    tickInterval = setInterval(tick, 100); // 10 ticks/sec
    const s = GameState.getState();
    saveInterval = setInterval(() => GameState.save(), (s.settings.autoSaveInterval || 30) * 1000);
  }

  function stop() {
    if (tickInterval) clearInterval(tickInterval);
    if (saveInterval) clearInterval(saveInterval);
  }

  function resetSaveInterval() {
    if (saveInterval) clearInterval(saveInterval);
    const s = GameState.getState();
    saveInterval = setInterval(() => GameState.save(), (s.settings.autoSaveInterval || 30) * 1000);
  }

  function tick() {
    const now = Date.now();
    const deltaTime = (now - lastTickTime) / 1000;
    lastTickTime = now;
    const s = GameState.getState();

    s.totalPlayTimeSeconds += deltaTime;

    // Calculate production rates
    calculateRates(s);

    // Apply production
    let speedMult = GameState.getCDSpeedMultiplier();

    // Temp speed from anomaly bonus
    if (s._tempSpeedMult > 1 && Date.now() < s._tempSpeedEndTime) {
      speedMult *= s._tempSpeedMult;
    } else if (s._tempSpeedMult > 1 && Date.now() >= s._tempSpeedEndTime) {
      s._tempSpeedMult = 1;
    }

    const dt = deltaTime * speedMult;

    if (s.creditsPerSecond > 0) {
      GameState.addCurrency('credits', s.creditsPerSecond * dt);
    }
    if (s.rpPerSecond > 0) {
      GameState.addCurrency('rp', s.rpPerSecond * dt);
    }
    if (s.orePerSecond > 0) {
      GameState.addCurrency('ore', s.orePerSecond * dt);
    }
    if (s.rmPerSecond > 0) {
      GameState.addCurrency('rm', s.rmPerSecond * dt);
    }
    if (s.sdPerSecond > 0) {
      GameState.addCurrency('sd', s.sdPerSecond * dt);
    }

    // Terraforming
    if (s.currentPhase >= 4 && s.terraforming.marsPerSecond > 0 && s.terraforming.marsPercent < 100) {
      s.terraforming.marsPercent = Math.min(100, s.terraforming.marsPercent + s.terraforming.marsPerSecond * dt);
      checkTerraformMilestones(s);
    }

    // Auto-tap
    if (s.autoTapPerSecond > 0) {
      autoTapAccum += s.autoTapPerSecond * deltaTime;
      while (autoTapAccum >= 1) {
        autoTapAccum -= 1;
        doTap(s, true);
      }
    }

    // Passive CD from CD shop
    if (s.cdShopPurchased['cd_passive']) {
      GameState.addCurrency('cosmicDust', (1 / 3600) * deltaTime);
    }

    // Auto-crew generation from Phase 7 Haven generators
    if (s.currentPhase >= 7 && s.crew.unlocked) {
      processAutoCrewGeneration(s, deltaTime);
    }

    // Passive SD from Nebula star systems
    if (s._passiveSD > 0) {
      GameState.addCurrency('sd', s._passiveSD * dt);
    }

    // Passive SD from Nebula star systems
    if (s._passiveSD > 0) {
      GameState.addCurrency('sd', s._passiveSD * dt);
    }

    // Auto-crew generation from Phase 7 Haven generators
    if (s.currentPhase >= 7 && s.crew.unlocked) {
      processAutoCrewGeneration(s, deltaTime);
    }

    // Alien signal check (Phase 6 Europa)
    if (s.currentPhase >= 6) {
      checkAlienSignals(s, deltaTime);
    }

    // Io degradation
    if (s.currentPhase >= 6) {
      processIoDegradation(s, deltaTime);
    }

    // Expansion systems
    Expansion.update(s, deltaTime);

    // Events
    GameEvents.processTick(deltaTime);

    // Achievements
    checkAchievements(s);

    // No-tap tracking for secret achievement
    if (s.stats.lastTapTime > 0) {
      s.stats.noTapDuration = (now - s.stats.lastTapTime) / 1000;
      if (s.stats.noTapDuration >= 86400 && !s.achievements['ach_secret_patience']) {
        unlockAchievement('ach_secret_patience');
        GameState.addCurrency('credits', s.creditsPerSecond * 3600);
      }
    }

    // Adaptive audio update
    if (typeof AdaptiveAudio !== 'undefined') AdaptiveAudio.update(deltaTime);

    // UI juice update (screen shake, etc.)
    if (typeof Juice !== 'undefined') Juice.update(deltaTime);

    // Update UI
    UI.updateTick();
  }

  function calculateRates(s) {
    let totalCredits = 0;
    let totalRP = 0;
    let totalOre = 0;
    let totalRM = 0;
    let totalSD = 0;
    let totalTerraform = 0;

    const cdMult = s.cosmicDustMultiplier;
    const callistoMult = 1 + s.callistoBoost;

    // Expansion multipliers
    const boosterCreditMult = Expansion.getBoosterCreditMult(s);
    const boosterRPMult = Expansion.getBoosterRPMult(s);
    const boosterOreMult = Expansion.getBoosterOreMult(s);
    const boosterTerraformMult = Expansion.getBoosterTerraformMult(s);
    const weatherCreditMult = Expansion.getWeatherCreditMult(s);
    const weatherRPMult = Expansion.getWeatherRPMult(s);
    const weatherTerraformMult = Expansion.getWeatherTerraformMult(s);
    const idleStreakMult = Expansion.IdleStreak.getMultiplier(s);

    // Process all generators across all unlocked phases
    const allPhaseKeys = getAllActiveGeneratorKeys(s);

    for (const phaseKey of allPhaseKeys) {
      const gens = GameData.GENERATORS[phaseKey];
      if (!gens) continue;
      const phaseMult = s.phaseMultipliers[phaseKey] || 1;

      for (const gen of gens) {
        const count = s.generators[gen.id] || 0;
        if (count <= 0) continue;

        const genMult = s.generatorMultipliers[gen.id] || 1;

        // Io efficiency
        let ioEff = 1;
        if (gen.degrades && s.ioEfficiency[gen.id] !== undefined) {
          ioEff = s.ioEfficiency[gen.id];
        }

        // Expansion per-generator multipliers
        const milestoneMult = Expansion.Milestones.getCumulativeMultiplier(s, gen.id);
        const goldenRushMult = Expansion.GoldenRush.getMultiplier(s, gen.id);

        const crewMult = 1 + getCrewBonus();
        const totalMult = genMult * phaseMult * cdMult * callistoMult * ioEff * crewMult * milestoneMult * goldenRushMult * idleStreakMult;

        if (gen.output.credits) totalCredits += count * gen.output.credits * totalMult * s.globalCreditMultiplier * s.eventCreditMultiplier * boosterCreditMult * weatherCreditMult;
        if (gen.output.rp) totalRP += count * gen.output.rp * totalMult * s.globalRPMultiplier * s.eventRPMultiplier * boosterRPMult * weatherRPMult;
        if (gen.output.ore) totalOre += count * gen.output.ore * totalMult * s.globalOreMultiplier * boosterOreMult;
        if (gen.output.rm) totalRM += count * gen.output.rm * totalMult;
        if (gen.output.sd) totalSD += count * gen.output.sd * totalMult;

        if (gen.terraform) {
          totalTerraform += count * gen.terraform * (s.terraformMultiplier || 1) * cdMult * boosterTerraformMult * weatherTerraformMult;
        }

        // Callisto global boost
        if (gen.globalBoost) {
          // recalc callisto boost from owned generators
        }
      }
    }

    // Recalculate Callisto boost
    let newCallistoBoost = 0;
    const callistoGens = GameData.GENERATORS['6_callisto'];
    if (callistoGens) {
      for (const gen of callistoGens) {
        const count = s.generators[gen.id] || 0;
        if (count > 0 && gen.globalBoost) {
          newCallistoBoost += gen.globalBoost * count;
        }
      }
    }
    s.callistoBoost = newCallistoBoost;

    s.creditsPerSecond = totalCredits;
    s.rpPerSecond = totalRP;
    s.orePerSecond = totalOre;
    s.rmPerSecond = totalRM;
    s.sdPerSecond = totalSD;
    s.terraforming.marsPerSecond = totalTerraform;

    // Update tap value (expansion multipliers applied in doTap)
    s.creditsPerTap = Math.max(1, getBaseTapValue(s)) * s.tapMultiplier * s.cosmicDustMultiplier * s.eventTapMultiplier * Expansion.getBoosterTapMult(s) * Expansion.getWeatherTapMult(s);
  }

  function getBaseTapValue(s) {
    if (s.currentPhase === 1) return 1;
    return Math.max(1, s.creditsPerSecond * 0.01);
  }

  function getAllActiveGeneratorKeys(s) {
    const keys = [];
    for (let p = 1; p <= Math.min(s.highestPhaseReached, 8); p++) {
      if (p === 6) {
        keys.push('6_orbit', '6_io', '6_europa', '6_ganymede', '6_callisto');
      } else if (p === 7) {
        keys.push('7_haven', '7_ferrum', '7_nebula');
      } else {
        keys.push(String(p));
      }
    }
    return keys;
  }

  function getActiveGeneratorKeysForPhase(phase) {
    if (phase === 6) return ['6_orbit', '6_io', '6_europa', '6_ganymede', '6_callisto'];
    if (phase === 7) return ['7_haven', '7_ferrum', '7_nebula'];
    return [String(phase)];
  }

  function doTap(s, isAuto = false) {
    let amount = s.creditsPerTap;

    // Lucky tap
    if (s.luckyTapEnabled && Math.random() < 0.1) {
      amount *= 10;
    }

    // Expansion: combo + critical tap
    const tapResult = Expansion.onTap(s, isAuto);
    amount *= tapResult.comboMult * tapResult.mult;

    GameState.addCurrency('credits', amount);
    if (!isAuto) {
      s.totalTaps++;
      s.stats.lastTapTime = Date.now();
      s.stats.noTapDuration = 0;

      // Contract earn progress
      Expansion.Contracts.addProgress(s, 'earn', amount);
    }

    // Moon phase: also earn ore from tapping
    if (s.currentPhase >= 3) {
      const orePerTap = s.tapMultiplier * s.cosmicDustMultiplier * s.globalOreMultiplier;
      GameState.addCurrency('ore', orePerTap);
    }

    if (!isAuto) {
      UI.showFloatingNumber(amount, tapResult);

      // Audio & haptic feedback
      if (typeof AdaptiveAudio !== 'undefined') {
        AdaptiveAudio.onTap();
        if (tapResult.type === 'super') {
          AdaptiveAudio.playSuperCriticalSound();
        } else if (tapResult.type === 'critical') {
          AdaptiveAudio.playCriticalSound();
        } else {
          AdaptiveAudio.playTapSound(s.combo ? s.combo.current : 0);
        }
      }
      if (typeof Juice !== 'undefined') {
        if (tapResult.type === 'super') {
          Juice.Haptics.heavy();
          Juice.ScreenShake.superCritical();
          Juice.ScreenFlash.superCritical();
        } else if (tapResult.type === 'critical') {
          Juice.Haptics.medium();
        } else {
          Juice.Haptics.light();
        }
      }
    }

    return amount;
  }

  function buyGenerator(genId) {
    const s = GameState.getState();
    const gen = findGenerator(genId);
    if (!gen) return false;

    const buyAmount = UI.getBuyAmount();
    const owned = s.generators[genId] || 0;
    const currency = gen.costCurrency || 'credits';

    let count, totalCost;
    if (buyAmount === 'max') {
      const result = NumberFormatter.maxAffordable(gen.baseCost, gen.growth, owned, GameState.getCurrency(currency));
      count = result.count;
      totalCost = result.totalCost;
    } else {
      count = buyAmount;
      totalCost = NumberFormatter.bulkCost(gen.baseCost, gen.growth, owned, count);
    }

    if (count <= 0) return false;
    if (!GameState.canAfford(currency, totalCost)) return false;

    GameState.spendCurrency(currency, totalCost);
    s.generators[genId] = owned + count;
    s.stats.totalGeneratorsEverPurchased += count;

    // Init Io efficiency if needed
    if (gen.degrades && s.ioEfficiency[genId] === undefined) {
      s.ioEfficiency[genId] = 1.0;
    }

    // Crew capacity from generators
    if (gen.crewCapacity) {
      s.crew.maxCapacity += gen.crewCapacity * count;
    }

    // Check for first generator achievement
    if (!s.achievements['ach_first_gen']) {
      unlockAchievement('ach_first_gen');
    }

    // Tutorial progression
    if (s.tutorialStep === 1) {
      s.tutorialStep = 2;
    }

    // Expansion: milestones, purchase streak, contracts
    Expansion.onGeneratorBuy(s, genId, count);

    // Audio & juice on purchase
    if (typeof AdaptiveAudio !== 'undefined') {
      const name = gen.name.toLowerCase();
      let soundType = 'machine';
      if (name.includes('worker') || name.includes('kid') || name.includes('team')) soundType = 'worker';
      else if (name.includes('ship') || name.includes('shuttle') || name.includes('tug')) soundType = 'ship';
      else if (name.includes('base') || name.includes('hub') || name.includes('station')) soundType = 'building';
      else if (name.includes('ai') || name.includes('quantum') || name.includes('computer')) soundType = 'hightech';
      else if (name.includes('alien') || name.includes('artifact') || name.includes('ansible')) soundType = 'alien';
      AdaptiveAudio.playPurchaseSound(soundType);
    }
    if (typeof Juice !== 'undefined') {
      Juice.Haptics.success();
      Juice.ScreenShake.purchase();
      Juice.GenAnims.popCount(genId);
    }

    calculateRates(s);
    UI.updateGenerators();
    UI.updateCurrencyBar();
    return true;
  }

  function findGenerator(genId) {
    for (const key in GameData.GENERATORS) {
      const gens = GameData.GENERATORS[key];
      for (const g of gens) {
        if (g.id === genId) return g;
      }
    }
    return null;
  }

  function buyRocketPart(partId) {
    const s = GameState.getState();
    if (s.rocketParts[partId]) return false;

    const part = GameData.ROCKET_PARTS.find(p => p.id === partId);
    if (!part) return false;

    let cost = part.cost;
    if (s.cdShopPurchased['cd_quick']) cost *= 0.5;

    if (s.credits < cost) return false;
    s.credits -= cost;
    s.rocketParts[partId] = true;

    // Log trigger: first part purchased
    if (!s.captainsLog.includes('log2')) {
      addLogEntry('log2');
    }

    // Check if all parts purchased
    const allParts = Object.values(s.rocketParts).every(v => v);
    if (allParts) {
      addLogEntry('log3');
      if (!s.achievements['ach_all_parts']) {
        unlockAchievement('ach_all_parts');
      }
      if (s.cdShopPurchased['cd_autolaunch']) {
        launchRocket();
      }
    }

    if (s.tutorialStep === 2) {
      s.tutorialStep = 3;
    }

    UI.updateRocketAssembly();
    UI.updateCurrencyBar();
    return true;
  }

  function launchRocket() {
    const s = GameState.getState();
    if (s.rocketLaunched) return;
    if (!Object.values(s.rocketParts).every(v => v)) return;

    s.rocketLaunched = true;
    s.currentPhase = 2;
    s.highestPhaseReached = Math.max(s.highestPhaseReached, 2);

    addLogEntry('log4');
    addLogEntry('log5');
    unlockAchievement('ach_launch');

    s.tutorialStep = 5;
    // Tutorial step 5 will show RP intro, then mark complete

    UI.playPhaseTransition(2);
  }

  function buyUpgrade(upgradeId) {
    const s = GameState.getState();
    if (s.upgradesPurchased[upgradeId]) return false;

    let upgrade = null;
    for (const phase in GameData.UPGRADES) {
      const found = GameData.UPGRADES[phase].find(u => u.id === upgradeId);
      if (found) { upgrade = found; break; }
    }
    if (!upgrade) return false;

    // Check requirements
    if (upgrade.req) {
      if (upgrade.req.generator) {
        if ((s.generators[upgrade.req.generator] || 0) < upgrade.req.count) return false;
      }
      if (upgrade.req.totalTaps && s.totalTaps < upgrade.req.totalTaps) return false;
      if (upgrade.req.allGeneratorsPhase) {
        const phaseGens = GameData.GENERATORS[upgrade.req.allGeneratorsPhase];
        if (phaseGens && !phaseGens.every(g => (s.generators[g.id] || 0) > 0)) return false;
      }
    }

    // Check cost
    if (!GameState.canAfford(upgrade.currency, upgrade.cost)) return false;
    if (upgrade.costSecondary) {
      for (const cur in upgrade.costSecondary) {
        if (!GameState.canAfford(cur, upgrade.costSecondary[cur])) return false;
      }
    }

    // Pay
    GameState.spendCurrency(upgrade.currency, upgrade.cost);
    if (upgrade.costSecondary) {
      for (const cur in upgrade.costSecondary) {
        GameState.spendCurrency(cur, upgrade.costSecondary[cur]);
      }
    }

    s.upgradesPurchased[upgradeId] = true;
    applyUpgradeEffect(upgrade.effect, s);

    UI.updateUpgrades();
    UI.updateCurrencyBar();
    calculateRates(s);
    return true;
  }

  function applyUpgradeEffect(effect, s) {
    if (!effect) return;

    if (effect.tapMultiplier) s.tapMultiplier *= effect.tapMultiplier;
    if (effect.generatorMultiplier) {
      const gm = effect.generatorMultiplier;
      s.generatorMultipliers[gm.target] = (s.generatorMultipliers[gm.target] || 1) * gm.mult;
    }
    if (effect.phaseMultiplier) {
      const pm = effect.phaseMultiplier;
      s.phaseMultipliers[pm.phase] = (s.phaseMultipliers[pm.phase] || 1) * pm.mult;
    }
    if (effect.globalCreditMultiplier) s.globalCreditMultiplier *= effect.globalCreditMultiplier;
    if (effect.globalRPMultiplier) s.globalRPMultiplier *= effect.globalRPMultiplier;
    if (effect.globalOreMultiplier) s.globalOreMultiplier *= effect.globalOreMultiplier;
    if (effect.autoTap) s.autoTapPerSecond = Math.max(s.autoTapPerSecond, effect.autoTap);
    if (effect.luckyTap) s.luckyTapEnabled = true;
    if (effect.terraformMultiplier) s.terraformMultiplier *= effect.terraformMultiplier;
    if (effect.asChanceMultiplier) {
      s._asChanceMult = (s._asChanceMult || 1) * effect.asChanceMultiplier;
    }

    if (effect.unlockPhase) {
      const phase = effect.unlockPhase;
      s.currentPhase = phase;
      s.highestPhaseReached = Math.max(s.highestPhaseReached, phase);
      triggerPhaseUnlock(phase);
    }

    if (effect.unlockCrew) {
      s.crew.unlocked = true;
      UI.showTab('crew');
    }
  }

  function triggerPhaseUnlock(phase) {
    const s = GameState.getState();
    const logMap = { 3: 'log6', 4: 'log8', 5: 'log11', 6: 'log13', 7: 'log17', 8: 'log19' };
    const achMap = { 3: 'ach_moon', 4: 'ach_mars', 5: 'ach_belt', 6: 'ach_jupiter', 7: 'ach_interstellar', 8: 'ach_galaxy' };

    if (logMap[phase]) addLogEntry(logMap[phase]);
    if (achMap[phase]) unlockAchievement(achMap[phase]);

    if (phase === 5) {
      s.fleet.unlocked = true;
      UI.showTab('fleet');
    }
    if (phase === 6) {
      s.currentSubZone = '6_orbit';
    }

    UI.playPhaseTransition(phase);
  }

  function buyResearch(researchId) {
    const s = GameState.getState();
    if (s.researchPurchased[researchId]) return false;

    const res = GameData.RESEARCH.find(r => r.id === researchId);
    if (!res) return false;

    if (res.req && !s.researchPurchased[res.req]) return false;
    if (!GameState.canAfford('rp', res.cost)) return false;

    GameState.spendCurrency('rp', res.cost);
    s.researchPurchased[researchId] = true;
    applyUpgradeEffect(res.effect, s);

    UI.updateResearch();
    calculateRates(s);
    return true;
  }

  function buyCDShopItem(itemId) {
    const s = GameState.getState();
    if (s.cdShopPurchased[itemId]) return false;

    const item = GameData.CD_SHOP.find(i => i.id === itemId);
    if (!item) return false;

    if (item.req && !s.cdShopPurchased[item.req]) return false;
    if (!GameState.canAfford('cosmicDust', item.cost)) return false;

    GameState.spendCurrency('cosmicDust', item.cost);
    s.cdShopPurchased[itemId] = true;

    // Apply permanent effects immediately
    GameState.applyPermanentUpgrades();
    if (item.effect.unlockMultiverse) {
      s.multiverse.unlocked = true;
      s.currentPhase = 9;
      s.highestPhaseReached = Math.max(s.highestPhaseReached, 9);
    }

    UI.updatePrestigePanel();
    return true;
  }

  function hireCrew() {
    const s = GameState.getState();
    if (!s.crew.unlocked) return false;
    if (s.crew.totalAstronauts >= s.crew.maxCapacity) return false;

    const cost = 100 * Math.pow(1.2, s.crew.totalAstronauts);
    if (!GameState.canAfford('ore', cost)) return false;

    GameState.spendCurrency('ore', cost);
    const names = GameData.ASTRONAUT_NAMES;
    const name = names[Math.floor(Math.random() * names.length)];
    s.crew.astronauts.push({
      id: Date.now(),
      name: name,
      tier: 0,
      bonus: GameData.CREW_TIERS[0].bonus
    });
    s.crew.totalAstronauts++;
    s.stats.totalCrewEverHired++;

    if (s.crew.totalAstronauts === 1) {
      addLogEntry('log7');
    }

    UI.updateCrew();
    return true;
  }

  function upgradeCrewMember(crewIndex) {
    const s = GameState.getState();
    const astro = s.crew.astronauts[crewIndex];
    if (!astro || astro.tier >= 4) return false;

    const nextTier = GameData.CREW_TIERS[astro.tier + 1];
    if (!nextTier.upgradeCost) return false;

    if (!GameState.canAfford('ore', nextTier.upgradeCost.ore)) return false;
    if (!GameState.canAfford('rp', nextTier.upgradeCost.rp)) return false;

    GameState.spendCurrency('ore', nextTier.upgradeCost.ore);
    GameState.spendCurrency('rp', nextTier.upgradeCost.rp);
    astro.tier++;
    astro.bonus = nextTier.bonus;

    UI.updateCrew();
    return true;
  }

  function upgradeAllCrew() {
    const s = GameState.getState();
    let upgraded = 0;
    for (let i = 0; i < s.crew.astronauts.length; i++) {
      if (upgradeCrewMember(i)) upgraded++;
    }
    return upgraded;
  }

  function getCrewBonus() {
    const s = GameState.getState();
    let totalBonus = 0;
    for (const astro of s.crew.astronauts) {
      totalBonus += astro.bonus;
    }

    // Apply crewBonusMultiplier from Phase 7 Haven generators (Dyson Tree Forest, World Mind)
    const havenGens = GameData.GENERATORS['7_haven'];
    if (havenGens) {
      let bestMult = 1;
      for (const gen of havenGens) {
        const count = s.generators[gen.id] || 0;
        if (count > 0 && gen.crewBonusMultiplier && gen.crewBonusMultiplier > bestMult) {
          bestMult = gen.crewBonusMultiplier;
        }
      }
      totalBonus *= bestMult;
    }

    return totalBonus; // This is the multiplier added to generators
  }

  function processAutoCrewGeneration(s, dt) {
    const havenGens = GameData.GENERATORS['7_haven'];
    if (!havenGens) return;

    let totalCrewPerHour = 0;
    let startTier = 0;
    for (const gen of havenGens) {
      const count = s.generators[gen.id] || 0;
      if (count <= 0) continue;
      if (gen.autoCrewPerHour) {
        totalCrewPerHour += gen.autoCrewPerHour * count;
      }
      if (gen.crewStartTier && gen.crewStartTier > startTier) {
        startTier = gen.crewStartTier;
      }
    }

    if (totalCrewPerHour <= 0) return;
    if (s.crew.totalAstronauts >= s.crew.maxCapacity) return;

    // Accumulate fractional crew over time
    s._autoCrewAccum = (s._autoCrewAccum || 0) + (totalCrewPerHour / 3600) * dt;
    while (s._autoCrewAccum >= 1 && s.crew.totalAstronauts < s.crew.maxCapacity) {
      s._autoCrewAccum -= 1;
      const names = GameData.ASTRONAUT_NAMES;
      const name = names[Math.floor(Math.random() * names.length)];
      const tier = Math.min(startTier, GameData.CREW_TIERS.length - 1);
      s.crew.astronauts.push({
        id: Date.now() + Math.random(),
        name: name,
        tier: tier,
        bonus: GameData.CREW_TIERS[tier].bonus
      });
      s.crew.totalAstronauts++;
      s.stats.totalCrewEverHired++;
    }
  }

  function checkAlienSignals(s, dt) {
    if (s.currentPhase < 6) return;
    s.lastASCheckTime = (s.lastASCheckTime || 0) + dt;
    if (s.lastASCheckTime < 60) return; // Check every minute
    s.lastASCheckTime = 0;

    const europaGens = GameData.GENERATORS['6_europa'];
    if (!europaGens) return;

    const asChanceMult = s._asChanceMult || 1;
    for (const gen of europaGens) {
      const count = s.generators[gen.id] || 0;
      if (count <= 0 || !gen.asChance) continue;

      const chance = gen.asChance * asChanceMult * count;
      if (Math.random() < chance) {
        GameState.addCurrency('as', 1);
        s.stats.totalAlienSignalsDecoded++;
        UI.showAlienSignalPopup();

        // 25% chance to trigger Signal Decoder mini-game
        if (Math.random() < 0.25 && !MiniGames.isActive()) {
          setTimeout(() => GameEvents.triggerSignalDecoder(), 2000);
        }

        if (s.alienSignals === 1) {
          addLogEntry('log15');
        }
        if (s.alienSignals >= 10 && !s.captainsLog.includes('log16')) {
          addLogEntry('log16');
        }
        break; // Only one signal per check
      }
    }
  }

  function processIoDegradation(s, dt) {
    const ioGens = GameData.GENERATORS['6_io'];
    if (!ioGens) return;
    for (const gen of ioGens) {
      if (!gen.degrades) continue;
      const count = s.generators[gen.id] || 0;
      if (count <= 0) continue;
      if (s.ioEfficiency[gen.id] === undefined) s.ioEfficiency[gen.id] = 1.0;

      let rate = gen.degradeRate;
      if (s.upgradesPurchased['u6_1']) rate *= 0.5;

      s.ioEfficiency[gen.id] = Math.max(0, s.ioEfficiency[gen.id] - rate * (dt / 60));
    }
  }

  function repairIoGenerator(genId) {
    const s = GameState.getState();
    const gen = findGenerator(genId);
    if (!gen || !gen.degrades) return false;

    const repairCost = gen.baseCost * 0.1;
    if (!GameState.canAfford('ore', repairCost)) return false;

    GameState.spendCurrency('ore', repairCost);
    s.ioEfficiency[genId] = 1.0;
    UI.updateGenerators();
    return true;
  }

  function checkTerraformMilestones(s) {
    if (!GameData.TERRAFORM_MILESTONES) return;
    const pct = s.terraforming.marsPercent;
    for (const milestone of GameData.TERRAFORM_MILESTONES) {
      const flagKey = '_terraMile' + milestone.percent;
      if (pct >= milestone.percent && !s[flagKey]) {
        s[flagKey] = true;
        // Apply milestone effect
        const eff = milestone.effect;
        if (eff.phaseMultiplier) {
          const pm = eff.phaseMultiplier;
          s.phaseMultipliers[pm.phase] = (s.phaseMultipliers[pm.phase] || 1) * pm.mult;
        }
        if (eff.globalRPMultiplier) s.globalRPMultiplier *= eff.globalRPMultiplier;
        if (eff.globalOreMultiplier) s.globalOreMultiplier *= eff.globalOreMultiplier;
        if (eff.globalCreditMultiplier) s.globalCreditMultiplier *= eff.globalCreditMultiplier;
        if (milestone.logEntry) addLogEntry(milestone.logEntry);
      }
    }
  }

  function unlockAchievement(achId) {
    const s = GameState.getState();
    if (s.achievements[achId]) return;

    const ach = GameData.ACHIEVEMENTS.find(a => a.id === achId);
    if (!ach) return;

    s.achievements[achId] = { unlocked: true, timestamp: Date.now() };

    // Grant reward
    if (ach.reward) {
      for (const cur in ach.reward) {
        if (cur === 'special') continue;
        GameState.addCurrency(cur, ach.reward[cur]);
      }
    }

    UI.showAchievementBanner(ach);

    // Juice: confetti, sound, haptic
    if (typeof AdaptiveAudio !== 'undefined') AdaptiveAudio.playAchievementSound();
    if (typeof Juice !== 'undefined') {
      Juice.Haptics.achievement();
      Juice.ScreenFlash.achievement();
      Juice.Confetti.achievement();
    }
  }

  function checkAchievements(s) {
    for (const ach of GameData.ACHIEVEMENTS) {
      if (s.achievements[ach.id]) continue;
      if (ach.check && ach.check(s)) {
        unlockAchievement(ach.id);
      }
    }
  }

  function addLogEntry(logId) {
    const s = GameState.getState();
    if (!s.captainsLog.includes(logId)) {
      s.captainsLog.push(logId);
    }
  }

  function buyStarSystem(systemIndex) {
    const s = GameState.getState();
    let cost = getStarSystemCost(systemIndex);

    // Anomaly wormhole discount
    if (s._nextSystemDiscount) {
      cost *= (1 - s._nextSystemDiscount);
      s._nextSystemDiscount = 0;
    }

    if (!GameState.canAfford('sd', cost)) return false;

    GameState.spendCurrency('sd', cost);
    s.starSystems.totalSystems++;

    // Roll for system type
    const systemType = rollStarSystemType(s);
    const systemData = {
      id: 'system_' + systemIndex,
      type: systemType.type,
      name: systemType.name
    };
    s.starSystems.colonized.push(systemData);
    s.stats.totalStarSystemsColonized++;

    // Apply system type effects
    applyStarSystemEffect(systemType, s);

    // Check for special system types
    if (systemType.logEntry) {
      addLogEntry(systemType.logEntry);
    }

    UI.updateGalaxyMap();
    return true;
  }

  function rollStarSystemType(s) {
    const totalSystems = s.starSystems.totalSystems;

    // Check special systems first (unlock at certain thresholds)
    const specials = GameData.SPECIAL_STAR_SYSTEMS;
    for (const sp of specials) {
      if (totalSystems >= sp.minSystems && Math.random() < sp.rarity) {
        return sp;
      }
    }

    // Normal system types - weighted random
    const types = GameData.STAR_SYSTEM_TYPES;
    const roll = Math.random();
    let cumulative = 0;
    for (const t of types) {
      cumulative += t.rarity;
      if (roll < cumulative) return t;
    }
    return types[0]; // fallback
  }

  function applyStarSystemEffect(systemType, s) {
    // Special star systems
    if (systemType.effect) {
      if (systemType.effect.oneTimeCredits) {
        GameState.addCurrency('credits', systemType.effect.oneTimeCredits);
      }
      if (systemType.effect.oneTimeRP) {
        GameState.addCurrency('rp', systemType.effect.oneTimeRP);
      }
      // Black Hole: permanent offline earnings multiplier (×10 multiplicative per spec)
      if (systemType.effect.offlineMultiplierBonus) {
        s.offlineEarningsMultiplier *= systemType.effect.offlineMultiplierBonus;
      }
      // Nebula: passive SD/sec
      if (systemType.effect.passiveSD) {
        s._passiveSD = (s._passiveSD || 0) + systemType.effect.passiveSD;
      }
      // Galactic Core: all production multiplier
      if (systemType.effect.allProductionMult) {
        s.globalCreditMultiplier *= systemType.effect.allProductionMult;
        s.globalRPMultiplier *= systemType.effect.allProductionMult;
        s.globalOreMultiplier *= systemType.effect.allProductionMult;
      }
    }

    // Anomaly system — roll a random anomaly bonus
    if (systemType.type === 'anomaly') {
      applyAnomalyBonus(s);
    }
  }

  function applyAnomalyBonus(s) {
    const bonuses = GameData.ANOMALY_BONUSES;
    const bonus = bonuses[Math.floor(Math.random() * bonuses.length)];

    if (bonus.effect.skipProduction) {
      GameState.addCurrency('credits', s.creditsPerSecond * bonus.effect.skipProduction);
      GameState.addCurrency('rp', s.rpPerSecond * bonus.effect.skipProduction);
      GameState.addCurrency('ore', s.orePerSecond * bonus.effect.skipProduction);
    }
    if (bonus.effect.permanentCreditMult) {
      s.globalCreditMultiplier *= bonus.effect.permanentCreditMult;
    }
    if (bonus.effect.permanentSystemCostReduction) {
      s._permanentSystemDiscount = (s._permanentSystemDiscount || 0) + bonus.effect.permanentSystemCostReduction;
    }
    if (bonus.effect.prestigeRewardMult) {
      s._prestigeRewardMult = (s._prestigeRewardMult || 1) * bonus.effect.prestigeRewardMult;
    }
    if (bonus.effect.tempSpeedMult) {
      s._tempSpeedMult = bonus.effect.tempSpeedMult;
      s._tempSpeedEndTime = Date.now() + bonus.effect.duration * 1000;
    }

    UI.showEventBanner({
      name: 'Anomaly: ' + bonus.name,
      desc: bonus.desc,
      icon: '\uD83C\uDF00',
      type: 'positive'
    });
    setTimeout(() => UI.hideEventBanner(), 4000);
  }

  function getStarSystemCost(index) {
    if (index <= 1) return 0;
    if (index === 2) return 25000;
    if (index === 3) return 75000;
    if (index === 4) return 200000;
    if (index === 5) return 500000;
    let cost = 500000;
    for (let i = 6; i <= index; i++) {
      if (i <= 10) cost *= 2.5;
      else if (i <= 20) cost *= 3.0;
      else cost *= 3.5;
    }
    // Apply permanent system cost discount from anomaly wormholes
    const s = GameState.getState();
    if (s._permanentSystemDiscount) {
      cost *= (1 - Math.min(0.9, s._permanentSystemDiscount)); // cap at 90%
    }
    return cost;
  }

  function claimDailyReward() {
    const s = GameState.getState();
    const today = new Date().toDateString();
    if (s.dailyReward.lastClaimDate === today) return null;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (s.dailyReward.lastClaimDate === yesterday) {
      s.dailyReward.currentStreak++;
    } else {
      s.dailyReward.currentStreak = 1;
    }
    s.dailyReward.lastClaimDate = today;
    s.dailyReward.longestStreak = Math.max(s.dailyReward.longestStreak, s.dailyReward.currentStreak);

    const dayInCycle = ((s.dailyReward.currentStreak - 1) % 7);
    const reward = GameData.DAILY_REWARDS[dayInCycle];
    const cycleCount = Math.floor((s.dailyReward.currentStreak - 1) / 7);
    const multiplier = Math.min(5, 1 + cycleCount * 0.5);

    let rewardAmount = 0;
    if (reward.type === 'credits') {
      rewardAmount = s.creditsPerSecond * reward.amount * multiplier;
      GameState.addCurrency('credits', rewardAmount);
    } else if (reward.type === 'rp') {
      rewardAmount = s.rpPerSecond * reward.amount * multiplier;
      GameState.addCurrency('rp', rewardAmount);
    } else if (reward.type === 'ore') {
      rewardAmount = s.orePerSecond * reward.amount * multiplier;
      GameState.addCurrency('ore', rewardAmount);
    } else if (reward.type === 'cosmicDust') {
      rewardAmount = reward.amount * multiplier;
      GameState.addCurrency('cosmicDust', rewardAmount);
    } else if (reward.type === 'random') {
      // x2 income for 30 min
      s.eventCreditMultiplier = 2;
      setTimeout(() => { s.eventCreditMultiplier = 1; }, 1800000);
      rewardAmount = -1; // special
    }

    return { reward, amount: rewardAmount, day: s.dailyReward.currentStreak, multiplier };
  }

  return {
    start, stop, resetSaveInterval, tick, doTap, buyGenerator, buyRocketPart, launchRocket,
    buyUpgrade, buyResearch, buyCDShopItem, hireCrew, upgradeCrewMember,
    upgradeAllCrew, getCrewBonus, repairIoGenerator, buyStarSystem,
    claimDailyReward, calculateRates, unlockAchievement, addLogEntry,
    getActiveGeneratorKeysForPhase, findGenerator, getStarSystemCost
  };
})();
