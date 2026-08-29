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

function FloatingGlow({
  style,
  duration,
  distance,
}: {
  style: object;
  duration: number;
  distance: number;
}) {
  const translateY = useRef(
    new Animated.Value(0),
  ).current;

  const translateX = useRef(
    new Animated.Value(0),
  ).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -distance,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),

          Animated.timing(translateX, {
            toValue: distance * 0.45,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),

          Animated.timing(translateX, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [
    distance,
    duration,
    translateX,
    translateY,
  ]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        style,
        {
          transform: [
            {
              translateX,
            },
            {
              translateY,
            },
          ],
        },
      ]}
    />
  );
}

export default function PinkBackground({
  children,
}: Props) {
  return (
    <View style={styles.root}>
      <FloatingGlow
        style={styles.glowOne}
        duration={9000}
        distance={18}
      />

      <FloatingGlow
        style={styles.glowTwo}
        duration={12000}
        distance={24}
      />

      <FloatingGlow
        style={styles.glowThree}
        duration={10500}
        distance={14}
      />

      <View
        pointerEvents="none"
        style={styles.topFade}
      />

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,

    backgroundColor: '#FFF8FA',

    overflow: 'hidden',
  },

  content: {
    flex: 1,
    zIndex: 5,
  },

  glow: {
    position: 'absolute',

    borderRadius: 999,
  },

  glowOne: {
    width: 310,
    height: 310,

    top: -110,
    right: -140,

    backgroundColor: '#F7DDE7',

    opacity: 0.48,
  },

  glowTwo: {
    width: 360,
    height: 360,

    bottom: -170,
    left: -190,

    backgroundColor: '#F1DCE7',

    opacity: 0.42,
  },

  glowThree: {
    width: 180,
    height: 180,

    top: 330,
    right: -100,

    backgroundColor: '#EEE2EF',

    opacity: 0.34,
  },

  topFade: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,

    height: 180,

    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});