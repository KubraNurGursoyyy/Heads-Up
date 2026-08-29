import React, { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { ensureSingleUserSession } from './src/api';
import {
  registerPush,
  subscribePushResponses,
} from './src/push';

import { Loading, ui } from './src/ui';

import StartupSplash from './src/components/StartupSplash';
import PinkBackground from './src/components/PinkBackground';
import BottomTabs, {
  type AppTab,
} from './src/components/BottomTabs';

import FeedScreen from './src/screens/FeedScreen';
import AddWatchScreen from './src/screens/AddWatchScreen';
import WatchesScreen from './src/screens/WatchesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [tab, setTab] = useState<AppTab>('feed');

  const [bootReady, setBootReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const [bootError, setBootError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const subscription = subscribePushResponses();

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    setBootReady(false);
    setBootError(null);

    try {
      await ensureSingleUserSession();

      void registerPush().catch(() => undefined);
    } catch (error) {
      setBootError((error as Error).message);
    } finally {
      setBootReady(true);
    }
  }

  if (showSplash) {
    return (
      <StartupSplash
        onDone={() => setShowSplash(false)}
      />
    );
  }

  if (!bootReady) {
    return (
      <PinkBackground>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <Loading />
        </SafeAreaView>
      </PinkBackground>
    );
  }

  if (bootError) {
    return (
      <PinkBackground>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />

          <View style={styles.errorContainer}>
            <Image
              source={require('./assets/logo.png')}
              resizeMode="contain"
              style={styles.errorLogo}
            />

            <View style={ui.card}>
              <Text style={ui.h1}>
                Minik bir sorun oldu 🌸
              </Text>

              <Text style={styles.errorDescription}>
                HeadsUp sunucuya ulaşamadı.
              </Text>

              <Text style={styles.errorMessage}>
                {bootError}
              </Text>

              <Text
                style={styles.retry}
                onPress={() => void bootstrap()}
              >
                Tekrar dene ♡
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </PinkBackground>
    );
  }

  return (
    <PinkBackground>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        <View style={styles.content}>
          {tab === 'feed' && <FeedScreen />}

          {tab === 'add' && (
            <AddWatchScreen
              onAdded={() => setTab('watches')}
            />
          )}

          {tab === 'watches' && <WatchesScreen />}

          {tab === 'settings' && <SettingsScreen />}
        </View>

        <BottomTabs
          active={tab}
          onChange={setTab}
        />
      </SafeAreaView>
    </PinkBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  content: {
    flex: 1,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  errorLogo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 18,
  },

  errorDescription: {
    marginTop: 10,
    color: '#936C80',
  },

  errorMessage: {
    marginTop: 8,
    color: '#B26B8B',
    fontSize: 12,
  },

  retry: {
    marginTop: 20,
    color: '#D9528B',
    fontWeight: '900',
    fontSize: 16,
  },
});