import type { FeedItem, NotificationMode, Watch } from '../../types';
import type { DemoState } from './demo.types';

const REPO_URL = 'https://github.com/KubraNurGursoyyy/Heads-Up';

function isoHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const watches: Watch[] = [
  {
    id: 'demo-watch-game',
    prompt: 'Hades II ile ilgili çıkış tarihi ve büyük güncellemeleri takip et.',
    topic: 'Hades II',
    intent: 'Hades II ile ilgili çıkış tarihi ve büyük güncellemeleri takip et.',
    category: 'Oyun',
    requiredTerms: ['Hades II'],
    notificationMode: 'IMPORTANT_ONLY',
    active: true,
    lastCheckedAt: isoHoursAgo(2),
    _count: { watchArticles: 7 },
  },
  {
    id: 'demo-watch-book',
    prompt: 'Stacy Schiff Kleopatra kitabının Türkçe baskısıyla ilgili gelişmeleri takip et.',
    topic: 'Stacy Schiff - Kleopatra',
    intent: 'Türkçe baskı ve erişilebilirlik gelişmelerini takip et.',
    category: 'Kitap',
    requiredTerms: ['Schiff', 'Kleopatra'],
    notificationMode: 'ALL_RELEVANT',
    active: true,
    lastCheckedAt: isoHoursAgo(5),
    _count: { watchArticles: 6 },
  },
  {
    id: 'demo-watch-tech',
    prompt: 'TypeScript yeni sürüm ve önemli duyurularını takip et.',
    topic: 'TypeScript',
    intent: 'Yeni sürüm ve önemli duyuruları takip et.',
    category: 'Teknoloji',
    requiredTerms: [],
    notificationMode: 'SELECTED_EVENTS',
    active: true,
    lastCheckedAt: isoHoursAgo(8),
    _count: { watchArticles: 5 },
  },
];

const templates: Array<{
  watch: Watch;
  title: string;
  summary: string;
  source: string;
  importance: number;
}> = [
  {
    watch: watches[0],
    title: 'Demo kayıt: Hades II için büyük içerik güncellemesi duyuruldu',
    summary:
      'Bu içerik gerçek zamanlı haber değildir; public demo akışını göstermek için hazırlanmış örnek kayıttır.',
    source: 'HeadsUp Demo',
    importance: 0.91,
  },
  {
    watch: watches[1],
    title: 'Demo kayıt: Kleopatra için Türkçe baskı katalog kaydı güncellendi',
    summary:
      'Demo modunda kitap takibinin kategori ve kesin kelime eşleşmesini göstermek için örnek veri kullanılır.',
    source: 'HeadsUp Demo',
    importance: 0.78,
  },
  {
    watch: watches[2],
    title: 'Demo kayıt: TypeScript için yeni sürüm notları yayımlandı',
    summary:
      'Bu örnek kart, teknik bir takipte önem puanı ve okunma durumunun nasıl göründüğünü gösterir.',
    source: 'HeadsUp Demo',
    importance: 0.86,
  },
];

function makeFeedItem(index: number): FeedItem {
  const template = templates[index % templates.length];
  const createdAt = isoHoursAgo(index * 9 + 1);
  return {
    id: `demo-feed-${index + 1}`,
    summary: template.summary,
    relevanceScore: 0.9,
    importanceScore: Math.max(0.55, template.importance - (index % 4) * 0.04),
    isNewInformation: index < 8,
    eventType: index % 3 === 0 ? 'announcement' : 'update',
    readAt: index % 4 === 0 ? createdAt : undefined,
    createdAt,
    article: {
      id: `demo-article-${index + 1}`,
      title: `${template.title}${index > 2 ? ` · ${index + 1}` : ''}`,
      description: template.summary,
      canonicalUrl: REPO_URL,
      sourceName: template.source,
      publishedAt: createdAt,
    },
    watch: {
      id: template.watch.id,
      topic: template.watch.topic,
      category: template.watch.category,
      notificationMode: template.watch.notificationMode as NotificationMode,
      requiredTerms: template.watch.requiredTerms,
    },
  };
}

export function createDemoState(): DemoState {
  return {
    version: 2,
    watches: watches.map(watch => ({
      ...watch,
      _count: watch._count ? { ...watch._count } : undefined,
    })),
    feed: Array.from({ length: 18 }, (_, index) => makeFeedItem(index)),
  };
}
