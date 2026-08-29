/* The audience screen.

   Subscribes to the stage state over server-sent events and mirrors it: play
   the karaoke video, play the YouTube video, or show the waiting screen. It
   holds no state of its own beyond what it is told, so the operator's laptop
   stays the single source of truth. */

const video = $("#stage-video");
const waiting = $("#waiting");
const surface = $("#surface");
const musicFrame = $("#stage-music");
const scoreHost = $("#score-host");

const stage = {
  applied: null,       // last state we acted on, to spot what actually changed
  audioUnlocked: false,
  yt: null,            // the YouTube player, once its API has loaded
  ytReady: false,
  pendingMusic: null,  // a video asked for before the API finished loading
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

/* ---------- YouTube ---------- */

window.onYouTubeIframeAPIReady = () => {
  stage.yt = new YT.Player("yt-player", {
    height: "100%",
    width: "100%",
    playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
    events: {
      onReady: () => {
        stage.ytReady = true;
        if (stage.pendingMusic) {
          const pending = stage.pendingMusic;
          stage.pendingMusic = null;
          startMusic(pending.videoId, pending.volume, pending.playing);
        }
      },
    },
  });
};

function loadYouTubeApi() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  tag.onerror = () => showStatus("Could not reach YouTube — music playback is unavailable.");
  document.head.appendChild(tag);

  // A blocked request does not always fire onerror — it can simply never
  // resolve — which would leave a music track showing a caption over a black
  // screen with no explanation. Say something either way.
  setTimeout(() => {
    if (!stage.ytReady) {
      showStatus("The YouTube player did not load — check this screen's internet connection.");
    }
  }, 10000);
}

function startMusic(videoId, volume, playing) {
  if (!stage.ytReady || !stage.yt) {
    stage.pendingMusic = { videoId, volume, playing };
    return;
  }
  stage.yt.loadVideoById(videoId);
  stage.yt.setVolume(volume);
  if (!playing) stage.yt.pauseVideo();
}

function stopMusic() {
  if (stage.ytReady && stage.yt) stage.yt.stopVideo();
  stage.pendingMusic = null;
}

/* ---------- applying state ---------- */

function showWaiting(state) {
  surface.hidden = true;
  musicFrame.hidden = true;
  scoreHost.hidden = true;
  waiting.hidden = false;
  video.pause();
  video.removeAttribute("src");
  video.load();
  stopMusic();
  $("#waiting-sub").textContent = state && state.score
    ? "Who is next?"
    : "Waiting for the next singer…";
}

function applyKaraoke(state, restarted) {
  waiting.hidden = true;
  musicFrame.hidden = true;
  surface.hidden = false;
  stopMusic();

  const src = `/media/${encodeURIComponent(state.karaoke.name)}`;
  if (restarted || !video.currentSrc.endsWith(encodeURIComponent(state.karaoke.name))) {
    scoreHost.hidden = true;
    hideScore();
    video.src = src;
    video.currentTime = 0;
  }
  video.volume = Math.max(0, Math.min(1, state.volume.karaoke / 100));

  if (state.playing) {
    video.play().catch(() => needsUnlock());
  } else {
    video.pause();
  }
}

function applyMusic(state, restarted) {
  waiting.hidden = true;
  surface.hidden = false;
  musicFrame.hidden = false;
  scoreHost.hidden = true;
  video.pause();
  $("#music-title").textContent = state.music.title || "";

  if (restarted) {
    startMusic(state.music.video_id, state.volume.music, state.playing);
  } else if (stage.ytReady && stage.yt) {
    stage.yt.setVolume(state.volume.music);
    if (state.playing) stage.yt.playVideo();
    else stage.yt.pauseVideo();
  }
}

function applyState(state, force = false) {
  const previous = stage.applied;
  const restarted = force || !previous || previous.nonce !== state.nonce;
  stage.applied = state;

  // Volume always applies, whatever mode we are in — the mixer must stay live.
  video.volume = Math.max(0, Math.min(1, state.volume.karaoke / 100));
  if (stage.ytReady && stage.yt) stage.yt.setVolume(state.volume.music);

  if (state.mode === "karaoke" && state.karaoke) {
    applyKaraoke(state, restarted);
  } else if (state.mode === "music" && state.music) {
    applyMusic(state, restarted);
  } else {
    showWaiting(state);
  }
}

/* ---------- the song ending ---------- */

video.addEventListener("ended", () => {
  scoreHost.hidden = false;
  showScore((score, rank) => {
    // Tell the operator what the room just saw.
    fetch("/api/stage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: { value: score, rank }, playing: false }),
    }).catch(() => {});
  });
});

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
loadYouTubeApi();
subscribe();
