"""Shared state for the stage screen.

KaraokeBox runs on two screens: the operator drives an interface on their
laptop, and the audience watches a second screen. The stage shows the karaoke
and nothing else — the between-songs music plays on the operator's own page,
where they can browse for it. Both windows are on the same Mac and therefore
the same speakers, which is what the mixer is balancing.

This module is the single piece of state the two screens agree on, and the
operator's page is effectively a remote control for it.

State changes are pushed to subscribers rather than polled so that tapping play,
or nudging a volume slider, lands immediately.
"""

from __future__ import annotations

import copy
import threading
import time
from contextlib import contextmanager

#: Nothing playing: the stage shows its waiting screen.
IDLE = "idle"
KARAOKE = "karaoke"

DEFAULT_STATE = {
    "mode": IDLE,
    # The karaoke video currently on the stage, as {name, title}.
    "karaoke": None,
    "playing": False,
    # Bumped whenever playback should restart from the top rather than resume,
    # which is how the stage tells "play this again" from "carry on".
    "nonce": 0,
    # The music fader is kept here too, so a reloaded page gets it back, even
    # though only the karaoke channel is anything the stage acts on.
    "volume": {"karaoke": 85, "music": 60},
    # Set by the stage itself once a song finishes and the score is revealed.
    "score": None,
    # A ride to a new karaoke level: {"to": 0, "ms": 1200, "id": n}. The stage
    # performs the ramp itself. Sending it every step instead would put a dozen
    # network round trips inside something the room can hear.
    "fade": None,
    # Ends the song early and reveals the score: {"id": n}.
    "reveal": None,
}


def _merge(target: dict, changes: dict) -> None:
    """Merge ``changes`` into ``target``, one level deep for nested dicts."""
    for key, value in changes.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            target[key].update(value)
        else:
            target[key] = value


# The bands the music is split into, cut where instruments sit rather than into
# equal slices. The operator measures them; this only has to carry them.
BANDS = ("sub", "bass", "body", "mid", "presence", "high", "air")


class Stage:
    """The state of the audience screen, and everyone watching it."""

    def __init__(self):
        self._state = copy.deepcopy(DEFAULT_STATE)
        self._version = 1
        self._condition = threading.Condition()
        self._viewers = 0
        self._progress = {"position": 0.0, "duration": 0.0}
        # Bass kicks travel on their own channel: they land several times a
        # second, and pushing them through the main state would wake every
        # subscriber for something only the waiting screen cares about.
        self._pulse = {}
        self._pulse_at = 0.0
        self._pulse_seq = 0
        self._pulse_condition = threading.Condition()

    # -- reading ------------------------------------------------------------

    def snapshot(self) -> dict:
        with self._condition:
            return self._payload()

    def _payload(self) -> dict:
        payload = copy.deepcopy(self._state)
        payload["version"] = self._version
        payload["viewers"] = self._viewers
        payload["progress"] = dict(self._progress)
        return payload

    # -- writing ------------------------------------------------------------

    def update(self, changes: dict) -> dict:
        """Apply a partial update and wake every subscriber."""
        with self._condition:
            _merge(self._state, changes)
            self._version += 1
            self._condition.notify_all()
            return self._payload()

    def set_progress(self, position: float, duration: float) -> None:
        """Record how far into the song the stage is.

        Deliberately does not bump the version: this arrives a couple of times a
        second, and waking every subscriber that often would drown the stream
        that carries actual decisions. The operator reads it by polling instead.
        """
        with self._condition:
            self._progress = {"position": float(position), "duration": float(duration)}

    # -- the beat -----------------------------------------------------------

    def set_pulse(self, grid: dict) -> int:
        """Record what the operator's music player is hearing.

        Several different things travel together here: the tempo grid and where
        the bar starts, which the waiting screen runs its beat off; the level
        and attack of each band, which the shapes answering to that part of the
        mix follow; and the harmony and brightness, which move the whole field.
        They arrive in one report because they are measured from the same
        frames, and one message is one wake-up for the subscribers.
        """

        def level(key: str) -> float:
            return max(0.0, min(100.0, float(grid.get(key) or 0)))

        cleaned = {
            "period": float(grid.get("period") or 0),
            "bpm": int(grid.get("bpm") or 0),
            "confidence": float(grid.get("confidence") or 0),
            "anchor_age": float(grid.get("anchor_age") or 0),
            "bar_beat": int(grid.get("bar_beat") or 0) % 4,
            "harmony": level("harmony"),
            "centroid": level("centroid"),
            "tonal": int(grid.get("tonal") or 0) % 12,
        }
        for band in BANDS:
            cleaned[band] = level(band)
            cleaned[band + "_on"] = level(band + "_on")

        with self._pulse_condition:
            self._pulse = cleaned
            self._pulse_at = time.monotonic()
            self._pulse_seq += 1
            self._pulse_condition.notify_all()
            return self._pulse_seq

    def pulse(self) -> dict:
        with self._pulse_condition:
            return self._pulse_payload()

    def _pulse_payload(self) -> dict:
        payload = dict(self._pulse)
        if payload.get("period"):
            # The anchor keeps ageing while it sits here, so bring it up to date
            # on the way out; a stage connecting late must not place the beat
            # where it was when the grid was first reported.
            payload["anchor_age"] = payload.get("anchor_age", 0) + (
                time.monotonic() - self._pulse_at) * 1000
        payload["seq"] = self._pulse_seq
        return payload

    def wait_pulse(self, since: int, timeout: float = 5.0) -> dict | None:
        """Block until the grid changes. ``None`` on timeout."""
        with self._pulse_condition:
            if self._pulse_seq != since:
                return self._pulse_payload()
            self._pulse_condition.wait(timeout)
            if self._pulse_seq == since:
                return None
            return self._pulse_payload()

    def reveal_score(self) -> dict:
        """End the song where it is and put the score up."""
        with self._condition:
            self._state["playing"] = False
            self._state["reveal"] = {"id": self._version + 1}
            self._version += 1
            self._condition.notify_all()
            return self._payload()

    def play_karaoke(self, name: str, title: str) -> dict:
        """Start a karaoke video from the top."""
        with self._condition:
            self._state["mode"] = KARAOKE
            self._state["karaoke"] = {"name": name, "title": title}
            self._state["playing"] = True
            self._state["score"] = None
            self._state["reveal"] = None
            self._state["nonce"] += 1
            self._progress = {"position": 0.0, "duration": 0.0}
            self._version += 1
            self._condition.notify_all()
            return self._payload()

    def stop(self) -> dict:
        """Return the stage to its waiting screen."""
        return self.update({"mode": IDLE, "playing": False, "score": None})

    # -- subscribing --------------------------------------------------------

    def wait(self, since: int, timeout: float = 15.0) -> dict | None:
        """Block until the state moves past ``since``. ``None`` on timeout."""
        with self._condition:
            if self._version != since:
                return self._payload()
            self._condition.wait(timeout)
            return self._payload() if self._version != since else None

    @contextmanager
    def viewer(self):
        """Count a connected stage screen for as long as it is subscribed.

        The operator's page shows this, so "I pressed play and nothing happened"
        becomes "no stage screen is connected" instead of a mystery.
        """
        with self._condition:
            self._viewers += 1
            self._version += 1
            self._condition.notify_all()
        try:
            yield
        finally:
            with self._condition:
                self._viewers = max(0, self._viewers - 1)
                self._version += 1
                self._condition.notify_all()
