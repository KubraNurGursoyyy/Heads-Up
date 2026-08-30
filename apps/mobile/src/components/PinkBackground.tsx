import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../ui';
import { loadSettings, subscribeSettings } from '../settings';

type Props = { children: React.ReactNode };

function FloatingAurora({
  style,
  duration,
  distance,
  enabled,
}: {
  style: object;
  duration: number;
  distance: number;
  enabled: boolean;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      translateX.setValue(0);
      translateY.setValue(0);
      return;
    }

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
            toValue: distance * 0.55,
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
    return () => animation.stop();
  }, [distance, duration, enabled, translateX, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { transform: [{ translateX }, { translateY }] }]}
    />
  );
}

function GoldShimmerLine({
  style,
  delay,
  enabled,
  rotate = '0deg',
}: {
  style: object;
  delay: number;
  enabled: boolean;
  rotate?: string;
}) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      value.setValue(0.35);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0.18,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1800),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [delay, enabled, value]);

  const translateX = value.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 26],
  });

  const opacity = value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.78],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.goldLine,
        style,
        {
          opacity,
          transform: [{ translateX }, { rotate }],
        },
      ]}
    />
  );
}

export default function PinkBackground({ children }: Props) {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    void loadSettings().then(settings => setAnimationsEnabled(settings.animationsEnabled));
    return subscribeSettings(settings => setAnimationsEnabled(settings.animationsEnabled));
  }, []);

  return (
    <View style={styles.root}>
      <FloatingAurora
        style={styles.auroraOne}
        duration={9000}
        distance={20}
        enabled={animationsEnabled}
      />
      <FloatingAurora
        style={styles.auroraTwo}
        duration={12000}
        distance={26}
        enabled={animationsEnabled}
      />
      <FloatingAurora
        style={styles.auroraThree}
        duration={10500}
        distance={16}
        enabled={animationsEnabled}
      />
      <FloatingAurora
        style={styles.auroraFour}
        duration={14000}
        distance={21}
        enabled={animationsEnabled}
      />

      <View pointerEvents="none" style={styles.frameTop} />
      <View pointerEvents="none" style={styles.frameRight} />
      <View pointerEvents="none" style={styles.frameLeft} />

      <GoldShimmerLine
        style={styles.goldOne}
        delay={0}
        enabled={animationsEnabled}
        rotate="-13deg"
      />
      <GoldShimmerLine
        style={styles.goldTwo}
        delay={450}
        enabled={animationsEnabled}
        rotate="-13deg"
      />
      <GoldShimmerLine
        style={styles.goldThree}
        delay={900}
        enabled={animationsEnabled}
        rotate="16deg"
      />
      <GoldShimmerLine
        style={styles.goldFour}
        delay={1350}
        enabled={animationsEnabled}
        rotate="16deg"
      />

      <View pointerEvents="none" style={styles.magentaStroke} />
      <View pointerEvents="none" style={styles.violetStroke} />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    zIndex: 5,
  },
  auroraOne: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 190,
    top: -175,
    right: -145,
    backgroundColor: '#A62570',
    opacity: 0.42,
  },
  auroraTwo: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 230,
    bottom: -245,
    left: -235,
    backgroundColor: '#5C2B87',
    opacity: 0.5,
  },
  auroraThree: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 120,
    top: 290,
    right: -118,
    backgroundColor: '#D62C82',
    opacity: 0.28,
  },
  auroraFour: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 110,
    top: 470,
    left: -135,
    backgroundColor: '#7D3AA2',
    opacity: 0.32,
  },
  frameTop: {
    position: 'absolute',
    top: 8,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(236,217,167,0.34)',
  },
  frameRight: {
    position: 'absolute',
    top: 8,
    bottom: 86,
    right: 9,
    width: 1,
    backgroundColor: 'rgba(236,217,167,0.24)',
  },
  frameLeft: {
    position: 'absolute',
    top: 145,
    bottom: 205,
    left: 8,
    width: 1,
    backgroundColor: 'rgba(240,108,169,0.2)',
  },
  goldLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.goldSoft,
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 5,
  },
  goldOne: {
    width: 118,
    top: 88,
    right: -20,
  },
  goldTwo: {
    width: 72,
    top: 126,
    right: 7,
  },
  goldThree: {
    width: 104,
    bottom: 168,
    left: -28,
  },
  goldFour: {
    width: 58,
    bottom: 132,
    left: 18,
  },
  magentaStroke: {
    position: 'absolute',
    width: 164,
    height: 1,
    top: 240,
    left: -48,
    backgroundColor: 'rgba(240,108,169,0.34)',
    transform: [{ rotate: '-10deg' }],
  },
  violetStroke: {
    position: 'absolute',
    width: 190,
    height: 1,
    bottom: 260,
    right: -72,
    backgroundColor: 'rgba(197,139,226,0.3)',
    transform: [{ rotate: '12deg' }],
  },
});
