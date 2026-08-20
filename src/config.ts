import 'dotenv/config';

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: int(process.env.PORT, 3000),

  anthropic: {
    /** The SDK also resolves ANTHROPIC_AUTH_TOKEN / `ant auth login` profiles. */
    hasCredentials: Boolean(
      process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN,
    ),
    model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-5',
    /** The brief is parsed once per run, so it can afford to think hard. */
    criteriaEffort: process.env.CRITERIA_EFFORT ?? 'high',
    /** Runs once per candidate — medium keeps a 50-profile sweep affordable. */
    analysisEffort: process.env.ANALYSIS_EFFORT ?? 'medium',
    /** Parallel candidate analyses in flight. */
    concurrency: int(process.env.ANALYSIS_CONCURRENCY, 6),
  },

  sources: {
    /** Adapters enabled by default when the request doesn't name any. */
    default: (process.env.DEFAULT_SOURCES ?? 'sample')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    /** Directory scanned by the CSV/JSON import adapter. */
    importDir: process.env.IMPORT_DIR ?? 'data/imports',
    proxycurlApiKey: process.env.PROXYCURL_API_KEY ?? '',
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
