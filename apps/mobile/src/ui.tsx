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

export const colors = {
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

// Web'de TT Norms Pro cihazda kuruluysa doğrudan onu kullanır.
// Native'de font dosyası ayrıca yüklenmediği sürece modern sistem sans-serif kullanılır.
export const fontFamily = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  web: '"TT Norms Pro", "Avenir Next", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
});

export const fontFamilyMedium = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-medium',
  web: '"TT Norms Pro", "Avenir Next", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
      <ActivityIndicator size="small" color={colors.goldSoft} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.divider} />
      <View style={styles.dividerGold} />
      <View style={styles.dividerPink} />
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
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    shadowColor: '#160511',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 5,
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: colors.magenta,
    borderColor: '#F174AD',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  dangerButton: {
    backgroundColor: '#E8C1D3',
    borderColor: '#B45D83',
  },
  buttonText: {
    fontFamily: fontFamilyMedium,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.25,
  },
  primaryButtonText: {
    color: colors.lightText,
  },
  secondaryButtonText: {
    color: colors.ink,
  },
  dangerButtonText: {
    color: colors.danger,
  },
  pressed: {
    transform: [{ scale: 0.986 }],
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.42,
  },
  field: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: '#F0D2E1',
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: colors.ink,
    fontFamily,
    fontSize: 15,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily,
    color: colors.lightText,
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
    backgroundColor: 'rgba(244,208,226,0.34)',
  },
  dividerGold: {
    width: 30,
    height: 2,
    backgroundColor: colors.gold,
  },
  dividerPink: {
    width: 12,
    height: 2,
    backgroundColor: colors.hotPink,
  },
  sectionLabel: {
    fontFamily: fontFamilyMedium,
    color: colors.goldSoft,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.65,
    textTransform: 'uppercase',
  },
});
