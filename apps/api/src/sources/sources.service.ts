import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import {
  buildGoogleNewsSearchPlan,
  type SearchRequest,
} from './search-plan';
import {
  buildBookNewsQueries,
  buildOpenLibraryQueries,
  isBookTracking,
  isTurkishOpenLibraryDoc,
  openLibraryDescription,
  openLibraryPublishedAt,
  wantsTurkishEdition,
  type OpenLibraryDoc,
} from './book-search';
import { extractRssImage, openLibraryCoverUrl } from './rss-image';

export type DiscoveredArticle = {
  title: string;
  url: string;
  description?: string;
  sourceName?: string;
  sourceType: string;
  imageUrl?: string;
  publishedAt?: Date;
  searchReason?: SearchRequest['reason'];
  matchedQuery?: string;
};

export type DiscoverOptions = {
  topic?: string;
  prompt?: string;
  category?: string;
  aliases?: string[];
  intersectionTerms?: string[];
  historical?: boolean;
};

type OpenLibraryResponse = {
  docs?: OpenLibraryDoc[];
};

@Injectable()
export class SourcesService {
  private readonly parser = new Parser();
  private readonly logger = new Logger(SourcesService.name);

  async discover(
    queries: string[],
    options: DiscoverOptions = {},
  ): Promise<DiscoveredArticle[]> {
    const normalLimit = Math.max(1, Number(process.env.WATCH_SEARCH_RESULT_LIMIT ?? 12));
    const historicalLimit = Math.max(
      normalLimit,
      Number(process.env.WATCH_HISTORICAL_RESULT_LIMIT ?? 36),
    );
    const resultLimit = options.historical ? historicalLimit : normalLimit;
    const requestLimit = Math.max(4, Number(process.env.WATCH_SEARCH_REQUEST_LIMIT ?? 16));

    const plan = buildGoogleNewsSearchPlan({
      baseQueries: queries,
      topic: options.topic,
      category: options.category,
      aliases: options.aliases,
      intersectionTerms: options.intersectionTerms,
      historical: options.historical,
      requestLimit,
      primaryLocale: {
        lang: (process.env.SEARCH_LANG ?? 'tr').toLowerCase(),
        country: (process.env.SEARCH_COUNTRY ?? 'TR').toUpperCase(),
      },
    });

    const discovered: DiscoveredArticle[] = [];

    await this.runGoogleNewsPlan(plan, discovered);

    const bookInput = {
      topic: options.topic,
      prompt: options.prompt,
      category: options.category,
      aliases: options.aliases,
    };

    if (isBookTracking(bookInput)) {
      const bookRequestLimit = Math.max(1, Number(process.env.WATCH_BOOK_REQUEST_LIMIT ?? 8));
      const bookQueries = buildBookNewsQueries(bookInput).slice(0, bookRequestLimit);
      const bookPlan: SearchRequest[] = bookQueries.map(query => {
        const english = /Turkish translation/i.test(query);
        return {
          query,
          lang: english ? 'en' : 'tr',
          country: english ? 'US' : 'TR',
          reason: 'book' as const,
        };
      });

      await this.runGoogleNewsPlan(bookPlan, discovered);
      discovered.push(...(await this.openLibraryCatalog(bookInput)));
    }

    const byUrl = new Map<string, DiscoveredArticle>();
    const seenTitles = new Set<string>();

    for (const item of discovered) {
      if (!item?.url || !item.title) continue;

      const url = this.cleanUrl(item.url);
      const titleKey = this.titleKey(item.title);
      if (!titleKey) continue;

      if (seenTitles.has(titleKey)) continue;
      seenTitles.add(titleKey);

      if (!byUrl.has(url)) {
        byUrl.set(url, { ...item, url });
      }
    }

    return [...byUrl.values()]
      .sort((a, b) => this.dateValue(b.publishedAt) - this.dateValue(a.publishedAt))
      .slice(0, resultLimit);
  }

  private async runGoogleNewsPlan(
    plan: SearchRequest[],
    discovered: DiscoveredArticle[],
  ) {
    for (let index = 0; index < plan.length; index += 4) {
      const batch = plan.slice(index, index + 4);
      const groups = await Promise.all(batch.map(request => this.googleNews(request)));
      discovered.push(...groups.flat());
    }
  }

