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

function makeApiCard(name, overrides = {}) {
  return {
    id: 'gym2-48',
    name,
    number: '48',
    rarity: 'Uncommon',
    set: { id: 'gym2', name: 'Gym Challenge', releaseDate: '2000/10/16' },
    images: { small: 'https://images.pokemontcg.io/gym2/48.png', large: 'https://images.pokemontcg.io/gym2/48_hires.png' },
    ...overrides,
  };
}

test('transformPokemonTCGCard normalizes real-world card names to the schema species enum', () => {
  assert.equal(transformPokemonTCGCard(makeApiCard("Koga's Koffing")).species, 'koffing');
  assert.equal(transformPokemonTCGCard(makeApiCard('Dark Weezing')).species, 'weezing');
  assert.equal(transformPokemonTCGCard(makeApiCard("Team Rocket's Weezing")).species, 'weezing');
  assert.equal(transformPokemonTCGCard(makeApiCard('Galarian Weezing')).species, 'galarian-weezing');
});

test("transformPokemonTCGCard preserves the real card_name even when species is normalized", () => {
  const card = transformPokemonTCGCard(makeApiCard("Koga's Koffing"));
  assert.equal(card.card_name, "Koga's Koffing");
  assert.equal(card.id, 'gym2-koffing-48-en');
});

test('mergeCards keeps existing entries and appends only new ids', () => {
  const existing = [{ id: 'base1-koffing-48-en', owned: true, owned_date: '2026-09-01' }];
  const incoming = [{ id: 'base1-koffing-48-en', owned: false, owned_date: null }, { id: 'jungle-weezing-45-en', owned: false, owned_date: null }];
  const merged = mergeCards(existing, incoming);
  assert.equal(merged.length, 2);
  assert.equal(merged.find(c => c.id === 'base1-koffing-48-en').owned, true);
  assert.ok(merged.some(c => c.id === 'jungle-weezing-45-en'));
});
