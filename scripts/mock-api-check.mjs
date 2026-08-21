/**
 * Verifies the model-backed path for both providers without spending credits:
 * stands up a local stand-in for the provider API, points the SDK at it, and
 * checks that the requests we build are well-formed and that structured
 * responses parse back into the shapes the pipeline expects.
 *
 * Run with: node scripts/mock-api-check.mjs
 */
import http from 'node:http';
import assert from 'node:assert/strict';

const CRITERIA_PAYLOAD = {
  briefSummary: 'Experienced marketing manager in Curitiba',
  targetTitles: ['Marketing Manager'],
  adjacentTitles: ['Growth Manager', 'Performance Marketing Manager'],
  localLanguageTitles: ['Gerente de Marketing'],
  location: {
    city: 'Curitiba', region: 'Paraná', country: 'Brazil',
    nearbyPlaces: ['Pinhais'], remoteAcceptable: false,
  },
  targetSeniority: ['senior'],
  minYearsExperience: 5,
  mustHave: [
    { id: 'media_buying', label: 'Media buying', weight: 60, evidenceHints: ['Google Ads'] },
    { id: 'inside_sales', label: 'Inside sales', weight: 40, evidenceHints: ['SDR'] },
  ],
  niceToHave: [],
  industryPreferences: [], educationPreferences: [],
  languages: ['Portuguese'], dealBreakers: [], sourcingQueries: ['"Marketing Manager" "Curitiba"'],
};

const ASSESSMENT_PAYLOAD = {
  overallScore: 91, verdict: 'strong_match', confidence: 88,
  titleFit: 'Exact title match.', locationFit: 'Based in Curitiba.',
  yearsRelevantExperience: 9, seniorityFit: 'Right level.',
  careerTrajectory: 'Agency → in-house manager.',
  educationAnalysis: 'UFPR advertising degree plus a growth MBA.',
  criteriaEvidence: [
    { criterionId: 'media_buying', label: 'Media buying', status: 'proven',
      evidence: 'R$ 4,2M em Google Ads, Meta Ads e LinkedIn Ads', sourceRef: 'experience[0]' },
    { criterionId: 'inside_sales', label: 'Inside sales', status: 'proven',
      evidence: 'Lidero um time de 6 pessoas, incluindo 3 SDRs', sourceRef: 'experience[0]' },
  ],
  strengths: ['Owns a large paid budget'], gaps: [], redFlags: [],
  whyTheyMakeSense: 'Runs both paid media and an inside sales team in Curitiba today.',
  outreachAngle: 'Lead with budget scale.',
};

/** Serves both the OpenAI Responses API and the Anthropic Messages API. */
function startMockProvider(captured) {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const request = JSON.parse(body);
      const isOpenAI = req.url.includes('/responses');
      captured.push({ url: req.url, request, provider: isOpenAI ? 'openai' : 'anthropic' });

      const schema = isOpenAI
        ? (request.text?.format?.schema ?? {})
        : (request.output_config?.format?.schema ?? {});
      const text = JSON.stringify(
        schema.properties?.targetTitles ? CRITERIA_PAYLOAD : ASSESSMENT_PAYLOAD,
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(
        isOpenAI
          ? {
              id: 'resp_mock', object: 'response', created_at: 0, model: request.model,
              status: 'completed', incomplete_details: null, error: null,
              output: [{ id: 'msg_mock', type: 'message', role: 'assistant', status: 'completed',
                content: [{ type: 'output_text', text, annotations: [] }] }],
              usage: { input_tokens: 100, output_tokens: 100, total_tokens: 200 },
            }
          : {
              id: 'msg_mock', type: 'message', role: 'assistant', model: request.model,
              stop_reason: 'end_turn', stop_sequence: null,
              content: [{ type: 'text', text }],
              usage: { input_tokens: 100, output_tokens: 100 },
            },
      ));
    });
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const brief = 'i need an experienced marketing manager in curitiba with media buying and inside sales';

