import React, {
  useEffect,
  useRef,
} from 'react';

import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';

import * as SplashScreen from 'expo-splash-screen';

type Props = {
  onDone: () => void;
};

export default function StartupSplash({
  onDone,
}: Props) {
  const opacity = useRef(
    new Animated.Value(0),
  ).current;

  const scale = useRef(
    new Animated.Value(1.03),
  ).current;

  const handled = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),

      Animated.timing(scale, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  async function handleLoaded() {
    if (handled.current) {
      return;
    }

    handled.current = true;

    await SplashScreen.hideAsync().catch(
      () => undefined,
    );

    setTimeout(() => {
      onDone();
    }, 500);
  }

  return (
    <View style={styles.root}>
      <Animated.Image
        source={require('../../assets/splash.png')}
        resizeMode="cover"
        onLoadEnd={() => void handleLoaded()}
        style={[
          StyleSheet.absoluteFill,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5A7C2',
  },
});