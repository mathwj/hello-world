"""Browser cookie access, and what to do when macOS refuses it.

Safari keeps its cookies inside a protected container, so reading them needs
Full Disk Access granted to the app doing the reading — Terminal, here. Chrome
and Firefox are readable without it. Rather than let an unreadable cookie jar
take down search (which does not need cookies at all), we check once at startup
and carry on without them if they cannot be read.
"""

from __future__ import annotations

from functools import lru_cache

FULL_DISK_ACCESS_HINT = (
    "macOS blocked access to {browser}'s cookies. Either grant Terminal Full Disk "
    "Access (System Settings › Privacy & Security › Full Disk Access, add Terminal, "
    "then restart it), or use a browser that does not need it: "
    "KARAOKE_COOKIES_FROM_BROWSER=chrome"
)


class _SilentLogger:
    """yt-dlp's cookie reader logs chattily; the probe only needs the outcome."""

    def debug(self, message): pass
    def info(self, message): pass
    def warning(self, message, only_once=False): pass
    def error(self, message): pass


def is_permission_error(message: str) -> bool:
    """Does this error mean the OS refused us the cookie file?"""
    lowered = message.lower()
    return "operation not permitted" in lowered or "permission denied" in lowered


@lru_cache(maxsize=4)
def probe(browser: str) -> tuple[bool, str]:
    """Try to read ``browser``'s cookies. Returns ``(usable, problem)``."""
    try:
        from yt_dlp.cookies import extract_cookies_from_browser

        extract_cookies_from_browser(browser, logger=_SilentLogger())
        return True, ""
    except Exception as exc:
        message = str(exc) or exc.__class__.__name__
        if is_permission_error(message):
            return False, FULL_DISK_ACCESS_HINT.format(browser=browser.title())
        return False, f"Could not read {browser} cookies: {message}"
