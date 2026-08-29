import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARCHIVE_PAGE_SIZE,
  LIVE_FEED_SIZE,
  archiveSkip,
  archiveTotal,
  archiveTotalPages,
  normalizeArchivePage,
} from './archive-pagination.ts';

test('archive is fixed to three items per page', () => {
  assert.equal(ARCHIVE_PAGE_SIZE, 3);
});

test('archive starts after the twelve live feed items', () => {
  assert.equal(LIVE_FEED_SIZE, 12);
  assert.equal(archiveSkip(1), 12);
  assert.equal(archiveSkip(2), 15);
  assert.equal(archiveSkip(3), 18);
});

test('archive page input is normalized safely', () => {
  assert.equal(normalizeArchivePage(0), 1);
  assert.equal(normalizeArchivePage('2'), 2);
  assert.equal(normalizeArchivePage('x'), 1);
});

test('archive total excludes current feed and calculates pages', () => {
  assert.equal(archiveTotal(10), 0);
  assert.equal(archiveTotal(18), 6);
  assert.equal(archiveTotalPages(18), 2);
  assert.equal(archiveTotalPages(12), 1);
});
