import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeApiBaseUrl,
  normalizeInput,
  shouldOfferCorrection,
  shouldRequestSuggestion,
} from './watch-ui.ts';

test('mobile input normalization collapses whitespace', () => {
  assert.equal(normalizeInput('  GTA   6 PC  '), 'GTA 6 PC');
});

test('suggestions start only after meaningful input', () => {
  assert.equal(shouldRequestSuggestion('GTA'), false);
  assert.equal(shouldRequestSuggestion('GTA 6'), true);
});

test('correction UI is shown only when visible text changes', () => {
  assert.equal(shouldOfferCorrection('GTA 6', 'GTA 6'), false);
  assert.equal(shouldOfferCorrection('gta 6 cikis tarhi', 'GTA 6 çıkış tarihi'), true);
});

test('legacy /api suffix is removed from backend base URL', () => {
  assert.equal(normalizeApiBaseUrl('http://127.0.0.1:3000/api'), 'http://127.0.0.1:3000');
  assert.equal(normalizeApiBaseUrl('https://example.test/API/'), 'https://example.test');
});
