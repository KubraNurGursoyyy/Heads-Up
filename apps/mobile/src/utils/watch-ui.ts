import type { RunWatchResult, Watch } from '../types';

export function normalizeInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function foldUiText(value: string): string {
  return normalizeInput(value)
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function extractSelectableTerms(value: string): string[] {
  const matches = normalizeInput(value).match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) ?? [];
  const result: string[] = [];
  const seen = new Set<string>();

  for (const word of matches) {
    const key = foldUiText(word);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(word);
  }
  return result;
}

export function toggleRequiredTerm(selected: string[], term: string): string[] {
  const key = foldUiText(term);
  const exists = selected.some(item => foldUiText(item) === key);
  return exists ? selected.filter(item => foldUiText(item) !== key) : [...selected, term];
}

export function keepTermsPresentInText(selected: string[], text: string): string[] {
  const allowed = new Set(extractSelectableTerms(text).map(foldUiText));
  return selected.filter(term => allowed.has(foldUiText(term)));
}

export function shouldRequestSuggestion(value: string): boolean {
  return normalizeInput(value).length >= 5;
}

export function shouldOfferCorrection(original: string, corrected: string): boolean {
  const a = normalizeInput(original);
  const b = normalizeInput(corrected);
  return Boolean(a && b && a !== b);
}

export function normalizeApiBaseUrl(value: string): string {
  const cleaned = value.trim().replace(/\/+$/, '');
  return cleaned.replace(/\/api$/i, '');
}

export function isWatchPreparing(watch: {
  active: boolean;
  lastCheckedAt?: string | null;
}): boolean {
  return watch.active && !watch.lastCheckedAt;
}

export function removeWatchFromList<T extends Pick<Watch, 'id'>>(items: T[], id: string): T[] {
  return items.filter(item => item.id !== id);
}

export function applyWatchUpdate<T extends Pick<Watch, 'id'>>(items: T[], updated: T): T[] {
  return items.map(item => (item.id === updated.id ? updated : item));
}

export function effectiveCategory(
  manualCategory: string | null,
  suggestedCategory?: string | null,
): string | null {
  const manual = normalizeInput(manualCategory ?? '');
  if (manual) return manual;
  const suggested = normalizeInput(suggestedCategory ?? '');
  return suggested || null;
}

export function formatRunResult(result: RunWatchResult): string {
  if (result.skipped) return result.message || 'Tarama atlandı.';
  const discovered = result.discovered ?? 0;
  const attached = result.attached ?? 0;
  const pushed = result.pushed ?? 0;
  const prefix = result.historical ? 'Geçmiş dahil · ' : '';
  return `${prefix}${discovered} kaynak incelendi · ${attached} yeni haber · ${pushed} bildirim`;
}
