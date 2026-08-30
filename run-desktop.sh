#!/usr/bin/env bash
# KaraokeBox as a desktop app, where the Music page can load youtube.com for
# real. Starts the local server, then opens the window.
set -euo pipefail

cd "$(dirname "$0")"
PORT="${KARAOKE_PORT:-8770}"

if [ ! -d desktop/node_modules ]; then
  echo "Setting up the desktop shell (first run only — this downloads Electron)…"
  ( cd desktop && npm install --silent )
fi

# The server may not end up on the port we asked for: something can hold a port
# without serving on it, and refusing to start over that is worse than moving.
# Where it landed is written down, and that is what the window is pointed at.
URL_FILE=".karaokebox-url"

# Reuse a server that is already running; otherwise start one and stop it with us.
if curl -fsS "http://127.0.0.1:${PORT}/api/status" >/dev/null 2>&1; then
  echo "Using the KaraokeBox already running on port ${PORT}."
  URL="http://127.0.0.1:${PORT}/"
else
  rm -f "$URL_FILE"
  KARAOKE_NO_BROWSER=1 KARAOKE_SCRIPT=./run-desktop.sh KARAOKE_URL_FILE="$URL_FILE" ./run.sh &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
  echo -n "Starting KaraokeBox"
  URL=""
  for _ in $(seq 1 90); do
    if [ -s "$URL_FILE" ]; then
      URL="$(cat "$URL_FILE")"
      if curl -fsS "${URL}api/status" >/dev/null 2>&1; then break; fi
    fi
    # A server that has given up — a port already taken, a missing dependency —
    # said why before it went. Ninety dots after that message hide it.
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      echo
      echo "The server stopped before it was ready — see the message above."
      exit 1
    fi
    echo -n "."
    sleep 1
  done
  echo
  if [ -z "$URL" ]; then
    echo "The server did not come up in ninety seconds. Start it on its own with"
    echo "./run.sh to see what it says."
    exit 1
  fi
fi

KARAOKE_URL="$URL" ./desktop/node_modules/.bin/electron desktop
