import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontFamilyMedium } from '../ui';

type Props = {
  title: string;
  subtitle?: string;
  kicker?: string;
  onLogoPress?: () => void;
};

export default function AppHeader({
  title,
  subtitle,
  kicker = 'HEADSUP / SMART TRACKING',
  onLogoPress,
}: Props) {
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole={onLogoPress ? 'button' : undefined}
        accessibilityLabel={onLogoPress ? 'Ana sayfaya dön' : undefined}
        disabled={!onLogoPress}
        onPress={onLogoPress}
        style={({ pressed }) => [styles.logoButton, pressed && onLogoPress && styles.logoPressed]}
      >
        <Image source={require('../../assets/logo.png')} resizeMode="contain" style={styles.logo} />
      </Pressable>

      <View style={styles.textArea}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.ruleRow}>
          <View style={styles.rulePink} />
          <View style={styles.ruleGold} />
          <View style={styles.ruleFine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  logoButton: {
    width: 88,
    minHeight: 88,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: {
    width: 88,
    height: 88,
  },
  logoPressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  textArea: { flex: 1 },
  kicker: {
    fontFamily: fontFamilyMedium,
    color: colors.goldSoft,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    fontFamily: fontFamilyMedium,
    color: colors.lightText,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.9,
    marginTop: 4,
  },
  subtitle: {
    fontFamily,
    marginTop: 5,
    color: '#E3BCD2',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 470,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11 },
  rulePink: { width: 48, height: 2, backgroundColor: colors.hotPink },
  ruleGold: { width: 22, height: 2, backgroundColor: colors.gold },
  ruleFine: { flex: 1, height: 1, backgroundColor: 'rgba(236,217,167,0.22)' },
});
