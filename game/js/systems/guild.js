// =========================================
// Guild System - Cooperative Farming
// =========================================

class GuildSystem {
  constructor(game) {
    this.game = game;
  }

  // Get or create guild state
  ensureState() {
    const s = this.game.state.get();
    if (!s.guild) {
      s.guild = {
        joined: false,
        name: '',
        icon: '',
        motto: '',
        level: 1,
        xp: 0,
        medals: 0,
        totalDonated: 0,
        members: [],        // NPC member IDs
        chatLog: [],         // { from, message, time }
        donations: [],       // { from, amount, time }
        lastDonation: 0,
        // Raid state
        activeRaid: null,    // { bossId, currentHp, maxHp, startTime, participants: { id: damage }, rewards: [] }
        raidCooldown: 0,
        raidHistory: [],     // { bossId, success, damage, time }
        totalRaidDamage: 0,
        // Guild farm (shared virtual farm)
        guildFarm: {
          crops: [],         // { cropId, plantedAt, plantedBy }
          totalHarvested: 0
        },
        // Perks
        activePerks: [],     // Array of unlocked perk IDs
        // Stats
        createdAt: 0,
        totalXpEarned: 0
      };
    }
    return s.guild;
  }

  // Create a new guild
  createGuild(name, icon, motto) {
    const guild = this.ensureState();
    const s = this.game.state.get();

    if (guild.joined) return { success: false, message: 'Already in a guild!' };
    if (s.player.coins < 500) return { success: false, message: 'Need 500 coins to create a guild!' };

    s.player.coins -= 500;
    guild.joined = true;
    guild.name = name;
    guild.icon = icon || '🏰';
    guild.motto = motto || 'Farming together!';
    guild.level = 1;
    guild.xp = 0;
    guild.medals = 0;
    guild.members = [];
    guild.chatLog = [];
    guild.createdAt = Utils.now();
    guild.activePerks = [];

    // Add 2-3 random NPC members as founding members
    const npcs = Utils.shuffle(NPC_GUILD_MEMBERS).slice(0, Utils.randomInt(2, 3));
    npcs.forEach(npc => guild.members.push(npc.id));

    this.addChatMessage('System', `${name} has been founded! Welcome, farmers! 🎉`);
    this.updatePerks();
    this.game.state.save();

    return { success: true, message: `Guild "${name}" created!` };
  }

  // Join an existing guild (template)
  joinGuild(templateIndex) {
    const guild = this.ensureState();
    const s = this.game.state.get();

    if (guild.joined) return { success: false, message: 'Already in a guild!' };

    const template = GUILD_TEMPLATES[templateIndex];
    if (!template) return { success: false, message: 'Guild not found!' };

    guild.joined = true;
    guild.name = template.name;
    guild.icon = template.icon;
    guild.motto = template.motto;
    guild.level = template.level;
    guild.xp = 0;
    guild.medals = Math.floor(template.level * 20);
    guild.members = [...template.memberIds];
    guild.chatLog = [];
    guild.createdAt = Utils.now() - 86400 * template.level; // Fake creation date
    guild.activePerks = [];

    this.addChatMessage('System', `${s.player.name} has joined the guild! Welcome! 🎉`);
    this.updatePerks();
    this.simulateHistory();
    this.game.state.save();

    return { success: true, message: `Joined "${template.name}"!` };
  }

  // Leave guild
  leaveGuild() {
    const guild = this.ensureState();
    if (!guild.joined) return;

    guild.joined = false;
    guild.activeRaid = null;
    this.game.state.save();
  }

