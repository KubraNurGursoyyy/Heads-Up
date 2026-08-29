import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api } from '../api';
import { Button, Field } from '../ui';
import AppHeader from '../components/AppHeader';
import type { NotificationMode, WatchSuggestion } from '../types';
import {
  normalizeInput,
  shouldOfferCorrection,
  shouldRequestSuggestion,
} from '../utils/watch-ui';

type Props = {
  onAdded: () => void;
};

const modes: Array<[NotificationMode, string]> = [
  ['IMPORTANT_ONLY', 'Sadece önemli gelişmeler'],
  ['ALL_RELEVANT', 'Her ilgili haberde'],
  ['SELECTED_EVENTS', 'Takip isteğindeki olaylarda'],
  ['OFF', 'Bildirim kapalı'],
];

export default function AddWatchScreen({ onAdded }: Props) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<NotificationMode>('IMPORTANT_ONLY');
  const [busy, setBusy] = useState(false);
  const [suggestionBusy, setSuggestionBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<WatchSuggestion | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const cleanPrompt = normalizeInput(prompt);
    const id = ++requestId.current;

    if (!shouldRequestSuggestion(cleanPrompt)) {
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
    }, 850);

    return () => clearTimeout(timer);
  }, [prompt]);

  async function save() {
    const cleanPrompt = normalizeInput(prompt);
    if (cleanPrompt.length < 3) return;

    try {
      setBusy(true);

      await api('/watches', {
        method: 'POST',
        body: JSON.stringify({
          prompt: cleanPrompt,
          notificationMode: mode,
        }),
      });

      setPrompt('');
      setSuggestion(null);
      onAdded();
    } catch (error) {
      Alert.alert('Takip oluşturulamadı', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function useSuggestion() {
    if (!suggestion) return;
    setPrompt(suggestion.correctedPrompt);
    setSuggestion(null);
  }

  const showCorrection = Boolean(
    suggestion &&
      suggestion.changed &&
      shouldOfferCorrection(prompt, suggestion.correctedPrompt),
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.root}
    >
      <AppHeader
        title="Yeni takip"
        subtitle="Merak ettiğin konuyu doğal bir cümleyle yaz."
      />

      <View style={styles.promptCard}>
        <Text style={styles.promptTitle}>Ne öğrenmek istiyorsun?</Text>
        <Text style={styles.example}>
          Örn. “GTA 6 PC çıkış tarihi belli olduğunda haber ver.”
        </Text>

        <Field
          multiline
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Takip edilecek şeyi yaz..."
          autoCapitalize="sentences"
          autoCorrect
          spellCheck
          style={styles.field}
        />

        <View style={styles.analysisRow}>
          {suggestionBusy ? (
            <Text style={styles.analysisMuted}>Yazım ve kategori kontrol ediliyor…</Text>
          ) : suggestion?.category ? (
            <>
              <Text style={styles.analysisLabel}>Kategori</Text>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{suggestion.category}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.analysisMuted}>
              Yazdıkça kategori otomatik belirlenecek.
            </Text>
          )}
        </View>
      </View>

      {showCorrection && suggestion ? (
        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionEyebrow}>Bunu mu demek istediniz?</Text>
          <Text style={styles.suggestionText}>{suggestion.correctedPrompt}</Text>

          <View style={styles.suggestionActions}>
            <Pressable onPress={useSuggestion} style={styles.useSuggestionButton}>
              <Text style={styles.useSuggestionText}>Bunu kullan</Text>
            </Pressable>

            <Pressable onPress={() => setSuggestion(null)} style={styles.ignoreButton}>
              <Text style={styles.ignoreText}>Yok say</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Text style={styles.modeTitle}>Bildirim tercihi</Text>

      {modes.map(([value, label]) => {
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

            <Text style={[styles.modeText, selected && styles.modeTextSelected]}>
              {label}
            </Text>
          </Pressable>
        );
      })}

      <Button
        title={busy ? 'Takip hazırlanıyor...' : 'Takibi başlat'}
        onPress={save}
        disabled={busy || normalizeInput(prompt).length < 3}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },

  promptCard: {
    padding: 19,
    borderRadius: 22,
    backgroundColor: '#FFFCFD',
    borderWidth: 1,
    borderColor: '#F0D6E0',
    shadowColor: '#6A4556',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },

  promptTitle: {
    color: '#4F3543',
    fontSize: 18,
    fontWeight: '800',
  },

  example: {
    color: '#896B79',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  field: {
    width: '100%',
    minHeight: 126,
    marginTop: 16,
    textAlignVertical: 'top',
  },

  analysisRow: {
    minHeight: 30,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  analysisLabel: {
    color: '#9D8290',
    fontSize: 12,
    fontWeight: '600',
  },

  analysisMuted: {
    color: '#AE96A1',
    fontSize: 12,
  },

  categoryPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FAE4EC',
  },

  categoryPillText: {
    color: '#944A68',
    fontSize: 12,
    fontWeight: '800',
  },

  suggestionCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FBEEF3',
    borderWidth: 1,
    borderColor: '#EBC7D5',
  },

  suggestionEyebrow: {
    color: '#A46780',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },

  suggestionText: {
    color: '#4F3543',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },

  suggestionActions: {
    marginTop: 13,
    flexDirection: 'row',
    gap: 9,
  },

  useSuggestionButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#C76A8E',
  },

  useSuggestionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  ignoreButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FFFCFD',
    borderWidth: 1,
    borderColor: '#E7CCD7',
  },

  ignoreText: {
    color: '#876472',
    fontSize: 12,
    fontWeight: '700',
  },

  modeTitle: {
    color: '#4F3543',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 10,
  },

  modeCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 9,
    borderRadius: 18,
    backgroundColor: '#FFFCFD',
    borderWidth: 1,
    borderColor: '#F0D6E0',
  },

  modeCardSelected: {
    backgroundColor: '#FAEDF2',
    borderColor: '#D59AB1',
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D7B3C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  radioSelected: {
    borderColor: '#C76A8E',
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#C76A8E',
  },

  modeText: {
    flex: 1,
    color: '#896B79',
    fontWeight: '600',
  },

  modeTextSelected: {
    color: '#4F3543',
    fontWeight: '800',
  },

  button: {
    marginTop: 18,
  },
});
