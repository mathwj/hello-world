/* KaraokeBox front-end: search, queue downloads, browse and play the library. */

const $ = (sel) => document.querySelector(sel);

const state = {
  results: [],       // last search results, re-rendered when the library changes
  library: [],
  jobs: [],
  scoreFrame: null,   // in-flight requestAnimationFrame for the score roll
  queued: new Set(),   // video ids queued this session, to disable their buttons
  pollTimer: null,
};

/* ---------- helpers ---------- */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
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

/* ---------- tabs ---------- */

function showTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === name);
  });
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `panel-${name}`);
  });
  if (name === "library") loadLibrary();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => showTab(tab.dataset.tab));
});

/* ---------- search ---------- */

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
        <p class="card-meta">${escapeHtml(result.channel)}</p>
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
  const grid = $("#search-results");
  grid.innerHTML = results.map(searchCard).join("");
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

/* ---------- downloads ---------- */

$("#search-results").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-download]");
  if (!button) return;

  button.disabled = true;
  button.textContent = "Queued…";
  state.queued.add(button.dataset.download);

  try {
    await api("/api/downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_id: button.dataset.download,
        title: button.dataset.title,
        thumbnail: button.dataset.thumb,
      }),
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

function libraryCard(song) {
  const thumb = song.thumbnail
    ? `<img src="/media/${encodeURIComponent(song.thumbnail)}" alt="" loading="lazy">`
    : "";
  return `
    <article class="card">
      <div class="card-thumb">
        ${thumb}
        <span class="card-duration">${escapeHtml(song.duration_label)}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(song.title)}</h3>
        <p class="card-meta">${escapeHtml(song.channel)} &middot; ${formatBytes(song.size_bytes)}</p>
        <div class="card-actions">
          <button class="btn btn-primary" data-play="${escapeHtml(song.name)}"
                  data-title="${escapeHtml(song.title)}">Sing</button>
          <button class="btn btn-danger" data-delete="${escapeHtml(song.name)}"
                  data-title="${escapeHtml(song.title)}">Delete</button>
        </div>
      </div>
    </article>`;
}

function renderLibrary() {
  const filter = $("#library-filter").value.trim().toLowerCase();
  const songs = filter
    ? state.library.filter((song) => song.title.toLowerCase().includes(filter))
    : state.library;

  $("#library-results").innerHTML = songs.map(libraryCard).join("");
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
    openPlayer(play.dataset.play, play.dataset.title);
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

/* ---------- score screen ---------- */

/* Bands are read top-down: the first whose minimum the score clears wins. */
const SCORE_BANDS = [
  { min: 95, band: "legend", rank: "Legendary. Someone call a record label." },
  { min: 85, band: "great",  rank: "Superstar!" },
  { min: 70, band: "great",  rank: "Crowd pleaser." },
  { min: 50, band: "ok",     rank: "Not bad at all." },
  { min: 30, band: "rough",  rank: "The crowd is being polite." },
  { min: 0,  band: "rough",  rank: "Brave. Very brave." },
];

function bandFor(score) {
  return SCORE_BANDS.find((entry) => score >= entry.min);
}

function randomScore() {
  return Math.floor(Math.random() * 101); // 0–100 inclusive
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Spins the digits, slowing down and closing in on the final score. */
function rollScore(finalScore, onSettled) {
  const el = $("#score-number");
  const duration = 2800;
  const start = performance.now();
  let lastTick = 0;
  let gap = 45;

  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    if (progress >= 1) {
      el.textContent = finalScore;
      onSettled();
      return;
    }
    if (now - lastTick >= gap) {
      lastTick = now;
      // Ticks get slower and the guesses close in, so it visibly settles.
      gap = 45 + 250 * Math.pow(progress, 3);
      let guess;
      if (progress < 0.7) {
        // Spin the whole range first. Converging from the start would clamp
        // against 0 or 100 and show the same digits over and over.
        guess = Math.floor(Math.random() * 101);
      } else {
        const closing = (progress - 0.7) / 0.3;
        const spread = Math.max(1, Math.round(45 * (1 - closing)));
        guess = finalScore + Math.round((Math.random() * 2 - 1) * spread);
      }
      el.textContent = Math.max(0, Math.min(100, guess));
    }
    state.scoreFrame = requestAnimationFrame(frame);
  }
  state.scoreFrame = requestAnimationFrame(frame);
}

function showScore() {
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
  };

  if (prefersReducedMotion()) {
    $("#score-number").textContent = score;
    settle();
  } else {
    rollScore(score, settle);
  }
}

function hideScore() {
  if (state.scoreFrame) cancelAnimationFrame(state.scoreFrame);
  state.scoreFrame = null;
  $("#score").hidden = true;
  $("#score").classList.remove("is-final");
}

$("#player-video").addEventListener("ended", showScore);

$("#score-again").addEventListener("click", () => {
  hideScore();
  const video = $("#player-video");
  video.currentTime = 0;
  video.play().catch(() => {});
});

$("#score-done").addEventListener("click", () => closePlayer());

/* ---------- player ---------- */

function openPlayer(name, title) {
  hideScore();
  const video = $("#player-video");
  $("#player-title").textContent = title;
  video.src = `/media/${encodeURIComponent(name)}`;
  $("#player").hidden = false;
  video.play().catch(() => { /* autoplay may need a user gesture; controls are there */ });
}

function closePlayer() {
  hideScore();
  const video = $("#player-video");
  video.pause();
  video.removeAttribute("src");
  video.load();
  $("#player").hidden = true;
}

$("#player-close").addEventListener("click", closePlayer);
$("#player").addEventListener("click", (event) => {
  if (event.target.id === "player") closePlayer();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("#player").hidden) closePlayer();
});

/* ---------- boot ---------- */

loadLibrary();
pollJobs();
$("#search-input").focus();
