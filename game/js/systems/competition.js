// =========================================
// Competition System - Leaderboards & Tournaments
// =========================================

class CompetitionSystem {
  constructor(game) {
    this.game = game;
  }

  // Ensure competition state exists
  ensureState() {
    const s = this.game.state.get();
    if (!s.competition) {
      s.competition = {
        // Tournament state
        activeTournament: null, // { typeId, startTime, playerScore, npcScores: { name: score } }
        tournamentHistory: [],
        tournamentCooldown: 0,
        tournamentsWon: 0,
        // Challenge state
        activeChallenge: null, // { typeId, opponentId, startTime, playerScore, opponentScore }
        challengeHistory: [],
        challengesWon: 0,
        // Leaderboard cache
        lastLeaderboardUpdate: 0,
        leaderboardCache: {}
      };
    }
    return s.competition;
  }

  // === LEADERBOARDS ===

  generateLeaderboard(category) {
    const comp = this.ensureState();
    const s = this.game.state.get();
    const guild = this.game.guild.ensureState();

    const entries = [];

    // Add player
    const playerScore = this.getPlayerScore(category);
    entries.push({
      rank: 0,
      name: s.player.name,
      icon: s.player.avatar.body,
      score: playerScore,
      isPlayer: true,
      guildName: guild.joined ? guild.name : null
    });

    // Generate NPC entries (mix of guild members and random farmers)
    const allNPCs = [...NPC_GUILD_MEMBERS];

    // Add some extra random farmers for variety
    const extraFarmers = [
      { name: 'Wheat King', icon: '👑', level: 45, farmPower: 80000 },
      { name: 'Crop Queen', icon: '👸', level: 42, farmPower: 70000 },
      { name: 'Sir Plows-a-Lot', icon: '🤴', level: 38, farmPower: 55000 },
      { name: 'Lady Harvest', icon: '💃', level: 35, farmPower: 45000 },
      { name: 'Tractor Tim', icon: '🚜', level: 32, farmPower: 40000 },
      { name: 'Sunny Sue', icon: '🌞', level: 28, farmPower: 30000 },
      { name: 'Green Thumb', icon: '🌿', level: 24, farmPower: 22000 },
      { name: 'Seed Sally', icon: '🌻', level: 20, farmPower: 15000 },
      { name: 'Dirt Doug', icon: '🧑‍🌾', level: 16, farmPower: 8000 },
      { name: 'Rookie Rick', icon: '👶', level: 5, farmPower: 1000 }
    ];

    allNPCs.forEach(npc => {
      entries.push({
        rank: 0,
        name: npc.name,
        icon: npc.icon,
        score: this.getNPCScore(npc, category),
        isPlayer: false,
        guildName: this.getNPCGuild(npc.id)
      });
    });

    extraFarmers.forEach(farmer => {
      entries.push({
        rank: 0,
        name: farmer.name,
        icon: farmer.icon,
        score: this.getNPCScore(farmer, category),
        isPlayer: false,
        guildName: null
      });
    });

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);

    // Assign ranks
    entries.forEach((e, i) => e.rank = i + 1);

