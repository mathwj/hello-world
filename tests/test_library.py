import json

import pytest

from karaoke import library


@pytest.fixture
def songs_dir(tmp_path):
    (tmp_path / "Perfect [abc123].mp4").write_bytes(b"video-bytes")
    (tmp_path / "Perfect [abc123].info.json").write_text(
        json.dumps({"id": "abc123", "title": "Perfect (Karaoke)", "channel": "Sing King", "duration": 263}),
        encoding="utf-8",
    )
    (tmp_path / "Perfect [abc123].jpg").write_bytes(b"thumb")
    (tmp_path / "No Metadata [zzz].mkv").write_bytes(b"x")
    (tmp_path / "notes.txt").write_text("ignore me", encoding="utf-8")
    return tmp_path


def test_list_songs_reads_sidecar_metadata(songs_dir):
    songs = {song["name"]: song for song in library.list_songs(songs_dir)}

    assert set(songs) == {"Perfect [abc123].mp4", "No Metadata [zzz].mkv"}
    perfect = songs["Perfect [abc123].mp4"]
    assert perfect["title"] == "Perfect (Karaoke)"
    assert perfect["channel"] == "Sing King"
    assert perfect["duration_label"] == "4:23"
    assert perfect["thumbnail"] == "Perfect [abc123].jpg"
    assert perfect["size_bytes"] == len(b"video-bytes")


def test_list_songs_falls_back_to_filename(songs_dir):
    song = next(s for s in library.list_songs(songs_dir) if s["name"].startswith("No Metadata"))
    assert song["title"] == "No Metadata [zzz]"
    assert song["duration_label"] == "--:--"
    assert song["thumbnail"] == ""


def test_list_songs_sorts_newest_first(songs_dir):
    import os
    import time

    older = songs_dir / "Perfect [abc123].mp4"
    os.utime(older, (time.time() - 600, time.time() - 600))
    assert library.list_songs(songs_dir)[0]["name"] == "No Metadata [zzz].mkv"


def test_list_songs_on_missing_directory(tmp_path):
    assert library.list_songs(tmp_path / "nope") == []


def test_list_songs_tolerates_broken_info_json(songs_dir):
    (songs_dir / "Perfect [abc123].info.json").write_text("{not json", encoding="utf-8")
    song = next(s for s in library.list_songs(songs_dir) if s["name"].startswith("Perfect"))
    assert song["title"] == "Perfect [abc123]"


def test_resolve_returns_path_inside_library(songs_dir):
    assert library.resolve("Perfect [abc123].mp4", songs_dir) == (songs_dir / "Perfect [abc123].mp4")


@pytest.mark.parametrize(
    "name",
    ["../secret.txt", "..", "", "sub/inner.mp4", "/etc/passwd", "nonexistent.mp4"],
)
def test_resolve_rejects_traversal_and_missing(songs_dir, name):
    (songs_dir.parent / "secret.txt").write_text("private", encoding="utf-8")
    assert library.resolve(name, songs_dir) is None


def test_resolve_rejects_symlink_escaping_the_library(songs_dir):
    outside = songs_dir.parent / "outside.mp4"
    outside.write_bytes(b"nope")
    (songs_dir / "link.mp4").symlink_to(outside)
    assert library.resolve("link.mp4", songs_dir) is None


def test_delete_removes_media_and_sidecars(songs_dir):
    assert library.delete("Perfect [abc123].mp4", songs_dir) is True
    assert not (songs_dir / "Perfect [abc123].mp4").exists()
    assert not (songs_dir / "Perfect [abc123].info.json").exists()
    assert not (songs_dir / "Perfect [abc123].jpg").exists()


def test_delete_refuses_non_media_files(songs_dir):
    assert library.delete("notes.txt", songs_dir) is False
    assert (songs_dir / "notes.txt").exists()


def test_delete_missing_song(songs_dir):
    assert library.delete("gone.mp4", songs_dir) is False
