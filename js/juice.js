// juice.js — UI juice: confetti, haptics, screen effects, micro-animations, teaser system
'use strict';

const Juice = (() => {
  // ==================== HAPTIC FEEDBACK ====================
  const Haptics = {
    light() { if (navigator.vibrate) navigator.vibrate(10); },
    medium() { if (navigator.vibrate) navigator.vibrate(20); },
    heavy() { if (navigator.vibrate) navigator.vibrate(40); },
    success() { if (navigator.vibrate) navigator.vibrate(15); },
    error() { if (navigator.vibrate) navigator.vibrate([10, 30, 10]); },
    achievement() { if (navigator.vibrate) navigator.vibrate([10, 30, 10]); },
    milestone() { if (navigator.vibrate) navigator.vibrate([10, 10, 10]); },
    prestige() { if (navigator.vibrate) navigator.vibrate(200); },
    eggHatch() { if (navigator.vibrate) navigator.vibrate([50, 30, 100, 30, 200]); },
    comboTierUp(tier) {
      if (!navigator.vibrate) return;
      const pattern = [];
      for (let i = 0; i < Math.min(tier, 8); i++) pattern.push(10);
      navigator.vibrate(pattern);
    }
  };

  // ==================== SCREEN SHAKE ====================
  const ScreenShake = {
    active: false,
    intensity: 0,
    duration: 0,
    elapsed: 0,

    trigger(px, ms) {
      const s = GameState.getState();
      if (!s.settings.screenShake) return;
      this.intensity = px;
      this.duration = ms / 1000;
      this.elapsed = 0;
      this.active = true;
    },

    update(dt) {
      if (!this.active) return;
      this.elapsed += dt;
      if (this.elapsed >= this.duration) {
        this.active = false;
        const container = document.getElementById('game-container');
        if (container) container.style.transform = '';
        return;
      }
      const progress = this.elapsed / this.duration;
      const decay = 1 - progress;
      const x = (Math.random() - 0.5) * 2 * this.intensity * decay;
      const y = (Math.random() - 0.5) * 2 * this.intensity * decay;
      const container = document.getElementById('game-container');
      if (container) container.style.transform = `translate(${x}px, ${y}px)`;
    },

    // Preset shakes
    purchase() { this.trigger(1, 100); },
    milestone() { this.trigger(3, 200); },
    phaseTransition() { this.trigger(5, 500); },
    prestige() { this.trigger(8, 2000); },
    superCritical() { this.trigger(2, 100); }
  };

  // ==================== SCREEN FLASH ====================
  const ScreenFlash = {
    trigger(opacity, durationMs) {
      const el = document.getElementById('screen-flash-overlay');
      if (!el) return;
      el.style.opacity = opacity;
      el.classList.remove('hidden');
      el.offsetWidth; // force reflow
      el.style.transition = `opacity ${durationMs}ms ease-out`;
      el.style.opacity = '0';
      setTimeout(() => {
        el.classList.add('hidden');
        el.style.transition = '';
      }, durationMs + 50);
    },

    superCritical() { this.trigger(0.05, 50); },
    achievement() { this.trigger(0.03, 100); },
    phaseTransition() { this.trigger(1, 500); },
    prestige() { this.trigger(1, 1000); }
  };

  // ==================== CONFETTI SYSTEM ====================
  const Confetti = {
    particles: [],
    canvas: null,
    ctx: null,

    init() {
      this.canvas = document.getElementById('confetti-canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    },

    burst(count, colors, x, y) {
      if (!this.canvas || !this.ctx) this.init();
      if (!this.canvas) return;

      this.canvas.classList.remove('hidden');
      const cx = x || this.canvas.width / 2;
      const cy = y || this.canvas.height / 3;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 3 + Math.random() * 4,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 10,
          life: 1.0,
          decay: 0.3 + Math.random() * 0.3
        });
      }

      if (!this._animating) {
        this._animating = true;
        this._animate();
      }
    },

    _animate() {
      if (!this.ctx || this.particles.length === 0) {
        this._animating = false;
        if (this.canvas) this.canvas.classList.add('hidden');
        return;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.rotation += p.rotSpeed;
        p.life -= 0.016 * p.decay;

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation * Math.PI / 180);
        this.ctx.globalAlpha = Math.min(1, p.life);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }

      requestAnimationFrame(() => this._animate());
    },

    // Preset bursts
    phaseUnlock() {
      this.burst(60, ['#FFD700', '#FF6B35', '#4A90D9', '#27AE60', '#9B59B6']);
    },
    achievement() {
      this.burst(40, ['#FFD700', '#FFA500', '#FFFF00']);
    },
    milestoneGold() {
      this.burst(50, ['#FFD700', '#DAA520', '#FFDF00']);
    },
    setComplete() {
      this.burst(60, ['#4A90D9', '#27AE60', '#FFD700', '#9B59B6']);
    },
    prestige() {
      this.burst(80, ['#FF69B4', '#4A90D9', '#FFD700', '#27AE60', '#9B59B6', '#E74C3C', '#FF6B35']);
    },
    dailyDay7() {
      this.burst(50, ['#FFD700', '#FF69B4', '#4A90D9']);
    }
  };

  // ==================== CURRENCY ANIMATIONS ====================
  const CurrencyAnims = {
    _lastCPS: 0,
    _lastSuffixes: {},
    _odometerValue: 0,
    _odometerTarget: 0,

    updateOdometer(currentCredits, dt) {
      // Smooth counting for currency display
      const diff = currentCredits - this._odometerValue;
      if (Math.abs(diff) < 1) {
        this._odometerValue = currentCredits;
      } else {
        this._odometerValue += diff * Math.min(1, dt * 10);
      }
      return this._odometerValue;
    },

    checkCPSChange(newCPS) {
      if (this._lastCPS > 0 && newCPS > 0) {
        const change = (newCPS - this._lastCPS) / this._lastCPS;
        if (change > 0.1) {
          // >10% increase: pump animation
          this.pumpCPS();
        }
        if (newCPS >= this._lastCPS * 2) {
          // Doubled: show x2 floater
          this.showMultiplierFloater(2);
        }
      }
      this._lastCPS = newCPS;
    },

    checkSuffixChange(value, elementId) {
      const suffix = NumberFormatter.getSuffix(value);
      if (this._lastSuffixes[elementId] && suffix !== this._lastSuffixes[elementId]) {
        this.stampSuffix(elementId);
        // Play suffix chime on milestone transition
        const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
        const idx = suffixes.indexOf(suffix);
        if (idx > 0 && typeof AdaptiveAudio !== 'undefined') {
          AdaptiveAudio.playSuffixChime(idx);
        }
      }
      this._lastSuffixes[elementId] = suffix;
    },

    pumpCPS() {
      const el = document.getElementById('cps-display');
      if (!el) return;
      el.classList.add('pump');
      setTimeout(() => el.classList.remove('pump'), 200);
    },

    stampSuffix(elementId) {
      const el = document.getElementById(elementId);
      if (!el) return;
      const suffixSpan = el.querySelector('.suffix');
      if (suffixSpan) {
        suffixSpan.classList.add('stamp');
        setTimeout(() => suffixSpan.classList.remove('stamp'), 400);
      }
    },

    showMultiplierFloater(mult) {
      const container = document.getElementById('floating-numbers');
      if (!container) return;
      const el = document.createElement('div');
      el.className = 'floating-num multiplier-float';
      el.textContent = '\u00D7' + mult + '!';
      el.style.left = '60%';
      el.style.bottom = '180px';
      el.style.color = '#FFD700';
      el.style.fontSize = '18px';
      container.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transform = 'translateY(-60px)';
        el.style.opacity = '0';
      });
      setTimeout(() => el.remove(), 800);
    }
  };

  // ==================== NUMBER MILESTONES ====================
  const NumberMilestones = {
    _shownMilestones: new Set(),

    check(value, label) {
      const thresholds = [1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30];
      const names = ['MILLION', 'BILLION', 'TRILLION', 'QUADRILLION',
        'QUINTILLION', 'SEXTILLION', 'SEPTILLION', 'OCTILLION', 'NONILLION'];

      for (let i = 0; i < thresholds.length; i++) {
        const key = label + '_' + i;
        if (value >= thresholds[i] && !this._shownMilestones.has(key)) {
          this._shownMilestones.add(key);
          this.showMilestonePopup(names[i], value);
          break;
        }
      }
    },

    showMilestonePopup(name, value) {
      const container = document.getElementById('milestone-popup');
      if (!container) return;
      container.innerHTML = `<div class="milestone-content">
        <div class="milestone-label">MILESTONE!</div>
        <div class="milestone-number">${NumberFormatter.format(value)}</div>
        <div class="milestone-name">${name}</div>
      </div>`;
      container.classList.remove('hidden');
      container.classList.add('show');

      AdaptiveAudio.playMilestoneSound();
      Haptics.milestone();

      setTimeout(() => {
        container.classList.remove('show');
        container.classList.add('hidden');
      }, 2500);
    }
  };

  // ==================== GENERATOR ROW ANIMATIONS ====================
  const GenAnims = {
    getIconAnimation(genId) {
      // Determine animation class based on generator type
      const gen = Engine.findGenerator(genId);
      if (!gen) return '';
      const name = gen.name.toLowerCase();
      if (name.includes('worker') || name.includes('scavenger') || name.includes('negotiator'))
        return 'gen-anim-sway';
      if (name.includes('drill') || name.includes('machine') || name.includes('mine') || name.includes('factory'))
        return 'gen-anim-vibrate';
      if (name.includes('ship') || name.includes('tug') || name.includes('probe') || name.includes('shuttle'))
        return 'gen-anim-bob';
      if (name.includes('base') || name.includes('station') || name.includes('hub') || name.includes('complex'))
        return 'gen-anim-blink';
      return 'gen-anim-pulse';
    },

    popCount(genId) {
      const el = document.querySelector(`[data-genid="${genId}"] .gen-count`);
      if (!el) return;
      el.classList.add('pop');
      setTimeout(() => el.classList.remove('pop'), 150);
    },

    milestoneRipple(genId) {
      const row = document.querySelector(`[data-genid="${genId}"]`);
      if (!row) return;
      row.classList.add('milestone-ripple');
      setTimeout(() => row.classList.remove('milestone-ripple'), 600);
    },

    // Show synergy connection pulse between two generator rows
    synergyPulse(genId1, genId2) {
      const row1 = document.querySelector(`[data-genid="${genId1}"]`);
      const row2 = document.querySelector(`[data-genid="${genId2}"]`);
      if (row1) row1.classList.add('synergy-active');
      if (row2) row2.classList.add('synergy-active');
    },

    clearSynergyPulse(genId) {
      const row = document.querySelector(`[data-genid="${genId}"]`);
      if (row) row.classList.remove('synergy-active');
    }
  };

  // ==================== BUTTON ANIMATIONS ====================
  const ButtonAnims = {
    pulseAffordable(btn) {
      if (!btn || btn.dataset.pulsed) return;
      btn.classList.add('pulse-affordable');
      btn.dataset.pulsed = 'true';
      setTimeout(() => btn.classList.remove('pulse-affordable'), 300);
    },

    bounceTab(tabBtn) {
      if (!tabBtn) return;
      tabBtn.classList.add('tab-bounce');
      setTimeout(() => tabBtn.classList.remove('tab-bounce'), 300);
    }
  };

  // ==================== TEASER SYSTEM (Section 57) ====================
  const TeaserSystem = {
    getNextUnlock(s) {
      // Priority 1: Phase unlock
      const phaseTeaser = this._getPhaseTeaser(s);
      if (phaseTeaser && phaseTeaser.progress < 1) return phaseTeaser;

      // Priority 2: Next unaffordable upgrade
      const upgTeaser = this._getUpgradeTeaser(s);
      if (upgTeaser) return upgTeaser;

      // Priority 3: Next generator milestone
      const mileTeaser = this._getMilestoneTeaser(s);
      if (mileTeaser) return mileTeaser;

      // Priority 4: Next achievement (closest)
      const achTeaser = this._getAchievementTeaser(s);
      if (achTeaser) return achTeaser;

      return null;
    },

    _getPhaseTeaser(s) {
      const nextPhase = s.currentPhase + 1;
      if (nextPhase > 9) return null;
      const phaseData = GameData.PHASES[nextPhase];
      if (!phaseData) return null;

      // Check what's needed for phase transition
      // Phase 2 needs rocket launched, Phase 3+ needs specific upgrades/resources
      let progress = 0;
      let name = 'Phase ' + nextPhase + ': ' + phaseData.name;

      if (nextPhase === 2) {
        const parts = s.rocketParts;
        const total = Object.keys(parts).length;
        const done = Object.values(parts).filter(Boolean).length;
        progress = done / total;
        if (s.rocketLaunched) progress = 1;
        name = 'Launch Rocket!';
      } else {
        // Approximate based on earnings vs typical phase cost
        const phaseCosts = { 3: 1e6, 4: 1e9, 5: 1e12, 6: 1e15, 7: 1e18, 8: 1e21, 9: 1e24 };
        const cost = phaseCosts[nextPhase] || 1e30;
        progress = Math.min(1, s.credits / cost);
      }

      return { name, progress, type: 'phase', almostThere: progress >= 0.9 };
    },

    _getUpgradeTeaser(s) {
      const phase = s.currentPhase;
      const upgrades = GameData.UPGRADES[phase] || [];

      for (const upg of upgrades) {
        if (s.upgradesPurchased[upg.id]) continue;

        // Check requirements
        if (upg.req) {
          if (upg.req.generator && (s.generators[upg.req.generator] || 0) < upg.req.count) continue;
          if (upg.req.totalTaps && s.totalTaps < upg.req.totalTaps) continue;
        }

        const cost = upg.cost;
        const have = GameState.getCurrency(upg.currency);
        const progress = Math.min(1, have / cost);
        if (progress < 1) {
          return {
            name: upg.name,
            progress,
            type: 'upgrade',
            almostThere: progress >= 0.9,
            cost: NumberFormatter.format(cost),
            have: NumberFormatter.format(have)
          };
        }
      }
      return null;
    },

    _getMilestoneTeaser(s) {
      const milestones = Expansion.MILESTONES;
      let closest = null;
      let closestProgress = 0;

      for (const genId in s.generators) {
        const count = s.generators[genId];
        for (const m of milestones) {
          if (count < m.count) {
            const progress = count / m.count;
            if (!closest || progress > closestProgress) {
              const gen = Engine.findGenerator(genId);
              closest = {
                name: (gen ? gen.name : genId) + ' x' + m.count + ' ' + m.badge,
                progress,
                type: 'milestone',
                almostThere: progress >= 0.9
              };
              closestProgress = progress;
            }
            break; // Only check next milestone for each gen
          }
        }
      }
      return closest;
    },

    _getAchievementTeaser(s) {
      // Check a few trackable achievement categories for teaser potential
      if (typeof GameData === 'undefined' || !GameData.ACHIEVEMENTS) return null;
      const achs = GameData.ACHIEVEMENTS;
      for (const a of achs) {
        if (s.achievements && s.achievements[a.id]) continue; // already earned
        if (a.secret) continue; // don't tease secrets
        // Only tease countable achievements with check functions
        if (!a.check) continue;
        // Try to estimate progress for common categories
        let progress = null;
        if (a.category === 'tapping' && a.desc.includes('Tap')) {
          const match = a.desc.match(/([\d,]+)/);
          if (match) {
            const target = parseInt(match[1].replace(/,/g, ''));
            if (target > 0) progress = Math.min(0.99, s.totalTaps / target);
          }
        } else if (a.category === 'earning' && a.desc.includes('Earn')) {
          const suffixMap = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18, Sx: 1e21 };
          const match = a.desc.match(/(\d+)(\w+)/);
          if (match) {
            const target = parseInt(match[1]) * (suffixMap[match[2]] || 1);
            if (target > 0) progress = Math.min(0.99, s.creditsAllTimeEarned / target);
          }
        }
        // Only return if close (>50%)
        if (progress !== null && progress > 0.5 && progress < 1) {
          return { name: a.name + ': ' + a.desc, progress, type: 'achievement', almostThere: progress >= 0.9 };
        }
      }
      return null;
    },

    getComingSoonPreview(s) {
      const nextPhase = s.currentPhase + 1;
      if (nextPhase > 9) return null;
      const phaseData = GameData.PHASES[nextPhase];
      if (!phaseData) return null;

      const genCount = (GameData.GENERATORS[nextPhase] || []).length;
      const features = [];
      if (genCount > 0) features.push(genCount + ' new generators');
      if (nextPhase === 4) features.push('Terraforming system');
      if (nextPhase === 5) features.push('Fleet building');
      if (nextPhase === 6) features.push('Moon exploration');
      if (nextPhase === 7) features.push('Exoplanet colonization');
      if (nextPhase === 8) features.push('Galaxy mapping');
      if (nextPhase === 9) features.push('Multiverse exploration');

      return {
        phase: nextPhase,
        name: phaseData.name,
        features,
        icon: phaseData.tapIcon
      };
    }
  };

  // ==================== PROGRESS BAR SHIMMER ====================
  const ProgressShimmer = {
    init() {
      // CSS handles the shimmer animation — this just ensures class is applied
    }
  };

  // ==================== TOAST ANIMATIONS ====================
  const ToastAnims = {
    // CSS-driven slide in/out — this module triggers special toasts
    showNumberMilestone(suffix, value) {
      const el = document.createElement('div');
      el.className = 'toast-item milestone-toast';
      el.innerHTML = `<span class="suffix-stamp">${suffix}</span> reached!`;
      const container = document.getElementById('toast-container');
      if (container) {
        container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
          el.classList.remove('show');
          setTimeout(() => el.remove(), 300);
        }, 2500);
      }
    }
  };

  // ==================== MAIN UPDATE ====================
  function update(dt) {
    ScreenShake.update(dt);
  }

  // ==================== EXPANSION B: Egg Hatch Animation ====================
  const EggHatchAnim = {
    play(color) {
      const container = document.getElementById('game-container');
      if (!container) return;

      // Create crack overlay
      const crack = document.createElement('div');
      crack.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:80px;height:100px;border-radius:50% 50% 45% 45%;
        border:3px solid ${color || '#FFD700'};
        animation:eggCrack 0.8s ease-out forwards;
        pointer-events:none;z-index:100;`;
      container.appendChild(crack);

      // Burst particles
      for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        const angle = (i / 12) * Math.PI * 2;
        const dist = 50 + Math.random() * 40;
        p.style.cssText = `position:absolute;top:50%;left:50%;width:6px;height:6px;
          border-radius:50%;background:${color || '#FFD700'};
          pointer-events:none;z-index:100;
          transition:all 0.6s ease-out;opacity:1;`;
        container.appendChild(p);
        requestAnimationFrame(() => {
          p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
          p.style.opacity = '0';
        });
        setTimeout(() => p.remove(), 700);
      }

      setTimeout(() => crack.remove(), 900);
      ScreenFlash.flash(color || '#FFD700', 0.3);
    }
  };

  // ==================== EXPANSION B: Contract Complete Animation ====================
  const ContractAnim = {
    play() {
      const container = document.getElementById('game-container');
      if (!container) return;

      const stamp = document.createElement('div');
      stamp.textContent = 'COMPLETE';
      stamp.style.cssText = `position:absolute;top:40%;left:50%;transform:translate(-50%,-50%) scale(3) rotate(-15deg);
        font-size:24px;font-weight:bold;color:rgba(0,255,136,0.8);
        letter-spacing:4px;border:3px solid rgba(0,255,136,0.8);padding:8px 16px;
        pointer-events:none;z-index:100;
        transition:all 0.5s ease-out;`;
      container.appendChild(stamp);

      requestAnimationFrame(() => {
        stamp.style.transform = 'translate(-50%,-50%) scale(1) rotate(-15deg)';
        stamp.style.opacity = '0.9';
      });

      setTimeout(() => {
        stamp.style.opacity = '0';
        setTimeout(() => stamp.remove(), 300);
      }, 1200);

      Confetti.burst();
    }
  };

  // ==================== EXPANSION B: Challenge Animation ====================
  const ChallengeAnim = {
    playStart() {
      ScreenFlash.flash('#FF4444', 0.4);
      ScreenShake.shake(6, 500);
    },

    playComplete() {
      ScreenFlash.flash('#FFD700', 0.5);
      ScreenShake.shake(4, 300);
      Confetti.burst();
      Confetti.burst(); // Double confetti for challenge complete
    }
  };

  // ==================== EXPANSION B: Combo Flame Effect ====================
  const ComboFlame = {
    show(level) {
      const tapBtn = document.getElementById('tap-btn');
      if (!tapBtn) return;
      const intensity = Math.min(level / 100, 1);
      const r = Math.floor(255 * intensity);
      const g = Math.floor(165 * (1 - intensity));
      tapBtn.style.boxShadow = `0 0 ${10 + intensity * 30}px rgba(${r}, ${g}, 0, ${0.3 + intensity * 0.5})`;
      if (level <= 0) tapBtn.style.boxShadow = '';
    }
  };

  // ==================== EXPANSION B: Weather Overlay Effect ====================
  const WeatherOverlay = {
    currentEffect: null,

    set(weatherId) {
      this.clear();
      const container = document.getElementById('game-container');
      if (!container) return;

      const overlay = document.createElement('div');
      overlay.id = 'weather-overlay';
      overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:hidden;';

      if (weatherId === 'rain' || weatherId === 'first_rain') {
        // Rain particle effect
        for (let i = 0; i < 30; i++) {
          const drop = document.createElement('div');
          drop.style.cssText = `position:absolute;left:${Math.random() * 100}%;top:-10px;width:1px;height:${10 + Math.random() * 15}px;background:rgba(100,150,255,0.4);animation:rainFall ${0.5 + Math.random() * 0.5}s linear infinite;animation-delay:${Math.random()}s;`;
          overlay.appendChild(drop);
        }
      } else if (weatherId === 'snow') {
        // Snow particle effect
        for (let i = 0; i < 20; i++) {
          const flake = document.createElement('div');
          flake.style.cssText = `position:absolute;left:${Math.random() * 100}%;top:-10px;width:${3 + Math.random() * 4}px;height:${3 + Math.random() * 4}px;border-radius:50%;background:rgba(255,255,255,0.6);animation:snowFall ${2 + Math.random() * 3}s linear infinite;animation-delay:${Math.random() * 2}s;`;
          overlay.appendChild(flake);
        }
      } else if (weatherId === 'lightning') {
        // Lightning flash effect at random intervals
        overlay.style.background = 'transparent';
        this._lightningInterval = setInterval(() => {
          if (Math.random() < 0.15) {
            overlay.style.background = 'rgba(255,255,200,0.15)';
            setTimeout(() => { overlay.style.background = 'transparent'; }, 100);
          }
        }, 500);
      } else if (weatherId === 'dust_storm') {
        overlay.style.background = 'rgba(180, 120, 60, 0.08)';
      } else if (weatherId === 'golden_hour') {
        overlay.style.background = 'linear-gradient(180deg, rgba(255,180,50,0.06) 0%, rgba(255,100,30,0.04) 100%)';
      } else if (weatherId === 'night' || weatherId === 'deep_shadow' || weatherId === 'dark_nebula') {
        overlay.style.background = 'rgba(0,0,30,0.12)';
      } else if (weatherId === 'flare' || weatherId === 'supernova_echo') {
        overlay.style.background = 'rgba(255,200,50,0.05)';
      }

      container.appendChild(overlay);
      this.currentEffect = weatherId;
    },

    clear() {
      const existing = document.getElementById('weather-overlay');
      if (existing) existing.remove();
      if (this._lightningInterval) {
        clearInterval(this._lightningInterval);
        this._lightningInterval = null;
      }
      this.currentEffect = null;
    }
  };

  // ==================== EXPANSION B: Prestige Big Bang Animation ====================
  const PrestigeBigBang = {
    play() {
      const container = document.getElementById('game-container');
      if (!container) return;

      // Fullscreen white flash that fades
      ScreenFlash.flash('#FFFFFF', 1.0);

      // Central expansion ring
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:10px;height:10px;border-radius:50%;
        border:3px solid rgba(255,215,0,0.8);
        pointer-events:none;z-index:200;
        transition:all 1.5s ease-out;`;
      container.appendChild(ring);

      requestAnimationFrame(() => {
        ring.style.width = '500px';
        ring.style.height = '500px';
        ring.style.opacity = '0';
        ring.style.borderWidth = '1px';
      });

      // Radial particle burst
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        const angle = (i / 30) * Math.PI * 2;
        const dist = 100 + Math.random() * 150;
        const colors = ['#FFD700', '#FF6600', '#FF00FF', '#00FFFF', '#FFFFFF'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 2 + Math.random() * 4;
        p.style.cssText = `position:absolute;top:50%;left:50%;width:${size}px;height:${size}px;
          border-radius:50%;background:${color};
          pointer-events:none;z-index:200;
          transition:all 1.2s ease-out;opacity:1;`;
        container.appendChild(p);

        requestAnimationFrame(() => {
          p.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
          p.style.opacity = '0';
        });
        setTimeout(() => p.remove(), 1300);
      }

      setTimeout(() => ring.remove(), 1600);

      // Secondary confetti burst
      setTimeout(() => Confetti.burst(), 500);
      setTimeout(() => Confetti.burst(), 800);
    }
  };

  // ==================== EXPANSION B: Golden Rush Glow ====================
  const GoldenRushGlow = {
    active: false,

    start(generatorId) {
      this.active = true;
      const genEl = document.querySelector(`[data-gen="${generatorId}"]`);
      if (genEl) {
        genEl.classList.add('golden-rush-active');
      }
      // Global golden tint
      const container = document.getElementById('game-container');
      if (container) {
        container.style.boxShadow = 'inset 0 0 60px rgba(255,215,0,0.15)';
      }
    },

    stop() {
      this.active = false;
      document.querySelectorAll('.golden-rush-active').forEach(el => {
        el.classList.remove('golden-rush-active');
      });
      const container = document.getElementById('game-container');
      if (container) {
        container.style.boxShadow = '';
      }
    }
  };

  // ==================== EXPANSION B: Lucky Drop Float Animation ====================
  const LuckyDropAnim = {
    show(x, y, dropType) {
      const container = document.getElementById('game-container');
      if (!container) return;

      const drop = document.createElement('div');
      const icons = {
        credits: '\u{1F4B0}',
        rp: '\u{1F52C}',
        ore: '\u26CF',
        rm: '\u{1F48E}',
        sd: '\u2B50',
        cosmicDust: '\u{1FA90}',
        booster: '\u26A1',
        egg: '\u{1F95A}'
      };
      drop.textContent = icons[dropType] || '\u2728';
      drop.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:28px;
        pointer-events:auto;cursor:pointer;z-index:100;
        animation:dropFloat 3s ease-in-out infinite;
        filter:drop-shadow(0 0 8px rgba(255,215,0,0.6));
        transition:transform 0.3s, opacity 0.3s;`;
      drop.id = 'lucky-drop-' + Date.now();

      container.appendChild(drop);
      return drop;
    },

    collect(dropEl) {
      if (!dropEl) return;
      dropEl.style.transform = 'scale(1.5)';
      dropEl.style.opacity = '0';
      setTimeout(() => dropEl.remove(), 300);
    }
  };

  // ==================== EXPANSION B: Synergy Activation Flash ====================
  const SynergyFlash = {
    play(synergyName) {
      const container = document.getElementById('game-container');
      if (!container) return;

      const banner = document.createElement('div');
      banner.textContent = '\u26A1 ' + synergyName + ' Activated!';
      banner.style.cssText = `position:absolute;top:20%;left:50%;transform:translate(-50%,-50%) scale(0.5);
        font-size:18px;font-weight:bold;color:#FFD700;text-shadow:0 0 10px rgba(255,215,0,0.8);
        pointer-events:none;z-index:150;white-space:nowrap;
        transition:all 0.5s ease-out;`;
      container.appendChild(banner);

      requestAnimationFrame(() => {
        banner.style.transform = 'translate(-50%,-50%) scale(1)';
      });

      setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transform = 'translate(-50%,-80%) scale(1.1)';
        setTimeout(() => banner.remove(), 500);
      }, 1500);

      ScreenFlash.flash('#FFD700', 0.2);
    }
  };

  // ==================== Section 87: CELEBRATION SYSTEM (5 Tiers) ====================
  const Celebrations = {
    // Tier 1: Micro — small pop, no overlay (generator purchase)
    // Tier 2: Minor — medium confetti, brief text (upgrade purchase)
    // Tier 3: Standard — full confetti, banner text (milestone, achievement)
    // Tier 4: Major — heavy confetti, screen shake, text (phase unlock)
    // Tier 5: Epic — full screen, multi-burst, extended (prestige, set complete)

    TIERS: {
      1: { confettiCount: 0, shakeIntensity: 0, shakeDuration: 0, flashOpacity: 0, soundLevel: 'light', showOverlay: false, duration: 0 },
      2: { confettiCount: 15, shakeIntensity: 1, shakeDuration: 100, flashOpacity: 0.02, soundLevel: 'medium', showOverlay: false, duration: 0 },
      3: { confettiCount: 40, shakeIntensity: 2, shakeDuration: 200, flashOpacity: 0.05, soundLevel: 'success', showOverlay: true, duration: 2000 },
      4: { confettiCount: 60, shakeIntensity: 4, shakeDuration: 400, flashOpacity: 0.1, soundLevel: 'achievement', showOverlay: true, duration: 3000 },
      5: { confettiCount: 100, shakeIntensity: 6, shakeDuration: 600, flashOpacity: 0.15, soundLevel: 'prestige', showOverlay: true, duration: 4000 }
    },

    play(tier, opts = {}) {
      const config = this.TIERS[tier] || this.TIERS[1];

      // Haptic feedback
      if (tier >= 2) Haptics.medium();
      if (tier >= 4) Haptics.heavy();
      if (tier === 5) Haptics.prestige();

      // Screen shake
      if (config.shakeIntensity > 0) {
        ScreenShake.trigger(config.shakeIntensity, config.shakeDuration);
      }

      // Screen flash
      if (config.flashOpacity > 0) {
        ScreenFlash.trigger(config.flashOpacity, config.shakeDuration);
      }

      // Confetti
      if (config.confettiCount > 0) {
        const colors = opts.colors || ['#FFD700', '#FF6B35', '#4A90D9', '#27AE60', '#9B59B6'];
        Confetti.burst(config.confettiCount, colors, opts.x, opts.y);
        // Extra bursts for higher tiers
        if (tier >= 4) {
          setTimeout(() => Confetti.burst(Math.floor(config.confettiCount * 0.6), colors), 300);
        }
        if (tier === 5) {
          setTimeout(() => Confetti.burst(Math.floor(config.confettiCount * 0.4), colors), 600);
          setTimeout(() => Confetti.burst(Math.floor(config.confettiCount * 0.3), colors), 900);
        }
      }

      // Celebration overlay
      if (config.showOverlay && opts.title) {
        this.showOverlay(tier, opts.icon || '', opts.title || '', opts.subtitle || '', config.duration);
      }

      // Scene tap burst for tiers 1-2
      if (tier <= 2 && opts.x !== undefined && typeof SceneRenderer !== 'undefined') {
        SceneRenderer.triggerTapBurst(opts.x, opts.y, tier);
      }
    },

    showOverlay(tier, icon, title, subtitle, duration) {
      const overlay = document.getElementById('celebration-overlay');
      const content = document.getElementById('celebration-content');
      const iconEl = document.getElementById('celebration-icon');
      const titleEl = document.getElementById('celebration-title');
      const subtitleEl = document.getElementById('celebration-subtitle');

      if (!overlay || !content) return;

      // Set tier class
      overlay.className = 'celebration-tier-' + tier;
      iconEl.textContent = icon;
      titleEl.textContent = title;
      subtitleEl.textContent = subtitle;

      content.classList.remove('hidden');
      overlay.classList.remove('hidden');

      // Auto-dismiss
      setTimeout(() => {
        overlay.classList.add('hidden');
        content.classList.add('hidden');
      }, duration || 2000);
    }
  };

  // ==================== Section 87: Confetti Physics Enhancement ====================
  // Improved confetti with wind, turbulence, and drag
  const ConfettiPhysics = {
    gravity: 0.12,
    drag: 0.98,
    windX: 0,
    turbulence: 0.3,

    applyPhysics(p) {
      // Air resistance
      p.vx *= this.drag;
      p.vy *= this.drag;
      // Gravity
      p.vy += this.gravity;
      // Wind
      p.vx += this.windX * 0.01;
      // Turbulence
      p.vx += (Math.random() - 0.5) * this.turbulence;
      // 3D tumbling via rotation speed
      p.rotation += p.rotSpeed;
    }
  };

  // ==================== Section 88: Micro-Interaction Helpers ====================
  const MicroInteractions = {
    // Purchase ripple on generator row
    purchaseRipple(element) {
      if (!element) return;
      element.classList.add('purchase-ripple');
      setTimeout(() => element.classList.remove('purchase-ripple'), 400);
    },

    // Count pop on number elements
    countPop(element) {
      if (!element) return;
      element.classList.add('count-pop');
      setTimeout(() => element.classList.remove('count-pop'), 150);
    },

    // Affordability glow when item becomes purchasable
    newlyAffordable(element) {
      if (!element || element.dataset.wasAffordable === 'true') return;
      element.classList.add('newly-affordable');
      element.dataset.wasAffordable = 'true';
      setTimeout(() => element.classList.remove('newly-affordable'), 300);
    },

    // Progress bar completion flash
    progressComplete(element) {
      if (!element) return;
      element.classList.add('progress-complete');
      setTimeout(() => element.classList.remove('progress-complete'), 500);
    },

    // Milestone badge stamp animation
    milestoneStamp(element) {
      if (!element) return;
      element.classList.add('milestone-stamp');
      setTimeout(() => element.classList.remove('milestone-stamp'), 500);
    },

    // Tap burst on tap button
    tapBurst(tapBtn) {
      if (!tapBtn) return;
      const rect = tapBtn.getBoundingClientRect();
      const ring = document.createElement('div');
      ring.className = 'tap-burst-ring';
      ring.style.left = (rect.left + rect.width / 2) + 'px';
      ring.style.top = (rect.top + rect.height / 2) + 'px';
      document.body.appendChild(ring);
      setTimeout(() => ring.remove(), 400);
    },

    // Tab badge notification dot
    showTabBadge(tabName) {
      const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
      if (!btn || btn.querySelector('.tab-badge-dot')) return;
      const dot = document.createElement('span');
      dot.className = 'tab-badge-dot';
      dot.style.cssText = 'position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:#E74C3C;';
      btn.style.position = 'relative';
      btn.appendChild(dot);
    },

    // Remove tab badge
    clearTabBadge(tabName) {
      const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
      if (!btn) return;
      const dot = btn.querySelector('.tab-badge-dot');
      if (dot) dot.remove();
    },

    // Booster activation pulse
    boosterActivate(element) {
      if (!element) return;
      element.classList.add('booster-activate');
      setTimeout(() => element.classList.remove('booster-activate'), 600);
    },

    // Save indicator flash
    showSaveIndicator() {
      let indicator = document.querySelector('.save-indicator');
      if (indicator) indicator.remove();
      indicator = document.createElement('div');
      indicator.className = 'save-indicator';
      indicator.textContent = 'SAVED';
      document.body.appendChild(indicator);
      setTimeout(() => indicator.remove(), 1200);
    }
  };

  // ==================== Section 75: Toast Queue System ====================
  const ToastQueue = {
    queue: [],
    displaying: false,
    maxVisible: 1,
    defaultDuration: 3000,

    // Toast types: success, warning, error, info, achievement, milestone, rare
    add(type, title, desc, opts = {}) {
      const toast = {
        type: type || 'info',
        title: title || '',
        desc: desc || '',
        icon: opts.icon || this._defaultIcon(type),
        duration: opts.duration || this.defaultDuration,
        timestamp: Date.now()
      };
      this.queue.push(toast);
      if (!this.displaying) this._showNext();
    },

    _defaultIcon(type) {
      const icons = {
        success: '\u2705',
        warning: '\u26A0\uFE0F',
        error: '\u274C',
        info: '\u2139\uFE0F',
        achievement: '\uD83C\uDFC6',
        milestone: '\u2B50',
        rare: '\uD83D\uDC8E'
      };
      return icons[type] || '\u2139\uFE0F';
    },

    _showNext() {
      if (this.queue.length === 0) {
        this.displaying = false;
        return;
      }
      this.displaying = true;
      const toast = this.queue.shift();
      const container = document.getElementById('toast-container');
      if (!container) return;

      const el = document.createElement('div');
      el.className = 'toast-item toast-' + toast.type;
      el.style.setProperty('--toast-duration', toast.duration + 'ms');
      el.innerHTML =
        '<span class="toast-icon">' + toast.icon + '</span>' +
        '<div class="toast-text">' +
          '<div class="toast-title">' + toast.title + '</div>' +
          (toast.desc ? '<div class="toast-desc">' + toast.desc + '</div>' : '') +
        '</div>' +
        '<div class="toast-progress"></div>';

      container.appendChild(el);

      // Auto-dismiss
      setTimeout(() => {
        el.classList.add('exiting');
        setTimeout(() => {
          el.remove();
          this._showNext();
        }, 250);
      }, toast.duration);
    },

    // Clear all pending toasts
    clear() {
      this.queue = [];
      const container = document.getElementById('toast-container');
      if (container) container.innerHTML = '';
      this.displaying = false;
    }
  };

  // ==================== INIT ====================
  function init() {
    Confetti.init();

    // Create screen flash overlay if not exists
    if (!document.getElementById('screen-flash-overlay')) {
      const flash = document.createElement('div');
      flash.id = 'screen-flash-overlay';
      flash.className = 'hidden';
      flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;pointer-events:none;z-index:9999;';
      document.body.appendChild(flash);
    }

    // Create confetti canvas if not exists
    if (!document.getElementById('confetti-canvas')) {
      const c = document.createElement('canvas');
      c.id = 'confetti-canvas';
      c.className = 'hidden';
      c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
      document.body.appendChild(c);
    }

    // Create milestone popup if not exists
    if (!document.getElementById('milestone-popup')) {
      const mp = document.createElement('div');
      mp.id = 'milestone-popup';
      mp.className = 'hidden';
      document.getElementById('game-container').appendChild(mp);
    }
  }

  return {
    Haptics, ScreenShake, ScreenFlash, Confetti, CurrencyAnims,
    NumberMilestones, GenAnims, ButtonAnims, TeaserSystem,
    ProgressShimmer, ToastAnims,
    EggHatchAnim, ContractAnim, ChallengeAnim, ComboFlame,
    WeatherOverlay, PrestigeBigBang, GoldenRushGlow,
    LuckyDropAnim, SynergyFlash,
    Celebrations, ConfettiPhysics, MicroInteractions, ToastQueue,
    update, init
  };
})();
