import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { RunWatchResult, Watch, WatchCategory } from '../types';
import {
  applyWatchUpdate,
  formatRunResult,
  isWatchPreparing,
  removeWatchFromList,
} from '../utils/watch-ui';

export type WatchPatch = Partial<
  Pick<Watch, 'active' | 'notificationMode' | 'category' | 'prompt' | 'requiredTerms'>
>;

export function useWatches() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [categories, setCategories] = useState<WatchCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [runStatus, setRunStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [watchList, categoryList] = await Promise.all([
        api<Watch[]>('/watches'),
        api<WatchCategory[]>('/watches/categories'),
      ]);
      setWatches(watchList);
      setCategories(categoryList);
    } catch (loadError) {
      if (!silent) setError((loadError as Error).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    setCategories(await api<WatchCategory[]>('/watches/categories'));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!watches.some(isWatchPreparing)) return;
    const timer = setInterval(() => void load(true), 5000);
    return () => clearInterval(timer);
  }, [load, watches]);

  async function patch(watch: Watch, patchBody: WatchPatch) {
    try {
      setError(null);
      const updated = await api<Watch>(`/watches/${watch.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patchBody),
      });
      setWatches(current => applyWatchUpdate(current, updated));
      if (patchBody.category !== undefined) await refreshCategories();
      return updated;
    } catch (patchError) {
      setError((patchError as Error).message);
      throw patchError;
    }
  }

  async function remove(watch: Watch) {
    if (deleting) return false;
    try {
      setDeleting(true);
      setError(null);
      await api(`/watches/${watch.id}`, { method: 'DELETE' });
      setWatches(current => removeWatchFromList(current, watch.id));
      await refreshCategories();
      return true;
    } catch (deleteError) {
      setError(`Takip silinemedi: ${(deleteError as Error).message}`);
      return false;
    } finally {
      setDeleting(false);
    }
  }

  async function edit(watch: Watch, prompt: string, requiredTerms: string[]) {
    if (editing) return false;
    try {
      setEditing(true);
      setError(null);
      const updated = await api<Watch>(`/watches/${watch.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ prompt, requiredTerms }),
      });
      setWatches(current => applyWatchUpdate(current, updated));
      await refreshCategories();
      return true;
    } catch (editError) {
      setError(`Takip düzenlenemedi: ${(editError as Error).message}`);
      return false;
    } finally {
      setEditing(false);
    }
  }

  async function runNow(watch: Watch) {
    if (running[watch.id]) return;
    try {
      setRunning(current => ({ ...current, [watch.id]: true }));
      setRunStatus(current => ({ ...current, [watch.id]: '' }));
      setError(null);
      const result = await api<RunWatchResult>(`/watches/${watch.id}/run`, { method: 'POST' });
      setRunStatus(current => ({ ...current, [watch.id]: formatRunResult(result) }));
      await load(true);
    } catch (runError) {
      setRunStatus(current => ({
        ...current,
        [watch.id]: `Tarama başarısız: ${(runError as Error).message}`,
      }));
    } finally {
      setRunning(current => ({ ...current, [watch.id]: false }));
    }
  }

  return {
    watches,
    categories,
    loading,
    deleting,
    editing,
    running,
    runStatus,
    error,
    patch,
    remove,
    edit,
    runNow,
  };
}
