import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { isDemoMode } from '../data/runtime';
import { colors, fontFamily, fontFamilyMedium } from '../ui';

type Props = {
  title: string;
  subtitle?: string;
  kicker?: string;
  onLogoPress?: () => void;
};

const demoLogo = require('../../assets/demo/heads-up-master-demo.png');
const appLogo = require('../../assets/logo.png');

export default function AppHeader({
  title,
  subtitle,
  kicker = 'HEADSUP / SMART TRACKING',
  onLogoPress,
}: Props) {
  const featured = isDemoMode && title === 'Gündem';

  return (
    <View style={[styles.root, isDemoMode && styles.demoRoot, featured && styles.featuredRoot]}>
      <Pressable
        accessibilityRole={onLogoPress ? 'button' : undefined}
        accessibilityLabel={onLogoPress ? 'Ana sayfaya dön' : undefined}
        disabled={!onLogoPress}
        onPress={onLogoPress}
        style={({ pressed }) => [
          styles.logoButton,
          isDemoMode && styles.demoLogoButton,
          featured && styles.featuredLogoButton,
          pressed && onLogoPress && styles.logoPressed,
        ]}
      >
        <Image
          source={isDemoMode ? demoLogo : appLogo}
          resizeMode="contain"
          style={[styles.logo, isDemoMode && styles.demoLogo, featured && styles.featuredLogo]}
        />
      </Pressable>

      <View style={[styles.textArea, featured && styles.featuredTextArea]}>
        <Text style={[styles.kicker, isDemoMode && styles.demoKicker]}>{kicker}</Text>
        <Text
          style={[styles.title, isDemoMode && styles.demoTitle, featured && styles.featuredTitle]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, isDemoMode && styles.demoSubtitle]}>{subtitle}</Text>
        ) : null}
        <View style={styles.ruleRow}>
          <View style={[styles.ruleAccent, isDemoMode && styles.demoRuleAccent]} />
          <View style={styles.ruleGold} />
          <View style={[styles.ruleFine, isDemoMode && styles.demoRuleFine]} />
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
  demoRoot: {
    alignItems: 'center',
    marginBottom: 18,
  },
  featuredRoot: {
    minHeight: 104,
    alignItems: 'center',
  },
  logoButton: {
    width: 88,
    minHeight: 88,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  demoLogoButton: {
    width: 70,
    minHeight: 70,
    marginRight: 14,
    justifyContent: 'center',
  },
  featuredLogoButton: {
    width: 118,
    minHeight: 104,
    marginRight: 16,
  },
  logo: { width: 88, height: 88 },
  demoLogo: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  featuredLogo: {
    width: 104,
    height: 104,
    borderRadius: 12,
  },
  logoPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  textArea: { flex: 1 },
  featuredTextArea: {
    minHeight: 104,
    justifyContent: 'center',
  },
  kicker: {
    fontFamily: fontFamilyMedium,
    color: colors.goldSoft,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  demoKicker: {
    color: colors.goldDark,
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: '600',
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
  demoTitle: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.55,
    fontWeight: '700',
  },
  featuredTitle: {
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
    fontWeight: '700',
  },
  subtitle: {
    fontFamily,
    marginTop: 5,
    color: '#E3BCD2',
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 470,
  },
  demoSubtitle: {
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11 },
  ruleAccent: { width: 48, height: 2, backgroundColor: colors.hotPink },
  demoRuleAccent: { width: 18, backgroundColor: colors.gold },
  ruleGold: { width: 22, height: 2, backgroundColor: colors.gold },
  ruleFine: { flex: 1, height: 1, backgroundColor: 'rgba(236,217,167,0.22)' },
  demoRuleFine: { backgroundColor: colors.border },
});
