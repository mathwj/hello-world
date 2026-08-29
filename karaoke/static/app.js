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
  pollTimer: null,
  volumeTimer: null,
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
          <button class="btn btn-primary" data-music="${escapeHtml(result.video_id)}"
                  data-title="${escapeHtml(result.title)}">Play on stage</button>
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

$("#music-results").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-music]");
  if (!button) return;
  try {
    await postJson("/api/stage/music", {
      video_id: button.dataset.music,
      title: button.dataset.title,
    });
    toast(`Playing “${button.dataset.title}” on the stage`);
  } catch (error) {
    toast(error.message, true);
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

function libraryCard(song) {
  const thumb = song.thumbnail
    ? `<img src="/media/${encodeURIComponent(song.thumbnail)}" alt="" loading="lazy">`
    : "";
  const onStage = state.stage
    && state.stage.mode === "karaoke"
    && state.stage.karaoke
    && state.stage.karaoke.name === song.name;

  return `
    <article class="card${onStage ? " is-live" : ""}">
      <div class="card-thumb">
        ${thumb}
        <span class="card-duration">${escapeHtml(song.duration_label)}</span>
        ${onStage ? '<span class="card-live">On stage</span>' : ""}
      </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(song.title)}</h3>
        <p class="card-meta">${escapeHtml(song.channel)} &middot; ${formatBytes(song.size_bytes)}</p>
        <div class="card-actions">
          <button class="btn btn-primary" data-play="${escapeHtml(song.name)}"
                  data-title="${escapeHtml(song.title)}">Play on stage</button>
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

function onFaderMoved(event) {
  const out = event.target.id === "vol-karaoke" ? "#vol-karaoke-out" : "#vol-music-out";
  $(out).textContent = event.target.value;
  // Coalesce the flood of input events a dragged slider produces.
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
  if (document.activeElement !== $("#vol-karaoke")) {
    $("#vol-karaoke").value = next.volume.karaoke;
    $("#vol-karaoke-out").textContent = next.volume.karaoke;
  }
  if (document.activeElement !== $("#vol-music")) {
    $("#vol-music").value = next.volume.music;
    $("#vol-music-out").textContent = next.volume.music;
  }

  const live = next.mode !== "idle" && (next.karaoke || next.music);
  $("#nowbar").hidden = !live;
  if (live) {
    const isKaraoke = next.mode === "karaoke";
    $("#now-kind").textContent = isKaraoke ? "Singing" : "Music";
    $("#now-kind").className = `now-kind ${isKaraoke ? "is-karaoke" : "is-music"}`;
    $("#now-title").textContent = isKaraoke ? next.karaoke.title : next.music.title;
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

loadLibrary();
pollJobs();
subscribeToStage();
$("#search-input").focus();
