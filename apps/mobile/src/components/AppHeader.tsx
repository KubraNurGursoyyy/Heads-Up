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
      <Image
        source={require('../../assets/logo.png')}
        resizeMode="contain"
        style={styles.logo}
      />

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

      <View style={styles.accent}>
        <View style={styles.accentDotLarge} />
        <View style={styles.accentDotSmall} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 22,
  },

  logo: {
    width: 54,
    height: 54,

    marginRight: 13,
  },

  textArea: {
    flex: 1,
  },

  title: {
    color: '#4F3543',

    fontSize: 24,

    fontWeight: '800',

    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 4,

    color: '#896B79',

    fontSize: 13,

    lineHeight: 18,
  },

  accent: {
    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',
  },

  accentDotLarge: {
    width: 9,
    height: 9,

    borderRadius: 5,

    backgroundColor: '#D18AA6',
  },

  accentDotSmall: {
    width: 4,
    height: 4,

    borderRadius: 2,

    backgroundColor: '#E4C5D1',

    marginTop: 4,
  },
});