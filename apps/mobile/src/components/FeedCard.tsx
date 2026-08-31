import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { isDemoMode } from '../data/runtime';
import type { FeedItem } from '../types';
import { colors, fontFamily, fontFamilyMedium } from '../ui';
import HighlightedTopic from './HighlightedTopic';

export function FeedCard({ item, index = 0 }: { item: FeedItem; index?: number }) {
  const [imageFailed, setImageFailed] = useState(false);

  async function open() {
    try {
      await api(`/feed/${item.id}/read`, { method: 'PATCH' });
    } catch {
      // Reading the source must not depend on persisting the read marker.
    }
    await Linking.openURL(item.article.canonicalUrl);
  }

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
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

        <HighlightedTopic
          text={item.watch.topic}
          requiredTerms={item.watch.requiredTerms}
          style={styles.topicText}
        />
        <Text style={styles.articleTitle}>{item.article.title}</Text>
        <Text style={styles.summary}>{item.summary}</Text>

        <View style={styles.footer}>
          <Text style={styles.source}>{item.article.sourceName || 'Kaynak'}</Text>
          <View style={styles.footerSeparator} />
          <Text style={styles.date}>
            {formatFeedDate(item.article.publishedAt ?? item.createdAt)}
          </Text>
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginBottom: isDemoMode ? 11 : 12,
    borderRadius: isDemoMode ? 10 : 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: isDemoMode ? 3 : 10 },
    shadowOpacity: isDemoMode ? 0.025 : 0.22,
    shadowRadius: isDemoMode ? 8 : 22,
    elevation: isDemoMode ? 1 : 5,
  },
  cardPressed: { opacity: 0.87, transform: [{ scale: 0.994 }] },
  cardRail: {
    width: isDemoMode ? 3 : 5,
    backgroundColor: isDemoMode ? colors.gold : colors.magenta,
  },
  cardBody: { flex: 1, padding: isDemoMode ? 15 : 16 },
  mediaFrame: {
    height: isDemoMode ? 132 : 118,
    marginBottom: 13,
    overflow: 'hidden',
    borderRadius: isDemoMode ? 7 : 10,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: isDemoMode ? colors.goldDark : colors.magenta,
    fontSize: 9,
    fontWeight: isDemoMode ? '700' : '800',
    letterSpacing: isDemoMode ? 0.55 : 1,
  },
  cardTopRule: { flex: 1, height: 1, backgroundColor: colors.border },
  categoryText: {
    fontFamily: fontFamilyMedium,
    color: isDemoMode ? colors.inkSoft : colors.wine,
    fontSize: 8,
    fontWeight: isDemoMode ? '700' : '800',
    letterSpacing: isDemoMode ? 0.55 : 1,
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
    fontSize: isDemoMode ? 16 : 16,
    fontWeight: isDemoMode ? '700' : '800',
    lineHeight: 22,
    letterSpacing: -0.28,
  },
  summary: {
    fontFamily,
    color: colors.inkSoft,
    marginTop: 7,
    lineHeight: 18,
    fontSize: isDemoMode ? 11.5 : 12,
    fontWeight: isDemoMode ? '400' : 'normal',
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
  open: {
    fontFamily: fontFamilyMedium,
    color: isDemoMode ? colors.goldDark : colors.magenta,
    fontSize: 10,
    fontWeight: '800',
  },
});
