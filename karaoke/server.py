"""Flask app serving the karaoke UI and its JSON API.

It binds to localhost only — this is a desktop app that happens to render in a
browser window, not a service meant to be reachable from the network.
"""

from __future__ import annotations

import mimetypes
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_from_directory

from . import __version__, config
from . import library
from .downloads import DownloadManager, explain_error
from .search import MAX_RESULTS, build_query, search

mimetypes.add_type("video/mp4", ".m4v")
mimetypes.add_type("video/x-matroska", ".mkv")


def create_app(download_dir: Path | None = None, manager: DownloadManager | None = None) -> Flask:
    app = Flask(__name__)
    target_dir = Path(download_dir) if download_dir else config.download_dir()
    app.config["DOWNLOAD_DIR"] = target_dir
    downloads = manager or DownloadManager(target_dir)
    app.config["DOWNLOADS"] = downloads

    @app.get("/")
    def index():
        return render_template("index.html", version=__version__)

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

        try:
            results = search(term, limit)
        except Exception as exc:
            return jsonify({"error": f"Search failed: {explain_error(exc)}"}), 502

        return jsonify(
            {
                "query": build_query(term),
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
