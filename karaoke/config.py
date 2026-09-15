"""Runtime configuration.

Everything is overridable through environment variables so the launcher script
(and tests) can point the app at a different folder without touching code.
"""

from __future__ import annotations

import os
import shutil
import sys
from functools import lru_cache
from pathlib import Path


def _video_folder(platform: str = sys.platform) -> str:
    """What this machine calls the folder it keeps video in.

    Taken as an argument rather than read from the module, because a test that
    patches sys.platform patches it for pathlib too, and pathlib then starts
    handing out Windows paths on a machine that cannot make them.
    """
    return "Movies" if platform == "darwin" else "Videos"


def _default_download_dir() -> Path:
    return Path.home() / _video_folder() / "Karaoke"


#: Where downloaded karaoke videos live, unless KARAOKE_DIR says otherwise.
DEFAULT_DOWNLOAD_DIR = _default_download_dir()

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


def cookie_problem() -> str:
    """Why the configured cookies are unusable, or ``""`` when they are fine."""
    browser = cookies_from_browser()
    if not browser:
        return ""
    from .cookies import probe

    usable, problem = probe(browser)
    return "" if usable else problem


def ydl_cookie_options() -> dict:
    """yt-dlp options carrying the configured browser cookies.

    Empty when none are configured, and also when they cannot be read: cookies
    are an optional aid, so an unreadable cookie jar must not break searching.
    """
    browser = cookies_from_browser()
    if not browser or cookie_problem():
        return {}
    return {"cookiesfrombrowser": (browser,)}


#: JavaScript runtimes yt-dlp can drive. YouTube now hides its format URLs
#: behind a JS challenge, so without one of these a download fails with
#: "Requested format is not available" even though the video is fine.
JS_RUNTIMES = ("deno", "bun", "node", "quickjs")


@lru_cache(maxsize=2)
def _bundled_node(windows: bool = os.name == "nt") -> str | None:
    """Node from the nodejs-wheel-binaries package, installed with our deps."""
    try:
        import nodejs_wheel
    except ImportError:
        return None
    # The wheel lays itself out differently per platform: a bin/ folder on
    # macOS and Linux, and the executable at the top level on Windows. Looking
    # in the wrong place means no JavaScript runtime, which means every
    # download fails with "Requested format is not available".
    root = Path(nodejs_wheel.__file__).parent
    path = root / "node.exe" if windows else root / "bin" / "node"
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
