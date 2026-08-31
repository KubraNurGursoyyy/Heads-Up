import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { isDemoMode } from '../data/runtime';
import { colors, fontFamily, fontFamilyMedium } from '../ui';
import HighlightedTopic from './HighlightedTopic';

export type TopicDropdownOption = {
  id: string;
  label: string;
  requiredTerms?: string[] | null;
};

type Props = {
  options: TopicDropdownOption[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  allLabel?: string;
  compact?: boolean;
};

export default function TopicDropdown({
  options,
  selectedId,
  onChange,
  allLabel = 'Hepsi',
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.id === selectedId);

  function choose(id: string | null) {
    onChange(id);
    setOpen(false);
  }

  return (
    <View style={[styles.root, compact && styles.rootCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(current => !current)}
        style={({ pressed }) => [
          styles.trigger,
          isDemoMode && styles.demoTrigger,
          compact && styles.triggerCompact,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.triggerTextArea}>
          {compact ? null : (
            <Text style={[styles.triggerMeta, isDemoMode && styles.demoTriggerMeta]}>
              HABERLERİ FİLTRELE
            </Text>
          )}
          {selected ? (
            <HighlightedTopic
              text={selected.label}
              requiredTerms={selected.requiredTerms}
              numberOfLines={1}
              style={[
                styles.triggerText,
                isDemoMode && styles.demoTriggerText,
                compact && styles.triggerTextCompact,
              ]}
            />
          ) : (
            <Text
              numberOfLines={1}
              style={[
                styles.triggerText,
                isDemoMode && styles.demoTriggerText,
                compact && styles.triggerTextCompact,
              ]}
            >
              {allLabel}
            </Text>
          )}
        </View>

        <View style={[styles.chevron, open && styles.chevronOpen]}>
          <View style={styles.chevronLeft} />
          <View style={styles.chevronRight} />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          <Pressable
            onPress={() => choose(null)}
            style={[styles.option, selectedId === null && styles.optionSelected]}
          >
            <View style={[styles.optionRail, selectedId === null && styles.optionRailSelected]} />
            <Text style={[styles.optionText, selectedId === null && styles.optionTextSelected]}>
              {allLabel}
            </Text>
          </Pressable>

          <ScrollView
            nestedScrollEnabled
            style={styles.optionsScroll}
            showsVerticalScrollIndicator={options.length > 5}
          >
            {options.map(option => {
              const active = selectedId === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => choose(option.id)}
                  style={[styles.option, active && styles.optionSelected]}
                >
                  <View style={[styles.optionRail, active && styles.optionRailSelected]} />
                  <HighlightedTopic
                    text={option.label}
                    requiredTerms={option.requiredTerms}
                    numberOfLines={2}
                    style={[styles.optionText, active && styles.optionTextSelected]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 8 },
  rootCompact: { marginTop: 4 },
  trigger: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: isDemoMode ? 7 : 10,
    borderWidth: 1,
    borderColor: 'rgba(236,217,167,0.55)',
    backgroundColor: 'rgba(83,13,58,0.76)',
  },
  demoTrigger: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerCompact: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pressed: { opacity: 0.82 },
  triggerTextArea: { flex: 1 },
  triggerMeta: {
    fontFamily,
    color: colors.goldSoft,
    fontSize: 7,
    fontWeight: isDemoMode ? '700' : '800',
    letterSpacing: 1.2,
  },
  demoTriggerMeta: { color: colors.inkMuted, fontWeight: '600', letterSpacing: 0.7 },
  triggerText: {
    marginTop: 3,
    fontFamily: fontFamilyMedium,
    color: colors.lightText,
    fontSize: 12,
    fontWeight: '800',
  },
  demoTriggerText: { color: colors.ink, fontWeight: '700' },
  triggerTextCompact: { marginTop: 0, fontSize: 10 },
  chevron: {
    width: 22,
    height: 18,
    marginLeft: 10,
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  chevronLeft: {
    position: 'absolute',
    width: 9,
    height: 1.5,
    backgroundColor: colors.gold,
    left: 3,
    top: 8,
    transform: [{ rotate: '38deg' }],
  },
  chevronRight: {
    position: 'absolute',
    width: 9,
    height: 1.5,
    backgroundColor: colors.gold,
    right: 3,
    top: 8,
    transform: [{ rotate: '-38deg' }],
  },
  menu: {
    marginTop: 6,
    overflow: 'hidden',
    borderRadius: isDemoMode ? 7 : 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDemoMode ? 0.04 : 0.24,
    shadowRadius: 22,
    elevation: 8,
  },
  optionsScroll: { maxHeight: 220 },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { backgroundColor: isDemoMode ? colors.surfaceMuted : colors.surfaceStrong },
  optionRail: {
    alignSelf: 'stretch',
    width: 3,
    backgroundColor: 'transparent',
  },
  optionRailSelected: { backgroundColor: colors.goldDark },
  optionText: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily,
    color: colors.inkSoft,
    fontSize: 12,
  },
  optionTextSelected: {
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontWeight: '800',
  },
});
