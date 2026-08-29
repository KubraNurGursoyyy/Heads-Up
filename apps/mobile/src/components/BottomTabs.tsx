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
  icon: string;
}> = [
  {
    value: 'feed',
    label: 'Haberler',
    icon: '☁',
  },
  {
    value: 'add',
    label: 'Takip Ekle',
    icon: '＋',
  },
  {
    value: 'watches',
    label: 'Takiplerim',
    icon: '♡',
  },
  {
    value: 'settings',
    label: 'Ayarlar',
    icon: '⚙',
  },
];

export default function BottomTabs({
  active,
  onChange,
}: Props) {
  return (
    <View style={styles.outer}>
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
                  styles.iconCircle,
                  selected &&
                    styles.iconCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.icon,
                    selected &&
                      styles.iconSelected,
                  ]}
                >
                  {tab.icon}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  selected &&
                    styles.labelSelected,
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
  outer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },

  root: {
    minHeight: 72,

    flexDirection: 'row',

    borderRadius: 26,

    paddingHorizontal: 5,
    paddingVertical: 6,

    backgroundColor: 'rgba(255,255,255,0.95)',

    borderWidth: 1,
    borderColor: '#FFD2E4',

    elevation: 6,
  },

  tab: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircle: {
    width: 35,
    height: 30,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircleSelected: {
    backgroundColor: '#FFD2E4',
  },

  icon: {
    fontSize: 19,
    color: '#B28A9F',
    fontWeight: '900',
  },

  iconSelected: {
    color: '#D9528B',
  },

  label: {
    marginTop: 3,

    fontSize: 10,

    color: '#B28A9F',

    fontWeight: '700',
  },

  labelSelected: {
    color: '#D9528B',
    fontWeight: '900',
  },
});