import { Platform } from 'react-native';
import type { NotificationMode } from './types';

export type FeedFilter = 'all' | 'important' | 'unread';

export type AppSettings = {
  defaultNotificationMode: NotificationMode;
  defaultFeedFilter: FeedFilter;
  suggestionsEnabled: boolean;
  animationsEnabled: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultNotificationMode: 'IMPORTANT_ONLY',
  defaultFeedFilter: 'all',
  suggestionsEnabled: true,
  animationsEnabled: true,
};

const SETTINGS_KEY = 'headsup_app_settings_v1';
const listeners = new Set<(settings: AppSettings) => void>();

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SETTINGS_KEY);
  }

  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(SETTINGS_KEY);
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SETTINGS_KEY, value);
    }
    return;
  }

  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(SETTINGS_KEY, value);
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await readRaw();
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await writeRaw(JSON.stringify(settings));
  for (const listener of listeners) listener(settings);
}

export function subscribeSettings(listener: (settings: AppSettings) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
