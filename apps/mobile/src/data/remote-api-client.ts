import { normalizeApiBaseUrl } from '../utils/watch-ui';
import type { ApiClient } from './api-client';
import { createSessionStore, type SessionStore } from './session-store';

const ACCESS_KEY = 'headsup_access';
const REFRESH_KEY = 'headsup_refresh';

type Session = {
  accessToken: string;
  refreshToken: string;
};

export class RemoteApiClient implements ApiClient {
  private readonly baseUrl = normalizeApiBaseUrl(
    process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:3000',
  );
  private readonly singleUserKey = process.env.EXPO_PUBLIC_HEADSUP_SINGLE_USER_KEY || '';

  constructor(private readonly sessionStore: SessionStore = createSessionStore()) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.send<T>(path, init, true);
  }

  async ensureSession() {
    if (await this.hasSession()) {
      try {
        await this.request('/auth/me');
        return;
      } catch {
        await this.clearSession();
      }
    }

    await this.bootstrap();
    await this.request('/auth/me');
  }

  private async send<T>(path: string, init: RequestInit, retry: boolean): Promise<T> {
    const token = await this.sessionStore.get(ACCESS_KEY);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    if (response.status === 401 && retry && (await this.refreshSession())) {
      return this.send<T>(path, init, false);
    }

    if (!response.ok) throw new Error(await this.errorMessage(response));
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private async bootstrap() {
    if (!this.singleUserKey) {
      throw new Error('EXPO_PUBLIC_HEADSUP_SINGLE_USER_KEY tanımlı değil.');
    }

    const session = await this.send<Session>(
      '/auth/bootstrap',
      {
        method: 'POST',
        body: JSON.stringify({ accessKey: this.singleUserKey }),
      },
      false,
    );
    await this.saveSession(session);
  }

  private async refreshSession() {
    const refreshToken = await this.sessionStore.get(REFRESH_KEY);
    if (!refreshToken) return false;

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await this.clearSession();
      return false;
    }

    await this.saveSession((await response.json()) as Session);
    return true;
  }

  private async hasSession() {
    return Boolean(await this.sessionStore.get(REFRESH_KEY));
  }

  private async saveSession(session: Session) {
    await Promise.all([
      this.sessionStore.set(ACCESS_KEY, session.accessToken),
      this.sessionStore.set(REFRESH_KEY, session.refreshToken),
    ]);
  }

  private async clearSession() {
    await Promise.all([
      this.sessionStore.remove(ACCESS_KEY),
      this.sessionStore.remove(REFRESH_KEY),
    ]);
  }

  private async errorMessage(response: Response) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) return body.message.join('\n');
      return body.message || message;
    } catch {
      return message;
    }
  }
}
