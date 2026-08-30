"""The script the operator injects into the music page.

It lives inside a JavaScript template literal, so nothing that parses app.js
ever looks at it: a stray backtick ends the literal early and a const used
before its declaration throws only when it runs, inside another page, where the
only symptom is a waiting screen that quietly stops moving. Both of those have
happened. This parses the finished text instead.
"""

import json
import subprocess
from pathlib import Path

import pytest

from karaoke import config

APP_JS = Path(__file__).resolve().parent.parent / "karaoke" / "static" / "app.js"


def _runtime() -> str:
    found = config.js_runtime()
    if not found or found[0] not in ("node", "deno", "bun"):
        pytest.skip("no JavaScript runtime to parse with")
    return found[1]


def _literal(source: str, name: str) -> str:
    """The text of a template literal, without evaluating anything in it."""
    start = source.index(f"const {name} = `")
    open_at = source.index("`", start)
    end = open_at + 1
    while end < len(source):
        if source[end] == "\\":
            end += 2
            continue
        if source[end] == "`":
            break
        end += 1
    return source[open_at + 1 : end]


def test_the_injected_script_parses():
    runtime = _runtime()
    source = APP_JS.read_text()
    body = _literal(source, "BEAT_SCRIPT").replace(
        "${ENSURE_CHAIN}", _literal(source, "ENSURE_CHAIN"))
    # The interpolations are constants; their values do not matter to a parse.
    for placeholder, stand_in in (
        ("${JSON.stringify(BANDS)}", "[]"),
        ("${OPEN.frequency}", "22000"),
    ):
        body = body.replace(placeholder, stand_in)
    assert "${" not in body, "an interpolation this test does not know about"

    check = subprocess.run(
        [runtime, "-e", f"new (require('vm').Script)({json.dumps(body)})"],
        capture_output=True, text=True)
    assert check.returncode == 0, check.stderr


def _report() -> dict:
    """Plays synthetic music to the real injected script and returns what it heard."""
    runtime = _runtime()
    fixture = Path(__file__).resolve().parent / "fake_music.js"
    heard = subprocess.run([runtime, str(fixture), str(APP_JS)],
                           capture_output=True, text=True)
    assert heard.returncode == 0, heard.stderr
    return json.loads(heard.stdout)


@pytest.fixture(scope="module")
def heard() -> dict:
    return _report()


def test_the_bands_tell_the_drums_apart(heard):
    """A kick, a snare and a hi-hat have to land on different families."""
    kick, snare, hat = heard["kick"], heard["snare"], heard["hat"]
    assert kick["bass"] > 80 and kick["air"] < 20
    assert snare["presence"] > 80 and snare["bass"] < 30
    assert hat["air"] > 80 and hat["bass"] < 30


def test_brightness_follows_the_sound(heard):
    """A cymbal is bright and a chord is not, whatever either weighs."""
    assert heard["hatCentroid"] > heard["chord"]["centroid"] + 20


def test_the_harmony_is_the_notes_being_played(heard):
    """Pitch class 0 is A, so C major is C, E and G — 3, 7 and 10."""
    assert heard["chord"]["tonal"] in (3, 7, 10)


def test_a_chord_change_reads_as_one_and_a_melody_does_not(heard):
    assert heard["melodyOverIt"]["harmony"] < 25
    assert heard["chordChange"]["harmony"] > 50
    assert heard["settledLonger"]["harmony"] < 25      # and it passes


def test_it_says_so_when_it_has_stopped_listening(heard):
    """A sampler that is not running must not look like music with nothing in it."""
    assert heard["undrawn"]["state"] == "stalled"
    assert heard["undrawn"]["frames"] == 0


def test_the_audio_graph_keeps_it_alive_with_the_page_undrawn(heard):
    """The operator spends the night on other tabs; a hidden page gets no frames."""
    assert heard["fromAudioClock"]["state"] == "ok"
    assert heard["fromAudioClock"]["frames"] > 30
