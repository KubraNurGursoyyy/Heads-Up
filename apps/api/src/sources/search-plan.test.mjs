import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGoogleNewsSearchPlan } from './search-plan.ts';

test('search plan includes both Turkish and English Google News locales', () => {
  const plan = buildGoogleNewsSearchPlan({
    baseQueries: ['Winx Moonlight Quest'],
    topic: 'Winx Moonlight Quest',
    category: 'Oyun',
    primaryLocale: { lang: 'tr', country: 'TR' },
    requestLimit: 14,
  });

  assert.equal(plan.some(item => item.lang === 'tr' && item.country === 'TR'), true);
  assert.equal(plan.some(item => item.lang === 'en' && item.country === 'US'), true);
});

test('search plan adds exact-title and tail queries to recover narrow or typo-prone topics', () => {
  const plan = buildGoogleNewsSearchPlan({
    baseQueries: ['inx moonlight quest'],
    topic: 'inx moonlight quest',
    category: 'Oyun',
    requestLimit: 14,
  });

  assert.equal(plan.some(item => item.query === '"inx moonlight quest"'), true);
  assert.equal(plan.some(item => item.query === '"moonlight quest"'), true);
});

test('historical search adds 30 day, one year and five year backfill queries', () => {
  const plan = buildGoogleNewsSearchPlan({
    baseQueries: ['Winx Moonlight Quest'],
    topic: 'Winx Moonlight Quest',
    category: 'Oyun',
    historical: true,
    requestLimit: 16,
    now: new Date('2026-08-29T00:00:00Z'),
  });

  assert.equal(plan.some(item => item.query.includes('when:30d')), true);
  assert.equal(plan.some(item => item.query.includes('when:1y')), true);
  assert.equal(plan.some(item => item.query.includes('after:2021-08-29')), true);
});

test('category-aware English query uses game for Oyun', () => {
  const plan = buildGoogleNewsSearchPlan({
    baseQueries: [],
    topic: 'Winx Moonlight Quest',
    category: 'Oyun',
    requestLimit: 14,
  });

  assert.equal(
    plan.some(item => item.lang === 'en' && item.reason === 'category' && item.query.includes('game')),
    true,
  );
});

test('required-term search quotes all mandatory words and creates accent-insensitive variants', () => {
  const plan = buildGoogleNewsSearchPlan({
    baseQueries: [],
    topic: 'Neon Genesis Evangelion Yōko Taro',
    category: 'Oyun',
    requiredTerms: ['Evangelion', 'Yōko', 'Taro'],
    requestLimit: 16,
  });

  assert.equal(
    plan.some(item => item.reason === 'required' && item.query.includes('"Evangelion"') && item.query.includes('"Yōko"') && item.query.includes('"Taro"')),
    true,
  );
  assert.equal(
    plan.some(item => item.reason === 'required' && item.query.toLocaleLowerCase('tr-TR').includes('yoko')),
    true,
  );
});

test('historical required-term search keeps mandatory words in backfill requests', () => {
  const plan = buildGoogleNewsSearchPlan({
    baseQueries: [],
    topic: 'Neon Genesis Evangelion Yōko Taro',
    requiredTerms: ['Evangelion', 'Yōko', 'Taro'],
    historical: true,
    requestLimit: 16,
    now: new Date('2026-08-29T00:00:00Z'),
  });

  assert.equal(
    plan.some(item => item.reason === 'required' && item.query.includes('when:1y')),
    true,
  );
});
