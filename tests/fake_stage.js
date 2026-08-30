/* Drives the waiting screen's own timing without a browser.

   The stage keeps its own copy of the beat grid and runs the picture off it, so
   what it does between messages is not something the server or the operator can
   be asked about. This lifts the timing half of stage.js — the metre, the band
   envelopes and the wanderers, everything up to the point where it touches a
   canvas — feeds it reports the way the server would, and prints what happened
   as JSON for the test to check.

   Usage: <node|bun|deno> tests/fake_stage.js /path/to/stage.js
*/
const fs = require("fs");

const src = fs.readFileSync(process.argv[2], "utf8");
const region = src.slice(src.indexOf("const FAMILIES = ["), src.indexOf("function sizeSlime()"))
  // buildSlime is the one part of it that reaches for the document.
  .replace(/function buildSlime\(\)[\s\S]*?\n}\n/, "");

let clock = 0;
const stage = new Function("performance", `${region}
  return { beat, bands, field, FAMILIES, slime, reseed,
           applyGrid, applyLevels, advanceBeat, advanceBands, advanceWanderers };`,
)({ now: () => clock });

const BPM = 128, PERIOD = 60000 / BPM;
const LOUD = { sub: 55, bass: 70, body: 45, mid: 38, presence: 26, high: 22, air: 15,
               sub_on: 9, bass_on: 12, body_on: 9, mid_on: 8, presence_on: 7, high_on: 9, air_on: 6,
               centroid: 45, tonal: 3, harmony: 0 };

const out = {};
const random = (min, max) => min + Math.random() * (max - min);
stage.slime.wanderers = Array.from({ length: 5 }, () => stage.reseed({ life: random(0, 1) }));

/* One report every 200ms and one frame every 16.6ms, the way it really runs. */
const swells = [], accents = [], hits = { presence: [], high: [], air: [] };
let lastPost = -1000;
let watch = null;

for (let t = 0; t < 30000; t += 16.6) {
  clock = t;
  if (t - lastPost >= 200) {
    lastPost = t;
    stage.applyLevels(LOUD);
    // The operator reports the last beat it actually heard, and how long ago
    // that was, plus a little for the trip: a constant age would be a grid
    // pinned to whenever the message happened to be sent.
    stage.applyGrid({
      period: PERIOD, bpm: BPM,
      bar_beat: Math.floor(t / PERIOD) % 4,
      anchor_age: (t % PERIOD) + 25,
    });
  }

  const before = { heave: stage.field.heave,
                   presence: stage.bands.presence.punch,
                   high: stage.bands.high.punch,
                   air: stage.bands.air.punch };
  stage.advanceBeat(t);
  if (stage.field.heave > before.heave + 0.001) {
    swells.push(t);
    if (stage.field.heave > 0.95) accents.push(t);       // a downbeat
  }
  for (const name of ["presence", "high", "air"]) {
    const punch = stage.bands[name].punch;
    if (punch > before[name] + 0.001) hits[name].push([t, punch]);
  }
  stage.advanceBands(t);
  stage.advanceWanderers(t);

  if (watch) watch(t);
}

// Where the swells landed, against the beat they were meant to be on.
const settled = swells.filter((t) => t > 4000);
const offsets = settled.map((t) => {
  const off = ((t % PERIOD) + PERIOD) % PERIOD;
  return off > PERIOD / 2 ? off - PERIOD : off;
}).sort((a, b) => a - b);
out.beats = { expected: Math.round((30000 - 4000) / PERIOD), got: settled.length,
              median: Math.round(offsets[offsets.length >> 1]),
              worst: Math.round(Math.max(...offsets.map(Math.abs))) };

// The bar: accents four beats apart, snare-family hits on the backbeat.
const gaps = accents.slice(1).map((t, i) => Math.round(t - accents[i]));
out.bar = { accents: accents.length, gaps: [...new Set(gaps)] };
const place = (t) => Math.round((((t % (PERIOD * 4)) / PERIOD) * 4)) % 16;
/* How hard each family was hit at each of the sixteen places in the bar. What
   matters is not only where they fire but which places they lean on. */
const byPlace = (list) => {
  const strength = {};
  for (const [t, punch] of list.filter(([t]) => t > 4000)) {
    const at = place(t);
    strength[at] = Math.max(strength[at] || 0, +punch.toFixed(3));
  }
  return strength;
};
out.backbeat = byPlace(hits.presence);
out.offbeat = byPlace(hits.high);
out.sixteenths = byPlace(hits.air);

// The wanderers: over ten simulated minutes, do they live whole lives?
const lives = stage.slime.wanderers.map(() => ({ biggest: 0, spans: new Set(), finite: true }));
watch = () => {
  stage.slime.wanderers.forEach((w, n) => {
    lives[n].biggest = Math.max(lives[n].biggest, w.shape * w.peak);
    lives[n].spans.add(w.span);
    if (!Number.isFinite(w.shape) || !Number.isFinite(w.life)) lives[n].finite = false;
  });
};
const wanderUntil = clock + 600000;
for (let t = clock; t < wanderUntil; t += 16.6) {
  clock = t;
  stage.advanceBands(t);
  stage.advanceWanderers(t);
  watch(t);
}
out.wanderers = lives.map((l) => ({ biggest: +l.biggest.toFixed(2), lives: l.spans.size, finite: l.finite }));

// And they settle when the music stops.
const quietUntil = clock + 4000;
for (let t = clock; t < quietUntil; t += 16.6) { clock = t; stage.advanceBeat(t); stage.advanceBands(t); }
out.afterTheMusicStops = {
  locked: stage.beat.locked,
  levels: Object.fromEntries(Object.entries(stage.bands).map(([k, v]) => [k, +v.level.toFixed(3)])),
};

console.log(JSON.stringify(out));
