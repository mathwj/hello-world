import { z } from 'zod';
import { config } from './config.js';
import { llmEnabled, parseStructured } from './llm.js';
import type { Criterion, SearchCriteria, Seniority } from './types.js';

const SENIORITIES = [
  'intern', 'junior', 'mid', 'senior', 'lead', 'head', 'director', 'vp', 'c_level',
] as const;

const CriterionSchema = z.object({
  id: z.string().describe('snake_case identifier, e.g. media_buying'),
  label: z.string().describe('Human-readable requirement name'),
  weight: z.number().describe('Relative importance from 1 to 100'),
  evidenceHints: z
    .array(z.string())
    .describe(
      'Words, tools and phrases that would evidence this on a profile, ' +
        'including local-language variants and common vendor names',
    ),
});

const CriteriaSchema = z.object({
  briefSummary: z.string(),
  targetTitles: z.array(z.string()),
  adjacentTitles: z.array(z.string()),
  localLanguageTitles: z.array(z.string()),
  location: z.object({
    city: z.string(),
    region: z.string(),
    country: z.string(),
    nearbyPlaces: z.array(z.string()),
    remoteAcceptable: z.boolean(),
  }),
  targetSeniority: z.array(z.enum(SENIORITIES)),
  minYearsExperience: z.number(),
  mustHave: z.array(CriterionSchema),
  niceToHave: z.array(CriterionSchema),
  industryPreferences: z.array(z.string()),
  educationPreferences: z.array(z.string()),
  languages: z.array(z.string()),
  dealBreakers: z.array(z.string()),
  sourcingQueries: z.array(z.string()),
});

const SYSTEM = `You turn a recruiter's free-text hiring brief into a structured sourcing plan.

Your job is to be generous about WHO to look at and strict about HOW they are judged:

1. targetTitles — titles that match the brief head-on.
2. adjacentTitles — "very similar functions". A brief asking for a Marketing
   Manager should also surface Growth Manager, Performance Marketing Manager,
   Demand Generation Manager, Marketing Coordinator (if senior enough), Head of
   Marketing, Digital Marketing Manager and similar. Aim for 8-15 entries.
3. localLanguageTitles — the same roles written the way people in that market
   actually write them. For Brazil that means Portuguese: "Gerente de
   Marketing", "Coordenador de Marketing", "Gestor de Tráfego", etc. Skip this
   only for English-speaking markets.
4. location — resolve the city to its region and country, and list nearby
   places whose residents plausibly commute or would relocate (for Curitiba:
   São José dos Pinhais, Pinhais, Colombo, Araucária, Curitiba Metropolitan
   Region, Paraná).
5. mustHave / niceToHave — split the brief's requirements. Weights across
   mustHave should roughly sum to 100. evidenceHints must include the concrete
   vocabulary that proves the skill: for media buying that is Google Ads, Meta
   Ads, Facebook Ads, programmatic, DSP, ROAS, CPA, paid social, "tráfego
   pago", "mídia paga"; for inside sales that is SDR, BDR, pipeline, CRM,
   HubSpot, Salesforce, outbound, "pré-vendas", "vendas internas".
6. minYearsExperience — read the seniority language. "Experienced" for a
   manager role means about 5 years; "senior" 7; unspecified 3.
7. sourcingQueries — 5-10 boolean-style strings combining title variants with
   the location and key skills, ready to paste into a search backend.

Infer aggressively but stay faithful to the brief. Never invent a requirement
the recruiter did not ask for or clearly imply.`;

/** Extract structured criteria from a free-text brief. */
export async function buildCriteria(brief: string): Promise<{
  criteria: SearchCriteria;
  warnings: string[];
}> {
  const warnings: string[] = [];

  if (llmEnabled()) {
    try {
      const parsed = await parseStructured(CriteriaSchema, {
        system: SYSTEM,
        user: `Hiring brief:\n"""\n${brief.trim()}\n"""`,
        effort: config.llm.criteriaEffort,
      });
      return { criteria: normalise(parsed as SearchCriteria), warnings };
    } catch (error) {
      warnings.push(
        `Model-based brief parsing failed (${(error as Error).message}). ` +
          'Fell back to keyword parsing — criteria will be coarser.',
      );
    }
  } else {
    warnings.push(
      'No model credentials configured: using keyword parsing and ' +
        'deterministic scoring. Set OPENAI_API_KEY (or ANTHROPIC_API_KEY) ' +
        'for full analysis.',
    );
  }

  return { criteria: heuristicCriteria(brief), warnings };
}

