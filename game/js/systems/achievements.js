// =========================================
// Achievement, Mastery, Collection, Pet, Login Systems
// =========================================

class AchievementSystem {
  constructor(game) {
    this.game = game;
  }

  ensureState() {
    const s = this.game.state.get();
    if (!s.achievements) s.achievements = { unlocked: [], score: 0 };
  }

  check() {
    this.ensureState();
    const s = this.game.state.get();
    const stats = this.getStats();
    const newlyUnlocked = [];

    for (const [id, ach] of Object.entries(ACHIEVEMENTS_DATA)) {
      if (s.achievements.unlocked.includes(id)) continue;
      const val = stats[ach.condition.stat] || 0;
      if (val >= ach.condition.target) {
        s.achievements.unlocked.push(id);
        s.achievements.score += ach.points;

        // Grant rewards
        if (ach.rewards.coins) this.game.state.addCoins(ach.rewards.coins);
        if (ach.rewards.gems) this.game.state.addGems(ach.rewards.gems);

        newlyUnlocked.push(ach);
      }
    }

    newlyUnlocked.forEach(ach => {
      Audio.sfx('quest_complete');
      this.game.notify.toast(`🏆 Achievement: ${ach.title}!`, 'reward');
    });

    if (newlyUnlocked.length > 0) this.game.state.save();
  }

  getStats() {
    const s = this.game.state.get();
    const st = s.statistics;
    return {
      cropsHarvested: st.cropsHarvested || 0,
      cropsPlanted: st.cropsPlanted || 0,
      itemsSold: st.itemsSold || 0,
      itemsProduced: st.itemsProduced || 0,
      buildingsBuilt: st.buildingsBuilt || 0,
      treesPlanted: st.treesPlanted || 0,
      animalsFed: st.animalsFed || 0,
      questsCompleted: st.questsCompleted || 0,
      expansionsBought: st.expansionsBought || 0,
      totalCoinsEarned: s.player.totalCoinsEarned || 0,
      playerLevel: s.player.level,
      animalsBought: s.animals?.length || 0,
      totalAnimalsOwned: s.animals?.length || 0,
      eggsCollected: st.eggsCollected || 0,
      productsCollected: st.productsCollected || 0,
      bakeryProduced: st.bakeryProduced || 0,
      ordersCompleted: st.ordersCompleted || 0,
      decorationsPlaced: st.decorationsPlaced || 0,
      petsAdopted: s.pet ? 1 : 0,
      speedPlant20: st.speedPlant20 || 0,
      harvestStreak: st.harvestStreak || 0,
      butterfliesFound: this.countCollected(s, 'butterflies'),
      gemstonesFound: this.countCollected(s, 'gemstones'),
      collectionsCompleted: this.countCompletedCollections(s),
      masteryBronze: this.countMasteryLevel(s, 'bronze'),
      masteryGold: this.countMasteryLevel(s, 'gold'),
      masteryDiamond: this.countMasteryLevel(s, 'diamond'),
    };
  }

  countCollected(s, catId) {
    if (!s.collections || !s.collections[catId]) return 0;
    return s.collections[catId].length;
  }

  countCompletedCollections(s) {
    if (!s.collections) return 0;
    let count = 0;
    for (const [catId, cat] of Object.entries(COLLECTIONS_DATA)) {
      const found = s.collections?.[catId] || [];
      if (found.length >= cat.items.length) count++;
    }
    return count;
  }

  countMasteryLevel(s, level) {
    if (!s.mastery) return 0;
    const levelIdx = MASTERY_LEVELS.findIndex(m => m.level === level);
    let count = 0;
    for (const harvests of Object.values(s.mastery)) {
      const currentLevel = MASTERY_LEVELS.filter(m => harvests >= m.harvests).pop();
      const currentIdx = MASTERY_LEVELS.indexOf(currentLevel);
      if (currentIdx >= levelIdx) count++;
    }
    return count;
  }
}

// =========================================
// Crop Mastery System
// =========================================

class MasterySystem {
  constructor(game) {
    this.game = game;
  }

  ensureState() {
    const s = this.game.state.get();
    if (!s.mastery) s.mastery = {};
  }

