import os

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


def test_ensure_ca_bundle_is_a_no_op_when_the_system_store_works(monkeypatch):
    from karaoke import tls

    monkeypatch.setattr(tls, "system_ca_count", lambda: 150)
    monkeypatch.delenv("SSL_CERT_FILE", raising=False)
    assert tls.ensure_ca_bundle() is None
    assert "SSL_CERT_FILE" not in os.environ


def test_ensure_ca_bundle_falls_back_to_certifi_on_an_empty_store(monkeypatch):
    from karaoke import tls

    monkeypatch.setattr(tls, "system_ca_count", lambda: 0)
    monkeypatch.delenv("SSL_CERT_FILE", raising=False)
    monkeypatch.delenv("REQUESTS_CA_BUNDLE", raising=False)

    bundle = tls.ensure_ca_bundle()
    assert bundle and bundle.endswith(".pem")
    assert os.environ["SSL_CERT_FILE"] == bundle
    assert os.environ["REQUESTS_CA_BUNDLE"] == bundle


def test_ffmpeg_options_carry_the_resolved_binary(tmp_path, monkeypatch):
    manager = DownloadManager(tmp_path, workers=1)
    monkeypatch.setattr(downloads.config, "ffmpeg_path", lambda: "/somewhere/ffmpeg")
    assert manager._ydl_options("job")["ffmpeg_location"] == "/somewhere/ffmpeg"


def test_ffmpeg_path_prefers_an_explicit_override(tmp_path, monkeypatch):
    from karaoke import config

    fake = tmp_path / "ffmpeg"
    fake.write_text("#!/bin/sh\n")
    monkeypatch.setenv("KARAOKE_FFMPEG", str(fake))
    assert config.ffmpeg_path() == str(fake)


def test_ffmpeg_path_prefers_a_system_install_over_the_bundled_one(monkeypatch):
    from karaoke import config

    monkeypatch.delenv("KARAOKE_FFMPEG", raising=False)
    monkeypatch.setattr(config.shutil, "which", lambda name: "/opt/homebrew/bin/ffmpeg")
    assert config.ffmpeg_path() == "/opt/homebrew/bin/ffmpeg"


def test_ffmpeg_path_falls_back_to_the_bundled_binary(monkeypatch):
    from karaoke import config

    monkeypatch.delenv("KARAOKE_FFMPEG", raising=False)
    monkeypatch.setattr(config.shutil, "which", lambda name: None)
    # The imageio-ffmpeg wheel ships a real binary, so this resolves to a path.
    assert config.ffmpeg_path() == config._bundled_ffmpeg()
    assert config.ffmpeg_path() is not None


def test_js_runtime_prefers_a_deliberately_installed_runtime(monkeypatch):
    from karaoke import config

    monkeypatch.delenv("KARAOKE_JS_RUNTIME", raising=False)
    monkeypatch.setattr(config.shutil, "which", lambda name: "/usr/local/bin/deno" if name == "deno" else None)
    assert config.js_runtime() == ("deno", "/usr/local/bin/deno")


def test_js_runtime_falls_back_to_the_bundled_node(monkeypatch):
    from karaoke import config

    monkeypatch.delenv("KARAOKE_JS_RUNTIME", raising=False)
    monkeypatch.setattr(config.shutil, "which", lambda name: None)
    name, path = config.js_runtime()
    assert name == "node"
    assert path == config._bundled_node() and path is not None


def test_js_runtime_prefers_bundled_node_over_an_unknown_path_node(monkeypatch):
    from karaoke import config

    # yt-dlp needs Node 22+; a node on PATH may be anything, ours is known good.
    monkeypatch.delenv("KARAOKE_JS_RUNTIME", raising=False)
    monkeypatch.setattr(config.shutil, "which", lambda name: "/usr/bin/node" if name == "node" else None)
    assert config.js_runtime()[1] == config._bundled_node()


def test_js_runtime_honours_an_explicit_override(tmp_path, monkeypatch):
    from karaoke import config

    fake = tmp_path / "deno"
    fake.write_text("#!/bin/sh\n")
    monkeypatch.setenv("KARAOKE_JS_RUNTIME", str(fake))
    assert config.js_runtime() == ("deno", str(fake))


def test_js_runtime_ignores_an_override_that_is_not_a_known_runtime(tmp_path, monkeypatch):
    from karaoke import config

    fake = tmp_path / "python"
    fake.write_text("#!/bin/sh\n")
    monkeypatch.setenv("KARAOKE_JS_RUNTIME", str(fake))
    monkeypatch.setattr(config.shutil, "which", lambda name: None)
    assert config.js_runtime()[0] == "node"


def test_downloads_and_search_both_get_the_js_runtime(tmp_path, monkeypatch):
    from karaoke import config, search as search_module

    manager = DownloadManager(tmp_path, workers=1)
    assert "js_runtimes" in manager._ydl_options("job")
    assert "js_runtimes" in search_module._search_options()

    monkeypatch.setattr(config, "js_runtime", lambda: None)
    assert "js_runtimes" not in manager._ydl_options("job")


def test_explain_error_points_at_the_js_runtime_when_no_format_matched():
    message = downloads.explain_error(RuntimeError("ERROR: Requested format is not available"))
    assert "JavaScript" in message
