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
    new Animated.Value(1.03),
  ).current;

  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const animation = Animated.parallel([
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
    ]);

    animation.start();

    const timer = setTimeout(() => {
      onDoneRef.current();
    }, 500);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [opacity, scale]);

  return (
    <View style={styles.root}>
      <Animated.Image
        source={require('../../assets/splash.png')}
        resizeMode="cover"
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
