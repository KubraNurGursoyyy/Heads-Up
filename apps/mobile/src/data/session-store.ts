import { Platform } from 'react-native';

export interface SessionStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

class WebSessionStore implements SessionStore {
  async get(key: string) {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }

  async set(key: string, value: string) {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  }

  async remove(key: string) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  }
}

class NativeSessionStore implements SessionStore {
  async get(key: string) {
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(key);
  }

  async set(key: string, value: string) {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  }

  async remove(key: string) {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  }
}

export function createSessionStore(): SessionStore {
  return Platform.OS === 'web' ? new WebSessionStore() : new NativeSessionStore();
}
