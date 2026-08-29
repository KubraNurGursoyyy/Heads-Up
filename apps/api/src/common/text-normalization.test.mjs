import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCommonTurkishCorrections,
  buildCategoryStats,
  inferFallbackCategory,
  normalizeCategoryName,
  normalizeWhitespace,
  sameTextInsensitive,
} from './text-normalization.ts';

test('whitespace is normalized without changing visible content', () => {
  assert.equal(normalizeWhitespace('  GTA   6  PC  '), 'GTA 6 PC');
});

test('comparison ignores case, Turkish diacritics and extra spaces', () => {
  assert.equal(sameTextInsensitive('GTA 6 Çıkış Tarihi', 'gta  6 cikis tarihi'), true);
  assert.equal(sameTextInsensitive('Türkçe baskı', 'TURKCE BASKI'), true);
});

test('common Turkish tracking typos are corrected locally', () => {
  assert.equal(
    applyCommonTurkishCorrections('gta 6 pc cikis tarhi oldugunda habr ver'),
    'gta 6 pc çıkış tarihi olduğunda haber ver',
  );
});

test('fallback category inference supports both existing and new categories', () => {
  assert.equal(inferFallbackCategory('GTA 6'), 'Oyun');
  assert.equal(inferFallbackCategory('GTA 6 PC çıkış tarihi'), 'Oyun');
  assert.equal(inferFallbackCategory('Yeni albüm çıktığında haber ver'), 'Müzik');
  assert.equal(inferFallbackCategory('Bilinmeyen bir konu'), 'Diğer');
});

test('game inflections are categorized as Oyun', () => {
  assert.equal(inferFallbackCategory('kötü oyunları takip et'), 'Oyun');
  assert.equal(inferFallbackCategory('yeni oyunlar duyurulunca haber ver'), 'Oyun');
  assert.equal(inferFallbackCategory('oyunlarda indirim olursa bildir'), 'Oyun');
});

test('category names are canonicalized case-insensitively', () => {
  assert.equal(normalizeCategoryName('oyun'), 'Oyun');
  assert.equal(normalizeCategoryName('OYUN'), 'Oyun');
  assert.equal(normalizeCategoryName('  masa oyunları  '), 'Masa Oyunları');
});

test('dynamic category stats merge equivalent category labels', () => {
  assert.deepEqual(buildCategoryStats(['Oyun', 'oyun', 'OYUN', 'Müzik']), [
    { name: 'Oyun', count: 3 },
    { name: 'Müzik', count: 1 },
  ]);
});
