/**
 * Exercises the NinjaPear adapter against a local stand-in for its API:
 * request shapes, the search → enrich chain, the credit ledger's hard stop,
 * and the field mapping into the pipeline's Profile shape.
 *
 * The real API is never called, so this proves the plumbing, not the vendor's
 * live response shape.
 *
 * Run with: node scripts/ninjapear-check.mjs
 */
import http from 'node:http';
import assert from 'node:assert/strict';

// `node ninjapear-check.mjs capped` runs one sweep against an already-running
// mock and prints the warnings as JSON, for the credit-cap check below.
if (process.argv[2] === 'capped') {
  const { ninjapearSource: source } = await import('../dist/sources/ninjapear.js');
  const { heuristicCriteria: buildCriteria } = await import('../dist/criteria.js');
  const collected = [];
  await source.search({
    criteria: buildCriteria('marketing manager in curitiba'),
    limit: 100,
    warn: (message) => collected.push(message),
    progress: () => {},
  });
  console.log(JSON.stringify(collected));
  process.exit(0);
}

const requests = [];

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  requests.push({ path: url.pathname, params: Object.fromEntries(url.searchParams) });

  const json = (body) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === '/api/v1/company/website') {
    return json({ website: 'resolved-agency.com.br' });
  }

  if (url.pathname === '/api/v1/employee/search') {
    // Two people per (company, role) pair.
    return json({
      employees: [
        { first_name: 'Ana', last_name: 'Ferraz', role: url.searchParams.get('role') },
        { first_name: 'Rafael', last_name: 'Machado', role: url.searchParams.get('role') },
      ],
    });
  }

  if (url.pathname === '/api/v2/employee/profile') {
    return json({
      id: `np_${url.searchParams.get('first_name')}`,
      full_name: `${url.searchParams.get('first_name')} Ferraz`,
      bio: 'Gerente de marketing focada em mídia paga.',
      city: 'Curitiba', state: 'Paraná', country: 'Brazil',
      work_experience: [
        {
          role: 'Gerente de Marketing', company_name: 'Meridiano',
          company_website: 'meridiano.com.br', start_date: '2021-03', end_date: null,
          description: 'Google Ads, Meta Ads e um time de SDRs.',
        },
        {
          role: 'Coordenadora de Mídia', company_name: 'Pinhão',
          start_date: '2018-01', end_date: '2021-02',
        },
      ],
      education: [{ major: 'Publicidade', school: 'UFPR', start_date: '2011', end_date: '2015' }],
      skills: ['Google Ads', 'Meta Ads'],
    });
  }

  res.writeHead(404);
  res.end('{}');
});

await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;

process.env.NINJAPEAR_API_KEY = 'np-mock-key';
process.env.NINJAPEAR_BASE_URL = base;
process.env.NINJAPEAR_COMPANIES = 'meridiano.com.br,Agência Exemplo Curitiba';
process.env.NINJAPEAR_MAX_ROLES = '2';
process.env.NINJAPEAR_MAX_CREDITS = '1000';

const { ninjapearSource } = await import('../dist/sources/ninjapear.js');
const { heuristicCriteria } = await import('../dist/criteria.js');
const { yearsOfExperience } = await import('../dist/profile-text.js');

const criteria = heuristicCriteria(
  'experienced marketing manager in curitiba with media buying and inside sales',
);

const warnings = [];
const progress = [];
const profiles = await ninjapearSource.search({
  criteria, limit: 50,
  warn: (m) => warnings.push(m),
  progress: (m) => progress.push(m),
});

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`✓ ${name}`); };

check('a plain company name is resolved to a website before searching', () => {
  const lookup = requests.find((r) => r.path === '/api/v1/company/website');
  assert.ok(lookup, 'expected a website lookup for the non-domain entry');
  assert.equal(lookup.params.company_name, 'Agência Exemplo Curitiba');
  assert.equal(lookup.params.country_code, 'BR');
});

check('a bare domain skips the lookup and is searched directly', () => {
  const searches = requests.filter((r) => r.path === '/api/v1/employee/search');
  assert.ok(searches.some((s) => s.params.company_website === 'meridiano.com.br'));
  assert.ok(searches.some((s) => s.params.company_website === 'resolved-agency.com.br'));
});

