import threading
import time

from karaoke.stage import IDLE, KARAOKE, Stage


def test_version_advances_on_every_change():
    stage = Stage()
    first = stage.snapshot()["version"]
    second = stage.update({"playing": True})["version"]
    assert second > first


def test_volume_merges_rather_than_replaces():
    stage = Stage()
    stage.update({"volume": {"karaoke": 30}})
    assert stage.snapshot()["volume"] == {"karaoke": 30, "music": 60}


def test_playing_a_song_sets_the_whole_mode():
    stage = Stage()
    state = stage.play_karaoke("Song.mp4", "Song")
    assert state["mode"] == KARAOKE
    assert state["playing"] is True
    assert state["nonce"] == 1


def test_the_stage_has_no_music_mode():
    """Between-songs music plays on the operator's page, not the stage."""
    stage = Stage()
    assert "music" not in stage.snapshot()
    assert not hasattr(stage, "play_music")
    # The music fader is still remembered, so a reloaded page gets it back.
    assert stage.snapshot()["volume"]["music"] == 60


def test_stop_returns_to_the_waiting_screen():
    stage = Stage()
    stage.play_karaoke("Song.mp4", "Song")
    stage.update({"score": {"value": 50}})
    state = stage.stop()
    assert state["mode"] == IDLE
    assert state["playing"] is False
    assert state["score"] is None


def test_wait_returns_immediately_when_already_behind():
    stage = Stage()
    version = stage.snapshot()["version"]
    stage.update({"playing": True})
    assert stage.wait(version, timeout=0.1) is not None


def test_wait_times_out_when_nothing_happens():
    stage = Stage()
    version = stage.snapshot()["version"]
    started = time.monotonic()
    assert stage.wait(version, timeout=0.2) is None
    assert time.monotonic() - started >= 0.15


def test_wait_wakes_as_soon_as_the_state_changes():
    """This is what makes a tap on the laptop land on the stage at once."""
    stage = Stage()
    version = stage.snapshot()["version"]
    woke = []

    def watcher():
        woke.append(stage.wait(version, timeout=3))

    thread = threading.Thread(target=watcher)
    thread.start()
    time.sleep(0.05)
    stage.play_karaoke("Song.mp4", "Song")
    thread.join(timeout=3)

    assert woke and woke[0] is not None
    assert woke[0]["mode"] == KARAOKE


def test_viewers_are_counted_while_connected():
    stage = Stage()
    assert stage.snapshot()["viewers"] == 0
    with stage.viewer():
        assert stage.snapshot()["viewers"] == 1
        with stage.viewer():
            assert stage.snapshot()["viewers"] == 2
        assert stage.snapshot()["viewers"] == 1
    assert stage.snapshot()["viewers"] == 0


def test_a_screen_connecting_wakes_the_operator():
    """So the "stage ready" light turns on without waiting for a poll."""
    stage = Stage()
    version = stage.snapshot()["version"]
    woke = []

    def watcher():
        woke.append(stage.wait(version, timeout=3))

    thread = threading.Thread(target=watcher)
    thread.start()
    time.sleep(0.05)
    with stage.viewer():
        thread.join(timeout=3)

    assert woke and woke[0] is not None
    assert woke[0]["viewers"] == 1
