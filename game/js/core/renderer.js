// =========================================
// Isometric Farm Renderer
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

  // Convert grid coordinates to screen (isometric) coordinates
  gridToScreen(gx, gy) {
    const sx = (gx - gy) * (this.tileWidth / 2) * this.scale + this.offsetX;
    const sy = (gx + gy) * (this.tileHeight / 2) * this.scale + this.offsetY;
    return { x: sx, y: sy };
  }

  // Convert screen coordinates to grid coordinates
  screenToGrid(sx, sy) {
    const ax = sx - this.offsetX;
    const ay = sy - this.offsetY;
    const tw = (this.tileWidth / 2) * this.scale;
    const th = (this.tileHeight / 2) * this.scale;
    const gx = (ax / tw + ay / th) / 2;
    const gy = (ay / th - ax / tw) / 2;
    return { x: Math.floor(gx), y: Math.floor(gy) };
  }

  // Center view on grid
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

  // Draw isometric diamond tile
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

  // Draw tile with 3D depth effect
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

  // Draw emoji/text on a tile
  drawOnTile(gx, gy, text, size = 20, offsetYPixels = 0) {
    const { x, y } = this.gridToScreen(gx, gy);
    const th = (this.tileHeight / 2) * this.scale;
    const ctx = this.ctx;
    ctx.font = `${size * this.scale}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + th + offsetYPixels * this.scale);
  }

  // Draw text on tile with background
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

  // Draw progress bar on a tile
  drawProgressOnTile(gx, gy, progress, color = '#4CAF50', offsetYPixels = 16) {
    const { x, y } = this.gridToScreen(gx, gy);
    const th = (this.tileHeight / 2) * this.scale;
    const ctx = this.ctx;
    const barW = 30 * this.scale;
    const barH = 5 * this.scale;
    const bx = x - barW / 2;
    const by = y + th + offsetYPixels * this.scale;

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.roundRect(bx, by, barW, barH, 2 * this.scale);
    ctx.fill();

    // Fill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx, by, barW * Utils.clamp(progress, 0, 1), barH, 2 * this.scale);
    ctx.fill();
  }

  // Draw highlight around a tile
  drawTileHighlight(gx, gy, color = 'rgba(255, 255, 255, 0.4)') {
    this.drawTile(gx, gy, color, 'rgba(255,255,255,0.8)', 2);
  }

  // Draw placement indicator (green/red)
  drawPlacementIndicator(gx, gy, valid) {
    const color = valid
      ? 'rgba(76, 175, 80, 0.4)'
      : 'rgba(244, 67, 54, 0.4)';
    const stroke = valid
      ? 'rgba(76, 175, 80, 0.8)'
      : 'rgba(244, 67, 54, 0.8)';
    this.drawTile(gx, gy, color, stroke, 2);
  }

  // Add particle effect
  addParticle(screenX, screenY, emoji, count = 5) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: screenX,
        y: screenY,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3 - 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        emoji: emoji,
        size: 12 + Math.random() * 8
      });
    }
  }

  // Update & draw particles
  updateParticles(dt) {
    const ctx = this.ctx;
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life -= p.decay;

      if (p.life <= 0) return false;

      ctx.globalAlpha = p.life;
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.emoji, p.x, p.y);
      ctx.globalAlpha = 1;
      return true;
    });
  }

  // Draw sparkle effect on a tile
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

  // Darken a hex color
  darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
  }

  // Clear the canvas
  clear() {
    this.ctx.clearRect(0, 0, this.screenW, this.screenH);
  }

  // Draw sky background
  drawBackground() {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.screenH);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.5, '#B2EBF2');
    grad.addColorStop(1, '#C8E6C9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.screenW, this.screenH);

    // Draw simple clouds
    ctx.globalAlpha = 0.5;
    const cloudOffset = (Date.now() / 50000) % 1;
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 0.25 + cloudOffset) % 1.3 - 0.15) * this.screenW;
      const cy = 30 + i * 25;
      ctx.font = `${20 + i * 5}px serif`;
      ctx.fillText('☁️', cx, cy);
    }
    ctx.globalAlpha = 1;
  }
}
