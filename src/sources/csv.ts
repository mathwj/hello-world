import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import type { EducationEntry, ExperienceEntry, Profile } from '../types.js';
import type { SourceAdapter, SourceContext } from './types.js';

/** Minimal RFC 4180 reader — quoted fields, embedded commas, escaped quotes. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const text = input.replace(/\r\n?/g, '\n');
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

const norm = (header: string) => header.trim().toLowerCase().replace(/[\s-]+/g, '_');

function pick(record: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value && value.trim()) return value.trim();
  }
  return '';
}

function splitList(value: string): string[] {
  return value
    .split(/[;|,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Experience cells accept either JSON, or a readable shorthand:
 *   `Marketing Manager @ Acme (2019-03 - 2022-06) [Curitiba]: ran paid media`
 * separated by `|` or newlines.
 */
function parseExperiences(value: string): ExperienceEntry[] {
  if (!value.trim()) return [];
  if (value.trim().startsWith('[')) {
    try {
      return JSON.parse(value) as ExperienceEntry[];
    } catch {
      /* fall through to shorthand */
    }
  }

  return value
    .split(/\||\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const pattern =
        /^(?<title>[^@]+)@\s*(?<company>[^(\[:]+?)\s*(?:\((?<period>[^)]*)\))?\s*(?:\[(?<location>[^\]]*)\])?\s*(?::\s*(?<description>.*))?$/;
      const match = pattern.exec(chunk);
      if (!match?.groups) return { title: chunk, company: 'Unknown' };
      const { title, company, period, location, description } = match.groups;
      // Split only on a *spaced* separator: dates are `2020-04`, so a bare
      // hyphen would tear the month off the year.
      const [startDate, endDate] = (period ?? '')
        .split(/\s+(?:[-–—]|to|até|a)\s+/)
        .map((p) => p.trim());
      const isCurrent = /^(present|current|atual|hoje)?$/i.test(endDate ?? '');
      return {
        title: title!.trim(),
        company: company!.trim(),
        location: location?.trim() || undefined,
        startDate: startDate || undefined,
        endDate: isCurrent ? null : endDate,
        description: description?.trim() || undefined,
      };
    });
}

/** `BSc Marketing — UFPR (2012-2016)`, `|`-separated, or a JSON array. */
function parseEducations(value: string): EducationEntry[] {
  if (!value.trim()) return [];
  if (value.trim().startsWith('[')) {
    try {
      return JSON.parse(value) as EducationEntry[];
    } catch {
      /* fall through to shorthand */
    }
  }

  return value
    .split(/\||\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const match = /^(?<degree>[^—\-]+)[—-]\s*(?<school>[^(]+)(?:\((?<period>[^)]*)\))?$/.exec(chunk);
      if (!match?.groups) return { school: chunk };
      const [startYear, endYear] = (match.groups.period ?? '')
        .split(/\s*[-–]\s*/)
        .map((p) => Number.parseInt(p, 10));
      return {
        school: match.groups.school!.trim(),
        degree: match.groups.degree!.trim(),
        startYear: Number.isFinite(startYear!) ? startYear : undefined,
        endYear: Number.isFinite(endYear!) ? endYear : undefined,
      };
    });
}

function rowToProfile(record: Record<string, string>, origin: string): Profile | null {
  const fullName = pick(record, 'full_name', 'name', 'nome', 'candidate');
  if (!fullName) return null;
  const profileUrl = pick(record, 'profile_url', 'linkedin_url', 'url', 'link');

  return {
    id: profileUrl || `${origin}:${fullName}`,
    fullName,
    headline: pick(record, 'headline', 'title', 'current_title', 'cargo') || undefined,
    location: pick(record, 'location', 'city', 'cidade', 'localidade') || undefined,
    country: pick(record, 'country', 'pais', 'país') || undefined,
    profileUrl: profileUrl || undefined,
    summary: pick(record, 'summary', 'about', 'resumo', 'bio') || undefined,
    experiences: parseExperiences(pick(record, 'experience', 'experiences', 'experiencia', 'experiência')),
    educations: parseEducations(pick(record, 'education', 'educations', 'formacao', 'formação')),
    skills: splitList(pick(record, 'skills', 'competencias', 'competências')),
    languages: splitList(pick(record, 'languages', 'idiomas')),
    source: `import:${origin}`,
    retrievedAt: pick(record, 'retrieved_at', 'captured_at') || undefined,
  };
}

async function listImportFiles(): Promise<string[]> {
  try {
    const entries = await readdir(config.sources.importDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.(csv|json)$/i.test(entry.name))
      .map((entry) => path.join(config.sources.importDir, entry.name));
  } catch {
    return [];
  }
}

/**
 * Reads profiles you already hold — an ATS export, a LinkedIn Recruiter
 * project export, a licensed data vendor's delivery — from `data/imports/`.
 * This is the compliant way to analyse LinkedIn-shaped data you have rights to.
 */
export const csvSource: SourceAdapter = {
  id: 'csv',
  label: 'Local import (CSV / JSON)',
  description:
    'Analyses profile exports you already have rights to — ATS dumps, ' +
    'LinkedIn Recruiter project exports, licensed vendor deliveries. Drop ' +
    `files into ${config.sources.importDir}/.`,
  isConfigured: () => true,
  configHint: `Place .csv or .json files in ${config.sources.importDir}/`,

  async search({ limit, warn, progress }: SourceContext): Promise<Profile[]> {
    const files = await listImportFiles();
    if (files.length === 0) {
      warn(`No import files found in ${config.sources.importDir}/ — skipping the import source.`);
      return [];
    }

    const profiles: Profile[] = [];
    for (const file of files) {
      const origin = path.basename(file);
      const raw = await readFile(file, 'utf8');

      if (file.toLowerCase().endsWith('.json')) {
        try {
          const parsed = JSON.parse(raw) as Partial<Profile>[];
          for (const entry of parsed) {
            if (!entry.fullName) continue;
            profiles.push({
              experiences: [],
              educations: [],
              ...entry,
              id: entry.id ?? entry.profileUrl ?? `${origin}:${entry.fullName}`,
              fullName: entry.fullName,
              source: `import:${origin}`,
            } as Profile);
          }
        } catch (error) {
          warn(`Could not parse ${origin}: ${(error as Error).message}`);
        }
      } else {
        const [header, ...rows] = parseCsv(raw);
        if (!header) continue;
        const columns = header.map(norm);
        for (const row of rows) {
          const record: Record<string, string> = {};
          columns.forEach((column, index) => {
            record[column] = row[index] ?? '';
          });
          const profile = rowToProfile(record, origin);
          if (profile) profiles.push(profile);
        }
      }
      progress(`Read ${origin}`);
    }

    return profiles.slice(0, limit);
  },
};
