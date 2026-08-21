import { config } from '../config.js';
import type { EducationEntry, ExperienceEntry, Profile } from '../types.js';
import type { SourceAdapter, SourceContext } from './types.js';

/**
 * Adapter for Proxycurl, formerly a licensed provider of LinkedIn-derived
 * profile data.
 *
 * RETIRED: Proxycurl shut down on 2025-07-04 after LinkedIn and Microsoft sued
 * its operator, Nubela, over large-scale scraping of member data. The endpoints
 * below no longer answer. The successor product (NinjaPear) is not a drop-in:
 * it drops LinkedIn as a source and keys person lookups on work email or
 * company website rather than a profile URL, so it enriches people you can
 * already name and cannot answer "who are the marketing managers in Curitiba".
 *
 * The adapter is kept as a worked example of the SourceAdapter contract — it
 * shows the search-then-enrich shape most vendors use, and is a short edit away
 * from targeting one that is still operating. It refuses to run rather than
 * failing on a connection error, unless PROXYCURL_ALLOW_LEGACY=1 is set for
 * someone with legacy access.
 *
 * Field mapping is deliberately tolerant — providers rename and version their
 * response fields, so anything unrecognised is dropped rather than crashing
 * the run.
 */

interface RawDate {
  year?: number;
  month?: number;
  day?: number;
}

function formatDate(date: RawDate | null | undefined): string | undefined {
  if (!date?.year) return undefined;
  return date.month
    ? `${date.year}-${String(date.month).padStart(2, '0')}`
    : String(date.year);
}

function toExperience(raw: Record<string, unknown>): ExperienceEntry {
  const ends = raw.ends_at as RawDate | null | undefined;
  return {
    title: String(raw.title ?? 'Unknown role'),
    company: String(raw.company ?? 'Unknown company'),
    location: (raw.location as string) ?? undefined,
    startDate: formatDate(raw.starts_at as RawDate),
    endDate: ends ? formatDate(ends) : null,
    description: (raw.description as string) ?? undefined,
  };
}

function toEducation(raw: Record<string, unknown>): EducationEntry {
  return {
    school: String(raw.school ?? 'Unknown school'),
    degree: (raw.degree_name as string) ?? undefined,
    fieldOfStudy: (raw.field_of_study as string) ?? undefined,
    startYear: (raw.starts_at as RawDate | undefined)?.year,
    endYear: (raw.ends_at as RawDate | undefined)?.year,
  };
}

export function normaliseProxycurlProfile(
  raw: Record<string, unknown>,
  url: string,
): Profile {
  const first = (raw.first_name as string) ?? '';
  const last = (raw.last_name as string) ?? '';
  const fullName = ((raw.full_name as string) ?? `${first} ${last}`).trim();

  const cityParts = [raw.city, raw.state, raw.country_full_name]
    .filter((part): part is string => typeof part === 'string' && part.length > 0);

  return {
    id: url,
    fullName: fullName || 'Unknown',
    headline: (raw.headline as string) ?? undefined,
    location: cityParts.join(', ') || undefined,
    country: (raw.country_full_name as string) ?? (raw.country as string) ?? undefined,
    profileUrl: url,
    summary: (raw.summary as string) ?? undefined,
    experiences: ((raw.experiences as Record<string, unknown>[]) ?? []).map(toExperience),
    educations: ((raw.education as Record<string, unknown>[]) ?? []).map(toEducation),
    certifications: ((raw.certifications as Record<string, unknown>[]) ?? []).map((cert) => ({
      name: String(cert.name ?? ''),
      issuer: (cert.authority as string) ?? undefined,
      year: (cert.starts_at as RawDate | undefined)?.year,
    })),
    skills: (raw.skills as string[]) ?? [],
    languages: (raw.languages as string[]) ?? [],
    source: 'proxycurl',
    retrievedAt: new Date().toISOString(),
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callApi(
  pathname: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const url = new URL(`${config.sources.proxycurlBaseUrl}${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${config.sources.proxycurlApiKey}` },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Proxycurl ${pathname} failed: ${response.status} ${response.statusText} ${body.slice(0, 200)}`,
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

export const proxycurlSource: SourceAdapter = {
  id: 'proxycurl',
  label: 'Proxycurl (retired — service shut down 2025)',
  description:
    'Proxycurl shut down in July 2025 after LinkedIn sued its operator. This ' +
    'adapter is kept as a template for wiring up a vendor that is still ' +
    'operating; it will not return results on its own.',
  isConfigured: () =>
    Boolean(config.sources.proxycurlApiKey) && config.sources.proxycurlAllowLegacy,
  configHint:
    'Service discontinued. Use the `csv` source with a LinkedIn Recruiter ' +
    'export, or adapt this file to a current vendor.',

  async search({ criteria, limit, warn, progress }: SourceContext): Promise<Profile[]> {
    if (!config.sources.proxycurlAllowLegacy) {
      warn(
        'The Proxycurl source is retired: the service shut down on 2025-07-04 ' +
          'and its endpoints no longer answer. No profiles were sourced from it.',
      );
      return [];
    }

    const titles = [
      ...criteria.targetTitles,
      ...criteria.adjacentTitles,
      ...criteria.localLanguageTitles,
    ];
    if (titles.length === 0) return [];

    const found = new Map<string, Profile>();
    // A single regex-alternation title filter costs one search instead of one
    // per title variant, which matters when every call burns credits.
    const titleFilter = `(?i)(${titles.map(escapeRegex).join('|')})`;
    const keywordFilter = criteria.mustHave
      .flatMap((c) => c.evidenceHints.slice(0, 4))
      .slice(0, 12)
      .map(escapeRegex)
      .join('|');

    try {
      const result = await callApi('/v2/search/person', {
        country: countryCode(criteria.location.country),
        city: criteria.location.city ?? '',
        region: criteria.location.region ?? '',
        current_role_title: titleFilter,
        ...(keywordFilter ? { summary: `(?i)(${keywordFilter})` } : {}),
        enrich_profiles: 'enrich',
        page_size: String(Math.min(limit, 100)),
      });

      const results = (result.results as Record<string, unknown>[]) ?? [];
      progress(`Proxycurl returned ${results.length} hits`);

      for (const entry of results) {
        const url = String(entry.linkedin_profile_url ?? entry.profile_url ?? '');
        if (!url || found.has(url)) continue;

        let raw = entry.profile as Record<string, unknown> | undefined;
        if (!raw) {
          // Search returned URLs only — enrich each one individually.
          await sleep(config.sources.requestDelayMs);
          raw = await callApi('/v2/linkedin', { url, skills: 'include' });
        }
        found.set(url, normaliseProxycurlProfile(raw, url));
        if (found.size >= limit) break;
      }
    } catch (error) {
      warn(`Proxycurl source failed: ${(error as Error).message}`);
    }

    return [...found.values()];
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Only the markets the demo dataset and README mention; extend as needed. */
const COUNTRY_CODES: Record<string, string> = {
  brazil: 'BR',
  brasil: 'BR',
  portugal: 'PT',
  'united states': 'US',
  usa: 'US',
  'united kingdom': 'GB',
  germany: 'DE',
  spain: 'ES',
  france: 'FR',
  mexico: 'MX',
  argentina: 'AR',
  canada: 'CA',
};

export function countryCode(country: string | undefined): string {
  if (!country) return '';
  if (/^[A-Z]{2}$/.test(country)) return country;
  return COUNTRY_CODES[country.toLowerCase()] ?? '';
}
