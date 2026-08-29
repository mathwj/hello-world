"""The on-disk library of downloaded karaoke videos.

The folder itself is the source of truth — there is no database. Each video may
have two sidecar files written by yt-dlp: ``<stem>.info.json`` (metadata) and
``<stem>.<ext>`` (thumbnail), which we use to make the library grid look like
the search grid.
"""

from __future__ import annotations

import json
from pathlib import Path

from . import config
from .search import format_duration


def _read_info(media: Path) -> dict:
    """Load the ``.info.json`` yt-dlp wrote next to a download, if any."""
    sidecar = media.with_suffix(".info.json")
    if not sidecar.exists():
        return {}
    try:
        with sidecar.open(encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return {}


def _find_thumbnail(media: Path) -> str:
    for ext in config.THUMBNAIL_EXTENSIONS:
        candidate = media.with_suffix(ext)
        if candidate.exists():
            return candidate.name
    return ""


def entry_for(media: Path) -> dict:
    info = _read_info(media)
    stat = media.stat()
    duration = info.get("duration")
    return {
        "name": media.name,
        "title": info.get("title") or media.stem,
        "channel": info.get("channel") or info.get("uploader") or "",
        "video_id": info.get("id", ""),
        "duration": duration,
        "duration_label": format_duration(duration),
        "size_bytes": stat.st_size,
        "added_at": stat.st_mtime,
        "thumbnail": _find_thumbnail(media),
    }


def list_songs(directory: Path | None = None) -> list[dict]:
    """Every downloaded karaoke video, most recently added first."""
    root = Path(directory) if directory else config.download_dir()
    if not root.exists():
        return []
    songs = [
        entry_for(item)
        for item in root.iterdir()
        if item.is_file() and item.suffix.lower() in config.MEDIA_EXTENSIONS
    ]
    songs.sort(key=lambda song: song["added_at"], reverse=True)
    return songs


def resolve(name: str, directory: Path | None = None) -> Path | None:
    """Resolve a library filename to a real path inside the download folder.

    Returns ``None`` for anything that escapes the folder (``../``, absolute
    paths, symlinks pointing elsewhere) so the media routes cannot be used to
    read arbitrary files off the Mac.
    """
    root = (Path(directory) if directory else config.download_dir()).resolve()
    if not name or "/" in name or "\\" in name or name in (".", ".."):
        return None
    candidate = (root / name).resolve()
    if candidate.parent != root or not candidate.is_file():
        return None
    return candidate


def delete(name: str, directory: Path | None = None) -> bool:
    """Remove a song plus its sidecar metadata/thumbnail. True if it existed."""
    media = resolve(name, directory)
    if media is None or media.suffix.lower() not in config.MEDIA_EXTENSIONS:
        return False
    for sidecar_ext in (".info.json", *config.THUMBNAIL_EXTENSIONS):
        sidecar = media.with_suffix(sidecar_ext)
        if sidecar.exists():
            sidecar.unlink()
    media.unlink()
    return True
