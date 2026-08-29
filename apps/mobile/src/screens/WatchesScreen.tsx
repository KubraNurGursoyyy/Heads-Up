import React, {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../api';
import {
  Button,
  Loading,
} from '../ui';

import AppHeader from '../components/AppHeader';
import FilterChip from '../components/FilterChip';

import type {
  NotificationMode,
  Watch,
} from '../types';

const modes: NotificationMode[] = [
  'IMPORTANT_ONLY',
  'ALL_RELEVANT',
  'SELECTED_EVENTS',
  'OFF',
];

function modeLabel(
  mode: NotificationMode,
) {
  const labels: Record<
    NotificationMode,
    string
  > = {
    IMPORTANT_ONLY: 'Sadece önemli',
    ALL_RELEVANT: 'Her haberde',
    SELECTED_EVENTS: 'Seçili olaylarda',
    OFF: 'Kapalı',
  };

  return labels[mode];
}

export default function WatchesScreen() {
  const [data, setData] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    try {
      setData(
        await api<Watch[]>('/watches'),
      );
    } catch (error) {
      Alert.alert(
        'Takipler yüklenemedi',
        (error as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(
    watch: Watch,

    body: Partial<
      Pick<
        Watch,
        'active' | 'notificationMode'
      >
    >,
  ) {
    try {
      await api(`/watches/${watch.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      await load();
    } catch (error) {
      Alert.alert(
        'Takip güncellenemedi',
        (error as Error).message,
      );
    }
  }

  function remove(watch: Watch) {
    Alert.alert(
      'Takibi sil',

      `“${watch.topic}” takibi silinsin mi?`,

      [
        {
          text: 'Vazgeç',
          style: 'cancel',
        },

        {
          text: 'Sil',
          style: 'destructive',

          onPress: () => {
            void (async () => {
              try {
                await api(
                  `/watches/${watch.id}`,
                  {
                    method: 'DELETE',
                  },
                );

                await load();
              } catch (error) {
                Alert.alert(
                  'Takip silinemedi',
                  (error as Error).message,
                );
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppHeader
          title="Takiplerim"
          subtitle="Merak ettiklerinin hepsi burada 🌸"
        />
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>
                🌷
              </Text>

              <Text style={styles.emptyTitle}>
                Henüz takip yok
              </Text>

              <Text style={styles.emptyText}>
                Takip Ekle bölümünden ilk konunu
                ekleyebilirsin.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.titleRow}>
                <View style={styles.icon}>
                  <Text style={styles.iconText}>
                    ♡
                  </Text>
                </View>

                <View style={styles.titleArea}>
                  <Text style={styles.title}>
                    {item.topic}
                  </Text>

                  <Text style={styles.intent}>
                    {item.intent}
                  </Text>
                </View>
              </View>

              <Text style={styles.meta}>
                {item.category} ·{' '}
                {item._count?.watchArticles ?? 0}{' '}
                haber
              </Text>

              <Text style={styles.notification}>
                🔔{' '}
                {modeLabel(
                  item.notificationMode,
                )}
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modeRow}
              >
                {modes.map(value => (
                  <FilterChip
                    key={value}
                    label={modeLabel(value)}
                    selected={
                      value === item.notificationMode
                    }
                    onPress={() =>
                      void patch(item, {
                        notificationMode: value,
                      })
                    }
                  />
                ))}
              </ScrollView>

              <View style={styles.actions}>
                <Button
                  secondary
                  title={
                    item.active
                      ? 'Duraklat'
                      : 'Devam et'
                  }
                  onPress={() =>
                    void patch(item, {
                      active: !item.active,
                    })
                  }
                  style={styles.action}
                />

                <Button
                  secondary
                  title="Şimdi tara"
                  onPress={() => {
                    void api(
                      `/watches/${item.id}/run`,
                      {
                        method: 'POST',
                      },
                    )
                      .then(() =>
                        Alert.alert(
                          'Tamam ♡',
                          'Tarama kuyruğa alındı.',
                        ),
                      )
                      .catch(error =>
                        Alert.alert(
                          'Hata',
                          (error as Error).message,
                        ),
                      );
                  }}
                  style={styles.action}
                />

                <Button
                  secondary
                  title="Sil"
                  onPress={() => remove(item)}
                  style={styles.action}
                />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  list: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },

  card: {
    padding: 17,
    marginBottom: 14,

    borderRadius: 27,

    backgroundColor: 'rgba(255,255,255,0.9)',

    borderWidth: 1,
    borderColor: '#FFD2E4',

    elevation: 3,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  icon: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: '#FFE8F1',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 11,
  },

  iconText: {
    color: '#ED6FA2',
    fontSize: 23,
    fontWeight: '900',
  },

  titleArea: {
    flex: 1,
  },

  title: {
    color: '#563749',
    fontSize: 18,
    fontWeight: '900',
  },

  intent: {
    color: '#936C80',
    marginTop: 4,
    lineHeight: 18,
  },

  meta: {
    color: '#B28A9F',
    marginTop: 13,
    fontSize: 12,
    fontWeight: '700',
  },

  notification: {
    color: '#563749',
    fontWeight: '800',
    marginTop: 11,
  },

  modeRow: {
    gap: 7,
    paddingTop: 9,
    paddingRight: 12,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 11,
  },

  action: {
    minHeight: 42,
    marginTop: 0,
  },

  empty: {
    minHeight: 250,

    alignItems: 'center',
    justifyContent: 'center',

    padding: 25,

    borderRadius: 30,

    backgroundColor: 'rgba(255,255,255,0.75)',

    borderWidth: 1,
    borderColor: '#FFD2E4',
  },

  emptyIcon: {
    fontSize: 50,
  },

  emptyTitle: {
    color: '#563749',
    fontWeight: '900',
    fontSize: 20,
    marginTop: 8,
  },

  emptyText: {
    color: '#936C80',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },
});