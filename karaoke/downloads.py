"""Background download queue built on yt-dlp.

Downloads run on a small pool of worker threads so the UI stays responsive and
so we never hammer YouTube with a dozen parallel jobs. Progress is pushed from
yt-dlp's progress hook into an in-memory job record that the web UI polls.
"""

from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass, field, asdict
from pathlib import Path
from queue import Queue

from yt_dlp import YoutubeDL

from . import config

QUEUED = "queued"
DOWNLOADING = "downloading"
DONE = "done"
FAILED = "failed"

#: Prefer a real mp4 so QuickTime/Safari can play it; fall back progressively.
#: The bare `bestvideo+bestaudio` rung matters for videos YouTube offers only
#: above 1080p, and `best` for the rare one with no separate streams at all.
#: `bestvideo` means a *video-only* stream, so it silently misses formats whose
#: audio codec YouTube did not declare -- and `best` misses them too, because it
#: demands a known audio codec. `bestvideo*` and `best*` accept them. The tail of
#: this chain is yt-dlp's own default, which is deliberately that forgiving.
FORMAT_WITH_FFMPEG = (
    "bestvideo[height<=1080]+bestaudio/best[height<=1080]"
    "/bestvideo*+bestaudio/best/best*"
)
FORMAT_NO_FFMPEG = "best[ext=mp4]/best/best*"

#: ``%(title).120B`` truncates on byte boundaries, so long titles stay valid.
OUTPUT_TEMPLATE = "%(title).120B [%(id)s].%(ext)s"


@dataclass
class Job:
    id: str
    url: str
    title: str
    thumbnail: str = ""
    status: str = QUEUED
    progress: float = 0.0
    downloaded_bytes: int = 0
    total_bytes: int = 0
    speed: float | None = None
    eta: int | None = None
    error: str = ""
    filename: str = ""
    created_at: float = field(default_factory=time.time)

    def as_dict(self) -> dict:
        return asdict(self)


class DownloadManager:
    """Thread-safe queue of yt-dlp download jobs."""

    def __init__(self, target_dir: Path | None = None, workers: int | None = None):
        self._dir = Path(target_dir) if target_dir else config.download_dir()
        self._queue: Queue[str] = Queue()
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()
        self._workers: list[threading.Thread] = []
        self._worker_count = workers if workers is not None else config.max_concurrent_downloads()

    # -- public API ---------------------------------------------------------

    @property
    def target_dir(self) -> Path:
        return self._dir

    def enqueue(self, url: str, title: str = "", thumbnail: str = "") -> Job:
        """Add a video to the queue and make sure a worker is alive to take it."""
        job = Job(id=uuid.uuid4().hex, url=url, title=title or url, thumbnail=thumbnail)
        with self._lock:
            self._jobs[job.id] = job
        self._ensure_workers()
        self._queue.put(job.id)
        return job

    def jobs(self) -> list[dict]:
        """Every job, newest first."""
        with self._lock:
            snapshot = [job.as_dict() for job in self._jobs.values()]
        snapshot.sort(key=lambda j: j["created_at"], reverse=True)
        return snapshot

    def get(self, job_id: str) -> dict | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return job.as_dict() if job else None

    def clear_finished(self) -> int:
        """Drop done/failed jobs from the list. Returns how many were removed."""
        with self._lock:
            finished = [jid for jid, job in self._jobs.items() if job.status in (DONE, FAILED)]
            for jid in finished:
                del self._jobs[jid]
        return len(finished)

    # -- internals ----------------------------------------------------------

    def _ensure_workers(self) -> None:
        with self._lock:
            self._workers = [w for w in self._workers if w.is_alive()]
            missing = self._worker_count - len(self._workers)
            for _ in range(max(0, missing)):
                worker = threading.Thread(target=self._run_worker, daemon=True)
                worker.start()
                self._workers.append(worker)

    def _run_worker(self) -> None:
        while True:
            job_id = self._queue.get()
            try:
                self._download(job_id)
            finally:
                self._queue.task_done()

    def _update(self, job_id: str, **fields) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return
            for key, value in fields.items():
                setattr(job, key, value)

    def _progress_hook(self, job_id: str):
        def hook(payload: dict) -> None:
            status = payload.get("status")
            if status == "downloading":
                total = payload.get("total_bytes") or payload.get("total_bytes_estimate") or 0
                done = payload.get("downloaded_bytes") or 0
                self._update(
                    job_id,
                    status=DOWNLOADING,
                    downloaded_bytes=int(done),
                    total_bytes=int(total),
                    progress=round(done / total * 100, 1) if total else 0.0,
                    speed=payload.get("speed"),
                    eta=payload.get("eta"),
                )
            elif status == "finished":
                # Merging/remuxing may still follow, so don't report 100% yet.
                self._update(job_id, status=DOWNLOADING, progress=99.0, speed=None, eta=None)

        return hook

    def _ydl_options(self, job_id: str) -> dict:
        has_ffmpeg = config.ffmpeg_path() is not None
        options = {
            "quiet": True,
            "no_warnings": True,
            "noplaylist": True,
            # Progress reaches the UI through the hook; keep it out of the terminal.
            "noprogress": True,
            "format": FORMAT_WITH_FFMPEG if has_ffmpeg else FORMAT_NO_FFMPEG,
            "outtmpl": str(self._dir / OUTPUT_TEMPLATE),
            "paths": {"home": str(self._dir)},
            "writeinfojson": True,
            "writethumbnail": True,
            "retries": 5,
            "fragment_retries": 5,
            "progress_hooks": [self._progress_hook(job_id)],
            **config.ydl_cookie_options(),
            **config.ydl_js_options(),
        }
        if has_ffmpeg:
            options["merge_output_format"] = "mp4"
            options["ffmpeg_location"] = config.ffmpeg_path()
        return options

    def _download(self, job_id: str) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
        if job is None:
            return

        self._update(job_id, status=DOWNLOADING, error="")
        try:
            self._dir.mkdir(parents=True, exist_ok=True)
            with YoutubeDL(self._ydl_options(job_id)) as ydl:
                info = ydl.extract_info(job.url, download=True)
            filename = _final_filename(info)
            self._update(
                job_id,
                status=DONE,
                progress=100.0,
                filename=filename,
                title=(info or {}).get("title") or job.title,
                speed=None,
                eta=None,
            )
        except Exception as exc:  # yt-dlp raises a wide range of errors
            self._update(job_id, status=FAILED, error=explain_error(exc))