    return entries;
  }

  getPlayerScore(category) {
    const s = this.game.state.get();
    switch (category) {
      case 'farmPower': return this.game.guild.calculateFarmPower();
      case 'totalCoins': return s.player.totalCoinsEarned || 0;
      case 'cropsHarvested': return s.player.totalCropsHarvested || 0;
      case 'level': return s.player.level;
      case 'raidDamage': {
        const guild = this.game.guild.ensureState();
        return guild.totalRaidDamage || 0;
      }
      case 'guildLevel': {
        const guild = this.game.guild.ensureState();
        return guild.joined ? guild.level : 0;
      }
      default: return 0;
    }
  }

  getNPCScore(npc, category) {
    // Generate plausible scores based on NPC stats
    const base = npc.farmPower || npc.level * 500;
    const variance = 1 + (Math.random() * 0.4 - 0.2); // +/- 20%

    switch (category) {
      case 'farmPower': return Math.floor((npc.farmPower || base) * variance);
      case 'totalCoins': return Math.floor(base * 2 * variance);
      case 'cropsHarvested': return Math.floor((npc.level || 10) * 50 * variance);
      case 'level': return npc.level || 10;
      case 'raidDamage': return Math.floor((npc.raidDPS || 50) * 100 * variance);
      case 'guildLevel': return Math.floor((npc.level || 10) * 0.5);
      default: return 0;
    }
  }

  getNPCGuild(npcId) {
    for (const template of GUILD_TEMPLATES) {
      if (template.memberIds.includes(npcId)) return template.name;
    }
    return null;
  }

  // === TOURNAMENTS ===

  startTournament(typeId) {
    const comp = this.ensureState();
    if (comp.activeTournament) return { success: false, message: 'Tournament already in progress!' };

    const type = TOURNAMENT_TYPES[typeId];
    if (!type) return { success: false, message: 'Unknown tournament type!' };

    // Cooldown check (10 minutes between tournaments)
    if (Utils.now() - comp.tournamentCooldown < 600) {
      const remaining = Math.ceil(600 - (Utils.now() - comp.tournamentCooldown));
      return { success: false, message: `Tournament cooldown! ${Utils.formatTime(remaining)}` };
    }

    // Generate NPC scores (they "play" in parallel)
    const npcScores = {};
    const allCompetitors = [...NPC_GUILD_MEMBERS.slice(0, 8)];
    allCompetitors.forEach(npc => {
      // NPCs score based on their level and the duration
      const baseScore = npc.level * (type.duration / 60);
      npcScores[npc.name] = Math.floor(baseScore * (0.5 + Math.random()));
    });

    comp.activeTournament = {
      typeId: typeId,
      startTime: Utils.now(),
      playerScore: 0,
      npcScores: npcScores,
      trackingStart: this.getMetricValue(type.metric)
    };

    this.game.notify.toast(`${type.icon} Tournament started: ${type.name}!`);
    this.game.state.save();
    return { success: true, message: `${type.name} started! You have ${Utils.formatTime(type.duration)}!` };
  }

  // Update tournament score
  updateTournament() {
    const comp = this.ensureState();
    if (!comp.activeTournament) return;

    const tournament = comp.activeTournament;
    const type = TOURNAMENT_TYPES[tournament.typeId];
    if (!type) return;

    // Update player score
    const currentValue = this.getMetricValue(type.metric);
    tournament.playerScore = currentValue - tournament.trackingStart;

    // Check if tournament is over
    if (Utils.now() - tournament.startTime >= type.duration) {
      this.endTournament();
    }
  }

  getMetricValue(metric) {
    const s = this.game.state.get();
    switch (metric) {
      case 'cropsHarvested': return s.player.totalCropsHarvested || 0;
      case 'coinsEarned': return s.player.totalCoinsEarned || 0;
      case 'totalActions': return (s.statistics.cropsHarvested || 0) + (s.statistics.itemsSold || 0);
      case 'totalSold': return s.statistics.itemsSold || 0;
      default: return 0;
    }
  }

  endTournament() {
    const comp = this.ensureState();
    if (!comp.activeTournament) return;

    const tournament = comp.activeTournament;
    const type = TOURNAMENT_TYPES[tournament.typeId];
    const s = this.game.state.get();

    // Build rankings
    const rankings = [
      { name: s.player.name, score: tournament.playerScore, isPlayer: true }
    ];
    for (const [name, score] of Object.entries(tournament.npcScores)) {
      rankings.push({ name, score, isPlayer: false });
    }
    rankings.sort((a, b) => b.score - a.score);
    rankings.forEach((r, i) => r.rank = i + 1);

    const playerRank = rankings.find(r => r.isPlayer).rank;

    // Determine rewards
    let reward = null;
    for (const r of type.rewards) {
      if (playerRank <= r.rank) {
        reward = r;
        break;
      }
    }

    if (reward) {
      s.player.coins += reward.coins;
      this.game.recordCoinEarning(reward.coins);
      s.player.gems += reward.gems;

      const guild = this.game.guild.ensureState();
      if (guild.joined) guild.medals += reward.medals;

      if (playerRank === 1) comp.tournamentsWon++;

      this.game.notify.toast(`${type.icon} Tournament over! Rank #${playerRank} — +${Utils.formatNumber(reward.coins)} coins!`);
    } else {
      this.game.notify.toast(`${type.icon} Tournament over! Rank #${playerRank}. Better luck next time!`);
    }

    comp.tournamentHistory.push({
      typeId: tournament.typeId,
      rank: playerRank,
      score: tournament.playerScore,
      rankings: rankings.slice(0, 5),
      time: Utils.now()
    });
    if (comp.tournamentHistory.length > 20) comp.tournamentHistory = comp.tournamentHistory.slice(-20);

    comp.tournamentCooldown = Utils.now();
    comp.activeTournament = null;
    this.game.state.save();
  }

  getTournamentStatus() {
    const comp = this.ensureState();
    if (!comp.activeTournament) return null;

    const tournament = comp.activeTournament;
    const type = TOURNAMENT_TYPES[tournament.typeId];
    const elapsed = Utils.now() - tournament.startTime;
    const remaining = Math.max(0, type.duration - elapsed);

    // Build current standings
    const s = this.game.state.get();
    const standings = [
      { name: s.player.name, score: tournament.playerScore, isPlayer: true }
    ];
    for (const [name, score] of Object.entries(tournament.npcScores)) {
      // NPCs progress linearly
      const progress = Math.min(1, elapsed / type.duration);
      standings.push({ name, score: Math.floor(score * progress), isPlayer: false });
    }
    standings.sort((a, b) => b.score - a.score);
    standings.forEach((s, i) => s.rank = i + 1);

    return {
      type: type,
      timeRemaining: remaining,
      standings: standings,
      playerRank: standings.find(s => s.isPlayer).rank
    };
  }

  // === FRIEND CHALLENGES ===

  startChallenge(typeId, opponentId) {
    const comp = this.ensureState();
    if (comp.activeChallenge) return { success: false, message: 'Challenge already in progress!' };

    const type = CHALLENGE_TYPES[typeId];
    if (!type) return { success: false, message: 'Unknown challenge type!' };

    const opponent = NPC_GUILD_MEMBERS.find(n => n.id === opponentId);
    if (!opponent) return { success: false, message: 'Opponent not found!' };

    // Generate opponent's score
    const baseScore = opponent.level * (type.duration / 60);
    const opponentFinalScore = Math.floor(baseScore * (0.3 + Math.random() * 0.7));

    comp.activeChallenge = {
      typeId: typeId,
      opponentId: opponentId,
      opponentName: opponent.name,
      startTime: Utils.now(),
      playerScore: 0,
      opponentScore: opponentFinalScore,
      trackingStart: this.getMetricValue(type.metric)
    };

    this.game.notify.toast(`${type.icon} Challenge started vs ${opponent.name}!`);
    this.game.state.save();
    return { success: true, message: `Challenge started vs ${opponent.name}!` };
  }

  updateChallenge() {
    const comp = this.ensureState();
    if (!comp.activeChallenge) return;

    const challenge = comp.activeChallenge;
    const type = CHALLENGE_TYPES[challenge.typeId];
    if (!type) return;

    // Update player score
    const currentValue = this.getMetricValue(type.metric);
    challenge.playerScore = currentValue - challenge.trackingStart;

    // Check if challenge is over
    if (Utils.now() - challenge.startTime >= type.duration) {
      this.endChallenge();
    }
  }

  endChallenge() {
    const comp = this.ensureState();
    if (!comp.activeChallenge) return;

    const challenge = comp.activeChallenge;
    const type = CHALLENGE_TYPES[challenge.typeId];
    const s = this.game.state.get();

    const playerWon = challenge.playerScore > challenge.opponentScore;
    const reward = playerWon ? type.reward.winner : type.reward.loser;

    s.player.coins += reward.coins;
    this.game.recordCoinEarning(reward.coins);

    const guild = this.game.guild.ensureState();
    if (guild.joined) guild.medals += reward.medals;

    if (playerWon) comp.challengesWon++;

    comp.challengeHistory.push({
      typeId: challenge.typeId,
      opponent: challenge.opponentName,
      playerScore: challenge.playerScore,
      opponentScore: challenge.opponentScore,
      won: playerWon,
      time: Utils.now()
    });
    if (comp.challengeHistory.length > 20) comp.challengeHistory = comp.challengeHistory.slice(-20);

    const resultMsg = playerWon
      ? `You won! +${Utils.formatNumber(reward.coins)} coins!`
      : `${challenge.opponentName} won. +${Utils.formatNumber(reward.coins)} coins.`;
    this.game.notify.toast(`${type.icon} ${resultMsg}`);

    comp.activeChallenge = null;
    this.game.state.save();
  }

  getChallengeStatus() {
    const comp = this.ensureState();
    if (!comp.activeChallenge) return null;

    const challenge = comp.activeChallenge;
    const type = CHALLENGE_TYPES[challenge.typeId];
    const elapsed = Utils.now() - challenge.startTime;
    const remaining = Math.max(0, type.duration - elapsed);

    // Opponent score progresses linearly
    const progress = Math.min(1, elapsed / type.duration);
    const currentOpponentScore = Math.floor(challenge.opponentScore * progress);

    return {
      type: type,
      timeRemaining: remaining,
      playerScore: challenge.playerScore,
      opponentScore: currentOpponentScore,
      opponentFinalScore: challenge.opponentScore,
      opponentName: challenge.opponentName,
      isWinning: challenge.playerScore > currentOpponentScore
    };
  }

  // Periodic update
  update() {
    this.updateTournament();
    this.updateChallenge();
  }
}
