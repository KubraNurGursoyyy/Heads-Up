import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { extractRssImage } from './rss-image';
import type { SearchRequest } from './search-plan';
import type { DiscoveredArticle } from './source.types';

@Injectable()
export class GoogleNewsSourceService {
  private readonly parser = new Parser();
  private readonly logger = new Logger(GoogleNewsSourceService.name);

  async searchPlan(plan: SearchRequest[]): Promise<DiscoveredArticle[]> {
    const discovered: DiscoveredArticle[] = [];

    for (let index = 0; index < plan.length; index += 4) {
      const batch = plan.slice(index, index + 4);
      const groups = await Promise.all(batch.map(request => this.search(request)));
      discovered.push(...groups.flat());
    }

    return discovered;
  }

  private async search(request: SearchRequest): Promise<DiscoveredArticle[]> {
    try {
      const hl = `${request.lang}-${request.country}`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(request.query)}&hl=${hl}&gl=${request.country}&ceid=${request.country}:${request.lang}`;
      const feed = await this.parser.parseURL(url);

      return (feed.items ?? [])
        .map(item => {
          const parsedTitle = this.parseTitle(String(item.title ?? '').trim());
          return {
            title: parsedTitle.title,
            url: String(item.link ?? '').trim(),
            description: this.stripHtml(String(item.contentSnippet ?? item.content ?? '')).slice(
              0,
              1200,
            ),
            sourceName: parsedTitle.source ?? 'Google News',
            sourceType: `google_news_rss_${request.lang}`,
            imageUrl: extractRssImage(item),
            publishedAt: this.safeDate(item.isoDate ?? item.pubDate),
            searchReason: request.reason,
            matchedQuery: request.query,
          } satisfies DiscoveredArticle;
        })
        .filter(item => item.title && item.url);
    } catch (error) {
      this.logger.warn(
        `Google News RSS failed [${request.lang}-${request.country}] ${request.query}: ${String(error)}`,
      );
      return [];
    }
  }

  private parseTitle(value: string) {
    const separatorIndex = value.lastIndexOf(' - ');
    if (separatorIndex > 20) {
      return {
        title: value.slice(0, separatorIndex).trim(),
        source: value.slice(separatorIndex + 3).trim(),
      };
    }

    return { title: value, source: undefined };
  }

  private safeDate(value?: string) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private stripHtml(value: string) {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
