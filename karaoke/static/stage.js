/* The audience screen.

   Subscribes to the stage state over server-sent events and mirrors it: play
   the karaoke video, play the YouTube video, or show the waiting screen. It
   holds no state of its own beyond what it is told, so the operator's laptop
   stays the single source of truth. */

const video = $("#stage-video");
const waiting = $("#waiting");
const surface = $("#surface");
const scoreHost = $("#score-host");

const stage = {
  applied: null,       // last state we acted on, to spot what actually changed
  ramp: null,          // a fade in flight
  fadeId: null,        // the last fade instruction acted on
  revealId: null,      // the last "show the score now" instruction acted on
  lastReport: 0,
  audioUnlocked: false,
};

/* ---------- sound has to be unlocked once ----------
   Browsers refuse to play audio until someone interacts with the page, and
   nobody ever touches the stage screen. So we ask for one click while setting
   up, and say so plainly rather than failing silently at showtime. */

function unlockAudio() {
  if (stage.audioUnlocked) return;
  stage.audioUnlocked = true;
  $("#waiting-hint").textContent = "";
  hideStatus();
  const ctx = typeof getAudioContext === "function" ? getAudioContext() : null;
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  // Re-apply, in case a song was asked for while we were still muted.
  if (stage.applied) applyState(stage.applied, true);
}

document.addEventListener("click", unlockAudio);
document.addEventListener("keydown", unlockAudio);

function showStatus(message) {
  const el = $("#stage-status");
  el.textContent = message;
  el.hidden = false;
}

function hideStatus() {
  $("#stage-status").hidden = true;
}

function needsUnlock() {
  showStatus("Click anywhere on this screen once to enable sound.");
}

/* ---------- volume ---------- */

function setVolume(value) {
  video.volume = Math.max(0, Math.min(1, value / 100));
}

/* Rides the karaoke volume to `to` over `ms`, here rather than across the
   network, so the fade is smooth whatever the operator's laptop is doing. */
function rampVolume(to, ms) {
  if (stage.ramp) cancelAnimationFrame(stage.ramp);
  const from = video.volume * 100;
  const started = performance.now();

  function step(now) {
    const t = Math.min(1, (now - started) / Math.max(1, ms));
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    setVolume(from + (to - from) * eased);
    stage.ramp = t < 1 ? requestAnimationFrame(step) : null;
  }
  stage.ramp = requestAnimationFrame(step);
}

/* ---------- applying state ---------- */

function showWaiting(state) {
  surface.hidden = true;
  scoreHost.hidden = true;
  waiting.hidden = false;
  video.pause();
  video.removeAttribute("src");
  video.load();
  $("#waiting-sub").textContent = state && state.score
    ? "Who is next?"
    : "Waiting for the next singer…";
}

function applyKaraoke(state, restarted) {
  waiting.hidden = true;
  surface.hidden = false;

  const src = `/media/${encodeURIComponent(state.karaoke.name)}`;
  // eslint-disable-next-line no-unused-vars
  if (restarted || !video.currentSrc.endsWith(encodeURIComponent(state.karaoke.name))) {
    scoreHost.hidden = true;
    hideScore();
    video.src = src;
    video.currentTime = 0;
  }
  if (!stage.ramp) setVolume(state.volume.karaoke);

  if (state.playing) {
    video.play().catch(() => needsUnlock());
  } else {
    video.pause();
  }
}

function applyState(state, force = false) {
  const previous = stage.applied;
  const restarted = force || !previous || previous.nonce !== state.nonce;
  stage.applied = state;

  // Volume always applies, whatever mode we are in — the mixer must stay live.
  // A new fade instruction is ridden down; anything else lands immediately.
  const fade = state.fade;
  // A fade left in the state from before we connected is history, not an
  // instruction: adopt its id so the next real one still counts as new.
  if (fade && previous === null) {
    stage.fadeId = fade.id;
  }
  if (fade && fade.id !== stage.fadeId) {
    stage.fadeId = fade.id;
    rampVolume(state.volume.karaoke, fade.ms);
  } else if (!stage.ramp) {
    setVolume(state.volume.karaoke);
  }

  if (state.mode === "karaoke" && state.karaoke) {
    applyKaraoke(state, restarted);
  } else {
    showWaiting(state);
  }

  // "Score" from the operator: end the song where it is and put the number up.
  // Checked after the mode above, which would otherwise pause over the top.
  const reveal = state.reveal;
  if (reveal && previous === null) {
    stage.revealId = reveal.id;      // history, not an instruction
  } else if (reveal && reveal.id !== stage.revealId) {
    stage.revealId = reveal.id;
    video.pause();
    revealScore();
  }
}

