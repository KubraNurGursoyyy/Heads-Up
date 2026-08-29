import React from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

export const colors = {
  background: '#FFF8FA',
  backgroundSoft: '#FDF0F5',

  surface: '#FFFCFD',
  surfaceSoft: '#FAEDF2',

  blush: '#F4C7D7',
  blushLight: '#FAE4EC',

  rose: '#C76A8E',
  roseDark: '#944A68',
  roseMuted: '#B9869B',

  mauve: '#8F7181',
  plum: '#5C3A4B',

  lavender: '#E8DCEA',

  champagne: '#E6D1BC',
  champagneLight: '#F6EDE5',

  text: '#4F3543',
  textSecondary: '#896B79',
  textMuted: '#B29AA5',

  border: '#F0D6E0',

  white: '#FFFFFF',
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary
          ? styles.secondaryButton
          : styles.primaryButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary
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
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[
        styles.field,
        props.style,
      ]}
    />
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator
        size="small"
        color={colors.rose}
      />

      <Text style={styles.loadingText}>
        HeadsUp hazırlanıyor
      </Text>
    </View>
  );
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
    fontSize: 28,
    lineHeight: 34,

    color: colors.plum,

    fontWeight: '800',

    letterSpacing: -0.7,
  },

  h2: {
    fontSize: 18,

    color: colors.plum,

    fontWeight: '800',
  },

  muted: {
    color: colors.textSecondary,
    lineHeight: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  card: {
    backgroundColor: colors.surface,

    borderRadius: 22,

    borderWidth: 1,
    borderColor: colors.border,

    padding: 18,

    shadowColor: '#7D4A60',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.07,
    shadowRadius: 18,

    elevation: 2,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,

    borderRadius: 999,

    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
  },
});

const styles = StyleSheet.create({
  button: {
    minHeight: 48,

    borderRadius: 16,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 18,

    marginTop: 10,
  },

  primaryButton: {
    backgroundColor: colors.rose,
  },

  secondaryButton: {
    backgroundColor: colors.surface,

    borderWidth: 1,
    borderColor: colors.border,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },

  primaryButtonText: {
    color: colors.white,
  },

  secondaryButtonText: {
    color: colors.roseDark,
  },

  pressed: {
    transform: [
      {
        scale: 0.985,
      },
    ],

    opacity: 0.9,
  },

  disabled: {
    opacity: 0.4,
  },

  field: {
    minHeight: 52,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: colors.border,

    backgroundColor: colors.surface,

    paddingHorizontal: 16,
    paddingVertical: 14,

    color: colors.text,

    fontSize: 16,
  },

  loading: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    gap: 12,
  },

  loadingText: {
    color: colors.textSecondary,

    fontWeight: '600',

    fontSize: 13,
  },
});