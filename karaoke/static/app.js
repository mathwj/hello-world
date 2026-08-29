/* The operator's console.

   Nothing plays here. The laptop searches, downloads and decides; the stage
   screen does the playing. Every playback control posts to /api/stage, and the
   stage mirrors that state over server-sent events. */

const $ = (sel) => document.querySelector(sel);

const state = {
  results: [],        // last karaoke search, re-rendered when the library changes
  music: [],          // last music search
  library: [],
  jobs: [],
  queued: new Set(),  // video ids queued this session, to disable their buttons
  stage: null,        // the stage's last reported state
  watching: null,     // the video playing on the music page
  player: null,       // the YouTube player, once its API has loaded
  playerReady: false,
  pendingVideo: null, // asked for before the player finished loading
  ytApi: null,
  pollTimer: null,
  volumeTimer: null,
  // One fade per channel: where it came from, and the animation in flight.
  fades: {
    karaoke: { faded: false, restore: 85, frame: null },
    music: { faded: false, restore: 60, frame: null },
  },
};

/* ---------- helpers ---------- */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
}

function formatViews(count) {
  if (count === null || count === undefined) return "";
  const round = (value) => value.toFixed(1).replace(/\.0$/, "");
  if (count >= 1e9) return `${round(count / 1e9)}B views`;
  if (count >= 1e6) return `${round(count / 1e6)}M views`;
  if (count >= 1e3) return `${round(count / 1e3)}K views`;
  return `${count} view${count === 1 ? "" : "s"}`;
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

let toastTimer = null;
function toast(message, isError = false) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.toggle("is-error", isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3800);
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

const postJson = (url, body) =>
  api(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

/* ---------- tabs ---------- */

function showTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === name);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `panel-${name}`);
  });
  if (name === "library") loadLibrary();
  // The embedded browser breaks out of the page's reading width.
  document.body.classList.toggle("is-browsing", IS_DESKTOP && name === "music");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
});

/* ---------- karaoke search ---------- */

function searchCard(result) {
  const downloaded = state.library.some((song) => song.video_id === result.video_id);
  const queued = state.queued.has(result.video_id);
  let label = "Download";
  if (downloaded) label = "Downloaded";
  else if (queued) label = "Queued…";

  return `
    <article class="card">
      <div class="card-thumb">
        <img src="${escapeHtml(result.thumbnail)}" alt="" loading="lazy">
        <span class="card-duration">${escapeHtml(result.duration_label)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(result.title)}</h3>
        <p class="card-meta">${escapeHtml(formatViews(result.view_count))}</p>
        <div class="card-actions">
          <button class="btn btn-primary" data-download="${escapeHtml(result.video_id)}"
                  data-title="${escapeHtml(result.title)}"
                  data-thumb="${escapeHtml(result.thumbnail)}"
                  ${downloaded || queued ? "disabled" : ""}>${label}</button>
        </div>
      </div>
    </article>`;
}

function renderSearch(results) {
  state.results = results;
  $("#search-results").innerHTML = results.map(searchCard).join("");
  $("#search-empty").hidden = results.length > 0;
  if (!results.length) $("#search-empty").textContent = "No karaoke versions found. Try different words.";
}

$("#search-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const term = $("#search-input").value.trim();
  if (!term) return;

  const button = event.target.querySelector("button");
  button.disabled = true;
  button.textContent = "Searching…";
  $("#search-empty").hidden = true;
  $("#search-results").innerHTML = "";
  $("#search-hint").textContent = `Searching YouTube for “${term} karaoke”…`;

  try {
    await loadLibrary();                       // so we can mark songs already owned
    const data = await api(`/api/search?q=${encodeURIComponent(term)}&limit=24`);
    $("#search-hint").textContent = `Showing karaoke results for “${data.query}”.`;
    renderSearch(data.results);
  } catch (error) {
    $("#search-hint").textContent = "Search failed.";
    $("#search-empty").hidden = false;
    $("#search-empty").textContent = error.message;
    toast(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "Search karaoke";
  }
});

