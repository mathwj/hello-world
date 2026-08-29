# KaraokeBox

A karaoke app for the Mac. Search YouTube for backing tracks, download them with
[yt-dlp](https://github.com/yt-dlp/yt-dlp), and sing along from your own offline
library — no ads, no buffering, no internet needed once a song is saved.

Every search is restricted to karaoke versions: type **perfect** and the app
searches for **perfect karaoke**, so you pick from the backing tracks rather than
the original recordings.

## Requirements

- macOS with Python 3 (`python3 --version`; install with `brew install python` if missing)
That is genuinely all. ffmpeg — which joins YouTube's separate video and audio
streams, and which most videos now require — is installed automatically as a
Python package, so you do not need Homebrew or Xcode's command line tools. If
you already have your own ffmpeg on `PATH`, KaraokeBox uses that instead.

## Run it

```sh
./run.sh
```

The first run creates a virtualenv and installs the dependencies; after that it
starts in a second. The app opens at <http://127.0.0.1:8770> in your browser and
listens on localhost only.

## Using it

1. **Search** — type a song title (`perfect`, `bohemian rhapsody`). Results are
   karaoke versions, with thumbnail, channel, and runtime.
2. **Download** — hit *Download* on the one you want. It queues up and downloads
   in the background; the *Downloads* tab shows live progress. Songs you already
   have are marked *Downloaded*.
3. **Sing** — the *My songs* tab lists your library. *Sing* opens the full-screen
   player (`Esc` closes it). *Delete* removes the video and its metadata.

Songs are saved to `~/Movies/Karaoke` by default.

## Configuration

All settings are environment variables:

| Variable | Default | What it does |
| --- | --- | --- |
| `KARAOKE_DIR` | `~/Movies/Karaoke` | Where songs are saved |
| `KARAOKE_PORT` | `8770` | Port the app listens on |
| `KARAOKE_HOST` | `127.0.0.1` | Interface to bind |
| `KARAOKE_CONCURRENCY` | `2` | Simultaneous downloads |
| `KARAOKE_COOKIES_FROM_BROWSER` | unset | Browser to take YouTube cookies from (see below) |
| `KARAOKE_FFMPEG` | unset | Path to a specific ffmpeg binary |
| `KARAOKE_NO_BROWSER` | unset | Set to `1` to not auto-open a browser tab |
| `KARAOKE_SKIP_UPDATE` | unset | Set to `1` to skip the yt-dlp update on launch |

```sh
KARAOKE_DIR=~/Music/Karaoke KARAOKE_PORT=9000 ./run.sh
```

## Troubleshooting

**"YouTube asked this download to prove it is not a bot."** YouTube is
challenging the request. Point the app at a browser you are already signed into:

```sh
KARAOKE_COOKIES_FROM_BROWSER=safari ./run.sh   # or chrome, firefox, edge, brave
```

**"Search failed: CERTIFICATE_VERIFY_FAILED".** Python installed from
python.org does not use the macOS keychain, so it starts with an empty list of
trusted certificate authorities. KaraokeBox ships `certifi` to cover this, but
an older copy of the app may be missing it:

```sh
.venv/bin/pip install certifi
```

Then restart the app. To fix it for every Python program on your Mac, not just
this one, double-click **Install Certificates.command** inside your
`/Applications/Python 3.x/` folder.

**A download fails but the search worked.** YouTube changes often and yt-dlp
tracks those changes. `run.sh` updates yt-dlp on every launch, so quitting and
relaunching usually fixes it.

**"YouTube only offers this video as separate video and audio streams."**
ffmpeg could not be found. It normally installs with everything else; force it
with `.venv/bin/pip install imageio-ffmpeg`, or point `KARAOKE_FFMPEG` at an
ffmpeg you already have.

## How it works

```
karaoke/
  search.py      forces "karaoke" into the query, runs yt-dlp's ytsearch
  downloads.py   thread-pool download queue with live progress
  library.py     reads the download folder + yt-dlp's .info.json sidecars
  server.py      Flask JSON API and media streaming (HTTP Range, so seeking works)
  static/        the UI
```

There is no database — the folder of videos *is* the library, so you can move,
back up, or play the files with QuickTime like any other download.

## Development

```sh
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest
```

The tests stub out yt-dlp, so the suite runs offline in well under a second.

## A note on what you download

KaraokeBox downloads videos you choose from YouTube for your own offline use.
What you may keep and where you may perform it is between you, YouTube's terms,
and the rights holders — please use it for your own singing.
