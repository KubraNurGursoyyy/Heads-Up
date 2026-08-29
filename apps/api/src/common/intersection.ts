export const MATCH_MODE_SINGLE = 'SINGLE' as const;
export const MATCH_MODE_INTERSECTION = 'INTERSECTION' as const;
export type MatchMode = typeof MATCH_MODE_SINGLE | typeof MATCH_MODE_INTERSECTION;

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function foldForComparison(value: string): string {
  return normalizeWhitespace(value)
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeIntersectionTerms(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const result: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    const value = normalizeWhitespace(String(raw ?? '')).slice(0, 120);
    if (!value) continue;
    const key = foldForComparison(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length === 2) break;
  }

  return result;
}

export function intersectionKey(values: unknown): string {
  return normalizeIntersectionTerms(values)
    .map(foldForComparison)
    .sort((a, b) => a.localeCompare(b))
    .join('::');
}

export function buildIntersectionTopic(values: unknown): string {
  const terms = normalizeIntersectionTerms(values);
  return terms.length === 2 ? `${terms[0]} × ${terms[1]}` : terms.join(' × ');
}

export function buildIntersectionPrompt(values: unknown): string {
  const terms = normalizeIntersectionTerms(values);
  if (terms.length !== 2) return '';
  return `${terms[0]} ile ${terms[1]} kesişimindeki gelişmeleri takip et.`;
}

function termMatchesFoldedText(text: string, term: string): boolean {
  const foldedTerm = foldForComparison(term);
  if (!foldedTerm) return false;
  if (text.includes(foldedTerm)) return true;

  const tokens = foldedTerm.split(' ').filter(Boolean);
  if (tokens.length >= 3) {
    return tokens.some(token => token.length >= 6 && text.includes(token));
  }

  if (tokens.length === 2) {
    return tokens.every(token => text.includes(token));
  }

  return tokens.length === 1 && tokens[0].length >= 3 && text.includes(tokens[0]);
}

export function articleMatchesIntersection(
  termsInput: unknown,
  title: string,
  description?: string | null,
): boolean {
  const terms = normalizeIntersectionTerms(termsInput);
  if (terms.length !== 2) return true;

  const haystack = foldForComparison(`${title} ${description ?? ''}`);
  return terms.every(term => termMatchesFoldedText(haystack, term));
}
