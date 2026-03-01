// audio.js — Adaptive audio system: layered music, SFX polish, ambient sounds
'use strict';

const AdaptiveAudio = (() => {
  const audioCtx = typeof AudioContext !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;

  // Activity tracking
  let tapTimestamps = [];
  let lastActivityState = 'idle';
  let currentPhase = 1;
  let intensitySmooth = 0;

  // Layer states
  const layers = {
    base: { node: null, gain: null, volume: 0 },
    melody: { node: null, gain: null, volume: 0 },
    rhythm: { node: null, gain: null, volume: 0 },
    hype: { node: null, gain: null, volume: 0 },
    event: { node: null, gain: null, volume: 0 },
    ambient: { node: null, gain: null, volume: 0 }
  };

  // Phase music configs
  const PHASE_MUSIC = {
    1: { baseFreq: 65, scale: 'minor', tempo: 60, ambient: 'junkyard' },
    2: { baseFreq: 82, scale: 'pentatonic', tempo: 70, ambient: 'space' },
    3: { baseFreq: 98, scale: 'minor', tempo: 75, ambient: 'lunar' },
    4: { baseFreq: 110, scale: 'dorian', tempo: 80, ambient: 'mars' },
    5: { baseFreq: 130, scale: 'mixolydian', tempo: 85, ambient: 'belt' },
    6: { baseFreq: 146, scale: 'phrygian', tempo: 90, ambient: 'jupiter' },
    7: { baseFreq: 164, scale: 'lydian', tempo: 95, ambient: 'exo' },
    8: { baseFreq: 196, scale: 'chromatic', tempo: 100, ambient: 'cosmic' },
    9: { baseFreq: 220, scale: 'wholetone', tempo: 110, ambient: 'glitch' }
  };

  // Generator purchase sound types
  const GEN_SOUND_TYPES = {
    worker: { type: 'noise', attack: 0.01, decay: 0.3, freq: 200, filter: 'lowpass' },
    machine: { type: 'sawtooth', attack: 0.05, decay: 0.4, freq: 150, filter: 'bandpass' },
    building: { type: 'square', attack: 0.01, decay: 0.5, freq: 100, filter: 'lowpass' },
    ship: { type: 'sawtooth', attack: 0.1, decay: 0.6, freq: 300, filter: 'highpass' },
    hightech: { type: 'sine', attack: 0.01, decay: 0.3, freq: 800, filter: 'bandpass' },
    alien: { type: 'sine', attack: 0.05, decay: 0.8, freq: 440, filter: 'bandpass' }
  };

  // Ambient sound descriptors per phase
  const AMBIENT_SOUNDS = {
    1: ['wind', 'clang', 'birds'],
    2: ['spacehum', 'radio', 'solarwind'],
    3: ['creaks', 'airlock', 'footsteps'],
    4: ['wind', 'sand', 'thuds'],
    5: ['collisions', 'lasers', 'thrusters'],
    6: ['rumble', 'icecrack', 'volcanic'],
    7: ['chimes', 'birdsong', 'energyhum'],
    8: ['radiation', 'whispers'],
    9: ['glitch', 'reversed', 'dimensional']
  };

  function init() {
    if (!audioCtx) return;
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.connect(masterGain);
    sfxGain = audioCtx.createGain();
    sfxGain.connect(masterGain);

    // Create gain nodes for each layer
    for (const key in layers) {
      layers[key].gain = audioCtx.createGain();
      layers[key].gain.gain.value = 0;
      layers[key].gain.connect(musicGain);
    }
  }

  function setVolumes(musicVol, sfxVol) {
    if (!audioCtx) return;
    if (musicGain) musicGain.gain.value = musicVol;
    if (sfxGain) sfxGain.gain.value = sfxVol;
  }

  function resume() {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // ========== ACTIVITY TRACKING ==========
  function onTap() {
    const now = Date.now();
    tapTimestamps.push(now);
    tapTimestamps = tapTimestamps.filter(t => now - t < 2000);
  }

  function getTapRate() {
    const now = Date.now();
    tapTimestamps = tapTimestamps.filter(t => now - t < 2000);
    return tapTimestamps.length / 2; // taps per second
  }

  function getActivityState() {
    const rate = getTapRate();
    const s = GameState.getState();
    const combo = s.combo ? s.combo.current : 0;

    if (combo >= 50) return 'frenzy';
    if (rate >= 5) return 'active';
    if (rate >= 1) return 'light';
    return 'idle';
  }

  // ========== INTENSITY CALCULATION ==========
  function getIncomeIntensity(s) {
    // Normalized 0-1 based on income tier within phase
    const cps = s.creditsPerSecond;
    if (cps <= 0) return 0;
    const log = Math.log10(cps);
    // Normalize: phases range roughly 0-30 in log scale
    return Math.min(1, log / 30);
  }

  // ========== UPDATE (called each game tick) ==========
  function update(dt) {
    if (!audioCtx) return;
    const s = GameState.getState();
    const activity = getActivityState();
    const income = getIncomeIntensity(s);

    // Smooth intensity transition
    const targetIntensity = income;
    intensitySmooth += (targetIntensity - intensitySmooth) * dt * 0.5;

    // Layer volumes based on state
    const baseVol = 0.3;
    const melodyVol = intensitySmooth > 0.3 ? Math.min(0.25, (intensitySmooth - 0.3) * 0.5) : 0;
    const rhythmVol = intensitySmooth > 0.6 ? Math.min(0.2, (intensitySmooth - 0.6) * 0.5) : 0;

    let hypeVol = 0;
    let activityMult = 1.0;
    if (activity === 'idle') {
      activityMult = 0.6;
    } else if (activity === 'light') {
      activityMult = 0.85;
    } else if (activity === 'active') {
      activityMult = 1.0;
    } else if (activity === 'frenzy') {
      activityMult = 1.1;
      hypeVol = 0.2;
    }

    // Apply layer volumes with smooth transitions
    smoothLayerVolume('base', baseVol * activityMult, dt);
    smoothLayerVolume('melody', melodyVol * activityMult, dt);
    smoothLayerVolume('rhythm', rhythmVol * activityMult, dt);
    smoothLayerVolume('hype', hypeVol, dt);

    lastActivityState = activity;
  }

  function smoothLayerVolume(layerName, target, dt) {
    const layer = layers[layerName];
    if (!layer || !layer.gain) return;
    const current = layer.volume;
    const speed = 2.0; // fade speed
    layer.volume += (target - current) * Math.min(1, dt * speed);
    layer.gain.gain.value = layer.volume;
  }

  // ========== PHASE CHANGE ==========
  function setPhase(phase) {
    currentPhase = phase;
    // Phase change triggers music layer rebuild
    // In a full implementation, this would crossfade between phase-specific audio buffers
  }

  // ========== SOUND EFFECTS ==========
  function playTapSound(comboLevel) {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Pitch rises with combo, snappier attack
    const basePitch = 400 + Math.min(comboLevel, 100) * 8;
    const reverbAmount = Math.max(0.01, 0.1 - comboLevel * 0.001);
    osc.frequency.value = basePitch;
    osc.type = comboLevel >= 100 ? 'sawtooth' : 'sine';

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialDecayTo = 0.001;
    gain.gain.setTargetAtTime(0.001, now + 0.02, reverbAmount);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  function playPurchaseSound(genType) {
    if (!audioCtx || !sfxGain) return;
    resume();

    const config = GEN_SOUND_TYPES[genType] || GEN_SOUND_TYPES.machine;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = config.type === 'noise' ? 'sawtooth' : config.type;
    osc.frequency.value = config.freq;
    filter.type = config.filter;
    filter.frequency.value = config.freq * 2;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + config.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.attack + config.decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + config.attack + config.decay + 0.05);
  }

  function playCriticalSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    // Layered impact sound
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 200 + i * 200;
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.02);
      osc.stop(now + 0.35);
    }
  }

  function playSuperCriticalSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    // Thunderclap: burst of noise + low rumble
    for (let i = 0; i < 5; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = i < 3 ? 'sawtooth' : 'square';
      osc.frequency.value = 80 + i * 150;
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.01);
      osc.stop(now + 0.55);
    }
  }

  function playAchievementSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.45);
    });
  }

  function playMilestoneSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    // Rising chime
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  function playPrestigeSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    // Deep rumble building
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 2);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 3.1);
  }

  function playErrorSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.setValueAtTime(0, now + 0.05);
    gain.gain.setValueAtTime(0.06, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  function playEggHatchSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    // Cracking + reveal
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = 100 + i * 50;
      gain.gain.setValueAtTime(0.04 + i * 0.02, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.15);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.2);
    }
    // Reveal shimmer
    const shimmer = audioCtx.createOscillator();
    const sGain = audioCtx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.value = 880;
    sGain.gain.setValueAtTime(0, now + 0.6);
    sGain.gain.linearRampToValueAtTime(0.1, now + 0.8);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    shimmer.connect(sGain);
    sGain.connect(sfxGain);
    shimmer.start(now + 0.6);
    shimmer.stop(now + 1.6);
  }

  // ========== EVENT MUSIC ==========
  function startEventMusic() {
    // Crossfade event layer in
    if (layers.event.gain) {
      layers.event.volume = 0.2;
      layers.event.gain.gain.value = 0.2;
    }
  }

  function stopEventMusic() {
    if (layers.event.gain) {
      layers.event.volume = 0;
      layers.event.gain.gain.value = 0;
    }
  }

  return {
    init, update, setVolumes, setPhase, resume, onTap,
    playTapSound, playPurchaseSound, playCriticalSound,
    playSuperCriticalSound, playAchievementSound,
    playMilestoneSound, playPrestigeSound, playErrorSound,
    playEggHatchSound, startEventMusic, stopEventMusic,
    getActivityState, getTapRate,
    PHASE_MUSIC, AMBIENT_SOUNDS, GEN_SOUND_TYPES
  };
})();
