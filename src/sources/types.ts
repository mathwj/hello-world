import type { Profile, SearchCriteria } from '../types.js';

export interface SourceContext {
  criteria: SearchCriteria;
  /** Hard cap on how many profiles this adapter should return. */
  limit: number;
  /** Surface non-fatal problems (missing key, partial results) to the UI. */
  warn: (message: string) => void;
  /** Progress ping, e.g. after each backend query. */
  progress: (message: string) => void;
}

export interface SourceAdapter {
  id: string;
  label: string;
  /** Shown in the UI so the operator knows what a source needs. */
  description: string;
  /** False when a required key or import file is missing. */
  isConfigured(): boolean;
  /** Why it is unavailable, when `isConfigured()` is false. */
  configHint?: string;
  search(context: SourceContext): Promise<Profile[]>;
}
