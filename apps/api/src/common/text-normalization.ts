const CATEGORY_ALIASES: Record<string, string> = {
  oyun: 'Oyun',
  game: 'Oyun',
  gaming: 'Oyun',
  kitap: 'Kitap',
  book: 'Kitap',
  edebiyat: 'Kitap',
  roman: 'Kitap',
  film: 'Film & Dizi',
  dizi: 'Film & Dizi',
  sinema: 'Film & Dizi',
  tv: 'Film & Dizi',
  'film dizi': 'Film & Dizi',
  'film ve dizi': 'Film & Dizi',
  teknoloji: 'Teknoloji',
  tech: 'Teknoloji',
  yazilim: 'Teknoloji',
  donanim: 'Teknoloji',
  muzik: 'Müzik',
  music: 'Müzik',
  spor: 'Spor',
  sports: 'Spor',
  bilim: 'Bilim',
  science: 'Bilim',
  finans: 'Finans & Ekonomi',
  ekonomi: 'Finans & Ekonomi',
  'finans ekonomi': 'Finans & Ekonomi',
  seyahat: 'Seyahat',
  travel: 'Seyahat',
  moda: 'Moda',
  fashion: 'Moda',
  otomotiv: 'Otomotiv',
  araba: 'Otomotiv',
  saglik: 'Sağlık',
  health: 'Sağlık',
  genel: 'Diğer',
  diger: 'Diğer',
  other: 'Diğer',
  general: 'Diğer',
};

const COMMON_TURKISH_CORRECTIONS: Record<string, string> = {
  cikis: 'çıkış',
  cikislar: 'çıkışlar',
  cikinca: 'çıkınca',
  ciktiginda: 'çıktığında',
  cikarsa: 'çıkarsa',
  turkce: 'Türkçe',
  turkceye: 'Türkçeye',
  turkiyede: 'Türkiye’de',
  tarhi: 'tarihi',
  tariih: 'tarih',
  tarihii: 'tarihi',
  habr: 'haber',
  haberi: 'haberi',
  habrver: 'haber ver',
  oldugunda: 'olduğunda',
  oldugu: 'olduğu',
  olucak: 'olacak',
  olcak: 'olacak',
  aciklaninca: 'açıklanınca',
  aciklandiginda: 'açıklandığında',
  aciklanirsa: 'açıklanırsa',
  yayinlaninca: 'yayınlanınca',
  yayinlandiginda: 'yayınlandığında',
  ertelenirse: 'ertelenirse',
  ertelendginde: 'ertelendiğinde',
  bildir: 'bildir',
  bildirim: 'bildirim',
};

export function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function foldForComparison(value: string): string {
  return normalizeWhitespace(value)
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function sameTextInsensitive(a: string, b: string): boolean {
  return foldForComparison(a) === foldForComparison(b);
}

function titleCaseTr(value: string): string {
  return normalizeWhitespace(value)
    .toLocaleLowerCase('tr-TR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map(word => word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1))
    .join(' ');
}

export function normalizeCategoryName(value: string | null | undefined): string {
  const cleaned = normalizeWhitespace(value ?? '');
  if (!cleaned) return 'Diğer';

  const key = foldForComparison(cleaned);
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key];

  return titleCaseTr(cleaned).slice(0, 40) || 'Diğer';
}

export function inferFallbackCategory(prompt: string): string {
  const value = foldForComparison(prompt);

  if (/\b(oyun[a-z0-9]*|game[a-z0-9]*|gaming|steam|playstation|xbox|nintendo|ps5|pc)\b/.test(value)) return 'Oyun';
  if (/\b(kitap|roman|baski|yayinevi|yazar|ceviri)\b/.test(value)) return 'Kitap';
  if (/\b(film|dizi|sezon|vizyon|sinema|netflix|disney|hbo)\b/.test(value)) return 'Film & Dizi';
  if (/\b(telefon|islemci|yazilim|surum|android|iphone|apple|samsung|teknoloji|ai|yapay zeka)\b/.test(value)) return 'Teknoloji';
  if (/\b(muzik|album|sarki|konser|turne|spotify|sanatci)\b/.test(value)) return 'Müzik';
  if (/\b(futbol|basketbol|tenis|voleybol|mac|lig|spor|formula|f1)\b/.test(value)) return 'Spor';
  if (/\b(bilim|uzay|nasa|arastirma|makale|kesif)\b/.test(value)) return 'Bilim';
  if (/\b(finans|borsa|hisse|dolar|euro|ekonomi|faiz|kripto)\b/.test(value)) return 'Finans & Ekonomi';
  if (/\b(seyahat|ucus|otel|vize|tatil|gezi)\b/.test(value)) return 'Seyahat';
  if (/\b(moda|giyim|koleksiyon|defile)\b/.test(value)) return 'Moda';
  if (/\b(araba|otomobil|otomotiv|tesla|motor)\b/.test(value)) return 'Otomotiv';

  return 'Diğer';
}

export function applyCommonTurkishCorrections(input: string): string {
  const normalized = normalizeWhitespace(input);

  return normalized.replace(/\p{L}+/gu, word => {
    const key = foldForComparison(word);
    const replacement = COMMON_TURKISH_CORRECTIONS[key];
    return replacement ?? word;
  });
}

export type CategoryStat = {
  name: string;
  count: number;
};

export function buildCategoryStats(values: string[]): CategoryStat[] {
  const counts = new Map<string, CategoryStat>();

  for (const raw of values) {
    const name = normalizeCategoryName(raw);
    const key = foldForComparison(name);
    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { name, count: 1 });
    }
  }

  return [...counts.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, 'tr');
  });
}
