import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { isDemoMode } from './data/runtime';

const appColors = {
  background: '#350727',
  backgroundStrong: '#52103E',
  backgroundViolet: '#32104B',
  surface: '#F3D9E7',
  surfaceMuted: '#E9C5D8',
  surfaceStrong: '#DFAEC8',
  ink: '#171116',
  inkSoft: '#4D3745',
  inkMuted: '#78616F',
  wine: '#43072E',
  wineSoft: '#71164E',
  magenta: '#D92C82',
  hotPink: '#F06CA9',
  pink: '#F1A0C5',
  palePink: '#F5D7E6',
  violet: '#8D4CB7',
  lavender: '#D6B9E5',
  gold: '#D0A95C',
  goldSoft: '#ECD9A7',
  goldDark: '#9D7735',
  border: '#C98EAA',
  borderStrong: '#9B4D78',
  lightText: '#F9EAF3',
  white: '#FFF1F7',
  danger: '#94244E',
};

const demoColors = {
  background: '#FFFFFF',
  backgroundStrong: '#FFF7EE',
  backgroundViolet: '#F5F3EF',
  surface: '#F7F5F0',
  surfaceMuted: '#EFEDE7',
  surfaceStrong: '#FFF0D8',
  ink: '#191918',
  inkSoft: '#55524D',
  inkMuted: '#858078',
  wine: '#20201E',
  wineSoft: '#45423D',
  magenta: '#C9962D',
  hotPink: '#E8A160',
  pink: '#F1BD78',
  palePink: '#FBF5E9',
  violet: '#A9AB9A',
  lavender: '#E1E2D8',
  gold: '#C99A33',
  goldSoft: '#EEDAA3',
  goldDark: '#8D6516',
  border: '#E1DED7',
  borderStrong: '#C7C2B9',
  lightText: '#FFFFFF',
  white: '#FFFFFF',
  danger: '#963F34',
};

export const colors = isDemoMode ? demoColors : appColors;

export const fontFamily = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  web: '"Segoe UI Variable Text", Inter, "Helvetica Neue", Arial, sans-serif',
});

export const fontFamilyMedium = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-medium',
  web: '"Segoe UI Variable Display", Inter, "Helvetica Neue", Arial, sans-serif',
});

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  danger = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        danger ? styles.dangerButton : secondary ? styles.secondaryButton : styles.primaryButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          danger
            ? styles.dangerButtonText
            : secondary
              ? styles.secondaryButtonText
              : styles.primaryButtonText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.inkMuted}
      {...props}
      style={[styles.field, props.style]}
    />
  );
}

export function Loading({ label = 'HeadsUp hazırlanıyor' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="small" color={isDemoMode ? colors.goldDark : colors.goldSoft} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider} />
      <View style={styles.dividerGold} />
      <View style={styles.dividerAccent} />
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pad: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  h1: {
    fontFamily: fontFamilyMedium,
    fontSize: 28,
    lineHeight: 33,
    color: colors.ink,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  h2: {
    fontFamily: fontFamilyMedium,
    fontSize: 18,
    color: colors.ink,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  muted: {
    fontFamily,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: isDemoMode ? 10 : 15,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDemoMode ? 0.025 : 0.2,
    shadowRadius: isDemoMode ? 12 : 28,
    elevation: isDemoMode ? 1 : 5,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: isDemoMode ? 7 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: isDemoMode ? colors.wine : colors.magenta,
    borderColor: isDemoMode ? colors.gold : '#F174AD',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  dangerButton: {
    backgroundColor: isDemoMode ? '#FFF1EC' : '#E8C1D3',
    borderColor: isDemoMode ? '#D9A39A' : '#B45D83',
  },
  buttonText: {
    fontFamily: fontFamilyMedium,
    fontSize: 12,
    fontWeight: isDemoMode ? '700' : '800',
    letterSpacing: isDemoMode ? 0 : 0.15,
  },
  primaryButtonText: { color: colors.lightText },
  secondaryButtonText: { color: colors.ink },
  dangerButtonText: { color: colors.danger },
  pressed: { transform: [{ scale: 0.988 }], opacity: 0.86 },
  disabled: { opacity: 0.42 },
  field: {
    minHeight: 52,
    borderRadius: isDemoMode ? 7 : 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: isDemoMode ? colors.background : '#F0D2E1',
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: colors.ink,
    fontFamily,
    fontSize: isDemoMode ? 14 : 15,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily,
    color: isDemoMode ? colors.inkSoft : colors.lightText,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: isDemoMode ? colors.border : 'rgba(244,208,226,0.34)',
  },
  dividerGold: { width: 30, height: 2, backgroundColor: colors.gold },
  dividerAccent: {
    width: 12,
    height: 2,
    backgroundColor: isDemoMode ? colors.gold : appColors.hotPink,
  },
  sectionLabel: {
    fontFamily: fontFamilyMedium,
    color: isDemoMode ? colors.goldDark : colors.goldSoft,
    fontSize: 9,
    fontWeight: isDemoMode ? '700' : '800',
    letterSpacing: isDemoMode ? 0.85 : 1.55,
    textTransform: 'uppercase',
  },
});
