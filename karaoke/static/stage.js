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

   The waiting screen stays #141414 with cyan shapes drifting across it. Each
   is a soft radial gradient drawn additively, so where two overlap they brighten
   and fuse; blurred together by CSS they read as one organic mass rather than a
   handful of circles.

   Every blob follows its own pair of slow sines at frequencies that do not
   divide into each other, so the mass never visibly repeats.

   The blobs are not all listening to the same thing. A picture driven by the
   kick alone only moves a few times a bar and sits dead in between, which is
   exactly what makes it feel mechanical. So there are three families: heavy
   slow shapes that ride the bass and the beat grid, middling ones that swell
   with the vocal and the snare, and small quick ones that shimmer on the hats.
   Together they cover the whole record rather than one drum in it. */

const FAMILIES = [
  {
    band: "low",                       // kick and bass: the mass of the thing
    count: 3,
    radius: [0.26, 0.40],
    drift: [0.10, 0.24],
    speed: [0.010, 0.030],
    swell: 0.55,                       // how much the band opens it up
    core: "0, 255, 255",
    edge: "0, 236, 236",
    floor: 0.62,                       // never fades away entirely
  },
  {
    band: "mid",                       // voice, snare, guitars
    count: 4,
    radius: [0.13, 0.22],
    drift: [0.16, 0.34],
    speed: [0.028, 0.070],
    swell: 0.5,
    core: "120, 255, 255",
    edge: "0, 236, 236",
    floor: 0.22,
  },
  {
    band: "high",                      // hats and air: small, quick, bright
    count: 4,
    radius: [0.05, 0.11],
    drift: [0.20, 0.40],
    speed: [0.070, 0.150],
    swell: 0.8,
    core: "220, 255, 255",
    edge: "0, 255, 255",
    floor: 0.08,
  },
];

/* Two envelopes per hit: a punch that snaps and disappears, and a body that
   follows through. One envelope alone either smears (too slow to read as a
   beat) or flickers (too fast to look like slime); together they land like a
   drum and settle like liquid. */
const beat = {
  body: 0,        // drives size
  punch: 0,       // drives brightness
  seen: null,
  lastFire: 0,    // last swell
  period: 0,      // one beat, in milliseconds
  bpm: 0,
  nextAt: 0,      // when the next beat is due
  locked: false,
  lastGrid: 0,    // when the operator last reported a tempo
  lastReport: 0,  // when anything at all last arrived
  count: 0,
};

/* One envelope pair per band, alongside the beat's own.

   ``level`` follows the band's loudness and gives each family something to do
   between beats; ``hit`` catches the transients — a snare, a hat, a shouted
   line — that a level average would smooth away. Rises are followed quickly
   and falls slowly, so the shapes grow with the music and sink back rather
   than twitching. */
const bands = {
  low: { level: 0, target: 0, hit: 0, base: 0, decay: 0.86 },
  mid: { level: 0, target: 0, hit: 0, base: 0, decay: 0.82 },
  high: { level: 0, target: 0, hit: 0, base: 0, decay: 0.74 },
};

const BAND_ATTACK = 0.30;
const BAND_RELEASE = 0.07;

const clamp01 = (value) => Math.max(0, Math.min(1, value));

function applyLevels(payload) {
  beat.lastReport = performance.now();
  for (const name of ["low", "mid", "high"]) {
    const band = bands[name];
    band.target = clamp01((Number(payload[name]) || 0) / 100);
    const peak = clamp01((Number(payload[name + "_peak"]) || 0) / 100);

    // Judge a transient against what this band has been sitting at rather than
    // against a fixed threshold: one number cannot suit both a quiet ballad and
    // a mastered-loud dance track, and the second would simply stay lit.
    band.base = band.base ? band.base * 0.88 + band.target * 0.12 : band.target;
    const excess = (peak - band.base) / Math.max(band.base, 0.08);
    if (excess > 0.3) band.hit = Math.max(band.hit, Math.min(1, excess * 0.8));
  }
}

function advanceBands(now) {
  // Nothing reported for a moment: the music stopped, so let it all settle.
  const quiet = !beat.lastReport || now - beat.lastReport > 1200;
  for (const name of ["low", "mid", "high"]) {
    const band = bands[name];
    const target = quiet ? 0 : band.target;
    const rate = target > band.level ? BAND_ATTACK : BAND_RELEASE;
    band.level += (target - band.level) * rate;
    band.hit = band.hit < 0.01 ? 0 : band.hit * band.decay;
  }
}

const BODY_DECAY = 0.90;
const PUNCH_DECAY = 0.78;

/* Fire a fraction early. The swell takes a frame or two to reach its peak, so
   landing it exactly on the beat reads as slightly behind it. */
const BEAT_LEAD = 10;

function fire(strength) {
  const now = performance.now();
  if (now - beat.lastFire < 110) return;
  beat.lastFire = now;
  beat.body = Math.max(beat.body, strength);
  beat.punch = Math.max(beat.punch, strength);
}

