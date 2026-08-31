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
        <Text style={styles.kicker}>PUBLIC DEMO</Text>
        <Text style={styles.text}>Veriler yalnızca bu tarayıcıda tutulur.</Text>
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
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 2,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(236,217,167,0.48)',
    backgroundColor: 'rgba(61,6,43,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: { flex: 1 },
  kicker: {
    fontFamily: fontFamilyMedium,
    color: colors.goldSoft,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  text: { fontFamily, color: colors.lightText, fontSize: 10, marginTop: 2 },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  pressed: { opacity: 0.72 },
  buttonText: {
    fontFamily: fontFamilyMedium,
    color: colors.goldSoft,
    fontSize: 9,
    fontWeight: '800',
  },
});
