import { readFile } from 'node:fs/promises';
import { config } from '../config.js';
import type { EducationEntry, ExperienceEntry, Profile, SearchCriteria } from '../types.js';
import type { SourceAdapter, SourceContext } from './types.js';

/**
 * Adapter for NinjaPear (nubela.co), the successor to the retired Proxycurl.
 *
 * The important structural difference: NinjaPear has no "find people by title
 * and city" endpoint. Employee Search is keyed on `company_website`, so
 * sourcing is account-based — you supply the target companies, and it finds
 * the matching people inside each one. That is why this adapter needs a
 * company list and the other adapters do not.
 *
 * Two calls per candidate, both billed:
 *   1. /api/v1/employee/search   → 2 credits + 1 per employee returned
 *   2. /api/v2/employee/profile  → 3 credits, charged even on a miss
 *
 * Because the fan-out is companies × roles, spend climbs fast. Every call goes
 * through a credit ledger that stops the run at `NINJAPEAR_MAX_CREDITS`
 * rather than draining the account.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Tracks estimated spend and refuses to start a call that would exceed the cap. */
class CreditLedger {
  private spent = 0;

  constructor(
    private readonly cap: number,
    private readonly onSpend: (spent: number, cap: number) => void,
  ) {}

  canAfford(cost: number): boolean {
    return this.spent + cost <= this.cap;
  }

  charge(cost: number): void {
    this.spent += cost;
    this.onSpend(this.spent, this.cap);
  }

  get total(): number {
    return this.spent;
  }
}

interface SearchHit {
  first_name?: string;
  last_name?: string;
  role?: string;
  company_website?: string;
}