/* Places the tempo grid the operator found.

   The laptop does not send individual kicks — it sends the tempo it is hearing
   plus how long ago the last strong onset happened. Only the age can travel:
   the two pages run on unrelated clocks, so a timestamp from one is meaningless
   in the other. From an age we can reconstruct where the beat sits on our own
   clock, and from the tempo we know where every beat after it sits too, so the
   animation runs off the grid and never waits for a message to arrive. */
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

  const anchorAt = now - (Number(payload.anchor_age) || 0) - BEAT_LEAD;
  // Walk the anchor forward to the first beat still ahead of us.
  const target = anchorAt + Math.ceil((now - anchorAt) / period) * period;

  if (!beat.locked) {
    beat.nextAt = target;
    beat.locked = true;
    return;
  }

  // Already running: ease onto the reported grid rather than jumping to it, so
  // a single noisy report cannot make the picture stutter. Phase is circular,
  // so fold the error into the nearest half period first — otherwise a beat
  // reported one slot over looks like a whole period of error.
  let error = target - beat.nextAt;
  while (error > period / 2) error -= period;
  while (error < -period / 2) error += period;
  if (Math.abs(error) > period * 0.3) {
    beat.nextAt = target;                       // a real change: new song, new tempo
  } else {
    beat.nextAt += error * 0.25;
  }
}

function advanceBeat(now) {
  // No fresh report for a moment means the music stopped, or the tempo was
  // lost: stop predicting rather than beating on over silence.
  if (beat.locked && now - beat.lastGrid > 2500) beat.locked = false;
  if (!beat.locked || !beat.period) return;

  if (now >= beat.nextAt) {
    // Every fourth beat swells harder, which is what makes a bar read as a bar
    // instead of a metronome.
    beat.count += 1;
    fire(beat.count % 4 === 1 ? 1 : 0.82);
    beat.nextAt += beat.period;
    // If we ever fall a long way behind, rejoin the grid rather than catching up.
    if (now - beat.nextAt > beat.period) beat.nextAt = now + beat.period;
  }
}
const slime = { canvas: null, ctx: null, blobs: [], width: 0, height: 0 };

// Rendered well below screen resolution: it is blurred past recognition
// anyway, and a full-size canvas repainted every frame is wasted work.
const SLIME_SCALE = 0.5;

const random = (min, max) => min + Math.random() * (max - min);

function buildSlime() {
  slime.canvas = $("#slime");
  slime.ctx = slime.canvas.getContext("2d");

  // Every family drawn from its own ranges, so a bass shape is unmistakably
  // heavier and slower than a hat shape even before either of them moves.
  slime.blobs = FAMILIES.flatMap((family) =>
    Array.from({ length: family.count }, () => ({
      family,
      homeX: random(0.1, 0.9),
      homeY: random(0.1, 0.9),
      driftX: random(family.drift[0], family.drift[1]),
      driftY: random(family.drift[0], family.drift[1]) * 0.9,
      // Deliberately unrelated speeds, so the paths never fall into step.
      speedX: random(family.speed[0], family.speed[1]),
      speedY: random(family.speed[0], family.speed[1]) * 0.85,
      phaseX: random(0, Math.PI * 2),
      phaseY: random(0, Math.PI * 2),
      radius: random(family.radius[0], family.radius[1]),
      breath: random(0, Math.PI * 2),
    })),
  );

  sizeSlime();
  window.addEventListener("resize", sizeSlime);
  requestAnimationFrame(drawSlime);
}

function sizeSlime() {
  slime.width = Math.max(1, Math.round(window.innerWidth * SLIME_SCALE));
  slime.height = Math.max(1, Math.round(window.innerHeight * SLIME_SCALE));
  slime.canvas.width = slime.width;
  slime.canvas.height = slime.height;
}

function drawSlime(now) {
  advanceBeat(now);
  advanceBands(now);
  beat.body = beat.body < 0.01 ? 0 : beat.body * BODY_DECAY;
  beat.punch = beat.punch < 0.01 ? 0 : beat.punch * PUNCH_DECAY;

  // What each family is answering to. The bass family takes the larger of the
  // beat grid and the band itself: the grid keeps it in time when the tracker
  // has the tempo, the band keeps it alive when it does not.
  const drive = {
    low: { level: Math.max(beat.body, bands.low.level * 0.85), punch: Math.max(beat.punch, bands.low.hit) },
    mid: { level: bands.mid.level, punch: bands.mid.hit },
    high: { level: bands.high.level, punch: bands.high.hit },
  };

  const { ctx, width, height } = slime;
  const seconds = now / 1000;
  const reach = Math.min(width, height);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, width, height);

  // Additive, so overlaps brighten into one body instead of stacking edges.
  ctx.globalCompositeOperation = "lighter";
  for (const blob of slime.blobs) {
    const family = blob.family;
    const { level, punch } = drive[family.band];

    const x = width * (blob.homeX + blob.driftX * Math.sin(seconds * blob.speedX * 6.283 + blob.phaseX));
    const y = height * (blob.homeY + blob.driftY * Math.cos(seconds * blob.speedY * 6.283 + blob.phaseY));
    const swell = 1 + 0.09 * Math.sin(seconds * 0.55 + blob.breath)
      + family.swell * (level * 0.55 + punch * 0.75);
    const radius = reach * blob.radius * swell;
    if (radius < 1) continue;

    // Presence: a family with nothing in its band sinks back into the dark
    // rather than sitting there lit, which is what keeps the mass reading as
    // the music instead of as decoration.
    const presence = family.floor + (1 - family.floor) * Math.min(1, level * 1.2 + punch);
    const inner = (0.72 * presence + 0.28 * punch).toFixed(3);
    const middle = (0.26 * presence + 0.38 * punch).toFixed(3);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${family.core}, ${inner})`);
    gradient.addColorStop(0.45, `rgba(${family.edge}, ${middle})`);
    gradient.addColorStop(1, "rgba(0, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
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
