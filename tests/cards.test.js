import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortByReleaseDate, getNextUnowned, buildCardViewModel } from '../js/cards.js';

const cardA = { id: 'a', card_name: 'Koffing', set_name: 'Base Set', language: 'en', edition: '1st-edition', release_date: '1999-01-09', image_url: 'a.png', owned: true, owned_date: '2026-09-01' };
const cardB = { id: 'b', card_name: 'Weezing', set_name: 'Jungle', language: 'en', edition: null, release_date: '1999-06-16', image_url: 'b.png', owned: false, owned_date: null };
const cardC = { id: 'c', card_name: 'Koffing', set_name: 'Fossil', language: 'en', edition: null, release_date: '1999-10-10', image_url: 'c.png', owned: false, owned_date: null };

test('sortByReleaseDate orders oldest first without mutating input', () => {
  const input = [cardC, cardA, cardB];
  const sorted = sortByReleaseDate(input);
  assert.deepEqual(sorted.map(c => c.id), ['a', 'b', 'c']);
  assert.deepEqual(input.map(c => c.id), ['c', 'a', 'b']);
});

test('getNextUnowned returns the earliest-released unowned card', () => {
  assert.equal(getNextUnowned([cardC, cardA, cardB]).id, 'b');
});

test('getNextUnowned returns null when everything is owned', () => {
  assert.equal(getNextUnowned([{ ...cardB, owned: true }]), null);
});

test('buildCardViewModel sorts, labels, and flags the next-up card', () => {
  const vms = buildCardViewModel([cardC, cardA, cardB]);
  assert.deepEqual(vms.map(v => v.id), ['a', 'b', 'c']);
  assert.equal(vms[0].label, 'Koffing — Base Set (en, 1st-edition)');
  assert.equal(vms[1].label, 'Weezing — Jungle (en)');
  assert.equal(vms[0].isNextUp, false);
  assert.equal(vms[1].isNextUp, true);
  assert.equal(vms[2].isNextUp, false);
});
