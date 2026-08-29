import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyWatchUpdate,
  effectiveCategory,
  extractSelectableTerms,
  foldUiText,
  formatRunResult,
  isWatchPreparing,
  keepTermsPresentInText,
  normalizeApiBaseUrl,
  normalizeInput,
  removeWatchFromList,
  shouldOfferCorrection,
  shouldRequestSuggestion,
  toggleRequiredTerm,
} from './watch-ui.ts';

test('mobile input normalization collapses whitespace', () => assert.equal(normalizeInput('  GTA   6  '), 'GTA 6'));
test('suggestions start only after meaningful input', () => {
  assert.equal(shouldRequestSuggestion('gta'), false);
  assert.equal(shouldRequestSuggestion('gta 6'), true);
});
test('correction UI is shown only when visible text changes', () => {
  assert.equal(shouldOfferCorrection('gta 6', 'gta 6'), false);
  assert.equal(shouldOfferCorrection('cikis tarhi', 'çıkış tarihi'), true);
});
test('legacy /api suffix is removed from backend base URL', () => assert.equal(normalizeApiBaseUrl('http://127.0.0.1:3000/api'), 'http://127.0.0.1:3000'));
test('watch is preparing until its first background scan completes', () => {
  assert.equal(isWatchPreparing({ active: true, lastCheckedAt: null }), true);
  assert.equal(isWatchPreparing({ active: true, lastCheckedAt: '2026-08-29' }), false);
});
test('optimistic delete removes only the selected watch', () => assert.deepEqual(removeWatchFromList([{ id: 'a' }, { id: 'b' }], 'b'), [{ id: 'a' }]));
test('watch update replaces only matching card', () => assert.deepEqual(applyWatchUpdate([{ id: 'a' }, { id: 'b' }], { id: 'b' }), [{ id: 'a' }, { id: 'b' }]));
test('manual category overrides automatic category', () => assert.equal(effectiveCategory('Masa Oyunları', 'Oyun'), 'Masa Oyunları'));
test('manual scan result is rendered as a compact status', () => assert.equal(formatRunResult({ completed: true, discovered: 8, attached: 2, pushed: 1 }), '8 kaynak incelendi · 2 yeni haber · 1 bildirim'));
test('required term picker extracts unique words and ignores accents for selection', () => {
  assert.deepEqual(extractSelectableTerms('Neon Genesis Evangelion Yōko Taro Yoko'), ['Neon', 'Genesis', 'Evangelion', 'Yōko', 'Taro']);
  assert.equal(foldUiText('Yōko'), foldUiText('yoko'));
  assert.deepEqual(toggleRequiredTerm(['Evangelion'], 'Yōko'), ['Evangelion', 'Yōko']);
  assert.deepEqual(toggleRequiredTerm(['Yōko'], 'yoko'), []);
});
test('removed prompt words are removed from required terms', () => {
  assert.deepEqual(keepTermsPresentInText(['Evangelion', 'Yōko', 'Taro'], 'Evangelion Taro'), ['Evangelion', 'Taro']);
});
