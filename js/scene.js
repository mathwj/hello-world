// scene.js — Canvas-based scene rendering for each phase
'use strict';

const SceneRenderer = (() => {
  let canvas, ctx;
  let currentPhase = 1;
  let animFrame;
  let particles = [];
  let stars = [];
  let time = 0;

  function init() {
    canvas = document.getElementById('scene-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    generateStars();
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
    draw();
    animFrame = requestAnimationFrame(animate);
  }

  function draw() {
    if (!ctx || !canvas.width) return;
    const w = canvas.width;
    const h = canvas.height;

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

    drawParticles(w, h);
  }

  function drawJunkyard(w, h) {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#E8D5B7');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.15, 25, 0, Math.PI * 2);
    ctx.fill();

    // Ground
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, h * 0.55, w, h * 0.45);

    // Fence
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.4);
      ctx.lineTo(x, h * 0.55);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, h * 0.45);
    ctx.lineTo(w, h * 0.45);
    ctx.stroke();

    // Scrap piles
    const s = GameState.getState();
    const genCount = GameData.getTotalGenerators(s);

    ctx.fillStyle = '#8B4513';
    drawScrapPile(w * 0.1, h * 0.6, 40, 25);
    drawScrapPile(w * 0.3, h * 0.65, 50, 30);
    drawScrapPile(w * 0.7, h * 0.6, 35, 20);

    // Rocket pad
    ctx.fillStyle = '#666';
    ctx.fillRect(w * 0.5 - 30, h * 0.55, 60, 8);

    // Rocket (if parts owned)
    drawRocket(w * 0.5, h * 0.55, s);

    // Animated elements based on generators
    if (genCount > 0) {
      // Small walking figure
      const walkX = (w * 0.2 + Math.sin(time * 0.5) * 50);
      ctx.fillStyle = '#654321';
      ctx.fillRect(walkX, h * 0.63, 6, 12);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(walkX + 1, h * 0.61, 4, 4);
    }

    if (genCount >= 10) {
      // Crane
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.85, h * 0.55);
      ctx.lineTo(w * 0.85, h * 0.3);
      ctx.lineTo(w * 0.7, h * 0.3);
      ctx.stroke();
      // Crane hook
      const hookY = h * 0.35 + Math.sin(time) * 10;
      ctx.beginPath();
      ctx.moveTo(w * 0.75, h * 0.3);
      ctx.lineTo(w * 0.75, hookY);
      ctx.stroke();
    }

    // Dust particles
    ctx.fillStyle = 'rgba(210, 180, 140, 0.4)';
    for (let i = 0; i < 5; i++) {
      const px = (time * 20 + i * 80) % w;
      const py = h * 0.5 + Math.sin(time + i) * 15;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
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
    const scale = 0.8;
    // Fuel tank
    if (s.rocketParts.fuelTank) {
      ctx.fillStyle = '#DDD';
      ctx.fillRect(x - 10 * scale, baseY - 40 * scale, 20 * scale, 30 * scale);
      ctx.fillStyle = '#333';
      ctx.font = `${6 * scale}px sans-serif`;
      ctx.fillText('FUEL', x - 8 * scale, baseY - 22 * scale);
    }
    // Engine
    if (s.rocketParts.engine) {
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.moveTo(x - 12 * scale, baseY - 8 * scale);
      ctx.lineTo(x + 12 * scale, baseY - 8 * scale);
      ctx.lineTo(x + 8 * scale, baseY);
      ctx.lineTo(x - 8 * scale, baseY);
      ctx.fill();
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(x, baseY, 4 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    // Hull
    if (s.rocketParts.hull) {
      ctx.fillStyle = '#B8B8B8';
      ctx.fillRect(x - 12 * scale, baseY - 55 * scale, 24 * scale, 50 * scale);
      ctx.strokeStyle = '#888';
      ctx.strokeRect(x - 12 * scale, baseY - 55 * scale, 24 * scale, 50 * scale);
    }
    // Nav computer
    if (s.rocketParts.navigationComputer) {
      ctx.fillStyle = '#0066FF';
      ctx.fillRect(x + 8 * scale, baseY - 48 * scale, 6 * scale, 5 * scale);
      // Blinking light
      if (Math.sin(time * 3) > 0) {
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(x + 9 * scale, baseY - 47 * scale, 2 * scale, 2 * scale);
      }
    }
    // Nose cone
    if (s.rocketParts.noseCone) {
      ctx.fillStyle = '#CC0000';
      ctx.beginPath();
      ctx.moveTo(x, baseY - 75 * scale);
      ctx.lineTo(x - 12 * scale, baseY - 55 * scale);
      ctx.lineTo(x + 12 * scale, baseY - 55 * scale);
      ctx.fill();
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

    // Earth in sky
    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.arc(w * 0.8, h * 0.15, 15, 0, Math.PI * 2);
    ctx.fill();

    // Lunar surface
    const surfaceY = h * 0.6;
    ctx.fillStyle = '#B0B0B0';
    ctx.fillRect(0, surfaceY, w, h - surfaceY);

    // Craters
    ctx.fillStyle = '#909090';
    drawCrater(w * 0.15, surfaceY + 20, 25);
    drawCrater(w * 0.4, surfaceY + 35, 15);
    drawCrater(w * 0.65, surfaceY + 15, 20);
    drawCrater(w * 0.85, surfaceY + 30, 12);

    // Base structures based on generators
    const s = GameState.getState();
    const genCount = GameData.getTotalGenerators(s);

    if (genCount > 0) {
      // Small dome
      ctx.fillStyle = '#DDD';
      ctx.beginPath();
      ctx.arc(w * 0.5, surfaceY, 15, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#AAA';
      ctx.fillRect(w * 0.5 - 15, surfaceY - 2, 30, 4);
    }

    if (genCount >= 20) {
      // Larger dome
      ctx.fillStyle = '#CCC';
      ctx.beginPath();
      ctx.arc(w * 0.35, surfaceY, 20, Math.PI, 0);
      ctx.fill();
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

    // Sky
    const skyColor = lerpColor('#1A0A00', '#6699CC', terraform / 100);
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, w, h);

    if (terraform < 50) drawStarfield(w, h, 0.3);

    // Surface
    const surfaceY = h * 0.6;
    const groundColor = lerpColor('#C1440E', '#228B22', terraform / 100);
    ctx.fillStyle = groundColor;
    ctx.fillRect(0, surfaceY, w, h - surfaceY);

    // Mountains
    ctx.fillStyle = lerpColor('#8B3010', '#6B8E23', terraform / 100);
    ctx.beginPath();
    ctx.moveTo(0, surfaceY);
    ctx.lineTo(w * 0.15, surfaceY - 40);
    ctx.lineTo(w * 0.3, surfaceY);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.6, surfaceY);
    ctx.lineTo(w * 0.75, surfaceY - 60);
    ctx.lineTo(w * 0.9, surfaceY);
    ctx.fill();

    // Water if terraform > 25
    if (terraform > 25) {
      ctx.fillStyle = `rgba(30, 144, 255, ${(terraform - 25) / 75 * 0.6})`;
      ctx.fillRect(w * 0.3, surfaceY + 10, w * 0.25, 15);
    }

    // Clouds if terraform > 50
    if (terraform > 50) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(terraform - 50) / 50 * 0.5})`;
      const cx = (time * 10) % (w + 60) - 30;
      ctx.beginPath();
      ctx.arc(cx, h * 0.2, 20, 0, Math.PI * 2);
      ctx.arc(cx + 15, h * 0.18, 15, 0, Math.PI * 2);
      ctx.arc(cx - 10, h * 0.19, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dust devil
    if (terraform < 50) {
      ctx.strokeStyle = 'rgba(193, 68, 14, 0.3)';
      ctx.lineWidth = 2;
      const dx = (w * 0.5 + Math.sin(time * 0.2) * w * 0.3);
      ctx.beginPath();
      ctx.moveTo(dx, surfaceY);
      ctx.quadraticCurveTo(dx + Math.sin(time * 2) * 10, surfaceY - 30, dx, surfaceY - 50);
      ctx.stroke();
    }
  }

  function drawAsteroids(w, h) {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);
    drawStarfield(w, h);

    // Jupiter in background
    ctx.fillStyle = '#E8A04C';
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.7, 30, 0, Math.PI * 2);
    ctx.fill();
    // Bands
    ctx.strokeStyle = '#D4722C';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w * 0.85, h * 0.7, 30, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Asteroids
    for (let i = 0; i < 15; i++) {
      const ax = ((time * 10 + i * 73) % (w + 40)) - 20;
      const ay = (h * 0.2 + i * h * 0.05) + Math.sin(time * 0.5 + i) * 10;
      const size = 5 + (i % 4) * 3;
      ctx.fillStyle = i % 3 === 0 ? '#C0C0C0' : '#6B4226';
      ctx.beginPath();
      ctx.arc(ax, ay, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Small ships if generators owned
    const s = GameState.getState();
    if (GameData.getTotalGenerators(s) > 0) {
      ctx.fillStyle = '#CCC';
      for (let i = 0; i < Math.min(5, GameData.getTotalGenerators(s)); i++) {
        const sx = w * 0.3 + Math.cos(time * 0.3 + i * 1.2) * w * 0.2;
        const sy = h * 0.5 + Math.sin(time * 0.4 + i * 0.8) * h * 0.15;
        ctx.fillRect(sx - 3, sy - 1, 6, 2);
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(sx - 5, sy, 2, 1);
        ctx.fillStyle = '#CCC';
      }
    }
  }

  function drawJupiter(w, h) {
    ctx.fillStyle = '#0A0A1A';
    ctx.fillRect(0, 0, w, h);
    drawStarfield(w, h);

    // Jupiter
    const jR = Math.min(w, h) * 0.45;
    const jX = w * 0.3;
    const jY = h * 0.5;

    const jupGrad = ctx.createRadialGradient(jX, jY, jR * 0.3, jX, jY, jR);
    jupGrad.addColorStop(0, '#FFF8DC');
    jupGrad.addColorStop(0.3, '#E8A04C');
    jupGrad.addColorStop(0.6, '#D4722C');
    jupGrad.addColorStop(0.8, '#C1440E');
    jupGrad.addColorStop(1, '#8B3010');
    ctx.fillStyle = jupGrad;
    ctx.beginPath();
    ctx.arc(jX, jY, jR, 0, Math.PI * 2);
    ctx.fill();

    // Bands
    ctx.strokeStyle = 'rgba(255, 248, 220, 0.3)';
    ctx.lineWidth = 4;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(jX, jY + i * jR * 0.2, jR, -0.5, Math.PI + 0.5);
      ctx.stroke();
    }

    // Great Red Spot
    ctx.fillStyle = '#CC3300';
    ctx.beginPath();
    ctx.ellipse(jX + jR * 0.2, jY + jR * 0.15, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Moons
    const moons = [
      { name: 'Io', angle: time * 0.5, dist: jR + 30, color: '#CCCC00' },
      { name: 'Europa', angle: time * 0.3 + 1, dist: jR + 50, color: '#DDE8F0' },
      { name: 'Ganymede', angle: time * 0.2 + 2, dist: jR + 70, color: '#AAA' },
      { name: 'Callisto', angle: time * 0.15 + 3, dist: jR + 90, color: '#888' }
    ];

    for (const moon of moons) {
      const mx = jX + Math.cos(moon.angle) * moon.dist;
      const my = jY + Math.sin(moon.angle) * moon.dist * 0.3;
      ctx.fillStyle = moon.color;
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawInterstellar(w, h) {
    ctx.fillStyle = '#1A0533';
    ctx.fillRect(0, 0, w, h);
    drawStarfield(w, h, 1.5);

    // Twin suns
    ctx.fillStyle = '#FFE4B5';
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.2, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(w * 0.45, h * 0.22, 15, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.fillStyle = 'rgba(255, 228, 181, 0.1)';
    ctx.beginPath();
    ctx.arc(w * 0.4, h * 0.21, 60, 0, Math.PI * 2);
    ctx.fill();

    // Planet
    ctx.fillStyle = '#50C878';
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.6, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.58, 25, 0.5, 2);
    ctx.fill();
  }

  function drawGalaxy(w, h) {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    // Galaxy spiral
    const cx = w * 0.5;
    const cy = h * 0.5;
    ctx.strokeStyle = 'rgba(200, 200, 255, 0.2)';
    ctx.lineWidth = 2;

    for (let arm = 0; arm < 4; arm++) {
      ctx.beginPath();
      for (let i = 0; i < 100; i++) {
        const angle = (i / 100) * Math.PI * 4 + arm * Math.PI * 0.5 + time * 0.05;
        const r = (i / 100) * Math.min(w, h) * 0.4;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Stars in spiral
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 4 + time * 0.05;
      const r = (i / 50) * Math.min(w, h) * 0.38;
      const x = cx + Math.cos(angle) * r + Math.random() * 10 - 5;
      const y = cy + Math.sin(angle) * r * 0.5 + Math.random() * 5 - 2.5;
      ctx.fillStyle = `rgba(255, 255, 200, ${0.3 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Galactic core
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    coreGrad.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    coreGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();

    // Colonized systems markers
    const s = GameState.getState();
    ctx.fillStyle = '#00FF88';
    for (let i = 0; i < s.starSystems.totalSystems; i++) {
      const sysAngle = (i / 50) * Math.PI * 4 + Math.PI * 0.7;
      const sysR = 20 + (i / 50) * Math.min(w, h) * 0.35;
      const sx = cx + Math.cos(sysAngle) * sysR;
      const sy = cy + Math.sin(sysAngle) * sysR * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawMultiverse(w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Swirling portals
    for (let i = 0; i < 5; i++) {
      const px = w * (0.2 + i * 0.15);
      const py = h * 0.4 + Math.sin(time + i * 1.5) * 20;
      const r = 20 + Math.sin(time * 2 + i) * 5;

      const hue = (time * 50 + i * 72) % 360;
      ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.lineWidth = 2;

      for (let ring = 0; ring < 3; ring++) {
        ctx.beginPath();
        ctx.arc(px, py, r + ring * 5, time + ring, time + ring + Math.PI * 1.5);
        ctx.stroke();
      }

      ctx.fillStyle = `hsla(${hue}, 80%, 40%, 0.3)`;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawStarfield(w, h, 0.5);
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

  return { init, setPhase, addParticleBurst, resize };
})();
