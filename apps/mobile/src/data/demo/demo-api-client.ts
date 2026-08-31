import type {
  ArchiveResponse,
  FeedItem,
  NotificationMode,
  RunWatchResult,
  Watch,
  WatchCategory,
  WatchSuggestion,
} from '../../types';
import type { ApiClient } from '../api-client';
import { demoStore, type DemoStore } from './demo-store';
import type { DemoState } from './demo.types';

function body<T>(init?: RequestInit): T {
  if (!init?.body || typeof init.body !== 'string') return {} as T;
  return JSON.parse(init.body) as T;
}

function categoryFor(prompt: string) {
  const lower = prompt.toLocaleLowerCase('tr-TR');
  if (/kitap|roman|yazar|baskı|yayın/.test(lower)) return 'Kitap';
  if (/oyun|steam|playstation|xbox|nintendo/.test(lower)) return 'Oyun';
  if (/film|dizi|netflix|sinema/.test(lower)) return 'Film & Dizi';
  if (/typescript|javascript|yapay zeka|ai|teknoloji|yazılım/.test(lower)) return 'Teknoloji';
  return 'Diğer';
}

function topicFor(prompt: string) {
  return (
    prompt
      .replace(/\b(takip et|haber ver|bildir|gelişmeleri|gelişmelerini)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || prompt.slice(0, 120)
  );
}

export class DemoApiClient implements ApiClient {
  constructor(private readonly store: DemoStore = demoStore) {}

  async ensureSession() {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const method = (init.method ?? 'GET').toUpperCase();
    const url = new URL(path, 'https://headsup.demo');
    const segments = url.pathname.split('/').filter(Boolean);

    if (method === 'GET' && url.pathname === '/health') {
      return { ok: true, service: 'headsup-public-demo' } as T;
    }
    if (url.pathname === '/watches/categories' && method === 'GET') {
      return this.categories(this.store.load()) as T;
    }
    if (url.pathname === '/watches/suggest' && method === 'POST') {
      return this.suggest(body<{ prompt: string }>(init).prompt) as T;
    }
    if (url.pathname === '/watches' && method === 'GET') {
      return this.store.load().watches as T;
    }
    if (url.pathname === '/watches' && method === 'POST') {
      return this.createWatch(body(init)) as T;
    }
    if (segments[0] === 'watches' && segments[1] && segments[2] === 'run' && method === 'POST') {
      return this.runWatch(segments[1]) as T;
    }
    if (segments[0] === 'watches' && segments[1] && segments.length === 2 && method === 'PATCH') {
      return this.updateWatch(segments[1], body(init)) as T;
    }
    if (segments[0] === 'watches' && segments[1] && segments.length === 2 && method === 'DELETE') {
      return this.deleteWatch(segments[1]) as T;
    }
    if (url.pathname === '/feed/archive' && method === 'GET') {
      return this.archive(url) as T;
    }
    if (url.pathname === '/feed' && method === 'GET') {
      return this.feed(url) as T;
    }
    if (segments[0] === 'feed' && segments[1] && segments[2] === 'read' && method === 'PATCH') {
      return this.markRead(segments[1]) as T;
    }

    throw new Error(`Demo modu bu isteği desteklemiyor: ${method} ${url.pathname}`);
  }

  private categories(state: DemoState): WatchCategory[] {
    const counts = new Map<string, number>();
    for (const watch of state.watches)
      counts.set(watch.category, (counts.get(watch.category) ?? 0) + 1);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }

  private suggest(prompt = ''): WatchSuggestion {
    const clean = prompt.replace(/\s+/g, ' ').trim();
    return {
      originalPrompt: clean,
      correctedPrompt: clean,
      changed: false,
      topic: topicFor(clean),
      category: categoryFor(clean),
    };
  }

  private createWatch(input: {
    prompt?: string;
    notificationMode?: NotificationMode;
    topicHint?: string;
    categoryHint?: string;
    requiredTerms?: string[];
  }): Watch {
    const state = this.store.load();
    const prompt = String(input.prompt ?? '').trim();
    const watch: Watch = {
      id: `demo-watch-${Date.now()}`,
      prompt,
      topic: input.topicHint || topicFor(prompt),
      intent: prompt,
      category: input.categoryHint || categoryFor(prompt),
      requiredTerms: input.requiredTerms ?? [],
      notificationMode: input.notificationMode ?? 'IMPORTANT_ONLY',
      active: true,
      lastCheckedAt: null,
      _count: { watchArticles: 0 },
    };
    state.watches.unshift(watch);
    this.store.save(state);
    return watch;
  }

  private updateWatch(
    id: string,
    patch: Partial<
      Pick<Watch, 'active' | 'notificationMode' | 'category' | 'prompt' | 'requiredTerms'>
    >,
  ): Watch {
    const state = this.store.load();
    const index = state.watches.findIndex(watch => watch.id === id);
    if (index < 0) throw new Error('Takip bulunamadı.');

    const current = state.watches[index];
    const prompt = patch.prompt ?? current.prompt;
    const updated: Watch = {
      ...current,
      ...patch,
      prompt,
      topic: patch.prompt ? topicFor(prompt) : current.topic,
      intent: patch.prompt ? prompt : current.intent,
      lastCheckedAt:
        patch.prompt !== undefined || patch.requiredTerms !== undefined
          ? null
          : current.lastCheckedAt,
    };
    state.watches[index] = updated;
    state.feed = state.feed.map(item =>
      item.watch.id === id
        ? {
            ...item,
            watch: {
              ...item.watch,
              topic: updated.topic,
              category: updated.category,
              notificationMode: updated.notificationMode,
              requiredTerms: updated.requiredTerms,
            },
          }
        : item,
    );
    this.store.save(state);
    return updated;
  }

  private deleteWatch(id: string) {
    const state = this.store.load();
    state.watches = state.watches.filter(watch => watch.id !== id);
    state.feed = state.feed.filter(item => item.watch.id !== id);
    this.store.save(state);
    return { ok: true };
  }

  private runWatch(id: string): RunWatchResult {
    const state = this.store.load();
    const watch = state.watches.find(item => item.id === id);
    if (!watch) throw new Error('Takip bulunamadı.');
    if (!watch.active) {
      return { skipped: true, reason: 'paused', message: 'Takip duraklatılmış.' };
    }

    const now = new Date().toISOString();
    const item: FeedItem = {
      id: `demo-feed-run-${Date.now()}`,
      summary:
        'Manuel demo taraması örnek bir sonuç üretti. Public demo hiçbir gerçek API veya kişisel veriye bağlanmaz.',
      relevanceScore: 0.93,
      importanceScore: 0.81,
      isNewInformation: true,
      eventType: 'demo_scan',
      createdAt: now,
      article: {
        id: `demo-article-run-${Date.now()}`,
        title: `Demo tarama sonucu: ${watch.topic}`,
        canonicalUrl: 'https://github.com/KubraNurGursoyyy/Heads-Up',
        sourceName: 'HeadsUp Demo',
        publishedAt: now,
      },
      watch: {
        id: watch.id,
        topic: watch.topic,
        category: watch.category,
        notificationMode: watch.notificationMode,
        requiredTerms: watch.requiredTerms,
      },
    };

    state.feed.unshift(item);
    watch.lastCheckedAt = now;
    watch._count = { watchArticles: (watch._count?.watchArticles ?? 0) + 1 };
    this.store.save(state);
    return {
      queued: false,
      completed: true,
      discovered: 1,
      attached: 1,
      pushed: 0,
      historical: true,
    };
  }

  private feed(url: URL): FeedItem[] {
    let items = this.filteredFeed(url, this.store.load());
    const filter = url.searchParams.get('filter');
    if (filter === 'important') items = items.filter(item => item.importanceScore >= 0.72);
    if (filter === 'unread') items = items.filter(item => !item.readAt);
    return items.slice(0, 12);
  }

  private archive(url: URL): ArchiveResponse {
    const pageSize = 3 as const;
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);
    const state = this.store.load();
    const category = url.searchParams.get('category');
    let items = state.feed.slice(12);
    if (category) {
      items = items.filter(
        item =>
          item.watch.category.toLocaleLowerCase('tr-TR') === category.toLocaleLowerCase('tr-TR'),
      );
    }
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      page: safePage,
      pageSize,
      total,
      totalPages,
    };
  }

  private filteredFeed(url: URL, state: DemoState) {
    let items = [...state.feed].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const category = url.searchParams.get('category');
    const watchId = url.searchParams.get('watchId');
    if (category) {
      items = items.filter(
        item =>
          item.watch.category.toLocaleLowerCase('tr-TR') === category.toLocaleLowerCase('tr-TR'),
      );
    }
    if (watchId) items = items.filter(item => item.watch.id === watchId);
    return items;
  }

  private markRead(id: string) {
    const state = this.store.load();
    const item = state.feed.find(feedItem => feedItem.id === id);
    if (item) item.readAt = new Date().toISOString();
    this.store.save(state);
    return { ok: true };
  }
}