$("#search-results").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-download]");
  if (!button) return;

  button.disabled = true;
  button.textContent = "Queued…";
  state.queued.add(button.dataset.download);

  try {
    await postJson("/api/downloads", {
      video_id: button.dataset.download,
      title: button.dataset.title,
      thumbnail: button.dataset.thumb,
    });
    toast(`Downloading “${button.dataset.title}”`);
    pollJobs();
  } catch (error) {
    state.queued.delete(button.dataset.download);
    button.disabled = false;
    button.textContent = "Download";
    toast(error.message, true);
  }
});

/* ---------- music search (unrestricted) ---------- */

function musicCard(result) {
  return `
    <article class="card">
      <div class="card-thumb">
        <img src="${escapeHtml(result.thumbnail)}" alt="" loading="lazy">
        <span class="card-duration">${escapeHtml(result.duration_label)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(result.title)}</h3>
        <p class="card-meta">${escapeHtml(result.channel)}</p>
        <div class="card-actions">
          <button class="btn btn-primary" data-watch="${escapeHtml(result.video_id)}">Play</button>
        </div>
      </div>
    </article>`;
}

$("#music-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const term = $("#music-input").value.trim();
  if (!term) return;

  const button = event.target.querySelector("button");
  button.disabled = true;
  button.textContent = "Searching…";
  $("#music-empty").hidden = true;
  $("#music-results").innerHTML = "";

  try {
    const data = await api(`/api/search?mode=music&q=${encodeURIComponent(term)}&limit=24`);
    state.music = data.results;
    $("#music-results").innerHTML = data.results.map(musicCard).join("");
    $("#music-hint").textContent = `Results for “${data.query}”. Plays on the stage screen.`;
    $("#music-empty").hidden = data.results.length > 0;
  } catch (error) {
    $("#music-empty").hidden = false;
    $("#music-empty").textContent = error.message;
    toast(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "Search";
  }
});

/* In the desktop build the Music page is a real browser view of youtube.com —
   logged in, with YouTube's own interface. A browser tab cannot do that, since
   youtube.com answers with X-Frame-Options: SAMEORIGIN, so this is the one
   thing the Electron shell exists for. Run it with ./run-desktop.sh. */
const IS_DESKTOP = navigator.userAgent.includes("Electron");

function setUpYouTubeView() {
  const panel = $("#panel-music");
  panel.classList.add("is-browser");
  panel.innerHTML = `
    <div class="yt-bar">
      <button class="btn btn-ghost" id="yt-back" title="Back">&larr;</button>
      <button class="btn btn-ghost" id="yt-forward" title="Forward">&rarr;</button>
      <button class="btn btn-ghost" id="yt-reload" title="Reload">&#8635;</button>
      <button class="btn btn-ghost" id="yt-home">YouTube</button>
      <span class="yt-url" id="yt-url"></span>
    </div>
    <webview id="yt-view" src="https://www.youtube.com"
             partition="persist:youtube" allowpopups></webview>`;

  const view = $("#yt-view");
  $("#yt-back").addEventListener("click", () => view.canGoBack() && view.goBack());
  $("#yt-forward").addEventListener("click", () => view.canGoForward() && view.goForward());
  $("#yt-reload").addEventListener("click", () => view.reload());
  $("#yt-home").addEventListener("click", () => view.loadURL("https://www.youtube.com"));

  const showUrl = () => { $("#yt-url").textContent = view.getURL(); };
  // YouTube swaps the video element on every navigation, so the fader has to be
  // re-applied rather than set once.
  const reapply = () => { showUrl(); applyMusicVolume(Number($("#vol-music").value)); };
  view.addEventListener("did-navigate", reapply);
  view.addEventListener("did-navigate-in-page", reapply);
  view.addEventListener("media-started-playing", reapply);
  view.addEventListener("did-finish-load", reapply);
}

/* Sets the volume of whatever is playing inside the embedded browser. */
function applyMusicVolume(value) {
  const view = $("#yt-view");
  if (!view || typeof view.executeJavaScript !== "function") return;
  view
    .executeJavaScript(
      `document.querySelectorAll("video").forEach((v) => { v.volume = ${value / 100}; });`,
    )
    .catch(() => {});
}

/* The music player, here on the operator's laptop.

   youtube.com cannot be put in a frame — it answers with
   X-Frame-Options: SAMEORIGIN, so browsers refuse — but its /embed/ player can,
   and that is the real YouTube player with YouTube's own controls. Search,
   pasted links and channel browsing wrap around it; "Browse YouTube ↗" opens
   the actual site in its own window for anything this cannot reach.

   It plays here rather than on the stage: both windows are on the same Mac and
   so the same speakers, and this way the audience screen stays on the karaoke. */

