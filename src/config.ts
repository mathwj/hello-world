import 'dotenv/config';

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

type Provider = 'openai' | 'anthropic' | 'none';

/**
 * Which model provider to use. `LLM_PROVIDER` wins if set; otherwise whichever
 * key is present, preferring OpenAI. With neither, the app runs in
 * keyword-only mode rather than refusing to start.
 */
function resolveLlm() {
  const openaiApiKey = process.env.OPENAI_API_KEY ?? '';
  // The Anthropic SDK also resolves ANTHROPIC_AUTH_TOKEN / `ant auth login`.
  const hasAnthropic = Boolean(
    process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN,
  );

  const requested = process.env.LLM_PROVIDER?.toLowerCase();
  const provider: Provider =
    requested === 'openai' || requested === 'anthropic'
      ? requested
      : openaiApiKey
        ? 'openai'
        : hasAnthropic
          ? 'anthropic'
          : 'none';

  const model =
    provider === 'anthropic'
      ? (process.env.ANTHROPIC_MODEL ?? 'claude-opus-5')
      : (process.env.OPENAI_MODEL ?? 'gpt-5.5');

  return {
    provider,
    model,
    openaiApiKey,
    /** The brief is parsed once per run, so it can afford to think hard. */
    criteriaEffort: process.env.CRITERIA_EFFORT ?? 'high',
    /** Runs once per candidate — medium keeps a 50-profile sweep affordable. */
    analysisEffort: process.env.ANALYSIS_EFFORT ?? 'medium',
    /** Parallel candidate analyses in flight. */
    concurrency: int(process.env.ANALYSIS_CONCURRENCY, 6),
  } as const;
}

export const config = {
  port: int(process.env.PORT, 3000),

  llm: resolveLlm(),

  sources: {
    /** Adapters enabled by default when the request doesn't name any. */
    default: (process.env.DEFAULT_SOURCES ?? 'sample')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    /** Directory scanned by the CSV/JSON import adapter. */
    importDir: process.env.IMPORT_DIR ?? 'data/imports',
    proxycurlApiKey: process.env.PROXYCURL_API_KEY ?? '',
    /** Escape hatch for anyone with legacy access to the retired service. */
    proxycurlAllowLegacy: bool(process.env.PROXYCURL_ALLOW_LEGACY, false),

    ninjapearApiKey: process.env.NINJAPEAR_API_KEY ?? '',
    ninjapearBaseUrl: process.env.NINJAPEAR_BASE_URL ?? 'https://nubela.co',
    /** Its search is keyed on company website, so a target list is required. */
    ninjapearCompanies: (process.env.NINJAPEAR_COMPANIES ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    ninjapearCompanyFile: process.env.NINJAPEAR_COMPANY_FILE ?? 'data/companies.txt',
    /** Role variants tried per company — the fan-out is companies × roles. */
    ninjapearMaxRoles: int(process.env.NINJAPEAR_MAX_ROLES, 4),
    /** Hard stop on estimated credit spend for a single run. */
    ninjapearMaxCredits: int(process.env.NINJAPEAR_MAX_CREDITS, 200),
    /** Spend 3 credits per person for full work history. Off = names only. */
    ninjapearEnrich: bool(process.env.NINJAPEAR_ENRICH, true),
    proxycurlBaseUrl:
      process.env.PROXYCURL_BASE_URL ?? 'https://nubela.co/proxycurl/api',
    serpApiKey: process.env.SERPAPI_API_KEY ?? '',
    /** Politeness delay between outbound provider calls, in ms. */
    requestDelayMs: int(process.env.SOURCE_REQUEST_DELAY_MS, 250),
  },

  limits: {
    maxProfiles: int(process.env.MAX_PROFILES, 60),
    /** Guardrail: refuse absurd fan-out even if the client asks for it. */
    hardMaxProfiles: int(process.env.HARD_MAX_PROFILES, 200),
  },

  /** Show the "demo data" banner unless explicitly turned off. */
  showSyntheticBanner: bool(process.env.SHOW_SYNTHETIC_BANNER, true),
} as const;
