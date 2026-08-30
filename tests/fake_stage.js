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
  return { beat, bands, field, dance, FAMILIES, slime, makeBlobs,
           applyGrid, applyLevels, advanceBeat, advanceBands, advanceDance };`,
)({ now: () => clock });

const BPM = 128, PERIOD = 60000 / BPM;
const LOUD = { sub: 55, bass: 70, body: 45, mid: 38, presence: 26, high: 22, air: 15,
               sub_on: 9, bass_on: 12, body_on: 9, mid_on: 8, presence_on: 7, high_on: 9, air_on: 6,
               centroid: 45, tonal: 3, harmony: 0 };

const out = {};
stage.slime.blobs = stage.makeBlobs();

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
  stage.advanceDance(t);

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

/* The dance. Does a shape move between the beats and arrive on them, and does
   it gather itself first? Watched on one of the bass shapes, which lands on
   every beat, over four bars once the dancing has warmed up. */
const bass = stage.slime.blobs.find((b) => b.family.band === "bass");
const track = [];
// Recorded against the stage's own idea of where it is in the beat, which is
// the only way to tell a gather before a beat from a landing after one.
watch = () => track.push([stage.dance.beat, bass.bob, bass.squashX, bass.placeX, bass.placeY]);
const danceUntil = clock + PERIOD * 16;
for (let t = clock; t < danceUntil; t += 16.6) {
  clock = t;
  if (t - lastPost >= 200) {
    lastPost = t;
    stage.applyLevels(LOUD);
    stage.applyGrid({ period: PERIOD, bpm: BPM, bar_beat: Math.floor(t / PERIOD) % 4,
                      anchor_age: (t % PERIOD) + 25 });
  }
  stage.advanceBeat(t);
  stage.advanceBands(t);
  stage.advanceDance(t);
  watch(t);
}
watch = null;

// Up is negative here, so the top of a step is the smallest bob.
const within = (from, to) => track.filter(([phase]) => phase >= from && phase < to);
const average = (rows, column) => rows.reduce((sum, row) => sum + row[column], 0) / (rows.length || 1);
out.dance = {
  strength: +stage.dance.strength.toFixed(2),
  // Just after the beat it should be at the top of its step, and just before
  // the next one it should have gathered itself downwards.
  justAfterTheBeat: +average(within(0, 0.12), 1).toFixed(4),
  midBeat: +average(within(0.4, 0.6), 1).toFixed(4),
  justBefore: +average(within(0.92, 1), 1).toFixed(4),
  squash: +Math.max(...track.map((row) => row[2])).toFixed(3),
  // Does it cross the floor rather than sitting in one place?
  travelled: +Math.max(
    Math.max(...track.map((r) => r[3])) - Math.min(...track.map((r) => r[3])),
    Math.max(...track.map((r) => r[4])) - Math.min(...track.map((r) => r[4])),
  ).toFixed(3),
};

// And they settle when the music stops.
const quietUntil = clock + 20000;
for (let t = clock; t < quietUntil; t += 16.6) {
  clock = t; stage.advanceBeat(t); stage.advanceBands(t); stage.advanceDance(t);
}
out.afterTheMusicStops = {
  locked: stage.beat.locked,
  dancing: +stage.dance.strength.toFixed(3),
  levels: Object.fromEntries(Object.entries(stage.bands).map(([k, v]) => [k, +v.level.toFixed(3)])),
};

console.log(JSON.stringify(out));
