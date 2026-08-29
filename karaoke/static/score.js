/* The score screen and its drum roll.
   Lives on the stage screen: the audience is who the reveal is for. Loaded
   before stage.js, which calls showScore() when a song finishes. */

const $ = (sel) => document.querySelector(sel);

const scoreState = { frame: null, roll: null };

/* ---------- score screen ---------- */

/* Bands are read top-down: the first whose minimum the score clears wins.
   The room reads these, so they are in Brazilian Portuguese — phrased the way
   someone would actually say it, and kept clear of gendered adjectives, since
   whoever is holding the microphone could be anyone. */
const SCORE_BANDS = [
  { min: 95, band: "legend", rank: "Lendário. Chama a gravadora." },
  { min: 85, band: "great",  rank: "Arrasou!" },
  { min: 70, band: "great",  rank: "A plateia amou." },
  { min: 50, band: "ok",     rank: "Nada mal." },
  { min: 30, band: "rough",  rank: "A plateia tá sendo educada." },
  { min: 0,  band: "rough",  rank: "Que coragem. Muita coragem." },
];

const SCORE_ROLL_SECONDS = 5;

function bandFor(score) {
  return SCORE_BANDS.find((entry) => score >= entry.min);
}

function randomScore() {
  return Math.floor(Math.random() * 101); // 0–100 inclusive
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- drum roll ----------
   Synthesised with the Web Audio API rather than shipped as an audio file, so
   there is nothing to download and nothing to license. Everything is scheduled
   on the audio clock up front, which is what lets the reveal land exactly on
   the final snare instead of drifting a frame or two away from it. */

let audioContext = null;
let noiseBuffer = null;

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) {
    try {
      audioContext = new Ctx();
    } catch (error) {
      return null;
    }
  }
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function getNoise(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const frames = Math.floor(ctx.sampleRate * 1.3);
  noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/* One snare stroke: a band-passed noise crack plus a short tonal body.
   Used for the accent only — putting a pitched body on every stroke of a roll
   makes it sound like a motor rather than a drum. */
function snareHit(ctx, out, at, level, decay, tone = 190) {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoise(ctx);
  noise.playbackRate.value = 0.85 + Math.random() * 0.3;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2400;
  band.Q.value = 0.5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(level, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  noise.connect(band);
  band.connect(gain);
  gain.connect(out);
  noise.start(at);
  noise.stop(at + decay + 0.02);

  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(tone, at);
  body.frequency.exponentialRampToValueAtTime(tone * 0.5, at + decay);
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(level * 0.3, at);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, at + decay * 0.9);
  body.connect(bodyGain);
  bodyGain.connect(out);
  body.start(at);
  body.stop(at + decay + 0.02);

  return [noise, body];
}

/* The finish: a hard accented snare plus a cymbal-ish wash under it. */
function accentHit(ctx, out, at) {
  const sources = snareHit(ctx, out, at, 0.98, 0.4, 240);

  const wash = ctx.createBufferSource();
  wash.buffer = getNoise(ctx);
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 5000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.55, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
  wash.connect(high);
  high.connect(gain);
  gain.connect(out);
  wash.start(at);
  wash.stop(at + 1.15);

  sources.push(wash);
  return sources;
}

/* The roll itself, rendered a sample at a time into one buffer.
   A press roll is not a sequence of separate taps — it is a continuous sizzle
   with strokes riding on top of it. So this lays down a noise bed that swells,
   then adds double-stroked bounces over it at an accelerating rate. Scheduling
   discrete hits instead leaves audible gaps between them, which is what made
   the first attempt tick like a woodblock. */
let rollBuffer = null;

//: Peak amplitude of the roll. The accent is scheduled well above it.
const ROLL_CEILING = 0.5;

function buildRollBuffer(ctx, seconds) {
  if (rollBuffer && rollBuffer.sampleRate === ctx.sampleRate && rollBuffer.duration >= seconds) {
    return rollBuffer;
  }
  const rate = ctx.sampleRate;
  const frames = Math.ceil(rate * seconds);
  const buffer = ctx.createBuffer(1, frames, rate);
  const data = buffer.getChannelData(0);

  // The bed: never silent, and louder as the roll builds.
  for (let i = 0; i < frames; i += 1) {
    const progress = i / frames;
    const bed = 0.06 + 0.26 * progress * progress;
    data[i] = (Math.random() * 2 - 1) * bed;
  }

  // Strokes, each with the bounce that turns a tap into a buzz.
  const strokes = [];
  let at = 0;
  while (at < seconds) {
    const progress = at / seconds;
    const perSecond = 13 + 25 * Math.pow(progress, 1.5);
    strokes.push(at);
    strokes.push(at + (0.55 + Math.random() * 0.2) / perSecond);
    at += 1 / perSecond;
  }

  for (const stroke of strokes) {
    const progress = Math.min(1, stroke / seconds);
    const level = 0.22 + 0.42 * progress;
    const decayFrames = Math.floor(0.032 * rate);
    const start = Math.floor(stroke * rate);
    for (let i = 0; i < decayFrames && start + i < frames; i += 1) {
      const envelope = Math.exp((-5 * i) / decayFrames);
      data[start + i] += (Math.random() * 2 - 1) * level * envelope;
    }
  }

  // Swell, then soft-clip so the peaks stay musical.
  let loudest = 0;
  for (let i = 0; i < frames; i += 1) {
    data[i] = Math.tanh(data[i] * (0.6 + 0.75 * (i / frames)) * 1.6);
    loudest = Math.max(loudest, Math.abs(data[i]));
  }
  // Normalise to a fixed ceiling. The roll builds tension; the accent is the
  // payoff, so the roll must stay clearly under it however the shaping above
  // is tuned. Without this the clipped roll peaked louder than the final hit.
  if (loudest > 0) {
    const ceiling = ROLL_CEILING / loudest;
    for (let i = 0; i < frames; i += 1) data[i] *= ceiling;
  }

  // Duck the last few milliseconds to nothing. That sliver of near-silence is
  // what makes the accent land like a payoff instead of merely continuing the
  // noise — the ear reads impact from the jump, not from absolute level.
  const duck = Math.floor(0.05 * rate);
  for (let i = 0; i < duck; i += 1) {
    const index = frames - duck + i;
    if (index >= 0) data[index] *= Math.pow(1 - i / duck, 1.7);
  }

  rollBuffer = buffer;
  return buffer;
}

/* Schedules the roll and its accent on any context — including an offline one,
   which is how this gets rendered and checked without a speaker. */
function scheduleRoll(ctx, out, startAt, seconds) {
  const source = ctx.createBufferSource();
  source.buffer = buildRollBuffer(ctx, seconds);

  // Shape it like a snare: no rumble underneath, presence in the middle, and
  // the very top rolled off so the noise does not hiss.
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 220;
  const presence = ctx.createBiquadFilter();
  presence.type = "peaking";
  presence.frequency.value = 3200;
  presence.Q.value = 0.8;
  presence.gain.value = 5;
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 9000;

  source.connect(high);
  high.connect(presence);
  presence.connect(low);
  low.connect(out);
  source.start(startAt);
  source.stop(startAt + seconds);

  return [source, ...accentHit(ctx, out, startAt + seconds)];
}

/* Strokes accelerate and swell, and the accent lands exactly on `seconds`. */
function playDrumRoll(seconds) {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(ctx.destination);

  const startAt = ctx.currentTime + 0.06; // a little lead so nothing clips
  const sources = scheduleRoll(ctx, out, startAt, seconds);

  return { ctx, out, sources, startAt, revealAt: startAt + seconds };
}

function stopDrumRoll() {
  const roll = scoreState.roll;
  if (!roll) return;
  scoreState.roll = null;
  const now = roll.ctx.currentTime;
  roll.out.gain.cancelScheduledValues(now);
  roll.out.gain.setValueAtTime(roll.out.gain.value, now);
  roll.out.gain.linearRampToValueAtTime(0, now + 0.08);
  for (const source of roll.sources) {
    try {
      source.stop(now + 0.09);
    } catch (error) {
      /* already finished */
    }
  }
}

/* ---------- the roll itself ---------- */

function rollScore(finalScore, onSettled) {
  const el = $("#score-number");
  const roll = scoreState.roll;
  // Follow the audio clock so the digits land with the snare, not near it.
  const followAudio = Boolean(roll) && roll.ctx.state === "running";
  const startedAt = performance.now();
  let lastTick = 0;
  let gap = 40;

  function frame(now) {
    const wall = (now - startedAt) / (SCORE_ROLL_SECONDS * 1000);
    let progress = followAudio
      ? (roll.ctx.currentTime - roll.startAt) / SCORE_ROLL_SECONDS
      : wall;
    // Watchdog: if the audio clock never advances, do not hang on 0 forever.
    if (followAudio && wall > 1.3) progress = 1;
    progress = Math.max(0, Math.min(1, progress));

    if (progress >= 1) {
      el.textContent = finalScore;
      onSettled();
      return;
    }
    if (now - lastTick >= gap) {
      lastTick = now;
      // Ticks get slower and the guesses close in, so it visibly settles.
      gap = 40 + 260 * Math.pow(progress, 3);
      let guess;
      if (progress < 0.7) {
        // Spin the whole range first. Converging from the start clamps against
        // 0 and 100 and would show the same digits over and over.
        guess = Math.floor(Math.random() * 101);
      } else {
        const closing = (progress - 0.7) / 0.3;
        const spread = Math.max(1, Math.round(45 * (1 - closing)));
        guess = finalScore + Math.round((Math.random() * 2 - 1) * spread);
      }
      el.textContent = Math.max(0, Math.min(100, guess));
    }
    scoreState.frame = requestAnimationFrame(frame);
  }
  scoreState.frame = requestAnimationFrame(frame);
}

function showScore(onRevealed) {
  const score = randomScore();
  const { band, rank } = bandFor(score);
  const panel = $("#score");

  panel.dataset.band = band;
  panel.classList.remove("is-final");
  $("#score-rank").textContent = "";
  $("#score-number").textContent = "0";
  panel.hidden = false;

  const settle = () => {
    $("#score-rank").textContent = rank;
    panel.classList.add("is-final");
    if (onRevealed) onRevealed(score, rank);
  };

  if (prefersReducedMotion()) {
    // No spinning, but the reveal still deserves its hit.
    $("#score-number").textContent = score;
    const ctx = getAudioContext();
    if (ctx) {
      const out = ctx.createGain();
      out.gain.value = 0.9;
      out.connect(ctx.destination);
      accentHit(ctx, out, ctx.currentTime + 0.05);
    }
    settle();
    return;
  }

  scoreState.roll = playDrumRoll(SCORE_ROLL_SECONDS);
  rollScore(score, settle);
}

function hideScore() {
  if (scoreState.frame) cancelAnimationFrame(scoreState.frame);
  scoreState.frame = null;
  stopDrumRoll();
  $("#score").hidden = true;
  $("#score").classList.remove("is-final");
}
