"""Shared state for the stage screen.

KaraokeBox runs on two screens: the operator drives an interface on their
laptop, and the audience watches a second screen. Both players — the karaoke
video and the between-songs music — live on that second screen, because that is
where the speakers are and what the mixer is mixing. This module is the single
piece of state they agree on, and the operator's page is effectively a remote
control for it.

State changes are pushed to subscribers rather than polled so that tapping play,
or nudging a volume slider, lands immediately.
"""

from __future__ import annotations

import copy
import threading
from contextlib import contextmanager

#: Nothing playing: the stage shows its waiting screen.
IDLE = "idle"
KARAOKE = "karaoke"
MUSIC = "music"

DEFAULT_STATE = {
    "mode": IDLE,
    # The karaoke video currently on the stage, as {name, title}.
    "karaoke": None,
    # The YouTube video currently on the stage, as {video_id, title}.
    "music": None,
    "playing": False,
    # Bumped whenever playback should restart from the top rather than resume,
    # which is how the stage tells "play this again" from "carry on".
    "nonce": 0,
    "volume": {"karaoke": 85, "music": 60},
    # Set by the stage itself once a song finishes and the score is revealed.
    "score": None,
}


def _merge(target: dict, changes: dict) -> None:
    """Merge ``changes`` into ``target``, one level deep for nested dicts."""
    for key, value in changes.items():
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            target[key].update(value)
        else:
            target[key] = value


class Stage:
    """The state of the audience screen, and everyone watching it."""

    def __init__(self):
        self._state = copy.deepcopy(DEFAULT_STATE)
        self._version = 1
        self._condition = threading.Condition()
        self._viewers = 0

    # -- reading ------------------------------------------------------------

    def snapshot(self) -> dict:
        with self._condition:
            return self._payload()

    def _payload(self) -> dict:
        payload = copy.deepcopy(self._state)
        payload["version"] = self._version
        payload["viewers"] = self._viewers
        return payload

    # -- writing ------------------------------------------------------------

    def update(self, changes: dict) -> dict:
        """Apply a partial update and wake every subscriber."""
        with self._condition:
            _merge(self._state, changes)
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
            self._state["nonce"] += 1
            self._version += 1
            self._condition.notify_all()
            return self._payload()

    def play_music(self, video_id: str, title: str) -> dict:
        """Start a YouTube video from the top."""
        with self._condition:
            self._state["mode"] = MUSIC
            self._state["music"] = {"video_id": video_id, "title": title}
            self._state["playing"] = True
            self._state["score"] = None
            self._state["nonce"] += 1
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