/* ---------- the song ending ---------- */

function revealScore() {
  scoreHost.hidden = false;
  showScore((score, rank) => {
    // Tell the operator what the room just saw.
    fetch("/api/stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: { value: score, rank }, playing: false }),
    }).catch(() => {});
  });
}

video.addEventListener("ended", revealScore);

/* ---------- reporting where we are ---------- */

function reportProgress() {
  fetch("/api/stage/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      position: video.currentTime || 0,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
    }),
  }).catch(() => {});
}

// timeupdate fires about four times a second; once is plenty for a progress bar,
// and every extra report is a request competing with the ones that carry
// decisions — a crossfade instruction arriving late is audible.
video.addEventListener("timeupdate", () => {
  const now = performance.now();
  if (now - stage.lastReport < 1000) return;
  stage.lastReport = now;
  reportProgress();
});

// The duration is worth sending the moment it is known, and again when the
// song is paused or finishes, so the operator's clock settles on the truth.
video.addEventListener("loadedmetadata", reportProgress);
video.addEventListener("pause", reportProgress);
video.addEventListener("ended", reportProgress);

/* ---------- the slime ----------

   The waiting screen stays #141414 with cyan shapes drifting across it. Each is
   a soft radial gradient drawn additively, so where two overlap they brighten
   and fuse; blurred together by CSS they read as one organic mass rather than a
   handful of circles. Every blob follows its own pair of slow sines at
   frequencies that do not divide into each other, so the mass never repeats.

   What it is listening to is the whole record, not one drum in it.

   The laptop sends seven bands cut where instruments actually sit, each with a
   loudness and an attack; the tempo, and which beat of the bar it is on; the
   harmony, folded onto twelve pitch classes; and the brightness of the sound.
   Every one of those drives something different here:

     · seven families of shapes, one per band, sized and paced like the part of
       the mix they answer to — the sub is enormous and slow, the air is small
       and quick
     · the metre, four beats to the bar and four sixteenths to the beat, so the
       screen phrases: the downbeat lands hardest, the backbeat cracks with the
       snare, the offbeats tick with the hats
     · attacks, which fire a family off the grid — a vocal entry, a fill, a
       cymbal — so it is never only the metronome moving
     · the harmony: a chord change blooms the whole field, and where the mass
       drifts follows the tonal centre around the twelve pitch classes
     · brightness, which decides how white the light in the shapes runs

   The bass is deliberately out of proportion to the rest. It is what the room
   feels through the floor, so it is what the screen should be biggest about. */

