// =========================================
// Game State Manager
// =========================================

class GameState {
  constructor() {
    this.saveKey = 'minifarm_save_v1';
    this.state = null;
  }

  createNewState() {
    return {
      version: 1,
      player: {
        name: 'Farmer',
        level: 1,
        xp: 0,
        coins: 100,
        gems: 5,
        energy: 20,
        maxEnergy: 20,
        lastEnergyRegen: Utils.now(),
        avatar: {
          body: '👨‍🌾',
          skinColor: '#FFDAB9',
          hairStyle: 0,
          outfit: 0
        },
        tutorialComplete: false,
        createdAt: Utils.now(),
        lastLogin: Utils.now(),
        totalCoinsEarned: 0,
        totalCropsHarvested: 0,
        totalAnimalsRaised: 0,
        totalItemsProduced: 0,
        totalItemsSold: 0,
        daysPlayed: 1
      },
      farm: {
        rows: 8,
        cols: 8,
        tiles: {}, // key: "row,col" -> tile data
        expansionsPurchased: []
      },
      inventory: {
        capacity: 50,
        items: {} // itemId -> quantity
      },
      animals: [], // array of animal instances
      buildings: [], // array of building instances
      trees: [], // array of tree instances
      decorations: [], // array of decoration placements
      quests: {
        active: {},    // questId -> { progress: { objIdx: count }, accepted: timestamp }
        completed: [], // array of completed quest IDs
        dailyQuests: [],
        dailyQuestsDate: null,
        dailyBonusClaimed: false
      },
      friends: [],
      settings: {
        musicVolume: 0.3,
        sfxVolume: 0.5,
        musicEnabled: true,
        sfxEnabled: true
      },
      statistics: {
        totalCoinsSpent: 0,
        totalXpEarned: 0,
        cropsPlanted: 0,
        cropsHarvested: 0,
        animalsFed: 0,
        productsCollected: 0,
        itemsProduced: 0,
        itemsSold: 0,
        questsCompleted: 0,
        expansionsBought: 0,
        buildingsBuilt: 0,
        treesPlanted: 0,
        loginDays: 1
      },
      timestamps: {
        lastSave: Utils.now(),
        lastLogin: Utils.now(),
        gameStarted: Utils.now()
      }
    };
  }