/** Clamp and de-duplicate whatever came back so downstream code can trust it. */
function normalise(criteria: SearchCriteria): SearchCriteria {
  const dedupe = (values: string[]) => [
    ...new Map(values.filter(Boolean).map((v) => [v.toLowerCase(), v])).values(),
  ];

  const fixWeights = (list: Criterion[]): Criterion[] =>
    list.map((c) => ({
      ...c,
      weight: Math.min(100, Math.max(1, Math.round(c.weight || 1))),
      evidenceHints: dedupe(c.evidenceHints ?? []),
    }));

  return {
    ...criteria,
    targetTitles: dedupe(criteria.targetTitles ?? []),
    adjacentTitles: dedupe(criteria.adjacentTitles ?? []),
    localLanguageTitles: dedupe(criteria.localLanguageTitles ?? []),
    location: {
      ...criteria.location,
      nearbyPlaces: dedupe(criteria.location?.nearbyPlaces ?? []),
    },
    minYearsExperience: Math.max(0, Math.round(criteria.minYearsExperience || 0)),
    mustHave: fixWeights(criteria.mustHave ?? []),
    niceToHave: fixWeights(criteria.niceToHave ?? []),
    sourcingQueries: dedupe(criteria.sourcingQueries ?? []),
  };
}

// --- Deterministic fallback ------------------------------------------------
//
// Small, transparent and offline. It exists so the app is usable without
// credentials and so a model outage degrades the shortlist rather than
// breaking it.

const ROLE_FAMILIES: Record<
  string,
  { titles: string[]; adjacent: string[]; localised: string[] }
> = {
  marketing: {
    titles: ['Marketing Manager', 'Marketing Lead'],
    adjacent: [
      'Growth Manager', 'Performance Marketing Manager', 'Digital Marketing Manager',
      'Demand Generation Manager', 'Head of Marketing', 'Brand Manager',
      'Marketing Coordinator', 'Media Manager', 'Paid Media Manager',
    ],
    localised: [
      'Gerente de Marketing', 'Coordenador de Marketing', 'Gestor de Tráfego',
      'Analista de Marketing Sênior', 'Head de Marketing', 'Gerente de Growth',
    ],
  },
  sales: {
    titles: ['Sales Manager', 'Inside Sales Manager'],
    adjacent: [
      'Business Development Manager', 'Account Executive', 'Sales Lead',
      'Revenue Manager', 'Head of Sales', 'Commercial Manager',
    ],
    localised: [
      'Gerente Comercial', 'Gerente de Vendas', 'Coordenador de Vendas',
      'Gerente de Inside Sales', 'Supervisor Comercial',
    ],
  },
  product: {
    titles: ['Product Manager'],
    adjacent: ['Product Owner', 'Program Manager', 'Head of Product', 'Product Lead'],
    localised: ['Gerente de Produto', 'Coordenador de Produto'],
  },
  engineering: {
    titles: ['Software Engineer'],
    adjacent: [
      'Backend Engineer', 'Full Stack Developer', 'Tech Lead',
      'Engineering Manager', 'Staff Engineer',
    ],
    localised: ['Desenvolvedor', 'Engenheiro de Software', 'Pessoa Desenvolvedora'],
  },
};

const SKILL_LIBRARY: Array<{ id: string; label: string; triggers: string[]; hints: string[] }> = [
  {
    id: 'media_buying',
    label: 'Media buying / paid media',
    triggers: ['media buying', 'paid media', 'midia', 'mídia', 'trafego', 'tráfego', 'ads', 'performance'],
    hints: [
      'Google Ads', 'Meta Ads', 'Facebook Ads', 'paid social', 'programmatic',
      'DSP', 'ROAS', 'CPA', 'CPM', 'media buying', 'tráfego pago', 'mídia paga',
      'Google Analytics', 'performance marketing',
    ],
  },
  {
    id: 'inside_sales',
    label: 'Inside sales',
    triggers: ['inside sales', 'sdr', 'bdr', 'pre-vendas', 'pré-vendas', 'vendas internas', 'outbound'],
    hints: [
      'inside sales', 'SDR', 'BDR', 'pipeline', 'CRM', 'HubSpot', 'Salesforce',
      'RD Station', 'outbound', 'pré-vendas', 'vendas internas', 'lead qualification',
      'MQL', 'SQL', 'cold calling',
    ],
  },
  {
    id: 'team_leadership',
    label: 'Team leadership',
    triggers: ['manager', 'gerente', 'lead', 'head', 'leader', 'coordenador'],
    hints: ['managed a team', 'led a team', 'liderança', 'equipe de', 'direct reports', 'mentored'],
  },
  {
    id: 'content_marketing',
    label: 'Content marketing',
    triggers: ['content', 'conteudo', 'conteúdo', 'seo', 'inbound'],
    hints: ['content marketing', 'SEO', 'inbound', 'blog', 'marketing de conteúdo', 'editorial'],
  },
  {
    id: 'crm_automation',
    label: 'CRM & marketing automation',
    triggers: ['crm', 'automation', 'automacao', 'automação'],
    hints: ['HubSpot', 'Salesforce', 'RD Station', 'Marketo', 'Pipedrive', 'automação de marketing'],
  },
  {
    id: 'ecommerce',
    label: 'E-commerce',
    triggers: ['ecommerce', 'e-commerce', 'marketplace', 'varejo', 'retail'],
    hints: ['e-commerce', 'marketplace', 'VTEX', 'Shopify', 'GMV', 'varejo'],
  },
];

