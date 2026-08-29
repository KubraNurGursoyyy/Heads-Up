import React from 'react';
import { StyleSheet, Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { colors, fontFamilyMedium } from '../ui';
import { foldUiText } from '../utils/watch-ui';

type Props = TextProps & {
  text: string;
  requiredTerms?: string[] | null;
  style?: StyleProp<TextStyle>;
};

export default function HighlightedTopic({ text, requiredTerms, style, ...props }: Props) {
  const required = new Set((requiredTerms ?? []).map(foldUiText).filter(Boolean));
  const parts = text.split(/([\p{L}\p{N}][\p{L}\p{N}'’_-]*)/gu);

  return (
    <Text {...props} style={style}>
      {parts.map((part, index) => {
        const highlighted = required.has(foldUiText(part));
        return (
          <Text key={`${part}-${index}`} style={highlighted ? styles.highlight : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  highlight: {
    color: '#C10F69',
    fontFamily: fontFamilyMedium,
    fontWeight: '900',
  },
});
