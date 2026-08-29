import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Button, colors, Divider, fontFamily, Loading, SectionLabel } from '../ui';
import AppHeader from '../components/AppHeader';
import SoftProgressBar from '../components/SoftProgressBar';
import FilterChip from '../components/FilterChip';
import ConfirmModal from '../components/ConfirmModal';
import CategoryPickerModal from '../components/CategoryPickerModal';
import {
  applyWatchUpdate,
  formatRunResult,
  isWatchPreparing,
  removeWatchFromList,
} from '../utils/watch-ui';
import type { NotificationMode, RunWatchResult, Watch, WatchCategory } from '../types';

const modes: NotificationMode[] = [
  'IMPORTANT_ONLY',
  'ALL_RELEVANT',
  'SELECTED_EVENTS',
  'OFF',
];

function modeLabel(mode: NotificationMode) {
  const labels: Record<NotificationMode, string> = {
    IMPORTANT_ONLY: 'Sadece önemli',
    ALL_RELEVANT: 'Her haberde',
    SELECTED_EVENTS: 'Seçili olaylarda',
    OFF: 'Kapalı',
  };
  return labels[mode];
}

export default function WatchesScreen() {
  const [data, setData] = useState<Watch[]>([]);
  const [categories, setCategories] = useState<WatchCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Watch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryTarget, setCategoryTarget] = useState<Watch | null>(null);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [runStatus, setRunStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);

    try {
      const [watches, categoryList] = await Promise.all([
        api<Watch[]>('/watches'),
        api<WatchCategory[]>('/watches/categories'),
      ]);
      setData(watches);
      setCategories(categoryList);
    } catch (loadError) {
      if (!silent) setError((loadError as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!data.some(isWatchPreparing)) return;
    const timer = setInterval(() => void load(true), 5000);
    return () => clearInterval(timer);
  }, [data]);

  async function patch(
    watch: Watch,
    body: Partial<Pick<Watch, 'active' | 'notificationMode' | 'category'>>,
  ) {
    try {
      setError(null);
      const updated = await api<Watch>(`/watches/${watch.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setData(current => applyWatchUpdate(current, updated));
      if (body.category !== undefined) {
        const categoryList = await api<WatchCategory[]>('/watches/categories');
        setCategories(categoryList);
      }
    } catch (patchError) {
      setError((patchError as Error).message);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    const target = deleteTarget;

    try {
      setDeleting(true);
      setError(null);
      await api(`/watches/${target.id}`, { method: 'DELETE' });
      setData(current => removeWatchFromList(current, target.id));
      setDeleteTarget(null);
      const categoryList = await api<WatchCategory[]>('/watches/categories');
      setCategories(categoryList);
    } catch (deleteError) {
      setError(`Takip silinemedi: ${(deleteError as Error).message}`);
    } finally {
      setDeleting(false);
    }
  }

  async function runNow(watch: Watch) {
    if (running[watch.id]) return;

    try {
      setRunning(current => ({ ...current, [watch.id]: true }));
      setRunStatus(current => ({ ...current, [watch.id]: '' }));
      setError(null);

      const result = await api<RunWatchResult>(`/watches/${watch.id}/run`, {
        method: 'POST',
      });

      setRunStatus(current => ({
        ...current,
        [watch.id]: formatRunResult(result),
      }));
      await load(true);
    } catch (runError) {
      setRunStatus(current => ({
        ...current,
        [watch.id]: `Tarama başarısız: ${(runError as Error).message}`,
      }));
    } finally {
      setRunning(current => ({ ...current, [watch.id]: false }));
    }
  }

  return (
    <>
      <View style={styles.root}>
        <View style={styles.header}>
          <AppHeader
            title="Takiplerim"
            subtitle="Aktif takipleri yönet, kategoriyi değiştir veya istediğin an manuel tarama başlat."
            kicker="HEADSUP / WATCH CONTROL"
          />
        </View>

        {error ? (
          <View style={styles.globalError}>
            <Text style={styles.globalErrorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <Loading label="Takipler yükleniyor" />
        ) : (
          <FlatList
            data={data}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <SectionLabel>{`${data.length} aktif kayıt / kontrol paneli`}</SectionLabel>
              </View>
            }
            ListEmptyComponent={<EmptyWatches />}
            renderItem={({ item, index }) => (
              <View style={styles.card}>
                <View style={styles.cardTopLine}>
                  <Text style={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <View style={styles.topRule} />
                  <View style={styles.topGoldRule} />
                </View>

                <View style={styles.titleRow}>
                  <View style={styles.titleArea}>
                    <Text style={styles.title}>{item.topic}</Text>
                    <Text style={styles.intent}>{item.intent}</Text>
                  </View>

                  <View style={[styles.statusBadge, !item.active && styles.statusBadgePaused]}>
                    <View style={[styles.statusDot, !item.active && styles.statusDotPaused]} />
                    <Text style={styles.statusText}>{item.active ? 'AKTİF' : 'DURAKLATILDI'}</Text>
                  </View>
                </View>

                <Divider />

                <View style={styles.metaGrid}>
                  <Pressable onPress={() => setCategoryTarget(item)} style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>KATEGORİ / DEĞİŞTİR</Text>
                    <Text style={styles.metaValue}>{item.category}</Text>
                  </Pressable>

                  <View style={styles.verticalDivider} />

                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>HABER</Text>
                    <Text style={styles.metaValue}>{item._count?.watchArticles ?? 0}</Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>BİLDİRİM</Text>
                    <Text style={styles.metaValueSmall}>{modeLabel(item.notificationMode)}</Text>
                  </View>
                </View>

                {isWatchPreparing(item) ? (
                  <View style={styles.preparing}>
                    <SoftProgressBar label="İlk tarama arka planda hazırlanıyor. Bu ekranda kalman gerekmez." />
                  </View>
                ) : null}

                {running[item.id] ? (
                  <View style={styles.preparing}>
                    <SoftProgressBar label="Kaynaklar şimdi taranıyor. İşlem doğrudan backend üzerinde çalışıyor." />
                  </View>
                ) : null}

                {runStatus[item.id] ? (
                  <View style={styles.runResult}>
                    <View style={styles.runResultLine} />
                    <Text style={styles.runResultText}>{runStatus[item.id]}</Text>
                  </View>
                ) : null}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.modeRow}
                >
                  {modes.map(value => (
                    <FilterChip
                      key={value}
                      label={modeLabel(value)}
                      selected={value === item.notificationMode}
                      onPress={() => void patch(item, { notificationMode: value })}
                    />
                  ))}
                </ScrollView>

                <View style={styles.actionsDivider} />

                <View style={styles.actions}>
                  <Button
                    secondary
                    title={item.active ? 'Duraklat' : 'Devam et'}
                    onPress={() => void patch(item, { active: !item.active })}
                    style={styles.action}
                  />
                  <Button
                    secondary
                    title={running[item.id] ? 'Taranıyor...' : 'Şimdi tara'}
                    disabled={Boolean(running[item.id]) || !item.active}
                    onPress={() => void runNow(item)}
                    style={styles.action}
                  />
                  <Button
                    danger
                    title="Sil"
                    onPress={() => setDeleteTarget(item)}
                    style={styles.action}
                  />
                </View>
              </View>
            )}
          />
        )}
      </View>

      <ConfirmModal
        visible={Boolean(deleteTarget)}
        title="Takibi sil"
        message={deleteTarget ? `“${deleteTarget.topic}” takibi ve bu takibe bağlı kayıtlar silinsin mi?` : ''}
        busy={deleting}
        onCancel={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      <CategoryPickerModal
        visible={Boolean(categoryTarget)}
        current={categoryTarget?.category}
        categories={categories}
        onClose={() => setCategoryTarget(null)}
        onSelect={category => {
          if (categoryTarget) void patch(categoryTarget, { category });
        }}
      />
    </>
  );
}

function EmptyWatches() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyLine} />
      <Text style={styles.emptyKicker}>WATCH LIST</Text>
      <Text style={styles.emptyTitle}>Henüz takip yok</Text>
      <Text style={styles.emptyText}>Yeni Takip bölümünden ilk konunu ekleyebilirsin.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  globalError: {
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 11,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: '#D98BAA',
  },
  globalErrorText: {
    fontFamily,
    color: colors.danger,
    fontSize: 11,
    lineHeight: 16,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  listHeader: { paddingBottom: 9 },
  card: {
    padding: 17,
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: colors.wine,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 3,
  },
  cardTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIndex: {
    fontFamily,
    color: colors.magenta,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginRight: 8,
  },
  topRule: { flex: 1, height: 1, backgroundColor: colors.border },
  topGoldRule: { width: 26, height: 2, backgroundColor: colors.gold },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleArea: { flex: 1 },
  title: {
    fontFamily,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.45,
  },
  intent: {
    fontFamily,
    color: colors.inkSoft,
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    minHeight: 26,
    borderRadius: 8,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: '#EFB6D2',
  },
  statusBadgePaused: { backgroundColor: '#F7F2F5', borderColor: '#D8CAD1' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.magenta },
  statusDotPaused: { backgroundColor: '#9F8D96' },
  statusText: {
    fontFamily,
    color: colors.ink,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metaBlock: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 5,
  },
  verticalDivider: { width: 1, backgroundColor: colors.border },
  metaLabel: {
    fontFamily,
    color: colors.inkMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontFamily,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  metaValueSmall: {
    fontFamily,
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 14,
  },
  preparing: { marginTop: 13 },
  runResult: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runResultLine: { width: 22, height: 2, backgroundColor: colors.gold },
  runResultText: {
    flex: 1,
    fontFamily,
    color: colors.inkSoft,
    fontSize: 10,
    lineHeight: 15,
  },
  modeRow: {
    gap: 7,
    paddingTop: 14,
    paddingRight: 12,
  },
  actionsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 14,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 7,
  },
  action: {
    flexGrow: 1,
    minWidth: 92,
    minHeight: 42,
    marginTop: 0,
  },
  empty: {
    minHeight: 250,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 26,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  emptyLine: { width: 44, height: 2, backgroundColor: colors.gold, marginBottom: 14 },
  emptyKicker: {
    fontFamily,
    color: colors.magenta,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  emptyTitle: {
    fontFamily,
    color: colors.ink,
    fontWeight: '800',
    fontSize: 20,
    marginTop: 7,
  },
  emptyText: {
    fontFamily,
    color: colors.inkSoft,
    lineHeight: 19,
    marginTop: 7,
    fontSize: 12,
  },
});
