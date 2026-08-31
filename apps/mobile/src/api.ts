import { apiClient } from './data/client';
import { demoStore } from './data/demo/demo-store';
export { isDemoMode } from './data/runtime';

export function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  return apiClient.request<T>(path, init);
}

export function ensureAppSession() {
  return apiClient.ensureSession();
}

export const ensureSingleUserSession = ensureAppSession;

export function resetDemoData() {
  demoStore.reset();
}
