import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { WatchCategory } from '../types';
import FilterChip from './FilterChip';

export default function FeedCategoryChips({
  categories,
  category,
  onSelect,
  compact = false,
}: {
  categories: WatchCategory[];
  category: string | null;
  onSelect: (category: string | null) => void;
  compact?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.chips, compact && styles.compact]}
    >
      <FilterChip
        label="Tümü"
        selected={category === null}
        compact={compact}
        onPress={() => onSelect(null)}
      />
      {categories.map(item => (
        <FilterChip
          key={item.name}
          label={`${item.name} ${item.count}`}
          selected={category?.toLocaleLowerCase('tr-TR') === item.name.toLocaleLowerCase('tr-TR')}
          compact={compact}
          onPress={() => onSelect(item.name)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 7, paddingTop: 9, paddingRight: 18 },
  compact: { gap: 5, paddingTop: 5 },
});
