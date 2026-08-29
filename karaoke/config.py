"""Runtime configuration.

Everything is overridable through environment variables so the launcher script
(and tests) can point the app at a different folder without touching code.
"""

from __future__ import annotations

import os
import shutil
from functools import lru_cache
from pathlib import Path

#: Where downloaded karaoke videos live. macOS keeps user video in ~/Movies.
DEFAULT_DOWNLOAD_DIR = Path.home() / "Movies" / "Karaoke"

#: Media containers we are willing to list in the library and stream back.
MEDIA_EXTENSIONS = {".mp4", ".mkv", ".webm", ".m4v", ".mov"}

#: Image containers written alongside a download by ``--write-thumbnail``.
THUMBNAIL_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def download_dir() -> Path:
    """Return (and create) the folder downloads are written to."""
    raw = os.environ.get("KARAOKE_DIR")
    path = Path(raw).expanduser() if raw else DEFAULT_DOWNLOAD_DIR
    path.mkdir(parents=True, exist_ok=True)
    return path


def host() -> str:
    return os.environ.get("KARAOKE_HOST", "127.0.0.1")


def port() -> int:
    return int(os.environ.get("KARAOKE_PORT", "8770"))


def max_concurrent_downloads() -> int:
    return max(1, int(os.environ.get("KARAOKE_CONCURRENCY", "2")))


def cookies_from_browser() -> str | None:
    """Browser to pull YouTube cookies from, e.g. ``safari`` or ``chrome``.

    YouTube sometimes answers with "Sign in to confirm you're not a bot". Handing
    yt-dlp the cookies of a browser that is already signed in clears that check.
    """
    value = (os.environ.get("KARAOKE_COOKIES_FROM_BROWSER") or "").strip().lower()
    return value or None


def ydl_cookie_options() -> dict:
    """yt-dlp options carrying the configured browser cookies (empty if unset)."""
    browser = cookies_from_browser()
    return {"cookiesfrombrowser": (browser,)} if browser else {}


#: JavaScript runtimes yt-dlp can drive. YouTube now hides its format URLs
#: behind a JS challenge, so without one of these a download fails with
#: "Requested format is not available" even though the video is fine.
JS_RUNTIMES = ("deno", "bun", "node", "quickjs")


@lru_cache(maxsize=1)
def _bundled_node() -> str | None:
    """Node from the nodejs-wheel-binaries package, installed with our deps."""
    try:
        import nodejs_wheel
    except ImportError:
        return None
    binary = "node.exe" if os.name == "nt" else "node"
    path = Path(nodejs_wheel.__file__).parent / "bin" / binary
    return str(path) if path.exists() else None


def js_runtime() -> tuple[str, str] | None:
    """The JavaScript runtime to hand yt-dlp, as ``(name, path)``.

    A runtime the user installed deliberately wins. Our bundled Node is
    preferred over one merely found on PATH, because yt-dlp requires Node 22+
    and the bundled copy is known to satisfy that.
    """
    override = os.environ.get("KARAOKE_JS_RUNTIME")
    if override and os.path.exists(override):
        name = Path(override).stem.lower()
        if name in JS_RUNTIMES:
            return name, override

    for name in ("deno", "bun"):
        found = shutil.which(name)
        if found:
            return name, found

    bundled = _bundled_node()
    if bundled:
        return "node", bundled

    for name in ("node", "quickjs"):
        found = shutil.which(name)
        if found:
            return name, found
    return None


def ydl_js_options() -> dict:
    """yt-dlp options selecting the JavaScript runtime (empty if none found)."""
    runtime = js_runtime()
    return {"js_runtimes": {runtime[0]: {"path": runtime[1]}}} if runtime else {}


@lru_cache(maxsize=1)
def _bundled_ffmpeg() -> str | None:
    """ffmpeg from the imageio-ffmpeg wheel, installed alongside our other deps.

    This is the fallback that matters on a Mac: Homebrew's ffmpeg needs Homebrew,
    which needs Xcode's command line tools, which plenty of people do not have.
    The wheel just carries a static binary.
    """
    try:
        import imageio_ffmpeg
    except ImportError:
        return None
    try:
        exe = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None
    return exe if exe and os.path.exists(exe) else None


def ffmpeg_path() -> str | None:
    """Path to ffmpeg, or ``None`` when none can be found.

    yt-dlp needs ffmpeg to join YouTube's separate video and audio streams.
    Increasingly YouTube offers nothing else, so without it a download can fail
    outright rather than merely dropping in quality.
    """
    override = os.environ.get("KARAOKE_FFMPEG")
    if override and os.path.exists(override):
        return override
    return shutil.which("ffmpeg") or _bundled_ffmpeg()
