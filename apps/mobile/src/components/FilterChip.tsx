import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilyMedium } from '../ui';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
};

export default function FilterChip({ label, selected, onPress, compact = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,
        compact && styles.compact,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.marker, compact && styles.markerCompact, selected && styles.markerSelected]}
      />
      <Text style={[styles.text, compact && styles.textCompact, selected && styles.selectedText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  compact: {
    minHeight: 29,
    paddingHorizontal: 8,
    borderRadius: 7,
  },
  selected: {
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.gold,
  },
  marker: {
    width: 11,
    height: 2,
    backgroundColor: colors.goldDark,
  },
  markerCompact: { width: 8 },
  markerSelected: {
    width: 19,
    backgroundColor: colors.magenta,
  },
  text: {
    fontFamily: fontFamilyMedium,
    color: colors.inkSoft,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.1,
  },
  textCompact: { fontSize: 8 },
  selectedText: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.76,
  },
});