  // Donate coins to guild
  donate(amount) {
    const guild = this.ensureState();
    const s = this.game.state.get();

    if (!guild.joined) return { success: false, message: 'Not in a guild!' };
    if (s.player.coins < amount) return { success: false, message: 'Not enough coins!' };

    // Cooldown check (1 donation per 30 seconds)
    if (Utils.now() - guild.lastDonation < 30) {
      return { success: false, message: 'Please wait before donating again!' };
    }

    s.player.coins -= amount;
    guild.totalDonated += amount;
    guild.lastDonation = Utils.now();

    // Convert to guild XP (1 coin = 1 XP) and medals (10 coins = 1 medal)
    const xpGain = amount;
    const medalGain = Math.floor(amount / 10);
    guild.xp += xpGain;
    guild.medals += medalGain;
    guild.totalXpEarned += xpGain;

    guild.donations.push({
      from: s.player.name,
      amount: amount,
      time: Utils.now()
    });

    // Keep only last 20 donations
    if (guild.donations.length > 20) guild.donations = guild.donations.slice(-20);

    this.addChatMessage(s.player.name, `Donated ${Utils.formatNumber(amount)} coins! 💰`);

    // Check for level up
    this.checkLevelUp();

    // Simulate NPC reactions
    this.simulateNPCReaction('donate');

    this.game.state.save();
    return { success: true, message: `Donated ${Utils.formatNumber(amount)} coins! +${medalGain} medals` };
  }

  // Check for guild level up
  checkLevelUp() {
    const guild = this.ensureState();
    if (guild.level >= 50) return;

    const required = GUILD_LEVEL_XP[guild.level];
    while (guild.xp >= required && guild.level < 50) {
      guild.xp -= GUILD_LEVEL_XP[guild.level];
      guild.level++;
      this.addChatMessage('System', `Guild leveled up to Lv.${guild.level}! 🎉`);

      // Check for new perks
      if (GUILD_PERKS[guild.level]) {
        const perk = GUILD_PERKS[guild.level];
        this.addChatMessage('System', `New perk unlocked: ${perk.icon} ${perk.name}!`);
      }

      // Attract new NPC member on level up
      if (guild.level % 5 === 0 && guild.members.length < 10) {
        const availableNPCs = NPC_GUILD_MEMBERS.filter(n => !guild.members.includes(n.id));
        if (availableNPCs.length > 0) {
          const newMember = availableNPCs[Utils.randomInt(0, availableNPCs.length - 1)];
          guild.members.push(newMember.id);
          this.addChatMessage('System', `${newMember.name} has joined the guild! 🆕`);
        }
      }

      this.updatePerks();
    }
  }

  // Update active perks based on guild level
  updatePerks() {
    const guild = this.ensureState();
    guild.activePerks = [];
    for (const [lvl, perk] of Object.entries(GUILD_PERKS)) {
      if (guild.level >= parseInt(lvl)) {
        guild.activePerks.push(perk.id);
      }
    }
  }

  // Get cumulative perk bonus for a type
  getPerkBonus(type) {
    const guild = this.ensureState();
    if (!guild.joined) return 0;

    let total = 0;
    for (const [lvl, perk] of Object.entries(GUILD_PERKS)) {
      if (guild.level >= parseInt(lvl) && perk.effect.type === type) {
        total += perk.effect.value;
      }
    }

    // Apply legendary perk if level 50
    if (guild.level >= 50) {
      total *= 1.5;
    }

    return total;
  }

  // Add chat message
  addChatMessage(from, message) {
    const guild = this.ensureState();
    guild.chatLog.push({
      from: from,
      message: message,
      time: Utils.now()
    });
    // Keep last 50 messages
    if (guild.chatLog.length > 50) guild.chatLog = guild.chatLog.slice(-50);
  }

  // Simulate NPC chat messages
  simulateNPCReaction(triggerType) {
    const guild = this.ensureState();
    if (guild.members.length === 0) return;

    const memberId = guild.members[Utils.randomInt(0, guild.members.length - 1)];
    const member = NPC_GUILD_MEMBERS.find(n => n.id === memberId);
    if (!member) return;

    const msgPool = GUILD_CHAT_MESSAGES.find(m => m.type === (triggerType === 'donate' ? 'reaction' : triggerType));
    if (!msgPool) return;

    const msg = msgPool.messages[Utils.randomInt(0, msgPool.messages.length - 1)];
    setTimeout(() => {
      this.addChatMessage(member.name, msg.replace('{level}', member.level));
    }, Utils.randomInt(1000, 3000));
  }

