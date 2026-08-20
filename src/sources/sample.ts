import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Profile } from '../types.js';
import type { SourceAdapter, SourceContext } from './types.js';

const here = path.dirname(fileURLToPath(import.meta.url));

let cache: Profile[] | null = null;

async function load(): Promise<Profile[]> {
  if (cache) return cache;
  const raw = await readFile(path.join(here, '..', 'data', 'sample-profiles.json'), 'utf8');
  cache = (JSON.parse(raw) as Profile[]).map((profile) => ({
    ...profile,
    source: 'sample',
    synthetic: true,
  }));
  return cache;
}

/**
 * The offline demo corpus. Every record is fictional — invented people at
 * invented companies — so the pipeline can be exercised end to end without
 * touching anyone's real data.
 */
export const sampleSource: SourceAdapter = {
  id: 'sample',
  label: 'Sample dataset (offline demo)',
  description:
    'Bundled fictional profiles. No network calls, no real people. Use this ' +
    'to try the pipeline or to develop against a stable corpus.',
  isConfigured: () => true,
  async search({ limit, progress }: SourceContext): Promise<Profile[]> {
    const profiles = await load();
    progress(`Loaded ${profiles.length} demo profiles`);
    return profiles.slice(0, limit);
  },
};
