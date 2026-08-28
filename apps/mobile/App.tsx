import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, clearSession, hasSession, login, logoutSession, register } from './src/api';
import { registerPush, subscribePushResponses } from './src/push';
import { Button, Field, Loading, ui } from './src/ui';
import type { Category, FeedItem, NotificationMode, Watch } from './src/types';

type Tab = 'feed' | 'add' | 'watches' | 'settings';
type FeedFilter = 'all' | 'important' | 'unread';

const notificationModes: Array<[NotificationMode, string]> = [
  ['IMPORTANT_ONLY', 'Sadece önemli gelişmeler'],
  ['ALL_RELEVANT', 'Her ilgili haberde'],
  ['SELECTED_EVENTS', 'Takip isteğindeki olaylarda'],
  ['OFF', 'Bildirim kapalı'],
];

const categories: Array<[Category | 'ALL', string]> = [
  ['ALL', 'Tümü'],
  ['GAME', 'Oyun'],
  ['BOOK', 'Kitap'],
  ['MOVIE_TV', 'Film / Dizi'],
  ['TECHNOLOGY', 'Teknoloji'],
  ['GENERAL', 'Diğer'],
];

function modeLabel(mode: NotificationMode) {
  return (
    {
      IMPORTANT_ONLY: 'Sadece önemli',
      ALL_RELEVANT: 'Her haberde',
      SELECTED_EVENTS: 'Seçili olaylarda',
      OFF: 'Kapalı',
    } as Record<NotificationMode, string>
  )[mode];
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('feed');

  useEffect(() => {
    const subscription = subscribePushResponses();
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    void (async () => {
      const storedSession = await hasSession();
      if (!storedSession) {
        setAuthed(false);
        setReady(true);
        return;
      }

      try {
        await api('/auth/me');
        setAuthed(true);
        void registerPush().catch(() => undefined);
      } catch {
        await clearSession();
        setAuthed(false);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={ui.screen}>
        <Loading />
      </SafeAreaView>
    );
  }

  if (!authed) {
    return (
      <AuthScreen
        onDone={() => {
          setAuthed(true);
          void registerPush().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={ui.screen}>
      <StatusBar style="auto" />
      <View style={{ flex: 1 }}>
        {tab === 'feed' && <FeedScreen />}
        {tab === 'add' && <AddWatchScreen onAdded={() => setTab('watches')} />}
        {tab === 'watches' && <WatchesScreen />}
        {tab === 'settings' && <SettingsScreen onLogout={() => setAuthed(false)} />}
      </View>
      <BottomTabs active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

function BottomTabs({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const tabs: Array<[Tab, string]> = [
    ['feed', 'Haberler'],
    ['add', 'Takip Ekle'],
    ['watches', 'Takiplerim'],
    ['settings', 'Ayarlar'],
  ];

  return (
    <View style={styles.tabs}>
      {tabs.map(([value, label]) => (
        <Pressable key={value} onPress={() => onChange(value)} style={styles.tab}>
          <Text style={{ fontWeight: active === value ? '800' : '500' }}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function AuthScreen({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setBusy(true);
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      onDone();
    } catch (error) {
      Alert.alert('Hata', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={ui.screen}>
      <ScrollView contentContainerStyle={[ui.pad, { paddingTop: 70 }]}>
        <Text style={ui.h1}>HeadsUp</Text>
        <Text style={[ui.muted, { marginTop: 6 }]}>
          Takip ettiğin konulardaki tüm haberleri topla, yalnız istediğin türde gelişmelerde bildirim al.
        </Text>
        <Field
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="E-posta"
        />
        <Field
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Şifre (en az 8 karakter)"
        />
        <Button
          title={busy ? 'Bekle…' : mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
          onPress={submit}
          disabled={busy}
        />
        <Button
          secondary
          title={mode === 'login' ? 'Yeni hesap oluştur' : 'Zaten hesabım var'}
          onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeedScreen() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [category, setCategory] = useState<Category | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (category !== 'ALL') params.set('category', category);
    const text = params.toString();
    return text ? `?${text}` : '';
  }, [filter, category]);

  async function load() {
    setLoading(true);
    try {
      setItems(await api<FeedItem[]>(`/feed${query}`));
    } catch (error) {
      Alert.alert('Haberler yüklenemedi', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [query]);

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.pad}>
        <Text style={ui.h1}>Haberler</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {categories.map(([value, label]) => (
            <FilterChip
              key={value}
              label={label}
              selected={category === value}
              onPress={() => setCategory(value)}
            />
          ))}
        </ScrollView>
        <View style={[ui.row, { marginTop: 10 }]}>
          <FilterChip label="Tümü" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip
            label="Önemli"
            selected={filter === 'important'}
            onPress={() => setFilter('important')}
          />
          <FilterChip
            label="Okunmamış"
            selected={filter === 'unread'}
            onPress={() => setFilter('unread')}
          />
        </View>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}
          ListEmptyComponent={
            <Text style={ui.muted}>
              Bu filtrede henüz haber yok. Bir takip eklediğinde worker gerçek kaynakları taramaya başlayacak.
            </Text>
          }
          renderItem={({ item }) => <FeedCard item={item} />}
        />
      )}
    </View>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  async function open() {
    try {
      await api(`/feed/${item.id}/read`, { method: 'PATCH' });
    } catch {}
    await Linking.openURL(item.article.canonicalUrl);
  }

  return (
    <Pressable style={ui.card} onPress={open}>
      <Text style={{ fontWeight: '800' }}>{item.watch.topic}</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', marginTop: 5 }}>{item.article.title}</Text>
      <Text style={[ui.muted, { marginTop: 6 }]}>{item.summary}</Text>
      <Text style={[ui.muted, { fontSize: 12, marginTop: 8 }]}>
        {item.article.sourceName || 'Kaynak'} · önem %{Math.round(item.importanceScore * 100)}
      </Text>
    </Pressable>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[ui.chip, selected && styles.selectedChip]}>
      <Text>{label}</Text>
    </Pressable>
  );
}

function AddWatchScreen({ onAdded }: { onAdded: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<NotificationMode>('IMPORTANT_ONLY');
  const [busy, setBusy] = useState(false);

  async function addWatch() {
    if (prompt.trim().length < 3) return;
    try {
      setBusy(true);
      await api('/watches', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim(), notificationMode: mode }),
      });
      setPrompt('');
      onAdded();
    } catch (error) {
      Alert.alert('Takip oluşturulamadı', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={ui.pad}>
      <Text style={ui.h1}>Takip Ekle</Text>
      <Text style={[ui.muted, { marginTop: 6 }]}>
        Normal şekilde yaz. Örn: “GTA 6 PC çıkış tarihi belli olursa takip et.”
      </Text>
      <Field
        multiline
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Neyi takip etmek istiyorsun?"
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />

      <Text style={[ui.h2, { marginTop: 22 }]}>Bildirim</Text>
      {notificationModes.map(([value, label]) => (
        <Pressable
          key={value}
          onPress={() => setMode(value)}
          style={[ui.card, { borderColor: mode === value ? '#111' : '#e8e8eb' }]}
        >
          <Text style={{ fontWeight: mode === value ? '800' : '500' }}>
            {mode === value ? '● ' : '○ '}
            {label}
          </Text>
        </Pressable>
      ))}

      <Button
        title={busy ? 'Oluşturuluyor…' : 'Takibi başlat'}
        onPress={addWatch}
        disabled={busy || prompt.trim().length < 3}
      />
    </ScrollView>
  );
}

function WatchesScreen() {
  const [data, setData] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setData(await api<Watch[]>('/watches'));
    } catch (error) {
      Alert.alert('Takipler yüklenemedi', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(watch: Watch, body: Partial<Pick<Watch, 'active' | 'notificationMode'>>) {
    try {
      await api(`/watches/${watch.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      await load();
    } catch (error) {
      Alert.alert('Takip güncellenemedi', (error as Error).message);
    }
  }

  function remove(watch: Watch) {
    Alert.alert('Takibi sil', `“${watch.topic}” takibi silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await api(`/watches/${watch.id}`, { method: 'DELETE' });
              await load();
            } catch (error) {
              Alert.alert('Takip silinemedi', (error as Error).message);
            }
          })();
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.pad}>
        <Text style={ui.h1}>Takiplerim</Text>
      </View>
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 30 }}
          ListEmptyComponent={<Text style={ui.muted}>Henüz takip yok.</Text>}
          renderItem={({ item }) => (
            <View style={ui.card}>
              <Text style={{ fontSize: 18, fontWeight: '800' }}>{item.topic}</Text>
              <Text style={[ui.muted, { marginTop: 5 }]}>{item.intent}</Text>
              <Text style={[ui.muted, { fontSize: 12, marginTop: 8 }]}>
                {item.category} · {item._count?.watchArticles ?? 0} haber
              </Text>

              <Text style={{ fontWeight: '700', marginTop: 12 }}>
                Bildirim: {modeLabel(item.notificationMode)}
              </Text>
              <View style={styles.wrapRow}>
                {notificationModes.map(([value]) => (
                  <FilterChip
                    key={value}
                    label={modeLabel(value)}
                    selected={item.notificationMode === value}
                    onPress={() => void patch(item, { notificationMode: value })}
                  />
                ))}
              </View>

              <View style={styles.wrapRow}>
                <Button
                  secondary
                  title={item.active ? 'Duraklat' : 'Devam et'}
                  onPress={() => void patch(item, { active: !item.active })}
                />
                <Button
                  secondary
                  title="Şimdi tara"
                  onPress={() => {
                    void api(`/watches/${item.id}/run`, { method: 'POST' })
                      .then(() => Alert.alert('Tamam', 'Tarama kuyruğa alındı.'))
                      .catch(error => Alert.alert('Hata', (error as Error).message));
                  }}
                />
                <Button secondary title="Sil" onPress={() => remove(item)} />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function SettingsScreen({ onLogout }: { onLogout: () => void }) {
  async function logout() {
    await logoutSession();
    onLogout();
  }

  function deleteAccount() {
    Alert.alert(
      'Hesabı sil',
      'Hesabın, takiplerin ve haber geçmişin kalıcı olarak silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kalıcı olarak sil',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await api('/auth/account', { method: 'DELETE' });
                await logout();
              } catch (error) {
                Alert.alert('Hata', (error as Error).message);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={ui.pad}>
      <Text style={ui.h1}>Ayarlar</Text>
      <View style={ui.card}>
        <Text style={{ fontWeight: '800' }}>Bildirim altyapısı</Text>
        <Text style={[ui.muted, { marginTop: 6 }]}>
          Gerçek Android push için EAS development/release build gerekir. Giriş sırasında cihaz tokenı
          otomatik kaydedilir.
        </Text>
      </View>
      <Button secondary title="Çıkış yap" onPress={() => void logout()} />
      <Button secondary title="Hesabı kalıcı olarak sil" onPress={deleteAccount} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  chipRow: {
    gap: 8,
    paddingTop: 12,
    paddingRight: 18,
  },
  selectedChip: {
    backgroundColor: '#cfcfd4',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
});
