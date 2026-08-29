import json

import pytest

from karaoke import search as search_module
from karaoke.downloads import DONE, DownloadManager, Job
from karaoke.server import create_app


class StubManager(DownloadManager):
    """A manager that records enqueued jobs instead of hitting the network."""

    def __init__(self, target_dir):
        super().__init__(target_dir, workers=1)
        self.enqueued = []

    def enqueue(self, url, title="", thumbnail=""):
        job = Job(id=f"job{len(self.enqueued)}", url=url, title=title or url, thumbnail=thumbnail)
        self.enqueued.append(job)
        self._jobs[job.id] = job
        return job


@pytest.fixture
def library_dir(tmp_path):
    media = tmp_path / "Perfect [abc123].mp4"
    media.write_bytes(b"0123456789")
    (tmp_path / "Perfect [abc123].info.json").write_text(
        json.dumps({"id": "abc123", "title": "Perfect (Karaoke)", "duration": 263}), encoding="utf-8"
    )
    return tmp_path


@pytest.fixture
def manager(library_dir):
    return StubManager(library_dir)


@pytest.fixture
def client(library_dir, manager):
    app = create_app(library_dir, manager)
    app.config.update(TESTING=True)
    return app.test_client()


def test_index_renders(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"KaraokeBox" in response.data


def test_status_reports_library(client, library_dir):
    body = client.get("/api/status").get_json()
    assert body["download_dir"] == str(library_dir)
    assert body["song_count"] == 1


def test_search_endpoint_returns_karaoke_query(client, monkeypatch):
    monkeypatch.setattr(
        "karaoke.server.search",
        lambda term, limit, karaoke=True: [
            search_module.SearchResult("id1", "Perfect Karaoke", "u", 200, "3:20", "Sing King", "t", 1)
        ],
    )
    body = client.get("/api/search?q=perfect").get_json()
    assert body["query"] == "perfect karaoke"
    assert body["results"][0]["video_id"] == "id1"


def test_search_endpoint_requires_a_term(client):
    assert client.get("/api/search?q=%20%20").status_code == 400


def test_search_endpoint_reports_upstream_failure(client, monkeypatch):
    def boom(term, limit, karaoke=True):
        raise RuntimeError("YouTube said no")

    monkeypatch.setattr("karaoke.server.search", boom)
    response = client.get("/api/search?q=perfect")
    assert response.status_code == 502
    assert "YouTube said no" in response.get_json()["error"]


def test_start_download_from_video_id(client, manager):
    response = client.post("/api/downloads", json={"video_id": "abc123", "title": "Perfect Karaoke"})
    assert response.status_code == 202
    assert manager.enqueued[0].url == "https://www.youtube.com/watch?v=abc123"
    assert manager.enqueued[0].title == "Perfect Karaoke"


def test_start_download_requires_a_target(client):
    assert client.post("/api/downloads", json={}).status_code == 400


def test_list_and_clear_downloads(client, manager):
    client.post("/api/downloads", json={"video_id": "abc123"})
    assert len(client.get("/api/downloads").get_json()["jobs"]) == 1

    manager.enqueued[0].status = DONE
    assert client.delete("/api/downloads").get_json()["cleared"] == 1
    assert client.get("/api/downloads").get_json()["jobs"] == []


def test_library_endpoint(client):
    body = client.get("/api/library").get_json()
    assert [song["title"] for song in body["songs"]] == ["Perfect (Karaoke)"]


def test_delete_song_endpoint(client, library_dir):
    assert client.delete("/api/library/Perfect [abc123].mp4").status_code == 200
    assert not (library_dir / "Perfect [abc123].mp4").exists()
    assert client.delete("/api/library/Perfect [abc123].mp4").status_code == 404


def test_media_streams_the_file(client):
    response = client.get("/media/Perfect [abc123].mp4")
    assert response.status_code == 200
    assert response.data == b"0123456789"


def test_media_supports_range_requests_for_seeking(client):
    response = client.get("/media/Perfect [abc123].mp4", headers={"Range": "bytes=2-5"})
    assert response.status_code == 206
    assert response.data == b"2345"


def test_media_rejects_path_traversal(client, library_dir):
    (library_dir.parent / "secret.txt").write_text("private", encoding="utf-8")
    assert client.get("/media/../secret.txt").status_code == 404


def test_port_is_free_detects_a_listening_socket():
    import socket

    from karaoke.__main__ import port_is_free

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as taken:
        taken.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        taken.bind(("127.0.0.1", 0))
        taken.listen(1)
        port = taken.getsockname()[1]
        assert port_is_free("127.0.0.1", port) is False

    assert port_is_free("127.0.0.1", port) is True


def test_music_search_is_not_restricted_to_karaoke(client, monkeypatch):
    seen = {}

    def fake(term, limit, karaoke=True):
        seen["karaoke"] = karaoke
        return []

    monkeypatch.setattr("karaoke.server.search", fake)

    client.get("/api/search?q=perfect")
    assert seen["karaoke"] is True, "the karaoke page must stay restricted"

    body = client.get("/api/search?mode=music&q=perfect").get_json()
    assert seen["karaoke"] is False
    assert body["query"] == "perfect", "music results should not have karaoke appended"


def test_stage_starts_idle(client):
    body = client.get("/api/stage").get_json()
    assert body["mode"] == "idle"
    assert body["playing"] is False
    assert body["viewers"] == 0
    assert body["volume"] == {"karaoke": 85, "music": 60}


def test_stage_page_renders(client):
    response = client.get("/stage")
    assert response.status_code == 200
    assert b"Waiting for the next singer" in response.data


def test_playing_a_song_puts_it_on_the_stage(client):
    body = client.post("/api/stage/karaoke",
                       json={"name": "Perfect [abc123].mp4", "title": "Perfect"}).get_json()
    assert body["mode"] == "karaoke"
    assert body["karaoke"] == {"name": "Perfect [abc123].mp4", "title": "Perfect"}
    assert body["playing"] is True
    assert body["nonce"] == 1

    # Playing it again bumps the nonce, which is how the stage knows to restart
    # rather than carry on from where it was.
    again = client.post("/api/stage/karaoke",
                        json={"name": "Perfect [abc123].mp4", "title": "Perfect"}).get_json()
    assert again["nonce"] == 2


def test_stage_refuses_a_song_outside_the_library(client):
    response = client.post("/api/stage/karaoke", json={"name": "../secret.mp4"})
    assert response.status_code == 404


def test_music_replaces_karaoke_on_the_stage(client):
    client.post("/api/stage/karaoke", json={"name": "Perfect [abc123].mp4", "title": "Perfect"})
    body = client.post("/api/stage/music", json={"video_id": "xyz", "title": "A Record"}).get_json()
    assert body["mode"] == "music"
    assert body["music"] == {"video_id": "xyz", "title": "A Record"}


def test_music_needs_a_video(client):
    assert client.post("/api/stage/music", json={}).status_code == 400


def test_the_mixer_updates_one_channel_without_clearing_the_other(client):
    body = client.post("/api/stage", json={"volume": {"music": 20}}).get_json()
    assert body["volume"] == {"karaoke": 85, "music": 20}


def test_pausing_and_stopping(client):
    client.post("/api/stage/karaoke", json={"name": "Perfect [abc123].mp4", "title": "Perfect"})
    assert client.post("/api/stage", json={"playing": False}).get_json()["playing"] is False

    stopped = client.post("/api/stage/stop").get_json()
    assert stopped["mode"] == "idle"
    assert stopped["playing"] is False


def test_stage_rejects_unknown_fields(client):
    assert client.post("/api/stage", json={"nonce": 99}).status_code == 400


def test_score_reported_by_the_stage_reaches_the_operator(client):
    client.post("/api/stage", json={"score": {"value": 88, "rank": "Superstar!"}})
    assert client.get("/api/stage").get_json()["score"] == {"value": 88, "rank": "Superstar!"}

    # Starting the next song clears the previous singer's score.
    body = client.post("/api/stage/karaoke",
                       json={"name": "Perfect [abc123].mp4", "title": "Perfect"}).get_json()
    assert body["score"] is None


def test_resolve_accepts_a_pasted_link(client, monkeypatch):
    monkeypatch.setattr(
        "karaoke.server.video_details",
        lambda vid: search_module.SearchResult(vid, "A Record", "u", 212, "3:32", "Someone", "t", 9),
    )
    body = client.get("/api/music/resolve?url=https://youtu.be/dQw4w9WgXcQ").get_json()
    assert body["video_id"] == "dQw4w9WgXcQ"
    assert body["title"] == "A Record"


def test_resolve_rejects_something_that_is_not_a_youtube_link(client):
    response = client.get("/api/music/resolve?url=https://vimeo.com/12345")
    assert response.status_code == 400


def test_resolve_still_plays_when_the_lookup_fails(client, monkeypatch):
    """A valid id is playable even if the metadata request falls over."""

    def boom(video_id):
        raise RuntimeError("ERROR: lookup exploded")

    monkeypatch.setattr("karaoke.server.video_details", boom)
    body = client.get("/api/music/resolve?url=dQw4w9WgXcQ").get_json()
    assert body["video_id"] == "dQw4w9WgXcQ"
    assert "lookup exploded" in body["lookup_error"]
    assert body["thumbnail"].endswith("/dQw4w9WgXcQ/mqdefault.jpg")
