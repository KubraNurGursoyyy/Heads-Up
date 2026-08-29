import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Button, colors, Divider, Field, fontFamily, SectionLabel } from '../ui';
import AppHeader from '../components/AppHeader';
import SoftProgressBar from '../components/SoftProgressBar';
import CategoryPickerModal from '../components/CategoryPickerModal';
import type { NotificationMode, WatchCategory, WatchSuggestion } from '../types';
import { loadSettings } from '../settings';
import {
  effectiveCategory,
  normalizeInput,
  shouldOfferCorrection,
  shouldRequestSuggestion,
} from '../utils/watch-ui';

type Props = { onAdded: () => void };

const modes: Array<[NotificationMode, string, string]> = [
  ['IMPORTANT_ONLY', 'Sadece önemli gelişmeler', 'Önerilen'],
  ['ALL_RELEVANT', 'Her ilgili haberde', 'Yoğun'],
  ['SELECTED_EVENTS', 'Takip isteğindeki olaylarda', 'Seçici'],
  ['OFF', 'Bildirim kapalı', 'Sessiz'],
];

export default function AddWatchScreen({ onAdded }: Props) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<NotificationMode>('IMPORTANT_ONLY');
  const [busy, setBusy] = useState(false);
  const [suggestionBusy, setSuggestionBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<WatchSuggestion | null>(null);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [categories, setCategories] = useState<WatchCategory[]>([]);
  const [manualCategory, setManualCategory] = useState<string | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    void loadSettings().then(settings => {
      setMode(settings.defaultNotificationMode);
      setSuggestionsEnabled(settings.suggestionsEnabled);
    });

    void api<WatchCategory[]>('/watches/categories')
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const cleanPrompt = normalizeInput(prompt);
    const id = ++requestId.current;

    if (!suggestionsEnabled || !shouldRequestSuggestion(cleanPrompt)) {
      setSuggestion(null);
      setSuggestionBusy(false);
      return;
    }

    setSuggestionBusy(true);

    const timer = setTimeout(() => {
      void api<WatchSuggestion>('/watches/suggest', {
        method: 'POST',
        body: JSON.stringify({ prompt: cleanPrompt }),
      })
        .then(result => {
          if (requestId.current !== id) return;
          setSuggestion(result);
        })
        .catch(() => {
          if (requestId.current !== id) return;
          setSuggestion(null);
        })
        .finally(() => {
          if (requestId.current === id) setSuggestionBusy(false);
        });
    }, 700);

    return () => clearTimeout(timer);
  }, [prompt, suggestionsEnabled]);

  const selectedCategory = effectiveCategory(manualCategory, suggestion?.category);

  async function save() {
    const cleanPrompt = normalizeInput(prompt);
    if (cleanPrompt.length < 3) return;

    try {
      setBusy(true);
      setError(null);

      await api('/watches', {
        method: 'POST',
        body: JSON.stringify({
          prompt: cleanPrompt,
          notificationMode: mode,
          topicHint: suggestion?.topic,
          categoryHint: selectedCategory ?? undefined,
        }),
      });

      setPrompt('');
      setSuggestion(null);
      setManualCategory(null);
      onAdded();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function useSuggestion() {
    if (!suggestion) return;
    setPrompt(suggestion.correctedPrompt);
  }

  const showCorrection = Boolean(
    suggestion && suggestion.changed && shouldOfferCorrection(prompt, suggestion.correctedPrompt),
  );

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.root}
      >
        <AppHeader
          title="Yeni takip"
          subtitle="Ne öğrenmek istediğini yaz. HeadsUp konuyu yorumlar, kategoriler ve arka planda takip eder."
          kicker="HEADSUP / CREATE WATCH"
        />

        <SectionLabel>Takip isteği</SectionLabel>
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <View style={styles.promptIndex}>
              <Text style={styles.promptIndexText}>01</Text>
            </View>
            <View style={styles.promptHeaderText}>
              <Text style={styles.promptTitle}>Neyi takip etmemi istiyorsun?</Text>
              <Text style={styles.example}>Örn. “GTA 6 PC çıkış tarihi belli olduğunda haber ver.”</Text>
            </View>
          </View>

          <Divider />

          <Field
            multiline
            value={prompt}
            onChangeText={value => {
              setPrompt(value);
              setError(null);
            }}
            placeholder="Takip edilecek konuyu doğal bir cümleyle yaz..."
            autoCapitalize="sentences"
            autoCorrect
            spellCheck
            style={styles.field}
          />

          <View style={styles.analysisPanel}>
            <View style={styles.analysisTop}>
              <Text style={styles.analysisLabel}>OTOMATİK ANALİZ</Text>
              {suggestionBusy ? <Text style={styles.analysisMuted}>Kontrol ediliyor...</Text> : null}
            </View>

            <View style={styles.analysisDivider} />

            <View style={styles.categoryRow}>
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryCaption}>Kategori</Text>
                <Text style={styles.categoryValue}>{selectedCategory || 'Henüz belirlenmedi'}</Text>
                {manualCategory ? <Text style={styles.manualBadge}>ELLE SEÇİLDİ</Text> : null}
              </View>

              <Pressable onPress={() => setCategoryPickerOpen(true)} style={styles.categoryButton}>
                <Text style={styles.categoryButtonText}>{selectedCategory ? 'Değiştir' : 'Kategori seç'}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {showCorrection && suggestion ? (
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionGoldLine} />
            <Text style={styles.suggestionEyebrow}>BUNU MU DEMEK İSTEDİNİZ?</Text>
            <Text style={styles.suggestionText}>{suggestion.correctedPrompt}</Text>

            <View style={styles.suggestionActions}>
              <Pressable onPress={useSuggestion} style={styles.useSuggestionButton}>
                <Text style={styles.useSuggestionText}>Düzeltmeyi kullan</Text>
              </Pressable>

              <Pressable
                onPress={() => setSuggestion({ ...suggestion, changed: false })}
                style={styles.ignoreButton}
              >
                <Text style={styles.ignoreText}>Yok say</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionSpacer} />
        <SectionLabel>Bildirim tercihi</SectionLabel>
        <View style={styles.modeList}>
          {modes.map(([value, label, tag], index) => {
            const selected = mode === value;
            return (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.modeCopy}>
                  <Text style={[styles.modeText, selected && styles.modeTextSelected]}>{label}</Text>
                  <Text style={styles.modeTag}>{tag}</Text>
                </View>
                <View style={[styles.modeLine, selected && styles.modeLineSelected]} />
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Takip oluşturulamadı</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          title={busy ? 'Takip kaydediliyor...' : 'Takibi başlat'}
          onPress={save}
          disabled={busy || normalizeInput(prompt).length < 3}
          style={styles.button}
        />

        {busy ? (
          <View style={styles.saveProgress}>
            <SoftProgressBar label="Takip kaydediliyor. İlk haber taraması arka planda devam eder; bu ekranda kalman gerekmez." />
          </View>
        ) : null}
      </ScrollView>

      <CategoryPickerModal
        visible={categoryPickerOpen}
        current={selectedCategory}
        categories={categories}
        onClose={() => setCategoryPickerOpen(false)}
        onSelect={setManualCategory}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 34,
  },
  promptCard: {
    marginTop: 9,
    padding: 18,
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
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  promptIndex: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.wine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptIndexText: {
    fontFamily,
    color: colors.goldSoft,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  promptHeaderText: { flex: 1 },
  promptTitle: {
    fontFamily,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  example: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  field: {
    width: '100%',
    minHeight: 126,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
  },
  analysisPanel: {
    marginTop: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    padding: 13,
  },
  analysisTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  analysisLabel: {
    fontFamily,
    color: colors.wine,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  analysisMuted: {
    fontFamily,
    color: colors.inkMuted,
    fontSize: 10,
  },
  analysisDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCopy: { flex: 1 },
  categoryCaption: {
    fontFamily,
    color: colors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  categoryValue: {
    fontFamily,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  manualBadge: {
    fontFamily,
    color: colors.magenta,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  categoryButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.magenta,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    fontFamily,
    color: colors.magenta,
    fontSize: 11,
    fontWeight: '800',
  },
  suggestionCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  suggestionGoldLine: {
    width: 38,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: 10,
  },
  suggestionEyebrow: {
    fontFamily,
    color: colors.magenta,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  suggestionText: {
    fontFamily,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  suggestionActions: {
    marginTop: 13,
    flexDirection: 'row',
    gap: 9,
  },
  useSuggestionButton: {
    minHeight: 39,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useSuggestionText: {
    fontFamily,
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  ignoreButton: {
    minHeight: 39,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ignoreText: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionSpacer: { height: 22 },
  modeList: {
    marginTop: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  modeCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeCardSelected: { backgroundColor: colors.surfaceStrong },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  radioSelected: { borderColor: colors.magenta },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.magenta,
  },
  modeCopy: { flex: 1 },
  modeText: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  modeTextSelected: { color: colors.ink, fontWeight: '800' },
  modeTag: {
    fontFamily,
    color: colors.inkMuted,
    fontSize: 9,
    marginTop: 2,
  },
  modeLine: {
    width: 18,
    height: 2,
    backgroundColor: colors.goldSoft,
  },
  modeLineSelected: {
    width: 32,
    backgroundColor: colors.magenta,
  },
  errorBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#D990AB',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 12,
  },
  errorTitle: {
    fontFamily,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  errorText: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  button: { marginTop: 18 },
  saveProgress: { marginTop: 11 },
});
