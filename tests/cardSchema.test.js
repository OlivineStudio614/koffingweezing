import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateCard, validateCardList } from '../js/cardSchema.js';

const validCard = {
  id: 'base1-koffing-48-1stEd-en',
  species: 'koffing',
  card_name: 'Koffing',
  set_name: 'Base Set',
  release_date: '1999-01-09',
  language: 'en',
  image_url: 'https://images.pokemontcg.io/base1/48_hires.png',
  depicted_only: false,
  owned: true,
  owned_date: '2026-09-01',
};

test('validateCard accepts a well-formed owned card', () => {
  const { valid, errors } = validateCard(validCard);
  assert.equal(valid, true);
  assert.deepEqual(errors, []);
});

test('validateCard rejects a missing id and bad species', () => {
  const { valid, errors } = validateCard({ ...validCard, id: '', species: 'rattata' });
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('id')));
  assert.ok(errors.some(e => e.includes('species')));
});

test('validateCard rejects a malformed release_date', () => {
  const { valid, errors } = validateCard({ ...validCard, release_date: '01/09/1999' });
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('release_date')));
});

test('validateCard requires owned_date when owned is true', () => {
  const { valid, errors } = validateCard({ ...validCard, owned: true, owned_date: null });
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('owned_date')));
});

test('validateCard rejects owned_date set when owned is false', () => {
  const { valid, errors } = validateCard({ ...validCard, owned: false, owned_date: '2026-09-01' });
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('owned_date')));
});

test('validateCardList flags duplicate ids and collects per-card errors', () => {
  const list = [validCard, validCard, { ...validCard, id: 'x', species: 'bad' }];
  const { valid, messages } = validateCardList(list);
  assert.equal(valid, false);
  assert.ok(messages.some(m => m.includes('Duplicate id')));
  assert.ok(messages.some(m => m.includes('Invalid card "x"')));
});

test('the real data/cards.json passes schema validation', () => {
  const dataPath = new URL('../data/cards.json', import.meta.url);
  const cards = JSON.parse(readFileSync(dataPath, 'utf8'));
  const { valid } = validateCardList(cards);
  assert.equal(valid, true);
});
