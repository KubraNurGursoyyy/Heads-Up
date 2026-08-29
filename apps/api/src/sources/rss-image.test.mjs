import assert from 'node:assert/strict';
import test from 'node:test';
import { extractRssImage, openLibraryCoverUrl } from './rss-image.ts';

test('RSS image is extracted from enclosure', () => {
  assert.equal(
    extractRssImage({ enclosure: { url: 'https://cdn.example.com/news.jpg' } }),
    'https://cdn.example.com/news.jpg',
  );
});

test('RSS image is extracted from media thumbnail attributes', () => {
  assert.equal(
    extractRssImage({ 'media:thumbnail': { $: { url: 'https://cdn.example.com/thumb.webp' } } }),
    'https://cdn.example.com/thumb.webp',
  );
});

test('RSS image falls back to img tag in content', () => {
  assert.equal(
    extractRssImage({ content: '<div><img src="https://cdn.example.com/photo.png" /></div>' }),
    'https://cdn.example.com/photo.png',
  );
});

test('Open Library cover URL is generated only for a valid cover id', () => {
  assert.equal(openLibraryCoverUrl(123), 'https://covers.openlibrary.org/b/id/123-M.jpg');
  assert.equal(openLibraryCoverUrl(undefined), undefined);
});
