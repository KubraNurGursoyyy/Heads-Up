import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ensureAppSession, isDemoMode } from './src/api';
import { registerPush, subscribePushResponses } from './src/push';
import { colors, fontFamily, Loading } from './src/ui';
import StartupSplash from './src/components/StartupSplash';
import PinkBackground from './src/components/PinkBackground';
import BottomTabs, { type AppTab } from './src/components/BottomTabs';
import DemoBanner from './src/components/DemoBanner';
import FeedScreen from './src/screens/FeedScreen';
import AddWatchScreen from './src/screens/AddWatchScreen';
import WatchesScreen from './src/screens/WatchesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ArchiveScreen from './src/screens/ArchiveScreen';

export default function App() {
  const [tab, setTab] = useState<AppTab>('feed');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = subscribePushResponses();
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    setBootReady(false);
    setBootError(null);

    try {
      await ensureAppSession();
      if (Platform.OS !== 'web') {
        void registerPush().catch(() => undefined);
      }
    } catch (error) {
      setBootError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.');
    } finally {
      setBootReady(true);
    }
  }

  if (showSplash) {
    return <StartupSplash onDone={() => setShowSplash(false)} />;
  }

  if (!bootReady) {
    return (
      <PinkBackground>
        <SafeAreaView style={styles.safeArea}>
          <ExpoStatusBar style="light" />
          <Loading />
        </SafeAreaView>
      </PinkBackground>
    );
  }

  if (bootError) {
    return (
      <PinkBackground>
        <SafeAreaView style={styles.safeArea}>
          <ExpoStatusBar style="light" />
          <View style={styles.errorContainer}>
            <View style={styles.errorPanel}>
              <View style={styles.errorGoldLine} />
              <Image
                source={require('./assets/logo.png')}
                resizeMode="contain"
                style={styles.errorLogo}
              />
              <Text style={styles.errorKicker}>HEADSUP / CONNECTION</Text>
              <Text style={styles.errorTitle}>Sunucuya ulaşılamadı</Text>
              <Text style={styles.errorDescription}>{bootError}</Text>
              <Text style={styles.retry} onPress={() => void bootstrap()}>
                Tekrar dene
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </PinkBackground>
    );
  }

  function goHome() {
    setArchiveOpen(false);
    setTab('feed');
  }

  return (
    <PinkBackground>
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="light" />
        {isDemoMode ? <DemoBanner /> : null}

        <View style={styles.content}>
          {archiveOpen ? (
            <ArchiveScreen onHome={goHome} />
          ) : (
            <>
              {tab === 'feed' && (
                <FeedScreen onOpenArchive={() => setArchiveOpen(true)} onHome={goHome} />
              )}
              {tab === 'add' && (
                <AddWatchScreen onAdded={() => setTab('watches')} onHome={goHome} />
              )}
              {tab === 'watches' && <WatchesScreen onHome={goHome} />}
              {tab === 'settings' && <SettingsScreen onHome={goHome} />}
            </>
          )}
        </View>

        {!archiveOpen ? <BottomTabs active={tab} onChange={setTab} /> : null}
      </SafeAreaView>
    </PinkBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 0) : 0,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorPanel: {
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  errorGoldLine: {
    width: 44,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: 12,
  },
  errorLogo: {
    width: 76,
    height: 76,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  errorKicker: {
    fontFamily,
    color: colors.magenta,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  errorTitle: {
    fontFamily,
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 6,
  },
  errorDescription: {
    fontFamily,
    marginTop: 9,
    color: colors.inkSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  retry: {
    fontFamily,
    alignSelf: 'flex-start',
    marginTop: 18,
    color: colors.magenta,
    fontWeight: '800',
    fontSize: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
    paddingBottom: 4,
  },
});