const FAMILIES = [
  {
    band: "sub", count: 2,                 // 30–60 Hz: felt more than heard
    radius: [0.34, 0.52], drift: [0.05, 0.13], speed: [0.006, 0.016],
    swell: 1.15, punch: 1.5, floor: 0.5, lift: 0, pulse: "beat", weight: 1,
    // How it carries itself: weight is what tells a heavy thing from a light
    // one, so the sub barely lifts and the air is thrown about.
    bob: 0.02, sway: 0.03,
  },
  {
    band: "bass", count: 3,                // 60–160 Hz: the kick and the bass
    radius: [0.24, 0.38], drift: [0.09, 0.22], speed: [0.010, 0.028],
    swell: 0.95, punch: 1.25, floor: 0.45, lift: 0.05, pulse: "beat", weight: 0.9,
    bob: 0.035, sway: 0.045,
  },
  {
    band: "body", count: 2,                // 160–400 Hz: where a chord sounds thick
    radius: [0.17, 0.27], drift: [0.13, 0.28], speed: [0.016, 0.040],
    swell: 0.55, punch: 0.7, floor: 0.3, lift: 0.1, pulse: "beat", weight: 0.55,
    bob: 0.05, sway: 0.06,
  },
  {
    band: "mid", count: 3,                 // 400–1200 Hz: the voice
    radius: [0.12, 0.20], drift: [0.16, 0.32], speed: [0.026, 0.062],
    swell: 0.5, punch: 0.65, floor: 0.22, lift: 0.2, pulse: null, weight: 0,
    bob: 0.075, sway: 0.08,
  },
  {
    band: "presence", count: 3,            // 1.2–3.5 kHz: snare crack, consonants
    radius: [0.08, 0.15], drift: [0.18, 0.36], speed: [0.040, 0.090],
    swell: 0.6, punch: 0.9, floor: 0.16, lift: 0.35, pulse: "backbeat", weight: 0,
    bob: 0.095, sway: 0.07,
  },
  {
    band: "high", count: 3,                // 3.5–8 kHz: hats
    radius: [0.06, 0.12], drift: [0.20, 0.40], speed: [0.070, 0.150],
    swell: 0.7, punch: 1, floor: 0.1, lift: 0.55, pulse: "offbeat", weight: 0,
    bob: 0.12, sway: 0.055,
  },
  {
    band: "air", count: 4,                 // 8 kHz up: cymbal shimmer
    radius: [0.045, 0.09], drift: [0.22, 0.44], speed: [0.090, 0.190],
    swell: 0.8, punch: 1.1, floor: 0.06, lift: 0.75, pulse: "sixteenth", weight: 0,
    bob: 0.15, sway: 0.045,
  },
];

const beat = {
  seen: null,
  period: 0,      // one beat, in milliseconds
  bpm: 0,
  nextAt: 0,      // when the next sixteenth is due
  step: 0,        // where that sixteenth sits in the bar, 0 to 15
  locked: false,
  lastGrid: 0,    // when the operator last reported a tempo
  lastReport: 0,  // when anything at all last arrived
  disagree: 0,    // reports running against our idea of where the bar starts
};

/* Fire a fraction early. The swell takes a frame or two to reach its peak, so
   landing it exactly on the beat reads as slightly behind it. */
const BEAT_LEAD = 10;

/* Two envelopes per family: a punch that snaps and disappears, and a body that
   follows through. One alone either smears — too slow to read as a beat — or
   flickers, too fast to look like liquid; together they land like a drum and
   settle like slime. Each family decays at its own rate, because a sub note
   and a hi-hat do not leave at the same speed. */
const bands = {};
for (const family of FAMILIES) {
  bands[family.band] = {
    level: 0, target: 0, base: 0, quiet: 0,     // loudness, and what it usually is
    body: 0, punch: 0,                          // what the shapes are doing now
    bodyDecay: 0.90 - 0.045 * FAMILIES.indexOf(family),
    punchDecay: 0.80 - 0.020 * FAMILIES.indexOf(family),
  };
}

/* The whole field, not one family: the bass heaves everything, a chord change
   blooms everything, the tonal centre drags everything around a circle. */
const field = {
  heave: 0,          // the low end, exaggerated on purpose
  bloom: 0,          // a chord change
  tone: 0,           // brightness, 0 dark to 100 bright
  tonal: 0,          // which pitch class the harmony is sitting on
  pullX: 0, pullY: 0,
};

const BAND_ATTACK = 0.30;
const BAND_RELEASE = 0.07;
const clamp01 = (value) => Math.max(0, Math.min(1, value));

/* Swells one family. Gated by whether that band has anything in it, so a track
   with no hi-hats does not shimmer on every offbeat regardless. */
function swell(name, strength) {
  const band = bands[name];
  const present = 0.2 + 0.8 * Math.min(1, band.level * 1.6);
  const amount = Math.min(1, strength * present);
  band.body = Math.max(band.body, amount);
  band.punch = Math.max(band.punch, amount);
  return amount;
}

