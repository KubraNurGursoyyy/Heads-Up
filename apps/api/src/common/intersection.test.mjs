import assert from 'node:assert/strict';
import test from 'node:test';
import {
  articleMatchesIntersection,
  buildIntersectionPrompt,
  buildIntersectionTopic,
  intersectionKey,
} from './intersection.ts';

test('intersection key ignores order, case and accents', () => {
  assert.equal(
    intersectionKey(['Neon Genesis Evangelion', 'Yōko Taro']),
    intersectionKey(['yoko taro', 'NEON GENESIS EVANGELION']),
  );
});

test('intersection display values preserve the user terms', () => {
  assert.equal(
    buildIntersectionTopic(['Neon Genesis Evangelion', 'Yōko Taro']),
    'Neon Genesis Evangelion × Yōko Taro',
  );
  assert.equal(
    buildIntersectionPrompt(['Neon Genesis Evangelion', 'Yōko Taro']),
    'Neon Genesis Evangelion ile Yōko Taro kesişimindeki gelişmeleri takip et.',
  );
});

test('intersection accepts Evangelion plus Yoko Taro spelling without macron', () => {
  assert.equal(
    articleMatchesIntersection(
      ['Neon Genesis Evangelion', 'Yōko Taro'],
      'Yoko Taro talks about Evangelion and creative influences',
      '',
    ),
    true,
  );
});

test('intersection rejects an article that only matches one side', () => {
  assert.equal(
    articleMatchesIntersection(
      ['Neon Genesis Evangelion', 'Yōko Taro'],
      'New Neon Genesis Evangelion exhibition announced',
      '',
    ),
    false,
  );
});
