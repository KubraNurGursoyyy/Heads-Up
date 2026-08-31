import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { isDemoMode } from '../data/runtime';
import { colors, fontFamily } from '../ui';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Sil',
  cancelLabel = 'Vazgeç',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.goldLine} />
          <Text style={styles.kicker}>ONAY</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.divider} />
          <View style={styles.actions}>
            <Pressable onPress={onCancel} disabled={busy} style={styles.cancelButton}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.pressed,
                busy && styles.disabled,
              ]}
            >
              <Text style={styles.confirmText}>{busy ? 'Siliniyor...' : confirmLabel}</Text>
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
    backgroundColor: isDemoMode ? 'rgba(39,35,31,0.36)' : 'rgba(26, 8, 20, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modal: {
    width: '100%',
    maxWidth: isDemoMode ? 390 : 430,
    backgroundColor: isDemoMode ? colors.background : colors.surface,
    borderRadius: isDemoMode ? 10 : 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 22,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: isDemoMode ? 0.1 : 0.2,
    shadowRadius: 36,
    elevation: 8,
  },
  goldLine: { width: 42, height: 2, backgroundColor: colors.gold, marginBottom: 14 },
  kicker: {
    fontFamily,
    color: isDemoMode ? colors.goldDark : colors.magenta,
    fontSize: 10,
    fontWeight: isDemoMode ? '700' : '800',
    letterSpacing: 1.6,
  },
  title: {
    fontFamily,
    color: colors.ink,
    fontSize: 22,
    fontWeight: isDemoMode ? '700' : '800',
    letterSpacing: -0.55,
    marginTop: 6,
  },
  message: { fontFamily, color: colors.inkSoft, fontSize: 14, lineHeight: 21, marginTop: 9 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: {
    minHeight: 44,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
  },
  cancelText: { fontFamily, color: colors.ink, fontWeight: '700', fontSize: 13 },
  confirmButton: {
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.wine,
    borderRadius: 10,
  },
  confirmText: {
    fontFamily,
    color: colors.white,
    fontWeight: isDemoMode ? '700' : '800',
    fontSize: 13,
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.48 },
});
