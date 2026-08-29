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
  children: React.ReactNode;
};

function FloatingItem({
  children,
  style,
  distance = 14,
  duration = 6500,
}: {
  children: string;
  style: object;
  distance?: number;
  duration?: number;
}) {
  const translateY = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -distance,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),

        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [distance, duration, translateY]);

  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.decor,
        style,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
}

export default function PinkBackground({
  children,
}: Props) {
  return (
    <View style={styles.root}>
      <FloatingItem
        style={styles.cloudOne}
        duration={7000}
      >
        ☁️
      </FloatingItem>

      <FloatingItem
        style={styles.cloudTwo}
        duration={8500}
        distance={10}
      >
        ☁️
      </FloatingItem>

      <FloatingItem
        style={styles.cloudThree}
        duration={10000}
        distance={18}
      >
        ☁️
      </FloatingItem>

      <FloatingItem
        style={styles.starOne}
        duration={3500}
        distance={7}
      >
        ✦
      </FloatingItem>

      <FloatingItem
        style={styles.starTwo}
        duration={4300}
        distance={5}
      >
        ✧
      </FloatingItem>

      <FloatingItem
        style={styles.flower}
        duration={6000}
        distance={8}
      >
        🌸
      </FloatingItem>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF3F8',
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    zIndex: 2,
  },

  decor: {
    position: 'absolute',
    zIndex: 1,
  },

  cloudOne: {
    fontSize: 95,
    opacity: 0.13,
    top: 90,
    left: -30,
  },

  cloudTwo: {
    fontSize: 72,
    opacity: 0.11,
    top: 340,
    right: -18,
  },

  cloudThree: {
    fontSize: 110,
    opacity: 0.08,
    bottom: 80,
    left: -38,
  },

  starOne: {
    top: 150,
    right: 28,
    fontSize: 28,
    color: '#E4B95F',
    opacity: 0.65,
  },

  starTwo: {
    top: 470,
    left: 27,
    fontSize: 22,
    color: '#E4B95F',
    opacity: 0.5,
  },

  flower: {
    right: 24,
    bottom: 160,
    fontSize: 22,
    opacity: 0.3,
  },
});