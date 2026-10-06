import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markCollected } from '../js/markCollected.js';

const cards = [
  { id: 'a', owned: false, owned_date: null },
  { id: 'b', owned: false, owned_date: null },
];

test('markCollected sets owned and owned_date on the matching card only', () => {
  const result = markCollected(cards, 'b', '2026-10-05');
  assert.deepEqual(result.find(c => c.id === 'a'), { id: 'a', owned: false, owned_date: null });
  assert.deepEqual(result.find(c => c.id === 'b'), { id: 'b', owned: true, owned_date: '2026-10-05' });
});

test('markCollected does not mutate the input array', () => {
  markCollected(cards, 'a', '2026-10-05');
  assert.equal(cards.find(c => c.id === 'a').owned, false);
});

test('markCollected throws for an unknown id', () => {
  assert.throws(() => markCollected(cards, 'zzz', '2026-10-05'), /No card found/);
});
