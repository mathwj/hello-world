# KaraokeBox

A karaoke app for the Mac. Search YouTube for backing tracks, download them with
[yt-dlp](https://github.com/yt-dlp/yt-dlp), and sing along from your own offline
library — no ads, no buffering, no internet needed once a song is saved.

Every search is restricted to karaoke versions: type **perfect** and the app
searches for **perfect karaoke**, so you pick from the backing tracks rather than
the original recordings.

## Requirements

- macOS with Python 3 (`python3 --version`; install with `brew install python` if missing)
That is genuinely all. Two helper programs are needed to download from YouTube,
and both install automatically as Python packages — no Homebrew, no Xcode
command line tools:

- **A JavaScript runtime.** YouTube hides its download links behind a JavaScript
  challenge that yt-dlp must solve, so Node is installed alongside the app. If
  you already run Deno, Bun, or your own Node, KaraokeBox uses that instead.
- **ffmpeg**, which joins YouTube's separate video and audio streams. Most
  videos now offer nothing else, so this is required rather than a nicety. Your
  own ffmpeg on `PATH` wins if you have one.

## Run it

```sh
./run-desktop.sh     # desktop app — the Music page is real youtube.com
```

or, if you would rather stay in your browser:

```sh
./run.sh
```

The desktop build exists for one reason: only a desktop window can show
youtube.com itself. In a browser tab it cannot be done — the site answers with
`X-Frame-Options: SAMEORIGIN` and every browser refuses to render it inside
another page. The first `./run-desktop.sh` downloads Electron, so give it a few
minutes; after that it starts in seconds.

The first run creates a virtualenv and installs the dependencies; after that it
starts in a second. The app opens at <http://127.0.0.1:8770> in your browser and
listens on localhost only. If something else has that port, it moves to the next
one free and says so — a port can even be held by a leftover process that is not
serving anything, and being stopped by that is no use to anybody. Set
`KARAOKE_PORT` yourself and it stays where you put it, or says why it cannot.

## Two screens

KaraokeBox runs on two screens: the **operator console** on your laptop, and the
**stage** on the screen everyone is watching.

1. Start the app. The operator console opens at <http://127.0.0.1:8770>.
2. Drag a browser window onto the second display, open **Stage** from the top
   right of the console, and full-screen it (`Ctrl`+`Cmd`+`F`).
3. **Click that window once.** Browsers refuse to play sound until someone
   interacts with the page, and nobody touches the stage screen once the night
   starts. The console's *Stage ready* light turns green when it is connected.

The karaoke plays on the stage; the between-songs music plays on the laptop.
Either way the console stays free to search and download while something runs.

### Between songs

With nobody singing, the stage answers to whatever is playing on the Music page.
The laptop listens to it and sends what it hears across: the tempo and where the
bar starts, the level and attack of seven frequency bands, the harmony folded
onto twelve pitch classes, and how bright the sound is. The waiting screen has a
family of shapes for each band — the sub is enormous and slow, the hats are
small and quick — running off its own copy of the beat grid rather than waiting
for messages to arrive, so it stays in time rather than trailing the music.
They dance rather than pulse. Because the grid knows when the next beat is
coming, a shape can gather itself just before one, land on it, settle after it,
shift its weight across the bar and travel the floor between bars — and it
squashes as it lands, the way anything with weight does. Each family dances to
its own part: the bass on the beat, the snare family on two and four, the hats
on the offbeat, the air on the sixteenths, and the shapes that follow the voice
whenever the voice moves. With no music they stop dancing and go back to
drifting.

The tempo is worked out from what is playing now rather than from the last
several seconds equally, and the history is thrown away at a gap between tracks
or when the grid stops fitting what it can hear, so a new song is picked up in
about three seconds instead of being averaged with the one before it.

The **Beat** light in the mixer shows the tempo it has settled on, so a wrong
lock is obvious at a glance. *Listening* means it can hear the music but has not
found a steady tempo yet; the shapes still move with the bands meanwhile.

## Using it

1. **Karaoke** — search for a song (`perfect`, `bohemian rhapsody`). Results are
   karaoke versions only. *Download* turns the button into its own progress bar
   and counts up as it goes; you can keep working while it runs.
2. **My songs** — your library. *Play on stage* starts the song on the audience
   screen and marks the card *On stage*. When it ends, the score screen and its
   drum roll play there too — for the room, not for you.
3. **Music** — for the records between singers, playing **on your laptop**, not
   on the stage: both windows are on the same Mac and so the same speakers, and
   the audience screen stays on the karaoke.

   In the **desktop app** this page *is* youtube.com — the real site, your own
   account, YouTube's own interface — with back, forward and reload above it.
   Sign in once and it stays signed in.

   In a **browser** it falls back to searching YouTube, opening links you paste,
   and playing them in YouTube's embedded player, since a tab cannot show the
   site itself.
4. **The mixer** sits in the top bar of every tab: a fader each for the karaoke
   and the music, plus two buttons.

   - **Crossfade** swaps the room over in one tap — whichever source is live
     rides down to silence as the other comes up to where its fader was left.
     The button names where the next tap will take you.
   - **Muffle** filters the music down as if it were playing in the next room,
     fading in and out rather than switching. Desktop app only: in a browser the
     music sits in a cross-origin frame whose audio cannot be reached.

5. The bar under the header shows what is playing, with a progress bar and clock,
   play/pause, **Score** — which ends the song where it is and puts the number up
   on the stage — and stop.

Songs are saved to `~/Movies/Karaoke` by default.

## Your own logo

Drop a file named `logo.svg` (or `.png`, `.webp`, `.jpg`) into
`karaoke/static/` and both screens use it — the operator's top bar and the
stage's waiting card — in place of the wordmark and microphone. Nothing else to
change. A wide, transparent-background image works best. The operator's bar is
near-black, so light artwork suits it; the stage's waiting card is cyan and
renders the logo solid black whatever colour it was drawn in, so a white
transparent export works on both.

## Configuration

All settings are environment variables:

| Variable | Default | What it does |
| --- | --- | --- |
| `KARAOKE_DIR` | `~/Movies/Karaoke` | Where songs are saved |
| `KARAOKE_PORT` | `8770` | Port the app listens on (see below) |
| `KARAOKE_HOST` | `127.0.0.1` | Interface to bind |
| `KARAOKE_CONCURRENCY` | `2` | Simultaneous downloads |
| `KARAOKE_COOKIES_FROM_BROWSER` | unset | Browser to take YouTube cookies from (see below) |
| `KARAOKE_FFMPEG` | unset | Path to a specific ffmpeg binary |
| `KARAOKE_JS_RUNTIME` | unset | Path to a specific deno/bun/node/quickjs binary |
| `KARAOKE_NO_BROWSER` | unset | Set to `1` to not auto-open a browser tab |
| `KARAOKE_SKIP_UPDATE` | unset | Set to `1` to skip the yt-dlp update on launch |

```sh
KARAOKE_DIR=~/Music/Karaoke KARAOKE_PORT=9000 ./run.sh
```

## Troubleshooting

**"YouTube asked this download to prove it is not a bot."** YouTube is
challenging the request. Point the app at a browser you are already signed into:

```sh
KARAOKE_COOKIES_FROM_BROWSER=chrome ./run.sh   # or firefox, edge, brave, safari
```

Safari is the awkward one: macOS keeps its cookies in a protected container, so
reading them needs Full Disk Access granted to Terminal (System Settings ›
Privacy & Security › Full Disk Access — add Terminal and restart it). Chrome and
Firefox need no such permission. If cookies cannot be read, KaraokeBox says so at
startup and carries on without them rather than failing.

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

**"None of YouTube's formats could be used"** / `Requested format is not
available`. Almost always a missing JavaScript runtime — without one, yt-dlp
cannot unlock the download links, so searching keeps working while every
download fails. The startup banner's `js` line says whether one was found. To
force the install:

```sh
.venv/bin/pip install nodejs-wheel-binaries imageio-ffmpeg
```

## Diagnosing a failed download

When a download fails, this reports what the app sees — the helper programs it
found, and the formats YouTube actually offered for that video:

```sh
.venv/bin/python -m karaoke --doctor "https://www.youtube.com/watch?v=VIDEO_ID"
```

It uses exactly the configuration the app uses, so its output reflects the real
failure rather than a different code path.

## How it works

```
karaoke/
  search.py      forces "karaoke" into the query, runs yt-dlp's ytsearch
  downloads.py   thread-pool download queue with live progress
  library.py     reads the download folder + yt-dlp's .info.json sidecars
  config.py      locates ffmpeg and a JavaScript runtime, bundled or your own
  diagnose.py    the --doctor report
  stage.py       the karaoke state both screens agree on, pushed to watchers,
                 plus the music's bass kicks on a channel of their own
  server.py      Flask JSON API and media streaming (HTTP Range, so seeking works)
  static/        app.js is the console, stage.js the audience screen,
                 score.js the reveal they share
desktop/         the Electron shell, whose only job is hosting real youtube.com
```

There is no database — the folder of videos *is* the library, so you can move,
back up, or play the files with QuickTime like any other download.

The two screens stay in step over server-sent events rather than polling, so a
tap on the laptop — or a nudge of a fader — reaches the stage immediately.

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
