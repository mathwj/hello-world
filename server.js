#!/usr/bin/env node
'use strict';

/**
 * Tiny zero-dependency proxy for the Airbnb listing sorter.
 *
 * The browser cannot call airbnb.com directly (no public API, and CORS blocks
 * it), so this server fetches Airbnb's own search pages, pulls the JSON that
 * Airbnb embeds in them, normalizes it, and hands it to index.html.
 *
 *   node server.js [--port 8787] [--host 127.0.0.1]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const PAGE_SIZE = 18; // listings per Airbnb search page
const MAX_PAGES = 5;          // pages per price band before we split it instead
const MAX_BANDS = 40;         // hard stop on how many bands one search may scan
const MAX_BAND_DEPTH = 6;     // how many times a band may be halved
const MAX_LISTINGS = 2000;
const CONCURRENCY = 3;

/* ------------------------------------------------------------------ *
 * Fetching
 * ------------------------------------------------------------------ */

function pageCursor(offset) {
  const raw = JSON.stringify({ section_offset: 0, items_offset: offset, version: 1 });
  return Buffer.from(raw, 'utf8').toString('base64');
}

function buildSearchUrl(opts, offset, bounds) {
  const place = (opts.place || '').trim();
  const slug = encodeURIComponent(place).replace(/%20/g, '-');
  const url = new URL(`https://www.airbnb.com/s/${slug}/homes`);
  const p = url.searchParams;

  // Searching by map bounds is what makes street-level results possible: a
  // plain text query for a street scatters results across the whole city.
  if (bounds) {
    p.set('search_by_map', 'true');
    p.set('ne_lat', String(bounds.north));
    p.set('ne_lng', String(bounds.east));
    p.set('sw_lat', String(bounds.south));
    p.set('sw_lng', String(bounds.west));
    p.set('zoom', '15');
  }

  p.set('tab_id', 'home_tab');
  p.set('refinement_paths[]', '/homes');
  p.set('query', place);
  p.set('adults', String(opts.adults || 1));
  if (opts.children) p.set('children', String(opts.children));
  if (opts.infants) p.set('infants', String(opts.infants));
  if (opts.pets) p.set('pets', String(opts.pets));
  if (opts.checkin && opts.checkout) {
    p.set('checkin', opts.checkin);
    p.set('checkout', opts.checkout);
  }
  if (opts.currency) p.set('currency', opts.currency);
  if (opts.minPrice) p.set('price_min', String(opts.minPrice));
  if (opts.maxPrice) p.set('price_max', String(opts.maxPrice));
  for (const rt of opts.roomTypes || []) p.append('room_types[]', rt);
  if (offset > 0) p.set('cursor', pageCursor(offset));

  return url.toString();
}

async function fetchSearchPage(opts, offset, bounds) {
  const url = buildSearchUrl(opts, offset, bounds);
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`Airbnb returned HTTP ${res.status} for ${url}`);
  const html = await res.text();
  return { html, url };
}

/* ------------------------------------------------------------------ *
 * Parsing
 * ------------------------------------------------------------------ */

