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

# Reuse a server that is already running; otherwise start one and stop it with us.
if curl -fsS "http://127.0.0.1:${PORT}/api/status" >/dev/null 2>&1; then
  echo "Using the KaraokeBox already running on port ${PORT}."
else
  KARAOKE_NO_BROWSER=1 ./run.sh &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
  echo -n "Starting KaraokeBox"
  for _ in $(seq 1 90); do
    if curl -fsS "http://127.0.0.1:${PORT}/api/status" >/dev/null 2>&1; then break; fi
    echo -n "."
    sleep 1
  done
  echo
fi

KARAOKE_URL="http://127.0.0.1:${PORT}/" ./desktop/node_modules/.bin/electron desktop