function ytApi() {
  if (state.ytApi) return state.ytApi;
  state.ytApi = new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve();
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = () => reject(new Error("blocked"));
    document.head.appendChild(tag);
    // A blocked request does not reliably fire onerror, it can just hang.
    setTimeout(() => reject(new Error("timed out")), 10000);
  });
  return state.ytApi;
}

async function ensurePlayer() {
  await ytApi();
  if (state.player) return state.player;
  state.player = new YT.Player("yt-player", {
    height: "100%",
    width: "100%",
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: (event) => {
        state.playerReady = true;
        event.target.setVolume(Number($("#vol-music").value));
        if (state.pendingVideo) {
          event.target.loadVideoById(state.pendingVideo);
          state.pendingVideo = null;
        }
      },
      onStateChange: renderMusicBar,
    },
  });
  return state.player;
}

/* Without the API there is no volume control, but there is still a player. */
function fallbackPlayer(videoId) {
  const host = $("#yt-player");
  host.outerHTML = `<iframe id="yt-player" title="YouTube"
      src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0"
      allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  $("#watch-note").textContent =
    "The YouTube API did not load, so the Music fader cannot control this — use the player's own volume.";
}

async function playMusic(result) {
  state.watching = result;
  $("#music-browse").hidden = true;
  $("#music-watch").hidden = false;
  $("#watch-title").textContent = result.title;
  $("#watch-channel").textContent = [result.channel, result.duration_label]
    .filter((part) => part && part !== "--:--").join(" · ");
  $("#watch-more").innerHTML = "";
  $("#watch-more-head").hidden = true;
  $("#watch-note").textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (result.lookup_error) toast(result.lookup_error, true);

  try {
    const player = await ensurePlayer();
    if (state.playerReady) player.loadVideoById(result.video_id);
    else state.pendingVideo = result.video_id;
  } catch (error) {
    fallbackPlayer(result.video_id);
  }
  renderMusicBar();
  loadMoreFrom(result.channel);
}

function stopMusic() {
  if (state.player && state.playerReady) state.player.stopVideo();
  state.watching = null;
  state.pendingVideo = null;
  $("#music-watch").hidden = true;
  $("#music-browse").hidden = false;
  renderMusicBar();
}

/* Keeps browsing going the way related videos would on YouTube itself. */
async function loadMoreFrom(channel) {
  if (!channel) return;
  try {
    const data = await api(`/api/search?mode=music&q=${encodeURIComponent(channel)}&limit=12`);
    const others = data.results.filter((r) => r.video_id !== (state.watching || {}).video_id);
    if (!others.length) return;
    $("#watch-more-head").textContent = `More from ${channel}`;
    $("#watch-more-head").hidden = false;
    $("#watch-more").innerHTML = others.map(musicCard).join("");
  } catch (error) {
    /* browsing on is a bonus; failing to find more is not worth a toast */
  }
}

/* The music keeps playing while the operator works in other tabs, so its
   controls live in a bar of their own rather than inside the Music page. */
function renderMusicBar() {
  const live = Boolean(state.watching);
  $("#musicbar").hidden = !live;
  if (!live) return;
  $("#music-now-title").textContent = state.watching.title;
  const playing = state.player && state.playerReady
    && state.player.getPlayerState && state.player.getPlayerState() === 1;
  $("#music-toggle").textContent = playing ? "Pause" : "Resume";
}

function onMusicGridClick(event) {
  const button = event.target.closest("[data-watch]");
  if (!button) return;
  const card = button.closest(".card");
  playMusic({
    video_id: button.dataset.watch,
    title: card.querySelector(".card-title").textContent,
    channel: (card.querySelector(".card-meta") || {}).textContent || "",
    duration_label: (card.querySelector(".card-duration") || {}).textContent || "",
  });
}

$("#music-results").addEventListener("click", onMusicGridClick);
$("#watch-more").addEventListener("click", onMusicGridClick);

$("#watch-back").addEventListener("click", () => {
  // Back to browsing, but the music carries on — that is the point of it.
  $("#music-watch").hidden = true;
  $("#music-browse").hidden = false;
});

$("#music-toggle").addEventListener("click", () => {
  if (!state.player || !state.playerReady) return;
  if (state.player.getPlayerState() === 1) state.player.pauseVideo();
  else state.player.playVideo();
  setTimeout(renderMusicBar, 200);
});

$("#music-stop").addEventListener("click", stopMusic);

$("#music-paste-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const raw = $("#music-url").value.trim();
  if (!raw) return;
  const button = event.target.querySelector("button");
  button.disabled = true;
  button.textContent = "Opening…";
  try {
    const result = await api(`/api/music/resolve?url=${encodeURIComponent(raw)}`);
    $("#music-url").value = "";
    playMusic(result);
  } catch (error) {
    toast(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "Open";
  }
});

/* ---------- downloads ---------- */

function jobRow(job) {
  const percent = Math.min(100, Math.max(0, job.progress || 0));
  let status = `${percent}%`;
  let cls = "";
  if (job.status === "queued") status = "Waiting…";
  if (job.status === "downloading" && job.total_bytes) {
    status = `${percent}% of ${formatBytes(job.total_bytes)}`;
  }
  if (job.status === "done") { status = "Ready to sing"; cls = "is-done"; }
  if (job.status === "failed") { status = job.error || "Failed"; cls = "is-failed"; }

  return `
    <div class="job">
      <div class="job-title">${escapeHtml(job.title)}</div>
      <div class="job-status ${cls}">${escapeHtml(status)}</div>
      <div class="bar"><span style="width:${job.status === "done" ? 100 : percent}%"></span></div>
    </div>`;
}

function renderJobs() {
  $("#download-list").innerHTML = state.jobs.map(jobRow).join("");
  $("#downloads-empty").hidden = state.jobs.length > 0;
  const active = state.jobs.filter((job) => job.status === "queued" || job.status === "downloading");
  $("#download-count").textContent = active.length;
}

async function pollJobs() {
  try {
    const previous = new Map(state.jobs.map((job) => [job.id, job.status]));
    const data = await api("/api/downloads");
    state.jobs = data.jobs;
    renderJobs();

    for (const job of state.jobs) {
      const was = previous.get(job.id);
      if (was && was !== job.status && job.status === "done") {
        toast(`“${job.title}” is ready`);
        loadLibrary();
      }
      if (was && was !== job.status && job.status === "failed") {
        toast(`“${job.title}” failed: ${job.error}`, true);
      }
    }

    const busy = state.jobs.some((job) => job.status === "queued" || job.status === "downloading");
    clearTimeout(state.pollTimer);
    state.pollTimer = setTimeout(pollJobs, busy ? 1000 : 5000);
  } catch (error) {
    clearTimeout(state.pollTimer);
    state.pollTimer = setTimeout(pollJobs, 5000);
  }
}

$("#clear-downloads").addEventListener("click", async () => {
  await api("/api/downloads", { method: "DELETE" }).catch(() => ({}));
  pollJobs();
});

/* ---------- library ---------- */

/* The library is a set list, not a shop window: rows scan faster than tiles
   when you are looking for the one song somebody just asked for. */
function libraryRow(song) {
  const thumb = song.thumbnail
    ? `<img src="/media/${encodeURIComponent(song.thumbnail)}" alt="" loading="lazy">`
    : "";
  const onStage = state.stage
    && state.stage.mode === "karaoke"
    && state.stage.karaoke
    && state.stage.karaoke.name === song.name;

  return `
    <article class="song${onStage ? " is-live" : ""}">
      <div class="song-thumb">${thumb}</div>
      <div class="song-main">
        <h3 class="song-title">${escapeHtml(song.title)}</h3>
        ${onStage ? '<span class="song-live">On stage</span>' : ""}
      </div>
      <span class="song-time">${escapeHtml(song.duration_label)}</span>
      <div class="song-actions">
        <button class="btn btn-primary" data-play="${escapeHtml(song.name)}"
                data-title="${escapeHtml(song.title)}">Play on stage</button>
        <button class="btn btn-danger" data-delete="${escapeHtml(song.name)}"
                data-title="${escapeHtml(song.title)}">Delete</button>
      </div>
    </article>`;
}

function renderLibrary() {
  const filter = $("#library-filter").value.trim().toLowerCase();
  const songs = filter
    ? state.library.filter((song) => song.title.toLowerCase().includes(filter))
    : state.library;

  $("#library-results").innerHTML = songs.map(libraryRow).join("");
  $("#library-count").textContent = state.library.length;
  $("#library-empty").hidden = songs.length > 0;
  $("#library-empty").textContent = state.library.length
    ? "No songs match that filter."
    : "No songs downloaded yet.";
}

async function loadLibrary() {
  try {
    const data = await api("/api/library");
    state.library = data.songs;
    $("#library-path").textContent = `Saved in ${data.download_dir}`;
    renderLibrary();
    // A finished download turns a "Queued…" search card into "Downloaded".
    if (state.results.length) renderSearch(state.results);
  } catch (error) {
    toast(error.message, true);
  }
}

$("#library-filter").addEventListener("input", renderLibrary);

$("#library-results").addEventListener("click", async (event) => {
  const play = event.target.closest("[data-play]");
  if (play) {
    try {
      await postJson("/api/stage/karaoke", { name: play.dataset.play, title: play.dataset.title });
      toast(`“${play.dataset.title}” is on the stage`);
      if (!state.stage || !state.stage.viewers) {
        toast("No stage screen is connected — open the Stage link.", true);
      }
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }

  const remove = event.target.closest("[data-delete]");
  if (!remove) return;
  if (!confirm(`Delete “${remove.dataset.title}” from your Mac?`)) return;

  try {
    await api(`/api/library/${encodeURIComponent(remove.dataset.delete)}`, { method: "DELETE" });
    toast("Deleted");
    loadLibrary();
  } catch (error) {
    toast(error.message, true);
  }
});

/* ---------- the mixer ---------- */

function sendVolume() {
  const volume = {
    karaoke: Number($("#vol-karaoke").value),
    music: Number($("#vol-music").value),
  };
  postJson("/api/stage", { volume }).catch(() => {});
}

function faderFor(channel) {
  return channel === "karaoke" ? $("#vol-karaoke") : $("#vol-music");
}

function readoutFor(channel) {
  return channel === "karaoke" ? $("#vol-karaoke-out") : $("#vol-music-out");
}

/* The music plays on this machine, so it responds without a round trip; the
   karaoke has to reach the stage, which is what sendVolume() is for. */
function applyLocally(channel, value) {
  if (channel !== "music") return;
  if (IS_DESKTOP) applyMusicVolume(value);
  else if (state.player && state.playerReady) state.player.setVolume(value);
}

function setChannel(channel, value) {
  faderFor(channel).value = value;
  readoutFor(channel).textContent = value;
  applyLocally(channel, value);
}

function updateFadeButton(channel) {
  const button = channel === "karaoke" ? $("#fade-karaoke") : $("#fade-music");
  const faded = state.fades[channel].faded;
  const what = channel === "karaoke" ? "karaoke" : "music";
  button.classList.toggle("is-faded", faded);
  button.innerHTML = faded ? "&#9650;" : "&#9660;";
  const label = faded ? `Bring the ${what} back up` : `Fade the ${what} out`;
  button.title = label;
  button.setAttribute("aria-label", label);
}

const FADE_MS = 1200;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* Rides the fader down to silence, or back to where it was.

   The karaoke goes as a single instruction — target and duration — because the
   stage performs the ramp itself; streaming a dozen volume updates across the
   network put the room's audio at the mercy of request timing, and it audibly
   jumped. The music plays on this machine, so it is ridden here. The slider
   animates locally either way, which is only cosmetic. */
function toggleFade(channel) {
  const fade = state.fades[channel];
  if (fade.frame) cancelAnimationFrame(fade.frame);

  const from = Number(faderFor(channel).value);
  if (!fade.faded && from > 0) fade.restore = from;
  const to = fade.faded ? fade.restore : 0;
  fade.faded = !fade.faded;
  updateFadeButton(channel);

  // Proportional, so a short fade does not crawl at the same pace as a long one.
  const duration = Math.max(200, FADE_MS * (Math.abs(to - from) / 100));

  if (channel === "karaoke") {
    // The id must be new to the stage, and the stage remembers the last one it
    // saw across page loads. A per-page counter restarts at 1 and gets ignored
    // as already-seen, which lands as an instant cut instead of a fade.
    postJson("/api/stage", {
      volume: { karaoke: to },
      fade: { to, ms: duration, id: Date.now() },
    }).catch(() => {});
  }

  const started = performance.now();
  function step(now) {
    const t = Math.min(1, (now - started) / duration);
    const value = Math.round(from + (to - from) * easeInOut(t));
    faderFor(channel).value = value;
    readoutFor(channel).textContent = value;
    applyLocally(channel, value);

    if (t < 1) {
      fade.frame = requestAnimationFrame(step);
    } else {
      fade.frame = null;
      if (channel === "music") sendVolume();   // karaoke already sent its target
    }
  }
  fade.frame = requestAnimationFrame(step);
}

document.querySelectorAll(".fade-btn").forEach((button) => {
  button.addEventListener("click", () => toggleFade(button.dataset.channel));
});

function onFaderMoved(event) {
  const channel = event.target.id === "vol-music" ? "music" : "karaoke";
  const value = Number(event.target.value);
  const fade = state.fades[channel];

  // Touching the fader takes the channel back off the fade button.
  if (fade.frame) {
    cancelAnimationFrame(fade.frame);
    fade.frame = null;
  }
  if (value > 0) fade.restore = value;
  if (fade.faded !== (value === 0)) {
    fade.faded = value === 0;
    updateFadeButton(channel);
  }

  readoutFor(channel).textContent = value;
  applyLocally(channel, value);
  // Coalesce the flood of input events a dragged slider produces. Both faders
  // are stored server-side so a reloaded page comes back where it was.
  clearTimeout(state.volumeTimer);
  state.volumeTimer = setTimeout(sendVolume, 60);
}

$("#vol-karaoke").addEventListener("input", onFaderMoved);
$("#vol-music").addEventListener("input", onFaderMoved);

/* ---------- now playing ---------- */

$("#now-toggle").addEventListener("click", () => {
  if (!state.stage) return;
  postJson("/api/stage", { playing: !state.stage.playing }).catch((e) => toast(e.message, true));
});

$("#now-stop").addEventListener("click", () => {
  api("/api/stage/stop", { method: "POST" }).catch((e) => toast(e.message, true));
});

function renderStage(next) {
  const previous = state.stage;
  state.stage = next;

  const connected = next.viewers > 0;
  $("#stage-dot").classList.toggle("is-on", connected);
  $("#stage-label").textContent = connected ? "Stage ready" : "Open stage";
  $("#stage-link").title = connected
    ? "A stage screen is connected"
    : "No stage screen — click to open one on the second display";

  // Faders follow the stage, so a second operator window cannot fight this one.
  for (const channel of ["karaoke", "music"]) {
    const input = faderFor(channel);
    if (document.activeElement === input || state.fades[channel].frame) continue;
    const level = next.volume[channel];
    input.value = level;
    readoutFor(channel).textContent = level;
    // Keep the button honest: after a reload onto a channel that is already
    // silent, it has to offer to bring it back, not to fade it again.
    const fade = state.fades[channel];
    if (fade.faded !== (level === 0)) {
      fade.faded = level === 0;
      updateFadeButton(channel);
    }
    if (level > 0) fade.restore = level;
  }

  const live = next.mode === "karaoke" && next.karaoke;
  $("#nowbar").hidden = !live;
  if (live) {
    $("#now-title").textContent = next.karaoke.title;
    $("#now-toggle").textContent = next.playing ? "Pause" : "Resume";
  }

  const score = next.score;
  $("#now-score").hidden = !score;
  if (score) $("#now-score").textContent = `Scored ${score.value} — ${score.rank}`;
  if (score && (!previous || !previous.score)) toast(`Score: ${score.value}`);

  // "On stage" badges in the library follow whatever is playing.
  if (!previous || previous.mode !== next.mode
      || JSON.stringify(previous.karaoke) !== JSON.stringify(next.karaoke)) {
    renderLibrary();
  }
}

function subscribeToStage() {
  const events = new EventSource("/api/stage/events?role=operator");
  events.onmessage = (event) => {
    try {
      renderStage(JSON.parse(event.data));
    } catch (error) {
      /* ignore a malformed frame; the next one will be along shortly */
    }
  };
}

/* ---------- boot ---------- */

if (IS_DESKTOP) setUpYouTubeView();
loadLibrary();
pollJobs();
subscribeToStage();
$("#search-input").focus();
