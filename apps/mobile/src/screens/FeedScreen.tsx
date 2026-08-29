import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

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

import type {
  Category,
  FeedItem,
} from '../types';

type FeedFilter =
  | 'all'
  | 'important'
  | 'unread';

const categories: Array<
  [Category | 'ALL', string]
> = [
  ['ALL', 'Tümü'],
  ['GAME', 'Oyun'],
  ['BOOK', 'Kitap'],
  ['MOVIE_TV', 'Film & Dizi'],
  ['TECHNOLOGY', 'Teknoloji'],
  ['GENERAL', 'Diğer'],
];

export default function FeedScreen() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] =
    useState<FeedFilter>('all');

  const [category, setCategory] =
    useState<Category | 'ALL'>('ALL');

  const [loading, setLoading] =
    useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();

    if (filter !== 'all') {
      params.set('filter', filter);
    }

    if (category !== 'ALL') {
      params.set('category', category);
    }

    const text = params.toString();

    return text ? `?${text}` : '';
  }, [filter, category]);

  async function load() {
    setLoading(true);

    try {
      setItems(
        await api<FeedItem[]>(`/feed${query}`),
      );
    } catch (error) {
      Alert.alert(
        'Haberler yüklenemedi',
        (error as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [query]);

  return (
    <View style={styles.root}>
      <View style={styles.headerArea}>
        <AppHeader
          title="Bugün neler oldu?"
          subtitle="Takip ettiklerindeki gelişmeler"
        />

        <Text style={styles.sectionTitle}>
          Kategoriler
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {categories.map(([value, label]) => (
            <FilterChip
              key={value}
              label={label}
              selected={category === value}
              onPress={() => setCategory(value)}
            />
          ))}
        </ScrollView>

        <View style={styles.filters}>
          <FilterChip
            label="Hepsi"
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />

          <FilterChip
            label="Önemli"
            selected={filter === 'important'}
            onPress={() => setFilter('important')}
          />

          <FilterChip
            label="Yeni"
            selected={filter === 'unread'}
            onPress={() => setFilter('unread')}
          />
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
          renderItem={({ item }) => (
            <FeedCard item={item} />
          )}
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

      <Text style={styles.emptyTitle}>
        Şimdilik sessiz
      </Text>

      <Text style={styles.emptyText}>
        Takip ettiğin konularda yeni bir gelişme olduğunda burada göreceksin.
      </Text>
    </View>
  );
}

function FeedCard({
  item,
}: {
  item: FeedItem;
}) {
  async function open() {
    try {
      await api(`/feed/${item.id}/read`, {
        method: 'PATCH',
      });
    } catch {}

    await Linking.openURL(
      item.article.canonicalUrl,
    );
  }

  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.topic}>
          <Text style={styles.topicText}>
            {item.watch.topic}
          </Text>
        </View>

        <View style={styles.score}>
          <Text style={styles.scoreText}>
            ✦{' '}
            {Math.round(
              item.importanceScore * 100,
            )}
          </Text>
        </View>
      </View>

      <Text style={styles.articleTitle}>
        {item.article.title}
      </Text>

      <Text style={styles.summary}>
        {item.summary}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.source}>
          {item.article.sourceName || 'Kaynak'}
        </Text>

        <Text style={styles.open}>
          Haberi aç →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
emptyMark: {
  width: 54,
  height: 54,

  borderRadius: 27,

  backgroundColor: '#FAE4EC',

  alignItems: 'center',
  justifyContent: 'center',

  marginBottom: 4,
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

  headerArea: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },

  sectionTitle: {
    color: '#563749',
    fontWeight: '800',
    fontSize: 14,
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
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  card: {
    padding: 17,
    marginBottom: 14,

    borderRadius: 26,

    backgroundColor: 'rgba(255,255,255,0.92)',

    borderWidth: 1,
    borderColor: '#FFD2E4',

    elevation: 3,
  },

  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  topic: {
    maxWidth: '72%',

    paddingHorizontal: 11,
    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor: '#FFE8F1',
  },

  topicText: {
    color: '#D9528B',
    fontSize: 12,
    fontWeight: '800',
  },

  score: {
    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 999,

    backgroundColor: '#FFE6A6',
  },

  scoreText: {
    color: '#906A24',
    fontSize: 12,
    fontWeight: '800',
  },

  articleTitle: {
    color: '#563749',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 23,
  },

  summary: {
    color: '#936C80',
    marginTop: 8,
    lineHeight: 20,
  },

  footer: {
    marginTop: 14,
    paddingTop: 11,

    flexDirection: 'row',
    justifyContent: 'space-between',

    borderTopWidth: 1,
    borderTopColor: '#FFE8F1',
  },

  source: {
    color: '#B28A9F',
    fontSize: 12,
  },

  open: {
    color: '#D9528B',
    fontSize: 12,
    fontWeight: '800',
  },

  empty: {
    minHeight: 250,

    borderRadius: 30,

    alignItems: 'center',
    justifyContent: 'center',

    padding: 28,

    backgroundColor: 'rgba(255,255,255,0.76)',

    borderWidth: 1,
    borderColor: '#FFD2E4',
  },

  emptyTitle: {
    color: '#563749',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 7,
  },

  emptyText: {
    color: '#936C80',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});