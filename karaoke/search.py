"""YouTube search, restricted to karaoke results.

yt-dlp can run a YouTube search itself (``ytsearchN:<query>``), so no API key is
needed. Every query is rewritten to include the word "karaoke" before it is sent
upstream, which is what keeps a search for "perfect" showing "Perfect - Karaoke"
style results instead of the original recordings.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, asdict

from yt_dlp import YoutubeDL

from . import config

KARAOKE_TERM = "karaoke"
MAX_RESULTS = 40

_WHITESPACE = re.compile(r"\s+")


def build_query(term: str) -> str:
    """Turn a user's words into the karaoke-restricted query we search for.

    >>> build_query("perfect")
    'perfect karaoke'
    >>> build_query("  Karaoke   Bohemian Rhapsody ")
    'Karaoke Bohemian Rhapsody'
    """
    cleaned = _WHITESPACE.sub(" ", term).strip()
    if not cleaned:
        raise ValueError("Search term is empty")
    if KARAOKE_TERM in cleaned.lower():
        return cleaned
    return f"{cleaned} {KARAOKE_TERM}"


@dataclass(frozen=True)
class SearchResult:
    video_id: str
    title: str
    url: str
    duration: int | None
    duration_label: str
    channel: str
    thumbnail: str
    view_count: int | None

    def as_dict(self) -> dict:
        return asdict(self)


def format_duration(seconds: float | None) -> str:
    """Render a runtime as ``m:ss`` / ``h:mm:ss``; ``"--:--"`` when unknown."""
    if not seconds or seconds < 0:
        return "--:--"
    total = int(seconds)
    hours, remainder = divmod(total, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"


def _thumbnail_for(entry: dict) -> str:
    """Pick the largest thumbnail yt-dlp offered, else derive the standard one."""
    thumbnails = entry.get("thumbnails") or []
    usable = [t for t in thumbnails if t.get("url")]
    if usable:
        usable.sort(key=lambda t: (t.get("preference") or 0, t.get("width") or 0))
        return usable[-1]["url"]
    if entry.get("thumbnail"):
        return entry["thumbnail"]
    return f"https://i.ytimg.com/vi/{entry.get('id', '')}/mqdefault.jpg"


def parse_entry(entry: dict) -> SearchResult | None:
    """Normalise one yt-dlp search entry; ``None`` if it is not a playable video."""
    video_id = entry.get("id")
    if not video_id or entry.get("_type") == "playlist":
        return None
    duration = entry.get("duration")
    return SearchResult(
        video_id=video_id,
        title=entry.get("title") or "Untitled",
        url=entry.get("webpage_url") or f"https://www.youtube.com/watch?v={video_id}",
        duration=int(duration) if duration else None,
        duration_label=format_duration(duration),
        channel=entry.get("channel") or entry.get("uploader") or "Unknown channel",
        thumbnail=_thumbnail_for(entry),
        view_count=entry.get("view_count"),
    )


def _search_options() -> dict:
    return {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        # Flat extraction returns the search page's own metadata instead of
        # visiting every video, which keeps a 20-result search ~1 request.
        "extract_flat": "in_playlist",
        "default_search": "ytsearch",
        **config.ydl_cookie_options(),
        **config.ydl_js_options(),
    }


def search(term: str, limit: int = 20, *, ydl_factory=YoutubeDL) -> list[SearchResult]:
    """Search YouTube for karaoke versions of ``term``.

    ``ydl_factory`` exists so tests can inject a stub instead of hitting YouTube.
    """
    query = build_query(term)
    limit = max(1, min(int(limit), MAX_RESULTS))
    with ydl_factory(_search_options()) as ydl:
        info = ydl.extract_info(f"ytsearch{limit}:{query}", download=False)

    entries = (info or {}).get("entries") or []
    results = []
    for entry in entries:
        parsed = parse_entry(entry)
        if parsed is not None:
            results.append(parsed)
    return results