  // Fill chat with fake history
  simulateHistory() {
    const guild = this.ensureState();
    const types = ['greeting', 'help', 'brag', 'donate', 'reaction'];

    for (let i = 0; i < 8; i++) {
      if (guild.members.length === 0) break;
      const memberId = guild.members[Utils.randomInt(0, guild.members.length - 1)];
      const member = NPC_GUILD_MEMBERS.find(n => n.id === memberId);
      if (!member) continue;

      const type = types[Utils.randomInt(0, types.length - 1)];
      const pool = GUILD_CHAT_MESSAGES.find(m => m.type === type);
      if (!pool) continue;

      const msg = pool.messages[Utils.randomInt(0, pool.messages.length - 1)];
      guild.chatLog.push({
        from: member.name,
        message: msg.replace('{level}', member.level),
        time: Utils.now() - Utils.randomInt(60, 3600)
      });
    }

    guild.chatLog.sort((a, b) => a.time - b.time);
  }

  // === RAID SYSTEM ===

  // Start a raid
  startRaid(bossId) {
    const guild = this.ensureState();
    if (!guild.joined) return { success: false, message: 'Not in a guild!' };
    if (guild.activeRaid) return { success: false, message: 'Raid already in progress!' };

    const boss = RAID_BOSSES[bossId];
    if (!boss) return { success: false, message: 'Unknown boss!' };
    if (guild.level < boss.minGuildLevel) {
      return { success: false, message: `Guild level ${boss.minGuildLevel} required!` };
    }

    // Cooldown (5 minutes between raids)
    if (Utils.now() - guild.raidCooldown < 300) {
      const remaining = Math.ceil(300 - (Utils.now() - guild.raidCooldown));
      return { success: false, message: `Raid on cooldown! ${Utils.formatTime(remaining)}` };
    }

    guild.activeRaid = {
      bossId: bossId,
      currentHp: boss.hp,
      maxHp: boss.hp,
      startTime: Utils.now(),
      participants: {},
      totalDamage: 0
    };

    this.addChatMessage('System', `⚔️ Raid started: ${boss.icon} ${boss.name}! Attack!`);
    this.simulateNPCReaction('raid');

    // NPCs will auto-attack
    this.scheduleNPCRaidDamage();

    this.game.state.save();
    return { success: true, message: `Raid started: ${boss.name}!` };
  }

  // Deal damage to raid boss (player action = damage)
  dealRaidDamage(amount) {
    const guild = this.ensureState();
    if (!guild.activeRaid) return;

    const s = this.game.state.get();
    const raid = guild.activeRaid;
    const boss = RAID_BOSSES[raid.bossId];

    // Check time limit
    if (Utils.now() - raid.startTime > boss.timeLimit) {
      this.endRaid(false);
      return;
    }

    // Get current phase multiplier
    const hpPercent = raid.currentHp / raid.maxHp;
    let phaseMult = 1;
    for (const phase of boss.phases) {
      if (hpPercent <= phase.hpPercent) {
        phaseMult = phase.dmgMult;
      }
    }

    const damage = Math.floor(amount * phaseMult);
    raid.currentHp = Math.max(0, raid.currentHp - damage);
    raid.totalDamage += damage;

    if (!raid.participants[s.player.name]) {
      raid.participants[s.player.name] = 0;
    }
    raid.participants[s.player.name] += damage;

    // Boss defeated?
    if (raid.currentHp <= 0) {
      this.endRaid(true);
    }
  }

