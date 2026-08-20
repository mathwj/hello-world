import type { Profile } from './types.js';

/** Roughly "now" in months, for tenure maths. */
function monthsSinceEpoch(date: string | null | undefined, fallback: number): number {
  if (!date) return fallback;
  const match = /^(\d{4})(?:-(\d{1,2}))?/.exec(date.trim());
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : 1;
  return year * 12 + (month - 1);
}

const NOW = new Date();
const NOW_MONTHS = NOW.getFullYear() * 12 + NOW.getMonth();

/** Total months of professional history, ignoring overlaps between roles. */
export function totalExperienceMonths(profile: Profile): number {
  const intervals = profile.experiences
    .map((exp) => {
      const start = monthsSinceEpoch(exp.startDate, Number.NaN);
      if (Number.isNaN(start)) return null;
      const end = exp.endDate ? monthsSinceEpoch(exp.endDate, NOW_MONTHS) : NOW_MONTHS;
      return [start, Math.max(start, end)] as const;
    })
    .filter((v): v is readonly [number, number] => v !== null)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let cursorEnd = -Infinity;
  for (const [start, end] of intervals) {
    const from = Math.max(start, cursorEnd);
    if (end > from) total += end - from;
    cursorEnd = Math.max(cursorEnd, end);
  }
  return total;
}

export function yearsOfExperience(profile: Profile): number {
  return Math.round((totalExperienceMonths(profile) / 12) * 10) / 10;
}

/**
 * Flatten a profile into the text block handed to the analyst model, with
 * stable `sourceRef` labels so every claim can point back at a section.
 */
export function renderProfile(profile: Profile): string {
  const lines: string[] = [];
  lines.push(`Name: ${profile.fullName}`);
  if (profile.headline) lines.push(`Headline: ${profile.headline}`);
  if (profile.location) lines.push(`Location: ${profile.location}`);
  if (profile.country) lines.push(`Country: ${profile.country}`);
  if (profile.summary) lines.push(`Summary: ${profile.summary}`);
  lines.push(`Total professional history: ~${yearsOfExperience(profile)} years`);

  if (profile.experiences.length > 0) {
    lines.push('', 'EXPERIENCE');
    profile.experiences.forEach((exp, index) => {
      const period = `${exp.startDate ?? '?'} – ${exp.endDate ?? 'present'}`;
      const meta = [exp.location, exp.companyIndustry, exp.companySize]
        .filter(Boolean)
        .join(' · ');
      lines.push(
        `experience[${index}] · ${exp.title} @ ${exp.company} (${period})` +
          (meta ? ` [${meta}]` : ''),
      );
      if (exp.description) lines.push(`    ${exp.description}`);
    });
  }

  if (profile.educations.length > 0) {
    lines.push('', 'EDUCATION');
    profile.educations.forEach((edu, index) => {
      const period = [edu.startYear, edu.endYear].filter(Boolean).join('–');
      lines.push(
        `education[${index}] · ${[edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ')} — ` +
          `${edu.school}${period ? ` (${period})` : ''}`,
      );
      if (edu.description) lines.push(`    ${edu.description}`);
    });
  }

  if (profile.certifications?.length) {
    lines.push('', 'CERTIFICATIONS');
    profile.certifications.forEach((cert, index) => {
      lines.push(
        `certification[${index}] · ${cert.name}` +
          [cert.issuer, cert.year].filter(Boolean).map((v) => ` — ${v}`).join(''),
      );
    });
  }

  if (profile.skills?.length) lines.push('', `SKILLS: ${profile.skills.join(', ')}`);
  if (profile.languages?.length) lines.push(`LANGUAGES: ${profile.languages.join(', ')}`);

  for (const [key, value] of Object.entries(profile.extras ?? {})) {
    lines.push(`${key.toUpperCase()}: ${value}`);
  }

  return lines.join('\n');
}

/** Lowercased haystack used by the deterministic scorer and by pre-filtering. */
export function searchableText(profile: Profile): string {
  return renderProfile(profile).toLowerCase();
}
