import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NotificationMode, Watch } from '../types';
import type { WatchPatch } from '../hooks/use-watches';
import { Button, colors, Divider, fontFamily } from '../ui';
import FilterChip from './FilterChip';
import HighlightedTopic from './HighlightedTopic';
import SoftProgressBar from './SoftProgressBar';
import { isWatchPreparing } from '../utils/watch-ui';

const modes: NotificationMode[] = ['IMPORTANT_ONLY', 'ALL_RELEVANT', 'SELECTED_EVENTS', 'OFF'];
const labels: Record<NotificationMode, string> = {
  IMPORTANT_ONLY: 'Sadece önemli',
  ALL_RELEVANT: 'Her haberde',
  SELECTED_EVENTS: 'Seçili olaylarda',
  OFF: 'Kapalı',
};

type Props = {
  watch: Watch;
  index: number;
  running: boolean;
  runStatus?: string;
  onCategory: () => void;
  onEdit: () => void;
  onPatch: (patch: WatchPatch) => void;
  onRun: () => void;
  onDelete: () => void;
};

export default function WatchCard({
  watch,
  index,
  running,
  runStatus,
  onCategory,
  onEdit,
  onPatch,
  onRun,
  onDelete,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopLine}>
        <Text style={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={styles.topRule} />
        <View style={styles.topGoldRule} />
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleArea}>
          <HighlightedTopic
            text={watch.topic}
            requiredTerms={watch.requiredTerms}
            style={styles.title}
          />
          <Text style={styles.intent}>{watch.intent}</Text>
        </View>
        <View style={[styles.statusBadge, !watch.active && styles.statusBadgePaused]}>
          <View style={[styles.statusDot, !watch.active && styles.statusDotPaused]} />
          <Text style={styles.statusText}>{watch.active ? 'AKTİF' : 'DURAKLATILDI'}</Text>
        </View>
      </View>

      <Divider />
      <View style={styles.metaGrid}>
        <Pressable onPress={onCategory} style={styles.metaBlock}>
          <Text style={styles.metaLabel}>KATEGORİ / DEĞİŞTİR</Text>
          <Text style={styles.metaValue}>{watch.category}</Text>
        </Pressable>
        <View style={styles.verticalDivider} />
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>HABER</Text>
          <Text style={styles.metaValue}>{watch._count?.watchArticles ?? 0}</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>BİLDİRİM</Text>
          <Text style={styles.metaValueSmall}>{labels[watch.notificationMode]}</Text>
        </View>
      </View>

      {isWatchPreparing(watch) ? (
        <View style={styles.preparing}>
          <SoftProgressBar label="İlk tarama arka planda hazırlanıyor. Bu ekranda kalman gerekmez." />
        </View>
      ) : null}
      {running ? (
        <View style={styles.preparing}>
          <SoftProgressBar label="Kaynaklar şimdi taranıyor. İşlem doğrudan backend üzerinde çalışıyor." />
        </View>
      ) : null}
      {runStatus ? (
        <View style={styles.runResult}>
          <View style={styles.runResultLine} />
          <Text style={styles.runResultText}>{runStatus}</Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modeRow}
      >
        {modes.map(mode => (
          <FilterChip
            key={mode}
            label={labels[mode]}
            selected={mode === watch.notificationMode}
            onPress={() => onPatch({ notificationMode: mode })}
          />
        ))}
      </ScrollView>

      <View style={styles.actionsDivider} />
      <View style={styles.actions}>
        <Button secondary title="Düzenle" onPress={onEdit} style={styles.action} />
        <Button
          secondary
          title={watch.active ? 'Duraklat' : 'Devam et'}
          onPress={() => onPatch({ active: !watch.active })}
          style={styles.action}
        />
        <Button
          secondary
          title={running ? 'Taranıyor...' : 'Şimdi tara'}
          disabled={running || !watch.active}
          onPress={onRun}
          style={styles.action}
        />
        <Button danger title="Sil" onPress={onDelete} style={styles.action} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardTopLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
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
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleArea: { flex: 1 },
  title: { fontFamily, color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.45 },
  intent: { fontFamily, color: colors.inkSoft, marginTop: 4, lineHeight: 18, fontSize: 12 },
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
  statusText: { fontFamily, color: colors.ink, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  metaGrid: { flexDirection: 'row', alignItems: 'stretch' },
  metaBlock: { flex: 1, minWidth: 0, paddingHorizontal: 5 },
  verticalDivider: { width: 1, backgroundColor: colors.border },
  metaLabel: {
    fontFamily,
    color: colors.inkMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaValue: { fontFamily, color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 4 },
  metaValueSmall: {
    fontFamily,
    color: colors.ink,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 14,
  },
  preparing: { marginTop: 13 },
  runResult: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  runResultLine: { width: 22, height: 2, backgroundColor: colors.gold },
  runResultText: { flex: 1, fontFamily, color: colors.inkSoft, fontSize: 10, lineHeight: 15 },
  modeRow: { gap: 7, paddingTop: 14, paddingRight: 12 },
  actionsDivider: { height: 1, backgroundColor: colors.border, marginTop: 14, marginBottom: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7 },
  action: { flexGrow: 1, minWidth: 92, minHeight: 42, marginTop: 0 },
});