  // Schedule NPC damage over time
  scheduleNPCRaidDamage() {
    const guild = this.ensureState();
    if (!guild.activeRaid) return;

    // Each NPC deals damage periodically
    guild.members.forEach(memberId => {
      const member = NPC_GUILD_MEMBERS.find(n => n.id === memberId);
      if (!member) return;

      const interval = setInterval(() => {
        if (!guild.activeRaid) {
          clearInterval(interval);
          return;
        }

        const damage = member.raidDPS + Utils.randomInt(-10, 10);
        guild.activeRaid.currentHp = Math.max(0, guild.activeRaid.currentHp - damage);
        guild.activeRaid.totalDamage += damage;

        if (!guild.activeRaid.participants[member.name]) {
          guild.activeRaid.participants[member.name] = 0;
        }
        guild.activeRaid.participants[member.name] += damage;

        if (guild.activeRaid.currentHp <= 0) {
          clearInterval(interval);
          this.endRaid(true);
        }
      }, 3000 + Utils.randomInt(0, 2000)); // Every 3-5 seconds

      // Auto-clear after boss time limit
      setTimeout(() => clearInterval(interval), 310000);
    });
  }

  // End raid
  endRaid(success) {
    const guild = this.ensureState();
    if (!guild.activeRaid) return;

    const raid = guild.activeRaid;
    const boss = RAID_BOSSES[raid.bossId];
    const s = this.game.state.get();

    guild.raidHistory.push({
      bossId: raid.bossId,
      success: success,
      damage: raid.totalDamage,
      participants: { ...raid.participants },
      time: Utils.now()
    });

    // Keep last 20 raid records
    if (guild.raidHistory.length > 20) guild.raidHistory = guild.raidHistory.slice(-20);

    guild.totalRaidDamage += (raid.participants[s.player.name] || 0);

    if (success) {
      // Distribute rewards
      const rewards = boss.rewards;
      s.player.coins += rewards.coins;
      guild.medals += rewards.medals;
      this.game.addXP(rewards.xp);

      // Roll loot
      const loot = [];
      rewards.loot.forEach(item => {
        if (Math.random() < item.chance) {
          loot.push(item.item);
        }
      });

      this.addChatMessage('System', `🎉 ${boss.name} defeated! +${Utils.formatNumber(rewards.coins)} coins, +${rewards.medals} medals!`);
      if (loot.length > 0) {
        this.addChatMessage('System', `🎁 Loot: ${loot.length} item(s) received!`);
      }

      // Add guild XP
      guild.xp += Math.floor(rewards.xp / 2);
      this.checkLevelUp();

      this.game.notify.toast(`⚔️ ${boss.name} defeated! +${Utils.formatNumber(rewards.coins)} coins!`);
    } else {
      this.addChatMessage('System', `💀 Raid failed! ${boss.name} was too strong...`);
      // Consolation prize
      const consolation = Math.floor(boss.rewards.coins * 0.1);
      s.player.coins += consolation;
      guild.medals += Math.floor(boss.rewards.medals * 0.1);

      this.game.notify.toast(`⚔️ Raid failed! +${consolation} coins consolation.`);
    }

    guild.raidCooldown = Utils.now();
    guild.activeRaid = null;
    this.game.state.save();
  }

  // Get raid status
  getRaidStatus() {
    const guild = this.ensureState();
    if (!guild.activeRaid) return null;

    const raid = guild.activeRaid;
    const boss = RAID_BOSSES[raid.bossId];
    const elapsed = Utils.now() - raid.startTime;
    const remaining = Math.max(0, boss.timeLimit - elapsed);

    // Determine current phase
    const hpPercent = raid.currentHp / raid.maxHp;
    let currentPhase = boss.phases[0];
    for (const phase of boss.phases) {
      if (hpPercent <= phase.hpPercent) currentPhase = phase;
    }

    return {
      boss: boss,
      currentHp: raid.currentHp,
      maxHp: raid.maxHp,
      hpPercent: hpPercent,
      timeRemaining: remaining,
      phase: currentPhase,
      participants: raid.participants,
      totalDamage: raid.totalDamage
    };
  }

  // === GUILD SHOP ===

