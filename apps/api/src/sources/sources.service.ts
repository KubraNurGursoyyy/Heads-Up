import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';

export type DiscoveredArticle = {
  title: string;
  url: string;
  description?: string;
  sourceName?: string;
  sourceType: string;
  publishedAt?: Date;
};

@Injectable()
export class SourcesService {
  private parser = new Parser();
  private logger = new Logger(SourcesService.name);

  async discover(queries: string[]): Promise<DiscoveredArticle[]> {
    const limit = Number(process.env.WATCH_SEARCH_RESULT_LIMIT ?? 12);
    const chosen = [...new Set(queries.filter(Boolean))].slice(0, 4);
    const groups = await Promise.all(chosen.map(query => this.googleNews(query)));
    const byUrl = new Map<string, DiscoveredArticle>();

    for (const item of groups.flat()) {
      if (item?.url && item.title) {
        const url = this.cleanUrl(item.url);
        byUrl.set(url, { ...item, url });
      }
    }

    return [...byUrl.values()].slice(0, limit);
  }

  private async googleNews(query: string): Promise<DiscoveredArticle[]> {
    try {
      const lang = (process.env.SEARCH_LANG ?? 'tr').toLowerCase();
      const country = (process.env.SEARCH_COUNTRY ?? 'TR').toUpperCase();
      const hl = `${lang}-${country}`;
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=${country}&ceid=${country}:${lang}`;
      const feed = await this.parser.parseURL(url);

      return (feed.items ?? [])
        .map(item => {
          const parsedTitle = this.parseGoogleTitle(String(item.title ?? '').trim());
          return {
            title: parsedTitle.title,
            url: String(item.link ?? '').trim(),
            description: this.stripHtml(String(item.contentSnippet ?? item.content ?? '')).slice(0, 1200),
            sourceName: parsedTitle.source ?? 'Google News',
            sourceType: 'google_news_rss',
            publishedAt: this.safeDate(item.isoDate ?? item.pubDate),
          };
        })
        .filter(item => item.title && item.url);
    } catch (error) {
      this.logger.warn(`Google News RSS failed for ${query}: ${String(error)}`);
      return [];
    }
  }

  private parseGoogleTitle(value: string) {
    const index = value.lastIndexOf(' - ');
    if (index > 20) {
      return { title: value.slice(0, index).trim(), source: value.slice(index + 3).trim() };
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
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(key =>
        url.searchParams.delete(key),
      );
      url.hash = '';
      return url.toString();
    } catch {
      return value;
    }
  }

  private stripHtml(value: string) {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
