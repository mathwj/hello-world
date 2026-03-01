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
      // Not easily determinable without running check functions
      // Return null — achievements are surprise unlocks
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
    update, init
  };
})();