/* One tick of the metre.

   Four beats to the bar and four sixteenths to the beat, which is where nearly
   all of this music lives. The positions are not equal and are not treated as
   equal: one is the downbeat and carries the weight, two and four are the
   backbeat where the snare is, the halves between beats are where the hats
   are, and the sixteenths between those are the shimmer. */
function metronome(step) {
  const beatInBar = step >> 2;
  const onBeat = (step & 3) === 0;
  const onEighth = (step & 3) === 2;

  if (onBeat) {
    const downbeat = beatInBar === 0;
    const backbeat = beatInBar === 1 || beatInBar === 3;
    const weight = downbeat ? 1 : 0.7;

    swell("sub", downbeat ? 1 : 0.55);
    swell("bass", weight);
    swell("body", weight * 0.8);
    if (backbeat) swell("presence", 0.85);
    // The low end moves the entire picture, not only its own shapes.
    field.heave = Math.max(field.heave, downbeat ? 1 : 0.6);
    if (downbeat) stepTheFloor();
  } else if (onEighth) {
    swell("high", 0.55);
    swell("air", 0.3);
  } else {
    swell("air", 0.4);
    swell("high", 0.22);
  }
}

/* Places the tempo grid, and the bar inside it.

   The laptop does not send individual hits — it sends the tempo it is hearing,
   how long ago the last strong onset happened, and which beat of the bar that
   onset was. Only the age can travel: the two pages run on unrelated clocks, so
   a timestamp from one is meaningless in the other. From an age we can rebuild
   where the beat sits on our own clock, and from the tempo where every beat
   after it sits too, so the animation runs off the grid and never waits for a
   message to arrive. */
function applyGrid(payload) {
  const now = performance.now();
  const period = Number(payload.period) || 0;
  if (period < 300 || period > 1400) {          // outside 200–43 bpm: not a tempo
    beat.locked = false;
    return;
  }

  beat.period = period;
  beat.bpm = Number(payload.bpm) || 0;
  beat.lastGrid = now;

  const tick = period / 4;                      // one sixteenth
  const anchorAt = now - (Number(payload.anchor_age) || 0) - BEAT_LEAD;
  // Walk the anchor forward to the first sixteenth still ahead of us.
  const steps = Math.ceil((now - anchorAt) / tick);
  const target = anchorAt + steps * tick;
  const step = ((Number(payload.bar_beat) || 0) * 4 + steps) % 16;

  if (!beat.locked) {
    beat.nextAt = target;
    beat.step = step;
    beat.locked = true;
    return;
  }

  // Already running: ease onto the reported grid rather than jumping to it, so
  // a single noisy report cannot make the picture stutter. Phase is circular,
  // so fold the error into the nearest half tick first — otherwise a beat
  // reported one slot over looks like a whole tick of error.
  let error = target - beat.nextAt;
  while (error > tick / 2) error -= tick;
  while (error < -tick / 2) error += tick;
  if (Math.abs(error) > tick * 0.3) {
    beat.nextAt = target;                       // a real change: new song, new tempo
    beat.step = step;
  } else {
    beat.nextAt += error * 0.25;
  }

  // Where the bar starts is a weaker reading than where the beat is, so it is
  // only adopted once several reports in a row insist on it. Otherwise the
  // accent would hop about inside the bar.
  if (step !== beat.step) {
    beat.disagree += 1;
    if (beat.disagree >= 3) { beat.step = step; beat.disagree = 0; }
  } else {
    beat.disagree = 0;
  }
}

