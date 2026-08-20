import { csvSource } from './csv.js';
import { proxycurlSource } from './proxycurl.js';
import { sampleSource } from './sample.js';
import type { SourceAdapter } from './types.js';
import { webSearchSource } from './websearch.js';

export const adapters: SourceAdapter[] = [
  sampleSource,
  csvSource,
  proxycurlSource,
  webSearchSource,
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
