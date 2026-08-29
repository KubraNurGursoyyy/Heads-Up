import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontFamilyMedium } from '../ui';

export type AppTab = 'feed' | 'add' | 'watches' | 'settings';

type Props = {
  active: AppTab;
  onChange: (tab: AppTab) => void;
};

const tabs: Array<{ value: AppTab; label: string; short: string }> = [
  { value: 'feed', label: 'Haberler', short: '01' },
  { value: 'add', label: 'Yeni Takip', short: '02' },
  { value: 'watches', label: 'Takipler', short: '03' },
  { value: 'settings', label: 'Ayarlar', short: '04' },
];

export default function BottomTabs({ active, onChange }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.goldTop} />
      <View style={styles.root}>
        {tabs.map(tab => {
          const selected = active === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => onChange(tab.value)}
              style={({ pressed }) => [styles.tab, selected && styles.tabActive, pressed && styles.pressed]}
            >
              <Text style={[styles.index, selected && styles.indexActive]}>{tab.short}</Text>
              <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
              <View style={[styles.line, selected && styles.lineActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingBottom: 9,
    paddingTop: 4,
  },
  goldTop: {
    height: 1,
    marginHorizontal: 16,
    backgroundColor: 'rgba(236,217,167,0.52)',
  },
  root: {
    flexDirection: 'row',
    minHeight: 66,
    padding: 5,
    backgroundColor: '#26051F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#8F3B68',
    shadowColor: '#12010D',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#74134E',
    borderWidth: 1,
    borderColor: 'rgba(236,217,167,0.28)',
  },
  index: {
    fontFamily,
    color: '#B982A0',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  indexActive: {
    color: colors.goldSoft,
  },
  label: {
    fontFamily: fontFamilyMedium,
    color: '#D3A8BE',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  labelActive: {
    color: colors.lightText,
  },
  line: {
    width: 16,
    height: 2,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  lineActive: {
    width: 30,
    backgroundColor: colors.gold,
  },
  pressed: { opacity: 0.84 },
});
