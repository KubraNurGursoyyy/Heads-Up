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
  background: '#FFF3F8',
  backgroundStrong: '#FFE5F0',

  pink50: '#FFF6FA',
  pink100: '#FFE8F1',
  pink200: '#FFD2E4',
  pink300: '#FFB5D1',
  pink400: '#FA91BA',
  pink500: '#ED6FA2',
  pink600: '#D9528B',

  purple: '#B78AD8',
  lavender: '#E8D7F7',

  gold: '#E4B95F',
  goldSoft: '#FFE6A6',

  white: '#FFFFFF',

  text: '#563749',
  textSoft: '#936C80',
  textVerySoft: '#B28A9F',

  border: '#F6C5D9',

  shadow: '#B95B88',
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
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        secondary
          ? styles.secondaryButton
          : styles.primaryButton,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
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
      placeholderTextColor={colors.textVerySoft}
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
      <View style={styles.loadingBubble}>
        <ActivityIndicator
          size="large"
          color={colors.pink500}
        />
      </View>

      <Text style={styles.loadingText}>
        HeadsUp hazırlanıyor...
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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
  },

  h1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.8,
  },

  h2: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.text,
  },

  muted: {
    color: colors.textSoft,
    lineHeight: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,

    padding: 17,
    marginBottom: 13,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,

    elevation: 3,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,

    borderRadius: 999,

    backgroundColor: colors.pink100,

    borderWidth: 1,
    borderColor: colors.pink200,
  },
});

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 18,

    paddingHorizontal: 18,
    paddingVertical: 13,

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 10,
  },

  primaryButton: {
    backgroundColor: colors.pink500,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,

    elevation: 3,
  },

  secondaryButton: {
    backgroundColor: colors.pink50,

    borderWidth: 1,
    borderColor: colors.pink200,
  },

  buttonPressed: {
    transform: [
      {
        scale: 0.975,
      },
    ],
    opacity: 0.9,
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },

  primaryButtonText: {
    color: colors.white,
  },

  secondaryButtonText: {
    color: colors.pink600,
  },

  field: {
    minHeight: 52,

    marginTop: 12,

    paddingHorizontal: 16,
    paddingVertical: 13,

    backgroundColor: 'rgba(255,255,255,0.9)',

    borderWidth: 1.5,
    borderColor: colors.pink200,

    borderRadius: 20,

    color: colors.text,
    fontSize: 16,

    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,

    elevation: 1,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },

  loadingBubble: {
    width: 72,
    height: 72,

    borderRadius: 36,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.white,

    borderWidth: 1,
    borderColor: colors.pink200,
  },

  loadingText: {
    color: colors.textSoft,
    fontWeight: '700',
  },
});