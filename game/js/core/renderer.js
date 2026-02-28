// =========================================
// Isometric Farm Renderer (v2 - Enhanced)
// =========================================

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileWidth = 64;
    this.tileHeight = 32;
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.animFrame = 0;
    this.animTimer = 0;
    this.particles = [];
    this.hoverTile = null;
    this.selectedTile = null;

    // Day/night cycle
    this.dayTime = 0.4; // Start at daytime
    this.daySpeed = 0.00003;

    // Weather
    this.weatherParticles = [];
    this.weatherType = 'clear';
    this.weatherTimer = 0;

    // Ambient birds
    this.birds = [];
    for (let i = 0; i < 3; i++) {
      this.birds.push({
        x: Math.random() * 800,
        y: 20 + Math.random() * 60,
        speed: 0.3 + Math.random() * 0.5,
        wingPhase: Math.random() * Math.PI * 2,
        size: 8 + Math.random() * 4
      });
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.screenW = this.canvas.clientWidth;
    this.screenH = this.canvas.clientHeight;
  }

  gridToScreen(gx, gy) {
    const sx = (gx - gy) * (this.tileWidth / 2) * this.scale + this.offsetX;
    const sy = (gx + gy) * (this.tileHeight / 2) * this.scale + this.offsetY;
    return { x: sx, y: sy };
  }

  screenToGrid(sx, sy) {
    const ax = sx - this.offsetX;
    const ay = sy - this.offsetY;
    const tw = (this.tileWidth / 2) * this.scale;
    const th = (this.tileHeight / 2) * this.scale;
    const gx = (ax / tw + ay / th) / 2;
    const gy = (ay / th - ax / tw) / 2;
    return { x: Math.floor(gx), y: Math.floor(gy) };
  }

  centerOn(rows, cols) {
    const centerX = (cols / 2);
    const centerY = (rows / 2);
    const screen = {
      x: (centerX - centerY) * (this.tileWidth / 2) * this.scale,
      y: (centerX + centerY) * (this.tileHeight / 2) * this.scale
    };
    this.offsetX = this.screenW / 2 - screen.x;
    this.offsetY = this.screenH / 3 - screen.y;
  }

  drawTile(gx, gy, fillColor, strokeColor = null, lineWidth = 1) {
    const { x, y } = this.gridToScreen(gx, gy);
    const tw = (this.tileWidth / 2) * this.scale;
    const th = (this.tileHeight / 2) * this.scale;
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tw, y + th);
    ctx.lineTo(x, y + 2 * th);
    ctx.lineTo(x - tw, y + th);
    ctx.closePath();

    ctx.fillStyle = fillColor;
    ctx.fill();

    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth * this.scale;
      ctx.stroke();
    }
  }

  drawTile3D(gx, gy, topColor, sideColor, depth = 4) {
    const { x, y } = this.gridToScreen(gx, gy);
    const tw = (this.tileWidth / 2) * this.scale;
    const th = (this.tileHeight / 2) * this.scale;
    const d = depth * this.scale;
    const ctx = this.ctx;

    // Left side
    ctx.beginPath();
    ctx.moveTo(x - tw, y + th);
    ctx.lineTo(x, y + 2 * th);
    ctx.lineTo(x, y + 2 * th + d);
    ctx.lineTo(x - tw, y + th + d);
    ctx.closePath();
    ctx.fillStyle = this.darkenColor(sideColor, 0.3);
    ctx.fill();

    // Right side
    ctx.beginPath();
    ctx.moveTo(x + tw, y + th);
    ctx.lineTo(x, y + 2 * th);
    ctx.lineTo(x, y + 2 * th + d);
    ctx.lineTo(x + tw, y + th + d);
    ctx.closePath();
    ctx.fillStyle = this.darkenColor(sideColor, 0.15);
    ctx.fill();

    // Top face
    this.drawTile(gx, gy, topColor);
  }

  drawOnTile(gx, gy, text, size = 20, offsetYPixels = 0) {
    const { x, y } = this.gridToScreen(gx, gy);
    const th = (this.tileHeight / 2) * this.scale;
    const ctx = this.ctx;
    ctx.font = `${size * this.scale}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + th + offsetYPixels * this.scale);
  }

  drawLabelOnTile(gx, gy, text, bgColor, textColor, offsetYPixels = 12) {
    const { x, y } = this.gridToScreen(gx, gy);
    const th = (this.tileHeight / 2) * this.scale;
    const ctx = this.ctx;
    const fontSize = 9 * this.scale;
    ctx.font = `bold ${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-main')}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ty = y + th + offsetYPixels * this.scale;
    const metrics = ctx.measureText(text);
    const pw = metrics.width + 6 * this.scale;
    const ph = fontSize + 4 * this.scale;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x - pw / 2, ty - ph / 2, pw, ph, 3 * this.scale);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, ty);
  }

  drawProgressOnTile(gx, gy, progress, color = '#4CAF50', offsetYPixels = 16) {
    const { x, y } = this.gridToScreen(gx, gy);
    const th = (this.tileHeight / 2) * this.scale;
    const ctx = this.ctx;
    const barW = 30 * this.scale;
    const barH = 5 * this.scale;
    const bx = x - barW / 2;
    const by = y + th + offsetYPixels * this.scale;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(bx, by, barW, barH, 2 * this.scale);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW * Utils.clamp(progress, 0, 1), barH, 2 * this.scale);
    ctx.fill();
  }

  drawTileHighlight(gx, gy, color = 'rgba(255, 255, 255, 0.4)') {
    this.drawTile(gx, gy, color, 'rgba(255,255,255,0.8)', 2);
  }

  drawPlacementIndicator(gx, gy, valid) {
    const color = valid ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)';
    const stroke = valid ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)';
    this.drawTile(gx, gy, color, stroke, 2);
  }

  addParticle(screenX, screenY, emoji, count = 5) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: screenX, y: screenY,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3 - 1,
        life: 1, decay: 0.02 + Math.random() * 0.02,
        emoji: emoji, size: 12 + Math.random() * 8,
        type: 'normal'
      });
    }
  }

  // Burst particles for combos and big events
  addBurstParticle(screenX, screenY, emojis, count = 10) {
    const emojiArr = Array.isArray(emojis) ? emojis : [emojis];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: screenX, y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1, decay: 0.015 + Math.random() * 0.01,
        emoji: emojiArr[i % emojiArr.length],
        size: 14 + Math.random() * 10,
        type: 'burst',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  // Coin shower effect for big earnings
  addCoinShower(screenX, screenY, count = 15) {
    const coins = ['🪙', '💰', '✨'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: screenX + (Math.random() - 0.5) * 60,
        y: screenY - Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 5 - 2,
        life: 1, decay: 0.012 + Math.random() * 0.008,
        emoji: coins[Math.floor(Math.random() * coins.length)],
        size: 10 + Math.random() * 12,
        type: 'shower',
        gravity: 0.08
      });
    }
  }

  updateParticles() {
    const ctx = this.ctx;
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.05;
      p.life -= p.decay;
      if (p.life <= 0) return false;

      ctx.save();
      ctx.globalAlpha = Math.min(p.life, 1);

      if (p.type === 'burst' && p.rotation !== undefined) {
        ctx.translate(p.x, p.y);
        p.rotation += p.rotSpeed || 0;
        ctx.rotate(p.rotation);
        ctx.font = `${p.size * p.life}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.emoji, 0, 0);
      } else {
        const scale = p.type === 'shower' ? (0.5 + p.life * 0.5) : 1;
        ctx.font = `${p.size * scale}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.emoji, p.x, p.y);
      }

      ctx.restore();
      return true;
    });
  }

  drawSparkle(gx, gy) {
    const { x, y } = this.gridToScreen(gx, gy);
    const th = (this.tileHeight / 2) * this.scale;
    const ctx = this.ctx;
    const time = Date.now() / 300;

    for (let i = 0; i < 3; i++) {
      const angle = time + (i * Math.PI * 2 / 3);
      const r = 10 * this.scale;
      const sx = x + Math.cos(angle) * r;
      const sy = y + th + Math.sin(angle) * r * 0.5;
      const alpha = 0.5 + 0.5 * Math.sin(time * 2 + i);

      ctx.globalAlpha = alpha;
      ctx.font = `${8 * this.scale}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('✨', sx, sy);
    }
    ctx.globalAlpha = 1;
  }

  darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
  }

  lerpColor(c1, c2, t) {
    const parse = (c) => {
      if (c.startsWith('#')) return [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];
      return [0,0,0];
    };
    const [r1,g1,b1] = parse(c1);
    const [r2,g2,b2] = parse(c2);
    return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.screenW, this.screenH);
  }

  // Draw sky background with day/night, clouds, birds, scenery, weather
  drawBackground() {
    const ctx = this.ctx;

    // Update day/night
    this.dayTime = (this.dayTime + this.daySpeed) % 1;
    const t = this.dayTime;

    // Sky gradient based on time
    let topColor, midColor, botColor;
    if (t < 0.2 || t > 0.85) {
      topColor = '#1a237e'; midColor = '#283593'; botColor = '#1b5e20';
    } else if (t < 0.3) {
      const p = (t - 0.2) / 0.1;
      topColor = this.lerpColor('#1a237e','#87CEEB',p);
      midColor = this.lerpColor('#283593','#FFB74D',p);
      botColor = this.lerpColor('#1b5e20','#C8E6C9',p);
    } else if (t < 0.7) {
      topColor = '#87CEEB'; midColor = '#B2EBF2'; botColor = '#C8E6C9';
    } else if (t < 0.8) {
      const p = (t - 0.7) / 0.1;
      topColor = this.lerpColor('#87CEEB','#E65100',p);
      midColor = this.lerpColor('#B2EBF2','#FF6F00',p);
      botColor = this.lerpColor('#C8E6C9','#33691E',p);
    } else {
      const p = (t - 0.8) / 0.05;
      topColor = this.lerpColor('#E65100','#1a237e',Math.min(p,1));
      midColor = this.lerpColor('#FF6F00','#283593',Math.min(p,1));
      botColor = this.lerpColor('#33691E','#1b5e20',Math.min(p,1));
    }

    const grad = ctx.createLinearGradient(0, 0, 0, this.screenH);
    grad.addColorStop(0, topColor);
    grad.addColorStop(0.5, midColor);
    grad.addColorStop(1, botColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.screenW, this.screenH);

    // Sun or moon
    const isDay = t > 0.25 && t < 0.75;
    const phase = isDay ? (t - 0.25) / 0.5 : ((t < 0.25 ? t + 0.25 : t - 0.75) / 0.5);
    const cx = this.screenW * 0.1 + this.screenW * 0.8 * phase;
    const cy = this.screenH * 0.12 + Math.sin(phase * Math.PI) * -40;

    ctx.font = '26px serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.85;
    ctx.fillText(isDay ? '☀️' : '🌙', cx, cy);
    ctx.globalAlpha = 1;

    // Stars at night
    if (t < 0.25 || t > 0.8) {
      const alpha = t < 0.25 ? Math.min(0.5, (0.25 - t) * 4) : Math.min(0.5, (t - 0.8) * 4);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'white';
      const time = Date.now() / 2000;
      for (let i = 0; i < 15; i++) {
        const sx = (i * 137.5) % this.screenW;
        const sy = (i * 97.3) % (this.screenH * 0.35);
        const tw2 = 0.5 + 0.5 * Math.sin(time + i * 0.7);
        ctx.font = `${3 + tw2 * 3}px sans-serif`;
        ctx.fillText('✦', sx, sy);
      }
      ctx.globalAlpha = 1;
    }

    // Clouds
    ctx.globalAlpha = 0.45;
    const cloudOff = (Date.now() / 50000) % 1;
    for (let i = 0; i < 5; i++) {
      const ccx = ((i * 0.22 + cloudOff) % 1.3 - 0.15) * this.screenW;
      const ccy = 25 + i * 22;
      ctx.font = `${18 + i * 4}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('☁️', ccx, ccy);
    }
    ctx.globalAlpha = 1;

    // Birds
    const birdTime = Date.now() / 1000;
    this.birds.forEach(bird => {
      bird.x += bird.speed;
      if (bird.x > this.screenW + 50) { bird.x = -30; bird.y = 15 + Math.random() * 60; }
      const wingY = Math.sin(birdTime * 4 + bird.wingPhase) * 3;
      ctx.globalAlpha = 0.5;
      ctx.font = `${bird.size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(wingY > 0 ? '🐦' : '🕊️', bird.x, bird.y + wingY);
    });
    ctx.globalAlpha = 1;

    // Distant hills
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.moveTo(0, this.screenH);
    for (let x = 0; x <= this.screenW; x += 40) {
      const h = 80 + Math.sin(x * 0.01 + 1) * 30 + Math.sin(x * 0.005) * 50;
      ctx.lineTo(x, this.screenH - h);
    }
    ctx.lineTo(this.screenW, this.screenH);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Weather effects
    this.weatherTimer++;
    if (this.weatherTimer > 6000) {
      this.weatherTimer = 0;
      const r = Math.random();
      this.weatherType = r < 0.6 ? 'clear' : r < 0.85 ? 'butterflies' : 'rain';
    }

    if (this.weatherType === 'rain') {
      if (this.weatherParticles.length < 30) {
        this.weatherParticles.push({
          x: Math.random() * this.screenW, y: -10,
          speed: 4 + Math.random() * 3, length: 8 + Math.random() * 8, life: 999
        });
      }
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.35)';
      ctx.lineWidth = 1;
      this.weatherParticles = this.weatherParticles.filter(p => {
        p.y += p.speed; p.x -= 1;
        if (p.y > this.screenH) return false;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y + p.length); ctx.stroke();
        return true;
      });
    } else if (this.weatherType === 'butterflies') {
      const wTime = Date.now() / 1000;
      if (this.weatherParticles.length < 4) {
        this.weatherParticles.push({
          x: Math.random() * this.screenW,
          y: this.screenH * 0.3 + Math.random() * this.screenH * 0.4,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.4,
          life: 300 + Math.random() * 200
        });
      }
      this.weatherParticles = this.weatherParticles.filter(p => {
        p.x += Math.cos(wTime + p.phase) * p.speed;
        p.y += Math.sin(wTime * 1.5 + p.phase) * p.speed * 0.5;
        p.life--;
        if (p.life <= 0) return false;
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.font = '14px serif'; ctx.textAlign = 'center';
        ctx.fillText('🦋', p.x, p.y);
        ctx.globalAlpha = 1;
        return true;
      });
    } else {
      this.weatherParticles = this.weatherParticles.filter(p => { p.life = (p.life || 30) - 1; return p.life > 0; });
    }
  }

  // Draw day/night overlay (called after all game rendering)
  drawDayNightOverlay() {
    const t = this.dayTime;
    let alpha = 0;
    if (t < 0.2) alpha = 0.3;
    else if (t < 0.3) alpha = 0.3 * (1 - (t - 0.2) / 0.1);
    else if (t > 0.75 && t <= 0.85) alpha = 0.3 * ((t - 0.75) / 0.1);
    else if (t > 0.85) alpha = 0.3;

    if (alpha > 0) {
      this.ctx.fillStyle = `rgba(10, 20, 60, ${alpha})`;
      this.ctx.fillRect(0, 0, this.screenW, this.screenH);
    }
  }
}