/* The bands, the harmony and the brightness. */
function applyLevels(payload) {
  beat.lastReport = performance.now();

  for (const family of FAMILIES) {
    const band = bands[family.band];
    band.target = clamp01((Number(payload[family.band]) || 0) / 100);
    const onset = clamp01((Number(payload[family.band + "_on"]) || 0) / 100);

    /* Judge an attack against what this band has been doing rather than against
       a fixed threshold: one number cannot suit both a quiet ballad and a
       mastered-loud dance track, and the second would simply stay lit. */
    band.quiet = band.quiet ? band.quiet * 0.9 + onset * 0.1 : onset;
    const excess = (onset - band.quiet) / Math.max(band.quiet, 0.05);
    if (excess > 0.4) {
      // Off the grid entirely: a vocal entry, a fill, a cymbal. This is what
      // keeps the screen answering to the music rather than to the metronome.
      swell(family.band, Math.min(1, excess * 0.55));
    }
  }

  // A chord change: the harmony has turned away from where it had been sitting.
  const harmony = clamp01((Number(payload.harmony) || 0) / 100);
  if (harmony > 0.25) field.bloom = Math.max(field.bloom, harmony);
  // A real change of chord is a change of scene: everybody moves on the next
  // downbeat, not only whoever was due.
  if (harmony > 0.5) dance.reform = true;

  const centroid = Number(payload.centroid) || 0;
  field.tone += (centroid - field.tone) * 0.12;
  field.tonal = Number(payload.tonal) || 0;
}

function advanceBeat(now) {
  // No fresh report for a moment means the music stopped, or the tempo was
  // lost: stop predicting rather than beating on over silence.
  if (beat.locked && now - beat.lastGrid > 2500) beat.locked = false;
  if (!beat.locked || !beat.period) return;

  const tick = beat.period / 4;
  // Behind by more than a bar — a hidden tab, a stalled frame — so rejoin the
  // grid where it is now instead of firing our way back to it.
  if (now - beat.nextAt > beat.period) beat.nextAt = now;

  while (now >= beat.nextAt) {
    metronome(beat.step);
    beat.step = (beat.step + 1) % 16;
    beat.nextAt += tick;
  }
}

/* ---------- the dance ----------

   Swelling on the beat is not dancing; it is a light going on and off. What
   makes a body look like it is dancing to something is that it moves *between*
   the beats and arrives *on* them: it gathers itself, lands, settles, shifts
   its weight across the bar, and travels the floor. All of that needs to know
   when the next beat is coming — which the grid does know, and a picture
   reacting to sound never can.

   Each family dances to its own part. The bass lands on the beat, the snare
   family on two and four, the hats on the offbeat, the air on the sixteenths,
   and the shapes that follow the voice move when the voice does rather than to
   any count at all. */
const dance = { strength: 0, beat: 0, bar: 0, bars: 0, locked: false, reform: false };

const TAU = Math.PI * 2;
const fract = (value) => value - Math.floor(value);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* Where we are inside the beat and inside the bar, as fractions of each.

   The grid says when the next sixteenth lands and which of the sixteen it is,
   so counting forward from it gives the time to the next beat and to the next
   bar. Nothing else on this screen could know a beat was coming. */
function metre(now) {
  if (!beat.locked || !beat.period) return null;
  const tick = beat.period / 4;
  const toTick = Math.max(0, beat.nextAt - now);
  const toBeat = toTick + ((4 - (beat.step % 4)) % 4) * tick;
  const toBar = toTick + ((16 - beat.step) % 16) * tick;
  return {
    beat: 1 - Math.min(1, toBeat / beat.period),
    bar: 1 - Math.min(1, toBar / (beat.period * 4)),
  };
}

/* A step, drawn the way an animator would draw one: gather just before the
   beat, land on it, settle after it. The gather is the whole trick. Leaning
   into a beat before it arrives is what reads as dancing rather than as
   reacting, and it is only possible because the grid saw it coming. */
function landing(phase) {
  if (phase > 0.78) return -0.5 * (phase - 0.78) / 0.22;      // gather, going down
  return Math.pow(1 - phase / 0.78, 1.6);                     // land, and settle
}

/* Which count a family dances to. */
function countFor(family, band) {
  if (!dance.locked) return band.punch;
  switch (family.pulse) {
    case "beat": return landing(dance.beat);
    case "backbeat": return landing(fract(dance.bar * 2 + 0.5));
    case "offbeat": return landing(fract(dance.beat * 2 + 0.5));
    case "sixteenth": return landing(fract(dance.beat * 4));
    // The voice keeps no count: these move when it moves.
    default: return band.punch;
  }
}

