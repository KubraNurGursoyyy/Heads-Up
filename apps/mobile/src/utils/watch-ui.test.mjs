import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyWatchUpdate,
  effectiveCategory,
  formatRunResult,
  isWatchPreparing,
  normalizeApiBaseUrl,
  normalizeInput,
  removeWatchFromList,
  shouldOfferCorrection,
  shouldRequestSuggestion,
} from './watch-ui.ts';

test('mobile input normalization collapses whitespace', () => {
  assert.equal(normalizeInput('  GTA   6  '), 'GTA 6');
});

test('suggestions start only after meaningful input', () => {
  assert.equal(shouldRequestSuggestion('gta'), false);
  assert.equal(shouldRequestSuggestion('gta 6'), true);
});

test('correction UI is shown only when visible text changes', () => {
  assert.equal(shouldOfferCorrection('gta 6', 'gta 6'), false);
  assert.equal(shouldOfferCorrection('cikis tarhi', 'çıkış tarihi'), true);
});

test('legacy /api suffix is removed from backend base URL', () => {
  assert.equal(normalizeApiBaseUrl('http://127.0.0.1:3000/api'), 'http://127.0.0.1:3000');
});

test('watch is preparing until its first background scan completes', () => {
  assert.equal(isWatchPreparing({ active: true, lastCheckedAt: null }), true);
  assert.equal(isWatchPreparing({ active: true, lastCheckedAt: '2026-08-29' }), false);
});

test('optimistic delete removes only the selected watch', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(removeWatchFromList(items, 'b'), [{ id: 'a' }, { id: 'c' }]);
});

test('watch update replaces only matching card', () => {
  const items = [{ id: 'a', category: 'Oyun' }, { id: 'b', category: 'Diğer' }];
  assert.deepEqual(applyWatchUpdate(items, { id: 'b', category: 'Oyun' }), [
    { id: 'a', category: 'Oyun' },
    { id: 'b', category: 'Oyun' },
  ]);
});

test('manual category overrides automatic category', () => {
  assert.equal(effectiveCategory('Masa Oyunları', 'Oyun'), 'Masa Oyunları');
  assert.equal(effectiveCategory(null, 'Oyun'), 'Oyun');
});

test('manual scan result is rendered as a compact status', () => {
  assert.equal(
    formatRunResult({ completed: true, discovered: 8, attached: 2, pushed: 1 }),
    '8 kaynak incelendi · 2 yeni haber · 1 bildirim',
  );
  assert.equal(formatRunResult({ skipped: true, message: 'Duraklatıldı' }), 'Duraklatıldı');
  assert.equal(
    formatRunResult({ completed: true, historical: true, discovered: 20, attached: 6, pushed: 0 }),
    'Geçmiş dahil · 20 kaynak incelendi · 6 yeni haber · 0 bildirim',
  );
});

test('intersection prompt is built from two separate inputs', async () => {
  const { buildIntersectionPrompt } = await import('./watch-ui.ts');
  assert.equal(
    buildIntersectionPrompt('Neon Genesis Evangelion', 'Yōko Taro'),
    'Neon Genesis Evangelion ile Yōko Taro kesişimindeki gelişmeleri takip et.',
  );
});

test('intersection input comparison ignores accents', async () => {
  const { canSaveIntersection } = await import('./watch-ui.ts');
  assert.equal(canSaveIntersection('Yōko Taro', 'yoko taro'), false);
  assert.equal(canSaveIntersection('Neon Genesis Evangelion', 'Yoko Taro'), true);
});
