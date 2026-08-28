export type NotificationMode =
  | 'IMPORTANT_ONLY'
  | 'ALL_RELEVANT'
  | 'SELECTED_EVENTS'
  | 'OFF';

export type Category = 'GAME' | 'BOOK' | 'MOVIE_TV' | 'TECHNOLOGY' | 'GENERAL';

export type Watch = {
  id: string;
  prompt: string;
  topic: string;
  intent: string;
  category: Category;
  notificationMode: NotificationMode;
  active: boolean;
  lastCheckedAt?: string;
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
    publishedAt?: string;
  };
  watch: {
    id: string;
    topic: string;
    category: Category;
    notificationMode: NotificationMode;
  };
};
