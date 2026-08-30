import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { Button, colors, Divider, Field, fontFamily, fontFamilyMedium, SectionLabel } from '../ui';
import AppHeader from '../components/AppHeader';
import SoftProgressBar from '../components/SoftProgressBar';
import CategoryPickerModal from '../components/CategoryPickerModal';
import RequiredTermsPicker from '../components/RequiredTermsPicker';
import type { NotificationMode, WatchCategory, WatchSuggestion } from '../types';
import { loadSettings } from '../settings';
import {
  effectiveCategory,
  keepTermsPresentInText,
  normalizeInput,
  shouldOfferCorrection,
  shouldRequestSuggestion,
} from '../utils/watch-ui';

type Props = { onAdded: () => void; onHome?: () => void };

const modes: Array<[NotificationMode, string, string]> = [
  ['IMPORTANT_ONLY', 'Sadece önemli gelişmeler', 'Önerilen'],
  ['ALL_RELEVANT', 'Her ilgili haberde', 'Yoğun'],
  ['SELECTED_EVENTS', 'Takip isteğindeki olaylarda', 'Seçici'],
  ['OFF', 'Bildirim kapalı', 'Sessiz'],
];

export default function AddWatchScreen({ onAdded, onHome }: Props) {
  const [prompt, setPrompt] = useState('');
  const [promptConfirmed, setPromptConfirmed] = useState(false);
  const [requiredTerms, setRequiredTerms] = useState<string[]>([]);
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
  const analysisInput = normalizeInput(prompt);

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
    const id = ++requestId.current;
    if (!suggestionsEnabled || !shouldRequestSuggestion(analysisInput)) {
      setSuggestion(null);
      setSuggestionBusy(false);
      return;
    }
    setSuggestionBusy(true);
    const timer = setTimeout(() => {
      void api<WatchSuggestion>('/watches/suggest', {
        method: 'POST',
        body: JSON.stringify({ prompt: analysisInput }),
      })
        .then(result => {
          if (requestId.current === id) setSuggestion(result);
        })
        .catch(() => {
          if (requestId.current === id) setSuggestion(null);
        })
        .finally(() => {
          if (requestId.current === id) setSuggestionBusy(false);
        });
    }, 550);
    return () => clearTimeout(timer);
  }, [analysisInput, suggestionsEnabled]);

  const selectedCategory = effectiveCategory(manualCategory, suggestion?.category);
  const canConfirm = analysisInput.length >= 3;
  const canSave = canConfirm && promptConfirmed;

  function updatePrompt(value: string) {
    setPrompt(value);
    setPromptConfirmed(false);
    setRequiredTerms(current => keepTermsPresentInText(current, value));
    setError(null);
  }

  async function save() {
    if (!canSave) return;
    try {
      setBusy(true);
      setError(null);
      await api('/watches', {
        method: 'POST',
        body: JSON.stringify({
          prompt: analysisInput,
          notificationMode: mode,
          topicHint: suggestion?.topic,
          categoryHint: selectedCategory ?? undefined,
          requiredTerms,
        }),
      });
      setPrompt('');
      setPromptConfirmed(false);
      setRequiredTerms([]);
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
    updatePrompt(suggestion.correctedPrompt);
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
          subtitle="Konunu yaz, onayla ve haberde mutlaka geçmesini istediğin kelimeleri seç. Yazım, aksan ve büyük/küçük harf farkları eşleşmeyi bozmaz."
          kicker="HEADSUP / CREATE WATCH"
          onLogoPress={onHome}
        />

        <SectionLabel>Takip isteği</SectionLabel>
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <View style={styles.promptIndex}>
              <Text style={styles.promptIndexText}>01</Text>
            </View>
            <View style={styles.promptHeaderText}>
              <Text style={styles.promptTitle}>Neyi takip etmemi istiyorsun?</Text>
              <Text style={styles.example}>
                Örn. “Neon Genesis Evangelion Yōko Taro ile ilgili gelişmeleri takip et.”
              </Text>
            </View>
          </View>
          <Divider />
          <Field
            multiline
            value={prompt}
            onChangeText={updatePrompt}
            placeholder="Takip edilecek konuyu doğal bir cümleyle yaz..."
            autoCapitalize="sentences"
            autoCorrect
            spellCheck
            style={styles.field}
          />

          <Pressable
            disabled={!canConfirm}
            onPress={() => setPromptConfirmed(true)}
            style={({ pressed }) => [
              styles.confirmTopic,
              promptConfirmed && styles.confirmTopicDone,
              !canConfirm && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.confirmTopicText, promptConfirmed && styles.confirmTopicTextDone]}>
              {promptConfirmed ? 'Konu onaylandı' : 'Konuyu onayla'}
            </Text>
          </Pressable>

          {promptConfirmed ? (
            <RequiredTermsPicker
              text={analysisInput}
              selected={requiredTerms}
              onChange={setRequiredTerms}
            />
          ) : null}

          <View style={styles.analysisPanel}>
            <View style={styles.analysisTop}>
              <Text style={styles.analysisLabel}>OTOMATİK ANALİZ</Text>
              {suggestionBusy ? (
                <Text style={styles.analysisMuted}>Kontrol ediliyor...</Text>
              ) : null}
            </View>
            <View style={styles.analysisDivider} />
            <View style={styles.categoryRow}>
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryCaption}>Kategori</Text>
                <Text style={styles.categoryValue}>{selectedCategory || 'Henüz belirlenmedi'}</Text>
                {manualCategory ? <Text style={styles.manualBadge}>ELLE SEÇİLDİ</Text> : null}
              </View>
              <Pressable onPress={() => setCategoryPickerOpen(true)} style={styles.categoryButton}>
                <Text style={styles.categoryButtonText}>
                  {selectedCategory ? 'Değiştir' : 'Kategori seç'}
                </Text>
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
          {modes.map(([value, label, tag]) => {
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
                  <Text style={[styles.modeText, selected && styles.modeTextSelected]}>
                    {label}
                  </Text>
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
          disabled={busy || !canSave}
          style={styles.button}
        />
        {busy ? (
          <View style={styles.saveProgress}>
            <SoftProgressBar label="Takip kaydediliyor. İlk haber taraması arka planda devam eder." />
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
  root: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34 },
  promptCard: {
    marginTop: 9,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    elevation: 3,
  },
  promptHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
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
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  example: { fontFamily, color: colors.inkSoft, fontSize: 11, lineHeight: 17, marginTop: 4 },
  field: { width: '100%', minHeight: 120, textAlignVertical: 'top' },
  confirmTopic: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.wine,
    borderWidth: 1,
    borderColor: colors.goldDark,
  },
  confirmTopicDone: { backgroundColor: '#A30F60' },
  confirmTopicText: {
    fontFamily: fontFamilyMedium,
    color: colors.lightText,
    fontSize: 11,
    fontWeight: '800',
  },
  confirmTopicTextDone: { color: colors.white },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.82 },
  analysisPanel: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  analysisTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  analysisLabel: {
    fontFamily: fontFamilyMedium,
    color: colors.wine,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  analysisMuted: { fontFamily, color: colors.inkMuted, fontSize: 9 },
  analysisDivider: { height: 1, backgroundColor: colors.border, marginVertical: 9 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryCopy: { flex: 1 },
  categoryCaption: { fontFamily, color: colors.inkMuted, fontSize: 9 },
  categoryValue: {
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  manualBadge: {
    fontFamily,
    color: colors.magenta,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },
  categoryButton: {
    minHeight: 36,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldDark,
    borderRadius: 8,
  },
  categoryButtonText: {
    fontFamily: fontFamilyMedium,
    color: colors.wine,
    fontSize: 9,
    fontWeight: '800',
  },
  suggestionCard: {
    marginTop: 12,
    padding: 15,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  suggestionGoldLine: { width: 42, height: 2, backgroundColor: colors.gold, marginBottom: 9 },
  suggestionEyebrow: {
    fontFamily: fontFamilyMedium,
    color: colors.wine,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  suggestionText: {
    fontFamily,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 5,
  },
  suggestionActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  useSuggestionButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: colors.wine,
  },
  useSuggestionText: {
    fontFamily: fontFamilyMedium,
    color: colors.lightText,
    fontSize: 9,
    fontWeight: '800',
  },
  ignoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ignoreText: {
    fontFamily: fontFamilyMedium,
    color: colors.inkSoft,
    fontSize: 9,
    fontWeight: '800',
  },
  sectionSpacer: { height: 18 },
  modeList: { marginTop: 9, gap: 8 },
  modeCard: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeCardSelected: { borderColor: colors.goldDark, backgroundColor: colors.surfaceStrong },
  radio: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.magenta },
  radioDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.magenta },
  modeCopy: { flex: 1, marginLeft: 10 },
  modeText: {
    fontFamily: fontFamilyMedium,
    color: colors.inkSoft,
    fontSize: 11,
    fontWeight: '700',
  },
  modeTextSelected: { color: colors.ink, fontWeight: '800' },
  modeTag: { fontFamily, color: colors.inkMuted, fontSize: 8, marginTop: 2 },
  modeLine: { width: 22, height: 2, backgroundColor: colors.border },
  modeLineSelected: { backgroundColor: colors.goldDark },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#E8C1D3',
    borderWidth: 1,
    borderColor: '#B45D83',
  },
  errorTitle: {
    fontFamily: fontFamilyMedium,
    color: colors.danger,
    fontSize: 10,
    fontWeight: '800',
  },
  errorText: { fontFamily, color: colors.danger, fontSize: 10, lineHeight: 15, marginTop: 3 },
  button: { marginTop: 16 },
  saveProgress: { marginTop: 10 },
});
