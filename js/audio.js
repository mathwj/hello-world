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
    const prevPhase = currentPhase;
    currentPhase = phase;

    // Crossfade ambient to new phase
    if (prevPhase !== phase) {
      stopAmbientLoop();
      // Fade out all layers briefly before rebuilding
      for (const key in layers) {
        if (layers[key].gain) {
          const g = layers[key].gain;
          g.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
          layers[key].volume = 0;
        }
      }
      // After fade, restart ambient for new phase
      setTimeout(() => startAmbientLoop(phase), 400);
    }
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
  let ambientDroneNodes = [];

  // Phase-specific ambient textures — each phase has a unique sonic character
  const AMBIENT_TEXTURES = {
    1: { drone: 'sine', droneFreq: 55, filterType: 'lowpass', filterFreq: 200, lfoRate: 0.1, character: 'warm', detune: 5 },
    2: { drone: 'triangle', droneFreq: 65, filterType: 'bandpass', filterFreq: 400, lfoRate: 0.3, character: 'hollow', detune: 8 },
    3: { drone: 'sine', droneFreq: 73, filterType: 'lowpass', filterFreq: 250, lfoRate: 0.15, character: 'muffled', detune: 3 },
    4: { drone: 'sawtooth', droneFreq: 82, filterType: 'lowpass', filterFreq: 180, lfoRate: 0.2, character: 'dusty', detune: 10 },
    5: { drone: 'triangle', droneFreq: 98, filterType: 'bandpass', filterFreq: 600, lfoRate: 0.5, character: 'metallic', detune: 12 },
    6: { drone: 'sawtooth', droneFreq: 55, filterType: 'lowpass', filterFreq: 150, lfoRate: 0.08, character: 'rumbling', detune: 15 },
    7: { drone: 'sine', droneFreq: 130, filterType: 'highpass', filterFreq: 800, lfoRate: 0.4, character: 'ethereal', detune: 6 },
    8: { drone: 'triangle', droneFreq: 146, filterType: 'bandpass', filterFreq: 1000, lfoRate: 0.7, character: 'cosmic', detune: 20 },
    9: { drone: 'sawtooth', droneFreq: 164, filterType: 'highpass', filterFreq: 1200, lfoRate: 1.2, character: 'glitchy', detune: 30 }
  };

  function startAmbientLoop(phase) {
    if (!audioCtx || !sfxGain) return;
    stopAmbientLoop();
    resume();

    const config = PHASE_MUSIC[phase] || PHASE_MUSIC[1];
    const texture = AMBIENT_TEXTURES[phase] || AMBIENT_TEXTURES[1];
    const now = audioCtx.currentTime;

    // === Layer 1: Continuous low drone ===
    const drone = audioCtx.createOscillator();
    const droneGain = audioCtx.createGain();
    const droneFilter = audioCtx.createBiquadFilter();
    drone.type = texture.drone;
    drone.frequency.value = texture.droneFreq;
    drone.detune.value = texture.detune;
    droneFilter.type = texture.filterType;
    droneFilter.frequency.value = texture.filterFreq;
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.012, now + 2); // slow fade in
    drone.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(musicGain);
    drone.start(now);
    ambientDroneNodes.push({ osc: drone, gain: droneGain, filter: droneFilter });

    // === Layer 2: LFO-modulated texture oscillator ===
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    const texOsc = audioCtx.createOscillator();
    const texGain = audioCtx.createGain();
    const texFilter = audioCtx.createBiquadFilter();
    lfo.type = 'sine';
    lfo.frequency.value = texture.lfoRate;
    lfoGain.gain.value = texture.droneFreq * 0.15;
    lfo.connect(lfoGain);
    lfoGain.connect(texOsc.frequency);
    texOsc.type = 'sine';
    texOsc.frequency.value = texture.droneFreq * 2;
    texFilter.type = 'lowpass';
    texFilter.frequency.value = texture.filterFreq * 0.8;
    texGain.gain.setValueAtTime(0, now);
    texGain.gain.linearRampToValueAtTime(0.006, now + 3);
    texOsc.connect(texFilter);
    texFilter.connect(texGain);
    texGain.connect(musicGain);
    lfo.start(now);
    texOsc.start(now);
    ambientDroneNodes.push(
      { osc: lfo, gain: lfoGain },
      { osc: texOsc, gain: texGain, filter: texFilter }
    );

    // === Layer 3: Periodic stochastic ambient events ===
    const sounds = AMBIENT_SOUNDS[phase] || AMBIENT_SOUNDS[1];
    ambientInterval = setInterval(() => {
      if (Math.random() < 0.35) {
        _playAmbientEvent(phase, config, texture, sounds);
      }
    }, 4000 + Math.random() * 3000);
  }

  function _playAmbientEvent(phase, config, texture, sounds) {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;

    // Pick a random ambient character for this event
    const variation = Math.random();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    if (variation < 0.4) {
      // Tonal ambient — long pad note derived from phase scale
      osc.type = 'sine';
      const scaleMultipliers = {
        minor: [1, 1.125, 1.2, 1.333, 1.5, 1.6, 1.8],
        pentatonic: [1, 1.125, 1.25, 1.5, 1.667],
        dorian: [1, 1.125, 1.2, 1.333, 1.5, 1.6875, 1.8],
        mixolydian: [1, 1.125, 1.25, 1.333, 1.5, 1.6875, 1.8],
        phrygian: [1, 1.067, 1.2, 1.333, 1.5, 1.6, 1.8],
        lydian: [1, 1.125, 1.25, 1.406, 1.5, 1.6875, 1.875],
        chromatic: [1, 1.06, 1.12, 1.19, 1.26, 1.33, 1.41],
        wholetone: [1, 1.12, 1.26, 1.41, 1.59, 1.78]
      };
      const scale = scaleMultipliers[config.scale] || scaleMultipliers.minor;
      const mult = scale[Math.floor(Math.random() * scale.length)];
      const octave = Math.random() < 0.3 ? 2 : 1;
      osc.frequency.value = config.baseFreq * mult * octave;
      filter.type = 'lowpass';
      filter.frequency.value = 400 + Math.random() * 300;

      const dur = 3 + Math.random() * 4;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.01, now + dur * 0.3);
      gain.gain.linearRampToValueAtTime(0.01, now + dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);
      osc.start(now);
      osc.stop(now + dur + 0.1);

    } else if (variation < 0.7) {
      // Percussive ambient — short burst with resonant filter (metallic/organic based on phase)
      osc.type = phase >= 5 ? 'sawtooth' : 'triangle';
      osc.frequency.value = config.baseFreq * (1 + Math.random() * 3);
      filter.type = 'bandpass';
      filter.frequency.value = 200 + Math.random() * 800;
      filter.Q.value = 5 + Math.random() * 10;
      gain.gain.setValueAtTime(0.008, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + Math.random() * 0.3);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);
      osc.start(now);
      osc.stop(now + 0.8);

    } else {
      // Textural ambient — detuned pair for beating effect
      osc.type = 'sine';
      const freq = config.baseFreq * (0.5 + Math.random() * 1.5);
      osc.frequency.value = freq;
      const osc2 = audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq + 1 + Math.random() * 3; // slight detune = beating
      const gain2 = audioCtx.createGain();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      const dur = 4 + Math.random() * 4;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.008, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.006, now + 1.5);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(musicGain);
      osc2.connect(gain2);
      gain2.connect(musicGain);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + dur + 0.1);
      osc2.stop(now + dur + 0.1);
    }
  }

  function stopAmbientLoop() {
    if (ambientInterval) {
      clearInterval(ambientInterval);
      ambientInterval = null;
    }
    // Fade out drone nodes
    if (audioCtx) {
      const now = audioCtx.currentTime;
      for (const node of ambientDroneNodes) {
        try {
          if (node.gain && node.gain.gain) {
            node.gain.gain.setTargetAtTime(0, now, 0.2);
          }
          if (node.osc) {
            node.osc.stop(now + 1);
          }
        } catch (e) { /* node already stopped */ }
      }
    }
    ambientDroneNodes = [];
  }

  // ========== SOUND EFFECTS ==========
  function playTapSound(comboLevel) {
    if (!audioCtx || !sfxGain) return;
    resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Pitch rises with combo, snappier attack
    // Per spec: "pitch varies ±5% randomly for variety"
    const pitchVariation = 1 + (Math.random() * 0.10 - 0.05); // ±5%
    const basePitch = (400 + Math.min(comboLevel, 100) * 8) * pitchVariation;
    const reverbAmount = Math.max(0.01, 0.1 - comboLevel * 0.001);
    osc.frequency.value = basePitch;
    osc.type = comboLevel >= 100 ? 'sawtooth' : 'sine';

    // Volume also slightly varies for organic feel
    const volumeVariation = 0.12 + Math.random() * 0.06; // 0.12 to 0.18
    gain.gain.setValueAtTime(volumeVariation, now);
    gain.gain.setTargetAtTime(0.001, now + 0.02, reverbAmount);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Auto-detect generator sound type from name/description
  function getGenSoundType(genId) {
    if (!genId) return 'machine';
    // Try to find generator data
    let gen = null;
    if (typeof Engine !== 'undefined' && Engine.findGenerator) {
      gen = Engine.findGenerator(genId);
    }
    if (!gen) return 'machine';
    const n = (gen.name + ' ' + gen.desc).toLowerCase();
    if (n.includes('kid') || n.includes('scavenger') || n.includes('team') || n.includes('negotiator') ||
        n.includes('crew') || n.includes('academy') || n.includes('astronaut') || n.includes('tourist'))
      return 'worker';
    if (n.includes('ship') || n.includes('shuttle') || n.includes('probe') || n.includes('tug') ||
        n.includes('freighter') || n.includes('destroyer') || n.includes('capital') || n.includes('harvester') ||
        n.includes('barge') || n.includes('frigate') || n.includes('sail'))
      return 'ship';
    if (n.includes('base') || n.includes('station') || n.includes('hub') || n.includes('dome') ||
        n.includes('habitat') || n.includes('outpost') || n.includes('city') || n.includes('hotel') ||
        n.includes('colony') || n.includes('complex') || n.includes('citadel') || n.includes('ring'))
      return 'building';
    if (n.includes('ai') || n.includes('quantum') || n.includes('singularity') || n.includes('dyson') ||
        n.includes('warp') || n.includes('fusion') || n.includes('antimatter') || n.includes('nano') ||
        n.includes('world mind') || n.includes('dimensional'))
      return 'hightech';
    if (n.includes('alien') || n.includes('signal') || n.includes('decoder') || n.includes('ansible') ||
        n.includes('reality') || n.includes('anomaly'))
      return 'alien';
    return 'machine'; // drills, factories, refineries, etc.
  }

  function playPurchaseSound(genTypeOrId, genCount) {
    if (!audioCtx || !sfxGain) return;
    resume();

    // Accept either a direct type key or a generator ID for auto-detection
    let soundType = genTypeOrId;
    if (!GEN_SOUND_TYPES[genTypeOrId]) {
      soundType = getGenSoundType(genTypeOrId);
    }
    const config = GEN_SOUND_TYPES[soundType] || GEN_SOUND_TYPES.machine;
    const now = audioCtx.currentTime;
    const count = genCount || 1;

    // Scale pitch and richness with owned count — your 100th sounds grander than your 1st
    const countTier = Math.floor(Math.min(count, 200) / 25); // 0-8
    const pitchMult = 1 + countTier * 0.08; // subtle pitch rise
    const volumeBoost = Math.min(0.04, countTier * 0.005); // slightly louder at milestones

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = config.type === 'noise' ? 'sawtooth' : config.type;
    osc.frequency.value = config.freq * pitchMult;
    filter.type = config.filter;
    filter.frequency.value = config.freq * 2 * pitchMult;
    filter.Q.value = 1 + countTier * 0.5; // more resonant at higher counts

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12 + volumeBoost, now + config.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.attack + config.decay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + config.attack + config.decay + 0.05);

    // At milestone counts (25, 50, 100, 200), add a harmonic overtone
    if (count > 0 && count % 25 === 0) {
      const overtone = audioCtx.createOscillator();
      const oGain = audioCtx.createGain();
      overtone.type = 'sine';
      overtone.frequency.value = config.freq * pitchMult * 2; // octave above
      oGain.gain.setValueAtTime(0.04, now + config.attack * 0.5);
      oGain.gain.exponentialRampToValueAtTime(0.001, now + config.attack + config.decay * 1.5);
      overtone.connect(oGain);
      oGain.connect(sfxGain);
      overtone.start(now + config.attack * 0.3);
      overtone.stop(now + config.attack + config.decay * 1.5 + 0.05);
    }
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

    // Combo sound escalation: sound changes every 10 levels
    // Pitch rises, reverb decreases, attack gets snappier
    const tier = Math.floor(Math.min(level, 100) / 10); // 0-10
    const baseFreq = 300 + Math.min(level, 100) * 5;
    const reverbTime = Math.max(0.02, 0.12 - tier * 0.01);
    const attackTime = Math.max(0.005, 0.03 - tier * 0.002);
    const volume = 0.03 + Math.min(level, 80) * 0.001;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // At x100, tap sounds like a thunderclap
    if (level >= 100) {
      osc.type = 'sawtooth';
      // Layer a second oscillator for depth
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'square';
      osc2.frequency.value = baseFreq * 0.5;
      gain2.gain.setValueAtTime(volume * 0.6, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc2.connect(gain2);
      gain2.connect(sfxGain);
      osc2.start(now);
      osc2.stop(now + 0.18);
    } else if (tier >= 5) {
      osc.type = 'triangle';
    } else {
      osc.type = 'sine';
    }

    osc.frequency.value = baseFreq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + reverbTime);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + attackTime + reverbTime + 0.02);
  }

  // Suffix milestone chime: plays when currency crosses K, M, B, T etc.
  function playSuffixChime(suffixIndex) {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Higher suffix = higher pitched and more harmonic
    const baseNote = 523.25 + suffixIndex * 80; // C5 + escalating
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = baseNote;
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
    // Add harmonic overtone
    if (suffixIndex >= 3) {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = baseNote * 1.5;
      gain2.gain.setValueAtTime(0.02, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc2.connect(gain2);
      gain2.connect(sfxGain);
      osc2.start(now + 0.02);
      osc2.stop(now + 0.25);
    }
  }

  function playGoldenRushSound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Shimmering golden cascade — quick ascending arpeggiated thirds
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.5];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.05 - i * 0.005, now + i * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.4);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.45);
    });
    // Sustain pad underneath
    const pad = audioCtx.createOscillator();
    const padGain = audioCtx.createGain();
    pad.type = 'sine';
    pad.frequency.value = 220;
    padGain.gain.setValueAtTime(0, now);
    padGain.gain.linearRampToValueAtTime(0.03, now + 0.15);
    padGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    pad.connect(padGain);
    padGain.connect(sfxGain);
    pad.start(now);
    pad.stop(now + 0.85);
  }

  function playSynergySound() {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    // Two-tone resonant ping — represents two generators linking
    const freqs = [523.25, 783.99]; // perfect fifth
    freqs.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = freq;
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 8;
      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.06, now + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.55);
    });
    // Brief shimmer after the ping
    const shimmer = audioCtx.createOscillator();
    const sGain = audioCtx.createGain();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 1200;
    shimmer.frequency.linearRampToValueAtTime(1800, audioCtx.currentTime + 0.35);
    sGain.gain.setValueAtTime(0, now + 0.12);
    sGain.gain.linearRampToValueAtTime(0.015, now + 0.16);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    shimmer.connect(sGain);
    sGain.connect(sfxGain);
    shimmer.start(now + 0.12);
    shimmer.stop(now + 0.45);
  }

  function playWeatherTransitionSound(weatherId) {
    if (!audioCtx || !sfxGain) return;
    resume();
    const now = audioCtx.currentTime;
    const weatherSounds = {
      rain: { freq: 300, type: 'sawtooth', filter: 'lowpass', filterFreq: 400, dur: 0.8 },
      snow: { freq: 800, type: 'sine', filter: 'highpass', filterFreq: 600, dur: 1.0 },
      lightning: { freq: 80, type: 'sawtooth', filter: 'lowpass', filterFreq: 200, dur: 0.3 },
      dust_storm: { freq: 120, type: 'sawtooth', filter: 'bandpass', filterFreq: 250, dur: 1.2 },
      aurora: { freq: 440, type: 'sine', filter: 'bandpass', filterFreq: 800, dur: 1.5 },
      meteor_shower: { freq: 600, type: 'triangle', filter: 'highpass', filterFreq: 400, dur: 0.6 },
      golden_hour: { freq: 350, type: 'triangle', filter: 'lowpass', filterFreq: 500, dur: 1.0 },
      default: { freq: 200, type: 'sine', filter: 'lowpass', filterFreq: 300, dur: 0.5 }
    };
    const w = weatherSounds[weatherId] || weatherSounds.default;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    osc.type = w.type;
    osc.frequency.value = w.freq;
    filter.type = w.filter;
    filter.frequency.value = w.filterFreq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + w.dur * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + w.dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + w.dur + 0.05);
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
    playComboSound, playEggWarmSound, playSuffixChime,
    playGoldenRushSound, playSynergySound, playWeatherTransitionSound,
    playPhaseTransitionStinger, playPrestigeBigBang,
    startAmbientLoop, stopAmbientLoop,
    startEventMusic, stopEventMusic,
    getActivityState, getTapRate, getGenSoundType,
    PHASE_MUSIC, AMBIENT_SOUNDS, AMBIENT_TEXTURES, GEN_SOUND_TYPES
  };
})();
