import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../api';
import { Loading } from '../ui';
import AppHeader from '../components/AppHeader';
import FilterChip from '../components/FilterChip';
import type { FeedItem, WatchCategory } from '../types';

type FeedFilter = 'all' | 'important' | 'unread';

export default function FeedScreen() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [categories, setCategories] = useState<WatchCategory[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();

    if (filter !== 'all') params.set('filter', filter);
    if (category) params.set('category', category);

    const text = params.toString();
    return text ? `?${text}` : '';
  }, [filter, category]);

  async function loadFeed() {
    setLoading(true);

    try {
      setItems(await api<FeedItem[]>(`/feed${query}`));
    } catch (error) {
      Alert.alert('Haberler yüklenemedi', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const result = await api<WatchCategory[]>('/watches/categories');
      setCategories(result);

      if (category && !result.some(item => item.name.toLocaleLowerCase('tr-TR') === category.toLocaleLowerCase('tr-TR'))) {
        setCategory(null);
      }
    } catch {
      // Feed çalışmaya devam etsin; kategori filtresi yardımcı bir özellik.
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [query]);

  return (
    <View style={styles.root}>
      <View style={styles.headerArea}>
        <AppHeader
          title="Bugün neler var?"
          subtitle="Takip ettiğin konulardaki yeni gelişmeler."
        />

        <Text style={styles.sectionTitle}>Kategoriler</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label="Tümü"
            selected={category === null}
            onPress={() => setCategory(null)}
          />

          {categories.map(item => (
            <FilterChip
              key={item.name}
              label={item.name}
              selected={category?.toLocaleLowerCase('tr-TR') === item.name.toLocaleLowerCase('tr-TR')}
              onPress={() => setCategory(item.name)}
            />
          ))}
        </ScrollView>

        <View style={styles.filters}>
          <FilterChip label="Hepsi" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Önemli" selected={filter === 'important'} onPress={() => setFilter('important')} />
          <FilterChip label="Yeni" selected={filter === 'unread'} onPress={() => setFilter('unread')} />
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyFeed />}
          renderItem={({ item }) => <FeedCard item={item} />}
        />
      )}
    </View>
  );
}

function EmptyFeed() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <View style={styles.emptyMarkLarge} />
        <View style={styles.emptyMarkSmall} />
      </View>

      <Text style={styles.emptyTitle}>Şimdilik sessiz</Text>
      <Text style={styles.emptyText}>
        Takip ettiğin konularda yeni bir gelişme olduğunda burada göreceksin.
      </Text>
    </View>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
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
      <View style={styles.cardTop}>
        <View style={styles.topic}>
          <Text style={styles.topicText}>{item.watch.topic}</Text>
        </View>

        <Text style={styles.categoryText}>{item.watch.category}</Text>
      </View>

      <Text style={styles.articleTitle}>{item.article.title}</Text>
      <Text style={styles.summary}>{item.summary}</Text>

      <View style={styles.footer}>
        <Text style={styles.source}>{item.article.sourceName || 'Kaynak'}</Text>
        <Text style={styles.importance}>Önem %{Math.round(item.importanceScore * 100)}</Text>
        <Text style={styles.open}>Haberi aç</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },

  sectionTitle: {
    color: '#4F3543',
    fontWeight: '800',
    fontSize: 13,
  },

  chips: {
    gap: 8,
    paddingTop: 9,
    paddingRight: 18,
  },

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  card: {
    padding: 18,
    marginBottom: 13,
    borderRadius: 21,
    backgroundColor: '#FFFCFD',
    borderWidth: 1,
    borderColor: '#F0D6E0',
    shadowColor: '#6A4556',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 11,
  },

  topic: {
    flexShrink: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FAE4EC',
  },

  topicText: {
    color: '#944A68',
    fontSize: 12,
    fontWeight: '800',
  },

  categoryText: {
    color: '#A18491',
    fontSize: 11,
    fontWeight: '700',
  },

  articleTitle: {
    color: '#4F3543',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },

  summary: {
    color: '#896B79',
    marginTop: 8,
    lineHeight: 20,
    fontSize: 14,
  },

  footer: {
    marginTop: 14,
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5E5EB',
  },

  source: {
    flex: 1,
    color: '#AE96A1',
    fontSize: 11,
  },

  importance: {
    color: '#99717F',
    fontSize: 11,
    fontWeight: '700',
  },

  open: {
    color: '#A95073',
    fontSize: 11,
    fontWeight: '800',
  },

  empty: {
    minHeight: 235,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#FFFCFD',
    borderWidth: 1,
    borderColor: '#F0D6E0',
  },

  emptyMark: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FAE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },

  emptyMarkLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C76A8E',
  },

  emptyMarkSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2B3C5',
    marginTop: 5,
  },

  emptyTitle: {
    color: '#4F3543',
    fontSize: 19,
    fontWeight: '800',
  },

  emptyText: {
    color: '#896B79',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 280,
  },
});
