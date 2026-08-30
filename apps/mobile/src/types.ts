export type NotificationMode = 'IMPORTANT_ONLY' | 'ALL_RELEVANT' | 'SELECTED_EVENTS' | 'OFF';

export type Category = string;

export type WatchCategory = {
  name: string;
  count: number;
};

export type WatchSuggestion = {
  originalPrompt: string;
  correctedPrompt: string;
  changed: boolean;
  topic: string;
  category: string;
};

export type Watch = {
  id: string;
  prompt: string;
  topic: string;
  intent: string;
  category: Category;
  requiredTerms?: string[] | null;
  notificationMode: NotificationMode;
  active: boolean;
  lastCheckedAt?: string | null;
  _count?: { watchArticles: number };
};

export type FeedItem = {
  id: string;
  summary: string;
  relevanceScore: number;
  importanceScore: number;
  isNewInformation: boolean;
  eventType?: string;
  readAt?: string;
  createdAt: string;
  article: {
    id: string;
    title: string;
    description?: string;
    canonicalUrl: string;
    sourceName?: string;
    imageUrl?: string;
    publishedAt?: string;
  };
  watch: {
    id: string;
    topic: string;
    category: Category;
    notificationMode: NotificationMode;
    requiredTerms?: string[] | null;
  };
};

export type ArchiveResponse = {
  items: FeedItem[];
  page: number;
  pageSize: 3;
  total: number;
  totalPages: number;
};

export type RunWatchResult = {
  queued?: boolean;
  completed?: boolean;
  skipped?: boolean;
  reason?: string;
  message?: string;
  discovered?: number;
  attached?: number;
  pushed?: number;
  historical?: boolean;
};
