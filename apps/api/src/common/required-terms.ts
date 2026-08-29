const MAX_REQUIRED_TERMS = 16;
const MAX_REQUIRED_TERM_LENGTH = 60;

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

export function normalizeRequiredTerms(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const result: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    const value = normalizeWhitespace(String(raw ?? '')).slice(0, MAX_REQUIRED_TERM_LENGTH);
    if (!value) continue;

    const key = foldForComparison(value);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push(value);
    if (result.length >= MAX_REQUIRED_TERMS) break;
  }

  return result;
}

export function keepRequiredTermsPresentInText(values: unknown, text: string): string[] {
  const haystack = ` ${foldForComparison(text)} `;
  return normalizeRequiredTerms(values).filter(term => {
    const folded = foldForComparison(term);
    return Boolean(folded) && haystack.includes(` ${folded} `);
  });
}

export function requiredTermsKey(values: unknown): string {
  return normalizeRequiredTerms(values)
    .map(foldForComparison)
    .sort((a, b) => a.localeCompare(b))
    .join('::');
}

export function articleContainsRequiredTerms(
  values: unknown,
  title: string,
  description?: string | null,
): boolean {
  const terms = normalizeRequiredTerms(values);
  if (!terms.length) return true;

  const haystack = ` ${foldForComparison(`${title} ${description ?? ''}`)} `;
  return terms.every(term => {
    const folded = foldForComparison(term);
    return Boolean(folded) && haystack.includes(` ${folded} `);
  });
}

export function buildRequiredTermsQuery(values: unknown): string {
  return normalizeRequiredTerms(values)
    .map(term => `"${term.replace(/"/g, '')}"`)
    .join(' ');
}
