import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { config } from './config.js';
import { llmEnabled } from './llm.js';
import { runSearch } from './pipeline.js';
import { describeAdapters } from './sources/index.js';
import type { RunEvent, SearchRunResult } from './types.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(here, '..', 'public')));

/** Completed runs, kept in memory so the UI can export them afterwards. */
const runs = new Map<string, SearchRunResult>();
const MAX_RUNS_KEPT = 50;

app.get('/api/config', (_req, res) => {
  res.json({
    sources: describeAdapters(),
    defaultSources: config.sources.default,
    analysisMode: llmEnabled() ? 'model' : 'heuristic',
    model: config.anthropic.model,
    maxProfiles: config.limits.maxProfiles,
    showSyntheticBanner: config.showSyntheticBanner,
  });
});

/**
 * Streams a run over SSE. The brief and options ride in the query string so an
 * `EventSource` can open it directly — briefs are short, and this keeps the
 * client to a single connection with no job-handle bookkeeping.
 */
app.get('/api/search/stream', async (req: Request, res: Response) => {
  const brief = String(req.query.brief ?? '').trim();
  if (!brief) {
    res.status(400).json({ error: 'A brief is required.' });
    return;
  }

  const sources = String(req.query.sources ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let closed = false;
  req.on('close', () => {
    closed = true;
  });

  const emit = (event: RunEvent) => {
    if (closed) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Comment frames keep proxies from idling the connection out during long
  // analysis stages.
  const heartbeat = setInterval(() => {
    if (!closed) res.write(': ping\n\n');
  }, 15000);

  try {
    const result = await runSearch(
      brief,
      {
        sources: sources.length > 0 ? sources : [...config.sources.default],
        maxProfiles: Number.parseInt(String(req.query.maxProfiles ?? ''), 10) || config.limits.maxProfiles,
        minScore: Number.parseInt(String(req.query.minScore ?? ''), 10) || 0,
      },
      emit,
    );

    runs.set(result.runId, result);
    if (runs.size > MAX_RUNS_KEPT) {
      const oldest = runs.keys().next().value;
      if (oldest) runs.delete(oldest);
    }
  } catch (error) {
    console.error('Search run failed:', error);
    emit({ type: 'error', message: (error as Error).message });
  } finally {
    clearInterval(heartbeat);
    if (!closed) res.end();
  }
});

app.get('/api/runs/:runId', (req, res) => {
  const result = runs.get(req.params.runId);
  if (!result) {
    res.status(404).json({ error: 'Run not found (results are kept in memory only).' });
    return;
  }
  res.json(result);
});

app.get('/api/runs/:runId/export.csv', (req, res) => {
  const result = runs.get(req.params.runId);
  if (!result) {
    res.status(404).json({ error: 'Run not found.' });
    return;
  }

  const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = [
    'name', 'score', 'verdict', 'confidence', 'headline', 'location',
    'years_relevant', 'profile_url', 'source', 'why_they_make_sense',
    'strengths', 'gaps', 'red_flags', 'evidence',
  ];

  const rows = result.candidates.map((candidate) => {
    const { profile, assessment } = candidate;
    return [
      profile.fullName,
      assessment.overallScore,
      assessment.verdict,
      assessment.confidence,
      profile.headline ?? '',
      profile.location ?? '',
      assessment.yearsRelevantExperience,
      profile.profileUrl ?? '',
      profile.source,
      assessment.whyTheyMakeSense,
      assessment.strengths.join(' | '),
      assessment.gaps.join(' | '),
      assessment.redFlags.join(' | '),
      assessment.criteriaEvidence
        .map((e) => `${e.label}: ${e.status}${e.evidence ? ` — ${e.evidence}` : ''}`)
        .join(' | '),
    ].map(cell).join(',');
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="shortlist-${result.runId}.csv"`);
  res.send([header.map(cell).join(','), ...rows].join('\n'));
});

app.listen(config.port, () => {
  console.log(`Sourcing copilot listening on http://localhost:${config.port}`);
  console.log(
    `Analysis mode: ${llmEnabled() ? `model (${config.anthropic.model})` : 'heuristic (no ANTHROPIC_API_KEY set)'}`,
  );
});
