import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../ui';

type Props = { label?: string };

export default function SoftProgressBar({ label }: Props) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [value]);

  const scaleX = value.interpolate({ inputRange: [0, 1], outputRange: [0.28, 1] });
  const opacity = value.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={styles.root}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { opacity, transform: [{ scaleX }] }]} />
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%' },
  track: {
    height: 4,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.palePink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  label: {
    fontFamily,
    marginTop: 7,
    color: colors.inkSoft,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.15,
  },
});
