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
    new Animated.Value(0.98),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),

      Animated.timing(scale, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      onDone();
    }, 500);

    return () => clearTimeout(timer);
  }, [opacity, scale, onDone]);

  return (
    <View style={styles.root}>
      <Animated.Image
        source={require('../../assets/splash.png')}
        resizeMode="contain"
        style={[
          styles.image,
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
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },
});