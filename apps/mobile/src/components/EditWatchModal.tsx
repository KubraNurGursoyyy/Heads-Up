import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, colors, Field, fontFamily, fontFamilyMedium } from '../ui';
import type { Watch } from '../types';
import RequiredTermsPicker from './RequiredTermsPicker';
import { keepTermsPresentInText, normalizeInput } from '../utils/watch-ui';

type Props = {
  watch: Watch | null;
  busy?: boolean;
  onClose: () => void;
  onSave: (prompt: string, requiredTerms: string[]) => void;
};

export default function EditWatchModal({ watch, busy = false, onClose, onSave }: Props) {
  const [prompt, setPrompt] = useState('');
  const [requiredTerms, setRequiredTerms] = useState<string[]>([]);

  useEffect(() => {
    setPrompt(watch?.prompt ?? '');
    setRequiredTerms(watch?.requiredTerms ?? []);
  }, [watch]);

  function updatePrompt(value: string) {
    setPrompt(value);
    setRequiredTerms(current => keepTermsPresentInText(current, value));
  }

  const cleanPrompt = normalizeInput(prompt);

  return (
    <Modal visible={Boolean(watch)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.goldLine} />
          <Text style={styles.kicker}>TAKİBİ DÜZENLE</Text>
          <Text style={styles.title}>Takip isteği ve kesin kelimeler</Text>
          <Text style={styles.description}>
            İsteği değiştirebilir, haberde mutlaka bulunmasını istediğin kelimeleri yeniden
            seçebilirsin.
          </Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <Field
              multiline
              value={prompt}
              onChangeText={updatePrompt}
              autoCapitalize="sentences"
              autoCorrect
              spellCheck
              style={styles.field}
            />
            <RequiredTermsPicker
              text={cleanPrompt}
              selected={requiredTerms}
              onChange={setRequiredTerms}
              compact
            />
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} disabled={busy} style={styles.cancel}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </Pressable>
            <Button
              title={busy ? 'Kaydediliyor...' : 'Kaydet'}
              disabled={busy || cleanPrompt.length < 3}
              onPress={() => onSave(cleanPrompt, requiredTerms)}
              style={styles.save}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(25,5,18,0.58)',
  },
  modal: {
    width: '100%',
    maxWidth: 470,
    maxHeight: '84%',
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  goldLine: { width: 42, height: 2, backgroundColor: colors.gold, marginBottom: 12 },
  kicker: {
    fontFamily: fontFamilyMedium,
    color: colors.magenta,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
  },
  description: { fontFamily, color: colors.inkSoft, fontSize: 11, lineHeight: 17, marginTop: 6 },
  scroll: { marginTop: 15 },
  field: { minHeight: 105, textAlignVertical: 'top' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 15,
  },
  cancel: {
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  cancelText: { fontFamily: fontFamilyMedium, color: colors.ink, fontSize: 11, fontWeight: '800' },
  save: { minWidth: 120, marginTop: 0 },
});
