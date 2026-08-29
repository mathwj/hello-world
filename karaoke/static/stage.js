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
subscribe();
