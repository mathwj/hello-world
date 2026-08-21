import { z } from 'zod';
import { config } from './config.js';
import { LlmUnavailableError, llmEnabled, parseStructured } from './llm.js';
import { renderProfile, searchableText, yearsOfExperience } from './profile-text.js';
import type {
  CandidateAssessment,
  Criterion,
  CriterionEvidence,
  EvidenceStatus,
  Profile,
  SearchCriteria,
  Verdict,
} from './types.js';

const EvidenceSchema = z.object({
  criterionId: z.string(),
  label: z.string(),
  status: z.enum(['proven', 'likely', 'unclear', 'absent']),
  evidence: z
    .string()
    .describe('Quote or close paraphrase from the profile. Empty if absent.'),
  sourceRef: z
    .string()
    .describe('Where it came from, e.g. "experience[1] · Acme" or "skills".'),
});

const AssessmentSchema = z.object({
  overallScore: z.number().describe('0-100 fit against the brief'),
  verdict: z.enum(['strong_match', 'possible_match', 'stretch', 'not_a_match']),
  confidence: z.number().describe('0-100, lower when the profile is sparse'),
  titleFit: z.string(),
  locationFit: z.string(),
  yearsRelevantExperience: z.number(),
  seniorityFit: z.string(),
  careerTrajectory: z.string(),
  educationAnalysis: z.string(),
  criteriaEvidence: z.array(EvidenceSchema),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  redFlags: z.array(z.string()),
  whyTheyMakeSense: z.string(),
  outreachAngle: z.string(),
});

const SYSTEM = `You are a sourcing analyst. You read one candidate profile
against one hiring brief and produce a grounded assessment.

Hard rules:
- Ground every claim in the profile text. Quote or closely paraphrase, and put
  the section label (experience[2], education[0], skills, summary) in sourceRef.
- Never invent employers, dates, tools or achievements. If the profile does not
  say it, the status is "absent" or "unclear" — not "likely".
- "proven" means the profile states it. "likely" means the role strongly
  implies it (a Paid Media Manager almost certainly bought media) but does not
  say it. "unclear" means the wording is ambiguous. "absent" means no signal.
- Produce one criteriaEvidence entry for EVERY must-have and nice-to-have you
  are given, in the order given, even when the answer is "absent".
- yearsRelevantExperience counts time in roles relevant to the brief, not the
  candidate's whole career.
- Judge adjacent job titles on the work described, not the title string. A
  "Growth Manager" running acquisition may be a better marketing manager hire
  than someone with the exact title doing events.
- Weigh location honestly. Same city is best; nearby/metro area is fine;
  elsewhere with no relocation signal is a real gap. Say which applies.
- redFlags are things a recruiter should check: unexplained gaps, very short
  tenures in a row, a title that seems inflated for the described scope,
  a career direction pointing away from this role. An empty list is fine.
- whyTheyMakeSense is 2-3 sentences a recruiter can paste into a shortlist:
  what makes them fit, and the single biggest caveat.

Scoring guide:
  85-100 strong_match  — clears the must-haves with evidence, right level, right place.
  65-84  possible_match — most must-haves, one meaningful gap.
  40-64  stretch        — adjacent background, would need a leap or a rationale.
  0-39   not_a_match    — wrong function, wrong level, or wrong market.

A sparse profile is not a bad candidate — it is an unknown one. Score what the
evidence supports and drop confidence rather than inventing detail.`;

