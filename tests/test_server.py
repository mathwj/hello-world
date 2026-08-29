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
        lambda term, limit: [
            search_module.SearchResult("id1", "Perfect Karaoke", "u", 200, "3:20", "Sing King", "t", 1)
        ],
    )
    body = client.get("/api/search?q=perfect").get_json()
    assert body["query"] == "perfect karaoke"
    assert body["results"][0]["video_id"] == "id1"


def test_search_endpoint_requires_a_term(client):
    assert client.get("/api/search?q=%20%20").status_code == 400


def test_search_endpoint_reports_upstream_failure(client, monkeypatch):
    def boom(term, limit):
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