  buyShopItem(itemId) {
    const guild = this.ensureState();
    if (!guild.joined) return { success: false, message: 'Not in a guild!' };

    // Find item across all tiers
    let item = null;
    for (const tier of Object.values(GUILD_SHOP)) {
      const found = tier.find(i => i.id === itemId);
      if (found) { item = found; break; }
    }

    if (!item) return { success: false, message: 'Item not found!' };
    if (guild.medals < item.cost) return { success: false, message: 'Not enough medals!' };

    // Check tier unlock
    const shopTier = this.getShopTier();
    if (item.id.includes('tier2') && shopTier < 2) return { success: false, message: 'Guild shop tier 2 not unlocked!' };
    if (item.id.includes('tier3') && shopTier < 3) return { success: false, message: 'Guild shop tier 3 not unlocked!' };

    guild.medals -= item.cost;
    const s = this.game.state.get();

    // Apply item effect
    switch (item.effect) {
      case 'coins':
        s.player.coins += item.value;
        this.game.recordCoinEarning(item.value);
        break;
      case 'xp':
        this.game.addXP(item.value);
        break;
      case 'energy':
        s.player.energy = Math.min(s.player.maxEnergy, s.player.energy + item.value);
        break;
      case 'fullEnergy':
        s.player.energy = s.player.maxEnergy;
        break;
      case 'instantGrow':
        // Find first growing crop and finish it
        for (const [key, tile] of Object.entries(s.farm.tiles)) {
          if (tile.content && tile.content.type === 'crop') {
            const crop = tile.content;
            const cropData = CROPS_DATA[crop.cropId];
            if (cropData && crop.stage < cropData.stages.length - 1) {
              crop.plantedAt = Utils.now() - cropData.growthTime - 1;
              break;
            }
          }
        }
        break;
      case 'goldenSeed':
        // Store golden seed buff
        if (!s.buffs) s.buffs = {};
        s.buffs.goldenSeed = (s.buffs.goldenSeed || 0) + 1;
        break;
      case 'rainDance':
        if (!s.buffs) s.buffs = {};
        s.buffs.rainDance = Utils.now() + item.duration;
        break;
      case 'harvestMoon':
        if (!s.buffs) s.buffs = {};
        s.buffs.harvestMoon = Utils.now() + item.duration;
        break;
      case 'banner':
      case 'trophy':
        // Decorative items - store in inventory
        if (!s.inventory.items[item.id]) s.inventory.items[item.id] = 0;
        s.inventory.items[item.id]++;
        break;
    }

    this.game.state.save();
    return { success: true, message: `Purchased ${item.name}!` };
  }

  getShopTier() {
    const guild = this.ensureState();
    let tier = 0;
    for (const [lvl, perk] of Object.entries(GUILD_PERKS)) {
      if (guild.level >= parseInt(lvl) && perk.effect.type === 'shopTier') {
        tier = Math.max(tier, perk.effect.value);
      }
    }
    return tier;
  }

  // Get available shop items based on tier
  getAvailableShopItems() {
    const tier = this.getShopTier();
    let items = [];
    if (tier >= 1) items = items.concat(GUILD_SHOP.tier1);
    if (tier >= 2) items = items.concat(GUILD_SHOP.tier2);
    if (tier >= 3) items = items.concat(GUILD_SHOP.tier3);
    return items;
  }

  // === GUILD FARM ===

  plantGuildCrop(cropId) {
    const guild = this.ensureState();
    if (!guild.joined) return { success: false };

    const s = this.game.state.get();
    if (guild.guildFarm.crops.length >= 6) return { success: false, message: 'Guild farm is full!' };

    guild.guildFarm.crops.push({
      cropId: cropId,
      plantedAt: Utils.now(),
      plantedBy: s.player.name
    });

    this.addChatMessage(s.player.name, `Planted ${CROPS_DATA[cropId]?.icon || '🌱'} in the guild farm!`);
    this.game.state.save();
    return { success: true };
  }

