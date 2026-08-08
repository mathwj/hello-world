#!/usr/bin/env python3
"""Python port of server.js, for machines without Node installed.

Same job: the browser cannot call airbnb.com directly (no public API, and CORS
blocks it), so this fetches Airbnb's own search pages, pulls the JSON embedded
in them, normalizes it, and serves it to index.html.

    python3 server.py [--port 8787] [--host 127.0.0.1]

Standard library only.
"""

import argparse
import base64
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

PAGE_SIZE = 18       # listings per Airbnb search page
MAX_PAGES = 15
CONCURRENCY = 3
MAX_IMAGE_BYTES = 15 * 1024 * 1024

HERE = os.path.dirname(os.path.abspath(__file__))
DEFERRED_STATE = re.compile(
    r'<script id="data-deferred-state-0"[^>]*>(.*?)</script>', re.S
)


# --------------------------------------------------------------------------- #
# Fetching
# --------------------------------------------------------------------------- #

def page_cursor(offset):
    raw = json.dumps(
        {"section_offset": 0, "items_offset": offset, "version": 1},
        separators=(",", ":"),
    )
    return base64.b64encode(raw.encode()).decode()


def build_search_url(opts, offset):
    place = (opts.get("place") or "").strip()
    slug = urllib.parse.quote(place, safe="").replace("%20", "-")

    params = [
        ("tab_id", "home_tab"),
        ("refinement_paths[]", "/homes"),
        ("query", place),
        ("adults", str(opts.get("adults") or 1)),
    ]
    for key in ("children", "infants", "pets"):
        if opts.get(key):
            params.append((key, str(opts[key])))
    if opts.get("checkin") and opts.get("checkout"):
        params.append(("checkin", opts["checkin"]))
        params.append(("checkout", opts["checkout"]))
    if opts.get("currency"):
        params.append(("currency", opts["currency"]))
    if opts.get("minPrice"):
        params.append(("price_min", str(opts["minPrice"])))
    if opts.get("maxPrice"):
        params.append(("price_max", str(opts["maxPrice"])))
    for room_type in opts.get("roomTypes") or []:
        params.append(("room_types[]", room_type))
    if offset > 0:
        params.append(("cursor", page_cursor(offset)))

    return f"https://www.airbnb.com/s/{slug}/homes?" + urllib.parse.urlencode(params)


def fetch_search_page(opts, offset):
    url = build_search_url(opts, offset)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "replace"), url


# --------------------------------------------------------------------------- #
# Parsing
# --------------------------------------------------------------------------- #

def extract_deferred_state(html):
    match = DEFERRED_STATE.search(html)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except ValueError:
        return None


def find_search_results(state):
    """Airbnb moves this path around now and then, so fall back to a deep walk."""
    try:
        direct = state["niobeClientData"][0][1]["data"]["presentation"]["staysSearch"]
        results = direct["results"]["searchResults"]
        if isinstance(results, list):
            return results
    except (KeyError, IndexError, TypeError):
        pass

    best = []

    def walk(node):
        nonlocal best
        if isinstance(node, dict):
            candidate = node.get("searchResults")
            if isinstance(candidate, list) and any(
                isinstance(r, dict) and r.get("__typename") == "StaySearchResult"
                for r in candidate
            ):
                if len(candidate) > len(best):
                    best = candidate
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(state)
    return best


def parse_amount(text):
    """'$1,253' -> 1253 | 'EUR1.234' -> 1234 | '$920.34' -> 920.34"""
    if not isinstance(text, str):
        return None
    match = re.search(r"\d[\d.,\s  ]*", text)
    if not match:
        return None
    s = re.sub(r"[\s  ]", "", match.group(0)).rstrip(".,")
    last_sep = max(s.rfind("."), s.rfind(","))
    if last_sep == -1:
        try:
            return float(s)
        except ValueError:
            return None

    # A separator with 1-2 digits after it is a decimal point; 3 means thousands.
    decimals = len(s) - last_sep - 1
    if decimals in (1, 2):
        s = re.sub(r"[.,]", "", s[:last_sep]) + "." + s[last_sep + 1:]
    else:
        s = re.sub(r"[.,]", "", s)
    try:
        return float(s)
    except ValueError:
        return None


def currency_symbol(text):
    if not isinstance(text, str):
        return ""
    return re.match(r"^[^\d]*", text).group(0).strip()


def nights_between(checkin, checkout):
    if not checkin or not checkout:
        return None
    try:
        start = date.fromisoformat(checkin)
        end = date.fromisoformat(checkout)
    except ValueError:
        return None
    delta = (end - start).days
    return delta if delta > 0 else None


