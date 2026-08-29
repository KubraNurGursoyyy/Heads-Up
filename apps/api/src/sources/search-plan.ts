export type NewsLocale = {
  lang: string;
  country: string;
};

export type SearchPlanInput = {
  baseQueries: string[];
  topic?: string;
  category?: string;
  aliases?: string[];
  historical?: boolean;
  primaryLocale?: NewsLocale;
  requestLimit?: number;
  now?: Date;
};

export type SearchRequest = {
  query: string;
  lang: string;
  country: string;
  reason: 'base' | 'exact' | 'tail' | 'category' | 'official' | 'recent' | 'history' | 'book';
};

function normalize(value: string | null | undefined) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function unique(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of values) {
    const value = normalize(raw);
    if (!value) continue;
    const key = value.toLocaleLowerCase('tr-TR');
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }

  return result;
}

function quote(value: string) {
  return `"${normalize(value).replace(/"/g, '')}"`;
}

function topicTail(topic: string) {
  const words = normalize(topic).split(' ').filter(Boolean);
  if (words.length < 3 || words.length > 6) return null;
  const tail = words.slice(-2).join(' ');
  return tail.length >= 8 ? tail : null;
}

function categoryTerm(category: string | undefined, lang: string) {
  const key = normalize(category).toLocaleLowerCase('tr-TR');
  if (!key) return lang === 'en' ? 'news' : 'haber';

  const en: Record<string, string> = {
    oyun: 'game',
    kitap: 'book',
    'film & dizi': 'movie tv',
    teknoloji: 'technology',
    müzik: 'music',
    spor: 'sports',
    bilim: 'science',
    'finans & ekonomi': 'finance economy',
    seyahat: 'travel',
    moda: 'fashion',
    otomotiv: 'automotive',
  };

  return lang === 'en' ? en[key] ?? 'news' : normalize(category) || 'haber';
}

function locales(primary?: NewsLocale) {
  const first = {
    lang: normalize(primary?.lang || 'tr').toLowerCase(),
    country: normalize(primary?.country || 'TR').toUpperCase(),
  };

  const values = [first, { lang: 'en', country: 'US' }];
  const seen = new Set<string>();

  return values.filter(locale => {
    const key = `${locale.lang}-${locale.country}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fiveYearsAgo(now: Date) {
  const date = new Date(now);
  date.setUTCFullYear(date.getUTCFullYear() - 5);
  return date.toISOString().slice(0, 10);
}

export function buildGoogleNewsSearchPlan(input: SearchPlanInput): SearchRequest[] {
  const requestLimit = Math.max(4, input.requestLimit ?? 16);
  const topic = normalize(input.topic);
  const tail = topic ? topicTail(topic) : null;
  const base = unique([topic, ...(input.aliases ?? []), ...input.baseQueries]).slice(0, 5);
  const localeList = locales(input.primaryLocale);
  const now = input.now ?? new Date();

  const requests: SearchRequest[] = [];
  const seen = new Set<string>();

  const push = (
    query: string,
    locale: NewsLocale,
    reason: SearchRequest['reason'],
  ) => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return;

    const key = `${locale.lang}-${locale.country}:${normalizedQuery.toLocaleLowerCase('tr-TR')}`;
    if (seen.has(key) || requests.length >= requestLimit) return;
    seen.add(key);
    requests.push({ query: normalizedQuery, ...locale, reason });
  };

  for (const locale of localeList) {
    if (topic) push(quote(topic), locale, 'exact');
  }

  for (const locale of localeList) {
    if (topic) push(topic, locale, 'base');
  }

  if (tail) {
    for (const locale of localeList) push(quote(tail), locale, 'tail');
  }

  if (topic) {
    for (const locale of localeList) {
      push(`${quote(topic)} ${categoryTerm(input.category, locale.lang)}`, locale, 'category');
    }
  }

  // İlk taramada geçmişi gerçekten doldurabilmek için tarih sorguları
  // genel/official sorgulardan önce gelir. Böylece request limiti geçmişi kesmez.
  if (input.historical && topic) {
    const historicalQueries = [
      `${quote(topic)} when:30d`,
      `${quote(topic)} when:1y`,
      `${quote(topic)} after:${fiveYearsAgo(now)}`,
    ];

    for (const query of historicalQueries) {
      for (const locale of localeList) {
        push(query, locale, query.includes('30d') ? 'recent' : 'history');
      }
    }
  }

  if (topic) {
    for (const locale of localeList) {
      push(`${quote(topic)} official`, locale, 'official');
    }
  }

  for (const query of base) {
    for (const locale of localeList) push(query, locale, 'base');
  }

  return requests.slice(0, requestLimit);
}
