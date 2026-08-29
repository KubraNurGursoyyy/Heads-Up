import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFeedTopicOptions } from './feed-topics.ts';

const watches = [
  { id: '2', topic: 'Winx Club Moonlight Quest', category: 'Oyun', requiredTerms: ['Winx', 'Quest'] },
  { id: '3', topic: 'Antik Çin', category: 'Kitap', requiredTerms: [] },
  { id: '1', topic: 'GTA 6', category: 'Oyun', requiredTerms: ['GTA'] },
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

test('required terms are preserved for highlighted topic dropdown labels', () => {
  assert.deepEqual(
    buildFeedTopicOptions(watches, 'Oyun').find(item => item.id === '1')?.requiredTerms,
    ['GTA'],
  );
});
