import { Injectable, Logger } from '@nestjs/common';
import {
  buildOpenLibraryQueries,
  isTurkishOpenLibraryDoc,
  openLibraryDescription,
  openLibraryPublishedAt,
  wantsTurkishEdition,
  type OpenLibraryDoc,
} from './book-search';
import { openLibraryCoverUrl } from './rss-image';
import type { BookDiscoveryInput, DiscoveredArticle } from './source.types';

type OpenLibraryResponse = {
  docs?: OpenLibraryDoc[];
};

@Injectable()
export class OpenLibrarySourceService {
  private readonly logger = new Logger(OpenLibrarySourceService.name);

  async search(input: BookDiscoveryInput): Promise<DiscoveredArticle[]> {
    const queries = buildOpenLibraryQueries(input);
    if (!queries.length) return [];

    const requireTurkish = wantsTurkishEdition(input);
    const results: DiscoveredArticle[] = [];

    for (const query of queries.slice(0, 2)) {
      results.push(...(await this.searchQuery(query, requireTurkish)));
    }

    return results.slice(0, 8);
  }

  private async searchQuery(query: string, requireTurkish: boolean) {
    try {
      const params = new URLSearchParams({
        q: query,
        fields:
          'key,title,author_name,first_publish_year,publish_year,language,isbn,publisher,cover_i',
        limit: '8',
      });
      const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': this.userAgent(),
        },
      });

      if (!response.ok) {
        this.logger.warn(`Open Library ${response.status} for ${query}`);
        return [];
      }

      const data = (await response.json()) as OpenLibraryResponse;
      return (data.docs ?? []).flatMap(doc => this.toArticle(doc, requireTurkish));
    } catch (error) {
      this.logger.warn(`Open Library catalog search failed ${query}: ${String(error)}`);
      return [];
    }
  }

  private toArticle(doc: OpenLibraryDoc, requireTurkish: boolean): DiscoveredArticle[] {
    if (!doc.key || !doc.title) return [];

    const turkish = isTurkishOpenLibraryDoc(doc);
    if (requireTurkish && !turkish) return [];

    const description = openLibraryDescription(doc);
    return [
      {
        title: turkish ? `Türkçe katalog kaydı: ${doc.title}` : `Kitap katalog kaydı: ${doc.title}`,
        url: `https://openlibrary.org${doc.key}`,
        description: description || 'Open Library katalog kaydı bulundu.',
        sourceName: 'Open Library',
        sourceType: turkish ? 'open_library_catalog_tr' : 'open_library_catalog',
        imageUrl: openLibraryCoverUrl(doc.cover_i),
        publishedAt: openLibraryPublishedAt(doc),
      },
    ];
  }

  private userAgent() {
    const contact = String(process.env.OPEN_LIBRARY_CONTACT ?? '').trim();
    return contact ? `HeadsUp/0.1 (${contact})` : 'HeadsUp/0.1 personal-book-tracker';
  }
}
