import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { resetDemoData } from '../api';
import { colors, fontFamily, fontFamilyMedium } from '../ui';

export default function DemoBanner() {
  function reset() {
    resetDemoData();
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.reload();
  }

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <View style={styles.badgeRow}>
          <View style={styles.dot} />
          <Text style={styles.kicker}>PUBLIC DEMO</Text>
        </View>
        <Text style={styles.text}>Yerel tarayıcı verisi · gerçek hesaba bağlı değil</Text>
      </View>
      <Pressable
        onPress={reset}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>Sıfırla</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 0,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.goldDark },
  kicker: {
    fontFamily: fontFamilyMedium,
    color: colors.ink,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.75,
  },
  text: { fontFamily, color: colors.inkSoft, fontSize: 9, marginTop: 3 },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.72 },
  buttonText: {
    fontFamily: fontFamilyMedium,
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '700',
  },
});