async function callApi(
  pathname: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const url = new URL(pathname, config.sources.ninjapearBaseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.sources.ninjapearApiKey}` },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `NinjaPear ${pathname} → ${response.status} ${response.statusText} ${body.slice(0, 200)}`,
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

/** `2019-07` / `2019` → the pieces the pipeline stores. */
function yearOf(date: unknown): number | undefined {
  const match = /^(\d{4})/.exec(String(date ?? ''));
  return match ? Number(match[1]) : undefined;
}

function toExperience(raw: Record<string, unknown>): ExperienceEntry {
  const end = raw.end_date;
  return {
    title: String(raw.role ?? 'Unknown role'),
    company: String(raw.company_name ?? 'Unknown company'),
    location: (raw.location as string) ?? undefined,
    startDate: (raw.start_date as string) ?? undefined,
    // A missing or null end date means the role is current.
    endDate: end ? String(end) : null,
    description: (raw.description as string) ?? undefined,
  };
}

function toEducation(raw: Record<string, unknown>): EducationEntry {
  return {
    school: String(raw.school ?? 'Unknown school'),
    fieldOfStudy: (raw.major as string) ?? undefined,
    startYear: yearOf(raw.start_date),
    endYear: yearOf(raw.end_date),
  };
}

/** Field mapping is tolerant: unrecognised keys are dropped, not fatal. */
export function normaliseNinjaPearProfile(
  raw: Record<string, unknown>,
  fallback: SearchHit,
): Profile {
  const fullName =
    (raw.full_name as string) ??
    [raw.first_name ?? fallback.first_name, raw.last_name ?? fallback.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

  const place = [raw.city, raw.state, raw.country]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(', ');

  const experiences = ((raw.work_experience as Record<string, unknown>[]) ?? []).map(toExperience);

  return {
    id: String(raw.id ?? raw.slug ?? `${fullName}@${fallback.company_website ?? ''}`),
    fullName: fullName || 'Unknown',
    headline: (raw.headline as string) ?? fallback.role ?? experiences[0]?.title,
    location: place || undefined,
    country: (raw.country as string) ?? undefined,
    profileUrl: (raw.socmed_url as string) ?? (raw.personal_website as string) ?? undefined,
    summary: (raw.bio as string) ?? undefined,
    experiences,
    educations: ((raw.education as Record<string, unknown>[]) ?? []).map(toEducation),
    skills: (raw.skills as string[]) ?? [],
    languages: (raw.languages as string[]) ?? [],
    source: 'ninjapear',
    retrievedAt: new Date().toISOString(),
  };
}

/** Company list from NINJAPEAR_COMPANIES, else data/companies.txt. */
async function loadCompanies(warn: (message: string) => void): Promise<string[]> {
  const inline = config.sources.ninjapearCompanies;
  if (inline.length > 0) return inline;

  try {
    const raw = await readFile(config.sources.ninjapearCompanyFile, 'utf8');
    return raw
      .split('\n')
      .map((line) => line.replace(/#.*$/, '').trim())
      .filter(Boolean);
  } catch {
    warn(
      `NinjaPear needs a list of target companies — its search is keyed on ` +
        `company_website, not on city. Add NINJAPEAR_COMPANIES=acme.com,foo.com ` +
        `to .env, or one company per line in ${config.sources.ninjapearCompanyFile}.`,
    );
    return [];
  }
}

const looksLikeDomain = (value: string) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);

/** Resolve a company name to its canonical website (1 credit) if needed. */
async function resolveWebsite(
  entry: string,
  criteria: SearchCriteria,
  ledger: CreditLedger,
  warn: (message: string) => void,
): Promise<string | null> {
  if (looksLikeDomain(entry)) return entry;
  if (!ledger.canAfford(1)) return null;

  try {
    const result = await callApi('/api/v1/company/website', {
      company_name: entry,
      country_code: countryCode(criteria.location.country),
    });
    ledger.charge(1);
    const website = result.website as string | undefined;
    if (!website) warn(`Could not resolve a website for "${entry}" — skipped.`);
    return website ?? null;
  } catch (error) {
    warn(`Website lookup for "${entry}" failed: ${(error as Error).message}`);
    return null;
  }
}

export const ninjapearSource: SourceAdapter = {
  id: 'ninjapear',
  label: 'NinjaPear (account-based)',
  description:
    'Searches named companies for people in a given role, then enriches each ' +
    'hit into a full profile. Its search is keyed on company website rather ' +
    'than city, so it needs a target company list. Billed per credit.',
  isConfigured: () => Boolean(config.sources.ninjapearApiKey),
  configHint: 'Set NINJAPEAR_API_KEY in .env, plus a company list',

  async search({ criteria, limit, warn, progress }: SourceContext): Promise<Profile[]> {
    const companies = await loadCompanies(warn);
    if (companies.length === 0) return [];

    const roles = [
      ...criteria.targetTitles,
      ...criteria.adjacentTitles,
      ...criteria.localLanguageTitles,
    ].slice(0, config.sources.ninjapearMaxRoles);

    if (roles.length === 0) return [];

    const ledger = new CreditLedger(config.sources.ninjapearMaxCredits, (spent, cap) => {
      progress(`NinjaPear credits used: ~${spent}/${cap}`);
    });

    progress(
      `NinjaPear: ${companies.length} companies × ${roles.length} roles ` +
        `(cap ~${config.sources.ninjapearMaxCredits} credits)`,
    );

    // Stage 1 — search each company for each role variant.
    const hits = new Map<string, SearchHit>();
    let budgetHit = false;

    outer: for (const entry of companies) {
      const website = await resolveWebsite(entry, criteria, ledger, warn);
      if (!website) continue;

      for (const role of roles) {
        if (!ledger.canAfford(3)) {
          budgetHit = true;
          break outer;
        }

        try {
          const result = await callApi('/api/v1/employee/search', {
            company_website: website,
            role,
            country: countryCode(criteria.location.country),
            state: criteria.location.region ?? '',
            city: criteria.location.city ?? '',
          });

          const employees = (result.employees as SearchHit[]) ?? [];
          // 2 credits for the call, 1 per employee returned.
          ledger.charge(2 + employees.length);

          for (const employee of employees) {
            const key = [employee.first_name, employee.last_name, website]
              .join('|')
              .toLowerCase();
            if (!hits.has(key)) hits.set(key, { ...employee, company_website: website });
          }
        } catch (error) {
          warn(`Employee search (${website} · ${role}) failed: ${(error as Error).message}`);
        }

        await sleep(config.sources.requestDelayMs);
      }
    }

    progress(`NinjaPear: ${hits.size} people found across ${companies.length} companies`);

    // Stage 2 — enrich into full profiles. Search results carry only a name
    // and a role, which is not enough for the analyst to reason about.
    const profiles: Profile[] = [];
    for (const hit of [...hits.values()].slice(0, limit)) {
      if (!config.sources.ninjapearEnrich) {
        profiles.push(stubProfile(hit));
        continue;
      }
      if (!ledger.canAfford(3)) {
        budgetHit = true;
        profiles.push(stubProfile(hit));
        continue;
      }

      try {
        const raw = await callApi('/api/v2/employee/profile', {
          first_name: hit.first_name ?? '',
          last_name: hit.last_name ?? '',
          employer_website: hit.company_website ?? '',
          role: hit.role ?? '',
        });
        // Charged whether or not the lookup hits.
        ledger.charge(3);
        profiles.push(normaliseNinjaPearProfile(raw, hit));
      } catch (error) {
        ledger.charge(3);
        warn(`Profile enrichment for ${hit.first_name} ${hit.last_name} failed: ${(error as Error).message}`);
        profiles.push(stubProfile(hit));
      }

      await sleep(config.sources.requestDelayMs);
    }

    if (budgetHit) {
      warn(
        `Stopped at the NinjaPear credit cap (~${ledger.total} of ` +
          `${config.sources.ninjapearMaxCredits}). Raise NINJAPEAR_MAX_CREDITS ` +
          'to go further, or narrow the company list.',
      );
    }
    progress(`NinjaPear finished — ~${ledger.total} credits used`);

    return profiles;
  },
};

/** What we can say about someone from a search hit alone. */
function stubProfile(hit: SearchHit): Profile {
  const fullName = [hit.first_name, hit.last_name].filter(Boolean).join(' ').trim();
  return {
    id: `${fullName}@${hit.company_website ?? ''}`,
    fullName: fullName || 'Unknown',
    headline: hit.role,
    experiences: hit.role
      ? [{ title: hit.role, company: hit.company_website ?? 'Unknown company', endDate: null }]
      : [],
    educations: [],
    extras: {
      coverage:
        'Search result only — the profile was not enriched, so work history ' +
        'and education are unknown.',
    },
    source: 'ninjapear',
    retrievedAt: new Date().toISOString(),
  };
}

/** Only the markets the README mentions; extend as needed. */
const COUNTRY_CODES: Record<string, string> = {
  brazil: 'BR', brasil: 'BR', portugal: 'PT', 'united states': 'US', usa: 'US',
  'united kingdom': 'GB', germany: 'DE', spain: 'ES', france: 'FR',
  mexico: 'MX', argentina: 'AR', canada: 'CA',
};

export function countryCode(country: string | undefined): string {
  if (!country) return '';
  if (/^[A-Z]{2}$/.test(country)) return country;
  return COUNTRY_CODES[country.toLowerCase()] ?? '';
}
