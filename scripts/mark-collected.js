import { readFileSync, writeFileSync } from 'node:fs';
import { markCollected } from '../js/markCollected.js';

const [id, dateArg] = process.argv.slice(2);

if (!id) {
  console.error('Usage: node scripts/mark-collected.js <card-id> [YYYY-MM-DD]');
  process.exit(1);
}

const date = dateArg ?? new Date().toISOString().slice(0, 10);
const dataPath = new URL('../data/cards.json', import.meta.url);
const cards = JSON.parse(readFileSync(dataPath, 'utf8'));

const updated = markCollected(cards, id, date);

writeFileSync(dataPath, JSON.stringify(updated, null, 2) + '\n');
console.log(`Marked "${id}" as owned on ${date}.`);
