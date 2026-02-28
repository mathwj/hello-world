// =========================================
// Main Game Controller
// =========================================

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.state = new GameState();
    this.notify = new NotificationManager();
    this.panels = new PanelManager(this);

    // Interaction state
    this.currentTool = 'select'; // select, plant, harvest, build, demolish, move
    this.selectedCrop = null;
    this.selectedTree = null;
    this.selectedAnimal = null;
    this.placementItem = null; // { type: 'pen'|'production'|'decoration', id: ... }
    this.hoverTile = null;
    this.isDragging = false;
    this.dragStart = null;
    this.lastDragPos = null;
    this.pinchDist = null;

    // Auto-save timer
    this.saveInterval = null;
    this.lastUpdate = Utils.now();

    // Bind methods
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
  }

  // ==================== INITIALIZATION ====================
  async init() {
    const loadingBar = document.querySelector('#loading-screen .loading-bar');
    const loadingTip = document.querySelector('#loading-screen .loading-tip');

    const tips = [
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

    // Step 4: Generate daily quests if needed
    loadingBar.style.width = '80%';
    await this.sleep(200);
    this.checkDailyQuests();
    this.checkMainQuests();

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
      // Start music on first user interaction
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
        const totalTime = cropData.growthTime;

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

        // Check if fruit is ready
        if (!tree.lastHarvest) tree.lastHarvest = tree.plantedAt + tData.matureTime;
        const sinceLast = Utils.now() - tree.lastHarvest;
        tree.fruitReady = sinceLast >= tData.fruitCycle;
      }
    });

    // Update HUD periodically
    this.updateHUD();
  }

  // ==================== RENDERING ====================
  render() {
    const r = this.renderer;
    const s = this.state.get();

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
            // Add slight variation
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

      // Building takes up its base tile
      r.drawOnTile(building.col, building.row, bldData.icon, 24, -6);
      r.drawLabelOnTile(building.col, building.row, bldData.name, 'rgba(62,39,35,0.8)', 'white', 14);

      // Show if production is complete
      const hasComplete = building.production?.some(p => p?.complete);
      if (hasComplete) {
        r.drawSparkle(building.col, building.row);
      }
    });

    // Draw animal pens
    const drawnPens = new Set();
    s.animals.forEach(animal => {
      if (!animal.penId) return;
      // Find pen
      const penTile = this.findPenTile(animal.penId);
      if (!penTile) return;

      if (!drawnPens.has(animal.penId)) {
        drawnPens.add(animal.penId);
        // Pen itself is drawn as a building
      }

      const aData = ANIMALS_DATA[animal.typeId];
      if (!aData) return;

      // Animate animal
      const animIdx = Math.floor(Date.now() / 800) % aData.idleFrames.length;
      r.drawOnTile(animal.col, animal.row, aData.idleFrames[animIdx], 18, -4);

      if (animal.productReady) {
        r.drawSparkle(animal.col, animal.row);
        r.drawLabelOnTile(animal.col, animal.row, aData.productIcon + ' Ready!', 'rgba(76,175,80,0.9)', 'white', 14);
      } else if (!animal.fed && !animal.productReady) {
        r.drawLabelOnTile(animal.col, animal.row, '🍽️ Hungry', 'rgba(255,152,0,0.9)', 'white', 14);
      }
    });

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

        // Show tile info tooltip
        this.renderTileTooltip(row, col);
      }
    }

    // Draw particles
    r.updateParticles();
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
        const totalTime = cropData.growthTime;

        if (elapsed >= totalTime && !content.withered) {
          // Ready to harvest
          r.drawSparkle(col, row);
          r.drawLabelOnTile(col, row, 'Ready!', 'rgba(76,175,80,0.9)', 'white', 14);
        } else if (elapsed < totalTime) {
          // Show growth progress
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
    // Simple tooltip shown via HUD
    const tile = this.state.getTile(row, col);
    if (!tile) return;

    let info = '';
    if (tile.content) {
      if (tile.content.type === 'crop') {
        const cd = CROPS_DATA[tile.content.cropId];
        if (cd) {
          const elapsed = Utils.now() - tile.content.plantedAt;
          if (tile.content.withered) {
            info = `${cd.icon} ${cd.name} — Withered! Click to clear.`;
          } else if (elapsed >= cd.growthTime) {
            info = `${cd.icon} ${cd.name} — Ready to harvest!`;
          } else {
            info = `${cd.icon} ${cd.name} — ${Utils.formatTime(cd.growthTime - elapsed)}`;
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

    // Update tooltip element
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

    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY, e));
    canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY, e));
    canvas.addEventListener('mouseup', (e) => this.onPointerUp(e.clientX, e.clientY, e));
    canvas.addEventListener('wheel', (e) => this.onWheel(e));

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      Audio.init(); // Initialize audio on first touch
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

    // Setup HUD button handlers
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
    // Update hover tile
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
      // It's a click/tap
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

    // Check if clicking on a tree
    const tree = s.trees.find(t => t.row === row && t.col === col);
    if (tree) {
      this.handleTreeClick(tree, screenX, screenY);
      return;
    }

    // Check if clicking on a building
    const building = s.buildings.find(b => b.row === row && b.col === col);
    if (building) {
      this.panels.open('building', { building });
      return;
    }

    // Check if clicking on a pen
    if (tile.content && tile.content.type === 'pen') {
      const penId = tile.content.penId;
      const pen = { id: penId, typeId: tile.content.penTypeId, row, col };
      this.panels.open('animal_pen', { pen });
      return;
    }

    // Check if clicking on an animal
    const animal = s.animals.find(a => a.row === row && a.col === col);
    if (animal) {
      this.handleAnimalClick(animal, screenX, screenY);
      return;
    }

    // Placement mode
    if (this.placementItem) {
      this.handlePlacement(row, col, screenX, screenY);
      return;
    }

    // Selected crop to plant
    if (this.selectedCrop) {
      this.plantCrop(row, col, screenX, screenY);
      return;
    }

    // Selected tree to plant
    if (this.selectedTree) {
      this.plantTree(row, col, screenX, screenY);
      return;
    }

    // Default actions based on tile state
    if (tile.content && tile.content.type === 'crop') {
      if (tile.content.withered) {
        this.clearWithered(row, col, screenX, screenY);
      } else {
        const cropData = CROPS_DATA[tile.content.cropId];
        if (cropData) {
          const elapsed = Utils.now() - tile.content.plantedAt;
          if (elapsed >= cropData.growthTime) {
            this.harvestCrop(row, col, screenX, screenY);
          }
        }
      }
    } else if (tile.type === 'grass' && !tile.content && !tile.decoration) {
      // Plow the tile
      this.plowTile(row, col, screenX, screenY);
    } else if (tile.type === 'plowed' && !tile.content) {
      // Open seed selector
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

    // Check level
    if (this.state.get().player.level < cropData.unlockLevel) {
      this.notify.warn(`Reach Level ${cropData.unlockLevel} to plant ${cropData.name}!`);
      return;
    }

    // Check coins
    if (!this.state.spendCoins(cropData.cost)) {
      this.notify.error('Not enough coins!');
      Audio.sfx('error');
      return;
    }

    // Check energy
    if (!this.state.useEnergy(1)) {
      this.notify.warn('Not enough energy! Wait for it to regenerate.');
      Audio.sfx('error');
      return;
    }

    // Plant
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

    // Quest progress
    this.updateQuestProgress('plant', this.selectedCrop, 1);
    this.updateQuestProgress('plant', 'any', 1);

    // Particles
    const pos = this.renderer.gridToScreen(col, row);
    this.renderer.addParticle(pos.x, pos.y + 16, '🌱', 3);

    this.state.save();
  }

  harvestCrop(row, col, screenX, screenY) {
    const tile = this.state.getTile(row, col);
    if (!tile || !tile.content || tile.content.type !== 'crop') return;

    const cropData = CROPS_DATA[tile.content.cropId];
    if (!cropData) return;

    // Check if ready
    const elapsed = Utils.now() - tile.content.plantedAt;
    if (elapsed < cropData.growthTime) {
      this.notify.warn(`${cropData.name} isn't ready yet!`);
      return;
    }

    // Check energy
    if (!this.state.useEnergy(1)) {
      this.notify.warn('Not enough energy!');
      Audio.sfx('error');
      return;
    }

    // Add to inventory
    if (!this.state.addItem(tile.content.cropId, 1)) {
      this.notify.error('Barn is full! Sell items or upgrade.');
      Audio.sfx('error');
      return;
    }

    // Add XP
    const levelUps = this.state.addXP(cropData.xp);

    // Save cropId before clearing
    const harvestedCropId = tile.content.cropId;

    // Clear tile
    tile.content = null;

    // Stats
    this.state.get().statistics.cropsHarvested++;
    this.state.get().player.totalCropsHarvested++;

    // Effects
    Audio.sfx('harvest');
    this.notify.showXP(cropData.xp, screenX, screenY);
    const pos = this.renderer.gridToScreen(col, row);
    this.renderer.addParticle(pos.x, pos.y + 16, cropData.icon, 5);

    // Quest progress
    this.updateQuestProgress('harvest', harvestedCropId, 1);
    this.updateQuestProgress('harvest', 'any', 1);

    // Level up check
    levelUps.forEach(lu => {
      this.handleLevelUp(lu);
    });

    this.state.save();
  }

  clearWithered(row, col, screenX, screenY) {
    const tile = this.state.getTile(row, col);
    if (!tile || !tile.content || !tile.content.withered) return;

    // Small cost to clear
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
        if (elapsed >= cropData.growthTime) {
          if (this.state.addItem(tile.content.cropId, 1)) {
            const levelUps = this.state.addXP(cropData.xp);
            const cropId = tile.content.cropId;
            tile.content = null;
            s.statistics.cropsHarvested++;
            count++;
            this.updateQuestProgress('harvest', cropId, 1);
            this.updateQuestProgress('harvest', 'any', 1);
            levelUps.forEach(lu => this.handleLevelUp(lu));
          }
        }
      }
    }

    if (count > 0) {
      Audio.sfx('harvest');
      this.notify.reward(`Harvested ${count} crops!`);
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

    // Find existing pens of the right type
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

    // Place in first available pen
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

    this.selectedAnimal = null;
    this.state.save();
  }

  feedAnimal(animal) {
    const aData = ANIMALS_DATA[animal.typeId];
    if (!aData) return;

    // Check feed requirements
    for (const [item, qty] of Object.entries(aData.feedRequired)) {
      if (!this.state.hasItem(item, qty)) {
        this.notify.error(`Need ${qty} ${CROPS_DATA[item]?.name || item}!`);
        Audio.sfx('error');
        return;
      }
    }

    // Consume feed
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

    this.state.get().statistics.productsCollected++;
    Audio.sfx('collect');
    this.notify.reward(`Collected ${aData.productIcon} ${aData.productName} x${aData.productQuantity}!`);
    this.updateQuestProgress('collect_product', aData.product, aData.productQuantity);
    this.updateQuestProgress('collect_product', 'any', aData.productQuantity);

    levelUps.forEach(lu => this.handleLevelUp(lu));
    this.state.save();
  }

  handleAnimalClick(animal, screenX, screenY) {
    if (animal.productReady) {
      this.collectAnimalProduct(animal);
    } else {
      // Find pen and open panel
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

      Audio.sfx('buy');
      this.notify.reward(`Placed ${decoData.icon} ${decoData.name}!`);
    }

    this.placementItem = null;
    this.setTool('select');
    this.state.save();
  }

  // ==================== PRODUCTION SYSTEM ====================
  startProduction(building, slotIndex, recipeId) {
    const bldData = BUILDINGS_DATA[building.typeId];
    if (!bldData) return;
    const recipe = bldData.recipes[recipeId];
    if (!recipe) return;

    // Check ingredients
    for (const [item, qty] of Object.entries(recipe.ingredients)) {
      if (!this.state.hasItem(item, qty)) {
        this.notify.error(`Need more ${item}!`);
        return;
      }
    }

    // Consume ingredients
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

    this.state.get().statistics.itemsProduced++;
    Audio.sfx('collect');
    this.notify.reward(`Produced ${recipe.icon} ${recipe.name}!`);
    this.updateQuestProgress('produce', recipe.id, 1);
    this.updateQuestProgress('produce', 'any', 1);

    levelUps.forEach(lu => this.handleLevelUp(lu));
    this.state.save();
  }

  // ==================== ECONOMY ====================
  sellItem(itemId, quantity = 1) {
    const info = this.panels.getItemInfo(itemId);
    if (!info) return;

    const actual = Math.min(quantity, this.state.getItemCount(itemId));
    if (actual <= 0) return;

    this.state.removeItem(itemId, actual);
    const total = info.sellPrice * actual;
    this.state.addCoins(total);

    this.state.get().statistics.itemsSold += actual;
    this.state.get().player.totalItemsSold += actual;
    Audio.sfx('sell');
    this.notify.toast(`Sold ${info.icon} ${info.name} x${actual} for 🪙${total}!`, 'reward');

    this.updateQuestProgress('sell', itemId, actual);
    this.updateQuestProgress('sell', 'any', actual);
    this.updateQuestProgress('earn_coins', 'any', total);

    this.state.save();
  }

  sellAll() {
    const inv = this.state.get().inventory.items;
    let totalCoins = 0;
    let totalItems = 0;

    for (const [id, qty] of Object.entries({ ...inv })) {
      const info = this.panels.getItemInfo(id);
      if (!info) continue;
      totalCoins += info.sellPrice * qty;
      totalItems += qty;
      this.updateQuestProgress('sell', id, qty);
      this.updateQuestProgress('sell', 'any', qty);
    }

    if (totalItems === 0) {
      this.notify.info('Nothing to sell!');
      return;
    }

    // Clear inventory
    this.state.get().inventory.items = {};
    this.state.addCoins(totalCoins);

    this.state.get().statistics.itemsSold += totalItems;
    this.updateQuestProgress('earn_coins', 'any', totalCoins);

    Audio.sfx('sell');
    this.notify.reward(`Sold everything for 🪙${totalCoins}!`);
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
    this.state.save();
  }

  // ==================== XP & LEVELING ====================
  handleLevelUp(levelUp) {
    const { level, rewards } = levelUp;
    Audio.sfx('levelup');
    this.notify.levelUp(level);

    if (rewards.coins) {
      this.state.addCoins(rewards.coins);
      this.notify.toast(`🪙 +${rewards.coins} coins!`, 'reward');
    }
    if (rewards.gems) {
      this.state.addGems(rewards.gems);
      this.notify.toast(`💎 +${rewards.gems} gems!`, 'reward');
    }

    // Check for new unlocks
    this.checkUnlocks(level);

    // Quest progress
    this.updateQuestProgress('reach_level', level, 1);
    this.checkMainQuests();

    this.state.save();
  }

  checkUnlocks(level) {
    // Check for newly available crops, animals, buildings
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

  // ==================== QUEST SYSTEM ====================
  updateQuestProgress(actionType, target, count) {
    const s = this.state.get();

    // Update active quests
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

    // Update daily quests
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

    // Give rewards
    if (qData.rewards.coins) this.state.addCoins(qData.rewards.coins);
    if (qData.rewards.xp) {
      const levelUps = this.state.addXP(qData.rewards.xp);
      levelUps.forEach(lu => this.handleLevelUp(lu));
    }
    if (qData.rewards.gems) this.state.addGems(qData.rewards.gems);

    // Move to completed
    delete s.quests.active[questId];
    s.quests.completed.push(questId);
    s.statistics.questsCompleted++;

    Audio.sfx('quest_complete');
    this.notify.questComplete(qData.title);

    // Activate next quest
    if (qData.nextQuest && QUESTS_DATA[qData.nextQuest]) {
      s.quests.active[qData.nextQuest] = { progress: {}, accepted: Utils.now() };
    }

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

    // Check if all daily quests are claimed for bonus
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
      // Generate new daily quests
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
    // Activate main quests based on level
    Object.values(QUESTS_DATA).forEach(q => {
      if (q.type === 'main' &&
          !s.quests.active[q.id] &&
          !s.quests.completed.includes(q.id) &&
          (q.requiredLevel || 1) <= s.player.level) {
        // Check if prerequisite is complete
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

    if (elapsed < 60) return; // Less than a minute, skip

    let cropsReady = 0;
    let cropsWithered = 0;
    let productsReady = 0;
    let treeFruitsReady = 0;

    // Update crops
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

    // Update animals
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

    // Update buildings
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

    // Update trees
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

    // Energy regen
    const energyBefore = s.player.energy;
    this.state.regenEnergy();
    const energyGained = s.player.energy - energyBefore;

    s.timestamps.lastLogin = now;

    // Show welcome back panel if significant time passed
    if (elapsed > 300) { // More than 5 minutes
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

    // Player info
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
  }

  setupHUDButtons() {
    // Tool buttons
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

    // Side buttons
    document.getElementById('btn-shop')?.addEventListener('click', () => this.panels.open('shop'));
    document.getElementById('btn-inventory')?.addEventListener('click', () => this.panels.open('inventory'));
    document.getElementById('btn-quests')?.addEventListener('click', () => this.panels.open('quests'));
    document.getElementById('btn-settings')?.addEventListener('click', () => this.panels.open('settings'));
    document.getElementById('btn-avatar')?.addEventListener('click', () => this.panels.open('avatar'));
    document.getElementById('hud-avatar-btn')?.addEventListener('click', () => this.panels.open('avatar'));
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
