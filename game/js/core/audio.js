// =========================================
// Audio Manager - Generates sounds programmatically
// =========================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.currentMusic = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available');
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate a simple tone
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Play multiple tones in sequence (melody)
  playMelody(notes, baseVolume = 0.2) {
    if (!this.sfxEnabled || !this.ctx) return;
    this.ensureContext();
    let time = this.ctx.currentTime;
    notes.forEach(([freq, dur, type = 'sine']) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(baseVolume * this.sfxVolume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + dur);
      time += dur * 0.7;
    });
  }

  // Sound effects
  sfx(name) {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    switch (name) {
      case 'plant':
        this.playTone(220, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(330, 0.1, 'sine', 0.2), 80);
        break;
      case 'harvest':
        this.playMelody([[523, 0.1], [659, 0.1], [784, 0.15]], 0.3);
        break;
      case 'coins':
        this.playMelody([[880, 0.08], [1108, 0.08], [1318, 0.12]], 0.25);
        break;
      case 'xp':
        this.playTone(660, 0.15, 'sine', 0.15);
        break;
      case 'click':
        this.playTone(400, 0.06, 'square', 0.1);
        break;
      case 'buy':
        this.playMelody([[440, 0.1], [554, 0.1], [659, 0.15]], 0.2);
        break;
      case 'sell':
        this.playMelody([[659, 0.08], [784, 0.08], [988, 0.12]], 0.25);
        break;
      case 'error':
        this.playMelody([[300, 0.15, 'square'], [200, 0.2, 'square']], 0.15);
        break;
      case 'levelup':
        this.playMelody([
          [523, 0.12], [659, 0.12], [784, 0.12],
          [1047, 0.2], [784, 0.1], [1047, 0.3]
        ], 0.3);
        break;
      case 'quest_complete':
        this.playMelody([
          [659, 0.1], [784, 0.1], [988, 0.15], [1318, 0.25]
        ], 0.25);
        break;
      case 'build':
        this.playTone(200, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(250, 0.1, 'square', 0.15), 100);
        setTimeout(() => this.playTone(300, 0.15, 'triangle', 0.2), 200);
        break;
      case 'feed':
        this.playMelody([[350, 0.1], [440, 0.12]], 0.2);
        break;
      case 'collect':
        this.playMelody([[500, 0.08], [600, 0.08], [700, 0.12]], 0.25);
        break;
      case 'wither':
        this.playMelody([[400, 0.2, 'sawtooth'], [300, 0.25, 'sawtooth']], 0.1);
        break;
      case 'chicken':
        this.playMelody([[600, 0.05], [800, 0.08], [600, 0.05]], 0.15);
        break;
      case 'cow':
        this.playTone(150, 0.4, 'sawtooth', 0.1);
        break;
      case 'unlock':
        this.playMelody([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.2]], 0.25);
        break;
    }
  }

  // Simple background music using oscillators
  startMusic() {
    if (!this.musicEnabled || !this.ctx || this.currentMusic) return;
    this.ensureContext();

    const playLoop = () => {
      if (!this.musicEnabled) return;

      // Simple peaceful melody loop
      const notes = [
        [262, 0.5], [330, 0.5], [392, 0.5], [330, 0.5],
        [294, 0.5], [349, 0.5], [440, 0.5], [349, 0.5],
        [262, 0.5], [392, 0.5], [523, 0.5], [392, 0.5],
        [349, 0.5], [330, 0.5], [294, 0.5], [262, 0.8],
      ];

      let time = this.ctx.currentTime;
      const oscillators = [];

      notes.forEach(([freq, dur]) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.05 * this.musicVolume, time);
        gain.gain.setValueAtTime(0.05 * this.musicVolume, time + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + dur);
        oscillators.push(osc);
        time += dur;
      });

      // Schedule next loop
      const totalDuration = notes.reduce((sum, [, d]) => sum + d, 0);
      this.currentMusic = setTimeout(() => playLoop(), totalDuration * 1000);
    };

    playLoop();
  }

  stopMusic() {
    if (this.currentMusic) {
      clearTimeout(this.currentMusic);
      this.currentMusic = null;
    }
  }

  setMusicVolume(v) {
    this.musicVolume = v;
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) this.startMusic();
    else this.stopMusic();
    return this.musicEnabled;
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }
}

const Audio = new AudioManager();
