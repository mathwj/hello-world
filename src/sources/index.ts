import { apifySource } from './apify.js';
import { csvSource } from './csv.js';
import { ninjapearSource } from './ninjapear.js';
import { proxycurlSource } from './proxycurl.js';
import { sampleSource } from './sample.js';
import type { SourceAdapter } from './types.js';
import { webSearchSource } from './websearch.js';

export const adapters: SourceAdapter[] = [
  sampleSource,
  apifySource,
  csvSource,
  ninjapearSource,
  webSearchSource,
  proxycurlSource,
];

export function getAdapter(id: string): SourceAdapter | undefined {
  return adapters.find((adapter) => adapter.id === id);
}

export function describeAdapters() {
  return adapters.map((adapter) => ({
    id: adapter.id,
    label: adapter.label,
    description: adapter.description,
    configured: adapter.isConfigured(),
    configHint: adapter.configHint,
  }));
}

export type { SourceAdapter, SourceContext } from './types.js';
