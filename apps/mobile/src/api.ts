import { normalizeApiBaseUrl } from './utils/watch-ui';
import { Platform } from 'react-native';

const BASE = normalizeApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000',
);

const SINGLE_USER_KEY =
  process.env.EXPO_PUBLIC_HEADSUP_SINGLE_USER_KEY || '';

const ACCESS = 'headsup_access';
const REFRESH = 'headsup_refresh';

async function getStorageItem(
  key: string,
): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  const SecureStore = await import(
    'expo-secure-store'
  );

  return SecureStore.getItemAsync(key);
}

async function setStorageItem(
  key: string,
  value: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        key,
        value,
      );
    }

    return;
  }

  const SecureStore = await import(
    'expo-secure-store'
  );

  await SecureStore.setItemAsync(
    key,
    value,
  );
}

async function deleteStorageItem(
  key: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }

    return;
  }

  const SecureStore = await import(
    'expo-secure-store'
  );

  await SecureStore.deleteItemAsync(key);
}

export async function saveSession(
  session: {
    accessToken: string;
    refreshToken: string;
  },
) {
  await Promise.all([
    setStorageItem(
      ACCESS,
      session.accessToken,
    ),

    setStorageItem(
      REFRESH,
      session.refreshToken,
    ),
  ]);
}

export async function clearSession() {
  await Promise.all([
    deleteStorageItem(ACCESS),
    deleteStorageItem(REFRESH),
  ]);
}

export async function hasSession() {
  return Boolean(
    await getStorageItem(REFRESH),
  );
}

async function refresh() {
  const refreshToken =
    await getStorageItem(REFRESH);

  if (!refreshToken) {
    return false;
  }

  const response = await fetch(
    `${BASE}/auth/refresh`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        refreshToken,
      }),
    },
  );

  if (!response.ok) {
    await clearSession();

    return false;
  }

  const session =
    await response.json();

  await saveSession(session);

  return true;
}

export async function api<T = any>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const token =
    await getStorageItem(ACCESS);

  const headers: Record<
    string,
    string
  > = {
    'Content-Type':
      'application/json',

    ...(init.headers as
      | Record<string, string>
      | undefined),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    `${BASE}${path}`,
    {
      ...init,
      headers,
    },
  );

  if (
    response.status === 401 &&
    retry &&
    (await refresh())
  ) {
    return api<T>(
      path,
      init,
      false,
    );
  }

  if (!response.ok) {
    let message =
      `HTTP ${response.status}`;

    try {
      const body =
        await response.json();

      message =
        Array.isArray(body.message)
          ? body.message.join('\n')
          : body.message || message;
    } catch {
      // Response JSON değilse status mesajını kullan.
    }

    throw new Error(
      String(message),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function bootstrapSingleUser() {
  if (!SINGLE_USER_KEY) {
    throw new Error(
      'EXPO_PUBLIC_HEADSUP_SINGLE_USER_KEY tanımlı değil.',
    );
  }

  const session = await api<{
    accessToken: string;
    refreshToken: string;
  }>(
    '/auth/bootstrap',
    {
      method: 'POST',

      body: JSON.stringify({
        accessKey:
          SINGLE_USER_KEY,
      }),
    },
    false,
  );

  await saveSession(session);
}

export async function ensureSingleUserSession() {
  if (await hasSession()) {
    try {
      await api('/auth/me');

      return;
    } catch {
      await clearSession();
    }
  }

  await bootstrapSingleUser();

  await api('/auth/me');
}