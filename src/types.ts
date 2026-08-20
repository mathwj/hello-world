/**
 * Domain types shared by the sourcing pipeline, the profile adapters and the
 * HTTP layer.
 *
 * The shape of `Profile` is deliberately close to what a public professional
 * profile looks like, so every adapter (sample data, CSV import, licensed
 * provider APIs) can normalise into the same structure and the analysis stage
 * stays source-agnostic.
 */

export type Seniority =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'head'
  | 'director'
  | 'vp'
  | 'c_level';

export interface ExperienceEntry {
  title: string;
  company: string;
  companyIndustry?: string;
  companySize?: string;
  location?: string;
  /** ISO-ish `YYYY-MM` or `YYYY`. */
  startDate?: string;
  /** Omitted or null when the role is current. */
  endDate?: string | null;
  description?: string;
}

export interface EducationEntry {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
}

export interface CertificationEntry {
  name: string;
  issuer?: string;
  year?: number;
}

export interface Profile {
  /** Stable identity across adapters — usually the public profile URL. */
  id: string;
  fullName: string;
  headline?: string;
  location?: string;
  country?: string;
  profileUrl?: string;
  summary?: string;
  experiences: ExperienceEntry[];
  educations: EducationEntry[];
  certifications?: CertificationEntry[];
  skills?: string[];
  languages?: string[];
  /** Free-form extras an adapter wants the analyst stage to see. */
  extras?: Record<string, string>;
  /** Which adapter produced this record, for provenance in the UI. */
  source: string;
  /** True for the bundled fictional demo dataset. Never a real person. */
  synthetic?: boolean;
  /** When the underlying record was captured, if the adapter knows. */
  retrievedAt?: string;
}

/** A weighted requirement extracted from the recruiter's free-text brief. */
export interface Criterion {
  id: string;
  label: string;
  /** Relative importance, 1-100. Normalised at scoring time. */
  weight: number;
  /** Words/phrases (incl. local-language variants) that evidence this skill. */
  evidenceHints: string[];
}

export interface LocationCriteria {
  city?: string;
  region?: string;
  country?: string;
  /** Nearby places that should still count as "in the area". */
  nearbyPlaces: string[];
  remoteAcceptable: boolean;
}

export interface SearchCriteria {
  /** One-line restatement of the brief, used as the run's title. */
  briefSummary: string;
  /** Titles that match the request head-on. */
  targetTitles: string[];
  /** "Very similar functions" — adjacent titles worth pulling in. */
  adjacentTitles: string[];
  /** Local-language / regional spellings of the above. */
  localLanguageTitles: string[];
  location: LocationCriteria;
  targetSeniority: Seniority[];
  minYearsExperience: number;
  mustHave: Criterion[];
  niceToHave: Criterion[];
  industryPreferences: string[];
  educationPreferences: string[];
  languages: string[];
  dealBreakers: string[];
  /** Boolean-ish query strings the adapters can feed to their backends. */
  sourcingQueries: string[];
}

export type Verdict = 'strong_match' | 'possible_match' | 'stretch' | 'not_a_match';

export type EvidenceStatus = 'proven' | 'likely' | 'unclear' | 'absent';

export interface CriterionEvidence {
  criterionId: string;
  label: string;
  status: EvidenceStatus;
  /** Quoted or closely paraphrased text from the profile. */
  evidence: string;
  /** Where in the profile it came from, e.g. "experience[1] · Acme". */
  sourceRef: string;
}

export interface CandidateAssessment {
  overallScore: number;
  verdict: Verdict;
  /** 0-100 self-reported confidence given how complete the profile is. */
  confidence: number;
  titleFit: string;
  locationFit: string;
  yearsRelevantExperience: number;
  seniorityFit: string;
  careerTrajectory: string;
  educationAnalysis: string;
  criteriaEvidence: CriterionEvidence[];
  strengths: string[];
  gaps: string[];
  redFlags: string[];
  /** The headline answer to "why do they make sense?". */
  whyTheyMakeSense: string;
  outreachAngle: string;
  /** Set when the deterministic scorer ran instead of the model. */
  scoredBy: 'model' | 'heuristic';
}

export interface Candidate {
  profile: Profile;
  assessment: CandidateAssessment;
}

export interface SearchRunOptions {
  /** Adapter ids to source from, e.g. ['sample'] or ['csv','proxycurl']. */
  sources: string[];
  /** Upper bound on profiles pulled before analysis. */
  maxProfiles: number;
  /** Drop candidates scoring below this from the returned shortlist. */
  minScore: number;
}

export interface SearchRunResult {
  runId: string;
  brief: string;
  criteria: SearchCriteria;
  candidates: Candidate[];
  stats: {
    profilesSourced: number;
    profilesAnalysed: number;
    shortlisted: number;
    sourcesUsed: string[];
    durationMs: number;
  };
  warnings: string[];
}

/** Progress events pushed to the browser over SSE while a run is in flight. */
export type RunEvent =
  | { type: 'stage'; stage: string; message: string }
  | { type: 'criteria'; criteria: SearchCriteria }
  | { type: 'sourced'; count: number; source: string }
  | { type: 'analysed'; done: number; total: number; name: string }
  | { type: 'candidate'; candidate: Candidate }
  | { type: 'warning'; message: string }
  | { type: 'done'; result: SearchRunResult }
  | { type: 'error'; message: string };
