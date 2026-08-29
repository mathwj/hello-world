"""Entry point: ``python -m karaoke`` starts the app and opens the browser."""

from __future__ import annotations

import os
import sys
import threading
import webbrowser

from . import __version__, config, tls
from .server import create_app


def main() -> None:
    # Unknown arguments used to be ignored, which silently started the server
    # instead — confusing when an older copy of the app does not know a flag yet.
    if len(sys.argv) > 1 and sys.argv[1] not in ("--doctor", "--help", "-h"):
        print(f"Unknown option: {sys.argv[1]}")
        print("Usage: python -m karaoke [--doctor <youtube url or video id>]")
        raise SystemExit(2)

    if len(sys.argv) > 1 and sys.argv[1] in ("--help", "-h"):
        print("Usage: python -m karaoke [--doctor <youtube url or video id>]")
        print("  (no arguments)  start the app")
        print("  --doctor URL    report why a download fails")
        raise SystemExit(0)

    # `--doctor <video>` reports why downloads fail instead of starting the app.
    if len(sys.argv) > 1 and sys.argv[1] == "--doctor":
        from .diagnose import run

        tls.ensure_ca_bundle()
        if len(sys.argv) < 3:
            print("Usage: python -m karaoke --doctor <youtube url or video id>")
            raise SystemExit(2)
        raise SystemExit(run(sys.argv[2]))

    host, port = config.host(), config.port()
    target = config.download_dir()
    url = f"http://{host}:{port}/"

    bundle = tls.ensure_ca_bundle()

    print(f"KaraokeBox {__version__}")
    print(f"  library : {target}")
    if bundle:
        print("  certs   : using bundled certificates (system trust store is empty)")
    elif tls.system_ca_count() == 0:
        print("  certs   : WARNING no certificates found — searches will fail.")
        print("            Fix with:  .venv/bin/pip install certifi")
    problem = config.cookie_problem()
    if problem:
        print(f"  cookies : IGNORED — {problem}")
    elif config.cookies_from_browser():
        print(f"  cookies : {config.cookies_from_browser()}")

    runtime = config.js_runtime()
    if runtime:
        print(f"  js      : {runtime[0]} ({runtime[1]})")
    else:
        print("  js      : WARNING none found — downloads will fail.")
        print("            Fix with:  .venv/bin/pip install nodejs-wheel-binaries")

    if config.ffmpeg_path() is None:
        print("  ffmpeg  : not found — downloads fall back to lower quality.")
        print("            Install it with:  brew install ffmpeg")
    else:
        print(f"  ffmpeg  : {config.ffmpeg_path()}")
    print(f"  open    : {url}\n")

    # WERKZEUG_RUN_MAIN guards against opening a second tab on the reloader.
    if os.environ.get("KARAOKE_NO_BROWSER") != "1":
        threading.Timer(1.0, webbrowser.open, args=(url,)).start()

    app = create_app(target)
    try:
        app.run(host=host, port=port, threaded=True, debug=False)
    except OSError as exc:
        if "Address already in use" not in str(exc):
            raise
        print(f"\nPort {port} is already in use — KaraokeBox is probably running")
        print("in another Terminal window. Switch to it and press Ctrl+C, or start")
        print(f"this copy on a different port:  KARAOKE_PORT={port + 1} ./run.sh")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