def per_night_from_explanation(sdp):
    """Pull an exact per-night figure out of '4 nights x $267.89' when present."""
    groups = ((sdp.get("explanationData") or {}).get("priceDetails")) or []
    for group in groups:
        for item in group.get("items") or []:
            match = re.match(
                r"^(\d+)\s*nights?\s*x\s*(.+)$", item.get("description") or "", re.I
            )
            if match:
                amount = parse_amount(match.group(2))
                if amount:
                    return amount, int(match.group(1))
    return None, None


def tidy(value):
    return round(value, 2) if value is not None else None


def normalize_result(node, opts):
    sdp = node.get("structuredDisplayPrice") or {}
    line = sdp.get("primaryLine") or {}
    display_price = line.get("discountedPrice") or line.get("price")
    qualifier = (line.get("qualifier") or "").strip()

    stay_listing = node.get("demandStayListing") or {}
    listing_id = None
    try:
        decoded = base64.b64decode(stay_listing.get("id") or "").decode()
        listing_id = decoded.split(":")[1] if ":" in decoded else None
    except Exception:
        pass

    amount = parse_amount(display_price)
    explained_per_night, explained_nights = per_night_from_explanation(sdp)
    qualifier_nights = re.search(r"(\d+)\s*nights?", qualifier, re.I)
    nights = (
        nights_between(opts.get("checkin"), opts.get("checkout"))
        or explained_nights
        or (int(qualifier_nights.group(1)) if qualifier_nights else None)
    )

    # Airbnb shows either a stay total ("for 4 nights") or a nightly rate.
    is_total = bool(re.search(r"night", qualifier, re.I)) and bool(
        re.match(r"^for\b", qualifier, re.I)
    )
    total = per_night = None
    if amount is not None:
        if is_total:
            total = amount
            per_night = amount / nights if nights else amount
        else:
            per_night = amount
            total = amount * nights if nights else amount
    if explained_per_night:
        per_night = explained_per_night

    rating_label = node.get("avgRatingLocalized")
    reviews_match = re.search(r"\(([\d.,]+)\)", rating_label or "")
    description = (stay_listing.get("description") or {}).get("name") or {}
    coordinate = (stay_listing.get("location") or {}).get("coordinate") or {}
    structured = node.get("structuredContent") or {}
    photos = [
        p.get("picture")
        for p in node.get("contextualPictures") or []
        if p.get("picture")
    ]

    return {
        "id": listing_id,
        "url": f"https://www.airbnb.com/rooms/{listing_id}" if listing_id else None,
        "name": (
            description.get("localizedStringWithTranslationPreference")
            or (node.get("nameLocalized") or {}).get(
                "localizedStringWithTranslationPreference"
            )
            or node.get("title")
            or "Untitled listing"
        ),
        "heading": node.get("title"),
        "subtitle": node.get("subtitle"),
        "facts": [m.get("body") for m in structured.get("primaryLine") or [] if m.get("body")],
        "photo": photos[0] if photos else None,
        "photos": photos,
        "rating": parse_amount(rating_label),
        "ratingLabel": rating_label,
        "reviews": parse_amount(reviews_match.group(1)) if reviews_match else None,
        "badges": [b.get("text") for b in node.get("badges") or [] if b.get("text")],
        "lat": coordinate.get("latitude"),
        "lng": coordinate.get("longitude"),
        "displayPrice": display_price,
        "originalPrice": line.get("originalPrice"),
        "qualifier": qualifier,
        "currency": currency_symbol(display_price),
        "nights": nights,
        "perNight": tidy(per_night),
        "total": tidy(total),
    }


# --------------------------------------------------------------------------- #
# Search orchestration
# --------------------------------------------------------------------------- #

