#!/usr/bin/env bash
# KaraokeBox launcher for macOS.
# Creates a virtualenv on first run, keeps yt-dlp current, then opens the app.
set -euo pipefail

cd "$(dirname "$0")"
VENV=".venv"
PYTHON="${PYTHON:-python3}"

if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "Python 3 is required. Install it from https://www.python.org or with: brew install python" >&2
  exit 1
fi

if [ ! -d "$VENV" ]; then
  echo "Setting up KaraokeBox (first run only)…"
  "$PYTHON" -m venv "$VENV"
  "$VENV/bin/pip" install --quiet --upgrade pip
  "$VENV/bin/pip" install --quiet -r requirements.txt
fi

# YouTube changes often; a stale yt-dlp is the usual cause of failed downloads.
if [ "${KARAOKE_SKIP_UPDATE:-0}" != "1" ]; then
  "$VENV/bin/pip" install --quiet --upgrade yt-dlp || echo "Could not update yt-dlp — continuing with the installed version."
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Note: ffmpeg not found. Downloads will use a lower-quality single stream."
  echo "      Install it for best quality:  brew install ffmpeg"
fi

exec "$VENV/bin/python" -m karaoke
