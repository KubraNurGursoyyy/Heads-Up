import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { loadSettings, type FeedFilter } from '../settings';
import type { FeedItem, Watch, WatchCategory } from '../types';
import { buildFeedTopicOptions } from '../utils/feed-topics';

export function useFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<WatchCategory[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [watchId, setWatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsReady, setSettingsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (category) params.set('category', category);
    if (watchId) params.set('watchId', watchId);
    const text = params.toString();
    return text ? `?${text}` : '';
  }, [filter, category, watchId]);

  const sortedCategories = useMemo(
    () =>
      categories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })),
    [categories],
  );

  const topicOptions = useMemo(
    () =>
      buildFeedTopicOptions(watches, category).map(watch => ({
        id: watch.id,
        label: watch.topic,
        requiredTerms: watch.requiredTerms,
      })),
    [watches, category],
  );

  useEffect(() => {
    void loadSettings().then(settings => {
      setFilter(settings.defaultFeedFilter);
      setSettingsReady(true);
    });

    void Promise.all([api<WatchCategory[]>('/watches/categories'), api<Watch[]>('/watches')])
      .then(([categoryResult, watchResult]) => {
        setCategories(categoryResult);
        setWatches(watchResult);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    void loadFeed();
  }, [query, settingsReady]);

  async function loadFeed() {
    setLoading(true);
    setError(null);
    try {
      setItems(await api<FeedItem[]>(`/feed${query}`));
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function selectCategory(next: string | null) {
    setCategory(next);
    setWatchId(null);
  }

  return {
    items,
    filter,
    setFilter,
    category,
    sortedCategories,
    watchId,
    setWatchId,
    topicOptions,
    loading,
    error,
    loadFeed,
    selectCategory,
  };
}
