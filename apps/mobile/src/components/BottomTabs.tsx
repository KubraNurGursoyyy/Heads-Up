import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type AppTab =
  | 'feed'
  | 'add'
  | 'watches'
  | 'settings';

type Props = {
  active: AppTab;
  onChange: (tab: AppTab) => void;
};

const tabs: Array<{
  value: AppTab;
  label: string;
}> = [
  {
    value: 'feed',
    label: 'Haberler',
  },
  {
    value: 'add',
    label: 'Yeni Takip',
  },
  {
    value: 'watches',
    label: 'Takipler',
  },
  {
    value: 'settings',
    label: 'Ayarlar',
  },
];

export default function BottomTabs({
  active,
  onChange,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.root}>
        {tabs.map(tab => {
          const selected =
            active === tab.value;

          return (
            <Pressable
              key={tab.value}
              onPress={() =>
                onChange(tab.value)
              }
              style={styles.tab}
            >
              <View
                style={[
                  styles.indicator,
                  selected &&
                    styles.indicatorActive,
                ]}
              />

              <Text
                style={[
                  styles.label,
                  selected &&
                    styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  root: {
    flexDirection: 'row',

    minHeight: 66,

    paddingHorizontal: 6,

    backgroundColor: 'rgba(255,252,253,0.96)',

    borderRadius: 22,

    borderWidth: 1,
    borderColor: '#F0D6E0',

    shadowColor: '#6A4556',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.08,

    shadowRadius: 20,

    elevation: 4,
  },

  tab: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',
  },

  indicator: {
    width: 18,
    height: 3,

    borderRadius: 3,

    marginBottom: 7,

    backgroundColor: 'transparent',
  },

  indicatorActive: {
    backgroundColor: '#C76A8E',
  },

  label: {
    color: '#A28A95',

    fontSize: 11,

    fontWeight: '600',
  },

  labelActive: {
    color: '#704456',

    fontWeight: '800',
  },
});