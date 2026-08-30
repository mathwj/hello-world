/* Plays synthetic music to the script the operator injects into the music page.

   That script can only be exercised by running it: it reads Web Audio
   analysers inside another page, and nothing about it is reachable from Python.
   So this builds a fake audio graph whose analysers return spectra we chose —
   a kick, a snare, a hi-hat, a held chord, a chord change — drives the real
   script over it, and prints what it reported as JSON for the test to check.

   Usage: <node|bun|deno> tests/fake_music.js /path/to/app.js
*/
const fs = require("fs");

const src = fs.readFileSync(process.argv[2], "utf8");

/* The text of a template literal, taken without evaluating anything inside. */
const literal = (name) => {
  const start = src.indexOf(`const ${name} = \``);
  const open = src.indexOf("`", start);
  let end = open + 1;
  for (; end < src.length; end += 1) {
    if (src[end] === "\\") { end += 1; continue; }
    if (src[end] === "`") break;
  }
  return src.slice(open + 1, end);
};

const BANDS = eval(/const BANDS = (\[[\s\S]*?\n\]);/.exec(src)[1]);
const TEMPO_WEIGHT = eval(`(${/const TEMPO_WEIGHT = (\{[\s\S]*?\n\});/.exec(src)[1]})`);
const SCRIPT = literal("BEAT_SCRIPT")
  .replace("${ENSURE_CHAIN}", literal("ENSURE_CHAIN"))
  .replace("${JSON.stringify(BANDS)}", JSON.stringify(BANDS))
  .replace("${JSON.stringify(TEMPO_WEIGHT)}", JSON.stringify(TEMPO_WEIGHT))
  .replace(/\$\{OPEN\.frequency\}/g, "22000");

// ---- a synthetic room ------------------------------------------------------
const RATE = 48000;
let clock = 0;
let scene = { notes: [], hits: [] };

/* Fills an analyser's byte spectrum from whatever is currently playing: held
   notes with the harmonics any real instrument has, and drum hits as bands of
   noise dying away. */
function fill(array, fftSize) {
  const binHz = RATE / fftSize;
  array.fill(0);
  const add = (hz, amp, width) => {
    const centre = hz / binHz;
    for (let bin = Math.max(1, Math.floor(centre - width * 3));
         bin <= Math.min(array.length - 1, Math.ceil(centre + width * 3)); bin += 1) {
      const away = (bin - centre) / width;
      array[bin] = Math.min(255, array[bin] + amp * Math.exp(-0.5 * away * away));
    }
  };
  for (const [hz, amp] of scene.notes) {
    for (let partial = 1; partial <= 6; partial += 1) add(hz * partial, amp / partial, 1.1);
  }
  for (const [at, lowHz, highHz, amp] of scene.hits) {
    const age = clock - at;
    if (age < 0 || age > 250) continue;
    const alive = amp * Math.exp(-age / 60);
    for (let bin = Math.max(1, Math.round(lowHz / binHz));
         bin <= Math.min(array.length - 1, Math.round(highHz / binHz)); bin += 1) {
      array[bin] = Math.min(255, array[bin] + alive * (0.7 + 0.3 * Math.random()));
    }
  }
  for (let bin = 1; bin < array.length; bin += 1) {
    array[bin] = Math.min(255, array[bin] + 6 * Math.random());
  }
}

const analyser = (fftSize) => ({
  fftSize, frequencyBinCount: fftSize / 2, smoothingTimeConstant: 0,
  minDecibels: 0, maxDecibels: 0, context: { sampleRate: RATE }, connect() {},
  getByteFrequencyData(array) { fill(array, fftSize); },
});

const pending = [];
let pump = null;
const stubs = {
  performance: { now: () => clock },
  requestAnimationFrame: (fn) => { pending.push(fn); },
};
stubs.window = {
  AudioContext: function () {
    return {
      state: "running", currentTime: 0, resume() {}, destination: {},
      createMediaElementSource: () => ({ connect() {} }),
      createBiquadFilter: () => ({ type: "", frequency: { value: 0 }, Q: { value: 0 }, connect() {} }),
      createGain: () => ({ gain: { value: 1 }, connect() {} }),
      createScriptProcessor: () => (pump = { onaudioprocess: null, connect() {} }),
      // The fast analyser is built first, the fine one second.
      createAnalyser() { return analyser(this.__next = this.__next === 1024 ? 4096 : 1024); },
    };
  },
};
// One element, not a fresh one per call: the audio graph is hung off the video
// itself, so a new object each time would look like a player it has never seen.
const video = { paused: false, ended: false, readyState: 4 };
stubs.document = { querySelectorAll: () => [video] };

