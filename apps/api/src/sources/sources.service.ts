import { Injectable } from '@nestjs/common';
import { ArticleDeduplicatorService } from './article-deduplicator.service';
import { buildBookNewsQueries, isBookTracking } from './book-search';
import { GoogleNewsSourceService } from './google-news-source.service';
import { OpenLibrarySourceService } from './open-library-source.service';
import { buildGoogleNewsSearchPlan, type SearchRequest } from './search-plan';
import type { DiscoverOptions, DiscoveredArticle } from './source.types';

export type { DiscoverOptions, DiscoveredArticle } from './source.types';

@Injectable()
export class SourcesService {
  constructor(
    private readonly googleNews: GoogleNewsSourceService,
    private readonly openLibrary: OpenLibrarySourceService,
    private readonly deduplicator: ArticleDeduplicatorService,
  ) {}

  async discover(queries: string[], options: DiscoverOptions = {}): Promise<DiscoveredArticle[]> {
    const resultLimit = this.resultLimit(options.historical);
    const plan = buildGoogleNewsSearchPlan({
      baseQueries: queries,
      topic: options.topic,
      category: options.category,
      aliases: options.aliases,
      requiredTerms: options.requiredTerms,
      historical: options.historical,
      requestLimit: Math.max(4, Number(process.env.WATCH_SEARCH_REQUEST_LIMIT ?? 16)),
      primaryLocale: {
        lang: (process.env.SEARCH_LANG ?? 'tr').toLowerCase(),
        country: (process.env.SEARCH_COUNTRY ?? 'TR').toUpperCase(),
      },
    });

    const discovered = await this.googleNews.searchPlan(plan);
    const bookInput = {
      topic: options.topic,
      prompt: options.prompt,
      category: options.category,
      aliases: options.aliases,
    };

    if (isBookTracking(bookInput)) {
      discovered.push(...(await this.discoverBookSources(bookInput)));
    }

    return this.deduplicator.deduplicate(discovered, resultLimit);
  }

  private async discoverBookSources(bookInput: DiscoverOptions) {
    const requestLimit = Math.max(1, Number(process.env.WATCH_BOOK_REQUEST_LIMIT ?? 8));
    const newsPlan: SearchRequest[] = buildBookNewsQueries(bookInput)
      .slice(0, requestLimit)
      .map(query => {
        const english = /Turkish translation/i.test(query);
        return {
          query,
          lang: english ? 'en' : 'tr',
          country: english ? 'US' : 'TR',
          reason: 'book' as const,
        };
      });

    const [news, catalog] = await Promise.all([
      this.googleNews.searchPlan(newsPlan),
      this.openLibrary.search(bookInput),
    ]);

    return [...news, ...catalog];
  }

  private resultLimit(historical?: boolean) {
    const normal = Math.max(1, Number(process.env.WATCH_SEARCH_RESULT_LIMIT ?? 12));
    if (!historical) return normal;

    return Math.max(normal, Number(process.env.WATCH_HISTORICAL_RESULT_LIMIT ?? 36));
  }
}
