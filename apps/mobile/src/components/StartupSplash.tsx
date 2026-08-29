import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

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
    const timer = setTimeout(() => onDoneRef.current(), 720);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [opacity, scale]);

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
    backgroundColor: '#350727',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
