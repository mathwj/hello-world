import time

from karaoke import downloads
from karaoke.downloads import DONE, FAILED, DownloadManager, _final_filename


class FakeYDL:
    """Drives the manager's progress hooks without touching YouTube."""

    payloads = []
    error = None

    def __init__(self, options):
        self.options = options

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def extract_info(self, url, download=True):
        if self.error:
            raise self.error
        for payload in self.payloads:
            for hook in self.options["progress_hooks"]:
                hook(payload)
        return {
            "title": "Perfect (Karaoke)",
            "requested_downloads": [{"filepath": "/songs/Perfect [abc123].mp4"}],
        }


def wait_for(manager, job_id, status, timeout=5.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        job = manager.get(job_id)
        if job and job["status"] == status:
            return job
        time.sleep(0.02)
    raise AssertionError(f"job never reached {status}: {manager.get(job_id)}")


def test_successful_download_records_progress_and_filename(tmp_path, monkeypatch):
    FakeYDL.error = None
    FakeYDL.payloads = [
        {"status": "downloading", "downloaded_bytes": 50, "total_bytes": 200, "speed": 1000, "eta": 3},
        {"status": "finished"},
    ]
    monkeypatch.setattr(downloads, "YoutubeDL", FakeYDL)

    manager = DownloadManager(tmp_path, workers=1)
    job = manager.enqueue("https://youtu.be/abc123", title="Perfect")
    finished = wait_for(manager, job.id, DONE)

    assert finished["progress"] == 100.0
    assert finished["filename"] == "Perfect [abc123].mp4"
    assert finished["title"] == "Perfect (Karaoke)"
    assert finished["error"] == ""


def test_failed_download_records_the_error(tmp_path, monkeypatch):
    FakeYDL.payloads = []
    FakeYDL.error = RuntimeError("video unavailable")
    monkeypatch.setattr(downloads, "YoutubeDL", FakeYDL)

    manager = DownloadManager(tmp_path, workers=1)
    job = manager.enqueue("https://youtu.be/gone")
    assert "video unavailable" in wait_for(manager, job.id, FAILED)["error"]
    FakeYDL.error = None


def test_jobs_are_listed_newest_first(tmp_path):
    manager = DownloadManager(tmp_path, workers=1)
    manager._jobs["a"] = downloads.Job(id="a", url="u", title="first", created_at=1.0)
    manager._jobs["b"] = downloads.Job(id="b", url="u", title="second", created_at=2.0)
    assert [job["title"] for job in manager.jobs()] == ["second", "first"]


def test_clear_finished_keeps_active_jobs(tmp_path):
    manager = DownloadManager(tmp_path, workers=1)
    manager._jobs["a"] = downloads.Job(id="a", url="u", title="done", status=DONE)
    manager._jobs["b"] = downloads.Job(id="b", url="u", title="busy", status=downloads.DOWNLOADING)
    assert manager.clear_finished() == 1
    assert [job["title"] for job in manager.jobs()] == ["busy"]


def test_progress_percentage_is_derived_from_bytes(tmp_path, monkeypatch):
    FakeYDL.error = None
    FakeYDL.payloads = [{"status": "downloading", "downloaded_bytes": 25, "total_bytes": 200}]
    monkeypatch.setattr(downloads, "YoutubeDL", FakeYDL)

    manager = DownloadManager(tmp_path, workers=1)
    seen = []
    original = manager._update

    def spy(job_id, **fields):
        if "progress" in fields:
            seen.append(fields["progress"])
        original(job_id, **fields)

    manager._update = spy
    job = manager.enqueue("https://youtu.be/abc")
    wait_for(manager, job.id, DONE)
    assert 12.5 in seen


def test_final_filename_variants():
    assert _final_filename(None) == ""
    assert _final_filename({}) == ""
    assert _final_filename({"requested_downloads": [{"filepath": "/a/b/song.mp4"}]}) == "song.mp4"
    assert _final_filename({"_filename": "/a/b/other.mkv"}) == "other.mkv"


def test_format_selection_matches_ffmpeg_availability(tmp_path, monkeypatch):
    manager = DownloadManager(tmp_path, workers=1)

    monkeypatch.setattr(downloads.config, "ffmpeg_path", lambda: "/opt/homebrew/bin/ffmpeg")
    with_ffmpeg = manager._ydl_options("job")
    assert with_ffmpeg["merge_output_format"] == "mp4"
    assert with_ffmpeg["format"] == downloads.FORMAT_WITH_FFMPEG

    monkeypatch.setattr(downloads.config, "ffmpeg_path", lambda: None)
    without = manager._ydl_options("job")
    assert "merge_output_format" not in without
    assert without["format"] == downloads.FORMAT_NO_FFMPEG


def test_explain_error_translates_the_bot_check():
    message = downloads.explain_error(RuntimeError("ERROR: Sign in to confirm you're not a bot"))
    assert "KARAOKE_COOKIES_FROM_BROWSER" in message


def test_explain_error_translates_unavailable_video():
    assert "unavailable" in downloads.explain_error(RuntimeError("ERROR: Video unavailable"))


def test_explain_error_strips_ytdlp_prefix():
    assert downloads.explain_error(RuntimeError("ERROR: something broke")) == "something broke"


def test_cookies_are_passed_to_ytdlp_when_configured(tmp_path, monkeypatch):
    manager = DownloadManager(tmp_path, workers=1)

    monkeypatch.delenv("KARAOKE_COOKIES_FROM_BROWSER", raising=False)
    assert "cookiesfrombrowser" not in manager._ydl_options("job")

    monkeypatch.setenv("KARAOKE_COOKIES_FROM_BROWSER", "Safari")
    assert manager._ydl_options("job")["cookiesfrombrowser"] == ("safari",)
