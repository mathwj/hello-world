"""What the waiting screen does between messages.

The stage keeps its own copy of the beat grid and runs the picture off it, so
its timing is not something the server or the operator can be asked about. The
fixture beside this file lifts that half of stage.js — the metre, the band
envelopes, the wandering shapes — and drives it the way the server would.
"""

import json
import subprocess
from pathlib import Path

import pytest

from karaoke import config

STAGE_JS = Path(__file__).resolve().parent.parent / "karaoke" / "static" / "stage.js"
FIXTURE = Path(__file__).resolve().parent / "fake_stage.js"


@pytest.fixture(scope="module")
def ran() -> dict:
    found = config.js_runtime()
    if not found or found[0] not in ("node", "deno", "bun"):
        pytest.skip("no JavaScript runtime to run the stage in")
    done = subprocess.run([found[1], str(FIXTURE), str(STAGE_JS)],
                          capture_output=True, text=True)
    assert done.returncode == 0, done.stderr
    return json.loads(done.stdout)


def test_one_swell_per_beat_landing_on_the_beat(ran):
    beats = ran["beats"]
    assert abs(beats["got"] - beats["expected"]) <= 2
    assert abs(beats["median"]) < 45, "the swells sit off the beat"
    assert beats["worst"] < 70


def test_the_downbeat_comes_round_once_a_bar(ran):
    """Four beats to the bar, and the first of them carries the weight."""
    assert ran["bar"]["accents"] > 10
    gaps = ran["bar"]["gaps"]
    assert len(gaps) == 1, f"the accent wandered inside the bar: {gaps}"


def test_the_snare_family_lands_on_the_backbeat(ran):
    """Two and four, which in sixteenths is places 4 and 12."""
    assert sorted(int(place) for place in ran["backbeat"]) == [4, 12]


def test_the_hats_lean_on_the_offbeat_and_the_air_on_the_sixteenths(ran):
    eighths = [ran["offbeat"][str(p)] for p in (2, 6, 10, 14)]
    sixteenths = [ran["offbeat"][str(p)] for p in (1, 3, 5, 7)]
    assert min(eighths) > max(sixteenths), "the hats are not phrasing the eighths"

    air_sixteenths = [ran["sixteenths"][str(p)] for p in (1, 3, 5, 7)]
    air_eighths = [ran["sixteenths"][str(p)] for p in (2, 6, 10, 14)]
    assert min(air_sixteenths) > max(air_eighths)


def test_the_wandering_shapes_live_whole_lives(ran):
    """Each grows from nothing to most of the screen and starts again elsewhere."""
    for wanderer in ran["wanderers"]:
        assert wanderer["finite"], "a shape's size stopped being a number"
        assert wanderer["biggest"] > 0.8, "never grew to anything"
        assert wanderer["lives"] > 3, "never started again"


def test_everything_settles_when_the_music_stops(ran):
    assert ran["afterTheMusicStops"]["locked"] is False
    assert max(ran["afterTheMusicStops"]["levels"].values()) == 0
