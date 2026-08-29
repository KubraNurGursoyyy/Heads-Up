import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, Field, fontFamily } from '../ui';
import type { WatchCategory } from '../types';

type Props = {
  visible: boolean;
  current?: string | null;
  categories: WatchCategory[];
  onSelect: (category: string) => void;
  onClose: () => void;
};

export default function CategoryPickerModal({
  visible,
  current,
  categories,
  onSelect,
  onClose,
}: Props) {
  const [custom, setCustom] = useState('');

  const options = useMemo(() => {
    const values = new Map<string, string>();
    for (const item of categories) {
      values.set(item.name.toLocaleLowerCase('tr-TR'), item.name);
    }
    if (current) values.set(current.toLocaleLowerCase('tr-TR'), current);
    return [...values.values()];
  }, [categories, current]);

  function choose(value: string) {
    onSelect(value.trim());
    setCustom('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.kicker}>KATEGORİ</Text>
              <Text style={styles.title}>Kategori seç</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Kapat</Text>
            </Pressable>
          </View>

          <View style={styles.goldLine} />

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {options.map(option => {
              const selected = option.toLocaleLowerCase('tr-TR') === current?.toLocaleLowerCase('tr-TR');
              return (
                <Pressable
                  key={option}
                  onPress={() => choose(option)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                  <View style={[styles.optionLine, selected && styles.optionLineSelected]} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.divider} />

          <Text style={styles.customLabel}>YENİ KATEGORİ OLUŞTUR</Text>
          <View style={styles.customRow}>
            <Field
              value={custom}
              onChangeText={setCustom}
              placeholder="Örn. Masa Oyunları"
              maxLength={40}
              style={styles.customField}
            />
            <Pressable
              disabled={!custom.trim()}
              onPress={() => choose(custom)}
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
                !custom.trim() && styles.disabled,
              ]}
            >
              <Text style={styles.addButtonText}>Oluştur</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(35, 7, 26, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '78%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    fontFamily,
    color: colors.magenta,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontFamily,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.55,
    marginTop: 4,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
  },
  closeText: {
    fontFamily,
    color: colors.inkSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  goldLine: {
    width: 50,
    height: 2,
    backgroundColor: colors.gold,
    marginTop: 14,
    marginBottom: 13,
  },
  list: {
    maxHeight: 280,
  },
  listContent: {
    gap: 8,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: {
    borderColor: colors.magenta,
    backgroundColor: colors.surfaceMuted,
  },
  optionText: {
    fontFamily,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: colors.magenta,
  },
  optionLine: {
    width: 18,
    height: 2,
    backgroundColor: colors.goldSoft,
  },
  optionLineSelected: {
    width: 30,
    backgroundColor: colors.magenta,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  customLabel: {
    fontFamily,
    color: colors.wine,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customField: {
    flex: 1,
    minHeight: 44,
  },
  addButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.wine,
  },
  addButtonText: {
    fontFamily,
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.35 },
});
