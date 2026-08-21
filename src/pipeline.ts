import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { buildCriteria } from './criteria.js';
import { mapWithConcurrency } from './llm.js';
import { assessProfile, prefilterScore } from './scoring.js';
import { getAdapter } from './sources/index.js';
import type {
  Candidate,
  Profile,
  RunEvent,
  SearchRunOptions,
  SearchRunResult,
} from './types.js';

type Emit = (event: RunEvent) => void;

/**
 * Runs the whole sweep: brief → criteria → sourcing → dedupe → pre-filter →
 * per-candidate analysis → ranked shortlist. Progress is pushed through
 * `emit` so the browser can render the run as it happens.
 */
export async function runSearch(
  brief: string,
  options: SearchRunOptions,
  emit: Emit,
): Promise<SearchRunResult> {
  const startedAt = Date.now();
  const runId = randomUUID();
  const warnings: string[] = [];
  const warn = (message: string) => {
    warnings.push(message);
    emit({ type: 'warning', message });
  };

  const maxProfiles = Math.min(
    Math.max(1, options.maxProfiles || config.limits.maxProfiles),
    config.limits.hardMaxProfiles,
  );

  // 1. Understand the brief.
  emit({ type: 'stage', stage: 'criteria', message: 'Reading the brief and expanding the role…' });
  const { criteria, warnings: criteriaWarnings } = await buildCriteria(brief);
  criteriaWarnings.forEach(warn);
  emit({ type: 'criteria', criteria });

  // 2. Source candidates from every enabled adapter.
  emit({ type: 'stage', stage: 'sourcing', message: 'Sourcing profiles…' });
  const byId = new Map<string, Profile>();
  const sourcesUsed: string[] = [];

  for (const sourceId of options.sources) {
    const adapter = getAdapter(sourceId);
    if (!adapter) {
      warn(`Unknown source "${sourceId}" — skipped.`);
      continue;
    }
    if (!adapter.isConfigured()) {
      warn(`${adapter.label} is not configured. ${adapter.configHint ?? ''}`.trim());
      continue;
    }

    try {
      const profiles = await adapter.search({
        criteria,
        limit: maxProfiles,
        warn,
        progress: (message) => emit({ type: 'stage', stage: 'sourcing', message }),
      });

      let added = 0;
      for (const profile of profiles) {
        const key = (profile.profileUrl ?? profile.id).toLowerCase();
        const existing = byId.get(key);
        if (existing) {
          // Prefer the richer record when two adapters return the same person.
          if (profile.experiences.length > existing.experiences.length) byId.set(key, profile);
          continue;
        }
        byId.set(key, profile);
        added++;
      }

      sourcesUsed.push(adapter.id);
      emit({ type: 'sourced', count: added, source: adapter.label });
    } catch (error) {
      warn(`${adapter.label} failed: ${(error as Error).message}`);
    }
  }

  const sourced = [...byId.values()];
  if (sourced.length === 0) {
    warn('No profiles were sourced. Check that at least one source is configured.');
  }

  // 3. Cheap relevance gate so analysis budget goes to plausible people.
  //    The bar is low on purpose — adjacency is the model's call, not the
  //    keyword matcher's.
  const ranked = sourced
    .map((profile) => ({ profile, pre: prefilterScore(profile, criteria) }))
    .sort((a, b) => b.pre - a.pre);

  const toAnalyse = ranked.filter((entry) => entry.pre > 0).slice(0, maxProfiles);
  const skipped = sourced.length - toAnalyse.length;
  if (skipped > 0) {
    warn(
      `${skipped} sourced profile(s) had no keyword overlap with the brief and were not analysed.`,
    );
  }

  // 4. Analyse each remaining profile against the criteria.
  emit({
    type: 'stage',
    stage: 'analysis',
    message: `Analysing ${toAnalyse.length} profile(s) in depth…`,
  });

  let done = 0;
  const candidates = await mapWithConcurrency(
    toAnalyse,
    config.llm.concurrency,
    async ({ profile }): Promise<Candidate> => {
      const assessment = await assessProfile(profile, criteria, brief);
      done++;
      emit({ type: 'analysed', done, total: toAnalyse.length, name: profile.fullName });
      const candidate: Candidate = { profile, assessment };
      if (assessment.overallScore >= options.minScore) {
        emit({ type: 'candidate', candidate });
      }
      return candidate;
    },
  );

  // 5. Rank and cut.
  const shortlist = candidates
    .filter((candidate) => candidate.assessment.overallScore >= options.minScore)
    .sort((a, b) => {
      const byScore = b.assessment.overallScore - a.assessment.overallScore;
      return byScore !== 0 ? byScore : b.assessment.confidence - a.assessment.confidence;
    });

  const result: SearchRunResult = {
    runId,
    brief,
    criteria,
    candidates: shortlist,
    stats: {
      profilesSourced: sourced.length,
      profilesAnalysed: toAnalyse.length,
      shortlisted: shortlist.length,
      sourcesUsed,
      durationMs: Date.now() - startedAt,
    },
    warnings,
  };

  emit({ type: 'done', result });
  return result;
}
