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
        subtitle="HeadsUp'ı kendine göre ayarla ✨"
      />

      <SettingCard
        icon="♡"
        title="Kişisel kullanım"
        description="Bu HeadsUp kurulumu yalnızca senin için. Giriş veya kayıt ekranı yok."
      />

      <SettingCard
        icon="🔔"
        title="Bildirimler"
        description="Telefon bildirimleri uygulama açılırken otomatik hazırlanır."
        iconBackground="#E8D7F7"
      />

      <SettingCard
        icon="✨"
        title="HeadsUp"
        description="Merak ettiğin şeyi unutma. HeadsUp senin yerine takip etsin."
        iconBackground="#FFE6A6"
      />

      <Image
        source={require('../../assets/logo.png')}
        resizeMode="contain"
        style={styles.logo}
      />

      <Text style={styles.footer}>
        made with ♡
      </Text>
    </ScrollView>
  );
}

function SettingCard({
  icon,
  title,
  description,
  iconBackground = '#FFE8F1',
}: {
  icon: string;
  title: string;
  description: string;
  iconBackground?: string;
}) {
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <Text style={styles.iconText}>
          {icon}
        </Text>
      </View>

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
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 15,
    marginBottom: 12,

    borderRadius: 24,

    backgroundColor: 'rgba(255,255,255,0.86)',

    borderWidth: 1,
    borderColor: '#FFD2E4',
  },

  icon: {
    width: 54,
    height: 54,

    borderRadius: 27,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 13,
  },

  iconText: {
    fontSize: 24,
    color: '#ED6FA2',
  },

  content: {
    flex: 1,
  },

  title: {
    color: '#563749',
    fontSize: 16,
    fontWeight: '900',
  },

  description: {
    color: '#936C80',
    marginTop: 4,
    lineHeight: 18,
    fontSize: 13,
  },

  logo: {
    width: 135,
    height: 135,

    alignSelf: 'center',

    marginTop: 25,
  },

  footer: {
    textAlign: 'center',

    color: '#B28A9F',

    fontWeight: '700',

    marginTop: -8,
    marginBottom: 15,
  },
});