function extractDeferredState(html) {
  const m = html.match(
    /<script id="data-deferred-state-0"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/** Airbnb moves this path around now and then, so fall back to a deep walk. */
function findSearchResults(state) {
  const direct =
    state?.niobeClientData?.[0]?.[1]?.data?.presentation?.staysSearch?.results;
  if (Array.isArray(direct?.searchResults)) return direct.searchResults;

  let best = null;
  (function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (
      !Array.isArray(node) &&
      Array.isArray(node.searchResults) &&
      node.searchResults.some((r) => r && r.__typename === 'StaySearchResult')
    ) {
      if (!best || node.searchResults.length > best.length) best = node.searchResults;
    }
    for (const k of Object.keys(node)) walk(node[k]);
  })(state);
  return best || [];
}

/**
 * "$1,253" -> 1253 | "€1.234" -> 1234 | "$920.34" -> 920.34
 * Decides between thousands and decimal separators by what follows the last one.
 */
function parseAmount(str) {
  if (typeof str !== 'string') return null;
  const m = str.replace(/ /g, ' ').match(/\d[\d.,\s]*/);
  if (!m) return null;
  let s = m[0].replace(/\s/g, '').replace(/[.,]$/, '');
  const lastSep = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
  if (lastSep === -1) return Number(s) || null;

  // A separator with 1-2 digits after it is a decimal point; 3 means thousands.
  const decimals = s.length - lastSep - 1;
  if (decimals === 1 || decimals === 2) {
    s = s.slice(0, lastSep).replace(/[.,]/g, '') + '.' + s.slice(lastSep + 1);
  } else {
    s = s.replace(/[.,]/g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function currencySymbol(str) {
  if (typeof str !== 'string') return '';
  const m = str.match(/^[^\d]*/);
  return (m ? m[0] : '').trim();
}

function nightsBetween(checkin, checkout) {
  if (!checkin || !checkout) return null;
  const a = Date.parse(checkin + 'T00:00:00Z');
  const b = Date.parse(checkout + 'T00:00:00Z');
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;
  return Math.round((b - a) / 86400000);
}

/** Pull an exact per-night figure out of "4 nights x $267.89" when present. */
function perNightFromExplanation(sdp) {
  const groups = sdp?.explanationData?.priceDetails || [];
  for (const g of groups) {
    for (const item of g.items || []) {
      const m = /^(\d+)\s*nights?\s*x\s*(.+)$/i.exec(item.description || '');
      if (m) {
        const amount = parseAmount(m[2]);
        if (amount) return { perNight: amount, nights: Number(m[1]) };
      }
    }
  }
  return null;
}

function normalizeResult(node, opts) {
  const sdp = node.structuredDisplayPrice || {};
  const line = sdp.primaryLine || {};
  const displayPrice = line.discountedPrice || line.price || null;
  const originalPrice = line.originalPrice || null;
  const qualifier = (line.qualifier || '').trim();

  const rawId = node.demandStayListing?.id || '';
  let id = null;
  try {
    id = Buffer.from(rawId, 'base64').toString('utf8').split(':')[1] || null;
  } catch {
    /* leave null */
  }

  const amount = parseAmount(displayPrice);
  const explained = perNightFromExplanation(sdp);
  const qualifierNights = /(\d+)\s*nights?/i.exec(qualifier);
  const nights =
    nightsBetween(opts.checkin, opts.checkout) ||
    explained?.nights ||
    (qualifierNights ? Number(qualifierNights[1]) : null);

  // Airbnb shows either a stay total ("for 4 nights") or a nightly rate.
  const isTotal = /night/i.test(qualifier) && /^for\b/i.test(qualifier);
  let total = null;
  let perNight = null;
  if (amount != null) {
    if (isTotal) {
      total = amount;
      perNight = nights ? amount / nights : amount;
    } else {
      perNight = amount;
      total = nights ? amount * nights : amount;
    }
  }
  if (explained?.perNight) perNight = explained.perNight;

  const structured = node.structuredContent || {};
  const facts = (structured.primaryLine || [])
    .map((x) => x.body)
    .filter(Boolean);

  return {
    id,
    url: id ? `https://www.airbnb.com/rooms/${id}` : null,
    name:
      node.demandStayListing?.description?.name
        ?.localizedStringWithTranslationPreference ||
      node.nameLocalized?.localizedStringWithTranslationPreference ||
      node.title ||
      'Untitled listing',
    heading: node.title || null,
    subtitle: node.subtitle || null,
    facts,
    photo: node.contextualPictures?.[0]?.picture || null,
    photos: (node.contextualPictures || []).map((p) => p.picture).filter(Boolean),
    rating: parseAmount(node.avgRatingLocalized) || null,
    ratingLabel: node.avgRatingLocalized || null,
    reviews: (() => {
      const m = /\(([\d.,]+)\)/.exec(node.avgRatingLocalized || '');
      return m ? parseAmount(m[1]) : null;
    })(),
    badges: (node.badges || []).map((b) => b.text).filter(Boolean),
    lat: node.demandStayListing?.location?.coordinate?.latitude ?? null,
    lng: node.demandStayListing?.location?.coordinate?.longitude ?? null,
    displayPrice,
    originalPrice,
    qualifier,
    currency: currencySymbol(displayPrice),
    nights,
    perNight: perNight != null ? Math.round(perNight * 100) / 100 : null,
    total: total != null ? Math.round(total * 100) / 100 : null,
  };
}

/* ------------------------------------------------------------------ *
 * Streets: geocoding and geometry
 * ------------------------------------------------------------------ */

const geoCache = new Map();
let geoChain = Promise.resolve(); // Nominatim asks for <=1 request per second

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalizeName = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function boxOf(result) {
  const [south, north, west, east] = result.boundingbox.map(Number);
  return { south, north, west, east };
}

function unionBoxes(boxes) {
  return {
    south: Math.min(...boxes.map((b) => b.south)),
    north: Math.max(...boxes.map((b) => b.north)),
    west: Math.min(...boxes.map((b) => b.west)),
    east: Math.max(...boxes.map((b) => b.east)),
  };
}

function expandBox(box, meters) {
  const midLat = (box.south + box.north) / 2;
  const dLat = meters / 111320;
  const dLng = meters / (111320 * Math.max(0.05, Math.cos((midLat * Math.PI) / 180)));
  return {
    south: box.south - dLat,
    north: box.north + dLat,
    west: box.west - dLng,
    east: box.east + dLng,
  };
}

/** Metres from a point to the nearest edge of a box (0 when inside it). */
function metresToBox(lat, lng, box) {
  const dLat = Math.max(box.south - lat, 0, lat - box.north);
  const dLng = Math.max(box.west - lng, 0, lng - box.east);
  const y = dLat * 111320;
  const x = dLng * 111320 * Math.max(0.05, Math.cos((lat * Math.PI) / 180));
  return Math.sqrt(x * x + y * y);
}

const metresToNearestSegment = (lat, lng, segments) =>
  Math.min(...segments.map((seg) => metresToBox(lat, lng, seg)));

/**
 * Nominatim returns one road segment per result, so a long avenue comes back as
 * a 50 m stub. Collecting every segment that shares the street's name rebuilds
 * the whole street, which is what the map query and the distance filter need.
 */
async function geocodeStreet(street, place) {
  const key = `${street}|${place}`.toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key);

  const run = geoChain.then(async () => {
    const query = place ? `${street}, ${place}` : street;
    const url =
      'https://nominatim.openstreetmap.org/search?format=json&limit=50&q=' +
      encodeURIComponent(query);
    let res = null;
    // Nominatim answers 429 when queries come too close together; back off
    // rather than dropping the street from the search.
    for (const backoff of [0, 2000, 5000]) {
      if (backoff) await sleep(backoff);
      res = await fetch(url, {
        headers: {
          'User-Agent': 'airbnb-listing-sorter/1.0 (personal use)',
          'Accept-Language': 'en',
        },
      });
      if (res.status !== 429) break;
    }
    await sleep(1100); // stay under Nominatim's rate limit
    if (!res.ok) throw new Error(`geocoder returned HTTP ${res.status}`);
    const results = await res.json();
    if (!Array.isArray(results) || !results.length) return null;

    const wanted = normalizeName(street.split(',')[0]);
    const roads = results.filter(
      (r) =>
        r.addresstype === 'road' &&
        r.boundingbox &&
        (normalizeName(r.name) === wanted ||
          normalizeName(r.name).includes(wanted) ||
          wanted.includes(normalizeName(r.name)))
    );
    // Fall back to the top hit for things that are not roads at all, so a
    // neighbourhood or a landmark still works as a search centre.
    const chosen = roads.length ? roads : results.slice(0, 1);
    const segments = chosen.map(boxOf);
    return {
      name: chosen[0].name || street,
      displayName: chosen[0].display_name || street,
      query: street,
      segments,
      bbox: unionBoxes(segments),
      exact: roads.length > 0,
    };
  });

  geoChain = run.catch(() => {});
  const value = await run;
  geoCache.set(key, value);
  return value;
}

/* ------------------------------------------------------------------ *
 * Search orchestration
 * ------------------------------------------------------------------ */

/** Fetch one price band, paging through it, and return its normalized listings. */
async function scanBand(opts, band, warnings, bounds) {
  const bandOpts = { ...opts, minPrice: band.min || 0, maxPrice: band.max || 0 };
  const offsets = Array.from({ length: MAX_PAGES }, (_, i) => i * PAGE_SIZE);
  const found = [];
  let firstUrl = null;
  let cursor = 0;
  let exhausted = false;

  async function worker() {
    while (cursor < offsets.length && !exhausted) {
      const offset = offsets[cursor++];
      try {
        const { html, url } = await fetchSearchPage(bandOpts, offset, bounds);
        if (offset === 0) firstUrl = url;
        const state = extractDeferredState(html);
        if (!state) {
          warnings.push(
            `${label(band)}: Airbnb did not return search data ` +
              `(it may be showing a captcha or a changed layout).`
          );
          continue;
        }
        const results = findSearchResults(state);
        if (!results.length) {
          // Ran off the end of this band — no point requesting deeper offsets.
          exhausted = true;
          continue;
        }
        for (const node of results) found.push(normalizeResult(node, bandOpts));
      } catch (err) {
        warnings.push(`${label(band)}: ${err.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, offsets.length) }, worker)
  );
  return { found, firstUrl };
}

const label = (band) =>
  band.min || band.max
    ? `Price band ${band.min || 0}-${band.max || '∞'}`
    : 'Whole area';

/**
 * Airbnb recycles results past a few hundred deep on a single query, so going
 * wider means splitting the query instead of paging it. Each price band is its
 * own search with its own inventory; bands that come back full get split at
 * their median price and scanned again, which adapts to any currency or market.
 */
async function searchArea(opts, area, ctx, onBatch) {
  const { target, listings, seen, warnings } = ctx;
  const bounds = area ? expandBox(area.bbox, opts.radius) : null;
  const areaTarget = Math.min(listings.length + target, MAX_LISTINGS);
  let bandsDone = 0;
  let firstUrl = null;

  const queue = [{ min: opts.minPrice || 0, max: opts.maxPrice || 0, depth: 0 }];

  while (queue.length && listings.length < areaTarget && bandsDone < MAX_BANDS) {
    // Work inwards from both ends of the price range: scanning top-down alone
    // fills the expensive tail but leaves "cheapest first" badly sampled.
    const ceiling = (b) => (b.max ? b.max : Infinity);
    // Weighted 2:1 towards the top — the expensive tail is the headline of this
    // page, but every third band works up from the cheap end so the bottom of
    // the list is real data rather than whatever happened to turn up.
    const fromTop = bandsDone % 3 !== 2;
    let pick = 0;
    for (let i = 1; i < queue.length; i++) {
      const better = fromTop
        ? ceiling(queue[i]) > ceiling(queue[pick])
        : (queue[i].min || 0) < (queue[pick].min || 0);
      if (better) pick = i;
    }
    const band = queue.splice(pick, 1)[0];
    const { found, firstUrl: url } = await scanBand(opts, band, warnings, bounds);
    bandsDone++;
    if (!firstUrl) firstUrl = url;

    const fresh = [];
    for (const listing of found) {
      // Airbnb's map box is a rectangle around the whole street, so trim it
      // back to listings actually within the radius of one of its segments.
      if (area) {
        if (listing.lat == null || listing.lng == null) continue;
        const metres = metresToNearestSegment(listing.lat, listing.lng, area.segments);
        if (metres > opts.radius) continue;
        listing.metresFromStreet = Math.round(metres);
      }
      const key = listing.id || listing.name;
      const already = seen.get(key);
      if (already) {
        // A listing can sit near two of the requested streets.
        if (area && !already.streets.includes(area.name)) already.streets.push(area.name);
        continue;
      }
      if (area) listing.streets = [area.name];
      seen.set(key, listing);
      fresh.push(listing);
      listings.push(listing);
    }

    // onBatch returns false when the page has gone away, so an abandoned
    // scan stops hitting Airbnb instead of running to completion unwatched.
    if (onBatch) {
      const keepGoing = onBatch(fresh, {
        total: listings.length,
        target: ctx.overallTarget,
        bandsDone: ++ctx.bandsDone,
        bandsQueued: queue.length,
        band: label(band),
        area: area ? area.name : null,
      });
      if (keepGoing === false) return { firstUrl, stopped: true };
    }

    // A band that filled every page it was allowed probably has more behind it.
    const full = found.length >= MAX_PAGES * PAGE_SIZE * 0.9;
    if (full && listings.length < areaTarget && band.depth < MAX_BAND_DEPTH) {
      const prices = found
        .map((l) => l.perNight)
        .filter((n) => n != null)
        .sort((a, b) => a - b);
      const mid = prices.length ? Math.round(prices[prices.length >> 1]) : 0;
      const canSplit =
        mid > (band.min || 0) + 1 && (!band.max || mid < band.max - 1);
      if (canSplit) {
        queue.push({ min: band.min || 0, max: mid, depth: band.depth + 1 });
        queue.push({ min: mid, max: band.max || 0, depth: band.depth + 1 });
      }
    }
  }

  return { firstUrl, stopped: false };
}

/**
 * Runs one scan per requested street, or a single area-wide scan when no
 * streets are given, and merges the results. Airbnb never publishes a listing's
 * street address, so "on this street" means "within the chosen radius of it"
 * using the approximate coordinates Airbnb does publish.
 */
async function search(opts, onBatch) {
  const target = Math.min(Math.max(opts.limit || 50, PAGE_SIZE), MAX_LISTINGS);
  const ctx = {
    target,
    overallTarget: target * Math.max(1, (opts.streets || []).length),
    listings: [],
    seen: new Map(),
    warnings: [],
    bandsDone: 0,
  };

  const areas = [];
  for (const street of opts.streets || []) {
    try {
      const geo = await geocodeStreet(street, opts.place);
      if (geo) areas.push(geo);
      else ctx.warnings.push(`Could not find "${street}" in ${opts.place}.`);
    } catch (err) {
      ctx.warnings.push(`Could not look up "${street}": ${err.message}`);
    }
  }
  // Never fall back to an area-wide scan here: someone who asked for specific
  // streets would silently get the whole city instead.
  const requestedStreets = (opts.streets || []).length > 0;
  if (requestedStreets && !areas.length) {
    ctx.warnings.push(
      'None of those streets could be located, so no search was run. ' +
        'Check the spelling, or include the city in the street name.'
    );
  }

  let firstUrl = null;
  const toScan = requestedStreets ? areas : [null];
  for (const area of toScan) {
    const result = await searchArea(opts, area, ctx, onBatch);
    if (!firstUrl) firstUrl = result.firstUrl;
    if (result.stopped) break;
  }

  ctx.listings.sort((a, b) => (b.total ?? -1) - (a.total ?? -1));

  return {
    query: {
      place: opts.place,
      checkin: opts.checkin || null,
      checkout: opts.checkout || null,
      adults: opts.adults,
      nights: nightsBetween(opts.checkin, opts.checkout),
      currency: opts.currency || null,
      target,
      bandsScanned: ctx.bandsDone,
      radius: areas.length ? opts.radius : null,
      streets: areas.map((a) => ({
        name: a.name,
        displayName: a.displayName,
        query: a.query,
        exact: a.exact,
        segments: a.segments.length,
      })),
    },
    searchUrl: firstUrl,
    count: ctx.listings.length,
    warnings: ctx.warnings,
    listings: ctx.listings,
  };
}

/* ------------------------------------------------------------------ *
 * HTTP server
 * ------------------------------------------------------------------ */

function intParam(params, name, fallback) {
  const raw = params.get(name);
  if (raw == null || raw === '') return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function optsFromParams(params) {
  return {
    place: params.get('place') || '',
    checkin: params.get('checkin') || '',
    checkout: params.get('checkout') || '',
    adults: intParam(params, 'adults', 2),
    children: intParam(params, 'children', 0),
    infants: intParam(params, 'infants', 0),
    pets: intParam(params, 'pets', 0),
    limit: intParam(params, 'limit', 50),
    streets: params.getAll('street').map((s) => s.trim()).filter(Boolean),
    radius: Math.min(Math.max(intParam(params, 'radius', 400), 50), 5000),
    currency: params.get('currency') || '',
    minPrice: intParam(params, 'minPrice', 0),
    maxPrice: intParam(params, 'maxPrice', 0),
    roomTypes: params.getAll('roomType').filter(Boolean),
  };
}

const STATIC = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // Lets the page tell "server is down" apart from "server is an old copy that
  // predates streaming" — both look identical to an EventSource otherwise.
  if (url.pathname === '/api/health') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify({ ok: true, stream: true, runtime: 'node' }));
    return;
  }

  // Server-sent events: a deep scan takes a while, so listings are pushed to
  // the page band by band rather than making it wait for the whole run.
  if (url.pathname === '/api/search/stream') {
    const opts = optsFromParams(url.searchParams);
    if (!opts.place.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing "place" parameter.' }));
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive',
    });
    let aborted = false;
    req.on('close', () => {
      aborted = true;
    });
    const send = (event, data) => {
      if (!aborted) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    try {
      const payload = await search(opts, (batch, progress) => {
        send('batch', { listings: batch, ...progress });
        return !aborted;
      });
      send('done', { ...payload, listings: undefined });
    } catch (err) {
      send('failed', { error: err.message });
    }
    res.end();
    return;
  }

  if (url.pathname === '/api/search') {
    const opts = optsFromParams(url.searchParams);
    if (!opts.place.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing "place" parameter.' }));
      return;
    }
    try {
      const payload = await search(opts);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify(payload));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Thumbnails are proxied so the browser makes no third-party requests and
  // photos still show behind networks that block Airbnb's CDN.
  if (url.pathname === '/img') {
    const target = url.searchParams.get('u') || '';
    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      res.writeHead(400).end('Bad image url');
      return;
    }
    if (parsed.protocol !== 'https:' || !/(^|\.)muscache\.com$/.test(parsed.hostname)) {
      res.writeHead(403).end('Forbidden image host');
      return;
    }
    try {
      const upstream = await fetch(parsed.toString(), { headers: { 'User-Agent': UA } });
      if (!upstream.ok || !upstream.body) {
        res.writeHead(upstream.status).end();
        return;
      }
      res.writeHead(200, {
        'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      });
      require('stream').Readable.fromWeb(upstream.body).pipe(res);
    } catch (err) {
      res.writeHead(502).end(err.message);
    }
    return;
  }

  const entry = STATIC[url.pathname];
  if (entry) {
    fs.readFile(path.join(__dirname, entry[0]), (err, buf) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Could not read ' + entry[0]);
        return;
      }
      // No caching: otherwise replacing index.html leaves the browser showing
      // the old page until someone thinks to hard-refresh.
      res.writeHead(200, { 'Content-Type': entry[1], 'Cache-Control': 'no-store' });
      res.end(buf);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

if (require.main === module) {
  const argv = process.argv.slice(2);
  const argOf = (flag, fallback) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  const port = Number(argOf('--port', process.env.PORT || 8787));
  const host = argOf('--host', '127.0.0.1');
  server.listen(port, host, () => {
    console.log(`Airbnb sorter running at http://${host}:${port}`);
  });
}

module.exports = { search, parseAmount, normalizeResult, buildSearchUrl };
