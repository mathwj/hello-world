// minigames.js — Asteroid Dodger, Gravity Slingshot, Signal Decoder
'use strict';

const MiniGames = (() => {
  let activeGame = null;
  let gameCanvas = null;
  let gameCtx = null;
  let animFrame = null;
  let gameStartTime = 0;

  // ========== COMMON ==========
  function getOverlay() { return document.getElementById('mini-game-overlay'); }
  function getCanvas() { return document.getElementById('mini-game-canvas'); }

  function startGame(type) {
    if (activeGame) return;
    activeGame = type;
    const overlay = getOverlay();
    overlay.classList.remove('hidden');

    gameCanvas = getCanvas();
    const container = overlay;
    gameCanvas.width = Math.min(container.clientWidth, 400);
    gameCanvas.height = Math.min(container.clientHeight - 80, 500);
    gameCtx = gameCanvas.getContext('2d');
    gameStartTime = Date.now();

    const title = document.getElementById('mini-game-title');
    const result = document.getElementById('mini-game-result');
    const hud = document.getElementById('mini-game-hud');
    result.classList.add('hidden');
    hud.innerHTML = '';

    switch (type) {
      case 'asteroid_dodger': startAsteroidDodger(title); break;
      case 'gravity_slingshot': startGravitySlingshot(title); break;
      case 'signal_decoder': startSignalDecoder(title); break;
      case 'meteor_defense': startMeteorDefense(title); break;
      case 'constellation_connect': startConstellationConnect(title); break;
      case 'wormhole_runner': startWormholeRunner(title); break;
      case 'alien_language': startAlienLanguage(title); break;
      case 'black_hole_orbit': startBlackHoleOrbit(title); break;
    }
  }

  function endGame(reward) {
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;

    const result = document.getElementById('mini-game-result');
    const fmt = NumberFormatter.format;
    let rewardHTML = '<div class="mg-reward-title">Rewards</div>';

    if (reward.credits) {
      GameState.addCurrency('credits', reward.credits);
      rewardHTML += `<div>\u20A1${fmt(reward.credits)}</div>`;
    }
    if (reward.rp) {
      GameState.addCurrency('rp', reward.rp);
      rewardHTML += `<div>${fmt(reward.rp)} RP</div>`;
    }
    if (reward.as) {
      GameState.addCurrency('as', reward.as);
      rewardHTML += `<div>+${reward.as} Alien Signal</div>`;
    }

    if (reward.sd) {
      GameState.addCurrency('sd', reward.sd);
      rewardHTML += `<div>${fmt(reward.sd)} SD</div>`;
    }
    if (reward.egg) {
      rewardHTML += `<div>\u{1F95A} ${reward.egg} Egg!</div>`;
    }
    if (reward.collection) {
      rewardHTML += `<div>\u{1F3C6} Rare collection item!</div>`;
    }
    if (reward.achievement) {
      rewardHTML += `<div>\u{1F3C5} ${reward.achievement}!</div>`;
    }

    rewardHTML += '<button class="mg-close-btn" id="mg-close">COLLECT</button>';
    result.innerHTML = rewardHTML;
    result.classList.remove('hidden');

    document.getElementById('mg-close').addEventListener('click', () => {
      closeGame();
    });
  }

  function closeGame() {
    activeGame = null;
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;
    getOverlay().classList.add('hidden');
    // Remove event listeners
    gameCanvas.onclick = null;
    gameCanvas.ontouchmove = null;
    gameCanvas.ontouchstart = null;
  }

  function isActive() { return activeGame !== null; }

  // ========== ASTEROID DODGER ==========
  let adPlayer = {};
  let adAsteroids = [];
  let adHits = 0;
  let adDodged = 0;
  let adDuration = 30;

  function startAsteroidDodger(titleEl) {
    titleEl.textContent = 'ASTEROID DODGER';
    const w = gameCanvas.width;
    const h = gameCanvas.height;

    adPlayer = { x: w * 0.15, y: h / 2, w: 20, h: 12 };
    adAsteroids = [];
    adHits = 0;
    adDodged = 0;

    const hud = document.getElementById('mini-game-hud');
    hud.innerHTML = '<span id="ad-timer">30s</span> <span id="ad-hits">\u2764\u2764\u2764</span> <span id="ad-dodged">Dodged: 0</span>';

    // Touch / mouse controls
    gameCanvas.ontouchstart = (e) => {
      e.preventDefault();
      const rect = gameCanvas.getBoundingClientRect();
      const ty = e.touches[0].clientY - rect.top;
      if (ty < h / 2) adPlayer.y -= 30;
      else adPlayer.y += 30;
      adPlayer.y = Math.max(0, Math.min(h - adPlayer.h, adPlayer.y));
    };
    gameCanvas.onclick = (e) => {
      const rect = gameCanvas.getBoundingClientRect();
      const my = e.clientY - rect.top;
      if (my < h / 2) adPlayer.y -= 30;
      else adPlayer.y += 30;
      adPlayer.y = Math.max(0, Math.min(h - adPlayer.h, adPlayer.y));
    };

    adLoop();
  }

  function adLoop() {
    const w = gameCanvas.width;
    const h = gameCanvas.height;
    const ctx = gameCtx;
    const elapsed = (Date.now() - gameStartTime) / 1000;
    const remaining = adDuration - elapsed;

    if (remaining <= 0 || adHits >= 3) {
      adFinish();
      return;
    }

    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect((i * 37 + elapsed * 50) % w, (i * 73) % h, 1, 1);
    }

    // Spawn asteroids
    if (Math.random() < 0.05 + elapsed * 0.002) {
      adAsteroids.push({
        x: w + 10,
        y: Math.random() * (h - 20),
        size: 8 + Math.random() * 15,
        speed: 2 + Math.random() * 3 + elapsed * 0.05
      });
    }

    // Update asteroids
    for (let i = adAsteroids.length - 1; i >= 0; i--) {
      const a = adAsteroids[i];
      a.x -= a.speed;

      // Draw asteroid
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A0522D';
      ctx.beginPath();
      ctx.arc(a.x - 2, a.y - 2, a.size * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Collision check
      if (a.x < adPlayer.x + adPlayer.w && a.x + a.size > adPlayer.x &&
          a.y - a.size < adPlayer.y + adPlayer.h && a.y + a.size > adPlayer.y) {
        adHits++;
        adAsteroids.splice(i, 1);
        continue;
      }

      // Off screen = dodged
      if (a.x + a.size < 0) {
        adDodged++;
        adAsteroids.splice(i, 1);
      }
    }

    // Draw player ship
    ctx.fillStyle = '#CCC';
    ctx.fillRect(adPlayer.x, adPlayer.y, adPlayer.w, adPlayer.h);
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(adPlayer.x - 5, adPlayer.y + 3, 5, 6);

    // HUD
    const timerEl = document.getElementById('ad-timer');
    const hitsEl = document.getElementById('ad-hits');
    const dodgedEl = document.getElementById('ad-dodged');
    if (timerEl) timerEl.textContent = Math.ceil(remaining) + 's';
    if (hitsEl) hitsEl.textContent = '\u2764'.repeat(3 - adHits) + '\u{1F5A4}'.repeat(adHits);
    if (dodgedEl) dodgedEl.textContent = 'Dodged: ' + adDodged;

    animFrame = requestAnimationFrame(adLoop);
  }

  function adFinish() {
    const elapsed = Math.min(adDuration, (Date.now() - gameStartTime) / 1000);
    const s = GameState.getState();
    const creditReward = s.creditsPerSecond * elapsed * 10;
    endGame({ credits: creditReward });
  }

  // ========== GRAVITY SLINGSHOT ==========
  let gsAttempts = 0;
  let gsMaxAttempts = 3;
  let gsProbe = null;
  let gsTarget = {};
  let gsPlanet = {};
  let gsResult = 'none';
  let gsScore = 0;

  function startGravitySlingshot(titleEl) {
    titleEl.textContent = 'GRAVITY SLINGSHOT';
    gsAttempts = 0;
    gsScore = 0;

    const w = gameCanvas.width;
    const h = gameCanvas.height;
    gsPlanet = { x: w / 2, y: h / 2, r: 30, mass: 500 };
    gsTarget = {
      x: w * 0.8,
      y: h * 0.3 + Math.random() * h * 0.4,
      r: 25
    };
    gsProbe = null;
    gsResult = 'none';

    const hud = document.getElementById('mini-game-hud');
    hud.innerHTML = '<span id="gs-attempts">Attempts: 3</span> <span id="gs-score">Score: 0</span>';

    gameCanvas.onclick = (e) => {
      if (gsProbe && gsProbe.active) return; // wait for probe to finish
      if (gsAttempts >= gsMaxAttempts) return;

      const rect = gameCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Launch from left side toward click direction
      const launchX = 30;
      const launchY = h / 2;
      const dx = mx - launchX;
      const dy = my - launchY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = 4;

      gsProbe = {
        x: launchX, y: launchY,
        vx: (dx / dist) * speed,
        vy: (dy / dist) * speed,
        active: true,
        trail: []
      };
      gsAttempts++;
    };

    gsLoop();
  }

  function gsLoop() {
    const w = gameCanvas.width;
    const h = gameCanvas.height;
    const ctx = gameCtx;

    ctx.fillStyle = '#0A0A2A';
    ctx.fillRect(0, 0, w, h);

    // Grid lines (gravity visualization)
    ctx.strokeStyle = 'rgba(100,100,200,0.15)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Planet
    const grad = ctx.createRadialGradient(gsPlanet.x, gsPlanet.y, 0, gsPlanet.x, gsPlanet.y, gsPlanet.r);
    grad.addColorStop(0, '#4488FF');
    grad.addColorStop(1, '#1133AA');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gsPlanet.x, gsPlanet.y, gsPlanet.r, 0, Math.PI * 2);
    ctx.fill();

    // Gravity well rings
    ctx.strokeStyle = 'rgba(100,150,255,0.2)';
    ctx.lineWidth = 1;
    for (let r = 50; r <= 150; r += 25) {
      ctx.beginPath();
      ctx.arc(gsPlanet.x, gsPlanet.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Target ring
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gsTarget.x, gsTarget.y, gsTarget.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,255,136,0.1)';
    ctx.beginPath();
    ctx.arc(gsTarget.x, gsTarget.y, gsTarget.r, 0, Math.PI * 2);
    ctx.fill();

    // Probe
    if (gsProbe && gsProbe.active) {
      // Gravity toward planet
      const dx = gsPlanet.x - gsProbe.x;
      const dy = gsPlanet.y - gsProbe.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < gsPlanet.r) {
        // Hit planet
        gsProbe.active = false;
        gsResult = 'crash';
      } else {
        const force = gsPlanet.mass / (dist * dist);
        gsProbe.vx += (dx / dist) * force;
        gsProbe.vy += (dy / dist) * force;
        gsProbe.x += gsProbe.vx;
        gsProbe.y += gsProbe.vy;
        gsProbe.trail.push({ x: gsProbe.x, y: gsProbe.y });
        if (gsProbe.trail.length > 200) gsProbe.trail.shift();

        // Check target hit
        const tdx = gsTarget.x - gsProbe.x;
        const tdy = gsTarget.y - gsProbe.y;
        const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
        if (tdist < gsTarget.r) {
          gsProbe.active = false;
          gsResult = 'hit';
          gsScore += 500;
        } else if (tdist < gsTarget.r * 2) {
          // Near miss zone — but only counted when probe exits screen
        }

        // Off screen check
        if (gsProbe.x < -20 || gsProbe.x > w + 20 || gsProbe.y < -20 || gsProbe.y > h + 20) {
          gsProbe.active = false;
          // Near miss check
          const nearDist = Math.sqrt(
            (gsTarget.x - gsProbe.trail[gsProbe.trail.length - 1].x) ** 2 +
            (gsTarget.y - gsProbe.trail[gsProbe.trail.length - 1].y) ** 2
          );
          // Check closest approach
          let minDist = Infinity;
          for (const p of gsProbe.trail) {
            const d = Math.sqrt((gsTarget.x - p.x) ** 2 + (gsTarget.y - p.y) ** 2);
            if (d < minDist) minDist = d;
          }
          if (minDist < gsTarget.r * 2.5) {
            gsResult = 'near';
            gsScore += 100;
          } else {
            gsResult = 'miss';
            gsScore += 10;
          }
        }
      }

      // Draw trail
      ctx.strokeStyle = 'rgba(255,200,50,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < gsProbe.trail.length; i++) {
        if (i === 0) ctx.moveTo(gsProbe.trail[i].x, gsProbe.trail[i].y);
        else ctx.lineTo(gsProbe.trail[i].x, gsProbe.trail[i].y);
      }
      ctx.stroke();

      // Draw probe
      if (gsProbe.active) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(gsProbe.x, gsProbe.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Instruction text
    if (!gsProbe || !gsProbe.active) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      if (gsAttempts < gsMaxAttempts) {
        ctx.fillText('Tap to launch probe toward the green target', w / 2, h - 15);
      }
    }

    // HUD update
    const attEl = document.getElementById('gs-attempts');
    const scoreEl = document.getElementById('gs-score');
    if (attEl) attEl.textContent = 'Attempts: ' + (gsMaxAttempts - gsAttempts);
    if (scoreEl) scoreEl.textContent = 'Score: ' + gsScore;

    // Check if game is over
    if (gsAttempts >= gsMaxAttempts && (!gsProbe || !gsProbe.active)) {
      gsFinish();
      return;
    }

    animFrame = requestAnimationFrame(gsLoop);
  }

  function gsFinish() {
    const s = GameState.getState();
    const rpReward = s.rpPerSecond > 0 ? s.rpPerSecond * gsScore : gsScore;
    endGame({ rp: rpReward });
  }

  // ========== SIGNAL DECODER (Memory Match) ==========
  const sdSymbols = ['\u2605', '\u2660', '\u2663', '\u2665', '\u2666', '\u263A', '\u2602', '\u2708'];
  let sdGrid = [];
  let sdRevealed = [];
  let sdMatched = [];
  let sdFirstPick = -1;
  let sdPairs = 0;
  let sdDuration = 60;
  let sdLocked = false;

  function startSignalDecoder(titleEl) {
    titleEl.textContent = 'SIGNAL DECODER';
    sdPairs = 0;
    sdFirstPick = -1;
    sdLocked = false;

    // Create 4x4 grid (8 pairs)
    sdGrid = [];
    for (const sym of sdSymbols) {
      sdGrid.push(sym, sym);
    }
    // Shuffle
    for (let i = sdGrid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sdGrid[i], sdGrid[j]] = [sdGrid[j], sdGrid[i]];
    }

    sdRevealed = new Array(16).fill(false);
    sdMatched = new Array(16).fill(false);

    const hud = document.getElementById('mini-game-hud');
    hud.innerHTML = '<span id="sd-timer">60s</span> <span id="sd-pairs">Pairs: 0/8</span>';

    gameCanvas.onclick = (e) => {
      if (sdLocked) return;
      const rect = gameCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Determine which cell was clicked
      const cellW = gameCanvas.width / 4;
      const cellH = gameCanvas.height / 4;
      const col = Math.floor(mx / cellW);
      const row = Math.floor(my / cellH);
      if (col < 0 || col >= 4 || row < 0 || row >= 4) return;
      const idx = row * 4 + col;

      if (sdMatched[idx] || sdRevealed[idx]) return;

      sdRevealed[idx] = true;

      if (sdFirstPick === -1) {
        sdFirstPick = idx;
      } else {
        sdLocked = true;
        const first = sdFirstPick;
        sdFirstPick = -1;

        if (sdGrid[first] === sdGrid[idx]) {
          sdMatched[first] = true;
          sdMatched[idx] = true;
          sdPairs++;
          sdLocked = false;

          if (sdPairs >= 8) {
            setTimeout(() => sdFinish(), 300);
            return;
          }
        } else {
          setTimeout(() => {
            sdRevealed[first] = false;
            sdRevealed[idx] = false;
            sdLocked = false;
          }, 600);
        }
      }
    };

    sdLoop();
  }

  function sdLoop() {
    const w = gameCanvas.width;
    const h = gameCanvas.height;
    const ctx = gameCtx;
    const elapsed = (Date.now() - gameStartTime) / 1000;
    const remaining = sdDuration - elapsed;

    if (remaining <= 0) {
      sdFinish();
      return;
    }

    ctx.fillStyle = '#0A1A2A';
    ctx.fillRect(0, 0, w, h);

    const cellW = w / 4;
    const cellH = h / 4;
    const pad = 4;

    for (let i = 0; i < 16; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const cx = col * cellW + pad;
      const cy = row * cellH + pad;
      const cw = cellW - pad * 2;
      const ch = cellH - pad * 2;

      if (sdMatched[i]) {
        ctx.fillStyle = 'rgba(0,200,100,0.3)';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.fillStyle = '#00FF88';
        ctx.font = `${Math.min(cw, ch) * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sdGrid[i], cx + cw / 2, cy + ch / 2);
      } else if (sdRevealed[i]) {
        ctx.fillStyle = 'rgba(100,100,200,0.4)';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.fillStyle = '#FFF';
        ctx.font = `${Math.min(cw, ch) * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sdGrid[i], cx + cw / 2, cy + ch / 2);
      } else {
        ctx.fillStyle = 'rgba(50,50,80,0.8)';
        ctx.fillRect(cx, cy, cw, ch);
        ctx.strokeStyle = 'rgba(100,100,200,0.5)';
        ctx.strokeRect(cx, cy, cw, ch);
        ctx.fillStyle = 'rgba(150,150,200,0.5)';
        ctx.font = `${Math.min(cw, ch) * 0.3}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', cx + cw / 2, cy + ch / 2);
      }
    }

    // HUD
    const timerEl = document.getElementById('sd-timer');
    const pairsEl = document.getElementById('sd-pairs');
    if (timerEl) timerEl.textContent = Math.ceil(remaining) + 's';
    if (pairsEl) pairsEl.textContent = 'Pairs: ' + sdPairs + '/8';

    animFrame = requestAnimationFrame(sdLoop);
  }

  function sdFinish() {
    const s = GameState.getState();
    let reward = {};
    if (sdPairs >= 8) {
      reward = { as: 1, rp: Math.max(500, s.rpPerSecond * 500) };
    } else if (sdPairs >= 4) {
      reward = { as: 1 };
    } else {
      reward = { rp: Math.max(10, s.rpPerSecond * 10) };
    }
    endGame(reward);
  }

  // ========== METEOR DEFENSE (Phase 3+) ==========
  let mdHealth = 0;
  let mdMaxHealth = 0;
  let mdTimeLeft = 0;
  let mdMeteorY = 0;

  function startMeteorDefense(title) {
    title.textContent = '\u2604 METEOR INCOMING!';
    const hud = document.getElementById('mini-game-hud');
    mdMaxHealth = 100;
    mdHealth = mdMaxHealth;
    mdTimeLeft = 20;
    mdMeteorY = -50;

    function draw() {
      const w = gameCanvas.width, h = gameCanvas.height;
      gameCtx.fillStyle = '#0a0a2a';
      gameCtx.fillRect(0, 0, w, h);

      // Stars
      gameCtx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 73 + 17) % w);
        const sy = ((i * 47 + 31) % h);
        gameCtx.fillRect(sx, sy, 1, 1);
      }

      // Meteor
      const meteorSize = 40 + (mdHealth / mdMaxHealth) * 40;
      const meteorX = w / 2;
      mdMeteorY = Math.min(h * 0.6, mdMeteorY + 0.5);
      const grad = gameCtx.createRadialGradient(meteorX, mdMeteorY, 5, meteorX, mdMeteorY, meteorSize);
      grad.addColorStop(0, '#ff6600');
      grad.addColorStop(0.5, '#aa3300');
      grad.addColorStop(1, '#441100');
      gameCtx.fillStyle = grad;
      gameCtx.beginPath();
      gameCtx.arc(meteorX, mdMeteorY, meteorSize, 0, Math.PI * 2);
      gameCtx.fill();

      // Cracks based on damage
      const dmgPct = 1 - (mdHealth / mdMaxHealth);
      if (dmgPct > 0.1) {
        gameCtx.strokeStyle = '#ff9944';
        gameCtx.lineWidth = 2;
        const crackCount = Math.floor(dmgPct * 8);
        for (let i = 0; i < crackCount; i++) {
          const angle = (i / crackCount) * Math.PI * 2;
          gameCtx.beginPath();
          gameCtx.moveTo(meteorX, mdMeteorY);
          gameCtx.lineTo(meteorX + Math.cos(angle) * meteorSize * 0.8, mdMeteorY + Math.sin(angle) * meteorSize * 0.8);
          gameCtx.stroke();
        }
      }

      // Health bar
      gameCtx.fillStyle = '#333';
      gameCtx.fillRect(20, h - 40, w - 40, 20);
      const hpPct = mdHealth / mdMaxHealth;
      gameCtx.fillStyle = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff4444';
      gameCtx.fillRect(20, h - 40, (w - 40) * hpPct, 20);

      hud.innerHTML = `Time: ${mdTimeLeft.toFixed(1)}s | HP: ${Math.ceil(mdHealth)}%`;
    }

    gameCanvas.onclick = () => {
      if (mdHealth > 0) {
        mdHealth -= 5;
        if (mdHealth <= 0) {
          mdHealth = 0;
          mdFinish(true);
        }
      }
    };

    let lastTime = Date.now();
    function loop() {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      mdTimeLeft -= dt;

      if (mdTimeLeft <= 0) {
        mdFinish(false);
        return;
      }

      draw();
      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);
  }

  function mdFinish(destroyed) {
    const s = GameState.getState();
    const dmgPct = 1 - (mdHealth / mdMaxHealth);
    let reward = {};
    if (destroyed) {
      reward = { credits: s.creditsPerSecond * 300, egg: 'Silver' };
    } else if (dmgPct >= 0.5) {
      reward = { credits: s.creditsPerSecond * 100 };
    } else {
      reward = { credits: 0 };
    }
    endGame(reward);
  }

  // ========== CONSTELLATION CONNECT (Phase 4+, once/day) ==========
  let ccStars = [];
  let ccTargetLines = [];
  let ccDrawnLines = [];
  let ccSelectedStar = -1;
  let ccTimeLeft = 0;

  function startConstellationConnect(title) {
    title.textContent = '\u2B50 Constellation Connect';
    const hud = document.getElementById('mini-game-hud');
    ccTimeLeft = 30;
    ccDrawnLines = [];
    ccSelectedStar = -1;

    const w = gameCanvas.width, h = gameCanvas.height;

    // Generate constellation (simple shape: 5-7 stars)
    const shapes = [
      [[0.3, 0.2], [0.5, 0.15], [0.7, 0.2], [0.75, 0.5], [0.5, 0.7], [0.25, 0.5]], // hexagon-ish
      [[0.5, 0.15], [0.65, 0.4], [0.8, 0.45], [0.6, 0.6], [0.65, 0.85], [0.5, 0.7], [0.35, 0.85], [0.4, 0.6], [0.2, 0.45], [0.35, 0.4]], // star shape
    ];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    ccStars = shape.map(([px, py]) => ({
      x: px * w * 0.8 + w * 0.1 + (Math.random() - 0.5) * 20,
      y: py * h * 0.8 + h * 0.1 + (Math.random() - 0.5) * 20
    }));

    // Target lines connect sequential stars
    ccTargetLines = [];
    for (let i = 0; i < ccStars.length; i++) {
      ccTargetLines.push([i, (i + 1) % ccStars.length]);
    }

    function draw() {
      gameCtx.fillStyle = '#0a0a2a';
      gameCtx.fillRect(0, 0, w, h);

      // Faint target outline
      gameCtx.strokeStyle = 'rgba(100,100,200,0.15)';
      gameCtx.lineWidth = 1;
      for (const [a, b] of ccTargetLines) {
        gameCtx.beginPath();
        gameCtx.moveTo(ccStars[a].x, ccStars[a].y);
        gameCtx.lineTo(ccStars[b].x, ccStars[b].y);
        gameCtx.stroke();
      }

      // Drawn lines
      gameCtx.strokeStyle = '#ffdd44';
      gameCtx.lineWidth = 2;
      for (const [a, b] of ccDrawnLines) {
        gameCtx.beginPath();
        gameCtx.moveTo(ccStars[a].x, ccStars[a].y);
        gameCtx.lineTo(ccStars[b].x, ccStars[b].y);
        gameCtx.stroke();
      }

      // Stars
      ccStars.forEach((star, i) => {
        gameCtx.fillStyle = i === ccSelectedStar ? '#ffff00' : '#ffffff';
        gameCtx.beginPath();
        gameCtx.arc(star.x, star.y, 6, 0, Math.PI * 2);
        gameCtx.fill();
      });

      hud.innerHTML = `Time: ${ccTimeLeft.toFixed(1)}s | Lines: ${ccDrawnLines.length}/${ccTargetLines.length}`;
    }

    gameCanvas.onclick = (e) => {
      const rect = gameCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Find closest star
      let closest = -1, closestDist = Infinity;
      ccStars.forEach((star, i) => {
        const dx = star.x - mx, dy = star.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 30 && dist < closestDist) {
          closest = i;
          closestDist = dist;
        }
      });

      if (closest >= 0) {
        if (ccSelectedStar < 0) {
          ccSelectedStar = closest;
        } else if (closest !== ccSelectedStar) {
          // Check if this line matches a target
          const isTarget = ccTargetLines.some(([a, b]) =>
            (a === ccSelectedStar && b === closest) || (a === closest && b === ccSelectedStar)
          );
          const alreadyDrawn = ccDrawnLines.some(([a, b]) =>
            (a === ccSelectedStar && b === closest) || (a === closest && b === ccSelectedStar)
          );
          if (isTarget && !alreadyDrawn) {
            ccDrawnLines.push([ccSelectedStar, closest]);
          }
          ccSelectedStar = -1;

          if (ccDrawnLines.length >= ccTargetLines.length) {
            ccFinish();
            return;
          }
        } else {
          ccSelectedStar = -1;
        }
      }
    };

    let lastTime = Date.now();
    function loop() {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      ccTimeLeft -= dt;

      if (ccTimeLeft <= 0) {
        ccFinish();
        return;
      }

      draw();
      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);
  }

  function ccFinish() {
    const pct = ccDrawnLines.length / ccTargetLines.length;
    const s = GameState.getState();
    let reward = {};
    if (pct >= 1) {
      reward = { rp: 500, collection: true };
    } else if (pct >= 0.7) {
      reward = { rp: 200 };
    } else {
      reward = { rp: 50 };
    }
    endGame(reward);
  }

  // ========== WORMHOLE RUNNER (Phase 6+) ==========
  let wrShipX = 0;
  let wrOrbs = 0;
  let wrTimeLeft = 0;
  let wrObstacles = [];
  let wrOrbItems = [];

  function startWormholeRunner(title) {
    title.textContent = '\u{1F300} Wormhole Runner';
    const hud = document.getElementById('mini-game-hud');
    const w = gameCanvas.width, h = gameCanvas.height;
    wrShipX = w / 2;
    wrOrbs = 0;
    wrTimeLeft = 20;
    wrObstacles = [];
    wrOrbItems = [];

    let touchStartX = 0;
    gameCanvas.ontouchstart = (e) => {
      e.preventDefault();
      touchStartX = e.touches[0].clientX;
    };
    gameCanvas.ontouchmove = (e) => {
      e.preventDefault();
      const dx = e.touches[0].clientX - touchStartX;
      touchStartX = e.touches[0].clientX;
      wrShipX = Math.max(20, Math.min(w - 20, wrShipX + dx));
    };
    gameCanvas.onclick = (e) => {
      const rect = gameCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      wrShipX = mx;
    };

    let spawnTimer = 0;
    let lastTime = Date.now();

    function draw() {
      // Wormhole tunnel effect
      gameCtx.fillStyle = '#0a002a';
      gameCtx.fillRect(0, 0, w, h);

      // Tunnel walls
      const tunnelWidth = w * 0.7;
      const leftWall = (w - tunnelWidth) / 2;
      const rightWall = leftWall + tunnelWidth;
      gameCtx.strokeStyle = '#4400aa';
      gameCtx.lineWidth = 3;
      for (let y = 0; y < h; y += 30) {
        const wobble = Math.sin(y * 0.02 + Date.now() * 0.002) * 15;
        gameCtx.beginPath();
        gameCtx.moveTo(leftWall + wobble, y);
        gameCtx.lineTo(leftWall + wobble, y + 30);
        gameCtx.stroke();
        gameCtx.beginPath();
        gameCtx.moveTo(rightWall + wobble, y);
        gameCtx.lineTo(rightWall + wobble, y + 30);
        gameCtx.stroke();
      }

      // Obstacles
      gameCtx.fillStyle = '#ff2244';
      for (const obs of wrObstacles) {
        gameCtx.fillRect(obs.x - 15, obs.y - 10, 30, 20);
      }

      // Orbs
      gameCtx.fillStyle = '#44ffff';
      for (const orb of wrOrbItems) {
        gameCtx.beginPath();
        gameCtx.arc(orb.x, orb.y, 8, 0, Math.PI * 2);
        gameCtx.fill();
      }

      // Ship
      gameCtx.fillStyle = '#ffaa00';
      gameCtx.beginPath();
      gameCtx.moveTo(wrShipX, h - 50);
      gameCtx.lineTo(wrShipX - 12, h - 30);
      gameCtx.lineTo(wrShipX + 12, h - 30);
      gameCtx.closePath();
      gameCtx.fill();

      hud.innerHTML = `Time: ${wrTimeLeft.toFixed(1)}s | Orbs: ${wrOrbs}`;
    }

    function loop() {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      wrTimeLeft -= dt;
      spawnTimer += dt;

      if (wrTimeLeft <= 0) {
        wrFinish();
        return;
      }

      // Spawn obstacles and orbs
      if (spawnTimer > 0.5) {
        spawnTimer = 0;
        if (Math.random() < 0.6) {
          wrObstacles.push({ x: Math.random() * (w - 40) + 20, y: -20 });
        }
        if (Math.random() < 0.4) {
          wrOrbItems.push({ x: Math.random() * (w - 40) + 20, y: -20 });
        }
      }

      // Move items
      const speed = 200;
      wrObstacles.forEach(o => { o.y += speed * dt; });
      wrOrbItems.forEach(o => { o.y += speed * dt; });

      // Collision check
      wrObstacles = wrObstacles.filter(o => {
        if (o.y > h + 20) return false;
        const dx = o.x - wrShipX, dy = o.y - (h - 40);
        if (Math.abs(dx) < 25 && Math.abs(dy) < 20) {
          // Hit obstacle: lose 2 seconds
          wrTimeLeft = Math.max(0, wrTimeLeft - 2);
          return false;
        }
        return true;
      });

      wrOrbItems = wrOrbItems.filter(o => {
        if (o.y > h + 20) return false;
        const dx = o.x - wrShipX, dy = o.y - (h - 40);
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
          wrOrbs++;
          return false;
        }
        return true;
      });

      draw();
      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);
  }

  function wrFinish() {
    const reward = { sd: wrOrbs * 10 + 50 };
    endGame(reward);
  }

  // ========== ALIEN LANGUAGE PUZZLE (Phase 4, on artifact find) ==========
  let alSymbols = [];
  let alWords = [];
  let alMatches = {};
  let alSelectedSymbol = -1;
  let alTimeLeft = 0;

  function startAlienLanguage(title) {
    title.textContent = '\u{1F47E} Alien Language Puzzle';
    const hud = document.getElementById('mini-game-hud');
    const w = gameCanvas.width, h = gameCanvas.height;
    alTimeLeft = 30;
    alMatches = {};
    alSelectedSymbol = -1;

    const symbolGlyphs = ['\u2648', '\u2649', '\u264A', '\u264B', '\u264C', '\u264D', '\u264E', '\u264F', '\u2650', '\u2651'];
    const wordPool = ['STAR', 'VOID', 'FLUX', 'ECHO', 'WARP', 'CORE', 'BEAM', 'GLOW', 'PULSE', 'DRIFT'];

    // Pick 5 random pairs
    const indices = [];
    while (indices.length < 5) {
      const idx = Math.floor(Math.random() * symbolGlyphs.length);
      if (!indices.includes(idx)) indices.push(idx);
    }

    alSymbols = indices.map(i => symbolGlyphs[i]);
    alWords = indices.map(i => wordPool[i]);

    // Shuffle word display order
    const shuffledWords = [...alWords];
    for (let i = shuffledWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
    }
    const displayWords = shuffledWords;

    function draw() {
      gameCtx.fillStyle = '#0a0a2a';
      gameCtx.fillRect(0, 0, w, h);

      gameCtx.font = '14px monospace';
      gameCtx.fillStyle = '#aaaaff';
      gameCtx.textAlign = 'center';
      gameCtx.fillText('Match symbols to words', w / 2, 25);

      // Symbols on left
      const symStartY = 60;
      const spacing = 50;
      gameCtx.font = '28px serif';
      for (let i = 0; i < alSymbols.length; i++) {
        const y = symStartY + i * spacing;
        gameCtx.fillStyle = alSelectedSymbol === i ? '#ffff00' : (alMatches[i] !== undefined ? '#44ff44' : '#ffffff');
        gameCtx.textAlign = 'center';
        gameCtx.fillText(alSymbols[i], w * 0.2, y + 10);
      }

      // Words on right
      gameCtx.font = '16px monospace';
      for (let i = 0; i < displayWords.length; i++) {
        const y = symStartY + i * spacing;
        const matched = Object.values(alMatches).includes(i);
        gameCtx.fillStyle = matched ? '#44ff44' : '#ffffff';
        gameCtx.textAlign = 'center';
        gameCtx.fillText(displayWords[i], w * 0.75, y + 10);
      }

      // Draw lines for matches
      gameCtx.strokeStyle = '#44ff44';
      gameCtx.lineWidth = 2;
      for (const [symIdx, wordIdx] of Object.entries(alMatches)) {
        const sy = symStartY + parseInt(symIdx) * spacing + 5;
        const wy = symStartY + wordIdx * spacing + 5;
        gameCtx.beginPath();
        gameCtx.moveTo(w * 0.3, sy);
        gameCtx.lineTo(w * 0.6, wy);
        gameCtx.stroke();
      }

      hud.innerHTML = `Time: ${alTimeLeft.toFixed(1)}s | Matched: ${Object.keys(alMatches).length}/5`;
    }

    gameCanvas.onclick = (e) => {
      const rect = gameCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const symStartY = 60;
      const spacing = 50;

      if (mx < w * 0.5) {
        // Clicking left side (symbols)
        for (let i = 0; i < alSymbols.length; i++) {
          const y = symStartY + i * spacing;
          if (my > y - 20 && my < y + 25 && alMatches[i] === undefined) {
            alSelectedSymbol = i;
            return;
          }
        }
      } else {
        // Clicking right side (words)
        if (alSelectedSymbol >= 0) {
          for (let i = 0; i < displayWords.length; i++) {
            const y = symStartY + i * spacing;
            if (my > y - 20 && my < y + 25 && !Object.values(alMatches).includes(i)) {
              alMatches[alSelectedSymbol] = i;
              alSelectedSymbol = -1;
              if (Object.keys(alMatches).length >= 5) {
                alFinish(displayWords);
                return;
              }
              return;
            }
          }
        }
      }
    };

    let lastTime = Date.now();
    function loop() {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      alTimeLeft -= dt;

      if (alTimeLeft <= 0) {
        alFinish(displayWords);
        return;
      }

      draw();
      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);
  }

  function alFinish(displayWords) {
    // Check correctness
    let correct = 0;
    for (const [symIdx, wordIdx] of Object.entries(alMatches)) {
      const correctWord = alWords[parseInt(symIdx)];
      if (displayWords[wordIdx] === correctWord) correct++;
    }

    const s = GameState.getState();
    let reward = {};
    if (correct >= 5) {
      reward = { rp: 500 };
      s.alienArtifacts = (s.alienArtifacts || 0) + 2;
    } else if (correct >= 3) {
      reward = { rp: 200 };
      s.alienArtifacts = (s.alienArtifacts || 0) + 1;
    } else {
      reward = { rp: 50 };
      s.alienArtifacts = (s.alienArtifacts || 0) + 1;
    }
    endGame(reward);
  }

  // ========== BLACK HOLE ORBIT (Phase 8) ==========
  let bhoAngle = 0;
  let bhoRadius = 0;
  let bhoVelocity = 0;
  let bhoTimeLeft = 0;
  let bhoBoosting = false;

  function startBlackHoleOrbit(title) {
    title.textContent = '\u{1F573} Black Hole Orbit';
    const hud = document.getElementById('mini-game-hud');
    const w = gameCanvas.width, h = gameCanvas.height;
    const cx = w / 2, cy = h / 2;
    bhoAngle = 0;
    bhoRadius = 100;
    bhoVelocity = 0;
    bhoTimeLeft = 30;
    bhoBoosting = false;

    const minRadius = 30;
    const maxRadius = 180;

    gameCanvas.ontouchstart = (e) => { e.preventDefault(); bhoBoosting = true; };
    gameCanvas.ontouchend = (e) => { bhoBoosting = false; };
    gameCanvas.onmousedown = () => { bhoBoosting = true; };
    gameCanvas.onmouseup = () => { bhoBoosting = false; };

    function draw() {
      gameCtx.fillStyle = '#000000';
      gameCtx.fillRect(0, 0, w, h);

      // Accretion disk
      for (let r = maxRadius + 20; r > minRadius; r -= 3) {
        const alpha = 0.1 * (1 - r / (maxRadius + 20));
        gameCtx.strokeStyle = `rgba(100, 50, 200, ${alpha})`;
        gameCtx.lineWidth = 2;
        gameCtx.beginPath();
        gameCtx.arc(cx, cy, r, 0, Math.PI * 2);
        gameCtx.stroke();
      }

      // Black hole
      const bhGrad = gameCtx.createRadialGradient(cx, cy, 0, cx, cy, minRadius);
      bhGrad.addColorStop(0, '#000000');
      bhGrad.addColorStop(0.8, '#110022');
      bhGrad.addColorStop(1, '#220044');
      gameCtx.fillStyle = bhGrad;
      gameCtx.beginPath();
      gameCtx.arc(cx, cy, minRadius, 0, Math.PI * 2);
      gameCtx.fill();

      // Safe zone indicators
      gameCtx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
      gameCtx.setLineDash([5, 10]);
      gameCtx.beginPath();
      gameCtx.arc(cx, cy, minRadius + 10, 0, Math.PI * 2);
      gameCtx.stroke();
      gameCtx.beginPath();
      gameCtx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
      gameCtx.stroke();
      gameCtx.setLineDash([]);

      // Ship
      const shipX = cx + Math.cos(bhoAngle) * bhoRadius;
      const shipY = cy + Math.sin(bhoAngle) * bhoRadius;
      gameCtx.fillStyle = bhoBoosting ? '#ff8800' : '#00aaff';
      gameCtx.beginPath();
      gameCtx.arc(shipX, shipY, 6, 0, Math.PI * 2);
      gameCtx.fill();

      // Trail
      gameCtx.strokeStyle = 'rgba(0, 170, 255, 0.3)';
      gameCtx.lineWidth = 1;
      gameCtx.beginPath();
      gameCtx.arc(cx, cy, bhoRadius, bhoAngle - 1, bhoAngle);
      gameCtx.stroke();

      hud.innerHTML = `Time: ${bhoTimeLeft.toFixed(1)}s | ${bhoBoosting ? 'BOOST!' : 'Falling...'}`;
    }

    let lastTime = Date.now();
    function loop() {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      bhoTimeLeft -= dt;

      // Physics
      const gravity = 50; // pixels/sec^2 inward
      const boost = 80; // pixels/sec^2 outward
      const angularSpeed = 2; // radians/sec

      bhoAngle += angularSpeed * dt;
      bhoVelocity += (bhoBoosting ? boost : -gravity) * dt;
      bhoRadius += bhoVelocity * dt;

      // Damping
      bhoVelocity *= 0.98;

      if (bhoRadius < minRadius || bhoRadius > maxRadius + 20) {
        bhoFinish();
        return;
      }

      if (bhoTimeLeft <= 0) {
        bhoFinish();
        return;
      }

      draw();
      animFrame = requestAnimationFrame(loop);
    }
    animFrame = requestAnimationFrame(loop);
  }

  function bhoFinish() {
    const survived = 30 - bhoTimeLeft;
    let reward = {};
    if (survived >= 29.5) {
      reward = { sd: 1000, egg: 'Gold', achievement: 'Event Horizon Surfer' };
    } else if (survived >= 15) {
      reward = { sd: 500 };
    } else {
      reward = { sd: 100 };
    }
    endGame(reward);
  }

  return { startGame, closeGame, isActive };
})();