  addHarvest(cropId) {
    this.ensureState();
    const s = this.game.state.get();
    const prev = s.mastery[cropId] || 0;
    s.mastery[cropId] = prev + 1;

    // Check for level up
    const prevLevel = this.getLevel(prev);
    const newLevel = this.getLevel(s.mastery[cropId]);
    if (newLevel.level !== prevLevel.level && newLevel.level !== 'none') {
      const cropName = CROPS_DATA[cropId]?.name || cropId;
      Audio.sfx('levelup');
      this.game.notify.toast(`${newLevel.icon} ${cropName} Mastery: ${newLevel.label}!`, 'reward');
      this.game.checkAchievements();
    }
  }

  getLevel(harvests) {
    let result = MASTERY_LEVELS[0];
    for (const level of MASTERY_LEVELS) {
      if (harvests >= level.harvests) result = level;
    }
    return result;
  }

  getCropMastery(cropId) {
    this.ensureState();
    const s = this.game.state.get();
    const harvests = s.mastery[cropId] || 0;
    const level = this.getLevel(harvests);
    const nextLevel = MASTERY_LEVELS[MASTERY_LEVELS.indexOf(level) + 1] || null;
    return { harvests, level, nextLevel };
  }

  getSellBonus(cropId) {
    const m = this.getCropMastery(cropId);
    return m.level.bonus?.sellBonus || 0;
  }

  getTimeReduction(cropId) {
    const m = this.getCropMastery(cropId);
    return m.level.bonus?.timeReduction || 0;
  }

  getDoubleChance(cropId) {
    const m = this.getCropMastery(cropId);
    return m.level.bonus?.doubleChance || 0;
  }
}

// =========================================
// Collection / Museum System
// =========================================

class CollectionSystem {
  constructor(game) {
    this.game = game;
  }

  ensureState() {
    const s = this.game.state.get();
    if (!s.collections) s.collections = {};
  }

  // Roll for collectible drops on harvest/action
  rollForDrop(triggerType) {
    this.ensureState();
    const s = this.game.state.get();

    // Determine which categories can drop based on trigger
    let candidates = [];
    for (const [catId, cat] of Object.entries(COLLECTIONS_DATA)) {
      const found = s.collections[catId] || [];
      cat.items.forEach(item => {
        if (!found.includes(item.id)) {
          candidates.push({ catId, item });
        }
      });
    }

    if (candidates.length === 0) return null;

    // Roll each candidate
    for (const c of candidates) {
      if (Math.random() < c.item.dropChance) {
        // Found!
        if (!s.collections[c.catId]) s.collections[c.catId] = [];
        s.collections[c.catId].push(c.item.id);

        Audio.sfx('unlock');
        this.game.notify.toast(`🔍 Discovered: ${c.item.icon} ${c.item.name}!`, 'reward');

        // Check if category complete
        const cat = COLLECTIONS_DATA[c.catId];
        if (s.collections[c.catId].length >= cat.items.length) {
          if (cat.grandPrize.coins) this.game.state.addCoins(cat.grandPrize.coins);
          if (cat.grandPrize.gems) this.game.state.addGems(cat.grandPrize.gems);
          this.game.notify.toast(`📚 ${cat.name} Collection Complete!`, 'levelup');
        }

        this.game.checkAchievements();
        this.game.state.save();
        return c.item;
      }
    }
    return null;
  }
}

// =========================================
// Pet System
// =========================================

class PetSystem {
  constructor(game) {
    this.game = game;
    this.giftTimer = 0;
  }

  ensureState() {
    const s = this.game.state.get();
    if (s.pet === undefined) s.pet = null;
  }

  adopt(petId) {
    this.ensureState();
    const s = this.game.state.get();
    const petData = PETS_DATA[petId];
    if (!petData) return;

    if (petData.cost > 0 && !this.game.state.spendCoins(petData.cost)) {
      this.game.notify.error('Not enough coins!');
      return;
    }

    s.pet = {
      typeId: petId,
      name: petData.name,
      adoptedAt: Utils.now(),
      lastGift: Utils.now()
    };

    s.statistics.petsAdopted = 1;
    Audio.sfx('buy');
    this.game.notify.reward(`🎉 Adopted ${petData.icon} ${petData.name}!`);
    this.game.checkAchievements();
    this.game.state.save();
  }

  update() {
    this.ensureState();
    const s = this.game.state.get();
    if (!s.pet) return;

    // Pet finds small gifts periodically (every ~5 minutes = 300s)
    const now = Utils.now();
    if (now - s.pet.lastGift > 300) {
      const petData = PETS_DATA[s.pet.typeId];
      if (petData) {
        const giftCoins = Utils.randomInt(5, 25);
        this.game.state.addCoins(giftCoins);
        s.pet.lastGift = now;
        this.game.notify.toast(`${petData.icon} ${s.pet.name} found 🪙${giftCoins}!`, 'reward');
      }
    }
  }
}