check('employee search sends company_website, role and the geography filters', () => {
  const [search] = requests.filter((r) => r.path === '/api/v1/employee/search');
  assert.ok(search.params.company_website);
  assert.ok(search.params.role);
  assert.equal(search.params.country, 'BR');
  assert.equal(search.params.city, 'Curitiba');
  assert.equal(search.params.state, 'Paraná');
});

check('the fan-out is companies x roles, capped by NINJAPEAR_MAX_ROLES', () => {
  const searches = requests.filter((r) => r.path === '/api/v1/employee/search');
  assert.equal(searches.length, 2 * 2, 'expected 2 companies x 2 roles');
});

check('people repeated across role queries are de-duplicated', () => {
  // 2 companies x 2 roles x 2 people = 8 hits, but only 2 distinct per company.
  assert.equal(profiles.length, 4);
});

check('each hit is enriched through the profile endpoint', () => {
  const enrichments = requests.filter((r) => r.path === '/api/v2/employee/profile');
  assert.equal(enrichments.length, 4);
  assert.ok(enrichments[0].params.first_name);
  assert.ok(enrichments[0].params.employer_website);
});

check('profiles map into the pipeline shape, current role left open', () => {
  const [profile] = profiles;
  assert.equal(profile.source, 'ninjapear');
  assert.equal(profile.location, 'Curitiba, Paraná, Brazil');
  assert.equal(profile.summary, 'Gerente de marketing focada em mídia paga.');
  assert.equal(profile.experiences.length, 2);
  assert.equal(profile.experiences[0].title, 'Gerente de Marketing');
  assert.equal(profile.experiences[0].company, 'Meridiano');
  assert.equal(profile.experiences[0].endDate, null, 'a null end_date means current');
  assert.equal(profile.experiences[1].endDate, '2021-02');
  assert.equal(profile.educations[0].school, 'UFPR');
  assert.equal(profile.educations[0].fieldOfStudy, 'Publicidade');
  assert.equal(profile.educations[0].startYear, 2011);
  assert.ok(yearsOfExperience(profile) > 5, 'tenure should compute from the mapped dates');
});

check('the credit ledger reports spend', () => {
  assert.ok(progress.some((m) => /credits used/.test(m)), progress.join(' | '));
});

server.close();

// Second run: a cap far below what the sweep needs must stop it early.
// config.ts snapshots the environment at import, so the capped run needs its
// own process — this file re-invokes itself with a `capped` argument. The
// child is spawned asynchronously: spawnSync would block this process's event
// loop and its mock server would never answer.
const capped = await (async () => {
  const cappedServer = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(
      url.pathname === '/api/v1/employee/search'
        ? { employees: Array.from({ length: 5 }, (_, i) => ({
            first_name: `P${i}`, last_name: 'X', role: 'Marketing Manager' })) }
        : { full_name: 'P X', work_experience: [], education: [] },
    ));
  });
  await new Promise((resolve) => cappedServer.listen(0, resolve));

  const { spawn } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const self = fileURLToPath(import.meta.url);
  const childBase = `http://127.0.0.1:${cappedServer.address().port}`;

  const stdout = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [self, 'capped'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        NINJAPEAR_API_KEY: 'np-mock-key',
        NINJAPEAR_BASE_URL: childBase,
        NINJAPEAR_COMPANIES: 'a.com,b.com,c.com,d.com',
        NINJAPEAR_MAX_CREDITS: '8',
        NINJAPEAR_MAX_ROLES: '4',
      },
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (chunk) => (out += chunk));
    child.stderr.on('data', (chunk) => (err += chunk));
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve(out) : reject(new Error(err || `child exited ${code}`)),
    );
  });

  cappedServer.close();
  return JSON.parse(stdout.trim().split('\n').pop());
})();

check('the run stops at the credit cap instead of draining the account', () => {
  assert.ok(
    capped.some((w) => /credit cap/i.test(w)),
    `expected a credit-cap warning, got: ${JSON.stringify(capped)}`,
  );
});

console.log(`\n${passed} NinjaPear adapter checks passed.`);
