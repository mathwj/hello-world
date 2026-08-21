import { config } from '../config.js';
import { orderedTitles } from '../criteria.js';
import type { EducationEntry, ExperienceEntry, Profile, SearchCriteria } from '../types.js';
import type { SourceAdapter, SourceContext } from './types.js';

/**
 * Adapter for Apify — a marketplace of hosted LinkedIn data actors.
 *
 * This is the source that answers the original brief: search LinkedIn by job
 * title and location and get real people back. Apify runs the collection on
 * its own infrastructure, so nothing here touches your LinkedIn login and no
 * session cookie is ever handled by this app.
 *
 * Two stages, mirroring how the actors are split:
 *   1. A SEARCH actor turns title + location into a list of people. It returns
 *      the current role and company, not a full work history.
 *   2. An optional PROFILE actor opens each profile URL and returns the full
 *      history. Without it, the analyst is reasoning from the current role
 *      alone, so candidates score low-confidence by construction.
 *
 * Both actor ids and their input field names are configurable, because Apify
 * actors are third-party: they change, get deprecated, and price differently.
 * A dead actor should be a config change, not a code change.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Apify addresses actors as `user~actor` in URL paths, not `user/actor`. */
const actorPath = (actor: string) => actor.replace('/', '~');

async function apify(
  pathname: string,
  init: { method?: string; body?: unknown } = {},
): Promise<Record<string, unknown>> {
  const response = await fetch(`https://api.apify.com${pathname}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${config.sources.apifyToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Apify ${pathname} → ${response.status} ${response.statusText} ${text.slice(0, 200)}`,
    );
  }
  return (await response.json()) as Record<string, unknown>;
}

const TERMINAL = new Set(['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']);

/**
 * Start an actor, wait for it, and return its dataset rows. Polling rather
 * than a synchronous run: a wide search can outlast any request timeout.
 */
async function runActor(
  actor: string,
  input: unknown,
  progress: (message: string) => void,
): Promise<Record<string, unknown>[]> {
  const started = (await apify(`/v2/acts/${actorPath(actor)}/runs`, {
    method: 'POST',
    body: input,
  })).data as { id: string; defaultDatasetId: string };

  progress(`Apify: started ${actor} (run ${started.id})`);

  const deadline = Date.now() + config.sources.apifyTimeoutMs;
  let status = 'READY';

  while (!TERMINAL.has(status)) {
    if (Date.now() > deadline) {
      // Leave the run going; it can still be collected from the Apify console.
      throw new Error(
        `${actor} did not finish within ${Math.round(config.sources.apifyTimeoutMs / 1000)}s ` +
          `(run ${started.id} is still going in your Apify console)`,
      );
    }
    await sleep(config.sources.apifyPollMs);
    const run = (await apify(`/v2/actor-runs/${started.id}`)).data as { status: string };
    if (run.status !== status) progress(`Apify: ${actor} is ${run.status.toLowerCase()}`);
    status = run.status;
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`${actor} finished as ${status}`);
  }

  const items = await fetch(
    `https://api.apify.com/v2/datasets/${started.defaultDatasetId}/items?format=json`,
    { headers: { Authorization: `Bearer ${config.sources.apifyToken}` } },
  ).then((response) => response.json() as Promise<Record<string, unknown>[]>);

  progress(`Apify: ${actor} returned ${items.length} row(s)`);
  return items;
}

// --- tolerant field mapping ------------------------------------------------
//
// Actors are third-party and none of them agree on field names, so read
// several spellings and drop anything unrecognised rather than crashing.

function pick<T>(row: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== '') return value as T;
  }
  return undefined;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.map((entry) =>
      typeof entry === 'string' ? { title: entry } : (entry as Record<string, unknown>),
    );
  }
  return [];
}

function toExperience(row: Record<string, unknown>): ExperienceEntry {
  const end = pick<string>(row, 'endDate', 'ends_at', 'dateEnd', 'to');
  return {
    title: pick<string>(row, 'title', 'position', 'jobTitle', 'role') ?? 'Unknown role',
    company:
      pick<string>(row, 'company', 'companyName', 'company_name', 'organisation') ??
      'Unknown company',
    location: pick<string>(row, 'location', 'locationName'),
    startDate: pick<string>(row, 'startDate', 'starts_at', 'dateStart', 'from'),
    endDate: end ?? null,
    description: pick<string>(row, 'description', 'summary'),
  };
}

const yearOf = (value: unknown): number | undefined => {
  const match = /(\d{4})/.exec(String(value ?? ''));
  return match ? Number(match[1]) : undefined;
};

function toEducation(row: Record<string, unknown>): EducationEntry {
  return {
    school: pick<string>(row, 'school', 'schoolName', 'title', 'institution') ?? 'Unknown school',
    degree: pick<string>(row, 'degree', 'degreeName'),
    fieldOfStudy: pick<string>(row, 'fieldOfStudy', 'field_of_study', 'major', 'subject'),
    startYear: yearOf(pick(row, 'startDate', 'starts_at', 'dateStart')),
    endYear: yearOf(pick(row, 'endDate', 'ends_at', 'dateEnd')),
  };
}