/* Sends whoever is due somewhere else on the floor. Called on the downbeat, so
   a shape sets off on a bar line and arrives on one, rather than wandering
   across whenever it feels like it. */
function stepTheFloor() {
  dance.bars += 1;
  for (const blob of slime.blobs) {
    if (!dance.reform && dance.bars % blob.travelBars !== blob.travelOn) continue;
    blob.fromX = blob.placeX;
    blob.fromY = blob.placeY;
    // Somewhere near where it was: a floor that reshuffles completely every few
    // bars reads as a slideshow rather than as dancers moving about.
    blob.toX = Math.max(0.08, Math.min(0.92, blob.homeX + random(-0.22, 0.22)));
    blob.toY = Math.max(0.08, Math.min(0.92, blob.homeY + random(-0.18, 0.18)));
    blob.travelAt = performance.now();
    blob.travelSpan = beat.period * 4 * (blob.travelBars > 3 ? 2 : 1);
  }
  dance.reform = false;
}

function advanceDance(now) {
  const where = metre(now);
  dance.locked = Boolean(where);
  if (where) {
    dance.beat = where.beat;
    dance.bar = where.bar;
  }

  /* How much dancing there is to do. Silence should leave the shapes drifting,
     not marking time to a beat nobody can hear, and it should come and go
     gradually — a room does not start dancing on one loud frame. */
  const energy = bands.bass.level * 0.45 + bands.body.level * 0.2
    + bands.mid.level * 0.2 + bands.high.level * 0.15;
  const wanted = dance.locked ? Math.min(1, energy * 2.2) : 0;
  dance.strength += (wanted - dance.strength) * (wanted > dance.strength ? 0.05 : 0.02);

  for (const blob of slime.blobs) {
    const family = blob.family;
    const count = countFor(family, bands[family.band]);

    // Up on the landing, down on the gather.
    blob.bob = -count * family.bob * dance.strength;
    // Weight shifting from one side to the other across the bar.
    blob.sway = Math.sin(dance.bar * TAU * blob.swayRate + blob.swayPhase)
      * family.sway * dance.strength;
    /* Squashed on the way down and stretched on the way up. Without it a shape
       only changes size, which is the difference between a body landing and a
       lamp being turned up. */
    const impact = Math.max(0, count);
    blob.squashX = 1 + 0.34 * impact * dance.strength;
    blob.squashY = 1 - 0.26 * impact * dance.strength;
    blob.tilt += blob.spin * (1 + 2 * dance.strength);

    const along = blob.travelSpan > 0
      ? ease(Math.min(1, Math.max(0, (now - blob.travelAt) / blob.travelSpan))) : 1;
    blob.placeX = blob.fromX + (blob.toX - blob.fromX) * along;
    blob.placeY = blob.fromY + (blob.toY - blob.fromY) * along;
  }
}

function advanceBands(now) {
  // Nothing reported for a moment: the music stopped, so let it all settle.
  const quiet = !beat.lastReport || now - beat.lastReport > 1200;
  for (const family of FAMILIES) {
    const band = bands[family.band];
    const target = quiet ? 0 : band.target;
    band.level += (target - band.level) * (target > band.level ? BAND_ATTACK : BAND_RELEASE);
    band.body = band.body < 0.01 ? 0 : band.body * band.bodyDecay;
    band.punch = band.punch < 0.01 ? 0 : band.punch * band.punchDecay;
  }

  field.heave = field.heave < 0.01 ? 0 : field.heave * 0.91;
  field.bloom = field.bloom < 0.01 ? 0 : field.bloom * 0.975;   // a chord lasts
  if (quiet) field.tone += (0 - field.tone) * 0.05;

  // The tonal centre, laid out around a circle: as the harmony moves the whole
  // mass drifts to a different quarter of the screen, slowly enough that it
  // reads as the picture wandering rather than as anything jumping.
  const angle = (field.tonal / 12) * Math.PI * 2;
  field.pullX += (Math.cos(angle) * 0.05 - field.pullX) * 0.02;
  field.pullY += (Math.sin(angle) * 0.05 - field.pullY) * 0.02;
}

