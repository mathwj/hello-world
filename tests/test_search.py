import pytest

from karaoke.search import build_query, format_duration, parse_entry, search


class FakeYDL:
    """Stands in for yt_dlp.YoutubeDL so tests never touch the network."""

    def __init__(self, options, entries=None):
        self.options = options
        self.entries = entries if entries is not None else []
        self.requested = None

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def extract_info(self, url, download=False):
        self.requested = url
        return {"entries": self.entries}


def test_build_query_appends_karaoke():
    assert build_query("perfect") == "perfect karaoke"


def test_build_query_collapses_whitespace():
    assert build_query("  bohemian   rhapsody ") == "bohemian rhapsody karaoke"


def test_build_query_does_not_duplicate_karaoke():
    assert build_query("Karaoke Perfect") == "Karaoke Perfect"
    assert build_query("perfect KARAOKE version") == "perfect KARAOKE version"


def test_build_query_rejects_blank():
    with pytest.raises(ValueError):
        build_query("   ")


@pytest.mark.parametrize(
    "seconds,expected",
    [(None, "--:--"), (0, "--:--"), (65, "1:05"), (3725, "1:02:05"), (599, "9:59")],
)
def test_format_duration(seconds, expected):
    assert format_duration(seconds) == expected


def test_parse_entry_normalises_fields():
    result = parse_entry(
        {
            "id": "abc123",
            "title": "Perfect (Karaoke Version)",
            "duration": 263.4,
            "channel": "Sing King",
            "thumbnails": [
                {"url": "http://small.jpg", "width": 120},
                {"url": "http://big.jpg", "width": 640},
            ],
            "view_count": 42,
        }
    )
    assert result.video_id == "abc123"
    assert result.url == "https://www.youtube.com/watch?v=abc123"
    assert result.duration == 263
    assert result.duration_label == "4:23"
    assert result.channel == "Sing King"
    assert result.thumbnail == "http://big.jpg"


def test_parse_entry_falls_back_to_standard_thumbnail():
    assert parse_entry({"id": "xyz", "title": "t"}).thumbnail.endswith("/xyz/mqdefault.jpg")


def test_parse_entry_skips_non_videos():
    assert parse_entry({"id": "pl1", "_type": "playlist"}) is None
    assert parse_entry({"title": "no id"}) is None


def test_search_uses_karaoke_query_and_limit():
    captured = {}

    def factory(options):
        ydl = FakeYDL(options, entries=[{"id": "a", "title": "Perfect Karaoke"}])
        captured["ydl"] = ydl
        return ydl

    results = search("perfect", limit=5, ydl_factory=factory)

    assert captured["ydl"].requested == "ytsearch5:perfect karaoke"
    assert [r.title for r in results] == ["Perfect Karaoke"]


def test_search_clamps_limit_to_max():
    captured = {}

    def factory(options):
        captured["ydl"] = FakeYDL(options)
        return captured["ydl"]

    search("perfect", limit=500, ydl_factory=factory)
    assert captured["ydl"].requested == "ytsearch40:perfect karaoke"


def test_search_drops_unusable_entries():
    entries = [{"id": "a", "title": "ok"}, {"title": "missing id"}]

    def factory(options):
        return FakeYDL(options, entries=entries)

    assert len(search("perfect", ydl_factory=factory)) == 1


def test_search_passes_browser_cookies_when_configured(monkeypatch):
    captured = {}

    def factory(options):
        captured["ydl"] = FakeYDL(options)
        return captured["ydl"]

    monkeypatch.setenv("KARAOKE_COOKIES_FROM_BROWSER", "chrome")
    monkeypatch.setattr("karaoke.config.cookie_problem", lambda: "")
    search("perfect", ydl_factory=factory)
    assert captured["ydl"].options["cookiesfrombrowser"] == ("chrome",)

    monkeypatch.delenv("KARAOKE_COOKIES_FROM_BROWSER")
    search("perfect", ydl_factory=factory)
    assert "cookiesfrombrowser" not in captured["ydl"].options


@pytest.mark.parametrize(
    "text,expected",
    [
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"),
        ("https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ("  dQw4w9WgXcQ  ", "dQw4w9WgXcQ"),
        ("https://vimeo.com/12345", None),
        ("just some words", None),
        ("", None),
    ],
)
def test_parse_video_id(text, expected):
    from karaoke.search import parse_video_id

    assert parse_video_id(text) == expected


def test_video_details_reads_one_video():
    from karaoke.search import video_details

    def factory(options):
        return FakeYDL(options, entries=[])

    class Single(FakeYDL):
        def extract_info(self, url, download=False):
            self.requested = url
            return {"id": "dQw4w9WgXcQ", "title": "A Record", "channel": "Someone", "duration": 212}

    captured = {}

    def single_factory(options):
        captured["ydl"] = Single(options)
        return captured["ydl"]

    result = video_details("dQw4w9WgXcQ", ydl_factory=single_factory)
    assert result.title == "A Record"
    assert result.duration_label == "3:32"
    assert "dQw4w9WgXcQ" in captured["ydl"].requested


def test_results_keep_youtube_relevance_order():
    """Deliberately not sorted by views: relevance understands the query."""
    entries = [
        {"id": "a", "title": "most relevant", "view_count": 21_000},
        {"id": "b", "title": "less relevant", "view_count": 25_100_000},
        {"id": "c", "title": "least relevant", "view_count": 10_700_000},
    ]

    def factory(options):
        return FakeYDL(options, entries=entries)

    assert [r.title for r in search("what", ydl_factory=factory)] == [
        "most relevant",
        "less relevant",
        "least relevant",
    ]


def test_view_counts_are_still_reported():
    """The count is shown on each card even though it no longer sorts them."""
    entries = [{"id": "a", "title": "a song", "view_count": 25_100_000}]

    def factory(options):
        return FakeYDL(options, entries=entries)

    assert search("what", ydl_factory=factory)[0].view_count == 25_100_000
