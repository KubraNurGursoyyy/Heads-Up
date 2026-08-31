import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { isDemoMode } from '../data/runtime';

const appSplash = require('../../assets/splash.png');
const demoSplash = require('../../assets/demo/splash-demo.png');

type Props = { onDone: () => void };

export default function StartupSplash({ onDone }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.992)).current;
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    const timer = setTimeout(() => onDoneRef.current(), isDemoMode ? 980 : 720);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [opacity, scale]);

  const image = (
    <Animated.Image
      source={isDemoMode ? demoSplash : appSplash}
      resizeMode={isDemoMode ? 'cover' : 'contain'}
      style={[
        styles.image,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );

  if (isDemoMode) {
    return (
      <View style={styles.demoCanvas}>
        <View style={styles.demoFrame}>{image}</View>
      </View>
    );
  }

  return <View style={styles.root}>{image}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#350727',
    overflow: 'hidden',
  },
  demoCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE7DA',
  },
  demoFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    maxHeight: 900,
    overflow: 'hidden',
    backgroundColor: '#FDC85A',
    shadowColor: '#2A241C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
