import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isDemoMode } from '../data/runtime';
import { colors, fontFamily, fontFamilyMedium } from '../ui';
import { extractSelectableTerms, toggleRequiredTerm } from '../utils/watch-ui';

type Props = {
  text: string;
  selected: string[];
  onChange: (terms: string[]) => void;
  compact?: boolean;
};

export default function RequiredTermsPicker({ text, selected, onChange, compact = false }: Props) {
  const words = extractSelectableTerms(text);

  if (!words.length) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Kesin olması gereken kelimeleri seç</Text>
      <Text style={styles.description}>
        {isDemoMode
          ? 'Altın vurgulanan her kelime haberin başlık veya açıklamasında mutlaka geçer.'
          : 'Koyu pembe seçilen her kelime bulunan haberin başlık veya açıklamasında mutlaka geçer.'}
      </Text>
      <View style={[styles.words, compact && styles.wordsCompact]}>
        {words.map(word => {
          const active = selected.some(
            term => term.localeCompare(word, 'tr', { sensitivity: 'base' }) === 0,
          );
          return (
            <Pressable
              key={word}
              onPress={() => onChange(toggleRequiredTerm(selected, word))}
              style={({ pressed }) => [
                styles.word,
                compact && styles.wordCompact,
                active && styles.wordSelected,
                active && isDemoMode && styles.demoWordSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.wordText,
                  active && styles.wordTextSelected,
                  active && isDemoMode && styles.demoWordTextSelected,
                ]}
              >
                {word}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 14 },
  title: {
    fontFamily: fontFamilyMedium,
    color: isDemoMode ? colors.ink : colors.wine,
    fontSize: 11,
    fontWeight: '800',
  },
  description: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  wordsCompact: { gap: 5, marginTop: 8 },
  word: {
    minHeight: 34,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: isDemoMode ? 6 : 9,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: isDemoMode ? colors.surface : colors.palePink,
  },
  wordCompact: { minHeight: 30, paddingHorizontal: 9 },
  wordSelected: {
    backgroundColor: '#A30F60',
    borderColor: '#DFA4BF',
  },
  demoWordSelected: {
    backgroundColor: colors.backgroundStrong,
    borderColor: colors.gold,
  },
  wordText: { fontFamily, color: colors.inkSoft, fontSize: 11, fontWeight: '700' },
  wordTextSelected: { fontFamily: fontFamilyMedium, color: colors.white, fontWeight: '800' },
  demoWordTextSelected: { color: colors.goldDark, fontWeight: '700' },
  pressed: { opacity: 0.78 },
});
