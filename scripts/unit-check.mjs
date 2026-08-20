/**
 * Offline checks for the parts that have no model in the loop: CSV parsing,
 * tenure maths, the relevance gate and the deterministic scorer.
 *
 * Run with: node scripts/unit-check.mjs
 */
import assert from 'node:assert/strict';
import { parseCsv } from '../dist/sources/csv.js';
import { heuristicCriteria } from '../dist/criteria.js';
import { heuristicAssessment, prefilterScore } from '../dist/scoring.js';
import { renderProfile, yearsOfExperience } from '../dist/profile-text.js';

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log(`✓ ${name}`);
}

check('CSV reader handles quotes, embedded commas and escaped quotes', () => {
  const rows = parseCsv('a,b\n"x,1","he said ""hi"""\n');
  assert.deepEqual(rows, [
    ['a', 'b'],
    ['x,1', 'he said "hi"'],
  ]);
});

check('tenure maths merges overlapping roles instead of double counting', () => {
  const overlapping = {
    id: 't', fullName: 'T', source: 'test', educations: [],
    experiences: [
      { title: 'A', company: 'X', startDate: '2018-01', endDate: '2022-01' },
      { title: 'B', company: 'Y', startDate: '2019-01', endDate: '2021-01' },
    ],
  };
  assert.equal(yearsOfExperience(overlapping), 4);
});

check('a current role (endDate null) counts up to today', () => {
  const year = new Date().getFullYear();
  const profile = {
    id: 't', fullName: 'T', source: 'test', educations: [],
    experiences: [{ title: 'A', company: 'X', startDate: `${year - 3}-01`, endDate: null }],
  };
  assert.ok(yearsOfExperience(profile) >= 2.9, 'expected ~3 years of current tenure');
});

check('rendered profiles carry the sourceRef labels the analyst prompt cites', () => {
  const text = renderProfile({
    id: 't', fullName: 'Test Person', source: 'test',
    experiences: [{ title: 'Marketing Manager', company: 'Acme', startDate: '2020-01', endDate: null }],
    educations: [{ school: 'UFPR', degree: 'BSc', fieldOfStudy: 'Marketing' }],
  });
  assert.ok(text.includes('experience[0] · Marketing Manager @ Acme'));
  assert.ok(text.includes('education[0]'));
  assert.ok(text.includes('present'), 'a current role should read as "present"');
});

const brief =
  'i need an experienced marketing manager in curitiba that has experience ' +
  'working with media buying and inside sales';
const criteria = heuristicCriteria(brief);

check('the keyword brief parser recovers role, place and skills', () => {
  assert.equal(criteria.location.city, 'Curitiba');
  assert.equal(criteria.location.country, 'Brazil');
  assert.ok(criteria.location.nearbyPlaces.includes('Pinhais'));
  assert.ok(criteria.localLanguageTitles.includes('Gerente de Marketing'));
  assert.ok(criteria.mustHave.some((c) => c.id === 'media_buying'));
  assert.ok(criteria.mustHave.some((c) => c.id === 'inside_sales'));
  assert.ok(criteria.minYearsExperience >= 5, '"experienced" should raise the bar');
});

const strongCandidate = {
  id: 'a', fullName: 'A', source: 'test',
  headline: 'Gerente de Marketing', location: 'Curitiba, Paraná, Brazil',
  experiences: [{
    title: 'Gerente de Marketing', company: 'X', startDate: '2016-01', endDate: null,
    description: 'Google Ads, Meta Ads e um time de SDRs em HubSpot com foco em pipeline.',
  }],
  educations: [],
};
const irrelevantCandidate = {
  id: 'b', fullName: 'B', source: 'test',
  headline: 'Chef de cuisine', location: 'Lyon, France',
  experiences: [{ title: 'Chef', company: 'Y', startDate: '2016-01', endDate: null }],
  educations: [],
};

check('the relevance gate separates plausible candidates from noise', () => {
  assert.ok(prefilterScore(strongCandidate, criteria) > prefilterScore(irrelevantCandidate, criteria));
  assert.equal(prefilterScore(irrelevantCandidate, criteria), 0);
});

check('the deterministic scorer ranks the relevant candidate far higher', () => {
  const strong = heuristicAssessment(strongCandidate, criteria);
  const weak = heuristicAssessment(irrelevantCandidate, criteria);
  assert.ok(strong.overallScore > weak.overallScore + 30);
  assert.equal(strong.scoredBy, 'heuristic');
  assert.equal(strong.criteriaEvidence.length, criteria.mustHave.length);
  assert.ok(strong.criteriaEvidence.every((e) => ['proven', 'likely', 'unclear', 'absent'].includes(e.status)));
});

check('every score stays inside 0-100', () => {
  for (const candidate of [strongCandidate, irrelevantCandidate]) {
    const { overallScore, confidence } = heuristicAssessment(candidate, criteria);
    assert.ok(overallScore >= 0 && overallScore <= 100);
    assert.ok(confidence >= 0 && confidence <= 100);
  }
});

console.log(`\n${passed} offline checks passed.`);
