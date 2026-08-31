export interface ApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  ensureSession(): Promise<void>;
}
