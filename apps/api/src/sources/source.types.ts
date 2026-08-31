import type { SearchRequest } from './search-plan';

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
  requiredTerms?: string[];
  historical?: boolean;
};

export type BookDiscoveryInput = Pick<DiscoverOptions, 'topic' | 'prompt' | 'category' | 'aliases'>;
