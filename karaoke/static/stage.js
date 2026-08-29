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
   divide into each other, so the mass never visibly repeats. The music arrives
   as bass kicks found on the operator's laptop and pushed here: each one swells
   the blobs and lifts their colour, then drains away, which is what makes the
   whole thing look like it is breathing in time. */

const BLOB_COUNT = 7;
const beat = { level: 0, seen: null };
const slime = { canvas: null, ctx: null, blobs: [], width: 0, height: 0 };

// Rendered well below screen resolution: it is blurred past recognition
// anyway, and a full-size canvas repainted every frame is wasted work.
const SLIME_SCALE = 0.5;

const random = (min, max) => min + Math.random() * (max - min);

function buildSlime() {
  slime.canvas = $("#slime");
  slime.ctx = slime.canvas.getContext("2d");

  slime.blobs = Array.from({ length: BLOB_COUNT }, () => ({
    homeX: random(0.1, 0.9),
    homeY: random(0.1, 0.9),
    driftX: random(0.14, 0.34),
    driftY: random(0.12, 0.3),
    // Deliberately unrelated speeds, so the paths never fall into step.
    speedX: random(0.017, 0.049),
    speedY: random(0.013, 0.043),
    phaseX: random(0, Math.PI * 2),
    phaseY: random(0, Math.PI * 2),
    radius: random(0.19, 0.34),
    breath: random(0, Math.PI * 2),
  }));

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
  // A kick lands hard and drains away before the next one.
  beat.level = beat.level < 0.01 ? 0 : beat.level * 0.93;
  const kick = beat.level;

  const { ctx, width, height } = slime;
  const seconds = now / 1000;
  const reach = Math.min(width, height);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, width, height);

  // Additive, so overlaps brighten into one body instead of stacking edges.
  ctx.globalCompositeOperation = "lighter";
  for (const blob of slime.blobs) {
    const x = width * (blob.homeX + blob.driftX * Math.sin(seconds * blob.speedX * 6.283 + blob.phaseX));
    const y = height * (blob.homeY + blob.driftY * Math.cos(seconds * blob.speedY * 6.283 + blob.phaseY));
    const swell = 1 + 0.09 * Math.sin(seconds * 0.55 + blob.breath) + 0.4 * kick;
    const radius = reach * blob.radius * swell;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(0, 255, 255, ${(0.78 + 0.22 * kick).toFixed(3)})`);
    gradient.addColorStop(0.45, `rgba(0, 236, 236, ${(0.34 + 0.26 * kick).toFixed(3)})`);
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
    // The first frame is whatever was last sent before we connected: history,
    // not a beat, so adopt it rather than surging on a kick already past.
    if (beat.seen === null) {
      beat.seen = payload.seq;
      return;
    }
    if (payload.seq === beat.seen) return;
    beat.seen = payload.seq;
    beat.level = Math.max(beat.level, Math.min(1, (payload.intensity || 0) / 100));
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
