import { readFileSync, writeFileSync } from 'node:fs';
import { markCollected } from '../js/markCollected.js';

const [id, dateArg] = process.argv.slice(2);

if (!id) {
  console.error('Usage: node scripts/mark-collected.js <card-id> [YYYY-MM-DD]');
  process.exit(1);
}

const now = new Date();
const date = dateArg ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`Invalid date "${date}" — expected YYYY-MM-DD`);
  process.exit(1);
}

const dataPath = new URL('../data/cards.json', import.meta.url);
const cards = JSON.parse(readFileSync(dataPath, 'utf8'));

const existing = cards.find(c => c.id === id);
if (existing && existing.owned === true) {
  console.error(
    `Card "${id}" is already marked owned (owned_date: ${existing.owned_date}). ` +
      'Refusing to overwrite — if this is intentional, edit data/cards.json directly.'
  );
  process.exit(1);
}

const updated = markCollected(cards, id, date);

writeFileSync(dataPath, JSON.stringify(updated, null, 2) + '\n');
console.log(`Marked "${id}" as owned on ${date}.`);
