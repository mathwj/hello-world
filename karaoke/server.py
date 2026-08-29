"""Flask app serving the karaoke UI and its JSON API.

It binds to localhost only — this is a desktop app that happens to render in a
browser window, not a service meant to be reachable from the network.
"""

from __future__ import annotations

import json
import mimetypes
from pathlib import Path

from flask import Flask, Response, jsonify, render_template, request, send_from_directory

from . import __version__, config
from . import library
from .downloads import DownloadManager, explain_error
from .search import MAX_RESULTS, build_query, parse_video_id, search, video_details
from .stage import Stage

from contextlib import nullcontext as _nothing

mimetypes.add_type("video/mp4", ".m4v")
mimetypes.add_type("video/x-matroska", ".mkv")


def create_app(
    download_dir: Path | None = None,
    manager: DownloadManager | None = None,
    stage: Stage | None = None,
) -> Flask:
    app = Flask(__name__)
    target_dir = Path(download_dir) if download_dir else config.download_dir()
    app.config["DOWNLOAD_DIR"] = target_dir
    downloads = manager or DownloadManager(target_dir)
    app.config["DOWNLOADS"] = downloads
    show = stage or Stage()
    app.config["STAGE"] = show

    @app.get("/")
    def index():
        return render_template("index.html", version=__version__)

    @app.get("/stage")
    def stage_screen():
        """The audience screen. Open this on the second display."""
        return render_template("stage.html", version=__version__)

    @app.get("/api/stage")
    def stage_state():
        return jsonify(show.snapshot())

    @app.post("/api/stage")
    def stage_update():
        """Partial state update — volume changes, pause, resume."""
        payload = request.get_json(silent=True) or {}
        allowed = {"mode", "playing", "volume", "score", "music", "karaoke"}
        changes = {key: value for key, value in payload.items() if key in allowed}
        if not changes:
            return jsonify({"error": "Nothing to change."}), 400
        return jsonify(show.update(changes))

    @app.post("/api/stage/karaoke")
    def stage_play_karaoke():
        payload = request.get_json(silent=True) or {}
        name = (payload.get("name") or "").strip()
        if library.resolve(name, target_dir) is None:
            return jsonify({"error": "That song is not in the library."}), 404
        title = (payload.get("title") or name).strip()
        return jsonify(show.play_karaoke(name, title))

    @app.get("/api/music/resolve")
    def resolve_music():
        """Turn a pasted YouTube link (or bare id) into something playable."""
        raw = (request.args.get("url") or "").strip()
        video_id = parse_video_id(raw)
        if not video_id:
            return jsonify({"error": "That does not look like a YouTube link."}), 400
        try:
            result = video_details(video_id).as_dict()
        except Exception as exc:
            # The id is valid even if the lookup failed, so it can still play.
            result = {
                "video_id": video_id,
                "title": f"YouTube video {video_id}",
                "channel": "",
                "duration_label": "--:--",
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg",
                "lookup_error": explain_error(exc),
            }
        return jsonify(result)

    @app.post("/api/stage/music")
    def stage_play_music():
        payload = request.get_json(silent=True) or {}
        video_id = (payload.get("video_id") or "").strip()
        if not video_id:
            return jsonify({"error": "No video to play."}), 400
        return jsonify(show.play_music(video_id, (payload.get("title") or "").strip()))

    @app.post("/api/stage/stop")
    def stage_stop():
        return jsonify(show.stop())

    @app.get("/api/stage/events")
    def stage_events():
        """Server-sent events, so a tap on the laptop lands on the stage at once.

        `role=stage` marks this subscriber as an actual audience screen, which is
        what the operator's "stage connected" indicator counts.
        """
        is_screen = request.args.get("role") == "stage"

        def stream():
            # Registering as a viewer has to happen inside the generator: Flask
            # does not start it until the response is actually being sent.
            with (show.viewer() if is_screen else _nothing()):
                payload = show.snapshot()
                yield f"data: {json.dumps(payload)}\n\n"
                version = payload["version"]
                while True:
                    payload = show.wait(version)
                    if payload is None:
                        yield ": keepalive\n\n"     # keeps proxies from closing us
                    else:
                        version = payload["version"]
                        yield f"data: {json.dumps(payload)}\n\n"

        return Response(
            stream(),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    @app.get("/api/status")
    def status():
        return jsonify(
            {
                "version": __version__,
                "download_dir": str(target_dir),
                "ffmpeg": config.ffmpeg_path(),
                "cookies_from_browser": config.cookies_from_browser(),
                "song_count": len(library.list_songs(target_dir)),
            }
        )

    @app.get("/api/search")
    def api_search():
        term = (request.args.get("q") or "").strip()
        if not term:
            return jsonify({"error": "Type something to search for."}), 400
        try:
            limit = int(request.args.get("limit", 20))
        except ValueError:
            limit = 20
        # The music page searches everything; the karaoke page does not.
        karaoke_only = request.args.get("mode") != "music"

        try:
            results = search(term, limit, karaoke=karaoke_only)
        except Exception as exc:
            return jsonify({"error": f"Search failed: {explain_error(exc)}"}), 502

        return jsonify(
            {
                "query": build_query(term) if karaoke_only else term,
                "results": [result.as_dict() for result in results],
                "max_results": MAX_RESULTS,
            }
        )

    @app.post("/api/downloads")
    def start_download():
        payload = request.get_json(silent=True) or {}
        url = (payload.get("url") or "").strip()
        video_id = (payload.get("video_id") or "").strip()
        if not url and video_id:
            url = f"https://www.youtube.com/watch?v={video_id}"
        if not url:
            return jsonify({"error": "Nothing to download."}), 400

        job = downloads.enqueue(
            url,
            title=(payload.get("title") or "").strip(),
            thumbnail=(payload.get("thumbnail") or "").strip(),
        )
        return jsonify(job.as_dict()), 202

    @app.get("/api/downloads")
    def list_downloads():
        return jsonify({"jobs": downloads.jobs()})

    @app.delete("/api/downloads")
    def clear_downloads():
        return jsonify({"cleared": downloads.clear_finished()})

    @app.get("/api/library")
    def get_library():
        return jsonify({"songs": library.list_songs(target_dir), "download_dir": str(target_dir)})

    @app.delete("/api/library/<path:name>")
    def delete_song(name: str):
        if library.delete(name, target_dir):
            return jsonify({"deleted": name})
        return jsonify({"error": "Song not found."}), 404

    @app.get("/media/<path:name>")
    def media(name: str):
        resolved = library.resolve(name, target_dir)
        if resolved is None:
            return jsonify({"error": "Not found."}), 404
        # conditional=True gives us HTTP Range support, so the <video> element
        # can seek without re-downloading the whole file.
        return send_from_directory(target_dir, resolved.name, conditional=True)

    return app