// =========================================
// Daily Login Reward System
// =========================================

class LoginRewardSystem {
  constructor(game) {
    this.game = game;
  }

  ensureState() {
    const s = this.game.state.get();
    if (!s.loginRewards) {
      s.loginRewards = {
        claimedDays: [],
        currentDay: 0,
        lastClaimDate: null,
        streak: 0,
        monthStart: null
      };
    }
  }

  check() {
    this.ensureState();
    const s = this.game.state.get();
    const today = new Date().toDateString();
    const lr = s.loginRewards;

    // Reset monthly if needed
    const monthKey = new Date().getFullYear() + '-' + new Date().getMonth();
    if (lr.monthStart !== monthKey) {
      lr.monthStart = monthKey;
      lr.claimedDays = [];
      lr.currentDay = 0;
    }

    // Check if already claimed today
    if (lr.lastClaimDate === today) return false;

    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lr.lastClaimDate === yesterday) {
      lr.streak++;
    } else if (lr.lastClaimDate !== today) {
      lr.streak = 1;
    }

    return true; // Reward available
  }

  claim() {
    this.ensureState();
    const s = this.game.state.get();
    const today = new Date().toDateString();
    const lr = s.loginRewards;

    if (lr.lastClaimDate === today) return null;

    lr.currentDay++;
    const dayIdx = Math.min(lr.currentDay, LOGIN_REWARDS.length) - 1;
    const reward = LOGIN_REWARDS[dayIdx];
    if (!reward) return null;

    lr.lastClaimDate = today;
    lr.claimedDays.push(lr.currentDay);

    // Grant reward
    const streakMult = lr.streak >= 7 ? 1.5 : 1;

    if (reward.type === 'coins') {
      const amount = Math.floor(reward.amount * streakMult);
      this.game.state.addCoins(amount);
    } else if (reward.type === 'gems') {
      this.game.state.addGems(reward.amount);
    } else if (reward.type === 'special') {
      this.game.state.addGems(10);
      this.game.state.addCoins(3000);
    }

    Audio.sfx('quest_complete');
    this.game.notify.reward(`📅 Day ${lr.currentDay}: ${reward.label}!${lr.streak >= 7 ? ' (Streak x1.5!)' : ''}`);
    this.game.state.save();
    return reward;
  }
}

// =========================================
// Dynamic Market System
// =========================================

class MarketSystem {
  constructor(game) {
    this.game = game;
  }

  ensureState() {
    const s = this.game.state.get();
    if (!s.market) {
      s.market = { priceModifiers: {}, lastUpdate: null, hotItems: [], coldItems: [] };
    }
  }

  update() {
    this.ensureState();
    const s = this.game.state.get();
    const today = new Date().toDateString();

    if (s.market.lastUpdate !== today) {
      this.generatePrices();
      s.market.lastUpdate = today;
    }
  }

  generatePrices() {
    const s = this.game.state.get();
    const mods = {};
    const allItems = Object.keys(CROPS_DATA);
    const shuffled = Utils.shuffle(allItems);

    // 2-3 hot items (+20-30%), 2-3 cold items (-15-20%), rest normal
    const hotCount = Utils.randomInt(2, 3);
    const coldCount = Utils.randomInt(2, 3);
    const hot = shuffled.slice(0, hotCount);
    const cold = shuffled.slice(hotCount, hotCount + coldCount);

    hot.forEach(id => { mods[id] = 1 + (Utils.randomInt(20, 30) / 100); });
    cold.forEach(id => { mods[id] = 1 - (Utils.randomInt(15, 20) / 100); });

    s.market.priceModifiers = mods;
    s.market.hotItems = hot;
    s.market.coldItems = cold;
  }

  getModifiedPrice(itemId, basePrice) {
    this.ensureState();
    const s = this.game.state.get();
    const mod = s.market.priceModifiers[itemId] || 1;
    return Math.floor(basePrice * mod);
  }

  isHot(itemId) {
    this.ensureState();
    return this.game.state.get().market.hotItems?.includes(itemId);
  }

  isCold(itemId) {
    this.ensureState();
    return this.game.state.get().market.coldItems?.includes(itemId);
  }
}
