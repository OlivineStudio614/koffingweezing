import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortByReleaseDate, getNextUnowned, buildCardViewModel } from '../js/cards.js';

const cardA = { id: 'a', card_name: 'Koffing', card_name_en: 'Koffing', set_name: 'Base Set', card_number: '51', language: 'en', edition: '1st-edition', release_date: '1999-01-09', image_url: 'a.png', owned: true, owned_date: '2026-09-01' };
const cardB = { id: 'b', card_name: 'Weezing', card_name_en: 'Weezing', set_name: 'Jungle', card_number: '36', language: 'en', edition: null, release_date: '1999-06-16', image_url: 'b.png', owned: false, owned_date: null };
const cardC = { id: 'c', card_name: 'Koffing', card_name_en: 'Koffing', set_name: 'Fossil', card_number: '35', language: 'en', edition: null, release_date: '1999-10-10', image_url: 'c.png', owned: false, owned_date: null };

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
  assert.equal(vms[0].labelEn, 'Koffing — Base Set — English — #51');
  assert.equal(vms[1].labelEn, 'Weezing — Jungle — English — #36');
  assert.equal(vms[0].isNextUp, false);
  assert.equal(vms[1].isNextUp, true);
  assert.equal(vms[2].isNextUp, false);
});

test('buildCardViewModel omits labelNative for English cards where names match', () => {
  const vms = buildCardViewModel([cardA]);
  assert.equal(vms[0].labelNative, null);
});

test('buildCardViewModel sets labelNative for non-English cards', () => {
  const cardJp = { id: 'd', card_name: 'ドガース', card_name_en: 'Koffing', set_name: 'Expansion Pack', card_number: '006', language: 'jp', edition: null, release_date: '1996-10-20', image_url: 'd.png', owned: false, owned_date: null };
  const vms = buildCardViewModel([cardJp]);
  assert.equal(vms[0].labelEn, 'Koffing — Expansion Pack — Japanese — #006');
  assert.equal(vms[0].labelNative, 'ドガース');
});
