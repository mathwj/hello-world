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

  return { startGame, closeGame, isActive };
})();
