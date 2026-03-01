// scene.js — Canvas-based scene rendering for each phase
'use strict';

const SceneRenderer = (() => {
  let canvas, ctx;
  let currentPhase = 1;
  let animFrame;
  let particles = [];
  let stars = [];
  let time = 0;

  // ===== Section 70: Scene Illustration System =====
  // Per-phase layer specs and art direction

  // Section 78: Shared particle engine
  const AMBIENT_CONFIGS = {
    1: { type: 'dust', count: 8, color: 'rgba(210, 180, 140, 0.35)', speed: 0.3, size: [1, 3], drift: true },
    2: { type: 'debris', count: 6, color: 'rgba(150, 180, 220, 0.3)', speed: 0.2, size: [1, 2], drift: false },
    3: { type: 'moondust', count: 5, color: 'rgba(180, 180, 200, 0.25)', speed: 0.15, size: [0.5, 2], drift: true },
    4: { type: 'sandstorm', count: 12, color: 'rgba(193, 68, 14, 0.3)', speed: 0.5, size: [1, 3], drift: true },
    5: { type: 'ice', count: 10, color: 'rgba(200, 200, 255, 0.3)', speed: 0.4, size: [1, 2.5], drift: false },
    6: { type: 'gas', count: 8, color: 'rgba(232, 160, 76, 0.2)', speed: 0.25, size: [2, 5], drift: true },
    7: { type: 'stardust', count: 15, color: 'rgba(80, 200, 120, 0.3)', speed: 0.3, size: [0.5, 2], drift: false },
    8: { type: 'cosmic', count: 20, color: 'rgba(200, 200, 255, 0.25)', speed: 0.15, size: [0.5, 1.5], drift: false },
    9: { type: 'rift', count: 25, color: 'rgba(255, 215, 0, 0.2)', speed: 0.4, size: [1, 3], drift: true }
  };

  let ambientParticles = [];
  let parallaxOffset = { x: 0, y: 0 };
  let targetParallax = { x: 0, y: 0 };

  // Parallax tilt tracking
  function initParallax() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          targetParallax.x = (e.gamma / 45) * 8; // ±8px
          targetParallax.y = ((e.beta - 45) / 45) * 6; // ±6px
        }
      }, { passive: true });
    }
    // Mouse fallback for desktop
    document.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetParallax.x = ((e.clientX - cx) / cx) * 6;
      targetParallax.y = ((e.clientY - cy) / cy) * 4;
    }, { passive: true });
  }

  function updateParallax() {
    parallaxOffset.x += (targetParallax.x - parallaxOffset.x) * 0.05;
    parallaxOffset.y += (targetParallax.y - parallaxOffset.y) * 0.05;
  }

  // Initialize ambient particles for current phase
  function generateAmbientParticles() {
    const config = AMBIENT_CONFIGS[currentPhase];
    if (!config) return;
    ambientParticles = [];
    for (let i = 0; i < config.count; i++) {
      ambientParticles.push({
        x: Math.random(),
        y: Math.random(),
        size: config.size[0] + Math.random() * (config.size[1] - config.size[0]),
        speed: config.speed * (0.5 + Math.random() * 0.5),
        angle: Math.random() * Math.PI * 2,
        drift: config.drift ? (Math.random() - 0.5) * 0.5 : 0,
        alpha: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function drawAmbientParticles(w, h) {
    const config = AMBIENT_CONFIGS[currentPhase];
    if (!config || ambientParticles.length === 0) return;

    for (const p of ambientParticles) {
      // Move particle
      p.x += (Math.cos(p.angle) * p.speed + p.drift * Math.sin(time * 0.5 + p.phase)) * 0.001;
      p.y += (Math.sin(p.angle) * p.speed) * 0.001;

      // Wrap around
      if (p.x < -0.05) p.x = 1.05;
      if (p.x > 1.05) p.x = -0.05;
      if (p.y < -0.05) p.y = 1.05;
      if (p.y > 1.05) p.y = -0.05;

      // Twinkle
      const twinkle = 0.5 + Math.sin(time * 2 + p.phase) * 0.5;
      const alpha = p.alpha * twinkle;

      ctx.fillStyle = config.color.replace(/[\d.]+\)$/, alpha.toFixed(2) + ')');
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function init() {
    canvas = document.getElementById('scene-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    generateStars();
    generateAmbientParticles();
    initParallax();
    animate();
  }

  function resize() {
    if (!canvas) return;
    const container = document.getElementById('scene-area');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  function setPhase(phase) {
    currentPhase = phase;
    generateStars();
    generateAmbientParticles();
  }

  function generateStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 2 + 1
      });
    }
  }

  function animate() {
    time += 0.016;
    updateParallax();
    draw();
    animFrame = requestAnimationFrame(animate);
  }

  function draw() {
    if (!ctx || !canvas.width) return;
    const w = canvas.width;
    const h = canvas.height;

    // Apply parallax transform to canvas context
    ctx.save();
    ctx.translate(parallaxOffset.x * 0.5, parallaxOffset.y * 0.5);

    switch (currentPhase) {
      case 1: drawJunkyard(w, h); break;
      case 2: drawOrbit(w, h); break;
      case 3: drawMoon(w, h); break;
      case 4: drawMars(w, h); break;
      case 5: drawAsteroids(w, h); break;
      case 6: drawJupiter(w, h); break;
      case 7: drawInterstellar(w, h); break;
      case 8: drawGalaxy(w, h); break;
      case 9: drawMultiverse(w, h); break;
      default: drawJunkyard(w, h);
    }

    ctx.restore();

    // Ambient particles (above scene, no parallax)
    drawAmbientParticles(w, h);

    // Tap-burst and effect particles
    drawParticles(w, h);
  }

  function drawJunkyard(w, h) {
    // Sky gradient — warm desert junkyard
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(0.6, '#C9B896');
    skyGrad.addColorStop(1, '#E8D5B7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun with glow
    ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.15, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.15, 22, 0, Math.PI * 2);
    ctx.fill();

    // Distant hills
    ctx.fillStyle = '#C4A97D';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.48);
    ctx.quadraticCurveTo(w * 0.2, h * 0.40, w * 0.4, h * 0.47);
    ctx.quadraticCurveTo(w * 0.6, h * 0.42, w * 0.8, h * 0.46);
    ctx.quadraticCurveTo(w * 0.9, h * 0.43, w, h * 0.47);
    ctx.lineTo(w, h * 0.55);
    ctx.lineTo(0, h * 0.55);
    ctx.fill();

    // Ground with subtle texture gradient
    const groundGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
    groundGrad.addColorStop(0, '#D2B48C');
    groundGrad.addColorStop(1, '#B8976A');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.55, w, h * 0.45);

    // Ground texture lines
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const gy = h * 0.58 + i * h * 0.05;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy + Math.sin(i) * 3);
      ctx.stroke();
    }

    // Fence (chain-link style)
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.4);
      ctx.lineTo(x, h * 0.55);
      ctx.stroke();
    }
    // Horizontal fence wires
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    for (let fy = h * 0.42; fy < h * 0.55; fy += 6) {
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(w, fy);
      ctx.stroke();
    }

    // Scrap piles — varied colors
    const s = GameState.getState();
    const genCount = GameData.getTotalGenerators(s);

    ctx.fillStyle = '#8B4513';
    drawScrapPile(w * 0.08, h * 0.6, 40, 25);
    ctx.fillStyle = '#7A6B5D';
    drawScrapPile(w * 0.28, h * 0.65, 55, 32);
    ctx.fillStyle = '#6B4226';
    drawScrapPile(w * 0.72, h * 0.6, 35, 20);

    // Metal scraps on ground
    ctx.fillStyle = '#A0A0A0';
    for (let i = 0; i < 6; i++) {
      const sx = w * 0.05 + i * w * 0.16;
      const sy = h * 0.7 + Math.sin(i * 2.3) * 8;
      ctx.fillRect(sx, sy, 4 + i % 3, 2);
    }

    // Rocket pad with lights
    ctx.fillStyle = '#555';
    ctx.fillRect(w * 0.5 - 32, h * 0.55, 64, 8);
    ctx.fillStyle = '#666';
    ctx.fillRect(w * 0.5 - 28, h * 0.55, 56, 6);
    // Pad warning stripes
    ctx.fillStyle = '#FFD700';
    for (let sx = w * 0.5 - 26; sx < w * 0.5 + 26; sx += 10) {
      ctx.fillRect(sx, h * 0.554, 5, 3);
    }

    // Rocket (if parts owned)
    drawRocket(w * 0.5, h * 0.55, s);

    // Animated elements based on generators
    if (genCount > 0) {
      // Scrap collector walking figure
      const walkX = (w * 0.2 + Math.sin(time * 0.5) * 50);
      const legSwing = Math.sin(time * 3) * 3;
      // Body
      ctx.fillStyle = '#654321';
      ctx.fillRect(walkX, h * 0.63, 6, 10);
      // Hard hat
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(walkX - 1, h * 0.615, 8, 4);
      // Legs
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(walkX + 2, h * 0.64 + 10);
      ctx.lineTo(walkX + 2 + legSwing, h * 0.64 + 15);
      ctx.moveTo(walkX + 4, h * 0.64 + 10);
      ctx.lineTo(walkX + 4 - legSwing, h * 0.64 + 15);
      ctx.stroke();
    }

    if (genCount >= 5) {
      // Metal detector sweeper
      const sweepX = (w * 0.6 + Math.cos(time * 0.3) * 40);
      const sweepAngle = Math.sin(time * 2) * 0.3;
      ctx.fillStyle = '#4A3728';
      ctx.fillRect(sweepX, h * 0.62, 5, 10);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(sweepX, h * 0.61, 5, 3);
      // Detector rod
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sweepX + 2, h * 0.65);
      ctx.lineTo(sweepX + 2 + Math.sin(sweepAngle) * 15, h * 0.72);
      ctx.stroke();
      // Detector head
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.arc(sweepX + 2 + Math.sin(sweepAngle) * 15, h * 0.72, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (genCount >= 10) {
      // Crane
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.85, h * 0.55);
      ctx.lineTo(w * 0.85, h * 0.28);
      ctx.lineTo(w * 0.68, h * 0.28);
      ctx.stroke();
      // Crane cab
      ctx.fillStyle = '#B8860B';
      ctx.fillRect(w * 0.83, h * 0.38, 8, 10);
      // Crane hook with cable
      const hookSwing = Math.sin(time * 0.8) * 12;
      const hookY = h * 0.33 + Math.sin(time) * 8;
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.74 + hookSwing * 0.3, h * 0.28);
      ctx.lineTo(w * 0.74 + hookSwing, hookY);
      ctx.stroke();
      // Hook
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w * 0.74 + hookSwing, hookY + 4, 4, 0, Math.PI);
      ctx.stroke();
    }

    if (genCount >= 15) {
      // Small drone flying
      const droneX = w * 0.4 + Math.sin(time * 0.7) * 60;
      const droneY = h * 0.35 + Math.cos(time * 0.5) * 15;
      ctx.fillStyle = '#333';
      ctx.fillRect(droneX - 4, droneY, 8, 3);
      // Propellers (spinning effect)
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
      ctx.lineWidth = 1;
      const propAngle = time * 20;
      ctx.beginPath();
      ctx.moveTo(droneX - 6, droneY - 1);
      ctx.lineTo(droneX - 6 + Math.cos(propAngle) * 5, droneY - 1);
      ctx.moveTo(droneX + 6, droneY - 1);
      ctx.lineTo(droneX + 6 + Math.cos(propAngle + Math.PI) * 5, droneY - 1);
      ctx.stroke();
      // Blinking light
      if (Math.sin(time * 4) > 0) {
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(droneX, droneY + 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (genCount >= 20) {
      // Second worker near scrap pile
      const w2x = w * 0.35 + Math.sin(time * 0.3 + 2) * 20;
      ctx.fillStyle = '#5B3A1E';
      ctx.fillRect(w2x, h * 0.635, 6, 10);
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(w2x - 1, h * 0.62, 8, 4); // Orange vest
    }

    // Birds in sky (subtle)
    ctx.strokeStyle = 'rgba(50, 50, 50, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const bx = (w * 0.3 + i * 80 + time * 8) % (w + 40) - 20;
      const by = h * 0.12 + i * 15 + Math.sin(time * 2 + i) * 5;
      ctx.beginPath();
      ctx.moveTo(bx - 4, by + 2);
      ctx.quadraticCurveTo(bx, by - 2, bx + 4, by + 2);
      ctx.stroke();
    }

    // Dust particles — wind-blown
    ctx.fillStyle = 'rgba(210, 180, 140, 0.4)';
    for (let i = 0; i < 8; i++) {
      const px = (time * 25 + i * 60) % w;
      const py = h * 0.5 + Math.sin(time * 1.5 + i * 0.7) * 15;
      const pSize = 1 + Math.sin(i) * 1;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawScrapPile(x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    ctx.lineTo(x - w / 3, y - h);
    ctx.lineTo(x + w / 4, y - h * 0.8);
    ctx.lineTo(x + w / 2, y);
    ctx.fill();
  }

  function drawRocket(x, baseY, s) {
    const scale = 0.85;
    const partsCount = ['engine', 'fuelTank', 'hull', 'navigationComputer', 'noseCone']
      .filter(p => s.rocketParts[p]).length;

    // Blueprint ghost outline (shows what's coming)
    if (partsCount > 0 && partsCount < 5) {
      ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, baseY - 75 * scale);
      ctx.lineTo(x - 12 * scale, baseY - 55 * scale);
      ctx.lineTo(x - 12 * scale, baseY - 8 * scale);
      ctx.lineTo(x - 8 * scale, baseY);
      ctx.lineTo(x + 8 * scale, baseY);
      ctx.lineTo(x + 12 * scale, baseY - 8 * scale);
      ctx.lineTo(x + 12 * scale, baseY - 55 * scale);
      ctx.lineTo(x, baseY - 75 * scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Engine — bottom nozzle
    if (s.rocketParts.engine) {
      // Nozzle body
      ctx.fillStyle = '#3A3A3A';
      ctx.beginPath();
      ctx.moveTo(x - 12 * scale, baseY - 8 * scale);
      ctx.lineTo(x + 12 * scale, baseY - 8 * scale);
      ctx.lineTo(x + 9 * scale, baseY + 2 * scale);
      ctx.lineTo(x - 9 * scale, baseY + 2 * scale);
      ctx.fill();
      // Inner nozzle
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(x - 8 * scale, baseY - 6 * scale);
      ctx.lineTo(x + 8 * scale, baseY - 6 * scale);
      ctx.lineTo(x + 6 * scale, baseY);
      ctx.lineTo(x - 6 * scale, baseY);
      ctx.fill();
      // Engine glow (idle)
      ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, baseY + 1 * scale, 5 * scale, 0, Math.PI * 2);
      ctx.fill();
      // Exhaust flicker
      if (Math.sin(time * 8) > 0) {
        ctx.fillStyle = 'rgba(255, 150, 50, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x - 4 * scale, baseY + 2 * scale);
        ctx.lineTo(x, baseY + 8 * scale + Math.random() * 3);
        ctx.lineTo(x + 4 * scale, baseY + 2 * scale);
        ctx.fill();
      }
    }

    // Fuel tank — above engine
    if (s.rocketParts.fuelTank) {
      ctx.fillStyle = '#DDD';
      ctx.fillRect(x - 10 * scale, baseY - 40 * scale, 20 * scale, 30 * scale);
      // Tank rivets
      ctx.fillStyle = '#BBB';
      ctx.beginPath();
      ctx.arc(x - 8 * scale, baseY - 35 * scale, 1, 0, Math.PI * 2);
      ctx.arc(x + 8 * scale, baseY - 35 * scale, 1, 0, Math.PI * 2);
      ctx.arc(x - 8 * scale, baseY - 15 * scale, 1, 0, Math.PI * 2);
      ctx.arc(x + 8 * scale, baseY - 15 * scale, 1, 0, Math.PI * 2);
      ctx.fill();
      // FUEL label
      ctx.fillStyle = '#555';
      ctx.font = `bold ${5 * scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('FUEL', x, baseY - 22 * scale);
      ctx.textAlign = 'start';
    }

    // Hull — main body
    if (s.rocketParts.hull) {
      // Main hull body
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(x - 12 * scale, baseY - 55 * scale, 24 * scale, 50 * scale);
      // Hull panel lines
      ctx.strokeStyle = 'rgba(160, 160, 160, 0.6)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x - 12 * scale, baseY - 35 * scale);
      ctx.lineTo(x + 12 * scale, baseY - 35 * scale);
      ctx.moveTo(x, baseY - 55 * scale);
      ctx.lineTo(x, baseY - 5 * scale);
      ctx.stroke();
      // Hull border
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 12 * scale, baseY - 55 * scale, 24 * scale, 50 * scale);
      // Window
      ctx.fillStyle = 'rgba(100, 180, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(x, baseY - 45 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#AAA';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Fins
      ctx.fillStyle = '#999';
      ctx.beginPath();
      ctx.moveTo(x - 12 * scale, baseY - 10 * scale);
      ctx.lineTo(x - 18 * scale, baseY - 2 * scale);
      ctx.lineTo(x - 12 * scale, baseY - 2 * scale);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 12 * scale, baseY - 10 * scale);
      ctx.lineTo(x + 18 * scale, baseY - 2 * scale);
      ctx.lineTo(x + 12 * scale, baseY - 2 * scale);
      ctx.fill();
    }

    // Nav computer — side panel
    if (s.rocketParts.navigationComputer) {
      ctx.fillStyle = '#003366';
      ctx.fillRect(x + 8 * scale, baseY - 50 * scale, 7 * scale, 8 * scale);
      // Screen glow
      ctx.fillStyle = 'rgba(0, 255, 128, 0.4)';
      ctx.fillRect(x + 9 * scale, baseY - 49 * scale, 5 * scale, 4 * scale);
      // Blinking indicators
      const blink1 = Math.sin(time * 3) > 0;
      const blink2 = Math.sin(time * 4 + 1) > 0;
      ctx.fillStyle = blink1 ? '#00FF00' : '#003300';
      ctx.fillRect(x + 9 * scale, baseY - 44 * scale, 2 * scale, 2 * scale);
      ctx.fillStyle = blink2 ? '#FFAA00' : '#332200';
      ctx.fillRect(x + 12 * scale, baseY - 44 * scale, 2 * scale, 2 * scale);
    }

    // Nose cone — top
    if (s.rocketParts.noseCone) {
      ctx.fillStyle = '#CC0000';
      ctx.beginPath();
      ctx.moveTo(x, baseY - 78 * scale);
      ctx.lineTo(x - 12 * scale, baseY - 55 * scale);
      ctx.lineTo(x + 12 * scale, baseY - 55 * scale);
      ctx.fill();
      // Highlight stripe
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.moveTo(x - 2 * scale, baseY - 76 * scale);
      ctx.lineTo(x - 6 * scale, baseY - 55 * scale);
      ctx.lineTo(x - 2 * scale, baseY - 55 * scale);
      ctx.fill();
      // Antenna tip
      ctx.strokeStyle = '#DDD';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, baseY - 78 * scale);
      ctx.lineTo(x, baseY - 83 * scale);
      ctx.stroke();
    }

    // All parts assembled — glow effect
    if (partsCount === 5) {
      ctx.shadowColor = 'rgba(100, 200, 255, 0.4)';
      ctx.shadowBlur = 8 + Math.sin(time * 2) * 4;
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, baseY - 83 * scale);
      ctx.lineTo(x - 14 * scale, baseY - 55 * scale);
      ctx.lineTo(x - 14 * scale, baseY - 8 * scale);
      ctx.lineTo(x + 14 * scale, baseY - 8 * scale);
      ctx.lineTo(x + 14 * scale, baseY - 55 * scale);
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    }
  }

  function drawOrbit(w, h) {
    // Space background
    ctx.fillStyle = '#0A0A2A';
    ctx.fillRect(0, 0, w, h);
    drawStarfield(w, h);

    // Earth
    const earthR = Math.min(w, h) * 0.35;
    const earthX = w * 0.5;
    const earthY = h + earthR * 0.6;

    const earthGrad = ctx.createRadialGradient(earthX, earthY, earthR * 0.8, earthX, earthY, earthR);
    earthGrad.addColorStop(0, '#1E90FF');
    earthGrad.addColorStop(0.3, '#228B22');
    earthGrad.addColorStop(0.6, '#1E90FF');
    earthGrad.addColorStop(0.8, '#87CEEB');
    earthGrad.addColorStop(1, '#000');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    ctx.fill();

    // Atmosphere glow
    ctx.strokeStyle = 'rgba(135, 206, 235, 0.3)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR + 3, Math.PI, Math.PI * 2);
    ctx.stroke();

    // Small satellite
    const satAngle = time * 0.3;
    const satX = earthX + Math.cos(satAngle) * (earthR + 30);
    const satY = earthY + Math.sin(satAngle) * (earthR + 30) * 0.3;
    if (satY < earthY) {
      ctx.fillStyle = '#CCC';
      ctx.fillRect(satX - 3, satY - 1, 6, 2);
      ctx.fillStyle = '#4A90D9';
      ctx.fillRect(satX - 8, satY - 1, 5, 2);
      ctx.fillRect(satX + 3, satY - 1, 5, 2);
    }

    // Sun lens flare
    ctx.fillStyle = 'rgba(255, 255, 200, 0.15)';
    ctx.beginPath();
    ctx.arc(w - 10, 20, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMoon(w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    drawStarfield(w, h);

    // Earth in sky — detailed with atmosphere
    const earthX = w * 0.82;
    const earthY = h * 0.14;
    const earthR = 16;
    const earthGlow = ctx.createRadialGradient(earthX, earthY, earthR, earthX, earthY, earthR + 6);
    earthGlow.addColorStop(0, 'rgba(30, 144, 255, 0.3)');
    earthGlow.addColorStop(1, 'rgba(30, 144, 255, 0)');
    ctx.fillStyle = earthGlow;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR + 6, 0, Math.PI * 2);
    ctx.fill();
    // Earth surface
    const earthGrad = ctx.createRadialGradient(earthX - 3, earthY - 3, 2, earthX, earthY, earthR);
    earthGrad.addColorStop(0, '#4A90D9');
    earthGrad.addColorStop(0.4, '#228B22');
    earthGrad.addColorStop(0.7, '#1E90FF');
    earthGrad.addColorStop(1, '#0D4F8B');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
    ctx.fill();

    // Lunar surface with subtle terrain
    const surfaceY = h * 0.6;
    const surfGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
    surfGrad.addColorStop(0, '#B8B8B8');
    surfGrad.addColorStop(0.3, '#A8A8A8');
    surfGrad.addColorStop(1, '#888888');
    ctx.fillStyle = surfGrad;
    ctx.fillRect(0, surfaceY, w, h - surfaceY);

    // Terrain undulation
    ctx.fillStyle = '#B0B0B0';
    ctx.beginPath();
    ctx.moveTo(0, surfaceY);
    for (let x = 0; x <= w; x += 10) {
      const undulate = Math.sin(x * 0.03) * 4 + Math.sin(x * 0.07) * 2;
      ctx.lineTo(x, surfaceY + undulate);
    }
    ctx.lineTo(w, surfaceY + 10);
    ctx.lineTo(0, surfaceY + 10);
    ctx.fill();

    // Craters with depth
    ctx.fillStyle = '#909090';
    drawCrater(w * 0.12, surfaceY + 22, 25);
    drawCrater(w * 0.38, surfaceY + 38, 15);
    drawCrater(w * 0.62, surfaceY + 16, 20);
    drawCrater(w * 0.88, surfaceY + 32, 12);
    // Smaller craters for texture
    ctx.fillStyle = '#989898';
    drawCrater(w * 0.25, surfaceY + 45, 8);
    drawCrater(w * 0.52, surfaceY + 50, 6);
    drawCrater(w * 0.75, surfaceY + 42, 10);

    // Base structures based on generators — progressive base building
    const s = GameState.getState();
    const genCount = GameData.getTotalGenerators(s);

    // Phase 3 base: hab dome appears first
    if (genCount > 0) {
      // Primary hab dome
      ctx.fillStyle = '#DDD';
      ctx.beginPath();
      ctx.arc(w * 0.5, surfaceY - 1, 16, Math.PI, 0);
      ctx.fill();
      // Dome window
      ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(w * 0.5, surfaceY - 6, 5, Math.PI, 0);
      ctx.fill();
      // Dome base ring
      ctx.fillStyle = '#AAA';
      ctx.fillRect(w * 0.5 - 16, surfaceY - 2, 32, 4);
      // Airlock door
      ctx.fillStyle = '#999';
      ctx.fillRect(w * 0.5 + 12, surfaceY - 8, 4, 8);
    }

    if (genCount >= 5) {
      // Drill rig (ore extractors)
      const drillX = w * 0.2;
      ctx.strokeStyle = '#B0B0B0';
      ctx.lineWidth = 2;
      // Drill tower
      ctx.beginPath();
      ctx.moveTo(drillX, surfaceY);
      ctx.lineTo(drillX, surfaceY - 25);
      ctx.moveTo(drillX - 6, surfaceY);
      ctx.lineTo(drillX, surfaceY - 25);
      ctx.lineTo(drillX + 6, surfaceY);
      ctx.stroke();
      // Drill bit (animated)
      const drillSpin = time * 3;
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(drillX, surfaceY + 3, 3, drillSpin, drillSpin + Math.PI);
      ctx.fill();
      // Sparks from drill
      if (Math.sin(time * 5) > 0.3) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(drillX + Math.random() * 4 - 2, surfaceY + 2, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (genCount >= 10) {
      // Power lines connecting base elements
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
      ctx.lineWidth = 1;
      // Power pylons
      for (let px = w * 0.25; px < w * 0.75; px += w * 0.12) {
        ctx.beginPath();
        ctx.moveTo(px, surfaceY);
        ctx.lineTo(px, surfaceY - 12);
        ctx.stroke();
      }
      // Power cables (sagging)
      ctx.beginPath();
      ctx.moveTo(w * 0.25, surfaceY - 12);
      for (let px = w * 0.25; px <= w * 0.73; px += w * 0.12) {
        const nextX = px + w * 0.12;
        const midX = (px + nextX) / 2;
        ctx.quadraticCurveTo(midX, surfaceY - 6, Math.min(nextX, w * 0.73), surfaceY - 12);
      }
      ctx.stroke();

      // Solar panels
      ctx.fillStyle = '#2244AA';
      ctx.fillRect(w * 0.65, surfaceY - 10, 14, 8);
      ctx.fillRect(w * 0.66, surfaceY - 9, 12, 6);
      ctx.strokeStyle = '#556';
      ctx.lineWidth = 0.5;
      // Panel grid lines
      ctx.beginPath();
      ctx.moveTo(w * 0.66, surfaceY - 6);
      ctx.lineTo(w * 0.78, surfaceY - 6);
      ctx.moveTo(w * 0.72, surfaceY - 9);
      ctx.lineTo(w * 0.72, surfaceY - 3);
      ctx.stroke();
      // Panel support
      ctx.strokeStyle = '#AAA';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.72, surfaceY - 2);
      ctx.lineTo(w * 0.72, surfaceY);
      ctx.stroke();
    }

    if (genCount >= 20) {
      // Larger science dome
      ctx.fillStyle = '#CCC';
      ctx.beginPath();
      ctx.arc(w * 0.36, surfaceY - 1, 22, Math.PI, 0);
      ctx.fill();
      // Dome stripes (pressure segments)
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
      ctx.lineWidth = 0.5;
      for (let a = Math.PI; a < Math.PI * 2; a += 0.3) {
        ctx.beginPath();
        ctx.moveTo(w * 0.36, surfaceY - 1);
        ctx.lineTo(w * 0.36 + Math.cos(a) * 22, surfaceY - 1 + Math.sin(a) * 22);
        ctx.stroke();
      }
      // Connecting corridor
      ctx.fillStyle = '#BBB';
      ctx.fillRect(w * 0.36 + 18, surfaceY - 6, w * 0.5 - w * 0.36 - 32, 6);
    }

    if (genCount >= 30) {
      // Mass driver track
      ctx.strokeStyle = '#AAA';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, surfaceY + 5);
      ctx.lineTo(w * 0.18, surfaceY - 15);
      ctx.stroke();
      // Track rails
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.05, surfaceY + 7);
      ctx.lineTo(w * 0.18, surfaceY - 13);
      ctx.moveTo(w * 0.05, surfaceY + 3);
      ctx.lineTo(w * 0.18, surfaceY - 17);
      ctx.stroke();
      // Cargo pod on track
      const podPos = (Math.sin(time * 0.4) + 1) / 2;
      const podX = w * 0.05 + podPos * (w * 0.13);
      const podY = surfaceY + 5 - podPos * 20;
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(podX - 3, podY - 3, 6, 4);
    }

    if (genCount >= 40) {
      // Space elevator tether
      ctx.strokeStyle = 'rgba(200, 200, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.8, surfaceY);
      ctx.lineTo(w * 0.8, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      // Elevator platform
      const elevY = (Math.sin(time * 0.2) + 1) / 2 * surfaceY * 0.6;
      ctx.fillStyle = '#CCC';
      ctx.fillRect(w * 0.8 - 4, elevY, 8, 5);
      // Blinking light at base
      if (Math.sin(time * 2) > 0) {
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(w * 0.8, surfaceY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Lunar rover (if any generators)
    if (genCount >= 3) {
      const roverX = w * 0.55 + Math.sin(time * 0.15) * 25;
      const roverY = surfaceY + 8;
      ctx.fillStyle = '#CCC';
      ctx.fillRect(roverX - 5, roverY - 3, 10, 4);
      // Wheels
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(roverX - 4, roverY + 1, 2, 0, Math.PI * 2);
      ctx.arc(roverX + 4, roverY + 1, 2, 0, Math.PI * 2);
      ctx.fill();
      // Antenna
      ctx.strokeStyle = '#DDD';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(roverX + 3, roverY - 3);
      ctx.lineTo(roverX + 5, roverY - 8);
      ctx.stroke();
      // Rover tracks behind it
      ctx.strokeStyle = 'rgba(120, 120, 120, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(roverX - 25, roverY + 1);
      ctx.lineTo(roverX - 6, roverY + 1);
      ctx.stroke();
    }

    // Footprints near base
    if (genCount > 0) {
      ctx.fillStyle = 'rgba(140, 140, 140, 0.3)';
      for (let i = 0; i < 5; i++) {
        const fpx = w * 0.5 + 20 + i * 8;
        const fpy = surfaceY + 5 + Math.sin(i) * 2;
        ctx.beginPath();
        ctx.ellipse(fpx, fpy, 2, 1.2, i * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawCrater(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A0A0A0';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#909090';
  }

  function drawMars(w, h) {
    const s = GameState.getState();
    const terraform = s.terraforming.marsPercent;
    const t100 = terraform / 100; // normalized 0-1

    // Sky gradient — transitions from dark rusty to Earth-like blue
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    if (terraform < 25) {
      skyGrad.addColorStop(0, lerpColor('#1A0A00', '#3D2215', t100 * 4));
      skyGrad.addColorStop(1, lerpColor('#4A2010', '#7A5030', t100 * 4));
    } else if (terraform < 50) {
      const t = (terraform - 25) / 25;
      skyGrad.addColorStop(0, lerpColor('#3D2215', '#556688', t));
      skyGrad.addColorStop(1, lerpColor('#7A5030', '#8899AA', t));
    } else if (terraform < 90) {
      const t = (terraform - 50) / 40;
      skyGrad.addColorStop(0, lerpColor('#556688', '#5588BB', t));
      skyGrad.addColorStop(1, lerpColor('#8899AA', '#99BBDD', t));
    } else {
      const t = (terraform - 90) / 10;
      skyGrad.addColorStop(0, lerpColor('#5588BB', '#6699CC', t));
      skyGrad.addColorStop(1, lerpColor('#99BBDD', '#87CEEB', t));
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars visible until atmosphere forms
    if (terraform < 60) {
      const starAlpha = Math.max(0, 1 - terraform / 60);
      drawStarfield(w, h, starAlpha * 0.5);
    }

    // Phobos (larger, closer moon)
    if (terraform < 80) {
      const phobosX = w * 0.25 + Math.sin(time * 0.1) * w * 0.1;
      const phobosY = h * 0.12 + Math.cos(time * 0.08) * 8;
      ctx.fillStyle = `rgba(170, 150, 130, ${Math.max(0.2, 1 - terraform / 80)})`;
      ctx.beginPath();
      // Irregular shape
      ctx.ellipse(phobosX, phobosY, 6, 4, time * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }

    // Deimos (smaller, farther moon)
    if (terraform < 80) {
      const deimosX = w * 0.7 + Math.sin(time * 0.05 + 2) * w * 0.08;
      const deimosY = h * 0.08 + Math.cos(time * 0.04) * 5;
      ctx.fillStyle = `rgba(160, 145, 125, ${Math.max(0.15, 0.8 - terraform / 80)})`;
      ctx.beginPath();
      ctx.arc(deimosX, deimosY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Surface
    const surfaceY = h * 0.6;
    const groundGrad = ctx.createLinearGradient(0, surfaceY, 0, h);
    groundGrad.addColorStop(0, lerpColor('#C1440E', '#228B22', t100));
    groundGrad.addColorStop(1, lerpColor('#8B3010', '#1A6B1A', t100));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, surfaceY, w, h - surfaceY);

    // Olympus Mons (large volcanic mountain, far background)
    const olympusColor = lerpColor('#6B3010', '#4B6B23', t100);
    ctx.fillStyle = olympusColor;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, surfaceY);
    ctx.quadraticCurveTo(w * 0.43, surfaceY - 75, w * 0.5, surfaceY - 80);
    ctx.quadraticCurveTo(w * 0.57, surfaceY - 75, w * 0.65, surfaceY);
    ctx.fill();
    // Snow cap if terraform > 60
    if (terraform > 60) {
      const snowAlpha = (terraform - 60) / 40 * 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${snowAlpha})`;
      ctx.beginPath();
      ctx.moveTo(w * 0.46, surfaceY - 70);
      ctx.lineTo(w * 0.5, surfaceY - 80);
      ctx.lineTo(w * 0.54, surfaceY - 70);
      ctx.fill();
    }

    // Mountain range
    ctx.fillStyle = lerpColor('#8B3010', '#6B8E23', t100);
    ctx.beginPath();
    ctx.moveTo(0, surfaceY);
    ctx.lineTo(w * 0.05, surfaceY - 20);
    ctx.lineTo(w * 0.12, surfaceY - 38);
    ctx.lineTo(w * 0.2, surfaceY - 25);
    ctx.lineTo(w * 0.28, surfaceY);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.7, surfaceY);
    ctx.lineTo(w * 0.76, surfaceY - 30);
    ctx.lineTo(w * 0.82, surfaceY - 52);
    ctx.lineTo(w * 0.88, surfaceY - 35);
    ctx.lineTo(w * 0.95, surfaceY - 15);
    ctx.lineTo(w, surfaceY);
    ctx.fill();

    // Water bodies — progressive stages
    if (terraform > 25) {
      const waterAlpha = Math.min(0.7, (terraform - 25) / 50);
      // Small water patches at 25%
      ctx.fillStyle = `rgba(30, 100, 200, ${waterAlpha})`;
      ctx.beginPath();
      ctx.ellipse(w * 0.35, surfaceY + 12, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (terraform > 50) {
        // Larger lake
        ctx.fillStyle = `rgba(25, 120, 220, ${waterAlpha})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.36, surfaceY + 14, 35, 10, -0.1, 0, Math.PI * 2);
        ctx.fill();
        // Second water body
        ctx.beginPath();
        ctx.ellipse(w * 0.72, surfaceY + 18, 18, 7, 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      if (terraform > 75) {
        // Lakes become rivers — connected waterway
        ctx.strokeStyle = `rgba(25, 120, 220, ${waterAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.36, surfaceY + 14);
        ctx.quadraticCurveTo(w * 0.55, surfaceY + 25, w * 0.72, surfaceY + 18);
        ctx.stroke();
      }

      if (terraform >= 90) {
        // Oceans forming
        ctx.fillStyle = `rgba(20, 100, 200, ${waterAlpha * 0.8})`;
        ctx.fillRect(w * 0.25, surfaceY + 8, w * 0.55, h * 0.06);
        // Wave shimmer
        ctx.strokeStyle = `rgba(100, 180, 255, ${waterAlpha * 0.3})`;
        ctx.lineWidth = 0.5;
        for (let wx = w * 0.26; wx < w * 0.79; wx += 12) {
          ctx.beginPath();
          ctx.moveTo(wx, surfaceY + 10 + Math.sin(time * 2 + wx * 0.1) * 2);
          ctx.lineTo(wx + 6, surfaceY + 10 + Math.sin(time * 2 + wx * 0.1 + 1) * 2);
          ctx.stroke();
        }
      }
    }

    // Green vegetation patches at 50%+
    if (terraform > 50) {
      const vegAlpha = (terraform - 50) / 50 * 0.6;
      ctx.fillStyle = `rgba(34, 139, 34, ${vegAlpha})`;
      // Scattered green patches
      for (let i = 0; i < 8; i++) {
        const vx = w * 0.1 + (i * w * 0.1) + Math.sin(i * 1.7) * 15;
        const vy = surfaceY + 5 + i * 4 + Math.cos(i * 2.1) * 5;
        if (vy > surfaceY + 2) {
          ctx.beginPath();
          ctx.ellipse(vx, vy, 8 + i % 3 * 4, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Trees/forests at 75%+
    if (terraform > 75) {
      const treeAlpha = (terraform - 75) / 25 * 0.7;
      ctx.fillStyle = `rgba(20, 100, 20, ${treeAlpha})`;
      for (let i = 0; i < 6; i++) {
        const tx = w * 0.08 + i * w * 0.15 + Math.sin(i * 3) * 10;
        const ty = surfaceY + 3;
        // Tree trunk
        ctx.fillStyle = `rgba(100, 60, 20, ${treeAlpha})`;
        ctx.fillRect(tx - 1, ty - 6, 2, 6);
        // Tree crown
        ctx.fillStyle = `rgba(20, 100, 20, ${treeAlpha})`;
        ctx.beginPath();
        ctx.arc(tx, ty - 9, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Clouds — progressive layers
    if (terraform > 50) {
      const cloudAlpha = (terraform - 50) / 50 * 0.5;
      // Multiple cloud clusters moving at different speeds
      for (let ci = 0; ci < 3; ci++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${cloudAlpha * (0.5 + ci * 0.2)})`;
        const cSpeed = 8 + ci * 4;
        const cx = (time * cSpeed + ci * w * 0.35) % (w + 80) - 40;
        const cy = h * 0.15 + ci * h * 0.08;
        const cSize = 15 + ci * 5;
        ctx.beginPath();
        ctx.arc(cx, cy, cSize, 0, Math.PI * 2);
        ctx.arc(cx + cSize * 0.7, cy - cSize * 0.15, cSize * 0.7, 0, Math.PI * 2);
        ctx.arc(cx - cSize * 0.5, cy + cSize * 0.1, cSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Dust devils — more active at low terraform
    if (terraform < 50) {
      const dustCount = terraform < 10 ? 3 : terraform < 25 ? 2 : 1;
      for (let di = 0; di < dustCount; di++) {
        const dustAlpha = 0.3 * (1 - terraform / 50);
        ctx.strokeStyle = `rgba(193, 68, 14, ${dustAlpha})`;
        ctx.lineWidth = 1.5;
        const dx = (w * (0.2 + di * 0.3) + Math.sin(time * 0.2 + di * 2) * w * 0.15);
        const dHeight = 30 + di * 15;
        ctx.beginPath();
        ctx.moveTo(dx, surfaceY);
        for (let dy = 0; dy < dHeight; dy += 5) {
          const sway = Math.sin(time * 3 + dy * 0.15 + di) * (5 + dy * 0.2);
          ctx.lineTo(dx + sway, surfaceY - dy);
        }
        ctx.stroke();
      }
    }

    // Hab dome / base structures
    const genCount = GameData.getTotalGenerators(s);
    if (genCount > 0) {
      // Mars hab dome
      ctx.fillStyle = `rgba(200, 180, 160, 0.8)`;
      ctx.beginPath();
      ctx.arc(w * 0.5, surfaceY, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(150, 130, 110, 0.6)';
      ctx.fillRect(w * 0.5 - 12, surfaceY - 1, 24, 3);
      // Red light on dome
      if (Math.sin(time * 2) > 0) {
        ctx.fillStyle = 'rgba(255, 50, 50, 0.6)';
        ctx.beginPath();
        ctx.arc(w * 0.5, surfaceY - 11, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Terraform progress visual indicator — subtle horizon glow
    if (terraform > 10) {
      const glowAlpha = t100 * 0.2;
      const horizonGlow = ctx.createLinearGradient(0, surfaceY - 15, 0, surfaceY + 5);
      horizonGlow.addColorStop(0, `rgba(135, 206, 235, ${glowAlpha})`);
      horizonGlow.addColorStop(1, 'rgba(135, 206, 235, 0)');
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, surfaceY - 15, w, 20);
    }
  }

  function drawAsteroids(w, h) {
    // Deep black space with faint nebula tint
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#030012');
    bgGrad.addColorStop(0.5, '#050510');
    bgGrad.addColorStop(1, '#08031A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    drawStarfield(w, h);

    // Distant sun — small but intense white-yellow dot with corona
    const sunX = w * 0.12;
    const sunY = h * 0.15;
    const sunCorona = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 40);
    sunCorona.addColorStop(0, 'rgba(255, 255, 240, 0.9)');
    sunCorona.addColorStop(0.15, 'rgba(255, 255, 200, 0.5)');
    sunCorona.addColorStop(0.4, 'rgba(255, 220, 100, 0.15)');
    sunCorona.addColorStop(1, 'rgba(255, 200, 80, 0)');
    ctx.fillStyle = sunCorona;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();
    // Sun core
    ctx.fillStyle = '#FFFFF0';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Lens flare rays from sun
    ctx.save();
    ctx.globalAlpha = 0.06 + Math.sin(time * 1.5) * 0.02;
    ctx.strokeStyle = '#FFE4B5';
    ctx.lineWidth = 1;
    for (let r = 0; r < 6; r++) {
      const angle = r * Math.PI / 3 + time * 0.1;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(angle) * 70, sunY + Math.sin(angle) * 70);
      ctx.stroke();
    }
    ctx.restore();

    // Jupiter in far background — large striped sphere
    const jX = w * 0.82;
    const jY = h * 0.65;
    const jR = 35;
    // Atmospheric glow
    const jGlow = ctx.createRadialGradient(jX, jY, jR * 0.5, jX, jY, jR * 1.8);
    jGlow.addColorStop(0, 'rgba(232, 160, 76, 0)');
    jGlow.addColorStop(0.5, 'rgba(232, 160, 76, 0.05)');
    jGlow.addColorStop(1, 'rgba(232, 160, 76, 0)');
    ctx.fillStyle = jGlow;
    ctx.beginPath();
    ctx.arc(jX, jY, jR * 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Jupiter body
    const jupBg = ctx.createRadialGradient(jX - 5, jY - 5, 0, jX, jY, jR);
    jupBg.addColorStop(0, '#FFF0D0');
    jupBg.addColorStop(0.3, '#E8A04C');
    jupBg.addColorStop(0.7, '#C1700E');
    jupBg.addColorStop(1, '#8B3010');
    ctx.fillStyle = jupBg;
    ctx.beginPath();
    ctx.arc(jX, jY, jR, 0, Math.PI * 2);
    ctx.fill();
    // Jupiter bands
    ctx.save();
    ctx.beginPath();
    ctx.arc(jX, jY, jR, 0, Math.PI * 2);
    ctx.clip();
    const bandColors = ['rgba(212, 114, 44, 0.4)', 'rgba(255, 248, 220, 0.2)', 'rgba(193, 68, 14, 0.3)'];
    for (let b = -4; b <= 4; b++) {
      ctx.fillStyle = bandColors[((b + 4) % 3)];
      ctx.fillRect(jX - jR, jY + b * 7 - 2, jR * 2, 4);
    }
    // Great Red Spot
    ctx.fillStyle = 'rgba(180, 50, 20, 0.6)';
    ctx.beginPath();
    ctx.ellipse(jX + 8, jY + 5, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Asteroid belt — 25 tumbling asteroids with variety
    for (let i = 0; i < 25; i++) {
      const seed = i * 137.5;
      // Slow drift across screen
      const baseX = ((time * (6 + (i % 5) * 2) + seed) % (w + 60)) - 30;
      const baseY = h * 0.12 + (i * h * 0.032) + Math.sin(time * 0.3 + seed * 0.01) * 12;
      const size = 3 + (i % 6) * 2.5;
      const tumble = time * (0.5 + (i % 3) * 0.3) + seed;

      // Asteroid type: metallic (silver-white), rocky (brown), or dark (charcoal)
      const type = i % 5;
      let baseColor, shadowColor, highlight;
      if (type === 0 || type === 3) {
        // Metallic — gleaming silver
        baseColor = '#B0B8C0';
        shadowColor = '#6A7080';
        highlight = 'rgba(220, 230, 255, 0.6)';
      } else if (type === 1 || type === 4) {
        // Rocky — warm brown
        baseColor = '#8B6B42';
        shadowColor = '#5A3A1A';
        highlight = 'rgba(200, 170, 120, 0.4)';
      } else {
        // Dark carbonaceous
        baseColor = '#3A3A40';
        shadowColor = '#1A1A20';
        highlight = 'rgba(100, 100, 110, 0.4)';
      }

      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.rotate(tumble);

      // Irregular asteroid shape using rough polygon
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      const verts = 7;
      for (let v = 0; v <= verts; v++) {
        const a = (v / verts) * Math.PI * 2;
        const wobble = 0.7 + ((Math.sin(seed + v * 2.7) + 1) * 0.3);
        const px = Math.cos(a) * size * wobble;
        const py = Math.sin(a) * size * wobble;
        if (v === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Shadow half
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      for (let v = 0; v <= verts; v++) {
        const a = (v / verts) * Math.PI * 2;
        const wobble = 0.7 + ((Math.sin(seed + v * 2.7) + 1) * 0.3);
        const px = Math.cos(a) * size * wobble;
        const py = Math.sin(a) * size * wobble;
        if (v === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();
      ctx.fillRect(-1, -size * 1.2, size * 2.5, size * 2.5);
      ctx.restore();

      // Highlight spot on metallic asteroids
      if (type === 0 || type === 3) {
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(baseX - size * 0.3, baseY - size * 0.3, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Fleet ships based on generators owned
    const s = GameState.getState();
    const totalGens = GameData.getTotalGenerators(s);
    if (totalGens > 0) {
      const shipCount = Math.min(8, Math.floor(Math.sqrt(totalGens)));
      for (let i = 0; i < shipCount; i++) {
        const orbitT = time * (0.15 + i * 0.05) + i * 1.8;
        const sx = w * 0.45 + Math.cos(orbitT) * w * 0.25;
        const sy = h * 0.5 + Math.sin(orbitT) * h * 0.18;
        const facing = Math.atan2(
          Math.cos(orbitT) * h * 0.18,
          -Math.sin(orbitT) * w * 0.25
        );

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(facing);

        // Ship body — triangular with hull detail
        const shipSize = 4 + (i % 3) * 2;
        ctx.fillStyle = i < 3 ? '#C8D0D8' : (i < 6 ? '#8899AA' : '#B0A080');
        ctx.beginPath();
        ctx.moveTo(shipSize * 1.5, 0);
        ctx.lineTo(-shipSize, -shipSize * 0.6);
        ctx.lineTo(-shipSize * 0.7, 0);
        ctx.lineTo(-shipSize, shipSize * 0.6);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(-shipSize * 0.9, 0, shipSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Engine trail
        const trailLen = 3 + Math.sin(time * 8 + i * 2) * 2;
        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-shipSize - trailLen, 0, trailLen, shipSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit window
        ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(shipSize * 0.5, 0, shipSize * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // Faint mining laser beams from ships to nearby asteroids
    if (totalGens > 2) {
      ctx.save();
      ctx.globalAlpha = 0.15 + Math.sin(time * 3) * 0.1;
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 1;
      const laserX = w * 0.45 + Math.cos(time * 0.15) * w * 0.25;
      const laserY = h * 0.5 + Math.sin(time * 0.15) * h * 0.18;
      const targetAX = ((time * 8 + 137.5) % (w + 60)) - 30;
      const targetAY = h * 0.12 + h * 0.032 + Math.sin(time * 0.3 + 0.01 * 137.5) * 12;
      ctx.beginPath();
      ctx.moveTo(laserX, laserY);
      ctx.lineTo(targetAX, targetAY);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawJupiter(w, h) {
    // Deep space backdrop
    const bgGrad = ctx.createRadialGradient(w * 0.3, h * 0.5, 0, w * 0.3, h * 0.5, Math.max(w, h));
    bgGrad.addColorStop(0, '#12081E');
    bgGrad.addColorStop(0.5, '#0A0A1A');
    bgGrad.addColorStop(1, '#050510');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    drawStarfield(w, h);

    // Jupiter — dominates ~55% of scene, positioned left-center
    const jR = Math.min(w, h) * 0.52;
    const jX = w * 0.25;
    const jY = h * 0.5;

    // Atmospheric glow behind Jupiter
    const atmoGlow = ctx.createRadialGradient(jX, jY, jR * 0.9, jX, jY, jR * 1.3);
    atmoGlow.addColorStop(0, 'rgba(232, 160, 76, 0.15)');
    atmoGlow.addColorStop(0.5, 'rgba(232, 160, 76, 0.05)');
    atmoGlow.addColorStop(1, 'rgba(232, 160, 76, 0)');
    ctx.fillStyle = atmoGlow;
    ctx.beginPath();
    ctx.arc(jX, jY, jR * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Jupiter sphere — multi-stop gradient
    const jupGrad = ctx.createRadialGradient(jX - jR * 0.2, jY - jR * 0.15, 0, jX, jY, jR);
    jupGrad.addColorStop(0, '#FFF8DC');
    jupGrad.addColorStop(0.15, '#F5D090');
    jupGrad.addColorStop(0.35, '#E8A04C');
    jupGrad.addColorStop(0.55, '#D4722C');
    jupGrad.addColorStop(0.75, '#C1440E');
    jupGrad.addColorStop(0.9, '#8B3010');
    jupGrad.addColorStop(1, '#5A1A08');
    ctx.fillStyle = jupGrad;
    ctx.beginPath();
    ctx.arc(jX, jY, jR, 0, Math.PI * 2);
    ctx.fill();

    // Cloud bands — alternating light and dark horizontal stripes
    ctx.save();
    ctx.beginPath();
    ctx.arc(jX, jY, jR, 0, Math.PI * 2);
    ctx.clip();

    const bandData = [
      { y: -0.6, h: 0.12, color: 'rgba(255, 248, 220, 0.2)' },
      { y: -0.4, h: 0.08, color: 'rgba(180, 100, 30, 0.25)' },
      { y: -0.25, h: 0.1, color: 'rgba(255, 230, 180, 0.15)' },
      { y: -0.1, h: 0.08, color: 'rgba(160, 80, 20, 0.3)' },
      { y: 0.05, h: 0.12, color: 'rgba(255, 240, 200, 0.15)' },
      { y: 0.2, h: 0.1, color: 'rgba(140, 70, 15, 0.25)' },
      { y: 0.35, h: 0.08, color: 'rgba(255, 220, 160, 0.2)' },
      { y: 0.5, h: 0.12, color: 'rgba(170, 90, 25, 0.2)' }
    ];
    for (const band of bandData) {
      // Wavy bands — slight sine distortion
      ctx.fillStyle = band.color;
      ctx.beginPath();
      const by = jY + band.y * jR;
      const bh = band.h * jR;
      ctx.moveTo(jX - jR, by);
      for (let px = jX - jR; px <= jX + jR; px += 4) {
        const wave = Math.sin(px * 0.02 + time * 0.3 + band.y * 5) * 2;
        ctx.lineTo(px, by + wave);
      }
      for (let px = jX + jR; px >= jX - jR; px -= 4) {
        const wave = Math.sin(px * 0.02 + time * 0.3 + band.y * 5) * 2;
        ctx.lineTo(px, by + bh + wave);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Great Red Spot — swirling ellipse with internal structure
    const grsX = jX + jR * 0.25;
    const grsY = jY + jR * 0.18;
    const grsW = jR * 0.15;
    const grsH = jR * 0.1;

    // Outer swirl
    ctx.fillStyle = 'rgba(180, 50, 20, 0.6)';
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, grsW, grsH, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Inner eye
    ctx.fillStyle = 'rgba(220, 80, 30, 0.7)';
    ctx.beginPath();
    ctx.ellipse(grsX, grsY, grsW * 0.5, grsH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Swirl lines around GRS
    ctx.strokeStyle = 'rgba(200, 60, 20, 0.3)';
    ctx.lineWidth = 1;
    for (let s = 0; s < 3; s++) {
      ctx.beginPath();
      ctx.ellipse(grsX, grsY, grsW + 3 + s * 3, grsH + 2 + s * 2,
        time * 0.2 + s * 0.5, 0, Math.PI * 1.2);
      ctx.stroke();
    }

    ctx.restore(); // Unclip from Jupiter

    // Terminator shadow — dark edge on right
    const termGrad = ctx.createLinearGradient(jX - jR * 0.5, 0, jX + jR, 0);
    termGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    termGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
    termGrad.addColorStop(0.9, 'rgba(0, 0, 0, 0.2)');
    termGrad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = termGrad;
    ctx.beginPath();
    ctx.arc(jX, jY, jR, 0, Math.PI * 2);
    ctx.fill();

    // Orbital ring/path faint hints for moons
    ctx.strokeStyle = 'rgba(150, 150, 200, 0.08)';
    ctx.lineWidth = 1;
    const moonDists = [jR + 25, jR + 50, jR + 75, jR + 100];
    for (const dist of moonDists) {
      ctx.beginPath();
      ctx.ellipse(jX, jY, dist, dist * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Four Galilean moons with distinct features
    const s = GameState.getState();
    const subZone = s.currentSubZone || '6_orbit';
    const moons = [
      { name: 'Io', angle: time * 0.5, dist: jR + 25, r: 6, colors: ['#CCCC00', '#FF8800', '#AA6600'], active: subZone === '6_io' },
      { name: 'Europa', angle: time * 0.3 + 1, dist: jR + 50, r: 7, colors: ['#DDE8F0', '#AAC0D5', '#8899AA'], active: subZone === '6_europa' },
      { name: 'Ganymede', angle: time * 0.2 + 2, dist: jR + 75, r: 8, colors: ['#BBAA99', '#998877', '#776655'], active: subZone === '6_ganymede' },
      { name: 'Callisto', angle: time * 0.15 + 3, dist: jR + 100, r: 7, colors: ['#888888', '#666666', '#555555'], active: subZone === '6_callisto' }
    ];

    for (const moon of moons) {
      const mx = jX + Math.cos(moon.angle) * moon.dist;
      const my = jY + Math.sin(moon.angle) * moon.dist * 0.3;

      // Active moon highlight ring
      if (moon.active) {
        ctx.strokeStyle = 'rgba(100, 255, 200, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mx, my, moon.r + 5, 0, Math.PI * 2);
        ctx.stroke();
        // Pulsing glow
        const pulse = 0.15 + Math.sin(time * 3) * 0.1;
        ctx.fillStyle = `rgba(100, 255, 200, ${pulse})`;
        ctx.beginPath();
        ctx.arc(mx, my, moon.r + 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moon sphere with gradient
      const moonGrad = ctx.createRadialGradient(mx - 2, my - 2, 0, mx, my, moon.r);
      moonGrad.addColorStop(0, moon.colors[0]);
      moonGrad.addColorStop(0.6, moon.colors[1]);
      moonGrad.addColorStop(1, moon.colors[2]);
      ctx.fillStyle = moonGrad;
      ctx.beginPath();
      ctx.arc(mx, my, moon.r, 0, Math.PI * 2);
      ctx.fill();

      // Io volcanic glow
      if (moon.name === 'Io') {
        ctx.fillStyle = `rgba(255, 120, 0, ${0.3 + Math.sin(time * 4) * 0.2})`;
        ctx.beginPath();
        ctx.arc(mx + 2, my + 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mx - 3, my - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Europa ice cracks
      if (moon.name === 'Europa') {
        ctx.strokeStyle = 'rgba(150, 100, 80, 0.3)';
        ctx.lineWidth = 0.5;
        for (let c = 0; c < 3; c++) {
          const ca = c * 2.1;
          ctx.beginPath();
          ctx.moveTo(mx + Math.cos(ca) * 3, my + Math.sin(ca) * 3);
          ctx.lineTo(mx + Math.cos(ca + 1) * 6, my + Math.sin(ca + 1) * 5);
          ctx.stroke();
        }
      }

      // Moon label
      ctx.fillStyle = moon.active ? '#64FFC8' : 'rgba(200, 200, 220, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(moon.name, mx, my + moon.r + 12);
    }

    // Orbit sub-zone: small stations near Jupiter if in orbit
    if (subZone === '6_orbit') {
      for (let i = 0; i < 3; i++) {
        const stA = time * 0.4 + i * 2.1;
        const stD = jR + 8 + i * 5;
        const stx = jX + Math.cos(stA) * stD;
        const sty = jY + Math.sin(stA) * stD * 0.3;
        ctx.fillStyle = '#C0D0E0';
        ctx.fillRect(stx - 2, sty - 1, 4, 2);
        ctx.fillStyle = '#6688FF';
        ctx.fillRect(stx - 3, sty, 1, 1);
      }
    }
  }

  function drawInterstellar(w, h) {
    // Deep purple-black space with nebula tint
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#1A0533');
    bgGrad.addColorStop(0.3, '#120428');
    bgGrad.addColorStop(0.6, '#0A021A');
    bgGrad.addColorStop(1, '#06010F');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Nebula clouds — soft colorful wisps in background
    const nebulaColors = [
      { x: 0.15, y: 0.3, r: 0.25, c: 'rgba(100, 20, 140, 0.06)' },
      { x: 0.7, y: 0.2, r: 0.2, c: 'rgba(40, 80, 160, 0.05)' },
      { x: 0.5, y: 0.7, r: 0.3, c: 'rgba(140, 40, 80, 0.04)' },
      { x: 0.85, y: 0.6, r: 0.15, c: 'rgba(60, 120, 100, 0.05)' }
    ];
    for (const nb of nebulaColors) {
      const nbGrad = ctx.createRadialGradient(
        nb.x * w, nb.y * h, 0,
        nb.x * w, nb.y * h, nb.r * Math.max(w, h)
      );
      nbGrad.addColorStop(0, nb.c);
      nbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nbGrad;
      ctx.beginPath();
      ctx.arc(nb.x * w, nb.y * h, nb.r * Math.max(w, h), 0, Math.PI * 2);
      ctx.fill();
    }

    drawStarfield(w, h, 1.5);

    // Binary star system — two suns orbiting each other
    const starCX = w * 0.4;
    const starCY = h * 0.18;
    const orbitR = 18;
    const starAngle = time * 0.4;

    // Primary star — warm yellow-white
    const s1x = starCX + Math.cos(starAngle) * orbitR;
    const s1y = starCY + Math.sin(starAngle) * orbitR * 0.4;
    // Secondary star — gold-orange
    const s2x = starCX - Math.cos(starAngle) * orbitR;
    const s2y = starCY - Math.sin(starAngle) * orbitR * 0.4;

    // Combined glow from both
    const dualGlow = ctx.createRadialGradient(starCX, starCY, 0, starCX, starCY, 80);
    dualGlow.addColorStop(0, 'rgba(255, 240, 200, 0.2)');
    dualGlow.addColorStop(0.3, 'rgba(255, 220, 150, 0.1)');
    dualGlow.addColorStop(0.6, 'rgba(255, 200, 100, 0.03)');
    dualGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = dualGlow;
    ctx.beginPath();
    ctx.arc(starCX, starCY, 80, 0, Math.PI * 2);
    ctx.fill();

    // Primary star corona
    const s1Glow = ctx.createRadialGradient(s1x, s1y, 0, s1x, s1y, 35);
    s1Glow.addColorStop(0, 'rgba(255, 255, 240, 0.8)');
    s1Glow.addColorStop(0.3, 'rgba(255, 240, 200, 0.3)');
    s1Glow.addColorStop(0.7, 'rgba(255, 220, 150, 0.08)');
    s1Glow.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = s1Glow;
    ctx.beginPath();
    ctx.arc(s1x, s1y, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFF0';
    ctx.beginPath();
    ctx.arc(s1x, s1y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Secondary star corona
    const s2Glow = ctx.createRadialGradient(s2x, s2y, 0, s2x, s2y, 25);
    s2Glow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
    s2Glow.addColorStop(0.3, 'rgba(255, 200, 50, 0.25)');
    s2Glow.addColorStop(0.7, 'rgba(255, 180, 30, 0.06)');
    s2Glow.addColorStop(1, 'rgba(255, 180, 30, 0)');
    ctx.fillStyle = s2Glow;
    ctx.beginPath();
    ctx.arc(s2x, s2y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(s2x, s2y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Three exoplanets — Haven (green), Ferrum (iron-red), Nebula (blue-purple)
    const st = GameState.getState();
    const subZone = st.currentSubZone || '7_haven';

    const planets = [
      {
        name: 'Haven', key: '7_haven', x: 0.18, y: 0.55, r: 22,
        colors: ['#50C878', '#228B22', '#0A5015'], ringColor: null,
        features: 'lush' // green continents, clouds
      },
      {
        name: 'Ferrum', key: '7_ferrum', x: 0.65, y: 0.45, r: 18,
        colors: ['#CC6633', '#8B4513', '#4A2008'], ringColor: 'rgba(180, 120, 60, 0.25)',
        features: 'rocky' // cratered, iron-red
      },
      {
        name: 'Nebula', key: '7_nebula', x: 0.82, y: 0.72, r: 26,
        colors: ['#6A5ACD', '#483D8B', '#2A1B5B'], ringColor: 'rgba(120, 100, 200, 0.2)',
        features: 'gas' // gas giant, atmospheric bands
      }
    ];

    for (const planet of planets) {
      const px = planet.x * w;
      const py = planet.y * h;
      const pr = planet.r;
      const isActive = subZone === planet.key;

      // Active planet glow
      if (isActive) {
        const actGlow = ctx.createRadialGradient(px, py, pr, px, py, pr + 15);
        actGlow.addColorStop(0, 'rgba(100, 255, 200, 0.2)');
        actGlow.addColorStop(1, 'rgba(100, 255, 200, 0)');
        ctx.fillStyle = actGlow;
        ctx.beginPath();
        ctx.arc(px, py, pr + 15, 0, Math.PI * 2);
        ctx.fill();
        // Selection ring
        ctx.strokeStyle = `rgba(100, 255, 200, ${0.4 + Math.sin(time * 3) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, pr + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ring system (for Ferrum and Nebula)
      if (planet.ringColor) {
        ctx.save();
        ctx.strokeStyle = planet.ringColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(px, py, pr * 1.8, pr * 0.35, 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Planet sphere
      const pGrad = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
      pGrad.addColorStop(0, planet.colors[0]);
      pGrad.addColorStop(0.5, planet.colors[1]);
      pGrad.addColorStop(1, planet.colors[2]);
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      // Planet-specific features
      if (planet.features === 'lush') {
        // Continents — green patches
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(34, 139, 34, 0.4)';
        ctx.beginPath();
        ctx.arc(px - 5, py - 3, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 7, py + 4, 6, 0, Math.PI * 2);
        ctx.fill();
        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const cloudX = (time * 5) % (pr * 4) - pr * 2;
        ctx.beginPath();
        ctx.ellipse(px + cloudX, py - 5, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(px + cloudX + 12, py + 6, 8, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (planet.features === 'rocky') {
        // Craters
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = 'rgba(100, 50, 20, 0.3)';
        ctx.beginPath();
        ctx.arc(px + 3, py - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - 6, py + 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 8, py + 6, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (planet.features === 'gas') {
        // Atmospheric bands
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.clip();
        for (let b = -3; b <= 3; b++) {
          ctx.fillStyle = b % 2 === 0 ? 'rgba(80, 60, 140, 0.25)' : 'rgba(140, 120, 200, 0.15)';
          ctx.fillRect(px - pr, py + b * (pr * 0.22) - 3, pr * 2, 6);
        }
        ctx.restore();
      }

      // Terminator shadow
      const tGrad = ctx.createLinearGradient(px - pr, py, px + pr, py);
      tGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      tGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
      tGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();

      // Planet label
      ctx.fillStyle = isActive ? '#64FFC8' : 'rgba(200, 200, 220, 0.5)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(planet.name, px, py + pr + 14);
    }

    // Colony ships / warp trails between planets (if generators owned)
    const totalGens = GameData.getTotalGenerators(st);
    if (totalGens > 0) {
      // Warp trail: a fading line between active planet and stars
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#88DDFF';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      const activeP = planets.find(p => p.key === subZone) || planets[0];
      ctx.beginPath();
      ctx.moveTo(activeP.x * w, activeP.y * h);
      ctx.lineTo(starCX, starCY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Colony ships traveling
      const shipCount = Math.min(4, Math.floor(Math.sqrt(totalGens) / 2));
      for (let i = 0; i < shipCount; i++) {
        const t = ((time * 0.1 + i * 0.25) % 1);
        const ax = activeP.x * w;
        const ay = activeP.y * h;
        const sx = ax + (starCX - ax) * t;
        const sy = ay + (starCY - ay) * t;
        ctx.fillStyle = '#C0D8E8';
        ctx.beginPath();
        ctx.moveTo(sx + 3, sy);
        ctx.lineTo(sx - 3, sy - 2);
        ctx.lineTo(sx - 3, sy + 2);
        ctx.closePath();
        ctx.fill();
        // Tiny engine glow
        ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(sx - 4, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawGalaxy(w, h) {
    // Very deep black with faint blue-purple cosmic tint
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    bgGrad.addColorStop(0, '#0A0818');
    bgGrad.addColorStop(0.4, '#060510');
    bgGrad.addColorStop(1, '#020208');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxR = Math.min(w, h) * 0.42;

    // Distant background stars (not in galaxy plane)
    for (const star of stars) {
      const twinkle = (Math.sin(time * star.twinkleSpeed) + 1) / 2;
      const alpha = star.brightness * (0.2 + twinkle * 0.15);
      ctx.fillStyle = `rgba(180, 180, 220, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Galaxy dust lanes — soft gradient ellipses along spiral arms
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let arm = 0; arm < 4; arm++) {
      for (let seg = 0; seg < 8; seg++) {
        const angle = (seg / 8) * Math.PI * 3.5 + arm * Math.PI * 0.5 + time * 0.02;
        const r = (seg / 8) * maxR * 0.9 + 15;
        const dx = cx + Math.cos(angle) * r;
        const dy = cy + Math.sin(angle) * r * 0.5;
        const dustGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, 15 + seg * 2);
        const hue = arm === 0 ? '200, 180, 255' : arm === 1 ? '255, 200, 180' : arm === 2 ? '180, 220, 255' : '255, 220, 200';
        dustGrad.addColorStop(0, `rgba(${hue}, 1)`);
        dustGrad.addColorStop(1, `rgba(${hue}, 0)`);
        ctx.fillStyle = dustGrad;
        ctx.beginPath();
        ctx.arc(dx, dy, 15 + seg * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Spiral arms — thick glowing strokes with star density
    for (let arm = 0; arm < 4; arm++) {
      // Arm glow (wide, soft)
      ctx.strokeStyle = 'rgba(150, 150, 200, 0.08)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      for (let i = 0; i < 120; i++) {
        const angle = (i / 120) * Math.PI * 4 + arm * Math.PI * 0.5 + time * 0.02;
        const r = (i / 120) * maxR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Arm bright center
      ctx.strokeStyle = 'rgba(200, 200, 255, 0.12)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 120; i++) {
        const angle = (i / 120) * Math.PI * 4 + arm * Math.PI * 0.5 + time * 0.02;
        const r = (i / 120) * maxR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Stars along spiral arms — deterministic positions (seeded by index)
    for (let i = 0; i < 80; i++) {
      const arm = i % 4;
      const t = (Math.floor(i / 4) / 20);
      const angle = t * Math.PI * 4 + arm * Math.PI * 0.5 + time * 0.02;
      const r = t * maxR * 0.95;
      // Scatter perpendicular to arm direction
      const seed = Math.sin(i * 127.1 + 311.7);
      const seed2 = Math.sin(i * 269.5 + 183.3);
      const scatter = seed * 15;
      const perpAngle = angle + Math.PI * 0.5;
      const x = cx + Math.cos(angle) * r + Math.cos(perpAngle) * scatter;
      const y = cy + Math.sin(angle) * r * 0.5 + Math.sin(perpAngle) * scatter * 0.5;

      // Star color variety — blue-white, yellow, orange
      const colorRoll = ((i * 37) % 10);
      let starColor;
      if (colorRoll < 4) starColor = `rgba(200, 210, 255, ${0.4 + seed2 * 0.3})`;
      else if (colorRoll < 7) starColor = `rgba(255, 255, 200, ${0.4 + seed2 * 0.3})`;
      else if (colorRoll < 9) starColor = `rgba(255, 200, 150, ${0.4 + seed2 * 0.3})`;
      else starColor = `rgba(255, 150, 150, ${0.3 + seed2 * 0.2})`; // Red giant

      ctx.fillStyle = starColor;
      ctx.beginPath();
      ctx.arc(x, y, 0.8 + (colorRoll >= 9 ? 1 : 0), 0, Math.PI * 2);
      ctx.fill();
    }

    // Galactic core — bright, multi-layered
    const coreR = Math.min(w, h) * 0.08;
    // Outer halo
    const coreHalo = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
    coreHalo.addColorStop(0, 'rgba(255, 255, 220, 0.15)');
    coreHalo.addColorStop(0.3, 'rgba(255, 240, 200, 0.06)');
    coreHalo.addColorStop(1, 'rgba(255, 220, 150, 0)');
    ctx.fillStyle = coreHalo;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
    ctx.fill();
    // Dense core
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    coreGrad.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
    coreGrad.addColorStop(0.3, 'rgba(255, 240, 180, 0.5)');
    coreGrad.addColorStop(0.7, 'rgba(255, 220, 150, 0.15)');
    coreGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Colonized systems — with type-based coloring and connections
    const s = GameState.getState();
    const colonized = s.starSystems.colonized || [];
    const totalSystems = s.starSystems.totalSystems || 0;
    const systemPositions = [];

    // System type colors
    const typeColors = {
      lush: '#00FF88', barren: '#CC8844', gas: '#8888FF',
      frozen: '#88DDFF', anomaly: '#FF44FF', ancient: '#FFD700',
      blackHole: '#AA00FF', nebula: '#4488FF', ancientRuins: '#FFD700', galacticCore: '#FFAA00'
    };

    for (let i = 0; i < totalSystems; i++) {
      const sysAngle = (i / 50) * Math.PI * 4 + Math.PI * 0.7 + time * 0.02;
      const sysR = 20 + (i / 50) * maxR * 0.85;
      const sx = cx + Math.cos(sysAngle) * sysR;
      const sy = cy + Math.sin(sysAngle) * sysR * 0.5;
      systemPositions.push({ x: sx, y: sy, index: i });

      // Get type for this system
      const sysData = colonized[i];
      const sysType = sysData ? sysData.type : 'lush';
      const color = typeColors[sysType] || '#00FF88';

      // System glow
      ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb', 'rgba').replace('#', '');
      const sGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
      sGlow.addColorStop(0, color + '44');
      sGlow.addColorStop(1, color + '00');
      ctx.fillStyle = sGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();

      // System dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Special system indicator — larger, pulsing
      if (sysType === 'blackHole' || sysType === 'galacticCore' || sysType === 'ancientRuins') {
        const pulse = 0.3 + Math.sin(time * 2 + i) * 0.2;
        ctx.strokeStyle = `${color}`;
        ctx.globalAlpha = pulse;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Warp gate connections — faint lines between adjacent systems
    if (systemPositions.length > 1) {
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < systemPositions.length; i++) {
        const a = systemPositions[i - 1];
        const b = systemPositions[i];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // System count label
    if (totalSystems > 0) {
      ctx.fillStyle = 'rgba(200, 200, 220, 0.4)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(totalSystems + '/50 systems', cx, h - 8);
    }
  }

  function drawMultiverse(w, h) {
    // Pure void — deep black with shifting color hints
    ctx.fillStyle = '#010005';
    ctx.fillRect(0, 0, w, h);

    // Reality fracture lines — faint cracks across the void
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      const seed = i * 73.7;
      ctx.beginPath();
      ctx.moveTo(
        (Math.sin(seed) * 0.5 + 0.5) * w,
        (Math.cos(seed * 1.3) * 0.5 + 0.5) * h
      );
      for (let seg = 0; seg < 5; seg++) {
        ctx.lineTo(
          (Math.sin(seed + seg * 2.3 + time * 0.1) * 0.5 + 0.5) * w,
          (Math.cos(seed * 1.3 + seg * 1.7 + time * 0.08) * 0.5 + 0.5) * h
        );
      }
      ctx.stroke();
    }
    ctx.restore();

    // Dim warped starfield — stars appear distorted near portals
    for (const star of stars) {
      const twinkle = (Math.sin(time * star.twinkleSpeed * 1.5) + 1) / 2;
      const alpha = star.brightness * (0.15 + twinkle * 0.15);
      // Color-shift stars in multiverse
      const hueShift = (star.x * 360 + time * 20) % 360;
      ctx.fillStyle = `hsla(${hueShift}, 30%, 80%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central nexus point — where all universes converge
    const nxX = w * 0.5;
    const nxY = h * 0.48;

    // Nexus energy field
    const nxGlow = ctx.createRadialGradient(nxX, nxY, 0, nxX, nxY, 30);
    nxGlow.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    nxGlow.addColorStop(0.3, 'rgba(200, 180, 255, 0.08)');
    nxGlow.addColorStop(1, 'rgba(100, 80, 200, 0)');
    ctx.fillStyle = nxGlow;
    ctx.beginPath();
    ctx.arc(nxX, nxY, 30, 0, Math.PI * 2);
    ctx.fill();

    // Nexus core — bright pulsing dot
    const nxPulse = 0.5 + Math.sin(time * 2) * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${nxPulse})`;
    ctx.beginPath();
    ctx.arc(nxX, nxY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Universe portals — arranged in a ring around nexus
    const s = GameState.getState();
    const universes = GameData.UNIVERSES || [];
    const portalCount = Math.min(universes.length, 13);
    const ringR = Math.min(w, h) * 0.32;

    for (let i = 0; i < portalCount; i++) {
      const angle = (i / portalCount) * Math.PI * 2 - Math.PI * 0.5 + time * 0.03;
      const px = nxX + Math.cos(angle) * ringR;
      const py = nxY + Math.sin(angle) * ringR * 0.55;
      const portalR = 12 + Math.sin(time * 1.5 + i * 1.2) * 3;

      // Each universe gets a distinct hue
      const hue = (i * (360 / portalCount) + 15) % 360;
      const completed = s.multiverse.completedUniverses && s.multiverse.completedUniverses.includes(universes[i]?.id);

      // Connection line from nexus to portal
      ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.06)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(nxX, nxY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Portal outer glow
      const pGlow = ctx.createRadialGradient(px, py, portalR * 0.3, px, py, portalR * 2);
      pGlow.addColorStop(0, `hsla(${hue}, 80%, 50%, 0.15)`);
      pGlow.addColorStop(0.5, `hsla(${hue}, 70%, 40%, 0.05)`);
      pGlow.addColorStop(1, `hsla(${hue}, 60%, 30%, 0)`);
      ctx.fillStyle = pGlow;
      ctx.beginPath();
      ctx.arc(px, py, portalR * 2, 0, Math.PI * 2);
      ctx.fill();

      // Swirling rings — 4 concentric partial arcs
      for (let ring = 0; ring < 4; ring++) {
        const ringAlpha = 0.4 - ring * 0.08;
        ctx.strokeStyle = `hsla(${hue}, 80%, ${55 + ring * 5}%, ${ringAlpha})`;
        ctx.lineWidth = 2 - ring * 0.3;
        ctx.beginPath();
        const startA = time * (1.5 - ring * 0.3) + ring * Math.PI * 0.4 + i;
        ctx.arc(px, py, portalR + ring * 4, startA, startA + Math.PI * 1.3);
        ctx.stroke();
      }

      // Portal center — dark void with color rim
      const pCenter = ctx.createRadialGradient(px, py, 0, px, py, portalR);
      pCenter.addColorStop(0, `hsla(${hue}, 40%, 5%, 0.8)`);
      pCenter.addColorStop(0.6, `hsla(${hue}, 60%, 15%, 0.5)`);
      pCenter.addColorStop(1, `hsla(${hue}, 80%, 40%, 0.3)`);
      ctx.fillStyle = pCenter;
      ctx.beginPath();
      ctx.arc(px, py, portalR, 0, Math.PI * 2);
      ctx.fill();

      // Completed universe checkmark glow
      if (completed) {
        ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.6)`;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('✓', px, py + 3);
      }

      // Universe label
      if (universes[i]) {
        const label = universes[i].name.replace(/Universe-/, '');
        ctx.fillStyle = `hsla(${hue}, 60%, 70%, 0.5)`;
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, px, py + portalR + 14);
      }
    }

    // Infinity Token counter display
    const itCount = s.infinityTokens || 0;
    if (itCount > 0) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('∞ ' + itCount + ' IT', nxX, h - 8);
    }
  }

  function drawStarfield(w, h, density = 1) {
    for (const star of stars) {
      const twinkle = (Math.sin(time * star.twinkleSpeed) + 1) / 2;
      const alpha = star.brightness * (0.5 + twinkle * 0.5) * density;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles(w, h) {
    particles = particles.filter(p => {
      p.life -= 0.016;
      if (p.life <= 0) return false;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
  }

  function addParticleBurst(x, y, color, count = 6) {
    const r = parseInt(color.slice(1, 3), 16) || 255;
    const g = parseInt(color.slice(3, 5), 16) || 215;
    const b = parseInt(color.slice(5, 7), 16) || 0;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        r, g, b,
        size: 3 + Math.random() * 2,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  function lerpColor(color1, color2, t) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }

  // ===== Section 70: Enhanced scene details =====

  // Draw nebula clouds for interstellar/galaxy phases
  function drawNebula(cx, cy, radius, hue, alpha) {
    const nebulaGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    nebulaGrad.addColorStop(0, `hsla(${hue}, 60%, 40%, ${alpha})`);
    nebulaGrad.addColorStop(0.5, `hsla(${hue}, 50%, 30%, ${alpha * 0.5})`);
    nebulaGrad.addColorStop(1, `hsla(${hue}, 40%, 20%, 0)`);
    ctx.fillStyle = nebulaGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Aurora effect for orbit/interstellar
  function drawAurora(w, h, baseY, hue1, hue2) {
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 5; i++) {
      const y = baseY + Math.sin(time * 0.3 + i * 0.8) * 15;
      const grad = ctx.createLinearGradient(0, y - 20, 0, y + 20);
      const h = hue1 + (hue2 - hue1) * (i / 5);
      grad.addColorStop(0, `hsla(${h}, 80%, 60%, 0)`);
      grad.addColorStop(0.5, `hsla(${h}, 80%, 60%, 0.6)`);
      grad.addColorStop(1, `hsla(${h}, 80%, 60%, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 20, w, 40);
    }
    ctx.globalAlpha = 1;
  }

  // Constellation pattern for deep space phases
  function drawConstellations(w, h) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < stars.length - 1; i += 3) {
      const s1 = stars[i];
      const s2 = stars[i + 1];
      if (!s1 || !s2) continue;
      const dx = (s1.x - s2.x) * w;
      const dy = (s1.y - s2.y) * h;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) {
        ctx.beginPath();
        ctx.moveTo(s1.x * w, s1.y * h);
        ctx.lineTo(s2.x * w, s2.y * h);
        ctx.stroke();
      }
    }
  }

  // Shooting star / meteor trail
  let shootingStar = null;
  let shootingStarTimer = 10 + Math.random() * 20;

  function updateShootingStar(w, h) {
    shootingStarTimer -= 0.016;
    if (shootingStarTimer <= 0 && !shootingStar) {
      shootingStar = {
        x: Math.random() * w * 0.8,
        y: Math.random() * h * 0.3,
        vx: 4 + Math.random() * 3,
        vy: 2 + Math.random() * 2,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8
      };
      shootingStarTimer = 15 + Math.random() * 30;
    }
    if (shootingStar) {
      shootingStar.x += shootingStar.vx;
      shootingStar.y += shootingStar.vy;
      shootingStar.life -= 0.016;
      if (shootingStar.life <= 0) {
        shootingStar = null;
        return;
      }
      const alpha = shootingStar.life / shootingStar.maxLife;
      const tailLen = 20 + (1 - alpha) * 30;
      const grad = ctx.createLinearGradient(
        shootingStar.x, shootingStar.y,
        shootingStar.x - shootingStar.vx * tailLen * 0.3,
        shootingStar.y - shootingStar.vy * tailLen * 0.3
      );
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(
        shootingStar.x - shootingStar.vx * tailLen * 0.3,
        shootingStar.y - shootingStar.vy * tailLen * 0.3
      );
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(shootingStar.x, shootingStar.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Foreground depth elements — scattered small objects at bottom
  function drawForegroundDebris(w, h, count, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const x = (i / count) * w + Math.sin(time * 0.1 + i) * 3;
      const y = h - 5 - Math.random() * 10;
      const s = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Lens flare effect
  function drawLensFlare(x, y, radius) {
    const flareGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    flareGrad.addColorStop(0, 'rgba(255, 255, 220, 0.2)');
    flareGrad.addColorStop(0.3, 'rgba(255, 255, 220, 0.08)');
    flareGrad.addColorStop(1, 'rgba(255, 255, 220, 0)');
    ctx.fillStyle = flareGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Small secondary flares
    for (let i = 1; i <= 3; i++) {
      const fx = x + (canvas.width / 2 - x) * i * 0.3;
      const fy = y + (canvas.height / 2 - y) * i * 0.3;
      const fr = radius * (0.3 - i * 0.06);
      ctx.fillStyle = `rgba(255, 255, 220, ${0.06 - i * 0.015})`;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Tap burst (called from outside)
  function triggerTapBurst(x, y, tier) {
    const count = tier === 3 ? 20 : tier === 2 ? 12 : 6;
    const colors = {
      1: ['#FFD700'],
      2: ['#FFD700', '#FF6B35'],
      3: ['#FFD700', '#FF6B35', '#FF00FF', '#00FFFF']
    };
    const palette = colors[tier] || colors[1];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = (2 + Math.random() * 4) * (tier === 3 ? 1.5 : 1);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        r, g, b,
        size: 2 + Math.random() * 3 * (tier === 3 ? 1.5 : 1),
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7
      });
    }
  }

  return { init, setPhase, addParticleBurst, triggerTapBurst, resize };
})();