  harvestGuildCrop(index) {
    const guild = this.ensureState();
    if (!guild.joined) return { success: false };

    const crop = guild.guildFarm.crops[index];
    if (!crop) return { success: false };

    const cropData = CROPS_DATA[crop.cropId];
    if (!cropData) return { success: false };

    const elapsed = Utils.now() - crop.plantedAt;
    if (elapsed < cropData.growthTime) return { success: false, message: 'Not ready yet!' };

    // Harvest - give rewards to all online members (just player)
    const s = this.game.state.get();
    const value = cropData.sellPrice * 2; // Guild crops are 2x value
    s.player.coins += value;
    this.game.recordCoinEarning(value);
    guild.guildFarm.totalHarvested++;
    guild.xp += 10;

    guild.guildFarm.crops.splice(index, 1);

    this.addChatMessage('System', `${cropData.icon} Guild crop harvested! +${Utils.formatNumber(value)} coins`);
    this.checkLevelUp();
    this.game.state.save();
    return { success: true, value: value };
  }

  // === PERIODIC UPDATE ===

  update() {
    const guild = this.ensureState();
    if (!guild.joined) return;

    // Simulate NPC donations periodically
    const now = Utils.now();
    guild.members.forEach(memberId => {
      const member = NPC_GUILD_MEMBERS.find(n => n.id === memberId);
      if (!member) return;

      // Each NPC donates randomly every ~2-5 minutes
      if (Math.random() < 0.001) { // ~once per tick cycle
        const amount = Math.floor(member.level * 10 * member.donateRate);
        if (amount > 0) {
          guild.xp += amount;
          guild.totalXpEarned += amount;
          const msgPool = GUILD_CHAT_MESSAGES.find(m => m.type === 'donate');
          if (msgPool) {
            this.addChatMessage(member.name, msgPool.messages[Utils.randomInt(0, msgPool.messages.length - 1)]);
          }
        }
      }

      // Random chat messages
      if (Math.random() < 0.0003) {
        const types = ['greeting', 'help', 'brag', 'reaction'];
        const type = types[Utils.randomInt(0, types.length - 1)];
        const pool = GUILD_CHAT_MESSAGES.find(m => m.type === type);
        if (pool) {
          this.addChatMessage(member.name, pool.messages[Utils.randomInt(0, pool.messages.length - 1)].replace('{level}', member.level));
        }
      }
    });

    // Check raid timeout
    if (guild.activeRaid) {
      const boss = RAID_BOSSES[guild.activeRaid.bossId];
      if (now - guild.activeRaid.startTime > boss.timeLimit) {
        this.endRaid(false);
      }
    }

    this.checkLevelUp();
  }

  // Calculate farm power for leaderboards
  calculateFarmPower() {
    const s = this.game.state.get();
    let power = 0;

    // Level contribution
    power += s.player.level * 100;

    // Coins
    power += Math.floor(s.player.totalCoinsEarned / 10);

    // Crops harvested
    power += s.player.totalCropsHarvested * 5;

    // Buildings
    power += (s.buildings || []).length * 200;

    // Animals
    power += (s.animals || []).length * 150;

    // Trees
    power += (s.trees || []).length * 100;

    // Inventory value
    for (const [itemId, qty] of Object.entries(s.inventory.items || {})) {
      power += qty * 2;
    }

    return power;
  }

  // Get member list with NPC data
  getMemberList() {
    const guild = this.ensureState();
    if (!guild.joined) return [];

    const s = this.game.state.get();
    const members = [];

    // Add player
    members.push({
      id: 'player',
      name: s.player.name,
      icon: s.player.avatar.body,
      level: s.player.level,
      farmPower: this.calculateFarmPower(),
      isPlayer: true,
      isOnline: true
    });

    // Add NPCs
    guild.members.forEach(memberId => {
      const npc = NPC_GUILD_MEMBERS.find(n => n.id === memberId);
      if (npc) {
        members.push({
          id: npc.id,
          name: npc.name,
          icon: npc.icon,
          level: npc.level,
          farmPower: npc.farmPower,
          isPlayer: false,
          isOnline: Math.random() > 0.3 // 70% chance online
        });
      }
    });

    return members.sort((a, b) => b.farmPower - a.farmPower);
  }
}
