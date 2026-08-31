import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { loadSettings } from '../settings';
import type { NotificationMode, WatchCategory, WatchSuggestion } from '../types';
import {
  effectiveCategory,
  keepTermsPresentInText,
  normalizeInput,
  shouldOfferCorrection,
  shouldRequestSuggestion,
} from '../utils/watch-ui';

export function useAddWatch(onAdded: () => void) {
  const [prompt, setPrompt] = useState('');
  const [promptConfirmed, setPromptConfirmed] = useState(false);
  const [requiredTerms, setRequiredTerms] = useState<string[]>([]);
  const [mode, setMode] = useState<NotificationMode>('IMPORTANT_ONLY');
  const [busy, setBusy] = useState(false);
  const [suggestionBusy, setSuggestionBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<WatchSuggestion | null>(null);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [categories, setCategories] = useState<WatchCategory[]>([]);
  const [manualCategory, setManualCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const analysisInput = normalizeInput(prompt);

  useEffect(() => {
    void loadSettings().then(settings => {
      setMode(settings.defaultNotificationMode);
      setSuggestionsEnabled(settings.suggestionsEnabled);
    });
    void api<WatchCategory[]>('/watches/categories')
      .then(setCategories)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    if (!suggestionsEnabled || !shouldRequestSuggestion(analysisInput)) {
      setSuggestion(null);
      setSuggestionBusy(false);
      return;
    }

    setSuggestionBusy(true);
    const timer = setTimeout(() => {
      void api<WatchSuggestion>('/watches/suggest', {
        method: 'POST',
        body: JSON.stringify({ prompt: analysisInput }),
      })
        .then(result => {
          if (requestId.current === id) setSuggestion(result);
        })
        .catch(() => {
          if (requestId.current === id) setSuggestion(null);
        })
        .finally(() => {
          if (requestId.current === id) setSuggestionBusy(false);
        });
    }, 550);

    return () => clearTimeout(timer);
  }, [analysisInput, suggestionsEnabled]);

  const selectedCategory = effectiveCategory(manualCategory, suggestion?.category);
  const canConfirm = analysisInput.length >= 3;
  const canSave = canConfirm && promptConfirmed;
  const showCorrection = Boolean(
    suggestion && suggestion.changed && shouldOfferCorrection(prompt, suggestion.correctedPrompt),
  );

  function updatePrompt(value: string) {
    setPrompt(value);
    setPromptConfirmed(false);
    setRequiredTerms(current => keepTermsPresentInText(current, value));
    setError(null);
  }

  function useSuggestion() {
    if (suggestion) updatePrompt(suggestion.correctedPrompt);
  }

  function ignoreSuggestion() {
    if (suggestion) setSuggestion({ ...suggestion, changed: false });
  }

  async function save() {
    if (!canSave) return;
    try {
      setBusy(true);
      setError(null);
      await api('/watches', {
        method: 'POST',
        body: JSON.stringify({
          prompt: analysisInput,
          notificationMode: mode,
          topicHint: suggestion?.topic,
          categoryHint: selectedCategory ?? undefined,
          requiredTerms,
        }),
      });
      setPrompt('');
      setPromptConfirmed(false);
      setRequiredTerms([]);
      setSuggestion(null);
      setManualCategory(null);
      onAdded();
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return {
    prompt,
    promptConfirmed,
    setPromptConfirmed,
    requiredTerms,
    setRequiredTerms,
    mode,
    setMode,
    busy,
    suggestionBusy,
    suggestion,
    categories,
    manualCategory,
    setManualCategory,
    error,
    analysisInput,
    selectedCategory,
    canConfirm,
    canSave,
    showCorrection,
    updatePrompt,
    useSuggestion,
    ignoreSuggestion,
    save,
  };
}
