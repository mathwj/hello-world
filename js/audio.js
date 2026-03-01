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

  // ========== EXPANSION B: Phase Transition Stinger ==========
  function playPhaseTransitionStinger(fromPhase, toPhase) {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    const config = PHASE_MUSIC[toPhase] || PHASE_MUSIC[1];

    // Rising sweep with phase base frequency
    const sweep = audioCtx.createOscillator();
    const sweepGain = audioCtx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(config.baseFreq * 0.5, now);
    sweep.frequency.exponentialRampToValueAtTime(config.baseFreq * 4, now + 0.8);
    sweepGain.gain.setValueAtTime(0.06, now);
    sweepGain.gain.linearRampToValueAtTime(0.1, now + 0.4);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    sweep.connect(sweepGain);
    sweepGain.connect(sfxGain);
    sweep.start(now);
    sweep.stop(now + 1.3);

    // Chord hit at peak
    const notes = [1, 1.25, 1.5, 2];
    notes.forEach((mult, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = config.baseFreq * 2 * mult;
      gain.gain.setValueAtTime(0, now + 0.7);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + 0.7);
      osc.stop(now + 1.6);
    });
  }

  // ========== EXPANSION B: Prestige Sound (enhanced) ==========
  function playPrestigeBigBang() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;

    // Low rumble sweep
    const rumble = audioCtx.createOscillator();
    const rumbleGain = audioCtx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(30, now);
    rumble.frequency.linearRampToValueAtTime(60, now + 1.5);
    rumbleGain.gain.setValueAtTime(0.08, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
    rumble.connect(rumbleGain);
    rumbleGain.connect(sfxGain);
    rumble.start(now);
    rumble.stop(now + 2.1);

    // Bright explosion burst at 0.5s
    [440, 554.37, 659.25, 880, 1108.73].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = i < 2 ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + 0.5);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.55);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + i * 0.1);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + 0.5);
      osc.stop(now + 1.6 + i * 0.1);
    });

    // Rebirth chime at 1.5s
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + 1.5 + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.05, now + 1.55 + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5 + i * 0.15);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + 1.5 + i * 0.15);
      osc.stop(now + 2.6 + i * 0.15);
    });
  }

  // ========== EXPANSION B: Ambient Intensity System ==========
  let ambientInterval = null;
  function startAmbientLoop(phase) {
    if (!audioCtx || !sfxGain) return;
    stopAmbientLoop();

    const sounds = AMBIENT_SOUNDS[phase] || AMBIENT_SOUNDS[1];
    ambientInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        // Generate ambient tone based on phase
        const config = PHASE_MUSIC[phase] || PHASE_MUSIC[1];
        osc.type = 'sine';
        osc.frequency.value = config.baseFreq * (0.5 + Math.random());
        filter.type = 'lowpass';
        filter.frequency.value = 300 + Math.random() * 200;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.015, now + 1);
        gain.gain.linearRampToValueAtTime(0.015, now + 2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 4.1);
      }
    }, 5000);
  }

  function stopAmbientLoop() {
    if (ambientInterval) {
      clearInterval(ambientInterval);
      ambientInterval = null;
    }
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

  function playLaunchSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    // Deep rumble building to roar
    const rumble = audioCtx.createOscillator();
    const rGain = audioCtx.createGain();
    rumble.type = 'sawtooth';
    rumble.frequency.setValueAtTime(30, now);
    rumble.frequency.exponentialRampToValueAtTime(120, now + 1.5);
    rumble.frequency.exponentialRampToValueAtTime(300, now + 3);
    rGain.gain.setValueAtTime(0.01, now);
    rGain.gain.linearRampToValueAtTime(0.12, now + 1);
    rGain.gain.linearRampToValueAtTime(0.15, now + 2);
    rGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    rumble.connect(rGain);
    rGain.connect(sfxGain);
    rumble.start(now);
    rumble.stop(now + 3.6);
  }

  function playRadarPingSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.08, now + i * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.3 + 0.2);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.3);
      osc.stop(now + i * 0.3 + 0.25);
    }
  }

  function playAlienSignalSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    // Eerie electronic warble
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.2);
    gain.gain.setValueAtTime(0.08, now + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(gain);
    gain.connect(sfxGain);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 1.3);
    osc.stop(now + 1.3);
  }

  function playDailyRewardSound() {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    // Coin shower: rapid rising notes
    const notes = [523, 587, 659, 784, 880, 988, 1047];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.25);
    });
  }

  function playEventAlertSound(positive) {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    if (positive) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
    } else {
      osc.type = 'square';
      osc.frequency.value = 200;
    }
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
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

  // ========== EXPANSION B: Additional Sound Effects ==========

  function playContractCompleteSound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Ascending arpeggio: task done feeling
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  }

  function playCollectionUnlockSound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Shimmering resonant chord
    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.02);
      osc.stop(now + 0.7);
    });
  }

  function playChallengeStartSound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Dramatic low horn + rising sweep
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.4);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  function playChallengeCompleteSound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Triumphant fanfare
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  }

  function playMiniGameStartSound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Quick 8-bit style ascending beeps
    [330, 440, 550, 660].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.08);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.1);
    });
  }

  function playBoosterActivateSound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Power-up whoosh
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.35);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  function playComboSound(level) {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Higher pitch for higher combos
    const baseFreq = 300 + Math.min(level, 100) * 5;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = baseFreq;
    gain.gain.setValueAtTime(0.03 + Math.min(level, 50) * 0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  function playEggWarmSound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  return {
    init, update, setVolumes, setPhase, resume, onTap,
    playTapSound, playPurchaseSound, playCriticalSound,
    playSuperCriticalSound, playAchievementSound,
    playMilestoneSound, playPrestigeSound, playErrorSound,
    playEggHatchSound, playLaunchSound, playRadarPingSound,
    playAlienSignalSound, playDailyRewardSound, playEventAlertSound,
    playContractCompleteSound, playCollectionUnlockSound,
    playChallengeStartSound, playChallengeCompleteSound,
    playMiniGameStartSound, playBoosterActivateSound,
    playComboSound, playEggWarmSound,
    playPhaseTransitionStinger, playPrestigeBigBang,
    startAmbientLoop, stopAmbientLoop,
    startEventMusic, stopEventMusic,
    getActivityState, getTapRate,
    PHASE_MUSIC, AMBIENT_SOUNDS, GEN_SOUND_TYPES
  };
})();
