import { config } from '../config.js';
import type { Profile } from '../types.js';
import type { SourceAdapter, SourceContext } from './types.js';

/**
 * Discovery-only adapter: asks a search engine (via SerpApi) which public
 * profile pages match the brief, and turns each hit into a stub profile built
 * from the search result's own title and snippet.
 *
 * It deliberately stops there. It does not fetch linkedin.com, so the stubs
 * carry a headline and a snippet but no work history — enough to triage and
 * hand to a recruiter, not enough for a full analysis. Pair it with the
 * `proxycurl` adapter (or a manual review pass) when you need the detail;
 * profiles from here are flagged `thin` so the UI can say so.
 */

interface SerpResult {
  title?: string;
  link?: string;
  snippet?: string;
}

function parseHeadline(title: string): { name: string; headline: string } {
  // Search titles look like "Jane Doe - Marketing Manager - Acme | LinkedIn".
  const cleaned = title.replace(/\s*[|·]\s*LinkedIn\s*$/i, '').trim();
  const [name = cleaned, ...rest] = cleaned.split(/\s+[-–—]\s+/);
  return { name: name.trim(), headline: rest.join(' – ').trim() };
}

export const webSearchSource: SourceAdapter = {
  id: 'websearch',
  label: 'Public web search (discovery only)',
  description:
    'Finds public profile pages through a search engine and builds stub ' +
    'records from the search snippets. Good for discovery; the stubs have no ' +
    'work history, so pair it with an enrichment source before judging anyone.',
  isConfigured: () => Boolean(config.sources.serpApiKey),
  configHint: 'Set SERPAPI_API_KEY in .env',

  async search({ criteria, limit, warn, progress }: SourceContext): Promise<Profile[]> {
    const location = [criteria.location.city, criteria.location.region]
      .filter(Boolean)
      .join(' ');

    const titles = [
      ...criteria.targetTitles,
      ...criteria.adjacentTitles,
      ...criteria.localLanguageTitles,
    ].slice(0, 8);

    const queries = titles.map(
      (title) => `site:linkedin.com/in "${title}"${location ? ` "${location}"` : ''}`,
    );

    const found = new Map<string, Profile>();

    for (const query of queries) {
      if (found.size >= limit) break;
      try {
        const url = new URL('https://serpapi.com/search.json');
        url.searchParams.set('engine', 'google');
        url.searchParams.set('q', query);
        url.searchParams.set('num', '20');
        url.searchParams.set('api_key', config.sources.serpApiKey);

        const response = await fetch(url);
        if (!response.ok) {
          warn(`Search for ${query} failed: ${response.status} ${response.statusText}`);
          continue;
        }

        const payload = (await response.json()) as { organic_results?: SerpResult[] };
        for (const result of payload.organic_results ?? []) {
          const link = result.link ?? '';
          if (!/linkedin\.com\/in\//i.test(link) || found.has(link)) continue;

          const { name, headline } = parseHeadline(result.title ?? '');
          if (!name) continue;

          found.set(link, {
            id: link,
            fullName: name,
            headline: headline || undefined,
            location: location || undefined,
            country: criteria.location.country || undefined,
            profileUrl: link,
            summary: result.snippet,
            experiences: [],
            educations: [],
            extras: {
              coverage:
                'Discovery stub built from a public search result. Work ' +
                'history and education were not retrieved.',
            },
            source: 'websearch',
            retrievedAt: new Date().toISOString(),
          });
          if (found.size >= limit) break;
        }
        progress(`Searched: ${query} (${found.size} unique so far)`);
      } catch (error) {
        warn(`Search for ${query} failed: ${(error as Error).message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, config.sources.requestDelayMs));
    }

    if (found.size > 0) {
      warn(
        `${found.size} profile(s) came from web search and have no work ` +
          'history attached — their scores are low-confidence by construction.',
      );
    }

    return [...found.values()];
  },
};
