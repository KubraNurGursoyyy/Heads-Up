import { Injectable } from '@nestjs/common';
import type { DiscoveredArticle } from './source.types';

@Injectable()
export class ArticleDeduplicatorService {
  deduplicate(items: DiscoveredArticle[], limit: number): DiscoveredArticle[] {
    const byUrl = new Map<string, DiscoveredArticle>();
    const seenTitles = new Set<string>();

    for (const item of items) {
      if (!item?.url || !item.title) continue;

      const url = this.cleanUrl(item.url);
      const titleKey = this.titleKey(item.title);
      if (!titleKey || seenTitles.has(titleKey)) continue;

      seenTitles.add(titleKey);
      if (!byUrl.has(url)) {
        byUrl.set(url, { ...item, url });
      }
    }

    return [...byUrl.values()]
      .sort((a, b) => this.dateValue(b.publishedAt) - this.dateValue(a.publishedAt))
      .slice(0, limit);
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
