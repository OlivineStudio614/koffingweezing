// scripts/validate-cards.js
import { readFileSync } from 'node:fs';
import { validateCardList } from '../js/cardSchema.js';

const dataPath = new URL('../data/cards.json', import.meta.url);
const cards = JSON.parse(readFileSync(dataPath, 'utf8'));
const { valid, messages } = validateCardList(cards);

for (const message of messages) {
  console.error(message);
}

if (!valid) {
  console.error(`\nValidation failed for ${cards.length} card(s).`);
  process.exit(1);
}

console.log(`All ${cards.length} card(s) valid.`);
