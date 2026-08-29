import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../api';
import {
  colors,
  Divider,
  fontFamily,
  fontFamilyMedium,
  Loading,
  SectionLabel,
} from '../ui';
import AppHeader from '../components/AppHeader';
import FilterChip from '../components/FilterChip';
import TopicDropdown from '../components/TopicDropdown';
import { loadSettings, type FeedFilter } from '../settings';
import type { FeedItem, Watch, WatchCategory } from '../types';
import { buildFeedTopicOptions } from '../utils/feed-topics';

type Props = {
  onOpenArchive: () => void;
};

export default function FeedScreen({ onOpenArchive }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<WatchCategory[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (category) params.set('category', category);
    if (watchId) params.set('watchId', watchId);
    const text = params.toString();
    return text ? `?${text}` : '';
  }, [filter, category, watchId]);

  const sortedCategories = useMemo(
    () => categories.slice().sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })),
    [categories],
  );

  const topicOptions = useMemo(
    () => buildFeedTopicOptions(watches, category),
    [watches, category],
  );

  useEffect(() => {
    void loadSettings().then(settings => {
      setFilter(settings.defaultFeedFilter);
      setSettingsReady(true);
    });

    void Promise.all([
      api<WatchCategory[]>('/watches/categories'),
      api<Watch[]>('/watches'),
    ])
      .then(([categoryResult, watchResult]) => {
        setCategories(categoryResult);
        setWatches(watchResult);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    void loadFeed();
  }, [query, settingsReady]);

  async function loadFeed() {
    setLoading(true);
    setError(null);

    try {
      setItems(await api<FeedItem[]>(`/feed${query}`));
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerArea}>
        <AppHeader
          title="Gündem"
          subtitle="Takiplerinle ilgili bulduğumuz son 12 kayıt burada. Hepsi yeni olmak zorunda değil; yeni bir gelişme bulunduğunda en üste eklenir."
          kicker="HEADSUP / DISCOVERY FEED"
        />

        <View style={styles.headerControls}>
          <View style={styles.streamBadge}>
            <View style={styles.streamDot} />
            <Text style={styles.streamText}>SON KAYITLAR</Text>
          </View>

          <Pressable onPress={onOpenArchive} style={styles.archiveButton}>
            <Text style={styles.archiveButtonText}>Eski haberleri göster</Text>
            <View style={styles.archiveLine} />
          </Pressable>
        </View>

        <Divider />

        <SectionLabel>Kategoriler</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label="Tümü"
            selected={category === null}
            onPress={() => {
              setCategory(null);
              setWatchId(null);
            }}
          />
          {sortedCategories.map(item => (
            <FilterChip
              key={item.name}
              label={`${item.name} ${item.count}`}
              selected={category?.toLocaleLowerCase('tr-TR') === item.name.toLocaleLowerCase('tr-TR')}
              onPress={() => {
                setCategory(item.name);
                setWatchId(null);
              }}
            />
          ))}
        </ScrollView>

        <View style={styles.topicSection}>
          <View style={styles.topicSectionHeader}>
            <SectionLabel>Başlıklar</SectionLabel>
            <Text style={styles.topicSectionMeta}>
              {category ? `${category} içindeki takipler` : 'Tüm takipler'} · alfabetik
            </Text>
          </View>

          <TopicDropdown
            options={topicOptions.map(watch => ({ id: watch.id, label: watch.topic }))}
            selectedId={watchId}
            onChange={setWatchId}
            allLabel="Hepsi"
          />
        </View>

        <View style={styles.filtersRow}>
          <SectionLabel>Görünüm</SectionLabel>
          <View style={styles.filters}>
            <FilterChip label="Hepsi" selected={filter === 'all'} onPress={() => setFilter('all')} />
            <FilterChip label="Önemli" selected={filter === 'important'} onPress={() => setFilter('important')} />
            <FilterChip label="Okunmamış" selected={filter === 'unread'} onPress={() => setFilter('unread')} />
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadFeed()}>
            <Text style={styles.retryText}>Tekrar dene</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <Loading label="Kayıtlar yükleniyor" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyFeed />}
          renderItem={({ item, index }) => <FeedCard item={item} index={index} />}
          ListFooterComponent={
            items.length ? (
              <Pressable onPress={onOpenArchive} style={styles.footerArchive}>
                <View style={styles.footerArchiveRule} />
                <Text style={styles.footerArchiveTitle}>Eski haberleri göster</Text>
                <Text style={styles.footerArchiveMeta}>Arşiv · 3 kayıt / sayfa</Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </View>
  );
}

export function FeedCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  async function open() {
    try {
      await api(`/feed/${item.id}/read`, { method: 'PATCH' });
    } catch {
      // Haberi açmayı engelleme.
    }
    await Linking.openURL(item.article.canonicalUrl);
  }

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardRail} />
      <View style={styles.cardBody}>
        {item.article.imageUrl && !imageFailed ? (
          <View style={styles.mediaFrame}>
            <Image
              source={{ uri: item.article.imageUrl }}
              resizeMode="cover"
              style={styles.mediaImage}
              onError={() => setImageFailed(true)}
            />
            <View style={styles.mediaGoldRule} />
          </View>
        ) : null}

        <View style={styles.cardTop}>
          <Text style={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={styles.cardTopRule} />
          <Text style={styles.categoryText}>{item.watch.category.toLocaleUpperCase('tr-TR')}</Text>
        </View>

        <Text style={styles.topicText}>{item.watch.topic}</Text>
        <Text style={styles.articleTitle}>{item.article.title}</Text>
        <Text style={styles.summary}>{item.summary}</Text>

        <View style={styles.footer}>
          <Text style={styles.source}>{item.article.sourceName || 'Kaynak'}</Text>
          <View style={styles.footerSeparator} />
          <Text style={styles.date}>{formatFeedDate(item.article.publishedAt ?? item.createdAt)}</Text>
          <View style={styles.footerGoldLine} />
          <Text style={styles.open}>Aç</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function formatFeedDate(value?: string | null) {
  if (!value) return 'Tarih yok';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tarih yok';

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function EmptyFeed() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyGold} />
      <Text style={styles.emptyKicker}>NO MATCHING RECORD</Text>
      <Text style={styles.emptyTitle}>Bu görünümde kayıt yok</Text>
      <Text style={styles.emptyText}>
        Yeni bir gelişme bulunduğunda veya geçmiş taramasında ilgili bir kayıt keşfedildiğinde burada görünür.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerArea: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  streamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    minHeight: 28,
    borderWidth: 1,
    borderColor: 'rgba(236,217,167,0.48)',
    borderRadius: 7,
    backgroundColor: 'rgba(92,15,66,0.62)',
  },
  streamDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold },
  streamText: {
    fontFamily: fontFamilyMedium,
    color: colors.lightText,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.15,
  },
  archiveButton: { alignItems: 'flex-end', paddingVertical: 4 },
  archiveButtonText: {
    fontFamily: fontFamilyMedium,
    color: colors.lightText,
    fontSize: 11,
    fontWeight: '800',
  },
  archiveLine: { width: 52, height: 2, backgroundColor: colors.gold, marginTop: 5 },
  chips: { gap: 7, paddingTop: 9, paddingRight: 18 },
  topicSection: { marginTop: 15 },
  topicSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  topicSectionMeta: {
    flexShrink: 1,
    fontFamily,
    color: '#D9AFC5',
    fontSize: 8,
    textAlign: 'right',
  },
  filtersRow: { marginTop: 15 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  errorBox: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#B85A83',
    borderRadius: 9,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  errorText: { flex: 1, fontFamily, color: colors.danger, fontSize: 11 },
  retryText: { fontFamily: fontFamilyMedium, color: colors.ink, fontSize: 11, fontWeight: '800' },
  list: { paddingHorizontal: 18, paddingBottom: 28 },
  card: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#160511',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 5,
  },
  cardPressed: { opacity: 0.87, transform: [{ scale: 0.992 }] },
  cardRail: { width: 5, backgroundColor: colors.magenta },
  cardBody: { flex: 1, padding: 16 },
  mediaFrame: {
    height: 118,
    marginBottom: 13,
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceMuted,
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaGoldRule: {
    position: 'absolute',
    left: 12,
    bottom: 0,
    width: 46,
    height: 3,
    backgroundColor: colors.gold,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  cardIndex: {
    fontFamily: fontFamilyMedium,
    color: colors.magenta,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardTopRule: { flex: 1, height: 1, backgroundColor: colors.border },
  categoryText: {
    fontFamily: fontFamilyMedium,
    color: colors.wine,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topicText: {
    fontFamily,
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
  },
  articleTitle: {
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: -0.28,
  },
  summary: {
    fontFamily,
    color: colors.inkSoft,
    marginTop: 7,
    lineHeight: 19,
    fontSize: 12,
  },
  footer: {
    marginTop: 13,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  source: { flex: 1, fontFamily, color: colors.inkMuted, fontSize: 9 },
  footerSeparator: { width: 1, height: 12, backgroundColor: colors.borderStrong },
  date: { fontFamily: fontFamilyMedium, color: colors.ink, fontSize: 9, fontWeight: '700' },
  footerGoldLine: { width: 17, height: 2, backgroundColor: colors.gold },
  open: { fontFamily: fontFamilyMedium, color: colors.magenta, fontSize: 10, fontWeight: '800' },
  empty: {
    minHeight: 230,
    justifyContent: 'center',
    padding: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  emptyGold: { width: 42, height: 2, backgroundColor: colors.gold, marginBottom: 13 },
  emptyKicker: {
    fontFamily: fontFamilyMedium,
    color: colors.magenta,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  emptyTitle: {
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 7,
  },
  emptyText: { fontFamily, color: colors.inkSoft, marginTop: 7, fontSize: 12, lineHeight: 18 },
  footerArchive: {
    marginTop: 4,
    marginBottom: 18,
    padding: 16,
    borderRadius: 11,
    backgroundColor: '#5A0D42',
    borderWidth: 1,
    borderColor: 'rgba(236,217,167,0.42)',
  },
  footerArchiveRule: { width: 42, height: 2, backgroundColor: colors.gold, marginBottom: 10 },
  footerArchiveTitle: { fontFamily: fontFamilyMedium, color: colors.lightText, fontSize: 14, fontWeight: '800' },
  footerArchiveMeta: { fontFamily, color: '#D9AFC5', fontSize: 10, marginTop: 3 },
});
