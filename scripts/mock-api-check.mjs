/**
 * Verifies the model-backed path without spending API credits: stands up a
 * local stand-in for the Messages API, points the SDK at it, and checks that
 * the requests we build are well-formed and that structured responses parse
 * back into the shapes the pipeline expects.
 *
 * Run with: node scripts/mock-api-check.mjs
 */
import http from 'node:http';
import assert from 'node:assert/strict';

const captured = [];

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    const request = JSON.parse(body);
    captured.push(request);

    // Echo back a payload matching the requested output schema.
    const schema = request.output_config?.format?.schema ?? {};
    const isCriteria = Boolean(schema.properties?.targetTitles);

    const payload = isCriteria
      ? {
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
        }
      : {
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

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: 'msg_mock', type: 'message', role: 'assistant',
      model: request.model, stop_reason: 'end_turn', stop_sequence: null,
      content: [{ type: 'text', text: JSON.stringify(payload) }],
      usage: { input_tokens: 100, output_tokens: 100 },
    }));
  });
});

await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();

process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${port}`;
process.env.ANTHROPIC_API_KEY = 'sk-mock-key-for-local-verification';

const { buildCriteria } = await import('../dist/criteria.js');
const { assessProfile } = await import('../dist/scoring.js');
const { sampleSource } = await import('../dist/sources/sample.js');

const brief = 'i need an experienced marketing manager in curitiba with media buying and inside sales';

// 1. Brief parsing round-trips through the structured-output helper.
const { criteria, warnings } = await buildCriteria(brief);
assert.equal(warnings.length, 0, `unexpected warnings: ${warnings.join('; ')}`);
assert.equal(criteria.location.city, 'Curitiba');
assert.equal(criteria.mustHave.length, 2);
console.log('✓ brief → criteria parsed from a structured response');

// 2. The request we send is shaped the way the API expects.
const [criteriaRequest] = captured;
assert.equal(criteriaRequest.model, 'claude-opus-5');
assert.deepEqual(criteriaRequest.thinking, { type: 'adaptive' });
assert.equal(criteriaRequest.output_config.effort, 'high');
assert.equal(criteriaRequest.output_config.format.type, 'json_schema');
assert.ok(criteriaRequest.system.includes('adjacentTitles'));
assert.ok(!('budget_tokens' in (criteriaRequest.thinking ?? {})));
assert.ok(!criteriaRequest.messages.some((m) => m.role === 'assistant'), 'no prefill');
console.log('✓ criteria request shape (model, adaptive thinking, effort, json_schema)');

// 3. Candidate analysis parses into a full assessment.
const profiles = await sampleSource.search({ criteria, limit: 1, warn() {}, progress() {} });
const assessment = await assessProfile(profiles[0], criteria, brief);
assert.equal(assessment.scoredBy, 'model');
assert.equal(assessment.overallScore, 91);
assert.equal(assessment.criteriaEvidence.length, 2);
assert.equal(assessment.criteriaEvidence[0].status, 'proven');
console.log('✓ profile → assessment parsed, evidence preserved');

// 4. The analyst prompt actually carries the profile and the requirements.
const analysisRequest = captured[1];
assert.equal(analysisRequest.output_config.effort, 'medium');
assert.ok(analysisRequest.messages[0].content.includes('Ana Beatriz Ferraz'));
assert.ok(analysisRequest.messages[0].content.includes('experience[0]'));
assert.ok(analysisRequest.messages[0].content.includes('MUST HAVE'));
assert.ok(analysisRequest.system.includes('Ground every claim'));
console.log('✓ analysis prompt carries the rendered profile and the criteria');

// 5. Scores are clamped rather than trusted blindly.
const { heuristicAssessment } = await import('../dist/scoring.js');
const fallback = heuristicAssessment(profiles[0], criteria);
assert.ok(fallback.overallScore >= 0 && fallback.overallScore <= 100);
assert.equal(fallback.scoredBy, 'heuristic');
console.log('✓ heuristic fallback still produces a bounded score');

server.close();
console.log('\nAll model-path checks passed.');
