import React from 'react';

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';

export default function SettingsScreen() {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.root}
    >
      <AppHeader
        title="Ayarlar"
        subtitle="HeadsUp deneyimini yönet."
      />

      <SettingCard
        title="Kişisel kullanım"
        description="Bu kurulum yalnızca senin kullanımın için yapılandırıldı."
      />

      <SettingCard
        title="Bildirimler"
        description="Önemli gelişmeleri telefonuna bildirim olarak alabilirsin."
      />

      <SettingCard
        title="HeadsUp"
        description="Takip ettiğin konuları düzenli olarak kontrol eder ve yeni gelişmeleri tek yerde toplar."
      />

      <View style={styles.brandArea}>
        <Image
          source={require('../../assets/logo.png')}
          resizeMode="contain"
          style={styles.logo}
        />

        <Text style={styles.brand}>
          HeadsUp
        </Text>

        <Text style={styles.version}>
          Personal edition
        </Text>
      </View>
    </ScrollView>
  );
}

function SettingCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.accent} />

      <View style={styles.content}>
        <Text style={styles.title}>
          {title}
        </Text>

        <Text style={styles.description}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },

  card: {
    flexDirection: 'row',

    alignItems: 'center',

    padding: 18,

    marginBottom: 12,

    borderRadius: 20,

    backgroundColor: '#FFFCFD',

    borderWidth: 1,
    borderColor: '#F0D6E0',

    shadowColor: '#6A4556',

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.05,

    shadowRadius: 16,

    elevation: 2,
  },

  accent: {
    width: 4,
    height: 34,

    borderRadius: 4,

    backgroundColor: '#D18AA6',

    marginRight: 14,
  },

  content: {
    flex: 1,
  },

  title: {
    color: '#4F3543',

    fontSize: 15,

    fontWeight: '800',
  },

  description: {
    marginTop: 5,

    color: '#896B79',

    fontSize: 13,

    lineHeight: 19,
  },

  brandArea: {
    alignItems: 'center',

    marginTop: 36,
  },

  logo: {
    width: 90,
    height: 90,
  },

  brand: {
    marginTop: 8,

    color: '#694656',

    fontSize: 16,

    fontWeight: '800',

    letterSpacing: 0.4,
  },

  version: {
    marginTop: 3,

    color: '#B29AA5',

    fontSize: 11,

    letterSpacing: 0.7,
  },
});