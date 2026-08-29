import * as SecureStore from 'expo-secure-store';

const BASE = (
  process.env.EXPO_PUBLIC_API_URL ||
  'http://10.0.2.2:3000'
).replace(/\/$/, '');

const SINGLE_USER_KEY =
  process.env.EXPO_PUBLIC_HEADSUP_SINGLE_USER_KEY || '';

const ACCESS = 'headsup_access';
const REFRESH = 'headsup_refresh';

export async function saveSession(session: {
  accessToken: string;
  refreshToken: string;
}) {
  await SecureStore.setItemAsync(
    ACCESS,
    session.accessToken,
  );

  await SecureStore.setItemAsync(
    REFRESH,
    session.refreshToken,
  );
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}

export async function hasSession() {
  return Boolean(
    await SecureStore.getItemAsync(REFRESH),
  );
}

async function refresh() {
  const refreshToken =
    await SecureStore.getItemAsync(REFRESH);

  if (!refreshToken) {
    return false;
  }

  const response = await fetch(
    `${BASE}/auth/refresh`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

  const session = await response.json();

  await saveSession(session);

  return true;
}

export async function api<T = any>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const token =
    await SecureStore.getItemAsync(ACCESS);

  const headers: Record<string, string> = {
    ...(init.headers as
      | Record<string, string>
      | undefined),
    'Content-Type': 'application/json',
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
        body.message || message;
    } catch {}

    throw new Error(
      Array.isArray(message)
        ? message.join('\n')
        : String(message),
    );
  }

  return response.status === 204
    ? (undefined as T)
    : response.json();
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
        accessKey: SINGLE_USER_KEY,
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