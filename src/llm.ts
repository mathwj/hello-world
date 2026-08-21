import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { z } from 'zod';
import { config } from './config.js';

/**
 * Single chokepoint for every model call in the app. Both providers are
 * driven through their native structured-output API, so the pipeline gets a
 * validated object back either way and never has to parse loose JSON.
 */

let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

// Built lazily so the app still boots (in keyword-only mode) with no keys set.
function getOpenAI(): OpenAI {
  openaiClient ??= new OpenAI({ apiKey: config.llm.openaiApiKey });
  return openaiClient;
}

function getAnthropic(): Anthropic {
  anthropicClient ??= new Anthropic();
  return anthropicClient;
}

export class LlmUnavailableError extends Error {}
export class LlmRefusalError extends Error {}

export function llmEnabled(): boolean {
  return config.llm.provider !== 'none';
}

/**
 * `reasoning` is rejected by non-reasoning OpenAI models, so only send it for
 * the families that accept it.
 */
function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o1|o3|o4|codex)/.test(model);
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
  switch (config.llm.provider) {
    case 'openai':
      return parseWithOpenAI(schema, { system, user, effort, maxTokens });
    case 'anthropic':
      return parseWithAnthropic(schema, { system, user, effort, maxTokens });
    default:
      throw new LlmUnavailableError('No model credentials configured');
  }
}

async function parseWithOpenAI<T extends z.ZodTypeAny>(
  schema: T,
  { system, user, effort, maxTokens }: Required<ParseOptions>,
): Promise<z.infer<T>> {
  const model = config.llm.model;

  const response = await getOpenAI().responses.parse({
    model,
    instructions: system,
    input: user,
    max_output_tokens: maxTokens,
    ...(isReasoningModel(model)
      ? { reasoning: { effort: effort as 'low' | 'medium' | 'high' } }
      : {}),
    text: { format: zodTextFormat(schema, 'result') },
  });

  for (const item of response.output) {
    if (!('content' in item) || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part.type === 'refusal') {
        throw new LlmRefusalError(part.refusal || 'The model declined this request.');
      }
    }
  }

  const parsed = response.output_parsed;
  if (parsed == null) {
    // Most often the output cap was hit before the JSON closed.
    throw new Error(
      `Model returned no parseable output (status: ${response.status}` +
        `${response.incomplete_details?.reason ? `, ${response.incomplete_details.reason}` : ''})`,
    );
  }
  return parsed as z.infer<T>;
}

async function parseWithAnthropic<T extends z.ZodTypeAny>(
  schema: T,
  { system, user, effort, maxTokens }: Required<ParseOptions>,
): Promise<z.infer<T>> {
  const response = await getAnthropic().messages.parse({
    model: config.llm.model,
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
