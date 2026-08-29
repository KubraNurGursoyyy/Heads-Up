import React from 'react';

import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
};

export default function AppHeader({
  title,
  subtitle,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.logoCircle}>
        <Image
          source={require('../../assets/logo.png')}
          resizeMode="contain"
          style={styles.logo}
        />
      </View>

      <View style={styles.textArea}>
        <Text style={styles.title}>
          {title}
        </Text>

        {subtitle ? (
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Text style={styles.heart}>
        ♡
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  logoCircle: {
    width: 64,
    height: 64,

    borderRadius: 32,

    backgroundColor: 'rgba(255,255,255,0.85)',

    borderWidth: 1,
    borderColor: '#FFD2E4',

    alignItems: 'center',
    justifyContent: 'center',

    elevation: 3,
  },

  logo: {
    width: 56,
    height: 56,
  },

  textArea: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    color: '#563749',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 3,
    color: '#936C80',
    fontSize: 13,
    lineHeight: 18,
  },

  heart: {
    color: '#ED6FA2',
    fontSize: 28,
    marginLeft: 8,
  },
});