export type BookSearchInput = {
  topic?: string;
  prompt?: string;
  aliases?: string[];
  category?: string;
};

export type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  publish_year?: number[];
  language?: string[];
  isbn?: string[];
  publisher?: string[];
  cover_i?: number;
};

function normalize(value: string | null | undefined) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function fold(value: string | null | undefined) {
  return normalize(value)
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function unique(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = normalize(raw);
    if (!value) continue;
    const key = fold(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

export function isBookTracking(input: BookSearchInput) {
  const category = fold(input.category);
  if (category === 'kitap' || category === 'book') return true;

  const hay = fold([input.topic, input.prompt, ...(input.aliases ?? [])].join(' '));
  return /\b(kitap|book|roman|yazar|author|yayinevi|publisher|isbn|baski|edition|ceviri|translation)\b/.test(
    hay,
  );
}

export function wantsTurkishEdition(input: BookSearchInput) {
  const hay = fold([input.topic, input.prompt, ...(input.aliases ?? [])].join(' '));
  return /\b(turkce|turkish|ceviri|translation|baski|edition|yayinevi|publisher)\b/.test(hay);
}

export function cleanBookQuery(input: BookSearchInput) {
  const candidates = [input.topic, ...(input.aliases ?? []), input.prompt]
    .map(normalize)
    .filter(Boolean);

  const source = candidates[0] ?? '';
  const cleaned = source
    .replace(
      /\b(türkçe|turkce|turkish)\s+(çeviri(si)?|ceviri(si)?|baskı(sı)?|baski(si)?|edition|translation)\b/giu,
      ' ',
    )
    .replace(
      /\b(çeviri(si)?|ceviri(si)?|baskı(sı)?|baski(si)?|edition|translation|yayınlanınca|yayinlaninca|çıktığında|ciktiginda|çıkınca|cikinca|haber ver|bildir|takip et)\b/giu,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || source;
}

export function buildBookNewsQueries(input: BookSearchInput) {
  if (!isBookTracking(input)) return [];

  const title = cleanBookQuery(input).replace(/"/g, '').trim();
  if (!title) return [];

  const quoted = `"${title}"`;
  const values = [
    `${quoted} "Türkçe çeviri"`,
    `${quoted} "Türkçe baskı"`,
    `${quoted} yayınevi`,
    `${quoted} ISBN`,
    `${quoted} "Turkish translation"`,
    `site:kitapyurdu.com ${quoted}`,
    `site:dr.com.tr ${quoted}`,
    `site:idefix.com ${quoted}`,
  ];

  return unique(values);
}

export function buildOpenLibraryQueries(input: BookSearchInput) {
  if (!isBookTracking(input)) return [];
  const title = cleanBookQuery(input);
  if (!title) return [];

  const queries = wantsTurkishEdition(input)
    ? [`${title} language:tur`, title]
    : [title, `${title} language:tur`];

  return unique(queries);
}

export function isTurkishOpenLibraryDoc(doc: OpenLibraryDoc) {
  return (doc.language ?? []).some(language => fold(language) === 'tur');
}

export function openLibraryPublishedAt(doc: OpenLibraryDoc) {
  const years = (doc.publish_year ?? []).filter(year => Number.isInteger(year) && year > 0);
  const year = years.length ? Math.max(...years) : doc.first_publish_year;
  return year ? new Date(Date.UTC(year, 0, 1)) : undefined;
}

export function openLibraryDescription(doc: OpenLibraryDoc) {
  const parts: string[] = [];
  const authors = unique(doc.author_name ?? []).slice(0, 3);
  const publishers = unique(doc.publisher ?? []).slice(0, 3);
  const isbns = unique(doc.isbn ?? []).slice(0, 3);

  if (authors.length) parts.push(`Yazar: ${authors.join(', ')}`);
  if (publishers.length) parts.push(`Yayınevi: ${publishers.join(', ')}`);
  if (isbns.length) parts.push(`ISBN: ${isbns.join(', ')}`);

  return parts.join(' · ');
}
