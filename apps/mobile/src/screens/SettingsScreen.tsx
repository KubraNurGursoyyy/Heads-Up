import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import {
  colors,
  Divider,
  fontFamily,
  SectionLabel,
} from '../ui';
import AppHeader from '../components/AppHeader';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
  type FeedFilter,
} from '../settings';
import type { NotificationMode } from '../types';

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

export default function SettingsScreen({ onHome }: { onHome?: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [connection, setConnection] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  useEffect(() => {
    void loadSettings().then(setSettings);
  }, []);

  async function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaved(false);
    await saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }

  async function testConnection() {
    try {
      setConnection('checking');
      setConnectionMessage('');
      const result = await api<{ ok: boolean; service?: string }>('/health');
      setConnection(result.ok ? 'ok' : 'error');
      setConnectionMessage(result.ok ? 'API bağlantısı sağlıklı.' : 'API yanıt verdi ancak sağlık durumu başarısız.');
    } catch (error) {
      setConnection('error');
      setConnectionMessage((error as Error).message);
    }
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.root}
    >
      <AppHeader
        title="Ayarlar"
        subtitle="Varsayılan davranışları değiştir. Bu seçimler cihazda saklanır ve sonraki ekran açılışlarında uygulanır."
        kicker="HEADSUP / PREFERENCES"
        onLogoPress={onHome}
      />

      {saved ? (
        <View style={styles.savedBadge}>
          <View style={styles.savedLine} />
          <Text style={styles.savedText}>Ayar kaydedildi</Text>
        </View>
      ) : null}

      <SectionLabel>Varsayılan bildirim</SectionLabel>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Yeni takipler nasıl başlasın?</Text>
        <Text style={styles.panelDescription}>
          Yeni Takip ekranında ilk seçili bildirim tercihini belirler.
        </Text>
        <Divider />
        <View style={styles.optionGrid}>
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
      <SectionLabel>Haberler başlangıç görünümü</SectionLabel>
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Haberler açıldığında</Text>
        <Text style={styles.panelDescription}>Ana feed ilk açıldığında kullanılacak filtre.</Text>
        <Divider />
        <View style={styles.optionGrid}>
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
      <SectionLabel>Akıllı davranışlar</SectionLabel>
      <View style={styles.panelCompact}>
        <ToggleRow
          title="Yazım ve kategori önerisi"
          description="Yazarken otomatik düzeltme ve kategori tahmini ister."
          value={settings.suggestionsEnabled}
          onChange={value => void update({ suggestionsEnabled: value })}
        />
        <View style={styles.rowDivider} />
        <ToggleRow
          title="Hareketli arka plan"
          description="Koyu pembe-mor aurora ve sıralı altın çizgi animasyonlarını çalıştırır."
          value={settings.animationsEnabled}
          onChange={value => void update({ animationsEnabled: value })}
        />
      </View>

      <View style={styles.sectionGap} />
      <SectionLabel>Sistem</SectionLabel>
      <View style={styles.systemPanel}>
        <View style={styles.systemAccent} />
        <Text style={styles.systemKicker}>HEADSUP STATUS</Text>
        <Text style={styles.systemTitle}>API bağlantısını kontrol et</Text>
        <Text style={styles.systemDescription}>
          Mobil/web istemcisinin bağlı olduğu HeadsUp backend'ine gerçek bir sağlık isteği gönderir.
        </Text>

        <Pressable
          onPress={() => void testConnection()}
          disabled={connection === 'checking'}
          style={({ pressed }) => [styles.testButton, pressed && styles.pressed]}
        >
          <Text style={styles.testButtonText}>
            {connection === 'checking' ? 'Kontrol ediliyor...' : 'Bağlantıyı test et'}
          </Text>
          <View style={styles.testButtonLine} />
        </Pressable>

        {connection !== 'idle' && connection !== 'checking' ? (
          <View style={[styles.connectionResult, connection === 'error' && styles.connectionResultError]}>
            <View style={[styles.connectionDot, connection === 'error' && styles.connectionDotError]} />
            <Text style={styles.connectionText}>{connectionMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.archiveInfo}>
        <View style={styles.archiveInfoLine} />
        <View style={styles.archiveInfoCopy}>
          <Text style={styles.archiveInfoTitle}>Haber arşivi</Text>
          <Text style={styles.archiveInfoText}>
            Ana ekran son 12 kaydı gösterir. Bunların hepsi yeni olmak zorunda değildir; daha eski kayıtlar 3'erli arşiv sayfalarında tutulur.
          </Text>
        </View>
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
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <View style={[styles.choiceLine, selected && styles.choiceLineSelected]} />
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <View style={[styles.switchTrack, value && styles.switchTrackOn]}>
        <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 38,
  },
  savedBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: -9,
    marginBottom: 12,
  },
  savedLine: { width: 22, height: 2, backgroundColor: colors.gold },
  savedText: { fontFamily, color: colors.magenta, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  panel: {
    marginTop: 9,
    padding: 17,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  panelCompact: {
    marginTop: 9,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
  },
  panelTitle: {
    fontFamily,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  panelDescription: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  choiceSelected: { borderColor: colors.gold, backgroundColor: colors.surfaceStrong },
  choiceLine: { width: 12, height: 2, backgroundColor: colors.goldSoft },
  choiceLineSelected: { width: 20, backgroundColor: colors.magenta },
  choiceText: { fontFamily, color: colors.inkSoft, fontSize: 11, fontWeight: '700' },
  choiceTextSelected: { color: colors.ink, fontWeight: '800' },
  sectionGap: { height: 21 },
  toggleRow: {
    minHeight: 72,
    paddingHorizontal: 15,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toggleCopy: { flex: 1 },
  toggleTitle: { fontFamily, color: colors.ink, fontSize: 13, fontWeight: '800' },
  toggleDescription: { fontFamily, color: colors.inkSoft, fontSize: 10, lineHeight: 15, marginTop: 3 },
  rowDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 15 },
  switchTrack: {
    width: 42,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#E7D8E0',
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackOn: { backgroundColor: colors.wine },
  switchThumb: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.white,
    transform: [{ translateX: 0 }],
  },
  switchThumbOn: { transform: [{ translateX: 19 }] },
  systemPanel: {
    marginTop: 9,
    padding: 18,
    borderRadius: 17,
    backgroundColor: colors.wine,
    borderWidth: 1,
    borderColor: '#722552',
  },
  systemAccent: { width: 44, height: 2, backgroundColor: colors.gold, marginBottom: 13 },
  systemKicker: { fontFamily, color: '#E7B7D0', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  systemTitle: { fontFamily, color: colors.white, fontSize: 17, fontWeight: '800', marginTop: 6 },
  systemDescription: { fontFamily, color: '#D9B1C6', fontSize: 11, lineHeight: 17, marginTop: 5 },
  testButton: {
    marginTop: 15,
    minHeight: 45,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: '#71144A',
    borderWidth: 1,
    borderColor: '#9E3C72',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testButtonText: { fontFamily, color: colors.white, fontSize: 11, fontWeight: '800' },
  testButtonLine: { width: 28, height: 2, backgroundColor: colors.hotPink },
  connectionResult: {
    marginTop: 11,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  connectionResultError: { backgroundColor: 'rgba(255,115,160,0.11)' },
  connectionDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E6C57D' },
  connectionDotError: { backgroundColor: '#FF87B4' },
  connectionText: { flex: 1, fontFamily, color: colors.white, fontSize: 10, lineHeight: 15 },
  archiveInfo: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
  },
  archiveInfoLine: { width: 3, backgroundColor: colors.gold, borderRadius: 2 },
  archiveInfoCopy: { flex: 1 },
  archiveInfoTitle: { fontFamily, color: colors.ink, fontSize: 12, fontWeight: '800' },
  archiveInfoText: { fontFamily, color: colors.inkSoft, fontSize: 10, lineHeight: 15, marginTop: 3 },
  pressed: { opacity: 0.84 },
});