const slime = { canvas: null, ctx: null, blobs: [], width: 0, height: 0 };

// Rendered well below screen resolution: it is blurred past recognition
// anyway, and a full-size canvas repainted every frame is wasted work.
const SLIME_SCALE = 0.5;

const random = (min, max) => min + Math.random() * (max - min);

function buildSlime() {
  slime.canvas = $("#slime");
  slime.ctx = slime.canvas.getContext("2d");
  slime.blobs = makeBlobs();

  sizeSlime();
  window.addEventListener("resize", sizeSlime);
  requestAnimationFrame(drawSlime);
}

/* The cast. Kept apart from the canvas so that what each shape is — where it
   stands, how it carries itself, how often it crosses the floor — can be built
   and checked without a screen to draw it on. */
function makeBlobs() {
  /* Homes laid out by the golden angle rather than at random.

     Twenty random positions clump: half the screen ends up dark and the other
     half is a single bright lump. Stepping round by 137.5° never repeats and
     never bunches, so the mass covers the screen however many shapes there are,
     and a little jitter keeps it from looking set out. */
  const golden = Math.PI * (3 - Math.sqrt(5));
  let placed = 0;

  return FAMILIES.flatMap((family) =>
    Array.from({ length: family.count }, () => {
      const angle = placed * golden;
      const spread = 0.16 + 0.30 * Math.sqrt((placed % 7) / 7);
      placed += 1;
      const bars = [2, 3, 4, 6][Math.floor(random(0, 4))];
      const homeX = 0.5 + Math.cos(angle) * spread + random(-0.05, 0.05);
      const homeY = 0.5 + Math.sin(angle) * spread * 0.8 + random(-0.05, 0.05);
      return {
        family,
        homeX,
        homeY,
        driftX: random(family.drift[0], family.drift[1]),
        driftY: random(family.drift[0], family.drift[1]) * 0.9,
        // Deliberately unrelated speeds, so the paths never fall into step.
        speedX: random(family.speed[0], family.speed[1]),
        speedY: random(family.speed[0], family.speed[1]) * 0.85,
        phaseX: random(0, Math.PI * 2),
        phaseY: random(0, Math.PI * 2),
        radius: random(family.radius[0], family.radius[1]),
        breath: random(0, Math.PI * 2),

        // Dancing: where on the floor it is headed, how it sways, how it is
        // turned. It starts standing where it was placed.
        fromX: homeX, fromY: homeY, toX: homeX, toY: homeY,
        placeX: homeX, placeY: homeY, travelAt: 0, travelSpan: 0,
        bob: 0, sway: 0, squashX: 1, squashY: 1,
        tilt: random(0, Math.PI * 2),
        spin: random(-0.004, 0.004),
        swayRate: [0.5, 1, 2][Math.floor(random(0, 3))],    // a bar, a half, a beat
        swayPhase: random(0, Math.PI * 2),
        // Not everyone crosses the floor at once, or at the same rate. The bar
        // it goes on has to be one that comes round: a shape due on the fifth
        // bar of every four never moves at all.
        travelBars: bars,
        travelOn: Math.floor(random(0, bars)),
      };
    }),
  );

}

function sizeSlime() {
  slime.width = Math.max(1, Math.round(window.innerWidth * SLIME_SCALE));
  slime.height = Math.max(1, Math.round(window.innerHeight * SLIME_SCALE));
  slime.canvas.width = slime.width;
  slime.canvas.height = slime.height;
}

/* Cyan through to white. Brightness in the sound decides how far up this the
   light in a shape runs, and each family sits at its own height of it, so the
   hats read as sparks and the sub as a dark swell even on the same note. */
function light(amount) {
  const t = clamp01(amount);
  return `${Math.round(0 + 215 * t)}, 255, 255`;
}