export function normaliseApifyPerson(row: Record<string, unknown>): Profile | null {
  const fullName =
    pick<string>(row, 'fullName', 'name', 'full_name') ??
    [pick(row, 'firstName', 'first_name'), pick(row, 'lastName', 'last_name')]
      .filter(Boolean)
      .join(' ')
      .trim();
  if (!fullName) return null;

  const profileUrl = pick<string>(row, 'profileUrl', 'url', 'linkedinUrl', 'publicProfileUrl');

  // The search actor reports only the current role; the profile actor returns
  // a full history. Prefer the history when it is there, else synthesise the
  // one role we know about so the analyst has something to reason from.
  const history = asArray(
    pick(row, 'experience', 'experiences', 'positions', 'work_experience'),
  ).map(toExperience);

  const currentTitle = pick<string>(row, 'jobTitle', 'title', 'position');
  const currentCompany = pick<string>(row, 'currentCompany', 'companyName', 'company');
  const experiences =
    history.length > 0
      ? history
      : currentTitle
        ? [{ title: currentTitle, company: currentCompany ?? 'Unknown company', endDate: null }]
        : [];

  const location =
    pick<string>(row, 'locationName', 'location', 'addressWithCountry') ??
    [pick(row, 'city'), pick(row, 'country')].filter(Boolean).join(', ');

  return {
    id: profileUrl ?? `apify:${fullName}`,
    fullName,
    headline: pick<string>(row, 'headline', 'occupation', 'subtitle'),
    location: location || undefined,
    country: pick<string>(row, 'country', 'countryCode'),
    profileUrl,
    summary: pick<string>(row, 'summary', 'about', 'bio'),
    experiences,
    educations: asArray(pick(row, 'education', 'educations', 'schools')).map(toEducation),
    skills: (pick<string[]>(row, 'skills') ?? []).map(String),
    languages: (pick<string[]>(row, 'languages') ?? []).map(String),
    ...(history.length === 0
      ? {
          extras: {
            coverage:
              'From the search actor only — current role and company are known, ' +
              'earlier work history was not retrieved. Set APIFY_PROFILE_ACTOR ' +
              'to fetch full profiles.',
          },
        }
      : {}),
    source: 'apify',
    retrievedAt: new Date().toISOString(),
  };
}

/** Locations to hand the search actor, most specific first. */
function searchLocations(criteria: SearchCriteria): string[] {
  const { city, region, country, nearbyPlaces } = criteria.location;
  const parts = [
    [city, region, country].filter(Boolean).join(', '),
    ...nearbyPlaces,
    region,
    country,
  ].filter((value): value is string => Boolean(value));
  return [...new Set(parts)].slice(0, config.sources.apifyMaxLocations);
}

export const apifySource: SourceAdapter = {
  id: 'apify',
  label: 'Apify — LinkedIn search (hosted)',
  description:
    'Searches LinkedIn by job title and location through a hosted Apify ' +
    'actor, then optionally opens each profile for the full work history. ' +
    'Apify runs the collection on its own infrastructure — your LinkedIn ' +
    'account is not involved. Billed per person found.',
  isConfigured: () => Boolean(config.sources.apifyToken),
  configHint: 'Set APIFY_TOKEN in .env',

  async search({ criteria, limit, warn, progress }: SourceContext): Promise<Profile[]> {
    const jobTitles = orderedTitles(criteria, config.sources.apifyMaxTitles);

    if (jobTitles.length === 0) {
      warn('No job titles resolved from the brief — nothing to search Apify for.');
      return [];
    }

    const locations = searchLocations(criteria);
    const extraKeywords = criteria.mustHave
      .flatMap((criterion) => criterion.evidenceHints.slice(0, 2))
      .slice(0, config.sources.apifyMaxKeywords);

    progress(
      `Apify: searching ${jobTitles.length} title(s) across ` +
        `${locations.length || 'any'} location(s), cap ${limit} people`,
    );

    let rows: Record<string, unknown>[];
    try {
      rows = await runActor(
        config.sources.apifySearchActor,
        {
          jobTitles,
          locations,
          extraKeywords,
          maxResults: limit,
          expandTitleVariants: true,
        },
        progress,
      );
    } catch (error) {
      warn(`Apify search failed: ${(error as Error).message}`);
      return [];
    }

    let profiles = rows
      .map(normaliseApifyPerson)
      .filter((profile): profile is Profile => profile !== null)
      .slice(0, limit);

    if (profiles.length === 0) {
      warn(
        'The Apify search actor returned no usable rows. If it reported ' +
          'results, its output field names may differ from what this adapter ' +
          'reads — check one row in the Apify console against src/sources/apify.ts.',
      );
      return [];
    }

    // Stage 2 — full work history, if a profile actor is configured.
    const profileActor = config.sources.apifyProfileActor;
    if (!profileActor) {
      warn(
        `${profiles.length} profile(s) carry only their current role. Set ` +
          'APIFY_PROFILE_ACTOR to fetch full work history — the analysis is ' +
          'much weaker without it.',
      );
      return profiles;
    }

    const urls = profiles
      .map((profile) => profile.profileUrl)
      .filter((url): url is string => Boolean(url));

    if (urls.length === 0) {
      warn('No profile URLs came back from the search, so enrichment was skipped.');
      return profiles;
    }

    try {
      const detailed = await runActor(
        profileActor,
        { [config.sources.apifyProfileInputKey]: urls },
        progress,
      );

      // Merge on profile URL; keep the search row for anyone not returned.
      const byUrl = new Map<string, Profile>();
      for (const row of detailed) {
        const profile = normaliseApifyPerson(row);
        if (profile?.profileUrl) byUrl.set(profile.profileUrl.toLowerCase(), profile);
      }

      profiles = profiles.map((profile) => {
        const enriched = profile.profileUrl
          ? byUrl.get(profile.profileUrl.toLowerCase())
          : undefined;
        return enriched && enriched.experiences.length > profile.experiences.length
          ? enriched
          : profile;
      });

      const withHistory = profiles.filter((profile) => profile.experiences.length > 1).length;
      progress(`Apify: ${withHistory}/${profiles.length} profile(s) have full work history`);
    } catch (error) {
      warn(
        `Apify profile enrichment failed (${(error as Error).message}). ` +
          'Keeping the search results, which have current role only.',
      );
    }

    return profiles;
  },
};
