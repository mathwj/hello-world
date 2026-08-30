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
  muffled: false,     // the music filtered down, as if through a wall
  watching: null,     // the video playing on the music page
  player: null,       // the YouTube player, once its API has loaded
  playerReady: false,
  pendingVideo: null, // asked for before the player finished loading
  ytApi: null,
  pollTimer: null,
  progressTimer: null,
  volumeTimer: null,
  // One fade per channel: where it came from, and the animation in flight.
  fades: {
    karaoke: { restore: 85, frame: null },
    music: { restore: 60, frame: null },
  },
};

/* ---------- icons ---------- */

const icon = (path) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;

const ICONS = {
  play: icon("M8 5v14l11-7z"),
  pause: icon("M6 5h4v14H6zm8 0h4v14h-4z"),
  stop: icon("M7 7h10v10H7z"),
  // A star for the score: the reveal, not the stopping.
  score: icon("M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"),
};

/* ---------- helpers ---------- */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
}

/* mm:ss, zero-padded, so the clock does not jitter in width as it counts. */
function clock(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
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
  syncDownloadButtons();          // a card re-rendered mid-download keeps its bar
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
  button.classList.add("is-downloading");
  button.style.setProperty("--progress", "0%");
  button.innerHTML = "<span>Waiting…</span>";
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
    button.classList.remove("is-downloading");
    button.style.removeProperty("--progress");
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
             partition="persist:youtube" allowpopups
             webpreferences="backgroundThrottling=no"></webview>`;

  const view = $("#yt-view");
  $("#yt-back").addEventListener("click", () => view.canGoBack() && view.goBack());
  $("#yt-forward").addEventListener("click", () => view.canGoForward() && view.goForward());
  $("#yt-reload").addEventListener("click", () => view.reload());
  $("#yt-home").addEventListener("click", () => view.loadURL("https://www.youtube.com"));

  const showUrl = () => { $("#yt-url").textContent = view.getURL(); };
  // YouTube swaps the video element on every navigation, so the fader has to be
  // re-applied rather than set once.
  // YouTube swaps the video element on every navigation, so both the volume
  // and the muffle have to be laid on again rather than set once.
  const reapply = () => {
    showUrl();
    applyMusicVolume(Number($("#vol-music").value));
    if (state.muffled) applyMuffle();
  };
  view.addEventListener("did-navigate", reapply);
  view.addEventListener("did-navigate-in-page", reapply);
  view.addEventListener("media-started-playing", reapply);
  view.addEventListener("did-finish-load", reapply);
}

/* ---------- muffle ----------

   Runs inside the embedded browser, where the video element is same-origin and
   can be routed through a Web Audio graph — from the operator page it is behind
   a cross-origin boundary and untouchable. A lowpass filter takes the top off,
   so the music sounds like it is coming through a wall, and both the cutoff and
   a little level are ramped rather than switched, so it breathes in and out.

   The source node is created once per video element: calling
   createMediaElementSource twice on the same element throws, and a failed
   attempt would leave the music routed into a graph that never plays. */
const MUFFLE_MS = 700;
const MUFFLED = { frequency: 420, gain: 0.72 };
const OPEN = { frequency: 22000, gain: 1 };

/* Builds the audio graph inside the embedded browser, once per video element.
   Both the muffle and the soundwave hang off it, so it lives in one place —
   the wave has to work whether or not the operator ever taps Muffle. */
const ENSURE_CHAIN = `
  const store = (window.__karaokebox = window.__karaokebox || {});
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return { state: "unsupported" };
  if (!store.ctx) store.ctx = new Ctx();
  const ctx = store.ctx;
  if (ctx.state === "suspended") ctx.resume();
  // Routing into a context that will not start would silence the music.
  // resume() is asynchronous: the state will not have flipped yet on the call
  // that starts it, so this reports "starting" and the next poll proceeds.
  if (ctx.state !== "running") return { state: "starting" };

  const build = (video) => {
    // An older graph, built before the fine analyser existed, is upgraded in
    // place: the music page keeps its audio context across an app update.
    if (video.__kbChain) return attach(video.__kbChain);
    let source;
    try {
      source = ctx.createMediaElementSource(video);
    } catch (error) {
      return null;                       // a second attempt on one element throws
    }
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = ${OPEN.frequency};
    filter.Q.value = 0.7;
    const level = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    // Onset detection wants the opposite of a pretty meter. Heavy smoothing
    // averages away the very attack a kick is made of, and the default decibel
    // window pins loud music against the top of the byte range, leaving almost
    // no room between the bass and its own peaks — measured on real-shaped
    // audio, the whole spread was two counts out of 255.
    analyser.smoothingTimeConstant = 0.15;
    analyser.minDecibels = -95;
    analyser.maxDecibels = -12;
    source.connect(filter);
    filter.connect(level);
    level.connect(analyser);
    analyser.connect(ctx.destination);

    /* A clock that cannot be throttled.

       Reading the analysers on animation frames means reading them only while
       this page is being drawn, and it is not: the operator spends the night on
       other tabs, and a page that is not rendered gets no frames at all. The
       audio, though, never stops — that is the whole point of it — so the audio
       graph itself is asked to drive the sampling. This node's callback comes
       round every buffer, whether anyone is looking at the page or not.

       Its output is silence: it is here for the callback, not for the sound. */
    let pump = null;
    try {
      pump = ctx.createScriptProcessor(1024, 1, 1);
      pump.onaudioprocess = () => { if (store.sample) store.sample(); };
      const silence = ctx.createGain();
      silence.gain.value = 0;
      level.connect(pump);
      pump.connect(silence);
      silence.connect(ctx.destination);
    } catch (error) {
      pump = null;             // an old clock is better than no music at all
    }
    video.__kbChain = { filter, level, analyser, pump };
    return attach(video.__kbChain);
  };

  /* A second analyser, hung off the same point in the chain.

     One window cannot do both jobs. Telling *when* a drum was hit needs a short
     window, because a long one smears the attack across it; telling *which
     note* is sounding needs a long one, because 12 Hz apart is a semitone down
     where the bass lives and a short window cannot resolve that. So there are
     two: a fast one for time and a fine one for pitch. */
  const attach = (chain) => {
    if (chain.harmonics) return chain;
    const harmonics = ctx.createAnalyser();
    harmonics.fftSize = 4096;            // about 12 Hz per bin
    harmonics.smoothingTimeConstant = 0.6;
    harmonics.minDecibels = -95;
    harmonics.maxDecibels = -12;
    // A tap: nothing downstream, so it reads the music without carrying it.
    chain.level.connect(harmonics);
    chain.harmonics = harmonics;
    return chain;
  };
`;

const muffleScript = ({ frequency, gain }) => `(() => {
  ${ENSURE_CHAIN}
  let touched = 0;
  for (const video of Array.from(document.querySelectorAll("video"))) {
    if (!build(video)) continue;
    const { filter, level } = video.__kbChain;
    const now = ctx.currentTime;
    const seconds = ${MUFFLE_MS} / 1000;
    filter.frequency.cancelScheduledValues(now);
    filter.frequency.setValueAtTime(filter.frequency.value, now);
    filter.frequency.exponentialRampToValueAtTime(${frequency}, now + seconds);
    level.gain.cancelScheduledValues(now);
    level.gain.setValueAtTime(level.gain.value, now);
    level.gain.linearRampToValueAtTime(${gain}, now + seconds);
    touched += 1;
  }
  return { state: touched ? "ok" : "no-audio" };
})()`;

/* ---------- the beat behind the waiting screen ----------

   The waiting screen flashes on the bass kick, and the music plays here on the
   laptop, so the beat has to be found here and carried across.

   Detection runs inside the embedded browser at full frame rate: a kick is a
   short jump in low-end energy above its own recent average, and spotting that
   needs finer timing than anything sampled a dozen times a second could give.
   Only the hits travel — a few a second — rather than a continuous stream. */
/* The stage runs the beat off a grid it keeps itself, so this interval no
   longer sits between the sound and the picture — it only refreshes the tempo
   and its phase. Twice a second is plenty, and it costs almost nothing. */
const BEAT_POLL_MS = 200;
const BEAT_CONFIDENCE = 3.4;

/* The seven bands, cut where instruments actually sit rather than into equal
   slices. Each is roughly an octave or two of one job in a mix, which is what
   makes them separable to look at: the sub is felt, the bass is the kick and
   the bass guitar, the body is where a chord sounds thick, the mid carries the
   voice, presence is a snare crack and a consonant, the highs are hats and the
   air is cymbal shimmer. */
const BANDS = [
  ["sub", 30, 60],
  ["bass", 60, 160],
  ["body", 160, 400],
  ["mid", 400, 1200],
  ["presence", 1200, 3500],
  ["high", 3500, 8000],
  ["air", 8000, 16000],
];

/* How much each band has to say about where the beat is. The kick and the
   snare decide it; the voice helps a little; cymbals mostly mislead. */
const TEMPO_WEIGHT = {
  sub: 0.8, bass: 1, body: 0.9, mid: 0.7, presence: 0.5, high: 0.15, air: 0,
};

const BEAT_SCRIPT = `(() => {
  ${ENSURE_CHAIN}
  const BANDS = ${JSON.stringify(BANDS)};
  const TEMPO_WEIGHT = ${JSON.stringify(TEMPO_WEIGHT)};
  const playing = () => Array.from(document.querySelectorAll("video"))
    .find((v) => !v.paused && !v.ended && v.readyState > 2);

  const video = playing();
  if (!video) return { state: "no-audio" };
  if (!build(video)) return { state: "no-tap" };

  if (!store.beat) {
    const emptyBands = () => {
      // Levels are summed and averaged over the frames a report covers; onsets
      // are peak-held, because an attack lives in a single frame and averaging
      // it away is exactly how a snare goes missing.
      const bands = { frames: 0 };
      for (const [name] of BANDS) bands[name] = { level: 0, onset: 0 };
      return bands;
    };

    store.beat = {
      flux: [], times: [], lows: [], previous: null, fineSpectrum: null,
      period: 0, bpm: 0, confidence: 0, anchor: 0, analysedAt: 0, barBeat: 0,
      recent: [], steady: false,
      centroid: 0, harmony: 0, tonal: 0, chroma: null, chromaTable: null, chromaAt: 0,
      fit: 0, misfits: 0, quietSince: 0,
      bands: emptyBands(),
      emptyBands,
    };

    /* Estimates the tempo the way beat trackers actually do it, rather than by
       timing the gaps between detected thumps.

       Counting gaps assumes every kick is found and nothing else is mistaken
       for one. On real music neither holds: a bassline sits in the same octave
       as the kick, patterns skip beats, and one spurious onset ruins the
       estimate. Autocorrelating the onset envelope instead asks "at what
       spacing does this signal most resemble itself", which survives missed
       and extra onsets because it weighs the whole window at once. */
    const analyse = (beat) => {
      const count = beat.flux.length;
      const span = beat.times[count - 1] - beat.times[0];
      if (span <= 0) return;
      const step = span / (count - 1);                 // ms per sample

      /* Onsets, not loudness. Subtracting each sample's own neighbourhood and
         keeping only what is left above it turns a busy envelope into a sparse
         row of attacks, which is what has a tempo in it. Correlating the raw
         envelope instead mostly correlates the arrangement getting louder and
         quieter, and that is how a passage with no beat still scores well. */
      const window = Math.max(3, Math.round(400 / step));
      const onset = new Array(count);
      let running = 0;
      for (let i = 0; i < count; i += 1) {
        running += beat.flux[i];
        if (i >= window) running -= beat.flux[i - window];
        const local = running / Math.min(i + 1, window);
        onset[i] = Math.max(0, beat.flux[i] - local);
      }

      const mean = onset.reduce((a, b) => a + b, 0) / count;
      const centred = onset.map((v) => v - mean);
      const variance = centred.reduce((a, v) => a + v * v, 0) / count;
      if (variance <= 0) return;

      /* Recency. The window holds several seconds, and all of it used to count
         equally — so for those seconds after a song changed, the tracker was
         still mostly listening to the song before. Weighting the newest samples
         far above the oldest means the estimate follows what is playing now
         while still having enough history behind it to be sure of a tempo. */
      // Measured in time, not in samples: after a break the window is short,
      // and a fade defined as a fraction of it would weight the newest half
      // second above everything else and wander.
      const fade = Math.max(count / 2.5, 2500 / step);
      const weight = new Float64Array(count);
      for (let i = 0; i < count; i += 1) weight[i] = Math.exp(-(count - 1 - i) / fade);

      // Correlate well past the tempos we will consider: the harmonics of a
      // candidate are what tell it apart from its own multiples.
      const reach = Math.min(Math.floor(count / 2), Math.round(3200 / step));
      const r = new Float64Array(reach + 1);
      for (let lag = 1; lag <= reach; lag += 1) {
        let sum = 0, total = 0;
        for (let i = 0; i + lag < count; i += 1) {
          const w = weight[i + lag];
          sum += w * centred[i] * centred[i + lag];
          total += w;
        }
        // Normalised by the signal's own variance, so it means "how alike"
        // rather than "how loud" and is comparable between lags.
        r[lag] = total > 0 ? sum / (total * variance) : 0;
      }

      const shortest = Math.max(2, Math.round(300 / step));           // 200 bpm
      const longest = Math.min(Math.round(1050 / step), reach);       // 57 bpm
      if (longest <= shortest) return;

      const at = (lag) => (lag <= reach ? r[lag] : 0);
      const score = new Float64Array(longest + 1);
      for (let lag = shortest; lag <= longest; lag += 1) {
        // A period repeats at twice and three times its length as well, so
        // adding those in rewards the beat itself over the bar that contains
        // it — the difference between a picture that moves on every beat and
        // one that moves on every other.
        const harmonics = at(lag) + 0.5 * at(lag * 2) + 0.25 * at(lag * 3);
        const bpm = 60000 / (lag * step);
        // A tempo prior, because ordinary music is not evenly spread across
        // the range and autocorrelation on its own has no opinion.
        const octaves = Math.log(bpm / 120) / Math.LN2;
        score[lag] = harmonics * Math.exp(-0.5 * (octaves / 0.9) * (octaves / 0.9));
      }

      let bestLag = shortest;
      for (let lag = shortest; lag <= longest; lag += 1) {
        if (score[lag] > score[bestLag]) bestLag = lag;
      }
      const winner = bestLag;               // kept for the confidence below

      // Sub-sample: one frame is 17ms, which is 4 bpm at dance tempos and
      // enough drift to walk the grid off the beat within a few bars.
      let refined = bestLag;
      if (bestLag > shortest && bestLag < longest) {
        const before = score[bestLag - 1], here = score[bestLag], after = score[bestLag + 1];
        const curve = before - 2 * here + after;
        if (curve < 0) refined = bestLag + Math.max(-0.5, Math.min(0.5, (before - after) / (2 * curve)));
      }
      beat.period = refined * step;
      beat.bpm = Math.round(60000 / beat.period);

      let total = 0, lags = 0;
      for (let lag = shortest; lag <= longest; lag += 1) { total += score[lag]; lags += 1; }
      const average = total / lags;
      let spread = 0;
      for (let lag = shortest; lag <= longest; lag += 1) {
        spread += (score[lag] - average) * (score[lag] - average);
      }
      spread = Math.sqrt(spread / lags);
      // How far the winner stands out from every other spacing, in standard
      // deviations: a steady beat towers over the field, noise does not.
      beat.confidence = spread > 0 ? (score[winner] - average) / spread : 0;

      /* Phase, by comb rather than by the loudest recent onset.

         Picking the biggest onset in the last period catches whatever happened
         to be loudest — often a snare or a bass note, not the beat. Scoring
         every possible offset by the energy landing on that whole grid asks
         which alignment the entire window agrees with, which is the question
         actually being asked. */
      // Only the last few seconds: a comb over the whole window would average
      // the alignment of the section that just ended into the one playing.
      const recent = Math.max(0, count - Math.round(3000 / step));
      const comb = (from, spacing) => {
        let sum = 0, hits = 0;
        for (let k = 0; ; k += 1) {
          const i = Math.round(from - k * spacing);
          if (i < recent) break;
          sum += onset[i];
          hits += 1;
        }
        return hits ? sum / hits : 0;
      };

      let bestOffset = 0, bestEnergy = -1;
      for (let offset = 0; offset < bestLag; offset += 1) {
        const energy = comb(count - 1 - offset, refined);
        if (energy > bestEnergy) { bestEnergy = energy; bestOffset = offset; }
      }

      /* Is there a beat between every pair of these?

         A rock pattern puts the kick on one and three and the snare on two and
         four, so the music repeats itself every *two* beats and correlates best
         there — which is how a tracker ends up swelling on every other beat of
         a song anybody would clap along to. Rather than hope a prior outweighs
         it, ask the question directly: if the midpoints of this grid carry
         nearly as much attack as the grid does, the midpoints are beats too. */
      const half = refined / 2;
      if (Math.round(half) >= shortest
          && comb(count - 1 - bestOffset - half, refined) > bestEnergy * 0.6) {
        refined = half;
        bestLag = Math.max(1, Math.round(half));
        beat.period = refined * step;
        beat.bpm = Math.round(60000 / beat.period);
      }

      /* Does this grid still explain what is being played?

         Tempo and phase can both look settled while the music has moved on
         underneath them — the numbers agree with each other and with nothing
         audible. Comparing the onset energy landing on the grid against the
         average across the same stretch answers the question directly: on a
         grid that fits, the beats are where the attacks are. */
      let over = 0, overall = 0, spans = 0;
      for (let i = recent; i < count; i += 1) { overall += onset[i]; spans += 1; }
      overall = spans ? overall / spans : 0;
      over = bestEnergy;
      beat.fit = overall > 0 ? over / overall : 0;
      beat.anchor = beat.times[count - 1 - bestOffset];

      /* Which beat of the bar that is.

         Nearly all of this music is in four, and the four are not equal: the
         first carries the weight, and the backbeat — two and four — carries
         the snare. Knowing where the bar starts is what lets the screen phrase
         instead of tick. The downbeat is found the way a listener finds it, by
         asking which of the four positions the low end keeps landing on. */
      let barBeat = 0, heaviest = -1;
      for (let phase = 0; phase < 4; phase += 1) {
        let sum = 0, hits = 0;
        for (let k = phase; ; k += 4) {
          const i = Math.round(count - 1 - bestOffset - k * refined);
          if (i < 0) break;
          sum += beat.lows[i] || 0;
          hits += 1;
        }
        if (hits && sum / hits > heaviest) { heaviest = sum / hits; barBeat = phase; }
      }
      // The heaviest position sits barBeat beats back from the anchor, so
      // that is the anchor's own place in the bar.
      beat.barBeat = barBeat;

      /* One reading is not a tempo.

         Confidence alone cannot tell quiet music from a passage with no beat
         in it — measured on realistic envelopes the two ranges overlap. What
         does tell them apart is holding still: real music keeps the same
         tempo from one look to the next, while a false peak wanders. */
      beat.recent.push(beat.period);
      if (beat.recent.length > 4) beat.recent.shift();
      const sorted = [...beat.recent].sort((a, b) => a - b);
      const middle = sorted[sorted.length >> 1];
      beat.steady = beat.recent.length >= 3
        && beat.fit >= 1.25
        && beat.recent.every((p) => Math.abs(p - middle) < middle * 0.04);

      /* A grid that has stopped fitting twice running is not going to recover
         by being averaged with more of the same. Everything older than a couple
         of seconds goes, so the next estimate is made from the music that is
         actually playing rather than from the memory of the one before it. */
      beat.misfits = beat.fit < 1.25 ? beat.misfits + 1 : 0;
      if (beat.misfits >= 2) {
        forget(beat, Math.round(2000 / step));
        beat.misfits = 0;
      }
    };

    /* Which pitch class each fine bin belongs to.

       Doubling a frequency is the same note an octave up, so folding the whole
       spectrum onto twelve classes gives what the music is actually built on:
       its harmony, independent of which octave anything is played in. Worked
       out once — it is the same table every frame. */
    const chromaTable = (analyser) => {
      const binHz = analyser.context.sampleRate / analyser.fftSize;
      const table = new Int8Array(analyser.frequencyBinCount).fill(-1);
      for (let bin = 1; bin < table.length; bin += 1) {
        const hz = bin * binHz;
        if (hz < 55 || hz > 4200) continue;          // below A1, above the top of a piano
        const semitones = 12 * Math.log(hz / 440) / Math.LN2;
        table[bin] = ((Math.round(semitones) % 12) + 12) % 12;
      }
      return table;
    };

    /* Throws away everything but the last few samples: a new song, or a section
       that broke the grid, should not be worked out from the one before it. */
    const forget = (beat, keep) => {
      beat.flux = beat.flux.slice(-keep);
      beat.times = beat.times.slice(-keep);
      beat.lows = beat.lows.slice(-keep);
      beat.recent.length = 0;
      beat.steady = false;
      beat.misfits = 0;
    };

    /* Sampled from whichever clock gets here first — the audio graph when the
       page is hidden, animation frames when it is not — with anything closer
       together than half a frame ignored, so the two never double up. */
    const sample = () => {
      const current = playing();
      if (current && current.__kbChain) {
        const analyser = current.__kbChain.analyser;
        const spectrum = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(spectrum);

        const beat = store.beat;

        /* Every part of the music, not just the kick.

           A picture driven by the kick alone only moves a few times a bar and
           ignores everything in between, which is why it reads as mechanical.
           Each band gets two numbers: how loud it is, which is how big its
           shapes sit, and how hard it just jumped, which is what makes them
           snap. Loudness and attack are different questions — a held organ
           chord is loud and never attacks, a closed hat attacks and is never
           loud. */
        const fastHz = analyser.context.sampleRate / analyser.fftSize;
        const fine = current.__kbChain.harmonics;
        const fineHz = fine.context.sampleRate / fine.fftSize;
        if (!beat.fineSpectrum) beat.fineSpectrum = new Uint8Array(fine.frequencyBinCount);
        fine.getByteFrequencyData(beat.fineSpectrum);
        const detail = beat.fineSpectrum;

        let frameLow = 0, flux = 0;
        for (const [name, lowHz, highHz] of BANDS) {
          // Level from the fine analyser: 40 Hz and 90 Hz are a world apart to
          // listen to and one bin apart to the fast one.
          let sum = 0, bins = 0;
          for (let bin = Math.max(1, Math.round(lowHz / fineHz));
               bin <= Math.min(detail.length - 1, Math.round(highHz / fineHz)); bin += 1) {
            sum += detail[bin]; bins += 1;
          }
          const level = bins ? (sum / bins) * (100 / 255) : 0;

          // Attack from the fast one: this is a question about time.
          let rise = 0, fastBins = 0;
          if (beat.previous) {
            for (let bin = Math.max(1, Math.round(lowHz / fastHz));
                 bin <= Math.min(spectrum.length - 1, Math.round(highHz / fastHz)); bin += 1) {
              rise += Math.max(0, spectrum[bin] - beat.previous[bin]);
              fastBins += 1;
            }
          }
          const raw = fastBins ? rise / fastBins : 0;      // mean rise per bin
          const onset = Math.min(100, raw * 2.5);

          if (name === "sub" || name === "bass") frameLow = Math.max(frameLow, raw);
          /* The envelope the tempo is found in.

             Summing raw bins made a broadband hit look enormous beside a narrow
             one: a snare covers thirty bins and a kick three, so the kick all
             but vanished and the tracker heard a bar where there was a beat.
             Per bin, and weighted by how much each part of a mix has to do with
             where the beat is, they stand comparison. Hats are nearly left out:
             they land between beats as often as on them. */
          flux += raw * TEMPO_WEIGHT[name];

          const band = beat.bands[name];
          band.level += level;
          band.onset = Math.max(band.onset, onset);
        }
        beat.bands.frames += 1;

        /* Timbre: where the weight of the sound sits. A voice and a cymbal can
           be the same loudness and look nothing alike; brightness is what tells
           them apart, and it is what the colour follows. */
        let weighted = 0, total = 0;
        for (let bin = 1; bin < spectrum.length; bin += 1) {
          // Above the floor only. A little hiss in every one of five hundred
          // bins is nothing to listen to, but there is a lot of it and it sits
          // high, so counting it drags this to the top and pins it there.
          if (spectrum[bin] < 24) continue;
          weighted += bin * fastHz * spectrum[bin];
          total += spectrum[bin];
        }
        if (total > 0) {
          const centre = weighted / total;
          // Logarithmic, because hearing is: 200 Hz to 6 kHz across the range.
          const octaves = Math.log(Math.max(200, Math.min(6000, centre)) / 200) / Math.LN2;
          beat.centroid = beat.centroid * 0.85 + (octaves / 4.9) * 100 * 0.15;
        }

        // Harmony, a few times a second: chords do not change every frame, and
        // twelve sums over three thousand bins is not free.
        const now = performance.now();
        if (now - beat.chromaAt > 120) {
          beat.chromaAt = now;
          if (!beat.chromaTable) beat.chromaTable = chromaTable(fine);
          const chroma = new Float64Array(12);
          for (let bin = 1; bin < detail.length; bin += 1) {
            const pitch = beat.chromaTable[bin];
            if (pitch >= 0) chroma[pitch] += detail[bin];
          }
          let length = 0;
          for (let i = 0; i < 12; i += 1) length += chroma[i] * chroma[i];
          length = Math.sqrt(length);
          if (length > 0) {
            for (let i = 0; i < 12; i += 1) chroma[i] /= length;
            if (beat.chroma) {
              // How far the harmony has turned from where it has been sitting.
              // A chord change moves this sharply; a melody over one chord
              // barely moves it, which is the distinction worth drawing.
              let dot = 0;
              for (let i = 0; i < 12; i += 1) dot += chroma[i] * beat.chroma[i];
              beat.harmony = Math.max(beat.harmony, Math.min(100, (1 - dot) * 260));
              for (let i = 0; i < 12; i += 1) beat.chroma[i] = beat.chroma[i] * 0.92 + chroma[i] * 0.08;
            } else {
              beat.chroma = chroma;
            }
            let strongest = 0;
            for (let i = 1; i < 12; i += 1) if (beat.chroma[i] > beat.chroma[strongest]) strongest = i;
            beat.tonal = strongest;
          }
        }

        beat.previous = spectrum;
        beat.flux.push(flux);
        beat.times.push(now);
        beat.lows.push(frameLow);          // for finding the downbeat
        if (beat.flux.length > 420) { beat.flux.shift(); beat.times.shift(); beat.lows.shift(); }

        /* A gap between tracks is the one moment the tempo is certain to
           change, and the one moment it can be seen coming. Rather than drag
           the old grid into the new song for several seconds, the history goes
           at the gap and the next song is worked out from itself. */
        let loudest = 0;
        for (const [name] of BANDS) loudest = Math.max(loudest, beat.bands[name].onset);
        if (loudest < 2) {
          beat.quietSince = beat.quietSince || now;
          if (now - beat.quietSince > 400 && beat.flux.length > 60) forget(beat, 30);
        } else {
          beat.quietSince = 0;
        }

        // Four times a second rather than twice: this is how quickly it can
        // notice that the music has moved on.
        if (now - beat.analysedAt > 250 && beat.flux.length > 120) {
          beat.analysedAt = now;
          analyse(beat);
        }
      }
    };

    store.sample = () => {
      const now = performance.now();
      if (now - (store.sampledAt || 0) < 8) return;
      store.sampledAt = now;
      store.samples = (store.samples || 0) + 1;
      sample();
    };

    const frame = () => { store.sample(); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  const beat = store.beat;
  // Reading drains what has been collected: each report covers the frames
  // since the last one, so a peak belongs to one report only and cannot linger.
  const taken = beat.bands.frames;
  const frames = Math.max(1, taken);
  const levels = {};
  let loudest = 0;
  for (const [name] of BANDS) {
    levels[name] = Math.round(beat.bands[name].level / frames);
    levels[name + "_on"] = Math.round(beat.bands[name].onset);
    loudest = Math.max(loudest, levels[name]);
  }
  beat.bands = beat.emptyBands();
  const harmony = Math.round(beat.harmony);
  beat.harmony = 0;

  return {
    // How much was actually read since the last report, so a sampler that has
    // stopped is visible as itself rather than as music with nothing in it.
    state: taken === 0 ? "stalled" : (loudest < 1 ? "silent" : "ok"),
    frames: taken,
    levels,
    harmony,
    tonal: beat.tonal,
    centroid: Math.round(beat.centroid),
    barBeat: beat.barBeat,
    bpm: beat.bpm,
    confidence: +beat.confidence.toFixed(2),
    steady: beat.steady,
    fit: +(beat.fit || 0).toFixed(2),
    period: Math.round(beat.period),
    // Age rather than a timestamp: the two pages have unrelated clocks, but
    // "this happened N milliseconds ago" travels between them intact, which is
    // what lets the stage place the beat when it truly landed instead of when
    // the message showed up.
    anchorAge: beat.anchor ? Math.round(performance.now() - beat.anchor) : null,
  };
})()`;

/* The detector runs inside another page, so without this its failures are
   invisible: the screen simply never flashes and there is nothing to look at. */
const BEAT_STATES = {
  ok: "listening",
  starting: "waiting for sound",
  "no-audio": "nothing playing",
  "no-tap": "cannot read this player",
  unsupported: "no audio support",
  stalled: "not reading the player",
  silent: "player is silent",
  error: "not responding",
};

function showBeatState(report) {
  const dot = $("#beat-dot");
  if (!dot) return;
  const state = (report && report.state) || "error";
  const locked = state === "ok" && report.steady
    && report.confidence >= BEAT_CONFIDENCE && report.bpm;
  dot.classList.toggle("is-live", Boolean(locked));
  if (locked) {
    dot.classList.add("is-hit");
    setTimeout(() => dot.classList.remove("is-hit"), 140);
  }
  // The tempo it has settled on, so a wrong lock is obvious at a glance rather
  // than something to be guessed at from how the screen looks.
  dot.title = state === "ok"
    ? `Beat: ${locked ? "locked" : "listening"} — ${report.bpm || "?"} BPM, confidence ${report.confidence}`
    : `Beat: ${BEAT_STATES[state] || state}`;
  $("#beat-label").textContent = locked
    ? `${report.bpm} BPM`
    : (state === "ok" ? "listening" : BEAT_STATES[state] || state);
}

function startBeatFeed() {
  let sampling = false;

  async function drain() {
    const view = $("#yt-view");
    if (sampling || !view || typeof view.executeJavaScript !== "function") return;
    sampling = true;
    try {
      const started = performance.now();
      const report = await view.executeJavaScript(BEAT_SCRIPT);
      const roundTrip = performance.now() - started;
      showBeatState(report);

      // "silent" still reports: a quiet passage is music too, and the screen
      // should settle through it rather than freeze on the last loud frame.
      if (!report || !report.levels) return;
      if (report.state !== "ok" && report.state !== "silent") return;

      // The tempo is only worth sending once the tracker is sure of it; the
      // band levels are worth sending regardless, so music it cannot lock onto
      // still moves the picture instead of leaving it still.
      const locked = report.steady && report.confidence >= BEAT_CONFIDENCE
        && report.period > 250 && report.anchorAge !== null;

      await postJson("/api/stage/pulse", {
        period: locked ? report.period : 0,
        bpm: locked ? report.bpm : 0,
        confidence: report.confidence,
        // The guest measured this age when it was read, about half a round
        // trip ago; carrying the age rather than a timestamp is what lets
        // the stage put the beat where it actually happened.
        anchor_age: locked ? Math.round(report.anchorAge + roundTrip / 2) : 0,
        // Where the anchor sits in the bar, so the stage can tell a downbeat
        // from the beats after it rather than treating all four alike.
        bar_beat: locked ? report.barBeat : 0,
        harmony: report.harmony,
        tonal: report.tonal,
        centroid: report.centroid,
        ...report.levels,
      });
    } catch (error) {
      showBeatState({ state: "error" });
    } finally {
      sampling = false;
    }
  }

  setInterval(drain, BEAT_POLL_MS);
}

function updateMuffleButton() {
  const button = $("#muffle");
  button.classList.toggle("is-on", state.muffled);
  button.setAttribute("aria-pressed", String(state.muffled));
  button.textContent = state.muffled ? "Muffled" : "Muffle";
}

async function applyMuffle() {
  const view = $("#yt-view");
  if (!view || typeof view.executeJavaScript !== "function") return;
  try {
    const result = await view.executeJavaScript(muffleScript(state.muffled ? MUFFLED : OPEN));
    if (result && result.state === "starting") {
      toast("Click once inside the music page, then try Muffle again.", true);
    }
  } catch (error) {
    toast("Could not reach the music player to muffle it.", true);
  }
}

$("#muffle").addEventListener("click", () => {
  state.muffled = !state.muffled;
  updateMuffleButton();
  applyMuffle();
});

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

/* A search card follows its own download, so the button becomes the progress
   bar rather than sitting on "Queued…" for the whole two minutes. */
function syncDownloadButtons() {
  for (const job of state.jobs) {
    if (!job.video_id) continue;
    const button = document.querySelector(`[data-download="${CSS.escape(job.video_id)}"]`);
    if (!button) continue;

    if (job.status === "queued" || job.status === "downloading") {
      const percent = job.status === "queued" ? 0 : Math.round(job.progress || 0);
      button.disabled = true;
      button.classList.add("is-downloading");
      button.style.setProperty("--progress", `${percent}%`);
      button.innerHTML = `<span>${job.status === "queued" ? "Waiting…" : `${percent}%`}</span>`;
    } else if (job.status === "done") {
      button.classList.remove("is-downloading");
      button.style.removeProperty("--progress");
      button.disabled = true;
      button.textContent = "Downloaded";
    } else if (job.status === "failed") {
      button.classList.remove("is-downloading");
      button.style.removeProperty("--progress");
      button.disabled = false;
      button.textContent = "Download";
      state.queued.delete(job.video_id);
    }
  }
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
    syncDownloadButtons();

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
  const onStage = state.stage
    && state.stage.mode === "karaoke"
    && state.stage.karaoke
    && state.stage.karaoke.name === song.name;

  return `
    <article class="song${onStage ? " is-live" : ""}">
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

const FADE_MS = 1200;

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* Which source is live right now — whichever is louder. */
function karaokeIsLive() {
  return Number($("#vol-karaoke").value) >= Number($("#vol-music").value);
}

function updateCrossfadeLabel() {
  // The button names where the next tap takes you, not where you are.
  const goingToMusic = karaokeIsLive();
  $("#crossfade-label").textContent = goingToMusic ? "Music" : "Karaoke";
  const label = goingToMusic ? "Crossfade to the music" : "Crossfade to the karaoke";
  $("#crossfade").title = label;
  $("#crossfade").setAttribute("aria-label", label);
}

/* One tap swaps the room over: one source rides down to silence as the other
   comes up to where its fader was last left. */
function crossfade() {
  const fades = state.fades;
  if (fades.karaoke.frame) cancelAnimationFrame(fades.karaoke.frame);
  if (fades.music.frame) cancelAnimationFrame(fades.music.frame);

  const from = { karaoke: Number($("#vol-karaoke").value), music: Number($("#vol-music").value) };
  // Remember where each was before it gets dropped, so it comes back the same.
  for (const channel of ["karaoke", "music"]) {
    if (from[channel] > 0) fades[channel].restore = from[channel];
  }

  const toMusic = karaokeIsLive();
  const to = {
    karaoke: toMusic ? 0 : fades.karaoke.restore || 85,
    music: toMusic ? fades.music.restore || 60 : 0,
  };

  // The karaoke plays on the stage, so it goes as a single instruction and the
  // stage rides the fader itself; the music plays here and is ridden here.
  postJson("/api/stage", {
    volume: { karaoke: to.karaoke, music: to.music },
    fade: { to: to.karaoke, ms: FADE_MS, id: Date.now() },
  }).catch(() => {});

  const started = performance.now();
  function step(now) {
    const t = Math.min(1, (now - started) / FADE_MS);
    const eased = easeInOut(t);
    for (const channel of ["karaoke", "music"]) {
      const value = Math.round(from[channel] + (to[channel] - from[channel]) * eased);
      faderFor(channel).value = value;
      readoutFor(channel).textContent = value;
      applyLocally(channel, value);
    }
    if (t < 1) {
      fades.karaoke.frame = requestAnimationFrame(step);
    } else {
      fades.karaoke.frame = null;
      updateCrossfadeLabel();
    }
  }
  fades.karaoke.frame = requestAnimationFrame(step);
}

$("#crossfade").addEventListener("click", crossfade);

function onFaderMoved(event) {
  const channel = event.target.id === "vol-music" ? "music" : "karaoke";
  const value = Number(event.target.value);

  // A hand on a fader interrupts a crossfade in progress.
  for (const other of ["karaoke", "music"]) {
    if (state.fades[other].frame) {
      cancelAnimationFrame(state.fades[other].frame);
      state.fades[other].frame = null;
    }
  }
  if (value > 0) state.fades[channel].restore = value;
  updateCrossfadeLabel();

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

$("#now-reveal").addEventListener("click", () => {
  api("/api/stage/score", { method: "POST" }).catch((e) => toast(e.message, true));
});

$("#now-stop").innerHTML = ICONS.stop;
$("#now-reveal").innerHTML = ICONS.score;

function renderProgress(progress) {
  const position = (progress && progress.position) || 0;
  const duration = (progress && progress.duration) || 0;
  const percent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  $("#now-fill").style.width = `${percent}%`;
  $("#now-time").textContent = `${clock(position)} / ${clock(duration)}`;
}

/* Position is polled rather than pushed: it changes twice a second, and waking
   every subscriber that often would drown the stream carrying real decisions. */
async function pollProgress() {
  const live = Boolean(state.stage) && state.stage.mode === "karaoke";
  if (live) {
    try {
      renderProgress((await api("/api/stage")).progress);
    } catch (error) {
      /* the next tick will try again */
    }
  }
  clearTimeout(state.progressTimer);
  state.progressTimer = setTimeout(pollProgress, live ? 1000 : 2000);
}

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
    if (level > 0) state.fades[channel].restore = level;
  }
  updateCrossfadeLabel();

  const live = next.mode === "karaoke" && next.karaoke;
  $("#nowbar").hidden = !live;
  if (live) {
    $("#now-title").textContent = next.karaoke.title;
    $("#now-toggle").innerHTML = next.playing ? ICONS.pause : ICONS.play;
    const label = next.playing ? "Pause" : "Resume";
    $("#now-toggle").title = label;
    $("#now-toggle").setAttribute("aria-label", label);
    if (!previous || previous.mode !== "karaoke") pollProgress();
  }

  const score = next.score;
  $("#now-score").hidden = !score;
  if (score) $("#now-score").textContent = `Nota ${score.value} — ${score.rank}`;
  if (score && (!previous || !previous.score)) toast(`Nota: ${score.value}`);

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

/* The top bar wraps to two rows, and its height changes with the window, so
   everything pinned beneath it follows the measured value rather than a
   constant that goes stale the moment the layout reflows. */
function trackTopbarHeight() {
  const topbar = document.querySelector(".topbar");
  const publish = () => {
    document.documentElement.style.setProperty(
      "--topbar-h", `${Math.round(topbar.getBoundingClientRect().height)}px`);
  };
  publish();
  if (window.ResizeObserver) new ResizeObserver(publish).observe(topbar);
  else window.addEventListener("resize", publish);
}

/* ---------- boot ---------- */

trackTopbarHeight();
if (IS_DESKTOP) {
  setUpYouTubeView();
  startBeatFeed();
} else {
  // Nothing to filter or listen to: in a browser the music sits in a
  // cross-origin frame whose audio cannot be reached.
  $("#muffle").hidden = true;
  $("#beat").hidden = true;
}
updateCrossfadeLabel();
loadLibrary();
pollJobs();
subscribeToStage();
$("#search-input").focus();