async function checkProvider(provider) {
  const captured = [];
  const server = await startMockProvider(captured);
  const base = `http://127.0.0.1:${server.address().port}`;

  process.env.LLM_PROVIDER = provider;
  if (provider === 'openai') {
    process.env.OPENAI_API_KEY = 'sk-mock';
    process.env.OPENAI_BASE_URL = base;
  } else {
    process.env.ANTHROPIC_API_KEY = 'sk-mock';
    process.env.ANTHROPIC_BASE_URL = base;
  }

  // config.ts reads the environment once at import, so the env above must be
  // set before the first import of anything that reaches it.
  const { buildCriteria } = await import('../dist/criteria.js');
  const { assessProfile } = await import('../dist/scoring.js');
  const { sampleSource } = await import('../dist/sources/sample.js');

  const { criteria, warnings } = await buildCriteria(brief);
  assert.equal(warnings.length, 0, `unexpected warnings: ${warnings.join('; ')}`);
  assert.equal(criteria.location.city, 'Curitiba');
  assert.equal(criteria.mustHave.length, 2);
  console.log(`✓ [${provider}] brief → criteria parsed from a structured response`);

  const [first] = captured;
  assert.equal(first.provider, provider, 'request went to the wrong provider path');
  if (provider === 'openai') {
    assert.equal(first.request.text.format.type, 'json_schema');
    assert.equal(first.request.text.format.strict, true);
    assert.equal(first.request.reasoning.effort, 'high');
    assert.ok(first.request.instructions.includes('adjacentTitles'));
  } else {
    assert.deepEqual(first.request.thinking, { type: 'adaptive' });
    assert.equal(first.request.output_config.effort, 'high');
    assert.equal(first.request.output_config.format.type, 'json_schema');
    assert.ok(first.request.system.includes('adjacentTitles'));
  }
  console.log(`✓ [${provider}] criteria request shape (model, effort, json_schema)`);

  const profiles = await sampleSource.search({ criteria, limit: 1, warn() {}, progress() {} });
  const assessment = await assessProfile(profiles[0], criteria, brief);
  assert.equal(assessment.scoredBy, 'model');
  assert.equal(assessment.overallScore, 91);
  assert.equal(assessment.criteriaEvidence.length, 2);
  assert.equal(assessment.criteriaEvidence[0].status, 'proven');
  console.log(`✓ [${provider}] profile → assessment parsed, evidence preserved`);

  const analysis = captured[1];
  const prompt = provider === 'openai' ? analysis.request.input : analysis.request.messages[0].content;
  const system = provider === 'openai' ? analysis.request.instructions : analysis.request.system;
  const effort = provider === 'openai'
    ? analysis.request.reasoning.effort
    : analysis.request.output_config.effort;
  assert.equal(effort, 'medium');
  assert.ok(prompt.includes('Ana Beatriz Ferraz'));
  assert.ok(prompt.includes('experience[0]'));
  assert.ok(prompt.includes('MUST HAVE'));
  assert.ok(system.includes('Ground every claim'));
  console.log(`✓ [${provider}] analysis prompt carries the rendered profile and the criteria`);

  server.close();
  return { criteria, profile: profiles[0] };
}

// config.ts snapshots the environment at import time, so each provider needs a
// fresh process rather than a re-import.
const target = process.argv[2];

if (target) {
  const { criteria, profile } = await checkProvider(target);

  // The keyword scorer stays available as the fallback for both providers.
  const { heuristicAssessment } = await import('../dist/scoring.js');
  const fallback = heuristicAssessment(profile, criteria);
  assert.ok(fallback.overallScore >= 0 && fallback.overallScore <= 100);
  assert.equal(fallback.scoredBy, 'heuristic');
  console.log(`✓ [${target}] heuristic fallback still produces a bounded score`);
} else {
  const { fileURLToPath } = await import('node:url');
  const { spawnSync } = await import('node:child_process');
  const self = fileURLToPath(import.meta.url);

  for (const provider of ['openai', 'anthropic']) {
    const result = spawnSync(process.execPath, [self, provider], {
      stdio: 'inherit',
      env: { ...process.env, LLM_PROVIDER: provider },
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
  console.log('\nAll model-path checks passed for both providers.');
}