function criteriaBlock(criteria: SearchCriteria): string {
  const render = (list: Criterion[], kind: string) =>
    list.length === 0
      ? `${kind}: none specified`
      : `${kind}:\n` +
        list
          .map(
            (c) =>
              `  - [${c.id}] ${c.label} (weight ${c.weight})` +
              (c.evidenceHints.length ? `\n      look for: ${c.evidenceHints.join(', ')}` : ''),
          )
          .join('\n');

  const loc = criteria.location;
  return [
    `Brief: ${criteria.briefSummary}`,
    `Target titles: ${criteria.targetTitles.join(', ') || '—'}`,
    `Acceptable adjacent titles: ${criteria.adjacentTitles.join(', ') || '—'}`,
    `Local-language titles: ${criteria.localLanguageTitles.join(', ') || '—'}`,
    `Location: ${[loc.city, loc.region, loc.country].filter(Boolean).join(', ') || '—'}` +
      (loc.nearbyPlaces.length ? ` (also acceptable: ${loc.nearbyPlaces.join(', ')})` : '') +
      (loc.remoteAcceptable ? ' — remote acceptable' : ' — remote NOT stated as acceptable'),
    `Target seniority: ${criteria.targetSeniority.join(', ') || '—'}`,
    `Minimum years of experience: ${criteria.minYearsExperience}`,
    render(criteria.mustHave, 'MUST HAVE'),
    render(criteria.niceToHave, 'NICE TO HAVE'),
    criteria.industryPreferences.length
      ? `Industry preferences: ${criteria.industryPreferences.join(', ')}`
      : '',
    criteria.educationPreferences.length
      ? `Education preferences: ${criteria.educationPreferences.join(', ')}`
      : '',
    criteria.languages.length ? `Languages: ${criteria.languages.join(', ')}` : '',
    criteria.dealBreakers.length ? `Deal breakers: ${criteria.dealBreakers.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Full analysis of one profile. Falls back to the heuristic scorer on error. */
export async function assessProfile(
  profile: Profile,
  criteria: SearchCriteria,
  originalBrief: string,
): Promise<CandidateAssessment> {
  if (!llmEnabled()) return heuristicAssessment(profile, criteria);

  try {
    const parsed = await parseStructured(AssessmentSchema, {
      system: SYSTEM,
      user: [
        `RECRUITER'S ORIGINAL WORDS:\n"""\n${originalBrief.trim()}\n"""`,
        '',
        `STRUCTURED REQUIREMENTS:\n${criteriaBlock(criteria)}`,
        '',
        `CANDIDATE PROFILE (source: ${profile.source}):\n"""\n${renderProfile(profile)}\n"""`,
      ].join('\n'),
      effort: config.llm.analysisEffort,
      maxTokens: 8000,
    });

    return {
      ...(parsed as Omit<CandidateAssessment, 'scoredBy'>),
      overallScore: clamp(parsed.overallScore),
      confidence: clamp(parsed.confidence),
      scoredBy: 'model',
    };
  } catch (error) {
    if (!(error instanceof LlmUnavailableError)) {
      const assessment = heuristicAssessment(profile, criteria);
      assessment.redFlags = [
        ...assessment.redFlags,
        `Model analysis failed (${(error as Error).message}); this is a keyword-only score.`,
      ];
      return assessment;
    }
    return heuristicAssessment(profile, criteria);
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

// --- Deterministic scorer --------------------------------------------------

function hintHits(text: string, hints: string[]): string[] {
  return hints.filter((hint) => hint.length > 2 && text.includes(hint.toLowerCase()));
}

/** Cheap relevance gate: is this profile worth spending an analysis call on? */
export function prefilterScore(profile: Profile, criteria: SearchCriteria): number {
  const text = searchableText(profile);
  const titles = [
    ...criteria.targetTitles,
    ...criteria.adjacentTitles,
    ...criteria.localLanguageTitles,
  ];

  let score = 0;
  if (titles.some((title) => text.includes(title.toLowerCase()))) score += 50;
  if (locationScore(profile, criteria) >= 0.6) score += 25;

  const hints = criteria.mustHave.flatMap((c) => c.evidenceHints);
  score += Math.min(25, hintHits(text, hints).length * 5);
  return score;
}

function locationScore(profile: Profile, criteria: SearchCriteria): number {
  const place = `${profile.location ?? ''} ${profile.country ?? ''}`.toLowerCase();
  if (!place.trim()) return 0.3;

  const { city, region, country, nearbyPlaces, remoteAcceptable } = criteria.location;
  if (city && place.includes(city.toLowerCase())) return 1;
  if (nearbyPlaces.some((near) => place.includes(near.toLowerCase()))) return 0.85;
  if (region && place.includes(region.toLowerCase())) return 0.7;
  if (remoteAcceptable) return 0.6;
  if (country && place.includes(country.toLowerCase())) return 0.35;
  return 0.1;
}

/**
 * Transparent keyword scorer used when no model is available, and as the
 * safety net when an analysis call fails. It is intentionally simple: it can
 * rank, but it cannot reason about adjacency the way the model pass does.
 */
export function heuristicAssessment(
  profile: Profile,
  criteria: SearchCriteria,
): CandidateAssessment {
  const text = searchableText(profile);
  const years = yearsOfExperience(profile);

  const allCriteria = [...criteria.mustHave, ...criteria.niceToHave];
  const evidence: CriterionEvidence[] = allCriteria.map((criterion) => {
    const hits = hintHits(text, criterion.evidenceHints);
    const status: EvidenceStatus = hits.length >= 2 ? 'proven' : hits.length === 1 ? 'likely' : 'absent';
    return {
      criterionId: criterion.id,
      label: criterion.label,
      status,
      evidence: hits.length ? `Profile mentions: ${hits.slice(0, 6).join(', ')}` : '',
      sourceRef: hits.length ? 'keyword match across profile' : '—',
    };
  });

  const mustWeight = criteria.mustHave.reduce((sum, c) => sum + c.weight, 0) || 1;
  const skillScore =
    criteria.mustHave.reduce((sum, criterion) => {
      const found = evidence.find((e) => e.criterionId === criterion.id);
      const factor = found?.status === 'proven' ? 1 : found?.status === 'likely' ? 0.5 : 0;
      return sum + criterion.weight * factor;
    }, 0) / mustWeight;

  const titles = [
    ...criteria.targetTitles,
    ...criteria.adjacentTitles,
    ...criteria.localLanguageTitles,
  ];
  const matchedTitle = titles.find((title) => text.includes(title.toLowerCase()));
  const titleFactor = matchedTitle ? 1 : 0.35;
  const place = locationScore(profile, criteria);
  const seniorityFactor =
    criteria.minYearsExperience === 0
      ? 1
      : Math.min(1, years / Math.max(1, criteria.minYearsExperience));

  const overallScore = clamp(
    100 * (0.4 * skillScore + 0.25 * titleFactor + 0.2 * place + 0.15 * seniorityFactor),
  );

  const verdict: Verdict =
    overallScore >= 85
      ? 'strong_match'
      : overallScore >= 65
        ? 'possible_match'
        : overallScore >= 40
          ? 'stretch'
          : 'not_a_match';

  const proven = evidence.filter((e) => e.status === 'proven').map((e) => e.label);
  const missing = evidence.filter((e) => e.status === 'absent').map((e) => e.label);

  return {
    overallScore,
    verdict,
    confidence: profile.experiences.length > 0 ? 45 : 20,
    titleFit: matchedTitle
      ? `Profile text matches the target title "${matchedTitle}".`
      : 'No target or adjacent title matched by keyword.',
    locationFit:
      place >= 0.85
        ? `Located in or next to ${criteria.location.city || 'the target area'}.`
        : place >= 0.6
          ? 'In the wider target region, or remote is acceptable.'
          : 'Outside the target area on the evidence available.',
    yearsRelevantExperience: years,
    seniorityFit: `~${years} years of history against a ${criteria.minYearsExperience}-year bar.`,
    careerTrajectory: 'Not assessed — keyword scoring only.',
    educationAnalysis: profile.educations.length
      ? profile.educations
          .map((edu) => [edu.degree, edu.fieldOfStudy, edu.school].filter(Boolean).join(' · '))
          .join('; ')
      : 'No education listed.',
    criteriaEvidence: evidence,
    strengths: proven.length ? proven.map((label) => `Evidence found for ${label}`) : [],
    gaps: missing.map((label) => `No keyword evidence for ${label}`),
    redFlags: [],
    whyTheyMakeSense: proven.length
      ? `Keyword match on ${proven.join(', ')}${matchedTitle ? `, with a matching title (${matchedTitle})` : ''}. ` +
        'Scored without model analysis — read the profile before acting on this.'
      : 'No strong keyword evidence against the must-haves.',
    outreachAngle: 'Not generated — keyword scoring only.',
    scoredBy: 'heuristic',
  };
}