function drawSlime(now) {
  advanceBeat(now);
  advanceBands(now);
  advanceDance(now);

  const { ctx, width, height } = slime;
  const seconds = now / 1000;
  const reach = Math.min(width, height);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, width, height);

  /* The low end moves everything. A kick is not a local event in a room — it
     is the thing you feel through the floor — so it opens the whole field out
     rather than only the shapes that belong to it. A chord change does the
     same, more slowly. */
  const heave = field.heave * (0.4 + 0.6 * bands.bass.level);
  const global = 1 + 0.22 * heave + 0.12 * field.bloom;
  const tone = field.tone / 100;

  // Additive, so overlaps brighten into one body instead of stacking edges.
  ctx.globalCompositeOperation = "lighter";
  for (const blob of slime.blobs) {
    const family = blob.family;
    const band = bands[family.band];

    /* Where it is standing: the place on the floor it is walking to, its own
       slow drift, the weight shifting side to side, and the step itself. The
       drift gives way as the dancing takes over — with the music going, the
       music is what should be moving it. */
    const wander = 1 - 0.45 * dance.strength;
    const x = width * (blob.placeX + field.pullX + blob.sway
      + wander * blob.driftX * Math.sin(seconds * blob.speedX * 6.283 + blob.phaseX));
    const y = height * (blob.placeY + field.pullY + blob.bob
      + wander * blob.driftY * Math.cos(seconds * blob.speedY * 6.283 + blob.phaseY));

    const swelling = 1
      + 0.08 * Math.sin(seconds * 0.55 + blob.breath)          // always breathing
      + family.swell * band.level * 0.6
      + family.punch * band.body
      + family.weight * heave * 0.5;                           // the bass, again
    const radius = reach * blob.radius * swelling * global;
    if (radius < 1) continue;

    // Presence: a family with nothing in its band sinks back into the dark
    // rather than sitting there lit, which is what keeps the mass reading as
    // the music instead of as decoration.
    const presence = family.floor
      + (1 - family.floor) * Math.min(1, band.level * 1.2 + band.punch);
    const core = light(family.lift + tone * 0.45 + band.punch * 0.3);
    const edge = light(family.lift * 0.4 + tone * 0.2);
    const inner = (0.70 * presence + 0.30 * band.punch).toFixed(3);
    const middle = (0.24 * presence + 0.36 * band.punch).toFixed(3);

    /* Drawn squashed and turned rather than as a circle, so a landing lands. */
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(blob.tilt);
    ctx.scale(blob.squashX, blob.squashY);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, `rgba(${core}, ${inner})`);
    gradient.addColorStop(0.45, `rgba(${edge}, ${middle})`);
    gradient.addColorStop(1, "rgba(0, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = "source-over";

  requestAnimationFrame(drawSlime);
}

function subscribeBeat() {
  const events = new EventSource("/api/stage/pulse/events");
  events.onmessage = (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      return;
    }
    // Unlike a kick, a grid is current state rather than a past event, so the
    // first frame after connecting is worth acting on.
    if (payload.seq === beat.seen) return;
    beat.seen = payload.seq;
    applyLevels(payload);
    applyGrid(payload);
  };
}

/* ---------- staying in sync ---------- */

function subscribe() {
  const events = new EventSource("/api/stage/events?role=stage");

  events.onmessage = (event) => {
    let state;
    try {
      state = JSON.parse(event.data);
    } catch (error) {
      return;
    }
    // Our own score report comes back round; do not act on it as a change.
    applyState(state);
    if (!stage.audioUnlocked && state.mode !== "idle") needsUnlock();
  };

  events.onerror = () => {
    // EventSource reconnects by itself; just say so while it is down.
    showStatus("Reconnecting to the operator…");
  };

  events.onopen = () => {
    // Only clear a "reconnecting" notice; a YouTube or audio warning stands.
    if (stage.audioUnlocked && $("#stage-status").textContent.startsWith("Reconnecting")) {
      hideStatus();
    }
  };
}

$("#waiting-hint").textContent = "Click anywhere once to enable sound, then leave this screen alone.";
buildSlime();
subscribeBeat();
subscribe();
