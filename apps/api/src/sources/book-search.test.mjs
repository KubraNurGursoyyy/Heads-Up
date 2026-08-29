import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBookNewsQueries,
  buildOpenLibraryQueries,
  cleanBookQuery,
  isBookTracking,
  isTurkishOpenLibraryDoc,
  openLibraryPublishedAt,
} from './book-search.ts';

test('book mode recognizes Turkish translation tracking', () => {
  assert.equal(
    isBookTracking({
      topic: '24 Hours in Ancient China Türkçe çeviri',
      prompt: 'Türkçe çevirisi çıkınca haber ver',
      category: 'Kitap',
    }),
    true,
  );
});

test('book query removes tracking and Turkish-edition suffixes', () => {
  assert.equal(
    cleanBookQuery({
      topic: '24 Hours in Ancient China Türkçe çeviri',
      category: 'Kitap',
    }),
    '24 Hours in Ancient China',
  );
});

test('book search plan includes Turkish edition, publisher, ISBN and Turkish catalog-site queries', () => {
  const queries = buildBookNewsQueries({
    topic: '24 Hours in Ancient China Türkçe çeviri',
    category: 'Kitap',
  });

  assert.equal(queries.some(query => query.includes('Türkçe çeviri')), true);
  assert.equal(queries.some(query => query.includes('Türkçe baskı')), true);
  assert.equal(queries.some(query => query.includes('yayınevi')), true);
  assert.equal(queries.some(query => query.includes('ISBN')), true);
  assert.equal(queries.some(query => query.includes('site:kitapyurdu.com')), true);
  assert.equal(queries.some(query => query.includes('site:dr.com.tr')), true);
  assert.equal(queries.some(query => query.includes('site:idefix.com')), true);
});

test('Open Library query prioritizes Turkish editions', () => {
  const queries = buildOpenLibraryQueries({
    topic: '24 Hours in Ancient China Türkçe çeviri',
    prompt: 'Türkçe çeviri çıktığında haber ver',
    category: 'Kitap',
  });

  assert.equal(queries[0].includes('language:tur'), true);
});

test('Open Library language and newest year helpers work', () => {
  assert.equal(isTurkishOpenLibraryDoc({ language: ['eng', 'tur'] }), true);
  assert.equal(
    openLibraryPublishedAt({ publish_year: [2018, 2021, 2020] })?.toISOString(),
    '2021-01-01T00:00:00.000Z',
  );
});
