import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { colors, Divider, fontFamily, fontFamilyMedium, Loading, SectionLabel } from '../ui';
import AppHeader from '../components/AppHeader';
import FilterChip from '../components/FilterChip';
import { FeedCard } from './FeedScreen';
import type { ArchiveResponse, WatchCategory } from '../types';

type Props = { onHome: () => void };

export default function ArchiveScreen({ onHome }: Props) {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<WatchCategory[]>([]);
  const [data, setData] = useState<ArchiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api<WatchCategory[]>('/watches/categories')
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void load();
  }, [page, category]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(page) });
      if (category) params.set('category', category);
      const result = await api<ArchiveResponse>(`/feed/archive?${params.toString()}`);
      setData(result);
      if (result.page !== page) setPage(result.page);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppHeader
          title="Haber Arşivi"
          subtitle="Geçmiş taramalarında ve önceki kontrollerde bulduğumuz kayıtlar burada. Her sayfada 3 içerik gösterilir."
          kicker="HEADSUP / ARCHIVE"
          onLogoPress={onHome}
        />

        <Divider />
        <SectionLabel>Kategori filtresi</SectionLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <FilterChip label="Tümü" selected={!category} onPress={() => { setCategory(null); setPage(1); }} />
          {categories.map(item => (
            <FilterChip
              key={item.name}
              label={item.name}
              selected={category?.toLocaleLowerCase('tr-TR') === item.name.toLocaleLowerCase('tr-TR')}
              onPress={() => { setCategory(item.name); setPage(1); }}
            />
          ))}
        </ScrollView>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <Loading label="Arşiv yükleniyor" />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => <FeedCard item={item} index={((data?.page ?? 1) - 1) * 3 + index} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyLine} />
              <Text style={styles.emptyTitle}>Henüz arşivlenmiş haber yok</Text>
              <Text style={styles.emptyText}>Ana gündemdeki son 12 haber arşiv sayılmaz.</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.pagination}>
              <Pressable
                disabled={(data?.page ?? 1) <= 1}
                onPress={() => setPage(current => Math.max(1, current - 1))}
                style={[styles.pageButton, (data?.page ?? 1) <= 1 && styles.pageButtonDisabled]}
              >
                <Text style={styles.pageButtonText}>Önceki</Text>
              </Pressable>

              <View style={styles.pageCounter}>
                <Text style={styles.pageCounterTop}>SAYFA</Text>
                <Text style={styles.pageCounterText}>{data?.page ?? 1} / {data?.totalPages ?? 1}</Text>
                <View style={styles.pageCounterLine} />
              </View>

              <Pressable
                disabled={(data?.page ?? 1) >= (data?.totalPages ?? 1)}
                onPress={() => setPage(current => current + 1)}
                style={[
                  styles.pageButton,
                  (data?.page ?? 1) >= (data?.totalPages ?? 1) && styles.pageButtonDisabled,
                ]}
              >
                <Text style={styles.pageButtonText}>Sonraki</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 13, alignSelf: 'flex-start' },
  backLine: { width: 24, height: 2, backgroundColor: colors.gold },
  backText: { fontFamily: fontFamilyMedium, color: colors.lightText, fontSize: 11, fontWeight: '800' },
  chips: { gap: 7, paddingTop: 9, paddingRight: 16 },
  list: { paddingHorizontal: 18, paddingBottom: 26 },
  error: { marginHorizontal: 18, color: colors.danger, fontFamily, fontSize: 11 },
  empty: {
    minHeight: 210,
    justifyContent: 'center',
    padding: 24,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  emptyLine: { width: 40, height: 2, backgroundColor: colors.gold, marginBottom: 13 },
  emptyTitle: { fontFamily: fontFamilyMedium, color: colors.ink, fontSize: 17, fontWeight: '800' },
  emptyText: { fontFamily, color: colors.inkSoft, fontSize: 11, marginTop: 6 },
  pagination: {
    marginTop: 7,
    marginBottom: 14,
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 10,
    borderRadius: 15,
    backgroundColor: '#26051F',
  },
  pageButton: {
    minWidth: 80,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#9C3B70',
    backgroundColor: '#681044',
  },
  pageButtonDisabled: { opacity: 0.35 },
  pageButtonText: { fontFamily: fontFamilyMedium, color: colors.lightText, fontSize: 11, fontWeight: '800' },
  pageCounter: { alignItems: 'center' },
  pageCounterTop: { fontFamily, color: colors.goldSoft, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  pageCounterText: { fontFamily: fontFamilyMedium, color: colors.lightText, fontSize: 12, fontWeight: '800', marginTop: 2 },
  pageCounterLine: { width: 26, height: 2, backgroundColor: colors.hotPink, marginTop: 5 },
});
