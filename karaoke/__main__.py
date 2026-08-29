"""Entry point: ``python -m karaoke`` starts the app and opens the browser."""

from __future__ import annotations

import os
import sys
import threading
import webbrowser

from . import __version__, config, tls
from .server import create_app


def main() -> None:
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
    app.run(host=host, port=port, threaded=True, debug=False)


if __name__ == "__main__":
    main()
