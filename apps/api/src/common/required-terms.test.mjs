import assert from 'node:assert/strict';
import test from 'node:test';
import {
  articleContainsRequiredTerms,
  buildRequiredTermsQuery,
  keepRequiredTermsPresentInText,
  normalizeRequiredTerms,
  requiredTermsKey,
} from './required-terms.ts';

test('required terms ignore order, case and accents for identity', () => {
  assert.equal(
    requiredTermsKey(['Evangelion', 'Yōko', 'Taro']),
    requiredTermsKey(['taro', 'yoko', 'EVANGELION']),
  );
});

test('required terms require every selected word in title or description', () => {
  assert.equal(
    articleContainsRequiredTerms(
      ['Evangelion', 'Yōko', 'Taro'],
      'Evangelion project announced by Yoko Taro',
    ),
    true,
  );
  assert.equal(
    articleContainsRequiredTerms(
      ['Evangelion', 'Yōko', 'Taro'],
      'Evangelion project announced',
      'A new collaboration has been revealed.',
    ),
    false,
  );
});

test('required terms are deduplicated accent-insensitively', () => {
  assert.deepEqual(normalizeRequiredTerms(['Yōko', 'yoko', 'Taro']), ['Yōko', 'Taro']);
});

test('required terms search query quotes every selected word', () => {
  assert.equal(buildRequiredTermsQuery(['Evangelion', 'Yōko', 'Taro']), '"Evangelion" "Yōko" "Taro"');
});

test('required terms not present in the watch text are discarded', () => {
  assert.deepEqual(keepRequiredTermsPresentInText(['Evangelion', 'Yōko', 'Taro'], 'Evangelion Taro'), ['Evangelion', 'Taro']);
});