def search(opts):
    pages = min(max(1, opts.get("pages") or 3), MAX_PAGES)
    offsets = [i * PAGE_SIZE for i in range(pages)]
    warnings = []
    first_url = None

    def load(offset):
        try:
            html, url = fetch_search_page(opts, offset)
        except Exception as err:  # network, HTTP error, timeout
            return offset, None, None, f"Page {offset // PAGE_SIZE + 1}: {err}"
        state = extract_deferred_state(html)
        if state is None:
            return offset, url, None, (
                f"Page {offset // PAGE_SIZE + 1}: Airbnb did not return search data "
                "(it may be showing a captcha or a changed layout)."
            )
        results = find_search_results(state)
        if not results:
            return offset, url, None, f"Page {offset // PAGE_SIZE + 1}: no listings returned."
        return offset, url, results, None

    with ThreadPoolExecutor(max_workers=min(CONCURRENCY, len(offsets))) as pool:
        pages_out = list(pool.map(load, offsets))

    listings = []
    seen = set()
    for offset, url, results, warning in pages_out:
        if offset == 0 and url:
            first_url = url
        if warning:
            warnings.append(warning)
        for node in results or []:
            listing = normalize_result(node, opts)
            key = listing["id"] or listing["name"]
            if key in seen:
                continue
            seen.add(key)
            listings.append(listing)

    listings.sort(key=lambda l: l["total"] if l["total"] is not None else -1, reverse=True)

    return {
        "query": {
            "place": opts.get("place"),
            "checkin": opts.get("checkin") or None,
            "checkout": opts.get("checkout") or None,
            "adults": opts.get("adults"),
            "nights": nights_between(opts.get("checkin"), opts.get("checkout")),
            "currency": opts.get("currency") or None,
            "pagesRequested": pages,
        },
        "searchUrl": first_url,
        "count": len(listings),
        "warnings": warnings,
        "listings": listings,
    }


# --------------------------------------------------------------------------- #
# HTTP server
# --------------------------------------------------------------------------- #

def int_param(params, name, fallback):
    raw = (params.get(name) or [""])[0]
    try:
        return int(raw)
    except (TypeError, ValueError):
        return fallback


def opts_from_params(params):
    return {
        "place": (params.get("place") or [""])[0],
        "checkin": (params.get("checkin") or [""])[0],
        "checkout": (params.get("checkout") or [""])[0],
        "adults": int_param(params, "adults", 2),
        "children": int_param(params, "children", 0),
        "infants": int_param(params, "infants", 0),
        "pets": int_param(params, "pets", 0),
        "pages": int_param(params, "pages", 3),
        "currency": (params.get("currency") or [""])[0],
        "minPrice": int_param(params, "minPrice", 0),
        "maxPrice": int_param(params, "maxPrice", 0),
        "roomTypes": [r for r in params.get("roomType") or [] if r],
    }


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):  # keep the console quiet
        pass

    def _send(self, status, body, content_type="text/plain; charset=utf-8", extra=None):
        if isinstance(body, str):
            body = body.encode()
        try:
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            for key, value in (extra or {}).items():
                self.send_header(key, value)
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            # The browser cancelled — normal when scrolling past lazy images.
            self.close_connection = True

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if parsed.path == "/api/search":
            opts = opts_from_params(params)
            if not opts["place"].strip():
                self._send(400, json.dumps({"error": 'Missing "place" parameter.'}),
                           "application/json")
                return
            try:
                payload = search(opts)
            except Exception as err:
                self._send(502, json.dumps({"error": str(err)}), "application/json")
                return
            self._send(200, json.dumps(payload), "application/json; charset=utf-8",
                       {"Cache-Control": "no-store"})
            return

        # Thumbnails are proxied so the browser makes no third-party requests and
        # photos still show behind networks that block Airbnb's CDN.
        if parsed.path == "/img":
            target = (params.get("u") or [""])[0]
            parts = urllib.parse.urlparse(target)
            if parts.scheme != "https" or not re.search(r"(^|\.)muscache\.com$", parts.hostname or ""):
                self._send(403, "Forbidden image host")
                return
            try:
                req = urllib.request.Request(target, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=30) as upstream:
                    # Buffered rather than streamed so the response carries a
                    # Content-Length; browsers stall on a length-less image body.
                    body = upstream.read(MAX_IMAGE_BYTES)
                    content_type = upstream.headers.get("Content-Type", "image/jpeg")
            except Exception as err:
                self._send(502, str(err))
                return
            self._send(200, body, content_type, {"Cache-Control": "public, max-age=3600"})
            return

        if parsed.path in ("/", "/index.html"):
            try:
                with open(os.path.join(HERE, "index.html"), "rb") as fh:
                    self._send(200, fh.read(), "text/html; charset=utf-8")
            except OSError:
                self._send(500, "Could not read index.html — keep it next to server.py.")
            return

        self._send(404, "Not found")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8787)))
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()

    try:
        server = ThreadingHTTPServer((args.host, args.port), Handler)
    except OSError as err:
        raise SystemExit(
            f"Could not start on port {args.port}: {err}\n"
            f"Something else may be using it — try: python3 server.py --port 3000"
        )
    print(f"Airbnb sorter running at http://{args.host}:{args.port}")
    print("Leave this window open. Press Control-C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
