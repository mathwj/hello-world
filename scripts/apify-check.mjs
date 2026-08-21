/**
 * Exercises the Apify adapter against a local stand-in for the Apify API:
 * the run → poll → fetch-dataset lifecycle, the search-then-enrich chain, and
 * the tolerant field mapping into the pipeline's Profile shape.
 *
 * The real API is never called, so this proves the plumbing, not any
 * particular actor's live output shape.
 *
 * Run with: node scripts/apify-check.mjs
 */
import http from 'node:http';
import assert from 'node:assert/strict';

const requests = [];
let pollCount = 0;

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    const url = new URL(req.url, 'http://localhost');
    const parsed = body ? JSON.parse(body) : null;
    requests.push({ path: url.pathname, method: req.method, body: parsed, auth: req.headers.authorization });

    const json = (payload) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    };

    // Start a run.
    if (req.method === 'POST' && url.pathname.includes('/runs')) {
      const isProfile = url.pathname.includes('profile-actor');
      return json({ data: { id: isProfile ? 'run_profile' : 'run_search', defaultDatasetId: isProfile ? 'ds_profile' : 'ds_search' } });
    }

    // Poll a run: RUNNING once, then SUCCEEDED, to prove polling works.
    if (url.pathname.startsWith('/v2/actor-runs/')) {
      pollCount++;
      return json({ data: { status: pollCount === 1 ? 'RUNNING' : 'SUCCEEDED' } });
    }

    // Search dataset: current role only, no work history.
    if (url.pathname === '/v2/datasets/ds_search/items') {
      return json([
        {
          fullName: 'Ana Beatriz Ferraz',
          headline: 'Gerente de Marketing | Performance',
          jobTitle: 'Gerente de Marketing',
          currentCompany: 'Meridiano',
          profileUrl: 'https://www.linkedin.com/in/ana-beatriz-ferraz',
          locationName: 'Curitiba, Paraná, Brazil',
          country: 'Brazil',
          education: ['Universidade Federal do Paraná'],
        },
        {
          firstName: 'Rafael',
          lastName: 'Machado',
          jobTitle: 'Growth Manager',
          currentCompany: 'Bonsai',
          profileUrl: 'https://www.linkedin.com/in/rafael-machado',
          city: 'Curitiba',
          country: 'Brazil',
        },
        { headline: 'no name here — should be dropped' },
      ]);
    }

    // Profile dataset: full history, different field spellings on purpose.
    if (url.pathname === '/v2/datasets/ds_profile/items') {
      return json([
        {
          fullName: 'Ana Beatriz Ferraz',
          url: 'https://www.linkedin.com/in/ana-beatriz-ferraz',
          about: 'Nove anos em aquisição paga.',
          experiences: [
            { title: 'Gerente de Marketing', companyName: 'Meridiano', startDate: '2021-03', endDate: null,
              description: 'Google Ads, Meta Ads, time de SDRs.' },
            { title: 'Coordenadora de Mídia', companyName: 'Pinhão', startDate: '2018-01', endDate: '2021-02' },
          ],
          educations: [{ schoolName: 'UFPR', degree: 'Bacharelado', fieldOfStudy: 'Publicidade', startDate: '2011', endDate: '2015' }],
          skills: ['Google Ads', 'Meta Ads'],
        },
      ]);
    }

    res.writeHead(404);
    res.end('[]');
  });
});

await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;

// The adapter hardcodes the api.apify.com host, so redirect it locally.
const realFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  return realFetch(url.replace('https://api.apify.com', `http://127.0.0.1:${port}`), init);
};

process.env.APIFY_TOKEN = 'apify_mock_token';
process.env.APIFY_SEARCH_ACTOR = 'someone/search-actor';
process.env.APIFY_PROFILE_ACTOR = 'someone/profile-actor';
process.env.APIFY_POLL_MS = '10';

const apifyModule = await import('../dist/sources/apify.js');
const { apifySource, normaliseApifyPerson } = apifyModule;
const { heuristicCriteria } = await import('../dist/criteria.js');
const { yearsOfExperience } = await import('../dist/profile-text.js');

const criteria = heuristicCriteria(
  'experienced marketing manager in curitiba with media buying and inside sales',
);

const warnings = [];
const progress = [];
const profiles = await apifySource.search({
  criteria, limit: 25,
  warn: (m) => warnings.push(m),
  progress: (m) => progress.push(m),
});

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`✓ ${name}`); };

check('the actor id is addressed with a tilde, not a slash', () => {
  const start = requests.find((r) => r.method === 'POST');
  assert.equal(start.path, '/v2/acts/someone~search-actor/runs');
});

check('the API token is sent as a bearer header', () => {
  assert.equal(requests[0].auth, 'Bearer apify_mock_token');
});

check('the search input carries titles, locations, keywords and the cap', () => {
  const { body } = requests.find((r) => r.method === 'POST');
  assert.ok(body.jobTitles.includes('Marketing Manager'));
  assert.ok(body.jobTitles.some((t) => /Gerente de Marketing/.test(t)), 'local-language titles too');
  assert.ok(body.locations.some((l) => /Curitiba/.test(l)));
  assert.ok(body.extraKeywords.length > 0);
  assert.equal(body.maxResults, 25);
  assert.equal(body.expandTitleVariants, true);
});

check('the run is polled until it reaches a terminal status', () => {
  assert.ok(pollCount >= 2, `expected polling, saw ${pollCount} poll(s)`);
  assert.ok(progress.some((m) => /is running/.test(m)), progress.join(' | '));
});

check('rows without a name are dropped rather than becoming empty profiles', () => {
  assert.equal(profiles.length, 2);
  assert.ok(profiles.every((p) => p.fullName && p.fullName !== 'Unknown'));
});

check('a first/last name pair is joined when fullName is absent', () => {
  assert.ok(profiles.some((p) => p.fullName === 'Rafael Machado'));
});

check('enrichment posts the collected profile URLs to the profile actor', () => {
  const enrich = requests.filter((r) => r.method === 'POST').at(-1);
  assert.equal(enrich.path, '/v2/acts/someone~profile-actor/runs');
  assert.ok(enrich.body.profileUrls.includes('https://www.linkedin.com/in/ana-beatriz-ferraz'));
});

check('enriched work history replaces the search stub', () => {
  const ana = profiles.find((p) => p.fullName === 'Ana Beatriz Ferraz');
  assert.equal(ana.experiences.length, 2);
  assert.equal(ana.experiences[0].company, 'Meridiano');
  assert.equal(ana.experiences[0].endDate, null, 'a null end date means current');
  assert.equal(ana.experiences[1].endDate, '2021-02');
  assert.equal(ana.educations[0].school, 'UFPR');
  assert.equal(ana.educations[0].fieldOfStudy, 'Publicidade');
  assert.equal(ana.summary, 'Nove anos em aquisição paga.');
  assert.ok(yearsOfExperience(ana) > 5);
});

check('someone the profile actor did not return keeps their search row', () => {
  const rafael = profiles.find((p) => p.fullName === 'Rafael Machado');
  assert.equal(rafael.experiences.length, 1);
  assert.equal(rafael.experiences[0].title, 'Growth Manager');
  assert.ok(rafael.extras?.coverage, 'thin profiles should say so');
});

check('a bare-string education entry still maps to a school', () => {
  const mapped = normaliseApifyPerson({ fullName: 'X', education: ['UFPR'] });
  assert.equal(mapped.educations[0].school, 'UFPR');
});

server.close();
console.log(`\n${passed} Apify adapter checks passed.`);
