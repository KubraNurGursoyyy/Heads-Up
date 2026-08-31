import { createDemoState } from './demo-data';
import type { DemoState } from './demo.types';

const STORAGE_KEY = 'headsup_public_demo_v1';
let memoryState: DemoState | null = null;

function clone(state: DemoState): DemoState {
  return JSON.parse(JSON.stringify(state)) as DemoState;
}

export class DemoStore {
  load(): DemoState {
    if (typeof window === 'undefined') {
      memoryState ??= createDemoState();
      return clone(memoryState);
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DemoState;
        if (parsed.version === 1) return parsed;
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    const initial = createDemoState();
    this.save(initial);
    return initial;
  }

  save(state: DemoState) {
    if (typeof window === 'undefined') {
      memoryState = clone(state);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  reset() {
    memoryState = null;
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const demoStore = new DemoStore();
