import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFeedTopicOptions } from './feed-topics.ts';

const watches = [
  { id: '2', topic: 'Winx Club Moonlight Quest', category: 'Oyun' },
  { id: '3', topic: 'Antik Çin', category: 'Kitap' },
  { id: '1', topic: 'GTA 6', category: 'Oyun' },
];

test('topics inside a category are alphabetically sorted', () => {
  assert.deepEqual(
    buildFeedTopicOptions(watches, 'oyun').map(item => item.topic),
    ['GTA 6', 'Winx Club Moonlight Quest'],
  );
});

test('all topics are available when category is not selected', () => {
  assert.deepEqual(
    buildFeedTopicOptions(watches, null).map(item => item.topic),
    ['Antik Çin', 'GTA 6', 'Winx Club Moonlight Quest'],
  );
});
