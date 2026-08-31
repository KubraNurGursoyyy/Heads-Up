import React, { useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
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
  summary: { fontFamily, color: colors.inkSoft, marginTop: 7, lineHeight: 19, fontSize: 12 },
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
});
