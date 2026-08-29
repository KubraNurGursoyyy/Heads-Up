import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function FilterChip({
  label,
  selected,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.root,

        selected && styles.selected,

        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.text,
          selected && styles.selectedText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 13,
    paddingVertical: 9,

    borderRadius: 999,

    backgroundColor: 'rgba(255,255,255,0.78)',

    borderWidth: 1,
    borderColor: '#FFD2E4',
  },

  selected: {
    backgroundColor: '#FA91BA',
    borderColor: '#FA91BA',
  },

  text: {
    color: '#936C80',
    fontWeight: '700',
    fontSize: 13,
  },

  selectedText: {
    color: '#FFFFFF',
  },

  pressed: {
    opacity: 0.75,
  },
});