import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { resetDemoData } from '../api';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
  type FeedFilter,
} from '../settings';
import type { NotificationMode } from '../types';
import { colors, Divider, fontFamily, fontFamilyMedium, SectionLabel } from '../ui';

const notificationOptions: Array<[NotificationMode, string]> = [
  ['IMPORTANT_ONLY', 'Sadece önemli'],
  ['ALL_RELEVANT', 'Her ilgili haber'],
  ['SELECTED_EVENTS', 'Seçili olaylar'],
  ['OFF', 'Kapalı'],
];

const feedOptions: Array<[FeedFilter, string]> = [
  ['all', 'Hepsi'],
  ['important', 'Önemli'],
  ['unread', 'Okunmamış'],
];

export default function DemoSettingsScreen({ onHome }: { onHome?: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  async function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function reset() {
    resetDemoData();
    if (typeof window !== 'undefined') window.location.reload();
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.root}>
      <AppHeader
        title="Ayarlar"
        subtitle="Demo deneyimini kişiselleştir. Bu tercihler yalnızca bu tarayıcıda tutulur."
        kicker="HEADSUP / DEMO PREFERENCES"
        onLogoPress={onHome}
      />

      {saved ? <Text style={styles.saved}>Ayar kaydedildi</Text> : null}

      <SectionLabel>Varsayılan bildirim</SectionLabel>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Yeni takipler nasıl başlasın?</Text>
        <Text style={styles.panelDescription}>
          Yeni Takip ekranındaki ilk bildirim tercihini belirler.
        </Text>
        <Divider />
        <View style={styles.options}>
          {notificationOptions.map(([value, label]) => (
            <Choice
              key={value}
              label={label}
              selected={settings.defaultNotificationMode === value}
              onPress={() => void update({ defaultNotificationMode: value })}
            />
          ))}
        </View>
      </View>

      <View style={styles.sectionGap} />
      <SectionLabel>Gündem başlangıç görünümü</SectionLabel>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Gündem açıldığında</Text>
        <Text style={styles.panelDescription}>İlk gösterilecek haber filtresini seç.</Text>
        <Divider />
        <View style={styles.options}>
          {feedOptions.map(([value, label]) => (
            <Choice
              key={value}
              label={label}
              selected={settings.defaultFeedFilter === value}
              onPress={() => void update({ defaultFeedFilter: value })}
            />
          ))}
        </View>
      </View>

      <View style={styles.sectionGap} />
      <SectionLabel>Akıllı öneriler</SectionLabel>
      <View style={styles.panelCompact}>
        <Pressable
          onPress={() => void update({ suggestionsEnabled: !settings.suggestionsEnabled })}
          style={styles.toggleRow}
        >
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Yazım ve kategori önerisi</Text>
            <Text style={styles.toggleDescription}>
              Takip metnini yazarken düzeltme ve kategori önerilerini gösterir.
            </Text>
          </View>
          <View style={[styles.switchTrack, settings.suggestionsEnabled && styles.switchTrackOn]}>
            <View
              style={[styles.switchThumb, settings.suggestionsEnabled && styles.switchThumbOn]}
            />
          </View>
        </Pressable>
      </View>

      <View style={styles.sectionGap} />
      <SectionLabel>Public demo</SectionLabel>
      <View style={styles.demoPanel}>
        <View style={styles.demoAccent} />
        <Text style={styles.demoKicker}>LOCAL BROWSER STATE</Text>
        <Text style={styles.demoTitle}>Gerçek hesabına bağlı değil</Text>
        <Text style={styles.demoDescription}>
          Bu web demosu backend, Neon, Gemini ve push servislerine bağlanmaz. Eklediğin veya
          düzenlediğin veriler yalnızca bu tarayıcıda saklanır.
        </Text>
        <Pressable
          onPress={reset}
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        >
          <Text style={styles.resetButtonText}>Demo verilerini sıfırla</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <View style={[styles.choiceLine, selected && styles.choiceLineSelected]} />
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 38 },
  saved: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 12,
    fontFamily: fontFamilyMedium,
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  panel: {
    marginTop: 9,
    padding: 17,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelCompact: {
    marginTop: 9,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  panelTitle: {
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  panelDescription: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  choiceSelected: { borderColor: colors.ink, backgroundColor: colors.ink },
  choiceLine: { width: 12, height: 2, backgroundColor: colors.borderStrong },
  choiceLineSelected: { width: 20, backgroundColor: colors.goldDark },
  choiceText: { fontFamily, color: colors.inkSoft, fontSize: 11, fontWeight: '700' },
  choiceTextSelected: { color: colors.white, fontWeight: '700' },
  sectionGap: { height: 21 },
  toggleRow: {
    minHeight: 76,
    paddingHorizontal: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleCopy: { flex: 1 },
  toggleTitle: { fontFamily: fontFamilyMedium, color: colors.ink, fontSize: 13, fontWeight: '800' },
  toggleDescription: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  switchTrack: {
    width: 42,
    height: 23,
    borderRadius: 8,
    backgroundColor: '#E8E0D2',
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackOn: { backgroundColor: colors.gold },
  switchThumb: {
    width: 17,
    height: 17,
    borderRadius: 6,
    backgroundColor: colors.white,
    transform: [{ translateX: 0 }],
  },
  switchThumbOn: { transform: [{ translateX: 19 }] },
  demoPanel: {
    marginTop: 9,
    padding: 18,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  demoAccent: { width: 44, height: 2, backgroundColor: colors.gold, marginBottom: 13 },
  demoKicker: {
    fontFamily: fontFamilyMedium,
    color: colors.goldDark,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.35,
  },
  demoTitle: {
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },
  demoDescription: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  resetButton: {
    marginTop: 15,
    minHeight: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontFamily: fontFamilyMedium,
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '700',
  },
  pressed: { opacity: 0.78 },
});
