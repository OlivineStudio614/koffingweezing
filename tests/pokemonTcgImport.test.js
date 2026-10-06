import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transformPokemonTCGCard, mergeCards } from '../js/pokemonTcgImport.js';

const apiCard = {
  id: 'base1-48',
  name: 'Koffing',
  number: '48',
  rarity: 'Common',
  set: { id: 'base1', name: 'Base Set', releaseDate: '1999/01/09' },
  images: { small: 'https://images.pokemontcg.io/base1/48.png', large: 'https://images.pokemontcg.io/base1/48_hires.png' },
};

test('transformPokemonTCGCard maps API shape to our schema', () => {
  const card = transformPokemonTCGCard(apiCard);
  assert.equal(card.id, 'base1-koffing-48-en');
  assert.equal(card.species, 'koffing');
  assert.equal(card.release_date, '1999-01-09');
  assert.equal(card.language, 'en');
  assert.equal(card.image_url, 'https://images.pokemontcg.io/base1/48_hires.png');
  assert.equal(card.owned, false);
  assert.equal(card.owned_date, null);
  assert.equal(card.depicted_only, false);
});

test('mergeCards keeps existing entries and appends only new ids', () => {
  const existing = [{ id: 'base1-koffing-48-en', owned: true, owned_date: '2026-09-01' }];
  const incoming = [{ id: 'base1-koffing-48-en', owned: false, owned_date: null }, { id: 'jungle-weezing-45-en', owned: false, owned_date: null }];
  const merged = mergeCards(existing, incoming);
  assert.equal(merged.length, 2);
  assert.equal(merged.find(c => c.id === 'base1-koffing-48-en').owned, true);
  assert.ok(merged.some(c => c.id === 'jungle-weezing-45-en'));
});
