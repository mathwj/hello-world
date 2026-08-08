# hello-world

Just my first repository.

## Airbnb listing sorter

A small web page that searches an area on Airbnb, pulls several pages of
results, and ranks them from most expensive to cheapest.

### Run it

Two interchangeable servers — use whichever runtime you have. No dependencies
to install either way.

```bash
node server.js          # Node 18+
python3 server.py       # or Python 3.8+
```

Then open http://127.0.0.1:8787. Pass `--port 3000` to either one if that port
is taken. Keep `index.html` in the same folder as the server you run.

Type an area ("Lisbon, Portugal", "Copenhagen", "Big Sur, CA"), optionally add
dates, guests, currency, a place type, and a price range, then hit **Search**.

**Min / night** sets a floor in the selected currency — set it to 1000 with BRL
and only listings at or above R$1,000 a night come back. It is Airbnb's own
filter, so a deep scan spends its entire budget above the floor instead of
paging through cheap listings to reach the expensive ones.

### What you get

- Scans from ~50 up to ~1500 listings per search, streamed into the page as
  each price band completes, with a **Stop** button to cut a long scan short.
- Results sorted most expensive first, plus cheapest-first, per-night, rating,
  and most-reviewed orderings — re-sorting is instant, no refetch.
- Both a stay total and a derived per-night price for every listing, with the
  pre-discount price shown when Airbnb is discounting.
- Card and table views, a price range/median summary, and CSV export.
- Each card links straight to the listing on Airbnb.

### How it works

Airbnb has no public API, and a browser cannot call airbnb.com directly because
of CORS. `server.js` is a ~200-line zero-dependency proxy that does three
things:

1. Requests Airbnb's own search pages (18 listings each, paged through a cursor,
   3 pages at a time). A single query starts recycling the same listings after a
   few hundred results, so a deep scan splits the search into price bands and
   pages each band separately. Bands that come back full are split again at
   their median price, which adapts to any currency or market. Bands are worked
   from both ends of the range, weighted 2:1 towards the top.
2. Reads the JSON Airbnb embeds in those pages (`data-deferred-state-0`) and
   normalizes each result — name, photos, rating, review count, coordinates,
   badges, and prices parsed into numbers across currency formats.
3. Serves `index.html` and proxies listing thumbnails, so the browser makes no
   third-party requests.

### Caveats

- **You are sorting a large sample, not the whole area.** Band splitting gets
  far deeper than paging alone — a 400-listing Lisbon scan reached €37,779 for
  four nights where a flat 3-page scan topped out at €1,650 — but it is still a
  sample. Raise the listing count, or use the min/max price filters, to aim at
  the range you care about.
- Prices are whatever Airbnb displays for your dates — normally the stay total
  before taxes. Per-night figures are derived from that. Confirm on Airbnb
  before booking.
- Parsing depends on Airbnb's page structure. If a release changes it, the page
  reports which pages came back empty rather than showing wrong numbers, and
  `findSearchResults()` in `server.js` is the place to fix.
- Keep the page count modest and don't hammer it; this is for personal browsing.
