import type { ApiClient } from './api-client';
import { DemoApiClient } from './demo/demo-api-client';
import { RemoteApiClient } from './remote-api-client';
import { isDemoMode } from './runtime';

export const apiClient: ApiClient = isDemoMode ? new DemoApiClient() : new RemoteApiClient();