  private async googleNews(request: SearchRequest): Promise<DiscoveredArticle[]> {
    try {
      const hl = `${request.lang}-${request.country}`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(request.query)}&hl=${hl}&gl=${request.country}&ceid=${request.country}:${request.lang}`;
      const feed = await this.parser.parseURL(url);

      return (feed.items ?? [])
        .map(item => {
          const parsedTitle = this.parseGoogleTitle(String(item.title ?? '').trim());
          return {
            title: parsedTitle.title,
            url: String(item.link ?? '').trim(),
            description: this.stripHtml(String(item.contentSnippet ?? item.content ?? '')).slice(0, 1200),
            sourceName: parsedTitle.source ?? 'Google News',
            sourceType: `google_news_rss_${request.lang}`,
            imageUrl: extractRssImage(item),
            publishedAt: this.safeDate(item.isoDate ?? item.pubDate),
            searchReason: request.reason,
            matchedQuery: request.query,
          };
        })
        .filter(item => item.title && item.url);
    } catch (error) {
      this.logger.warn(
        `Google News RSS failed [${request.lang}-${request.country}] ${request.query}: ${String(error)}`,
      );
      return [];
    }
  }

  private async openLibraryCatalog(
    input: {
      topic?: string;
      prompt?: string;
      category?: string;
      aliases?: string[];
    },
  ): Promise<DiscoveredArticle[]> {
    const queries = buildOpenLibraryQueries(input);
    if (!queries.length) return [];

    const requireTurkish = wantsTurkishEdition(input);
    const results: DiscoveredArticle[] = [];

    for (const query of queries.slice(0, 2)) {
      try {
        const params = new URLSearchParams({
          q: query,
          fields: 'key,title,author_name,first_publish_year,publish_year,language,isbn,publisher,cover_i',
          limit: '8',
        });

        const contact = String(process.env.OPEN_LIBRARY_CONTACT ?? '').trim();
        const userAgent = contact
          ? `HeadsUp/0.1 (${contact})`
          : 'HeadsUp/0.1 personal-book-tracker';

        const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
          headers: {
            Accept: 'application/json',
            'User-Agent': userAgent,
          },
        });

        if (!response.ok) {
          this.logger.warn(`Open Library ${response.status} for ${query}`);
          continue;
        }

        const data = (await response.json()) as OpenLibraryResponse;

        for (const doc of data.docs ?? []) {
          if (!doc.key || !doc.title) continue;
          const turkish = isTurkishOpenLibraryDoc(doc);
          if (requireTurkish && !turkish) continue;

          const description = openLibraryDescription(doc);
          results.push({
            title: turkish
              ? `Türkçe katalog kaydı: ${doc.title}`
              : `Kitap katalog kaydı: ${doc.title}`,
            url: `https://openlibrary.org${doc.key}`,
            description: description || 'Open Library katalog kaydı bulundu.',
            sourceName: 'Open Library',
            sourceType: turkish ? 'open_library_catalog_tr' : 'open_library_catalog',
            imageUrl: openLibraryCoverUrl(doc.cover_i),
            publishedAt: openLibraryPublishedAt(doc),
          });
        }
      } catch (error) {
        this.logger.warn(`Open Library catalog search failed ${query}: ${String(error)}`);
      }
    }

    return results.slice(0, 8);
  }

  private parseGoogleTitle(value: string) {
    const index = value.lastIndexOf(' - ');
    if (index > 20) {
      return {
        title: value.slice(0, index).trim(),
        source: value.slice(index + 3).trim(),
      };
    }
    return { title: value, source: undefined };
  }

  private safeDate(value?: string) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private cleanUrl(value: string) {
    try {
      const url = new URL(value);
      [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'gclid',
        'fbclid',
      ].forEach(key => url.searchParams.delete(key));
      url.hash = '';
      return url.toString();
    } catch {
      return value;
    }
  }

  private stripHtml(value: string) {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private titleKey(value: string) {
    return value
      .toLocaleLowerCase('tr-TR')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private dateValue(value?: Date) {
    return value?.getTime() ?? 0;
  }
}
