import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCommonTurkishCorrections,
  buildCategoryStats,
  foldForComparison,
  inferFallbackCategory,
  normalizeCategoryName,
  normalizeWhitespace,
  sameTextInsensitive,
} from './text-normalization.ts';

test('whitespace is normalized without changing visible content', () => {
  assert.equal(normalizeWhitespace('  GTA   6  PC  '), 'GTA 6 PC');
});

test('comparison ignores case, Turkish diacritics and extra spaces', () => {
  assert.equal(foldForComparison('ÇIKIŞ   TARİHİ'), 'cikis tarihi');
  assert.equal(sameTextInsensitive('GTA 6 Çıkış Tarihi', 'gta 6 cikis tarihi'), true);
  assert.equal(sameTextInsensitive('The Winds of Winter', 'THE WINDS OF WINTER'), true);
  assert.equal(sameTextInsensitive('IPHONE 18', 'iphone 18'), true);
});

test('common Turkish tracking typos are corrected locally', () => {
  assert.equal(
    applyCommonTurkishCorrections('gta 6 pc cikis tarhi belli oldugunda habr ver'),
    'gta 6 pc çıkış tarihi belli olduğunda haber ver',
  );
});

test('fallback category inference supports both existing and new categories', () => {
  assert.equal(inferFallbackCategory('Yeni PlayStation oyunu çıkınca haber ver'), 'Oyun');
  assert.equal(inferFallbackCategory('Taylor Swift konser tarihi açıklanınca bildir'), 'Müzik');
  assert.equal(inferFallbackCategory('F1 Türkiye yarışı olursa bildir'), 'Spor');
  assert.equal(inferFallbackCategory('SpaceX yeni roket testi olursa bildir'), 'Diğer');
});

test('category names are canonicalized case-insensitively', () => {
  assert.equal(normalizeCategoryName('OYUN'), 'Oyun');
  assert.equal(normalizeCategoryName('müzik'), 'Müzik');
  assert.equal(normalizeCategoryName('film ve dizi'), 'Film & Dizi');
  assert.equal(normalizeCategoryName('  uzay haberleri  '), 'Uzay Haberleri');
});

test('dynamic category stats merge equivalent category labels', () => {
  assert.deepEqual(
    buildCategoryStats(['Oyun', 'oyun', 'OYUN', 'Müzik', 'müzik']),
    [
      { name: 'Oyun', count: 3 },
      { name: 'Müzik', count: 2 },
    ],
  );
});
