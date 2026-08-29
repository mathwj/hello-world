"""Entry point: ``python -m karaoke`` starts the app and opens the browser."""

from __future__ import annotations

import os
import threading
import webbrowser

from . import __version__, config, tls
from .server import create_app


def main() -> None:
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