/* Handed in as arguments rather than set as globals: a runtime that defines its
   own performance or requestAnimationFrame would otherwise win, and the script
   would be timed by a clock this test does not control. */
const runner = new Function(
  "window", "document", "performance", "requestAnimationFrame", `return ${SCRIPT};`);
const poll = () => runner(stubs.window, stubs.document, stubs.performance, stubs.requestAnimationFrame);
const draw = (ms) => {
  for (let i = 0; i < ms / 16.6; i += 1) {
    clock += 16.6;
    for (const fn of pending.splice(0)) fn();
  }
};

// ---- what we play it -------------------------------------------------------
const note = (fromA4) => 440 * Math.pow(2, fromA4 / 12);
const C_MAJOR = [[note(3), 90], [note(7), 78], [note(10), 74]];
const A_MAJOR = [[note(0), 90], [note(4), 78], [note(7), 74]];
const out = {};
const bandsOf = (report) => Object.fromEntries(
  BANDS.map(([name]) => [name, report.levels[name + "_on"]]));

poll();                                  // builds the graph
scene.notes = C_MAJOR;
draw(4000); out.chord = poll();
scene.notes = [...C_MAJOR, [note(19), 60]];
draw(1200); out.melodyOverIt = poll();   // a melody is not a chord change
scene.notes = A_MAJOR;
draw(600); out.chordChange = poll();
draw(6000); out.settled = poll();
draw(6000); out.settledLonger = poll();   // and the bloom has to end, not linger

scene = { notes: [], hits: [] };
draw(600); poll();
scene.hits = [[clock, 35, 140, 200]];
draw(120); out.kick = bandsOf(poll());
scene.hits = [[clock, 180, 4000, 170]];
draw(120); out.snare = bandsOf(poll());
scene.hits = [[clock, 6000, 16000, 150]];
draw(120); const hat = poll();
out.hat = bandsOf(hat);
out.hatCentroid = hat.centroid;

/* ---- and now the thing that matters: keeping up ----------------------------

   A grid is only worth anything while it matches what is playing. These play a
   song, change to a different one at a different tempo, and record how long the
   tracker takes to be sure of the new tempo — first across a gap between
   tracks, then across a change with no gap at all, which is the harder one. */
const GATE = Number(/const BEAT_CONFIDENCE = ([\d.]+)/.exec(src)[1]);
const locked = (report, bpm) => report.steady && report.confidence >= GATE
  && Math.abs(report.bpm - bpm) <= Math.max(3, bpm * 0.04);

function play(bpm, seconds, watch) {
  const period = 60000 / bpm;
  const end = clock + seconds * 1000;
  let nextBeat = clock + period, count = 0, nextPoll = clock + 200;
  while (clock < end) {
    clock += 16.6;
    while (nextBeat <= clock + period) {
      const place = count % 4;
      if (place === 0) scene.hits.push([nextBeat, 35, 150, 230]);        // downbeat kick
      else if (place === 2) scene.hits.push([nextBeat, 35, 150, 160]);   // and on three
      else scene.hits.push([nextBeat, 180, 4000, 160]);                  // snare on two and four
      scene.hits.push([nextBeat + period / 2, 6000, 16000, 90]);         // hats between
      nextBeat += period;
      count += 1;
    }
    scene.hits = scene.hits.filter(([at]) => clock - at < 300);
    for (const fn of pending.splice(0)) fn();
    if (clock >= nextPoll) { nextPoll += 200; watch(poll(), clock); }
  }
}

const settle = (ms) => { const end = clock + ms; while (clock < end) { clock += 16.6;
  for (const fn of pending.splice(0)) fn(); if (Math.random() < 0.1) poll(); } };

scene = { notes: [], hits: [] };
let mark = null, from = clock;
play(92, 16, (report, at) => { if (mark === null && locked(report, 92)) mark = at - from; });
out.lockFromCold = mark;

// A gap between tracks, then a much faster song.
scene.hits = [];
from = clock;
settle(700);
mark = null;
play(142, 16, (report, at) => { if (mark === null && locked(report, 142)) mark = at - from; });
out.relockAfterGap = mark;

// And a change with no gap at all — one song straight into another.
from = clock;
mark = null;
play(96, 16, (report, at) => { if (mark === null && locked(report, 96)) mark = at - from; });
out.relockWithoutGap = mark;

// The page stops being drawn — the operator switched to another tab.
scene = { notes: C_MAJOR, hits: [] };
draw(600); poll();
clock += 1000; pending.splice(0);
out.undrawn = poll();

// The audio graph carries on regardless, and that is what keeps it alive.
for (let i = 0; i < 40; i += 1) { clock += 21; pump.onaudioprocess(); }
out.fromAudioClock = poll();


console.log(JSON.stringify(out));
