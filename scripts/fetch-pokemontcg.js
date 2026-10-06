// scripts/fetch-pokemontcg.js
import { readFileSync, writeFileSync } from 'node:fs';
import { transformPokemonTCGCard, mergeCards } from '../js/pokemonTcgImport.js';

const dataPath = new URL('../data/cards.json', import.meta.url);
const existing = JSON.parse(readFileSync(dataPath, 'utf8'));

const names = ['koffing', 'weezing'];
const fetched = [];

for (const name of names) {
  const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${name}`);
  const { data } = await response.json();
  fetched.push(...data.map(transformPokemonTCGCard));
}

const merged = mergeCards(existing, fetched);
writeFileSync(dataPath, JSON.stringify(merged, null, 2) + '\n');
console.log(`Fetched ${fetched.length} card(s) from pokemontcg.io, ${merged.length - existing.length} new.`);