#: YouTube's anti-bot challenge, which browser cookies are the documented fix for.
BOT_CHECK_HINT = (
    "YouTube asked this download to prove it is not a bot. Restart KaraokeBox with "
    "KARAOKE_COOKIES_FROM_BROWSER=safari (or chrome/firefox/edge) to reuse the cookies "
    "of a browser you are already signed into."
)


#: Raised when no format matched. Almost always means ffmpeg is missing and
#: YouTube offered this video only as separate video and audio streams.
NO_FORMAT_HINT = (
    "None of YouTube's formats could be used. This usually means a missing "
    "JavaScript runtime — YouTube hides its download links behind a JavaScript "
    "challenge that yt-dlp needs Node or Deno to solve. Restart KaraokeBox so it "
    "can install one, or run `.venv/bin/pip install nodejs-wheel-binaries` "
    "yourself. If it persists, ffmpeg may also be missing."
)


def explain_error(exc: Exception) -> str:
    """Turn a raw yt-dlp error into something worth showing in the UI."""
    message = str(exc) or exc.__class__.__name__
    if "not a bot" in message or "Sign in to confirm" in message:
        return BOT_CHECK_HINT
    if "Requested format is not available" in message:
        return NO_FORMAT_HINT
    from .cookies import is_permission_error

    if is_permission_error(message) and "ookie" in message:
        return config.cookie_problem() or message
    if "Video unavailable" in message or "private video" in message.lower():
        return "That video is unavailable — try another result."
    # yt-dlp prefixes its own errors; the prefix adds nothing for the user.
    return message.replace("ERROR: ", "").strip()


def _final_filename(info: dict | None) -> str:
    """Extract the on-disk name yt-dlp settled on after any merge/remux."""
    if not info:
        return ""
    downloads = info.get("requested_downloads") or []
    for entry in downloads:
        path = entry.get("filepath") or entry.get("_filename")
        if path:
            return Path(path).name
    path = info.get("filepath") or info.get("_filename")
    return Path(path).name if path else ""
