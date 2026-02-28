// =========================================
// Main Game Controller (v3 - Idle Tycoon)
// =========================================

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.state = new GameState();
    this.notify = new NotificationManager();
    this.panels = new PanelManager(this);

    // New systems
    this.orders = new OrderSystem(this);
    this.achievements = new AchievementSystem(this);
    this.mastery = new MasterySystem(this);
    this.collections = new CollectionSystem(this);
    this.pet = new PetSystem(this);
    this.loginRewards = new LoginRewardSystem(this);
    this.market = new MarketSystem(this);

    // Guild & Competition systems
    this.guild = new GuildSystem(this);
    this.competition = new CompetitionSystem(this);

    // Interaction state
    this.currentTool = 'select';
    this.selectedCrop = null;
    this.selectedTree = null;
    this.selectedAnimal = null;
    this.placementItem = null;
    this.hoverTile = null;
    this.isDragging = false;
    this.dragStart = null;
    this.lastDragPos = null;
    this.pinchDist = null;

    // Auto-save timer
    this.saveInterval = null;
    this.lastUpdate = Utils.now();

    // === IDLE TYCOON SYSTEMS ===

    // CPS (Coins Per Second) tracking
    this.cpsTracker = {
      history: [],       // Array of { time, coins } entries
      windowSize: 10,    // Track over last 10 seconds
      current: 0,        // Current CPS
      lifetime: 0,       // Total coins earned ever
      lastCoins: 0       // Coins at last check
    };

    // Combo system - chain harvests for multiplier
    this.combo = {
      count: 0,          // Current combo count
      multiplier: 1,     // Current combo multiplier
      lastAction: 0,     // Timestamp of last harvest/action
      timeout: 2,        // Seconds before combo resets
      maxDisplay: 0,     // Highest combo this session
      tier: 0            // Current tier (0-4)
    };

    // Frenzy system - sustained play multiplier
    this.frenzy = {
      active: false,
      multiplier: 1,
      sessionStart: Utils.now(),
      actionsThisMinute: 0,
      lastMinuteCheck: Utils.now(),
      level: 0,          // 0-5 frenzy level
      decayTimer: 0
    };

    // Screen shake for juicy feedback
    this.screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  // ==================== INITIALIZATION ====================
  async init() {
    const loadingBar = document.querySelector('#loading-screen .loading-bar');
    const loadingTip = document.querySelector('#loading-screen .loading-tip');

    const tips = typeof LOADING_TIPS !== 'undefined' ? LOADING_TIPS : [
      '🌾 Wheat grows fastest — great for beginners!',
      '🐔 Feed chickens corn to get eggs!',
      '🏪 Build a bakery to turn wheat into bread!',
      '💡 Harvest before crops wither!',
      '🌻 Sunflowers take longer but are worth more!',
      '📦 Upgrade your barn to store more items!',
      '🐄 Cows produce milk — perfect for cheese!',
      '🌳 Trees keep producing fruit forever!'
    ];
    loadingTip.textContent = tips[Math.floor(Math.random() * tips.length)];

    // Step 1: Load or create save
    loadingBar.style.width = '20%';
    await this.sleep(200);

    let isNewGame = false;
    if (this.state.hasSave()) {
      this.state.load();
      this.calculateOfflineProgress();
    } else {
      this.state.newGame();
      isNewGame = true;
    }

    // Step 2: Initialize audio
    loadingBar.style.width = '40%';
    await this.sleep(200);

    Audio.init();
    const settings = this.state.get().settings;
    Audio.setMusicVolume(settings.musicVolume);
    Audio.setSfxVolume(settings.sfxVolume);
    Audio.musicEnabled = settings.musicEnabled;
    Audio.sfxEnabled = settings.sfxEnabled;

    // Step 3: Setup input
    loadingBar.style.width = '60%';
    await this.sleep(200);
    this.setupInput();

    // Step 4: Initialize systems
    loadingBar.style.width = '80%';
    await this.sleep(200);
    this.checkDailyQuests();
    this.checkMainQuests();
    this.orders.update();
    this.market.update();
    this.pet.ensureState();
    this.guild.ensureState();
    this.competition.ensureState();

    // Step 5: Center camera and start
    loadingBar.style.width = '100%';
    await this.sleep(300);

    const s = this.state.get();
    this.renderer.centerOn(s.farm.rows, s.farm.cols);
    this.updateHUD();

    // Hide loading screen
    document.getElementById('loading-screen').classList.add('hidden');
    setTimeout(() => {
      document.getElementById('loading-screen').style.display = 'none';
    }, 500);

    // Start auto-save
    this.saveInterval = setInterval(() => this.state.save(), 30000);

    // Start music
    if (settings.musicEnabled) {
      const startMusic = () => {
        Audio.startMusic();
        document.removeEventListener('click', startMusic);
        document.removeEventListener('touchstart', startMusic);
      };
      document.addEventListener('click', startMusic);
      document.addEventListener('touchstart', startMusic);
    }

    // Start game loop
    requestAnimationFrame(this.gameLoop);

    // Check daily login rewards
    if (this.loginRewards.check()) {
      setTimeout(() => {
        this.panels.open('daily_login');
      }, 1500);
    }

    // Welcome back or new game message
    if (isNewGame) {
      this.notify.toast('Welcome to your new farm! 🌱');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== GAME LOOP ====================
  gameLoop(timestamp) {
    const now = Utils.now();
    const dt = Math.min(now - this.lastUpdate, 0.1);
    this.lastUpdate = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.gameLoop);
  }

  update(dt) {
    const s = this.state.get();

    // Regenerate energy
    this.state.regenEnergy();

    // Update crop timers (check for wither)
    for (const [key, tile] of Object.entries(s.farm.tiles)) {
      if (tile.content && tile.content.type === 'crop') {
        const crop = tile.content;
        const cropData = CROPS_DATA[crop.cropId];
        if (!cropData) continue;

        const elapsed = Utils.now() - crop.plantedAt;
        // Apply mastery time reduction + guild speed boost
        const timeReduction = this.mastery.getTimeReduction(crop.cropId);
        const guildSpeedBonus = this.guild.getPerkBonus('growthSpeed');
        const totalTime = cropData.growthTime * (1 - timeReduction) * (1 - guildSpeedBonus);

        // Update stage
        const stages = cropData.stages.length;
        if (elapsed < totalTime) {
          crop.stage = Math.floor((elapsed / totalTime) * (stages - 1));
        } else {
          crop.stage = stages - 1; // ready

          // Check for withering (2x growth time after ready)
          const overTime = elapsed - totalTime;
          if (overTime > totalTime * 2) {
            crop.withered = true;
          }
        }
      }
    }

    // Update animal production timers
    s.animals.forEach(animal => {
      if (animal.fed && !animal.productReady) {
        const aData = ANIMALS_DATA[animal.typeId];
        if (!aData) return;
        const elapsed = Utils.now() - animal.fedAt;
        if (elapsed >= aData.productionTime) {
          animal.productReady = true;
          animal.fed = false;
        }
      }
    });

    // Update building production timers
    s.buildings.forEach(building => {
      if (!building.production) return;
      building.production.forEach((prod, idx) => {
        if (prod && prod.recipeId) {
          const bldData = BUILDINGS_DATA[building.typeId];
          if (!bldData) return;
          const recipe = bldData.recipes[prod.recipeId];
          if (!recipe) return;
          const elapsed = Utils.now() - prod.startedAt;
          if (elapsed >= recipe.productionTime) {
            prod.complete = true;
          }
        }
      });
    });

    // Update tree timers
    s.trees.forEach(tree => {
      const tData = TREES_DATA[tree.typeId];
      if (!tData) return;
      const elapsed = Utils.now() - tree.plantedAt;

      if (elapsed < tData.matureTime) {
        tree.stage = elapsed < tData.matureTime / 2 ? 0 : 1;
        tree.mature = false;
      } else {
        tree.mature = true;
        tree.stage = 2;

        if (!tree.lastHarvest) tree.lastHarvest = tree.plantedAt + tData.matureTime;
        const sinceLast = Utils.now() - tree.lastHarvest;
        tree.fruitReady = sinceLast >= tData.fruitCycle;
      }
    });

    // Update pet system
    this.pet.update();

    // === GUILD & COMPETITION UPDATES ===
    this.guild.update();
    this.competition.update();

    // === IDLE TYCOON UPDATES ===

    // Update CPS tracking
    this.updateCPS();

    // Update combo decay
    this.updateCombo();

    // Update frenzy system
    this.updateFrenzy();

    // Update screen shake
    if (this.screenShake.intensity > 0.1) {
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.intensity *= this.screenShake.decay;
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
      this.screenShake.intensity = 0;
    }

    // Update HUD periodically
    this.updateHUD();
  }

  // === CPS TRACKING ===
  updateCPS() {
    const s = this.state.get();
    const now = Utils.now();
    const currentCoins = s.player.coins;

    // Track coin changes
    if (this.cpsTracker.lastCoins === 0) {
      this.cpsTracker.lastCoins = currentCoins;
    }

    const earned = Math.max(0, currentCoins - this.cpsTracker.lastCoins);
    this.cpsTracker.lastCoins = currentCoins;

    if (earned > 0) {
      this.cpsTracker.history.push({ time: now, coins: earned });
      this.cpsTracker.lifetime += earned;
    }

    // Clean old entries
    this.cpsTracker.history = this.cpsTracker.history.filter(
      e => now - e.time < this.cpsTracker.windowSize
    );

    // Calculate CPS
    const totalInWindow = this.cpsTracker.history.reduce((sum, e) => sum + e.coins, 0);
    this.cpsTracker.current = totalInWindow / this.cpsTracker.windowSize;
  }

  recordCoinEarning(amount) {
    const now = Utils.now();
    this.cpsTracker.history.push({ time: now, coins: amount });
    this.cpsTracker.lifetime += amount;
  }

  // === COMBO SYSTEM ===
  updateCombo() {
    const now = Utils.now();
    if (this.combo.count > 0 && (now - this.combo.lastAction) > this.combo.timeout) {
      // Combo expired
      if (this.combo.count > 10) {
        this.notify.toast(`Combo ended: ${this.combo.count}x!`, 'warning');
      }
      this.combo.count = 0;
      this.combo.multiplier = 1;
      this.combo.tier = 0;
    }
  }

  addCombo() {
    this.combo.count++;
    this.combo.lastAction = Utils.now();
    if (this.combo.count > this.combo.maxDisplay) {
      this.combo.maxDisplay = this.combo.count;
    }

    // Calculate tier and multiplier
    if (this.combo.count >= 100) {
      this.combo.tier = 4;
      this.combo.multiplier = 5;
    } else if (this.combo.count >= 50) {
      this.combo.tier = 3;
      this.combo.multiplier = 3;
    } else if (this.combo.count >= 20) {
      this.combo.tier = 2;
      this.combo.multiplier = 2;
    } else if (this.combo.count >= 10) {
      this.combo.tier = 1;
      this.combo.multiplier = 1.5;
    } else if (this.combo.count >= 5) {
      this.combo.tier = 0;
      this.combo.multiplier = 1.2;
    } else {
      this.combo.tier = 0;
      this.combo.multiplier = 1;
    }

    // Screen shake + burst on big combos
    if (this.combo.count % 10 === 0 && this.combo.count >= 10) {
      this.addScreenShake(3 + this.combo.tier * 2);
      this.notify.toast(`${this.combo.count}x COMBO! ${Utils.formatMultiplier(this.combo.multiplier)}`, 'reward');
      // Burst effect at screen center
      this.renderer.addBurstParticle(
        this.renderer.screenW / 2,
        this.renderer.screenH / 2,
        ['🔥', '⚡', '💥', '✨', '🌟'],
        8 + this.combo.tier * 4
      );
    }

    // Track frenzy actions
    this.frenzy.actionsThisMinute++;
  }

  // === FRENZY SYSTEM ===
  updateFrenzy() {
    const now = Utils.now();

    // Check actions per minute
    if (now - this.frenzy.lastMinuteCheck >= 60) {
      // Evaluate frenzy level based on actions in the last minute
      if (this.frenzy.actionsThisMinute >= 30) {
        this.frenzy.level = Math.min(5, this.frenzy.level + 1);
      } else if (this.frenzy.actionsThisMinute >= 15) {
        // Maintain current level
      } else {
        this.frenzy.level = Math.max(0, this.frenzy.level - 1);
      }

      this.frenzy.actionsThisMinute = 0;
      this.frenzy.lastMinuteCheck = now;
    }

    // Calculate frenzy multiplier: level 0=1x, 1=1.5x, 2=2x, 3=2.5x, 4=3.5x, 5=5x
    const frenzyMults = [1, 1.5, 2, 2.5, 3.5, 5];
    this.frenzy.multiplier = frenzyMults[this.frenzy.level] || 1;
    this.frenzy.active = this.frenzy.level > 0;
  }

  // Get total multiplier (combo * frenzy)
  getTotalMultiplier() {
    return this.combo.multiplier * this.frenzy.multiplier;
  }

  addScreenShake(intensity) {
    this.screenShake.intensity = Math.min(intensity, 15);
  }

  // Wrapper for adding XP (used by guild/competition systems)
  addXP(amount) {
    const levelUps = this.state.addXP(amount);
    if (levelUps && levelUps.length > 0) {
      levelUps.forEach(lu => this.handleLevelUp(lu));
    }
    return levelUps;
  }

  // ==================== RENDERING ====================
  render() {
    const r = this.renderer;
    const s = this.state.get();

    // Apply screen shake offset
    if (this.screenShake.intensity > 0.1) {
      r.ctx.save();
      r.ctx.translate(this.screenShake.x, this.screenShake.y);
    }

    r.clear();
    r.drawBackground();

    const rows = s.farm.rows;
    const cols = s.farm.cols;

    // Draw tiles in correct order (back to front for isometric)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = this.state.getTile(row, col);
        if (!tile) continue;

        // Base tile
        let tileColor, sideColor;
        switch (tile.type) {
          case 'plowed':
            tileColor = '#8D6E63';
            sideColor = '#6D4C41';
            break;
          case 'water':
            tileColor = '#4FC3F7';
            sideColor = '#0288D1';
            break;
          case 'path':
            tileColor = '#BCAAA4';
            sideColor = '#8D6E63';
            break;
          default: // grass
            tileColor = '#66BB6A';
            sideColor = '#43A047';
            if ((row + col) % 3 === 0) tileColor = '#5CB860';
            if ((row + col) % 5 === 0) tileColor = '#72C676';
        }

        r.drawTile3D(col, row, tileColor, sideColor, 4);

        // Draw content
        if (tile.content) {
          this.renderTileContent(col, row, tile);
        }

        // Draw decoration
        if (tile.decoration) {
          const decoData = DECORATIONS_DATA[tile.decoration];
          if (decoData) {
            r.drawOnTile(col, row, decoData.icon, 18, -4);
          }
        }
      }
    }

    // Draw trees
    s.trees.forEach(tree => {
      const tData = TREES_DATA[tree.typeId];
      if (!tData) return;
      const emoji = tData.stages[tree.stage] || tData.stages[0];
      r.drawOnTile(tree.col, tree.row, emoji, 22, -8);

      if (tree.fruitReady) {
        r.drawSparkle(tree.col, tree.row);
        r.drawLabelOnTile(tree.col, tree.row, '🍎 Ready!', 'rgba(76,175,80,0.9)', 'white', 14);
      }
    });

    // Draw buildings
    s.buildings.forEach(building => {
      const bldData = BUILDINGS_DATA[building.typeId];
      if (!bldData) return;

      r.drawOnTile(building.col, building.row, bldData.icon, 24, -6);
      r.drawLabelOnTile(building.col, building.row, bldData.name, 'rgba(62,39,35,0.8)', 'white', 14);

      const hasComplete = building.production?.some(p => p?.complete);
      if (hasComplete) {
        r.drawSparkle(building.col, building.row);
      }
    });

    // Draw animal pens
    const drawnPens = new Set();
    s.animals.forEach(animal => {
      if (!animal.penId) return;
      const penTile = this.findPenTile(animal.penId);
      if (!penTile) return;

      if (!drawnPens.has(animal.penId)) {
        drawnPens.add(animal.penId);
      }

      const aData = ANIMALS_DATA[animal.typeId];
      if (!aData) return;

      const animIdx = Math.floor(Date.now() / 800) % aData.idleFrames.length;
      r.drawOnTile(animal.col, animal.row, aData.idleFrames[animIdx], 18, -4);

      if (animal.productReady) {
        r.drawSparkle(animal.col, animal.row);
        r.drawLabelOnTile(animal.col, animal.row, aData.productIcon + ' Ready!', 'rgba(76,175,80,0.9)', 'white', 14);
      } else if (!animal.fed && !animal.productReady) {
        r.drawLabelOnTile(animal.col, animal.row, '🍽️ Hungry', 'rgba(255,152,0,0.9)', 'white', 14);
      }
    });

    // Draw pet on farm
    if (s.pet) {
      const petData = typeof PETS_DATA !== 'undefined' ? PETS_DATA[s.pet.typeId] : null;
      if (petData) {
        const petCol = 1, petRow = 1;
        const bobY = Math.sin(Date.now() / 500) * 2;
        r.drawOnTile(petCol, petRow, petData.icon, 16, -4 + bobY);
      }
    }

    // Draw hover/selection indicators
    if (this.hoverTile && !this.isDragging) {
      const { row, col } = this.hoverTile;
      if (this.state.isValidTile(row, col)) {
        if (this.placementItem) {
          const valid = this.canPlaceAt(row, col);
          r.drawPlacementIndicator(col, row, valid);
        } else {
          r.drawTileHighlight(col, row);
        }

        this.renderTileTooltip(row, col);
      }
    }

    // Draw particles
    r.updateParticles();

    // Draw day/night overlay
    r.drawDayNightOverlay();

    // Restore from screen shake
    if (this.screenShake.intensity > 0.1) {
      r.ctx.restore();
    }
  }

  renderTileContent(col, row, tile) {
    const r = this.renderer;
    const content = tile.content;

    if (content.type === 'crop') {
      const cropData = CROPS_DATA[content.cropId];
      if (!cropData) return;

      if (content.withered) {
        r.drawOnTile(col, row, '🥀', 18, -4);
        r.drawLabelOnTile(col, row, 'Withered', 'rgba(244,67,54,0.9)', 'white', 14);
      } else {
        const emoji = cropData.stages[content.stage] || cropData.stages[0];
        r.drawOnTile(col, row, emoji, 18, -4);

        const elapsed = Utils.now() - content.plantedAt;
        const timeReduction = this.mastery.getTimeReduction(content.cropId);
        const totalTime = cropData.growthTime * (1 - timeReduction);

        if (elapsed >= totalTime && !content.withered) {
          r.drawSparkle(col, row);
          r.drawLabelOnTile(col, row, 'Ready!', 'rgba(76,175,80,0.9)', 'white', 14);
        } else if (elapsed < totalTime) {
          const progress = elapsed / totalTime;
          r.drawProgressOnTile(col, row, progress, '#4CAF50', 16);
          const remaining = totalTime - elapsed;
          r.drawLabelOnTile(col, row, Utils.formatTime(remaining), 'rgba(0,0,0,0.6)', 'white', 22);
        }
      }
    } else if (content.type === 'pen') {
      const penData = ANIMAL_PENS_DATA[content.penTypeId];
      if (penData) {
        r.drawOnTile(col, row, penData.icon, 22, -6);
        r.drawLabelOnTile(col, row, penData.name, 'rgba(62,39,35,0.8)', 'white', 14);
      }
    }
  }

  renderTileTooltip(row, col) {
    const tile = this.state.getTile(row, col);
    if (!tile) return;

    let info = '';
    if (tile.content) {
      if (tile.content.type === 'crop') {
        const cd = CROPS_DATA[tile.content.cropId];
        if (cd) {
          const elapsed = Utils.now() - tile.content.plantedAt;
          const timeReduction = this.mastery.getTimeReduction(tile.content.cropId);
          const totalTime = cd.growthTime * (1 - timeReduction);
          if (tile.content.withered) {
            info = `${cd.icon} ${cd.name} — Withered! Click to clear.`;
          } else if (elapsed >= totalTime) {
            info = `${cd.icon} ${cd.name} — Ready to harvest!`;
          } else {
            info = `${cd.icon} ${cd.name} — ${Utils.formatTime(totalTime - elapsed)}`;
          }
        }
      } else if (tile.content.type === 'pen') {
        const pd = ANIMAL_PENS_DATA[tile.content.penTypeId];
        if (pd) info = `${pd.icon} ${pd.name} — Click to manage`;
      }
    } else if (tile.type === 'plowed') {
      info = 'Empty plot — ready to plant!';
    } else if (tile.type === 'grass') {
      info = 'Grass — click to plow for planting';
    }

    const tooltipEl = document.getElementById('tile-tooltip');
    if (tooltipEl) {
      if (info) {
        tooltipEl.textContent = info;
        tooltipEl.style.display = 'block';
      } else {
        tooltipEl.style.display = 'none';
      }
    }
  }

  // ==================== INPUT HANDLING ====================
  setupInput() {
    const canvas = this.canvas;

    canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY, e));
    canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY, e));
    canvas.addEventListener('mouseup', (e) => this.onPointerUp(e.clientX, e.clientY, e));
    canvas.addEventListener('wheel', (e) => this.onWheel(e));

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      Audio.init();
      if (e.touches.length === 1) {
        this.onPointerDown(e.touches[0].clientX, e.touches[0].clientY, e);
      } else if (e.touches.length === 2) {
        this.pinchDist = this.getTouchDist(e.touches);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
      } else if (e.touches.length === 2 && this.pinchDist) {
        const newDist = this.getTouchDist(e.touches);
        const scale = newDist / this.pinchDist;
        this.renderer.scale = Utils.clamp(this.renderer.scale * scale, 0.4, 2.5);
        this.pinchDist = newDist;
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (e.changedTouches.length > 0) {
        this.onPointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e);
      }
      this.pinchDist = null;
    }, { passive: false });

    this.setupHUDButtons();
  }

  getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onPointerDown(x, y, e) {
    this.isDragging = false;
    this.dragStart = { x, y };
    this.lastDragPos = { x, y };
  }

  onPointerMove(x, y, e) {
    const grid = this.renderer.screenToGrid(x, y);
    this.hoverTile = { row: grid.y, col: grid.x };

    if (this.dragStart) {
      const dx = x - this.dragStart.x;
      const dy = y - this.dragStart.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.isDragging = true;
      }

      if (this.isDragging && this.lastDragPos) {
        this.renderer.offsetX += x - this.lastDragPos.x;
        this.renderer.offsetY += y - this.lastDragPos.y;
      }
      this.lastDragPos = { x, y };
    }
  }

  onPointerUp(x, y, e) {
    if (!this.isDragging) {
      const grid = this.renderer.screenToGrid(x, y);
      this.handleTileClick(grid.y, grid.x, x, y);
    }
    this.isDragging = false;
    this.dragStart = null;
    this.lastDragPos = null;
  }

  onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    this.renderer.scale = Utils.clamp(this.renderer.scale * delta, 0.4, 2.5);
  }

  // ==================== TILE INTERACTION ====================
  handleTileClick(row, col, screenX, screenY) {
    if (this.panels.isOpen()) return;
    if (!this.state.isValidTile(row, col)) return;

    const tile = this.state.getTile(row, col);
    if (!tile) return;

    const s = this.state.get();
    Audio.sfx('click');

    const tree = s.trees.find(t => t.row === row && t.col === col);
    if (tree) {
      this.handleTreeClick(tree, screenX, screenY);
      return;
    }

    const building = s.buildings.find(b => b.row === row && b.col === col);
    if (building) {
      this.panels.open('building', { building });
      return;
    }

    if (tile.content && tile.content.type === 'pen') {
      const penId = tile.content.penId;
      const pen = { id: penId, typeId: tile.content.penTypeId, row, col };
      this.panels.open('animal_pen', { pen });
      return;
    }

    const animal = s.animals.find(a => a.row === row && a.col === col);
    if (animal) {
      this.handleAnimalClick(animal, screenX, screenY);
      return;
    }

    if (this.placementItem) {
      this.handlePlacement(row, col, screenX, screenY);
      return;
    }

    if (this.selectedCrop) {
      this.plantCrop(row, col, screenX, screenY);
      return;
    }

    if (this.selectedTree) {
      this.plantTree(row, col, screenX, screenY);
      return;
    }

    if (tile.content && tile.content.type === 'crop') {
      if (tile.content.withered) {
        this.clearWithered(row, col, screenX, screenY);
      } else {
        const cropData = CROPS_DATA[tile.content.cropId];
        if (cropData) {
          const elapsed = Utils.now() - tile.content.plantedAt;
          const timeReduction = this.mastery.getTimeReduction(tile.content.cropId);
          const totalTime = cropData.growthTime * (1 - timeReduction);
          if (elapsed >= totalTime) {
            this.harvestCrop(row, col, screenX, screenY);
          }
        }
      }
    } else if (tile.type === 'grass' && !tile.content && !tile.decoration) {
      this.plowTile(row, col, screenX, screenY);
    } else if (tile.type === 'plowed' && !tile.content) {
      this.panels.open('shop');
    }
  }

  // ==================== CROP SYSTEM ====================
  selectCropToPlant(cropId) {
    this.selectedCrop = cropId;
    this.selectedTree = null;
    this.placementItem = null;
    this.selectedAnimal = null;
    this.setTool('plant');
    const crop = CROPS_DATA[cropId];
    this.notify.info(`Selected ${crop.icon} ${crop.name}. Click plowed plots to plant!`);
  }

  plantCrop(row, col, screenX, screenY) {
    const tile = this.state.getTile(row, col);
    if (!tile || tile.type !== 'plowed' || tile.content) {
      this.notify.warn('Can only plant on empty plowed plots!');
      return;
    }

    const cropData = CROPS_DATA[this.selectedCrop];
    if (!cropData) return;

    if (this.state.get().player.level < cropData.unlockLevel) {
      this.notify.warn(`Reach Level ${cropData.unlockLevel} to plant ${cropData.name}!`);
      return;
    }

    if (!this.state.spendCoins(cropData.cost)) {
      this.notify.error('Not enough coins!');
      Audio.sfx('error');
      return;
    }

    if (!this.state.useEnergy(1)) {
      this.notify.warn('Not enough energy! Wait for it to regenerate.');
      Audio.sfx('error');
      return;
    }

    tile.content = {
      type: 'crop',
      cropId: this.selectedCrop,
      plantedAt: Utils.now(),
      stage: 0,
      withered: false
    };

    this.state.get().statistics.cropsPlanted++;
    Audio.sfx('plant');
    this.notify.showLoss(`-${cropData.cost}🪙`, screenX, screenY);

    this.updateQuestProgress('plant', this.selectedCrop, 1);
    this.updateQuestProgress('plant', 'any', 1);

    const pos = this.renderer.gridToScreen(col, row);
    this.renderer.addParticle(pos.x, pos.y + 16, '🌱', 3);

    this.state.save();
  }

  harvestCrop(row, col, screenX, screenY) {
    const tile = this.state.getTile(row, col);
    if (!tile || !tile.content || tile.content.type !== 'crop') return;

    const cropData = CROPS_DATA[tile.content.cropId];
    if (!cropData) return;

    // Check if ready (with mastery reduction + guild speed)
    const elapsed = Utils.now() - tile.content.plantedAt;
    const timeReduction = this.mastery.getTimeReduction(tile.content.cropId);
    const guildSpeedBonus = this.guild.getPerkBonus('growthSpeed');
    const totalTime = cropData.growthTime * (1 - timeReduction) * (1 - guildSpeedBonus);
    if (elapsed < totalTime) {
      this.notify.warn(`${cropData.name} isn't ready yet!`);
      return;
    }

    if (!this.state.useEnergy(1)) {
      this.notify.warn('Not enough energy!');
      Audio.sfx('error');
      return;
    }

    // Check double harvest chance from mastery
    let harvestQty = 1;
    const doubleChance = this.mastery.getDoubleChance(tile.content.cropId);
    if (doubleChance > 0 && Math.random() < doubleChance) {
      harvestQty = 2;
    }

    if (!this.state.addItem(tile.content.cropId, harvestQty)) {
      this.notify.error('Barn is full! Sell items or upgrade.');
      Audio.sfx('error');
      return;
    }

    // Apply combo + frenzy + guild multiplier to XP
    const totalMult = this.getTotalMultiplier();
    const guildXpBonus = 1 + this.guild.getPerkBonus('xpBoost');
    const xpGain = Math.floor(cropData.xp * totalMult * guildXpBonus);
    const levelUps = this.state.addXP(xpGain);

    // Save cropId before clearing
    const harvestedCropId = tile.content.cropId;
    tile.content = null;

    // Stats
    this.state.get().statistics.cropsHarvested += harvestQty;
    this.state.get().player.totalCropsHarvested = (this.state.get().player.totalCropsHarvested || 0) + harvestQty;

    // Mastery tracking
    this.mastery.addHarvest(harvestedCropId);

    // Collection drop roll
    this.collections.rollForDrop('harvest');

    // Combo tracking
    this.addCombo();

    // Deal raid damage on harvest
    this.guild.dealRaidDamage(cropData.xp * 2);

    // Effects - more particles for higher combos
    Audio.sfx('harvest');
    this.notify.showXP(xpGain, screenX, screenY);
    if (harvestQty > 1) {
      this.notify.toast(`Double harvest! x${harvestQty}`, 'reward');
    }
    const pos = this.renderer.gridToScreen(col, row);
    const particleCount = 5 + Math.min(this.combo.tier * 3, 12);
    this.renderer.addParticle(pos.x, pos.y + 16, cropData.icon, particleCount);

    // Screen shake on combos
    if (this.combo.count >= 5) {
      this.addScreenShake(1 + this.combo.tier);
    }

    // Quest progress
    this.updateQuestProgress('harvest', harvestedCropId, harvestQty);
    this.updateQuestProgress('harvest', 'any', harvestQty);

    // Level up check
    levelUps.forEach(lu => this.handleLevelUp(lu));

    // Achievement check
    this.checkAchievements();

    this.state.save();
  }

  clearWithered(row, col, screenX, screenY) {
    const tile = this.state.getTile(row, col);
    if (!tile || !tile.content || !tile.content.withered) return;

    const cost = 5;
    if (!this.state.spendCoins(cost)) {
      this.notify.error('Not enough coins to clear!');
      return;
    }

    tile.content = null;
    Audio.sfx('wither');
    this.notify.showLoss(`-${cost}🪙`, screenX, screenY);
    this.state.save();
  }

  plowTile(row, col, screenX, screenY) {
    const tile = this.state.getTile(row, col);
    if (!tile || tile.type !== 'grass' || tile.content || tile.decoration) return;

    if (!this.state.useEnergy(1)) {
      this.notify.warn('Not enough energy!');
      return;
    }

    tile.type = 'plowed';
    Audio.sfx('plant');

    const pos = this.renderer.gridToScreen(col, row);
    this.renderer.addParticle(pos.x, pos.y + 16, '🟫', 2);
    this.state.save();
  }

  // Harvest all ready crops
  harvestAll() {
    const s = this.state.get();
    let count = 0;

    for (const [key, tile] of Object.entries(s.farm.tiles)) {
      if (tile.content && tile.content.type === 'crop' && !tile.content.withered) {
        const cropData = CROPS_DATA[tile.content.cropId];
        if (!cropData) continue;
        const elapsed = Utils.now() - tile.content.plantedAt;
        const timeReduction = this.mastery.getTimeReduction(tile.content.cropId);
        const totalTime = cropData.growthTime * (1 - timeReduction);
        if (elapsed >= totalTime) {
          let qty = 1;
          const doubleChance = this.mastery.getDoubleChance(tile.content.cropId);
          if (doubleChance > 0 && Math.random() < doubleChance) qty = 2;

          if (this.state.addItem(tile.content.cropId, qty)) {
            const totalMult = this.getTotalMultiplier();
            const xpGain = Math.floor(cropData.xp * totalMult);
            const levelUps = this.state.addXP(xpGain);
            const cropId = tile.content.cropId;
            tile.content = null;
            s.statistics.cropsHarvested += qty;
            count += qty;
            this.mastery.addHarvest(cropId);
            this.collections.rollForDrop('harvest');
            this.addCombo();
            this.updateQuestProgress('harvest', cropId, qty);
            this.updateQuestProgress('harvest', 'any', qty);
            levelUps.forEach(lu => this.handleLevelUp(lu));
          }
        }
      }
    }

    if (count > 0) {
      Audio.sfx('harvest');
      this.notify.reward(`Harvested ${count} crops!`);
      this.checkAchievements();
      this.state.save();
    } else {
      this.notify.info('No crops ready to harvest.');
    }
  }

  // Plant all empty plowed plots with selected crop
  plantAll() {
    if (!this.selectedCrop) {
      this.notify.warn('Select a crop first from the shop!');
      return;
    }

    const s = this.state.get();
    const cropData = CROPS_DATA[this.selectedCrop];
    if (!cropData) return;

    let count = 0;
    for (const [key, tile] of Object.entries(s.farm.tiles)) {
      if (tile.type === 'plowed' && !tile.content) {
        if (s.player.coins < cropData.cost) break;
        if (s.player.energy < 1) break;

        this.state.spendCoins(cropData.cost);
        this.state.useEnergy(1);
        tile.content = {
          type: 'crop',
          cropId: this.selectedCrop,
          plantedAt: Utils.now(),
          stage: 0,
          withered: false
        };
        s.statistics.cropsPlanted++;
        count++;
        this.updateQuestProgress('plant', this.selectedCrop, 1);
        this.updateQuestProgress('plant', 'any', 1);
      }
    }

    if (count > 0) {
      Audio.sfx('plant');
      this.notify.reward(`Planted ${count} ${cropData.name}!`);
      this.state.save();
    } else {
      this.notify.warn('No empty plowed plots available!');
    }
  }

  // ==================== TREE SYSTEM ====================
  selectTreeToPlant(treeId) {
    this.selectedTree = treeId;
    this.selectedCrop = null;
    this.placementItem = null;
    this.selectedAnimal = null;
    this.setTool('plant');
    const tree = TREES_DATA[treeId];
    this.notify.info(`Selected ${tree.icon} ${tree.name}. Click a grass tile to plant!`);
  }

  plantTree(row, col, screenX, screenY) {
    const tile = this.state.getTile(row, col);
    if (!tile || tile.content || tile.decoration) {
      this.notify.warn('This spot is occupied!');
      return;
    }

    const treeData = TREES_DATA[this.selectedTree];
    if (!treeData) return;

    if (!this.state.spendCoins(treeData.cost)) {
      this.notify.error('Not enough coins!');
      Audio.sfx('error');
      return;
    }

    const s = this.state.get();
    s.trees.push({
      id: Utils.uid(),
      typeId: this.selectedTree,
      row, col,
      plantedAt: Utils.now(),
      stage: 0,
      mature: false,
      fruitReady: false,
      lastHarvest: null
    });

    tile.content = { type: 'tree' };
    s.statistics.treesPlanted++;

    Audio.sfx('plant');
    this.notify.showLoss(`-${treeData.cost}🪙`, screenX, screenY);
    this.updateQuestProgress('plant_tree', this.selectedTree, 1);

    const pos = this.renderer.gridToScreen(col, row);
    this.renderer.addParticle(pos.x, pos.y + 16, '🌱', 3);

    this.selectedTree = null;
    this.setTool('select');
    this.state.save();
  }

  handleTreeClick(tree, screenX, screenY) {
    if (tree.fruitReady) {
      const tData = TREES_DATA[tree.typeId];
      if (!tData) return;

      if (!this.state.addItem(tree.typeId, 1)) {
        this.notify.error('Barn is full!');
        return;
      }

      const levelUps = this.state.addXP(tData.xpPerHarvest);
      tree.fruitReady = false;
      tree.lastHarvest = Utils.now();

      Audio.sfx('harvest');
      this.notify.showXP(tData.xpPerHarvest, screenX, screenY);

      const pos = this.renderer.gridToScreen(tree.col, tree.row);
      this.renderer.addParticle(pos.x, pos.y + 16, tData.fruitIcon, 5);

      this.updateQuestProgress('harvest_tree', tree.typeId, 1);
      this.collections.rollForDrop('tree_harvest');
      levelUps.forEach(lu => this.handleLevelUp(lu));
      this.state.save();
    }
  }

  // ==================== ANIMAL SYSTEM ====================
  selectAnimalToBuy(animalId) {
    this.selectedAnimal = animalId;
    this.selectedCrop = null;
    this.selectedTree = null;
    this.placementItem = null;
    this.setTool('select');

    const aData = ANIMALS_DATA[animalId];
    const penType = aData.penType;
    const penData = ANIMAL_PENS_DATA[penType];

    const s = this.state.get();
    const availablePens = [];
    for (const [key, tile] of Object.entries(s.farm.tiles)) {
      if (tile.content && tile.content.type === 'pen' && tile.content.penTypeId === penType) {
        const penId = tile.content.penId;
        const animalsInPen = s.animals.filter(a => a.penId === penId).length;
        if (animalsInPen < penData.capacity) {
          availablePens.push({ key, tile, penId });
        }
      }
    }

    if (availablePens.length === 0) {
      this.notify.warn(`Build a ${penData.name} first!`);
      this.selectedAnimal = null;
      return;
    }

    if (!this.state.spendCoins(aData.cost)) {
      this.notify.error('Not enough coins!');
      this.selectedAnimal = null;
      Audio.sfx('error');
      return;
    }

    const pen = availablePens[0];
    const [pRow, pCol] = pen.key.split(',').map(Number);

    s.animals.push({
      id: Utils.uid(),
      typeId: animalId,
      penId: pen.penId,
      row: pRow,
      col: pCol,
      fed: false,
      fedAt: null,
      productReady: false,
      happiness: 100
    });

    s.statistics.totalAnimalsRaised = (s.statistics.totalAnimalsRaised || 0) + 1;
    Audio.sfx('buy');
    this.notify.reward(`Bought a ${aData.icon} ${aData.name}!`);
    this.updateQuestProgress('buy_animal', animalId, 1);
    this.checkAchievements();

    this.selectedAnimal = null;
    this.state.save();
  }

  feedAnimal(animal) {
    const aData = ANIMALS_DATA[animal.typeId];
    if (!aData) return;

    for (const [item, qty] of Object.entries(aData.feedRequired)) {
      if (!this.state.hasItem(item, qty)) {
        this.notify.error(`Need ${qty} ${CROPS_DATA[item]?.name || item}!`);
        Audio.sfx('error');
        return;
      }
    }

    for (const [item, qty] of Object.entries(aData.feedRequired)) {
      this.state.removeItem(item, qty);
    }

    if (!this.state.useEnergy(1)) {
      this.notify.warn('Not enough energy!');
      return;
    }

    animal.fed = true;
    animal.fedAt = Utils.now();
    animal.productReady = false;

    this.state.get().statistics.animalsFed++;
    Audio.sfx('feed');
    this.notify.info(`Fed ${aData.icon} ${aData.name}!`);
    this.updateQuestProgress('feed_animal', animal.typeId, 1);
    this.updateQuestProgress('feed_animal', 'any', 1);
    this.state.save();
  }

  collectAnimalProduct(animal) {
    const aData = ANIMALS_DATA[animal.typeId];
    if (!aData || !aData.product || !animal.productReady) return;

    if (!this.state.addItem(aData.product, aData.productQuantity)) {
      this.notify.error('Barn is full!');
      Audio.sfx('error');
      return;
    }

    const levelUps = this.state.addXP(aData.productValue / 2);
    animal.productReady = false;
    animal.fed = false;

    const s = this.state.get();
    s.statistics.productsCollected++;
    // Track specific product stats
    if (aData.product === 'eggs') {
      s.statistics.eggsCollected = (s.statistics.eggsCollected || 0) + aData.productQuantity;
    }

    Audio.sfx('collect');
    this.notify.reward(`Collected ${aData.productIcon} ${aData.productName} x${aData.productQuantity}!`);
    this.updateQuestProgress('collect_product', aData.product, aData.productQuantity);
    this.updateQuestProgress('collect_product', 'any', aData.productQuantity);

    // Roll for collectible drops
    this.collections.rollForDrop('collect');

    levelUps.forEach(lu => this.handleLevelUp(lu));
    this.checkAchievements();
    this.state.save();
  }

  handleAnimalClick(animal, screenX, screenY) {
    if (animal.productReady) {
      this.collectAnimalProduct(animal);
    } else {
      const s = this.state.get();
      for (const [key, tile] of Object.entries(s.farm.tiles)) {
        if (tile.content && tile.content.type === 'pen' && tile.content.penId === animal.penId) {
          const pen = { id: animal.penId, typeId: tile.content.penTypeId, row: animal.row, col: animal.col };
          this.panels.open('animal_pen', { pen });
          return;
        }
      }
    }
  }

  findPenTile(penId) {
    const s = this.state.get();
    for (const [key, tile] of Object.entries(s.farm.tiles)) {
      if (tile.content && tile.content.type === 'pen' && tile.content.penId === penId) {
        const [r, c] = key.split(',').map(Number);
        return { row: r, col: c };
      }
    }
    return null;
  }

  // ==================== BUILDING SYSTEM ====================
  selectBuildingToPlace(type, id) {
    this.placementItem = { type, id };
    this.selectedCrop = null;
    this.selectedTree = null;
    this.selectedAnimal = null;
    this.setTool('build');

    const name = type === 'pen'
      ? ANIMAL_PENS_DATA[id]?.name
      : BUILDINGS_DATA[id]?.name;
    this.notify.info(`Click a tile to place ${name}!`);
  }

  selectDecorationToPlace(id) {
    this.placementItem = { type: 'decoration', id };
    this.selectedCrop = null;
    this.selectedTree = null;
    this.setTool('build');
    this.notify.info(`Click a tile to place ${DECORATIONS_DATA[id]?.name}!`);
  }

  canPlaceAt(row, col) {
    if (!this.state.isValidTile(row, col)) return false;
    const tile = this.state.getTile(row, col);
    if (!tile) return false;
    if (tile.content) return false;
    if (this.placementItem?.type === 'decoration') {
      return !tile.decoration;
    }
    return true;
  }

  handlePlacement(row, col, screenX, screenY) {
    if (!this.canPlaceAt(row, col)) {
      this.notify.warn('Can\'t place here!');
      Audio.sfx('error');
      return;
    }

    const item = this.placementItem;
    const s = this.state.get();

    if (item.type === 'pen') {
      const penData = ANIMAL_PENS_DATA[item.id];
      if (!penData) return;

      if (!this.state.spendCoins(penData.cost)) {
        this.notify.error('Not enough coins!');
        Audio.sfx('error');
        return;
      }

      const penId = Utils.uid();
      const tile = this.state.getTile(row, col);
      tile.content = {
        type: 'pen',
        penTypeId: item.id,
        penId: penId,
        builtAt: Utils.now()
      };

      s.statistics.buildingsBuilt++;
      Audio.sfx('build');
      this.notify.reward(`Built ${penData.icon} ${penData.name}!`);
      this.updateQuestProgress('build', item.id, 1);

    } else if (item.type === 'production') {
      const bldData = BUILDINGS_DATA[item.id];
      if (!bldData) return;

      if (!this.state.spendCoins(bldData.cost)) {
        this.notify.error('Not enough coins!');
        Audio.sfx('error');
        return;
      }

      s.buildings.push({
        id: Utils.uid(),
        typeId: item.id,
        row, col,
        slots: bldData.maxSlots,
        production: new Array(bldData.maxSlots).fill(null),
        builtAt: Utils.now()
      });

      const tile = this.state.getTile(row, col);
      tile.content = { type: 'building' };

      s.statistics.buildingsBuilt++;
      Audio.sfx('build');
      this.notify.reward(`Built ${bldData.icon} ${bldData.name}!`);
      this.updateQuestProgress('build', item.id, 1);

    } else if (item.type === 'decoration') {
      const decoData = DECORATIONS_DATA[item.id];
      if (!decoData) return;

      if (decoData.costType === 'gems') {
        if (!this.state.spendGems(decoData.cost)) {
          this.notify.error('Not enough gems!');
          Audio.sfx('error');
          return;
        }
      } else {
        if (!this.state.spendCoins(decoData.cost)) {
          this.notify.error('Not enough coins!');
          Audio.sfx('error');
          return;
        }
      }

      const tile = this.state.getTile(row, col);
      tile.decoration = item.id;
      s.statistics.decorationsPlaced = (s.statistics.decorationsPlaced || 0) + 1;

      Audio.sfx('buy');
      this.notify.reward(`Placed ${decoData.icon} ${decoData.name}!`);
    }

    this.placementItem = null;
    this.setTool('select');
    this.checkAchievements();
    this.state.save();
  }

  // ==================== PRODUCTION SYSTEM ====================
  startProduction(building, slotIndex, recipeId) {
    const bldData = BUILDINGS_DATA[building.typeId];
    if (!bldData) return;
    const recipe = bldData.recipes[recipeId];
    if (!recipe) return;

    for (const [item, qty] of Object.entries(recipe.ingredients)) {
      if (!this.state.hasItem(item, qty)) {
        this.notify.error(`Need more ${item}!`);
        return;
      }
    }

    for (const [item, qty] of Object.entries(recipe.ingredients)) {
      this.state.removeItem(item, qty);
    }

    building.production[slotIndex] = {
      recipeId: recipeId,
      startedAt: Utils.now(),
      complete: false
    };

    Audio.sfx('build');
    this.notify.info(`Started producing ${recipe.icon} ${recipe.name}!`);
    this.state.save();
  }

  collectProduction(building, slotIndex) {
    const prod = building.production[slotIndex];
    if (!prod || !prod.complete) return;

    const bldData = BUILDINGS_DATA[building.typeId];
    const recipe = bldData.recipes[prod.recipeId];
    if (!recipe) return;

    if (!this.state.addItem(recipe.id, 1)) {
      this.notify.error('Barn is full!');
      return;
    }

    const levelUps = this.state.addXP(recipe.xp);
    building.production[slotIndex] = null;

    const s = this.state.get();
    s.statistics.itemsProduced++;
    s.statistics.bakeryProduced = (s.statistics.bakeryProduced || 0) + 1;

    Audio.sfx('collect');
    this.notify.reward(`Produced ${recipe.icon} ${recipe.name}!`);
    this.updateQuestProgress('produce', recipe.id, 1);
    this.updateQuestProgress('produce', 'any', 1);

    this.collections.rollForDrop('produce');
    levelUps.forEach(lu => this.handleLevelUp(lu));
    this.checkAchievements();
    this.state.save();
  }

  // ==================== ECONOMY ====================
  sellItem(itemId, quantity = 1) {
    const info = this.panels.getItemInfo(itemId);
    if (!info) return;

    const actual = Math.min(quantity, this.state.getItemCount(itemId));
    if (actual <= 0) return;

    this.state.removeItem(itemId, actual);

    // Apply mastery sell bonus + market price + frenzy/combo + guild
    const masteryBonus = this.mastery.getSellBonus(itemId);
    const basePrice = info.sellPrice;
    const marketPrice = this.market.getModifiedPrice(itemId, basePrice);
    const totalMult = this.getTotalMultiplier();
    const guildCoinBonus = 1 + this.guild.getPerkBonus('coinBoost');
    const finalPrice = Math.floor(marketPrice * (1 + masteryBonus) * totalMult * guildCoinBonus);
    const total = finalPrice * actual;

    this.state.addCoins(total);
    this.recordCoinEarning(total);

    // Combo on sells too
    this.addCombo();

    this.state.get().statistics.itemsSold += actual;
    this.state.get().player.totalItemsSold = (this.state.get().player.totalItemsSold || 0) + actual;
    Audio.sfx('sell');
    const multStr = totalMult > 1 ? ` (${Utils.formatMultiplier(totalMult)})` : '';
    this.notify.toast(`Sold ${info.icon} ${info.name} x${actual} for 🪙${Utils.formatNumber(total)}!${multStr}`, 'reward');

    this.updateQuestProgress('sell', itemId, actual);
    this.updateQuestProgress('sell', 'any', actual);
    this.updateQuestProgress('earn_coins', 'any', total);

    this.checkAchievements();
    this.state.save();
  }

  sellAll() {
    const inv = this.state.get().inventory.items;
    let totalCoins = 0;
    let totalItems = 0;

    const totalMult = this.getTotalMultiplier();

    const guildCoinBonus = 1 + this.guild.getPerkBonus('coinBoost');

    for (const [id, qty] of Object.entries({ ...inv })) {
      const info = this.panels.getItemInfo(id);
      if (!info) continue;
      const masteryBonus = this.mastery.getSellBonus(id);
      const marketPrice = this.market.getModifiedPrice(id, info.sellPrice);
      const finalPrice = Math.floor(marketPrice * (1 + masteryBonus) * totalMult * guildCoinBonus);
      totalCoins += finalPrice * qty;
      totalItems += qty;
      this.updateQuestProgress('sell', id, qty);
      this.updateQuestProgress('sell', 'any', qty);
    }

    if (totalItems === 0) {
      this.notify.info('Nothing to sell!');
      return;
    }

    this.state.get().inventory.items = {};
    this.state.addCoins(totalCoins);
    this.recordCoinEarning(totalCoins);

    this.state.get().statistics.itemsSold += totalItems;
    this.updateQuestProgress('earn_coins', 'any', totalCoins);

    Audio.sfx('sell');
    const multStr = totalMult > 1 ? ` (${Utils.formatMultiplier(totalMult)})` : '';
    this.notify.reward(`Sold everything for 🪙${Utils.formatNumber(totalCoins)}!${multStr}`);

    // Coin shower for big sells
    if (totalCoins >= 100) {
      this.renderer.addCoinShower(this.renderer.screenW / 2, this.renderer.screenH / 2, Math.min(25, Math.floor(totalCoins / 50)));
      this.addScreenShake(Math.min(8, totalCoins / 200));
    }

    this.checkAchievements();
    this.state.save();
  }

  upgradeBarn(cost) {
    if (!this.state.spendCoins(cost)) {
      this.notify.error('Not enough coins!');
      Audio.sfx('error');
      return;
    }
    this.state.get().inventory.capacity += 10;
    Audio.sfx('build');
    this.notify.reward('Barn expanded! +10 slots');
    this.state.save();
  }

  buyExpansion(expansion) {
    if (!this.state.spendCoins(expansion.cost)) {
      this.notify.error('Not enough coins!');
      Audio.sfx('error');
      return;
    }

    this.state.expandFarm(expansion);
    this.renderer.centerOn(this.state.get().farm.rows, this.state.get().farm.cols);

    Audio.sfx('build');
    this.notify.reward(`🗺️ Farm expanded: ${expansion.label}!`);
    this.updateQuestProgress('expand_land', 'any', 1);
    this.checkAchievements();
    this.state.save();
  }

  // ==================== XP & LEVELING ====================
  handleLevelUp(levelUp) {
    const { level, rewards } = levelUp;
    Audio.sfx('levelup');
    this.notify.levelUp(level);

    if (rewards.coins) {
      this.state.addCoins(rewards.coins);
      this.recordCoinEarning(rewards.coins);
      this.notify.toast(`🪙 +${Utils.formatNumber(rewards.coins)} coins!`, 'reward');
    }
    if (rewards.gems) {
      this.state.addGems(rewards.gems);
      this.notify.toast(`💎 +${rewards.gems} gems!`, 'reward');
    }

    this.checkUnlocks(level);
    this.updateQuestProgress('reach_level', level, 1);
    this.checkMainQuests();
    this.checkAchievements();

    this.state.save();
  }

  checkUnlocks(level) {
    const unlocked = [];
    Object.values(CROPS_DATA).forEach(c => {
      if (c.unlockLevel === level) unlocked.push(`${c.icon} ${c.name}`);
    });
    Object.values(ANIMALS_DATA).forEach(a => {
      if (a.unlockLevel === level) unlocked.push(`${a.icon} ${a.name}`);
    });
    Object.values(BUILDINGS_DATA).forEach(b => {
      if (b.unlockLevel === level) unlocked.push(`${b.icon} ${b.name}`);
    });
    Object.values(TREES_DATA).forEach(t => {
      if (t.unlockLevel === level) unlocked.push(`${t.icon} ${t.name}`);
    });

    if (unlocked.length > 0) {
      Audio.sfx('unlock');
      this.notify.toast(`New unlocks: ${unlocked.join(', ')}`, 'reward');
    }
  }

  // ==================== ACHIEVEMENT SYSTEM ====================
  checkAchievements() {
    this.achievements.check();
  }

  // ==================== QUEST SYSTEM ====================
  updateQuestProgress(actionType, target, count) {
    const s = this.state.get();

    for (const [qId, qProgress] of Object.entries(s.quests.active)) {
      const qData = QUESTS_DATA[qId];
      if (!qData) continue;

      qData.objectives.forEach((obj, idx) => {
        if (obj.type === actionType) {
          if (obj.target === target || obj.target === 'any' ||
              (actionType === 'reach_level' && target >= obj.target)) {
            if (!qProgress.progress[idx]) qProgress.progress[idx] = 0;
            qProgress.progress[idx] += count;
          }
        }
      });
    }

    if (s.quests.dailyQuests) {
      s.quests.dailyQuests.forEach(dq => {
        dq.objectives.forEach((obj, idx) => {
          if (obj.type === actionType && (obj.target === target || obj.target === 'any')) {
            if (!dq.progress[idx]) dq.progress[idx] = 0;
            dq.progress[idx] += count;
          }
        });
      });
    }
  }

  isQuestComplete(questId) {
    const s = this.state.get();
    const qProgress = s.quests.active[questId];
    const qData = QUESTS_DATA[questId];
    if (!qProgress || !qData) return false;

    return qData.objectives.every((obj, idx) =>
      (qProgress.progress[idx] || 0) >= obj.count
    );
  }

  claimQuestReward(questId) {
    const s = this.state.get();
    const qData = QUESTS_DATA[questId];
    if (!qData || !this.isQuestComplete(questId)) return;

    if (qData.rewards.coins) this.state.addCoins(qData.rewards.coins);
    if (qData.rewards.xp) {
      const levelUps = this.state.addXP(qData.rewards.xp);
      levelUps.forEach(lu => this.handleLevelUp(lu));
    }
    if (qData.rewards.gems) this.state.addGems(qData.rewards.gems);

    delete s.quests.active[questId];
    s.quests.completed.push(questId);
    s.statistics.questsCompleted++;

    Audio.sfx('quest_complete');
    this.notify.questComplete(qData.title);

    if (qData.nextQuest && QUESTS_DATA[qData.nextQuest]) {
      s.quests.active[qData.nextQuest] = { progress: {}, accepted: Utils.now() };
    }

    this.checkAchievements();
    this.state.save();
  }

  claimDailyQuestReward(dailyQuest) {
    if (dailyQuest.claimed) return;

    if (dailyQuest.rewards.coins) this.state.addCoins(dailyQuest.rewards.coins);
    if (dailyQuest.rewards.xp) {
      const levelUps = this.state.addXP(dailyQuest.rewards.xp);
      levelUps.forEach(lu => this.handleLevelUp(lu));
    }

    dailyQuest.claimed = true;
    Audio.sfx('quest_complete');
    this.notify.questComplete(dailyQuest.title);

    const s = this.state.get();
    if (s.quests.dailyQuests.every(dq => dq.claimed) && !s.quests.dailyBonusClaimed) {
      s.quests.dailyBonusClaimed = true;
      const bonusCoins = 100;
      const bonusGems = 1;
      this.state.addCoins(bonusCoins);
      this.state.addGems(bonusGems);
      this.notify.reward(`🎁 Daily Bonus: 🪙${bonusCoins} + 💎${bonusGems}!`);
    }

    this.state.save();
  }

  checkDailyQuests() {
    const s = this.state.get();
    const today = new Date().toDateString();

    if (s.quests.dailyQuestsDate !== today) {
      const templates = Utils.shuffle(DAILY_QUEST_TEMPLATES).slice(0, 3);
      s.quests.dailyQuests = templates.map(t => ({
        ...Utils.deepClone(t),
        progress: {},
        claimed: false
      }));
      s.quests.dailyQuestsDate = today;
      s.quests.dailyBonusClaimed = false;
    }
  }

  checkMainQuests() {
    const s = this.state.get();
    Object.values(QUESTS_DATA).forEach(q => {
      if (q.type === 'main' &&
          !s.quests.active[q.id] &&
          !s.quests.completed.includes(q.id) &&
          (q.requiredLevel || 1) <= s.player.level) {
        const prevQuests = Object.values(QUESTS_DATA)
          .filter(pq => pq.type === 'main' && pq.nextQuest === q.id);
        const prereqMet = prevQuests.length === 0 ||
          prevQuests.some(pq => s.quests.completed.includes(pq.id));
        if (prereqMet) {
          s.quests.active[q.id] = { progress: {}, accepted: Utils.now() };
        }
      }
    });
  }

  // ==================== OFFLINE PROGRESS ====================
  calculateOfflineProgress() {
    const s = this.state.get();
    const now = Utils.now();
    const lastSave = s.timestamps.lastSave;
    const elapsed = now - lastSave;

    if (elapsed < 60) return;

    let cropsReady = 0;
    let cropsWithered = 0;
    let productsReady = 0;
    let treeFruitsReady = 0;

    for (const [key, tile] of Object.entries(s.farm.tiles)) {
      if (tile.content && tile.content.type === 'crop') {
        const cropData = CROPS_DATA[tile.content.cropId];
        if (!cropData) continue;
        const totalElapsed = now - tile.content.plantedAt;

        if (totalElapsed >= cropData.growthTime) {
          if (totalElapsed >= cropData.growthTime * 3) {
            tile.content.withered = true;
            cropsWithered++;
          } else {
            tile.content.stage = cropData.stages.length - 1;
            cropsReady++;
          }
        }
      }
    }

    s.animals.forEach(animal => {
      if (animal.fed && !animal.productReady) {
        const aData = ANIMALS_DATA[animal.typeId];
        if (aData && (now - animal.fedAt) >= aData.productionTime) {
          animal.productReady = true;
          animal.fed = false;
          productsReady++;
        }
      }
    });

    s.buildings.forEach(building => {
      building.production?.forEach((prod) => {
        if (prod && prod.recipeId && !prod.complete) {
          const bldData = BUILDINGS_DATA[building.typeId];
          const recipe = bldData?.recipes[prod.recipeId];
          if (recipe && (now - prod.startedAt) >= recipe.productionTime) {
            prod.complete = true;
            productsReady++;
          }
        }
      });
    });

    s.trees.forEach(tree => {
      const tData = TREES_DATA[tree.typeId];
      if (!tData) return;
      if ((now - tree.plantedAt) >= tData.matureTime) {
        tree.mature = true;
        tree.stage = 2;
        if (tree.lastHarvest && (now - tree.lastHarvest) >= tData.fruitCycle) {
          tree.fruitReady = true;
          treeFruitsReady++;
        }
      }
    });

    const energyBefore = s.player.energy;
    this.state.regenEnergy();
    const energyGained = s.player.energy - energyBefore;

    s.timestamps.lastLogin = now;

    if (elapsed > 300) {
      setTimeout(() => {
        this.panels.open('welcome_back', {
          cropsReady, cropsWithered, productsReady,
          treeFruitsReady, energyGained
        });
      }, 1000);
    }
  }

  // ==================== HUD ====================
  updateHUD() {
    const s = this.state.get();
    if (!s) return;

    const avatarEl = document.getElementById('hud-avatar');
    const nameEl = document.getElementById('hud-player-name');
    const levelEl = document.getElementById('hud-level');
    const xpBarEl = document.getElementById('hud-xp-bar');
    const xpTextEl = document.getElementById('hud-xp-text');
    const coinsEl = document.getElementById('hud-coins');
    const gemsEl = document.getElementById('hud-gems');
    const energyEl = document.getElementById('hud-energy');

    if (avatarEl) avatarEl.textContent = s.player.avatar.body;
    if (nameEl) nameEl.textContent = s.player.name;
    if (levelEl) levelEl.textContent = `Lv.${s.player.level}`;

    const xpProgress = this.state.getXPProgress();
    const xpNeeded = this.state.getXPForNextLevel();
    if (xpBarEl) xpBarEl.style.width = `${xpProgress * 100}%`;
    if (xpTextEl) xpTextEl.textContent = `${Math.floor(s.player.xp)} / ${xpNeeded === Infinity ? 'MAX' : xpNeeded}`;

    if (coinsEl) coinsEl.textContent = Utils.formatNumber(s.player.coins);
    if (gemsEl) gemsEl.textContent = Utils.formatNumber(s.player.gems);
    if (energyEl) energyEl.textContent = `${s.player.energy}/${s.player.maxEnergy}`;

    // CPS display
    const cpsEl = document.getElementById('hud-cps');
    if (cpsEl) {
      const cps = this.cpsTracker.current;
      cpsEl.textContent = `${Utils.formatCPS(cps)}/s`;
      cpsEl.classList.toggle('active', cps > 0);
    }

    // Combo display
    const comboEl = document.getElementById('hud-combo');
    if (comboEl) {
      if (this.combo.count >= 5) {
        comboEl.style.display = 'flex';
        comboEl.textContent = `${this.combo.count}x`;
        comboEl.className = `hud-combo tier-${this.combo.tier}`;
      } else {
        comboEl.style.display = 'none';
      }
    }

    // Combo multiplier
    const comboMultEl = document.getElementById('hud-combo-mult');
    if (comboMultEl) {
      if (this.combo.multiplier > 1) {
        comboMultEl.style.display = 'block';
        comboMultEl.textContent = Utils.formatMultiplier(this.combo.multiplier);
      } else {
        comboMultEl.style.display = 'none';
      }
    }

    // Frenzy display
    const frenzyEl = document.getElementById('hud-frenzy');
    if (frenzyEl) {
      if (this.frenzy.active) {
        frenzyEl.style.display = 'flex';
        frenzyEl.className = `hud-frenzy level-${this.frenzy.level}`;
        frenzyEl.innerHTML = `<span class="frenzy-icon">🔥</span><span class="frenzy-text">${Utils.formatMultiplier(this.frenzy.multiplier)}</span>`;
      } else {
        frenzyEl.style.display = 'none';
      }
    }

    // Quest badge
    const questBadge = document.getElementById('quest-badge');
    if (questBadge) {
      const completable = Object.keys(s.quests.active).filter(qId => this.isQuestComplete(qId)).length;
      const dailyComplete = (s.quests.dailyQuests || []).filter(dq =>
        !dq.claimed && dq.objectives.every((obj, idx) => (dq.progress[idx] || 0) >= obj.count)
      ).length;
      const total = completable + dailyComplete;
      questBadge.style.display = total > 0 ? 'flex' : 'none';
      questBadge.textContent = total;
    }

    // Orders badge
    const ordersBadge = document.getElementById('orders-badge');
    if (ordersBadge) {
      const completableOrders = this.orders.getCompletableCount();
      ordersBadge.style.display = completableOrders > 0 ? 'flex' : 'none';
      ordersBadge.textContent = completableOrders;
    }

    // Raid indicator
    const raidIndicator = document.getElementById('hud-raid');
    if (raidIndicator) {
      const raidStatus = this.guild.getRaidStatus();
      if (raidStatus) {
        raidIndicator.style.display = 'flex';
        const hpPct = Math.floor(raidStatus.hpPercent * 100);
        raidIndicator.innerHTML = `
          <span class="raid-boss-icon">${raidStatus.boss.icon}</span>
          <div class="raid-hp-bar"><div class="raid-hp-fill" style="width:${hpPct}%"></div></div>
          <span class="raid-timer">${Utils.formatTime(raidStatus.timeRemaining)}</span>
        `;
      } else {
        raidIndicator.style.display = 'none';
      }
    }

    // Tournament indicator
    const tourneyIndicator = document.getElementById('hud-tournament');
    if (tourneyIndicator) {
      const tourneyStatus = this.competition.getTournamentStatus();
      if (tourneyStatus) {
        tourneyIndicator.style.display = 'flex';
        tourneyIndicator.innerHTML = `
          <span class="tourney-icon">${tourneyStatus.type.icon}</span>
          <span class="tourney-rank">#${tourneyStatus.playerRank}</span>
          <span class="tourney-timer">${Utils.formatTime(tourneyStatus.timeRemaining)}</span>
        `;
      } else {
        tourneyIndicator.style.display = 'none';
      }
    }

    // Challenge indicator
    const challengeIndicator = document.getElementById('hud-challenge');
    if (challengeIndicator) {
      const challengeStatus = this.competition.getChallengeStatus();
      if (challengeStatus) {
        challengeIndicator.style.display = 'flex';
        const statusIcon = challengeStatus.isWinning ? '🟢' : '🔴';
        challengeIndicator.innerHTML = `
          <span>${challengeStatus.type.icon} vs ${challengeStatus.opponentName}</span>
          <span>${statusIcon} ${Utils.formatTime(challengeStatus.timeRemaining)}</span>
        `;
      } else {
        challengeIndicator.style.display = 'none';
      }
    }

    // Guild badge on nav tab
    const guildBadge = document.getElementById('guild-badge');
    if (guildBadge) {
      const guild = this.guild.ensureState();
      const hasRaid = !!guild.activeRaid;
      guildBadge.style.display = hasRaid ? 'flex' : 'none';
      if (hasRaid) guildBadge.textContent = '⚔️';
    }

    // Update FAB
    this.updateFAB();
  }

  setupHUDButtons() {
    // Context bar tool buttons (replaces old bottom toolbar)
    document.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        if (tool === 'harvest-all') {
          this.harvestAll();
        } else if (tool === 'plant-all') {
          this.plantAll();
        } else {
          this.setTool(tool);
        }
      });
    });

    // Avatar button
    document.getElementById('hud-avatar-btn')?.addEventListener('click', () => this.panels.open('avatar'));

    // More menu buttons
    document.getElementById('btn-inventory')?.addEventListener('click', () => { this.closeMoreMenu(); this.panels.open('inventory'); });
    document.getElementById('btn-orders')?.addEventListener('click', () => { this.closeMoreMenu(); this.panels.open('orders'); });
    document.getElementById('btn-achievements')?.addEventListener('click', () => { this.closeMoreMenu(); this.panels.open('achievements'); });
    document.getElementById('btn-collections')?.addEventListener('click', () => { this.closeMoreMenu(); this.panels.open('collections'); });
    document.getElementById('btn-settings')?.addEventListener('click', () => { this.closeMoreMenu(); this.panels.open('settings'); });

    // Bottom navigation tabs
    this.activeNav = 'farm';
    document.querySelectorAll('[data-nav]').forEach(tab => {
      tab.addEventListener('click', () => {
        const nav = tab.dataset.nav;
        this.handleNavTab(nav);
      });
    });

    // FAB (Floating Action Button)
    document.getElementById('fab-btn')?.addEventListener('click', () => this.handleFAB());

    // Close more menu on outside click
    document.addEventListener('click', (e) => {
      const moreMenu = document.getElementById('more-menu');
      const moreTab = document.querySelector('[data-nav="more"]');
      if (moreMenu && moreMenu.style.display !== 'none' &&
          !moreMenu.contains(e.target) && !moreTab?.contains(e.target)) {
        this.closeMoreMenu();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.panels.isOpen()) return; // Don't handle when panel is open
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'h': this.harvestAll(); break;
        case 'p': this.setTool('plant'); break;
        case 'b': this.setTool('build'); break;
        case 's': this.setTool('select'); break;
        case 'f': this.plantAll(); break;
        case '1': this.handleNavTab('farm'); break;
        case '2': this.handleNavTab('quests'); break;
        case '3': this.handleNavTab('shop'); break;
        case '4': this.handleNavTab('battle'); break;
        case '5': this.handleNavTab('social'); break;
      }
    });
  }

  handleNavTab(nav) {
    this.closeMoreMenu();

    // Update tab highlight
    document.querySelectorAll('[data-nav]').forEach(t => {
      t.classList.toggle('active', t.dataset.nav === nav);
    });

    switch (nav) {
      case 'farm':
        // Show context bar with farm tools, close any panel
        this.activeNav = 'farm';
        this.showFarmContext();
        if (this.panels.isOpen()) this.panels.close();
        break;
      case 'quests':
        this.activeNav = 'quests';
        this.panels.open('quests');
        break;
      case 'shop':
        this.activeNav = 'shop';
        this.panels.open('shop');
        break;
      case 'battle':
        this.activeNav = 'battle';
        this.panels.open('leaderboard');
        break;
      case 'social':
        this.activeNav = 'social';
        this.panels.open('guild');
        break;
      case 'more':
        this.toggleMoreMenu();
        break;
    }
  }

  showFarmContext() {
    const bar = document.getElementById('context-bar');
    if (bar) {
      bar.classList.remove('hidden');
    }
  }

  hideFarmContext() {
    const bar = document.getElementById('context-bar');
    if (bar) {
      bar.classList.add('hidden');
    }
  }

  toggleMoreMenu() {
    const menu = document.getElementById('more-menu');
    if (!menu) return;
    if (menu.style.display === 'none') {
      menu.style.display = 'block';
    } else {
      menu.style.display = 'none';
    }
  }

  closeMoreMenu() {
    const menu = document.getElementById('more-menu');
    if (menu) menu.style.display = 'none';
  }

  handleFAB() {
    // Smart action: harvest if crops ready, otherwise plant
    const s = this.state.get();
    let readyCrops = 0;
    let emptyPlots = 0;

    for (const [key, tile] of Object.entries(s.farm.tiles)) {
      if (tile.content && tile.content.type === 'crop') {
        const crop = tile.content;
        const cropData = CROPS_DATA[crop.cropId];
        if (cropData) {
          const elapsed = Utils.now() - crop.plantedAt;
          const timeReduction = this.mastery.getTimeReduction(crop.cropId);
          const guildSpeedBonus = this.guild.getPerkBonus('growthSpeed');
          const totalTime = cropData.growthTime * (1 - timeReduction) * (1 - guildSpeedBonus);
          if (elapsed >= totalTime && !crop.withered) readyCrops++;
        }
      } else if (!tile.content && !tile.building) {
        emptyPlots++;
      }
    }

    if (readyCrops > 0) {
      this.harvestAll();
    } else if (emptyPlots > 0) {
      this.plantAll();
    }
  }

  updateFAB() {
    const fab = document.getElementById('fab-btn');
    if (!fab) return;

    const s = this.state.get();
    let readyCrops = 0;
    let emptyPlots = 0;

    for (const [key, tile] of Object.entries(s.farm.tiles)) {
      if (tile.content && tile.content.type === 'crop') {
        const crop = tile.content;
        const cropData = CROPS_DATA[crop.cropId];
        if (cropData) {
          const elapsed = Utils.now() - crop.plantedAt;
          const timeReduction = this.mastery.getTimeReduction(crop.cropId);
          const guildSpeedBonus = this.guild.getPerkBonus('growthSpeed');
          const totalTime = cropData.growthTime * (1 - timeReduction) * (1 - guildSpeedBonus);
          if (elapsed >= totalTime && !crop.withered) readyCrops++;
        }
      } else if (!tile.content && !tile.building) {
        emptyPlots++;
      }
    }

    if (readyCrops > 0) {
      fab.innerHTML = '&#x1F33E;';
      fab.title = `Harvest ${readyCrops} crops`;
      fab.className = 'fab harvest';
    } else if (emptyPlots > 0) {
      fab.innerHTML = '&#x1F331;';
      fab.title = `Plant ${emptyPlots} plots`;
      fab.className = 'fab plant';
    } else {
      fab.innerHTML = '&#x1F33E;';
      fab.title = 'Quick Action';
      fab.className = 'fab';
    }
  }

  setTool(tool) {
    this.currentTool = tool;
    if (tool === 'select') {
      this.selectedCrop = null;
      this.selectedTree = null;
      this.placementItem = null;
    }
    document.querySelectorAll('[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }
}

// ==================== GLOBAL INITIALIZATION ====================
let game;

window.addEventListener('DOMContentLoaded', () => {
  game = new Game();
  game.init();
});

// Save on page close
window.addEventListener('beforeunload', () => {
  if (game && game.state) game.state.save();
});