  // Initialize farm tiles
  initFarmTiles(state) {
    state.farm.tiles = {};
    for (let r = 0; r < state.farm.rows; r++) {
      for (let c = 0; c < state.farm.cols; c++) {
        const key = `${r},${c}`;
        // Create a mix of grass and plowed tiles
        let type = 'grass';
        // Center area starts as plowed (ready for planting)
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) {
          type = 'plowed';
        }
        state.farm.tiles[key] = {
          type: type, // grass, plowed, water, path
          content: null, // null, or { type: 'crop', cropId, plantedAt, stage }
          decoration: null
        };
      }
    }
    return state;
  }

  // Save game
  save() {
    if (!this.state) return;
    this.state.timestamps.lastSave = Utils.now();
    try {
      localStorage.setItem(this.saveKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save game:', e);
    }
  }

  // Load game
  load() {
    try {
      const data = localStorage.getItem(this.saveKey);
      if (data) {
        this.state = JSON.parse(data);
        return true;
      }
    } catch (e) {
      console.warn('Failed to load save:', e);
    }
    return false;
  }

  // Start new game
  newGame() {
    this.state = this.createNewState();
    this.initFarmTiles(this.state);
    // Start first tutorial quest
    this.state.quests.active['tutorial_plant'] = {
      progress: {},
      accepted: Utils.now()
    };
    this.save();
    return this.state;
  }

  // Delete save
  deleteSave() {
    localStorage.removeItem(this.saveKey);
    this.state = null;
  }

  // Check if a save exists
  hasSave() {
    return localStorage.getItem(this.saveKey) !== null;
  }

  // Get current state
  get() {
    return this.state;
  }

  // Get tile data
  getTile(row, col) {
    const key = `${row},${col}`;
    return this.state.farm.tiles[key] || null;
  }

  // Set tile data
  setTile(row, col, data) {
    const key = `${row},${col}`;
    this.state.farm.tiles[key] = data;
  }

  // Check if grid position is valid
  isValidTile(row, col) {
    return row >= 0 && row < this.state.farm.rows &&
           col >= 0 && col < this.state.farm.cols;
  }

  // Check if tile is occupied by a building or pen
  isTileOccupied(row, col) {
    const tile = this.getTile(row, col);
    if (!tile) return true;
    if (tile.content && tile.content.type === 'building') return true;
    if (tile.content && tile.content.type === 'pen') return true;
    if (tile.content && tile.content.type === 'tree') return true;
    if (tile.decoration) return true;
    return false;
  }

  // Add item to inventory
  addItem(itemId, quantity = 1) {
    const inv = this.state.inventory;
    const currentTotal = Object.values(inv.items).reduce((s, v) => s + v, 0);
    if (currentTotal + quantity > inv.capacity) {
      return false; // Barn full
    }
    inv.items[itemId] = (inv.items[itemId] || 0) + quantity;
    return true;
  }

  // Remove item from inventory
  removeItem(itemId, quantity = 1) {
    const inv = this.state.inventory;
    if ((inv.items[itemId] || 0) < quantity) return false;
    inv.items[itemId] -= quantity;
    if (inv.items[itemId] <= 0) delete inv.items[itemId];
    return true;
  }

  // Check if player has enough items
  hasItem(itemId, quantity = 1) {
    return (this.state.inventory.items[itemId] || 0) >= quantity;
  }

  // Get inventory count
  getItemCount(itemId) {
    return this.state.inventory.items[itemId] || 0;
  }

  // Get total items in inventory
  getTotalItems() {
    return Object.values(this.state.inventory.items).reduce((s, v) => s + v, 0);
  }

  // Add coins
  addCoins(amount) {
    this.state.player.coins += amount;
    this.state.player.totalCoinsEarned += amount;
  }

  // Spend coins
  spendCoins(amount) {
    if (this.state.player.coins < amount) return false;
    this.state.player.coins -= amount;
    this.state.statistics.totalCoinsSpent += amount;
    return true;
  }

  // Add gems
  addGems(amount) {
    this.state.player.gems += amount;
  }

  // Spend gems
  spendGems(amount) {
    if (this.state.player.gems < amount) return false;
    this.state.player.gems -= amount;
    return true;
  }

  // Add XP and check for level up
  addXP(amount) {
    this.state.player.xp += amount;
    this.state.statistics.totalXpEarned += amount;

    // Check for level up
    const levelUps = [];
    while (this.state.player.level < LEVELS_DATA.length) {
      const nextLevel = LEVELS_DATA[this.state.player.level]; // 0-indexed, so level N data is at index N
      if (!nextLevel) break;
      if (this.state.player.xp >= nextLevel.xpRequired) {
        this.state.player.xp -= nextLevel.xpRequired;
        this.state.player.level++;
        this.state.player.energy = this.state.player.maxEnergy; // Refill energy on level up
        levelUps.push({
          level: this.state.player.level,
          rewards: nextLevel.rewards
        });
      } else {
        break;
      }
    }
    return levelUps;
  }

  // Get XP needed for next level
  getXPForNextLevel() {
    if (this.state.player.level >= LEVELS_DATA.length) return Infinity;
    return LEVELS_DATA[this.state.player.level].xpRequired;
  }

  // Get XP progress (0-1)
  getXPProgress() {
    const needed = this.getXPForNextLevel();
    if (needed === Infinity) return 1;
    return this.state.player.xp / needed;
  }

  // Use energy
  useEnergy(amount = 1) {
    if (this.state.player.energy < amount) return false;
    this.state.player.energy -= amount;
    return true;
  }

  // Regenerate energy
  regenEnergy() {
    const now = Utils.now();
    const elapsed = now - this.state.player.lastEnergyRegen;
    const regenRate = 180; // 1 energy per 3 minutes
    const gained = Math.floor(elapsed / regenRate);
    if (gained > 0) {
      this.state.player.energy = Math.min(
        this.state.player.maxEnergy,
        this.state.player.energy + gained
      );
      this.state.player.lastEnergyRegen = now - (elapsed % regenRate);
    }
  }

  // Expand farm
  expandFarm(expansion) {
    const s = this.state;
    const dir = expansion.direction;
    const newRows = expansion.size.rows;
    const newCols = expansion.size.cols;

    if (dir === 'right') {
      const startCol = s.farm.cols;
      s.farm.cols += newCols;
      for (let r = 0; r < s.farm.rows; r++) {
        for (let c = startCol; c < s.farm.cols; c++) {
          s.farm.tiles[`${r},${c}`] = { type: 'grass', content: null, decoration: null };
        }
      }
    } else if (dir === 'bottom') {
      const startRow = s.farm.rows;
      s.farm.rows += newRows;
      for (let r = startRow; r < s.farm.rows; r++) {
        for (let c = 0; c < s.farm.cols; c++) {
          s.farm.tiles[`${r},${c}`] = { type: 'grass', content: null, decoration: null };
        }
      }
    }

    s.farm.expansionsPurchased.push(expansion.id);
    s.statistics.expansionsBought++;
  }
}