const CITY_HINTS: Record<string, { region: string; country: string; nearby: string[] }> = {
  curitiba: {
    region: 'Paraná',
    country: 'Brazil',
    nearby: [
      'São José dos Pinhais', 'Pinhais', 'Colombo', 'Araucária',
      'Região Metropolitana de Curitiba', 'Paraná',
    ],
  },
  'são paulo': { region: 'São Paulo', country: 'Brazil', nearby: ['Osasco', 'Guarulhos', 'Barueri', 'ABC Paulista'] },
  'sao paulo': { region: 'São Paulo', country: 'Brazil', nearby: ['Osasco', 'Guarulhos', 'Barueri', 'ABC Paulista'] },
  'rio de janeiro': { region: 'Rio de Janeiro', country: 'Brazil', nearby: ['Niterói', 'Duque de Caxias'] },
  'porto alegre': { region: 'Rio Grande do Sul', country: 'Brazil', nearby: ['Canoas', 'Novo Hamburgo'] },
  'belo horizonte': { region: 'Minas Gerais', country: 'Brazil', nearby: ['Contagem', 'Nova Lima'] },
  lisbon: { region: 'Lisboa', country: 'Portugal', nearby: ['Oeiras', 'Cascais', 'Almada'] },
  london: { region: 'England', country: 'United Kingdom', nearby: ['Greater London', 'Croydon', 'Watford'] },
  berlin: { region: 'Berlin', country: 'Germany', nearby: ['Potsdam', 'Brandenburg'] },
};

const SENIORITY_WORDS: Array<{ words: string[]; levels: Seniority[]; years: number }> = [
  { words: ['intern', 'estagi'], levels: ['intern', 'junior'], years: 0 },
  { words: ['junior', 'júnior', 'entry'], levels: ['junior', 'mid'], years: 1 },
  { words: ['vp', 'vice president', 'chief', 'c-level', 'cmo', 'cto'], levels: ['vp', 'c_level'], years: 12 },
  { words: ['director', 'diretor'], levels: ['director', 'vp'], years: 10 },
  { words: ['head', 'chefe'], levels: ['head', 'director'], years: 8 },
  { words: ['senior', 'sênior', 'sr.', 'experienced', 'experiente'], levels: ['senior', 'lead', 'head'], years: 5 },
  { words: ['manager', 'gerente', 'lead', 'coordenador'], levels: ['mid', 'senior', 'lead'], years: 4 },
];

export function heuristicCriteria(brief: string): SearchCriteria {
  const text = brief.toLowerCase();

  const family =
    Object.keys(ROLE_FAMILIES).find((key) => {
      if (key === 'marketing') return /market|marketing|growth|m[ií]dia/.test(text);
      if (key === 'sales') return /sales|vendas|comercial/.test(text);
      if (key === 'product') return /product|produto/.test(text);
      return /engineer|developer|desenvolvedor|software/.test(text);
    }) ?? 'marketing';

  const roleSet = ROLE_FAMILIES[family]!;

  const cityKey = Object.keys(CITY_HINTS).find((city) => text.includes(city));
  const cityInfo = cityKey ? CITY_HINTS[cityKey]! : undefined;
  const city = cityKey ? titleCase(cityKey) : '';

  let levels: Seniority[] = ['mid', 'senior'];
  let years = 3;
  for (const entry of SENIORITY_WORDS) {
    if (entry.words.some((word) => text.includes(word))) {
      levels = entry.levels;
      years = Math.max(years, entry.years);
      break;
    }
  }

  const matched = SKILL_LIBRARY.filter((skill) =>
    skill.triggers.some((trigger) => text.includes(trigger)),
  );
  const mustHave: Criterion[] = matched.map((skill, index) => ({
    id: skill.id,
    label: skill.label,
    weight: index === 0 ? 40 : Math.max(15, Math.round(60 / Math.max(1, matched.length - 1))),
    evidenceHints: skill.hints,
  }));

  if (mustHave.length === 0) {
    mustHave.push({
      id: 'role_relevance',
      label: 'Relevant role experience',
      weight: 100,
      evidenceHints: [...roleSet.titles, ...roleSet.adjacent].slice(0, 10),
    });
  }

  const titles = [...roleSet.titles, ...roleSet.adjacent, ...roleSet.localised];

  return {
    briefSummary: brief.trim().slice(0, 200),
    targetTitles: roleSet.titles,
    adjacentTitles: roleSet.adjacent,
    localLanguageTitles: roleSet.localised,
    location: {
      city,
      region: cityInfo?.region ?? '',
      country: cityInfo?.country ?? '',
      nearbyPlaces: cityInfo?.nearby ?? [],
      remoteAcceptable: /remote|remoto|home office|h[ií]brido|hybrid/.test(text),
    },
    targetSeniority: levels,
    minYearsExperience: years,
    mustHave,
    niceToHave: [],
    industryPreferences: [],
    educationPreferences: [],
    languages: cityInfo?.country === 'Brazil' ? ['Portuguese'] : [],
    dealBreakers: [],
    sourcingQueries: titles
      .slice(0, 8)
      .map((title) => (city ? `"${title}" "${city}"` : `"${title}"`)),
  };
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
