import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

const SPLASH_ASPECT = 945 / 2048;

type Props = { onDone: () => void };

export default function StartupSplash({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.985)).current;
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const size = useMemo(() => {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const screenAspect = safeWidth / safeHeight;

    if (screenAspect > SPLASH_ASPECT) {
      return {
        width: safeHeight * SPLASH_ASPECT,
        height: safeHeight,
      };
    }

    return {
      width: safeWidth,
      height: safeWidth / SPLASH_ASPECT,
    };
  }, [height, width]);

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    const timer = setTimeout(() => onDoneRef.current(), 650);

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
            width: size.width,
            height: size.height,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#350727',
    overflow: 'hidden',
  },
  image: {
    maxWidth: '100%',
    maxHeight: '100%',
  },
});
