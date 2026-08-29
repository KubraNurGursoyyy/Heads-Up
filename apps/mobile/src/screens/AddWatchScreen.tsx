import React, { useState } from 'react';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api } from '../api';
import {
  Button,
  Field,
} from '../ui';

import AppHeader from '../components/AppHeader';

import type {
  NotificationMode,
} from '../types';

type Props = {
  onAdded: () => void;
};

const modes: Array<
  [NotificationMode, string]
> = [
  [
    'IMPORTANT_ONLY',
    'Sadece önemli gelişmeler',
  ],

  [
    'ALL_RELEVANT',
    'Her ilgili haberde',
  ],

  [
    'SELECTED_EVENTS',
    'Takip isteğindeki olaylarda',
  ],

  [
    'OFF',
    'Bildirim kapalı',
  ],
];

export default function AddWatchScreen({
  onAdded,
}: Props) {
  const [prompt, setPrompt] = useState('');

  const [mode, setMode] =
    useState<NotificationMode>(
      'IMPORTANT_ONLY',
    );

  const [busy, setBusy] = useState(false);

  async function save() {
    if (prompt.trim().length < 3) {
      return;
    }

    try {
      setBusy(true);

      await api('/watches', {
        method: 'POST',

        body: JSON.stringify({
          prompt: prompt.trim(),
          notificationMode: mode,
        }),
      });

      setPrompt('');
      onAdded();
    } catch (error) {
      Alert.alert(
        'Takip oluşturulamadı',
        (error as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.root}
    >
      <AppHeader
        title="Yeni takip"
        subtitle="Merak ettiğin konuyu doğal bir şekilde yaz."
      />

      <View style={styles.promptCard}>
        <Text style={styles.promptTitle}>
          Normal şekilde yaz
        </Text>

        <Text style={styles.example}>
          “GTA 6 PC çıkış tarihi belli olursa
          bana haber ver.”
        </Text>

        <Field
          multiline
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Neyi takip edelim?"
          style={styles.field}
        />
      </View>

      <Text style={styles.modeTitle}>
        Nasıl haber vereyim?
      </Text>

      {modes.map(([value, label]) => {
        const selected = value === mode;

        return (
          <Pressable
            key={value}
            onPress={() => setMode(value)}
            style={[
              styles.modeCard,
              selected && styles.modeCardSelected,
            ]}
          >
            <View
              style={[
                styles.radio,
                selected && styles.radioSelected,
              ]}
            >
              {selected && (
                <View style={styles.radioDot} />
              )}
            </View>

            <Text
              style={[
                styles.modeText,
                selected && styles.modeTextSelected,
              ]}
            >
              {label}
            </Text>

            {selected && (
              <Text style={styles.heart}>
                ♡
              </Text>
            )}
          </Pressable>
        );
      })}

      <Button
        title={
          busy
            ? 'Takip hazırlanıyor...'
            : 'Takibi başlat'
        }
        onPress={save}
        disabled={
          busy ||
          prompt.trim().length < 3
        }
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30,
  },

  promptCard: {
    padding: 18,

    borderRadius: 28,

    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.88)',

    borderWidth: 1,
    borderColor: '#FFD2E4',

    elevation: 3,
  },

  cloud: {
    fontSize: 43,
  },

  promptTitle: {
    color: '#563749',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },

  example: {
    color: '#936C80',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },

  field: {
    width: '100%',
    minHeight: 125,
    marginTop: 16,
    textAlignVertical: 'top',
  },

  modeTitle: {
    color: '#563749',
    fontSize: 18,
    fontWeight: '900',

    marginTop: 23,
    marginBottom: 10,
  },

  modeCard: {
    minHeight: 58,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 15,

    marginBottom: 9,

    borderRadius: 20,

    backgroundColor: 'rgba(255,255,255,0.8)',

    borderWidth: 1,
    borderColor: '#FFD2E4',
  },

  modeCardSelected: {
    backgroundColor: '#FFE8F1',
    borderColor: '#FA91BA',
    borderWidth: 1.5,
  },

  radio: {
    width: 22,
    height: 22,

    borderRadius: 11,

    borderWidth: 2,
    borderColor: '#FFB5D1',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  radioSelected: {
    borderColor: '#ED6FA2',
  },

  radioDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: '#ED6FA2',
  },

  modeText: {
    flex: 1,

    color: '#936C80',
    fontWeight: '700',
  },

  modeTextSelected: {
    color: '#563749',
    fontWeight: '900',
  },

  heart: {
    color: '#ED6FA2',
    fontSize: 22,
  },

  button: {
    marginTop: 18,
  },
});