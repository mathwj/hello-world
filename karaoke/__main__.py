"""Entry point: ``python -m karaoke`` starts the app and opens the browser."""

from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import sys
import threading
import urllib.error
import urllib.request
import webbrowser

from . import __version__, config, tls
from .server import create_app

WINDOWS = sys.platform == "win32"

#: How to name the virtualenv's own python and pip in a message someone is
#: going to paste into their shell. The layout differs per platform, and an
#: instruction that cannot be pasted is not an instruction.
VENV_PYTHON = r".venv\Scripts\python" if WINDOWS else ".venv/bin/python"
VENV_PIP = r".venv\Scripts\pip" if WINDOWS else ".venv/bin/pip"


def port_is_free(host: str, port: int) -> bool:
    """Can we still claim this port? Werkzeug exits before we could ask later."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((host, port))
            return True
        except OSError:
            return False


def choose_port(host: str, wanted: int) -> int | None:
    """The port to serve on: the one asked for, or the next one free.

    A port can be held by something that is not serving on it at all — a
    leftover process that inherited the socket, most often — and then nothing
    can be opened there and nothing answers there either, which is a strange
    thing to be stopped by. Unless a port was named deliberately, stepping to
    the next free one is better than refusing to start.
    """
    if port_is_free(host, wanted):
        return wanted
    if "KARAOKE_PORT" in os.environ:
        return None                      # asked for by name: say so, do not move
    for candidate in range(wanted + 1, wanted + 10):
        if port_is_free(host, candidate):
            return candidate
    return None


def whoever_has(host: str, port: int) -> str:
    """Who is holding the port, in as much detail as can be found out.

    Guessing at this is what makes it confusing: told that KaraokeBox is
    "probably" still running, you go and close a KaraokeBox that was not the
    problem, and are told the same thing again. Two questions settle it — does
    it answer as KaraokeBox, and failing that, what does the system say is
    listening.
    """
    try:
        with urllib.request.urlopen(f"http://{host}:{port}/api/status", timeout=2) as answer:
            body = json.load(answer)
        if isinstance(body, dict) and "download_dir" in body:
            return (f"Another KaraokeBox is already running there, on "
                    f"{body['download_dir']}.\nOpen http://{host}:{port}/ to use it, "
                    "or close it and start again.")
        return "Something that is not KaraokeBox is answering on that port."
    except (urllib.error.URLError, OSError, ValueError, json.JSONDecodeError):
        pass

    unknown = "Something has it, and it does not answer as KaraokeBox."
    listening = _listening_on(port)
    return f"Held by: {listening}" if listening else unknown


def _listening_on(port: int) -> str:
    """What the system says has the port, named as plainly as it can be."""
    if WINDOWS:
        return _windows_holder(port)

    if not shutil.which("lsof"):
        return ""
    try:
        # Every socket on the port, not only one that is listening. A process
        # that holds the port without serving on it — a leftover child that
        # inherited the socket, most often — is exactly the case that looks
        # impossible from the outside: the port cannot be claimed, and nothing
        # answers on it either.
        listed = subprocess.run(["lsof", "-nP", f"-i:{port}"],
                                capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return ""
    rows = [line.split() for line in listed.stdout.splitlines()[1:] if line.split()]
    return ", ".join(f"{row[0]} (pid {row[1]})" for row in rows[:3])


def _windows_holder(port: int) -> str:
    """The same question on Windows, where there is no lsof: netstat, then the
    task list to turn the process id into a name worth reading."""
    try:
        listed = subprocess.run(["netstat", "-ano", "-p", "tcp"],
                                capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return ""

    pids = []
    for line in listed.stdout.splitlines():
        parts = line.split()
        if len(parts) < 5 or not parts[1].endswith(f":{port}"):
            continue
        if parts[-1].isdigit() and parts[-1] not in pids:
            pids.append(parts[-1])
    if not pids:
        return ""

    named = []
    for pid in pids[:3]:
        name = ""
        try:
            tasks = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH", "/FO", "CSV"],
                                   capture_output=True, text=True, timeout=10)
            first = tasks.stdout.strip().splitlines()[:1]
            if first and first[0].startswith('"'):
                name = first[0].split('","')[0].strip('"')
        except (OSError, subprocess.SubprocessError, IndexError):
            pass
        named.append(f"{name} (pid {pid})" if name else f"pid {pid}")
    return ", ".join(named)


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

    host, wanted = config.host(), config.port()
    target = config.download_dir()

    # None means the port was named deliberately and is taken; the banner still
    # prints, because what it says about certificates and helpers is worth
    # having either way, and then the trouble is explained under it.
    port = choose_port(host, wanted)
    url = f"http://{host}:{port or wanted}/"

    bundle = tls.ensure_ca_bundle()

    print(f"KaraokeBox {__version__}")
    print(f"  library : {target}")
    if bundle:
        print("  certs   : using bundled certificates (system trust store is empty)")
    elif tls.system_ca_count() == 0:
        print("  certs   : WARNING no certificates found — searches will fail.")
        print(f"            Fix with:  {VENV_PIP} install certifi")
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
        print(f"            Fix with:  {VENV_PIP} install nodejs-wheel-binaries")

    if config.ffmpeg_path() is None:
        print("  ffmpeg  : not found — downloads fall back to lower quality.")
        print(f"            Fix with:  {VENV_PIP} install imageio-ffmpeg")
    else:
        print(f"  ffmpeg  : {config.ffmpeg_path()}")
    if port is not None and port != wanted:
        print(f"  port    : {wanted} was busy, so this copy is on {port}")
    print(f"  open    : {url}\n")

    if port is None:
        script = os.environ.get("KARAOKE_SCRIPT", "./run.sh")
        print(f"\nPort {wanted} is already in use.")
        print(f"{whoever_has(host, wanted)}\n")
        print("To close whatever has it:")
        if WINDOWS:
            print(f"\n    for /f \"tokens=5\" %p in ('netstat -ano ^| findstr :{wanted}') "
                  "do taskkill /PID %p /F\n")
        else:
            print(f"\n    lsof -ti tcp:{wanted} | xargs kill\n")
        # Worth closing rather than working around: an old copy left running is
        # also an old copy of the code, so an update appears not to have worked.
        print("Closing it is usually what you want — an old copy still running")
        print("is the old version of the app, so an update looks like it did")
        print("nothing. To leave it where it is and run this copy beside it:")
        print(f"\n    KARAOKE_PORT={wanted + 1} {script}\n")
        print("Diagnostics do not need the port:")
        print(f"    {VENV_PYTHON} -m karaoke --doctor <video id>")
        raise SystemExit(1)

    # Written for whatever started us: run-desktop.sh has to point a window at
    # this, and after moving ports it can no longer work the address out itself.
    url_file = os.environ.get("KARAOKE_URL_FILE")
    if url_file and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        try:
            with open(url_file, "w", encoding="utf-8") as handle:
                handle.write(url)
        except OSError:
            pass                          # a window opened by hand still works

    # WERKZEUG_RUN_MAIN guards against opening a second tab on the reloader.
    if os.environ.get("KARAOKE_NO_BROWSER") != "1":
        threading.Timer(1.0, webbrowser.open, args=(url,)).start()

    app = create_app(target)
    app.run(host=host, port=port, threaded=True, debug=False)


if __name__ == "__main__":
    main()
