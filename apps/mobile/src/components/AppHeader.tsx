import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontFamilyMedium } from '../ui';

type Props = {
  title: string;
  subtitle?: string;
  kicker?: string;
};

export default function AppHeader({
  title,
  subtitle,
  kicker = 'HEADSUP / SMART TRACKING',
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.logoFrame}>
        <Image
          source={require('../../assets/logo.png')}
          resizeMode="contain"
          style={styles.logo}
        />
      </View>

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
  logoFrame: {
    width: 60,
    height: 60,
    marginRight: 13,
    borderWidth: 1,
    borderColor: 'rgba(236,217,167,0.56)',
    backgroundColor: 'rgba(116,19,79,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
  },
  textArea: {
    flex: 1,
  },
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
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },
  rulePink: {
    width: 48,
    height: 2,
    backgroundColor: colors.hotPink,
  },
  ruleGold: {
    width: 22,
    height: 2,
    backgroundColor: colors.gold,
  },
  ruleFine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(236,217,167,0.22)',
  },
});
