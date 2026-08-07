/* ─────────────────────────────────────────────────────────────
   officer.js — the puppet.
   Owns everything that moves: breathing is CSS, but blinking,
   gaze, mouth shapes and the stamp are driven from here.
   ───────────────────────────────────────────────────────────── */

const Officer = (() => {

  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // mouth anchor, in viewBox units
  const MX = 200, MY = 118;

  const MOODS = {
    neutral:    { curve:  0.15, rest: 0.00 },
    friendly:   { curve:  0.60, rest: 0.02 },
    suspicious: { curve: -0.40, rest: 0.00 },
    stern:      { curve: -0.15, rest: 0.00 }
  };

  const el = {};
  const state = {
    mood: 'neutral',
    open: 0, openTarget: 0,     // jaw
    wide: 0, wideTarget: 0,     // lip spread
    gx: 0, gy: 0,               // current gaze, -1..1
    tgx: 0, tgy: 0,             // gaze target
    speaking: false,
    pointerAt: 0,
    nextIdleGaze: 0,
    nextBlink: 0
  };

  /* ── mouth geometry ──────────────────────────────────────── */

  // A lens shape: two quadratics between the mouth corners.
  // `open` drives the gap, `wide` stretches it, `curve` lifts the corners.
  function mouthPath(open, wide, curve) {
    const w = 10.6 + wide * 3.6;
    const h = Math.max(open * 9.5, 0.7);
    const c = curve * 3.6;
    const lx = MX - w, rx = MX + w, cy = MY - c;
    const upper = MY - h * 0.55;
    const lower = MY + h * 0.55 + 1.7;
    return `M ${lx} ${cy} Q ${MX} ${upper} ${rx} ${cy} Q ${MX} ${lower} ${lx} ${cy} Z`;
  }

  // Rough visemes. Not phonetics — just enough variation that the
  // face reads as talking instead of flapping.
  function visemeFor(ch) {
    const c = ch.toLowerCase();
    if ('aáà'.includes(c))            return { open: 0.95, wide: 0.55 };
    if ('oôu'.includes(c))            return { open: 0.80, wide: 0.00 };
    if ('eéi'.includes(c))            return { open: 0.55, wide: 0.90 };
    if ('yw'.includes(c))             return { open: 0.45, wide: 0.30 };
    if ('mbp'.includes(c))            return { open: 0.05, wide: 0.35 };
    if ('fv'.includes(c))             return { open: 0.18, wide: 0.55 };
    if ('szc'.includes(c))            return { open: 0.22, wide: 0.75 };
    if (' \n\t'.includes(c))          return { open: 0.06, wide: 0.15 };
    if ('.,!?;:—'.includes(c))        return { open: 0.02, wide: 0.10 };
    return { open: 0.42, wide: 0.45 };
  }

  /* ── frame loop ──────────────────────────────────────────── */

  function tick(now) {
    // gaze: follow the pointer when it is fresh, otherwise drift
    if (now - state.pointerAt > 2600 && now > state.nextIdleGaze) {
      state.tgx = (Math.random() * 2 - 1) * 0.55;
      state.tgy = (Math.random() * 2 - 1) * 0.35;
      state.nextIdleGaze = now + 1800 + Math.random() * 3200;
    }

    const ease = 0.07;
    state.gx += (state.tgx - state.gx) * ease;
    state.gy += (state.tgy - state.gy) * ease;

    el.headLook.style.transform =
      `translate(${state.gx * 2.2}px, ${state.gy * 1.4}px) rotate(${state.gx * 2.4}deg)`;
    el.pupils.forEach(p => {
      p.style.transform = `translate(${state.gx * 1.9}px, ${state.gy * 1.3}px)`;
    });

    // jaw: chase the current viseme, with a little tremor while voiced
    const snap = state.speaking ? 0.34 : 0.16;
    state.open += (state.openTarget - state.open) * snap;
    state.wide += (state.wideTarget - state.wide) * snap;

    const mood = MOODS[state.mood] || MOODS.neutral;
    const jitter = state.speaking ? (Math.random() - 0.5) * 0.06 : 0;
    el.mouth.setAttribute('d',
      mouthPath(Math.max(0, state.open + jitter + mood.rest), state.wide, mood.curve));

    // blink: mostly singles, sometimes a quick double
    if (now > state.nextBlink) {
      blink();
      state.nextBlink = now + (Math.random() < 0.18 ? 260 : 2200 + Math.random() * 4200);
    }

    requestAnimationFrame(tick);
  }

  function blink() {
    el.officer.classList.add('blink');
    setTimeout(() => el.officer.classList.remove('blink'), 95);
  }

  /* ── public API ──────────────────────────────────────────── */

  function init() {
    el.officer  = document.getElementById('officer');
    el.headLook = document.getElementById('head-look');
    el.mouth    = document.getElementById('mouth');
    el.pupils   = [...document.querySelectorAll('.pupil-rig')];
    el.arm      = document.getElementById('stamp-arm');
    el.stamp    = document.getElementById('stamp-mark');
    el.counter  = document.getElementById('counter');
    el.stage    = document.getElementById('stage');

    el.stage.addEventListener('pointermove', e => {
      const r = el.stage.getBoundingClientRect();
      state.tgx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width  - 0.5) * 2));
      state.tgy = Math.max(-1, Math.min(1, ((e.clientY - r.top)  / r.height - 0.42) * 2));
      state.pointerAt = performance.now();
    });

    setMood('neutral');
    requestAnimationFrame(tick);
  }

  function setMood(name) {
    state.mood = MOODS[name] ? name : 'neutral';
    el.officer.classList.remove('mood-neutral', 'mood-friendly', 'mood-suspicious', 'mood-stern');
    el.officer.classList.add('mood-' + state.mood);
  }

  function lookAt(where) {
    if (where === 'passport') { state.tgx = 0.7; state.tgy = 0.85; }
    else                      { state.tgx = 0;   state.tgy = 0;    }
    state.pointerAt = performance.now();   // hold it for a beat
  }

  /* ── mouth control, for whoever is doing the talking ─────── */

  function beginSpeech() { state.speaking = true; }

  function shape(ch) {
    const v = visemeFor(ch);
    state.openTarget = v.open;
    state.wideTarget = v.wide;
  }

  function endSpeech() {
    state.speaking = false;
    state.openTarget = 0;
    state.wideTarget = 0;
  }

  // Types `text` out, moving the mouth in step with it. Used when the
  // officer has no voice — with speech synthesis, voice.js drives the
  // same three functions from the utterance instead.
  // `onChar` receives the text so far so the caller can render a bubble.
  function speak(text, onChar) {
    return new Promise(resolve => {
      beginSpeech();
      let i = 0;

      const step = () => {
        if (i >= text.length) {
          endSpeech();
          return resolve();
        }

        const ch = text[i++];
        shape(ch);
        onChar(text.slice(0, i));

        let delay = REDUCED ? 4 : 26 + Math.random() * 18;
        if (',;:'.includes(ch)) delay += REDUCED ? 20 : 190;
        if ('.!?'.includes(ch)) delay += REDUCED ? 30 : 330;
        setTimeout(step, delay);
      };

      step();
    });
  }

  function pause(ms) {
    return new Promise(r => setTimeout(r, REDUCED ? Math.min(ms, 120) : ms));
  }

  // Reaches for the stamp, brings it down, leaves a mark.
  async function stamp(approved) {
    lookAt('passport');
    el.stamp.classList.toggle('denied', !approved);
    el.stamp.querySelector('text').textContent = approved ? 'CLEARED' : 'HOLD';

    el.arm.classList.remove('stamping');
    void el.arm.offsetWidth;               // restart the animation
    el.arm.classList.add('stamping');

    await pause(830);                      // impact
    el.counter.classList.add('jolt');
    el.stamp.classList.add('on');
    setTimeout(() => el.counter.classList.remove('jolt'), 240);

    await pause(900);
    lookAt('traveler');
  }

  function reset() {
    el.stamp.classList.remove('on', 'denied');
    el.arm.classList.remove('stamping');
    setMood('neutral');
    lookAt('traveler');
  }

  return { init, speak, beginSpeech, shape, endSpeech,
           pause, setMood, lookAt, stamp, reset, blink, REDUCED };
})();
