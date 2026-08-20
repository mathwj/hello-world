import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';
import { config } from './config.js';

let client: Anthropic | null = null;

/**
 * Lazily built so the app still boots (in heuristic-only mode) with no
 * credentials configured.
 */
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

export class LlmUnavailableError extends Error {}
export class LlmRefusalError extends Error {}

export function llmEnabled(): boolean {
  return config.anthropic.hasCredentials;
}

interface ParseOptions {
  system: string;
  user: string;
  effort: string;
  maxTokens?: number;
}

/**
 * One structured-output call. Returns the validated object, or throws so the
 * caller can fall back to the deterministic path.
 */
export async function parseStructured<T extends z.ZodTypeAny>(
  schema: T,
  { system, user, effort, maxTokens = 16000 }: ParseOptions,
): Promise<z.infer<T>> {
  if (!llmEnabled()) {
    throw new LlmUnavailableError('No Anthropic credentials configured');
  }

  const response = await getClient().messages.parse({
    model: config.anthropic.model,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: effort as 'low' | 'medium' | 'high' | 'xhigh' | 'max',
      format: zodOutputFormat(schema),
    },
    system,
    messages: [{ role: 'user', content: user }],
  });

  if (response.stop_reason === 'refusal') {
    throw new LlmRefusalError(
      response.stop_details?.explanation ?? 'The model declined this request.',
    );
  }

  const parsed = response.parsed_output;
  if (parsed == null) {
    throw new Error('Model response did not match the expected schema');
  }
  return parsed as z.infer<T>;
}

/** Bounded-concurrency map — keeps candidate analysis from stampeding the API. */
export async function mapWithConcurrency<In, Out>(
  items: In[],
  limit: number,
  worker: (item: In, index: number) => Promise<Out>,
): Promise<Out[]> {
  const results = new Array<Out>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index] as In, index);
    }
  });

  await Promise.all(runners);
  return results;
}
