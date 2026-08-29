"""``python -m karaoke --doctor <video>`` — report why a download will not work.

Runs the same yt-dlp configuration the app uses, so what it prints is what the
app sees: the helper programs found, and the formats YouTube actually offered.
"""

from __future__ import annotations

from yt_dlp import YoutubeDL

from . import config
from .downloads import FORMAT_NO_FFMPEG, FORMAT_WITH_FFMPEG, DownloadManager


def _classify(formats: list[dict]) -> dict[str, int]:
    """Count formats by what a yt-dlp selector would consider them to be."""
    counts = {"video+audio": 0, "video-only": 0, "audio-only": 0, "audio unknown": 0, "other": 0}
    for fmt in formats:
        vcodec, acodec = fmt.get("vcodec"), fmt.get("acodec")
        has_video = vcodec not in (None, "none")
        if not has_video:
            counts["audio-only" if acodec not in (None, "none") else "other"] += 1
        elif acodec is None:
            # Matched by `bestvideo*`/`best*` but by neither `bestvideo` nor `best`.
            counts["audio unknown"] += 1
        elif acodec == "none":
            counts["video-only"] += 1
        else:
            counts["video+audio"] += 1
    return counts


def run(video: str) -> int:
    if not video.startswith("http"):
        video = f"https://www.youtube.com/watch?v={video}"

    runtime = config.js_runtime()
    print("KaraokeBox doctor\n")
    print(f"  js runtime : {runtime[0]} {runtime[1]}" if runtime else "  js runtime : MISSING")
    print(f"  ffmpeg     : {config.ffmpeg_path() or 'MISSING'}")
    print(f"  cookies    : {config.cookies_from_browser() or 'not configured'}")

    options = DownloadManager()._ydl_options("doctor")
    fmt = options["format"]
    print(f"  format     : {fmt}\n")

    # Ask for metadata only, with no format filter, so nothing is filtered out.
    probe = {**options, "format": None, "skip_download": True, "quiet": True, "no_warnings": False}
    probe.pop("progress_hooks", None)

    try:
        with YoutubeDL(probe) as ydl:
            info = ydl.extract_info(video, download=False)
    except Exception as exc:
        print(f"Extraction failed outright: {exc}")
        return 1

    formats = (info or {}).get("formats") or []
    print(f"Title   : {(info or {}).get('title', 'unknown')}")
    print(f"Formats : {len(formats)}")
    for label, count in _classify(formats).items():
        print(f"  {label:<14} {count}")

    if not formats:
        print("\nYouTube returned no formats at all — extraction is being blocked,")
        print("not format selection. Try KARAOKE_COOKIES_FROM_BROWSER=safari.")
        return 1

    print("\nFirst 25 formats:")
    print(f"  {'id':<16} {'ext':<5} {'resolution':<12} {'vcodec':<12} {'acodec':<12} note")
    for fmt_info in formats[:25]:
        print(
            f"  {str(fmt_info.get('format_id')):<16} {str(fmt_info.get('ext')):<5} "
            f"{str(fmt_info.get('resolution')):<12} {str(fmt_info.get('vcodec')):<12} "
            f"{str(fmt_info.get('acodec')):<12} {fmt_info.get('format_note') or ''}"
        )

    print("\nWhich selectors match:")
    for candidate in ("bestvideo+bestaudio", "bestvideo*+bestaudio", "best", "best*",
                      FORMAT_WITH_FFMPEG, FORMAT_NO_FFMPEG):
        try:
            with YoutubeDL({**probe, "format": candidate}) as ydl:
                selector = ydl.build_format_selector(candidate)
                matched = list(selector({"formats": formats, "incomplete_formats": False}))
            verdict = matched[0].get("format_id") if matched else "NO MATCH"
        except Exception as exc:
            verdict = f"error: {exc}"
        print(f"  {candidate:<52} {verdict}")
    return 0
