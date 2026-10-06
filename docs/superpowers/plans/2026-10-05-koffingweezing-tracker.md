# Koffing/Weezing Smoke-Free Card Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static GitHub Pages site that shows every Koffing/Weezing/Galarian Weezing card as a chronological checklist, plus a one-line script to mark a card "owned" each smoke-free day.

**Architecture:** Plain HTML/CSS/JS static site reading `data/cards.json` client-side (no build step, no framework). Pure logic functions (sorting, next-unowned, view-model building, schema validation, card-list merging) live in small ES modules shared between the browser and Node CLI scripts, so the same code is unit-tested with `node:test` and used live. CLI scripts (`validate-cards.js`, `mark-collected.js`, `fetch-pokemontcg.js`) are thin I/O wrappers around those pure functions.

**Tech Stack:** Node.js 18+ (`node:test`, `node:assert/strict`, native `fetch`) for scripts and tests; vanilla HTML/CSS/JS (ES modules) for the site; GitHub Pages (serve from `main` branch, repo root) for hosting; `gh` CLI for repo creation.

**Spec:** `docs/superpowers/specs/2026-10-05-koffingweezing-tracker-design.md`

## Global Constraints

- Card scope: Koffing, Weezing, Galarian Weezing — every edition/language printing found, plus cards where one is depicted in another card's artwork (`depicted_only: true`). Best-effort; the list is explicitly allowed to be incomplete and grow over time.
- No backend, no database server, no user accounts, no web form for logging.
- No build step, no JS framework/bundler — static files only.
- Repo: public GitHub repo named `koffingweezing`.
- GitHub Pages serves from the `main` branch, repo root (`/`).
- `data/cards.json` is the single source of truth; its schema (see Task 1) is fixed across all tasks.

---

### Task 1: Card schema module + validation logic

**Files:**
- Create: `package.json`
- Create: `js/cardSchema.js`
- Test: `tests/cardSchema.test.js`

**Interfaces:**
- Produces: `validateCard(card: object) => { valid: boolean, errors: string[] }`
- Produces: `validateCardList(cards: object[]) => { valid: boolean, messages: string[] }`
- Produces: `SPECIES: string[]` (`['koffing', 'weezing', 'galarian-weezing']`)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "koffingweezing",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/",
    "validate": "node scripts/validate-cards.js"
  }
}
```

- [ ] **Step 2: Write the failing tests**

```javascript
// tests/cardSchema.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test tests/cardSchema.test.js`
Expected: FAIL — `js/cardSchema.js` does not exist yet.

- [ ] **Step 4: Implement `js/cardSchema.js`**

```javascript
// js/cardSchema.js
export const SPECIES = ['koffing', 'weezing', 'galarian-weezing'];

const REQUIRED_STRING_FIELDS = ['id', 'card_name', 'set_name', 'release_date', 'language', 'image_url'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateCard(card) {
  const errors = [];

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof card[field] !== 'string' || card[field].trim() === '') {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (!SPECIES.includes(card.species)) {
    errors.push(`species must be one of ${SPECIES.join(', ')}, got "${card.species}"`);
  }

  if (typeof card.release_date === 'string' && !DATE_RE.test(card.release_date)) {
    errors.push(`release_date must match YYYY-MM-DD, got "${card.release_date}"`);
  }

  if (typeof card.owned !== 'boolean') {
    errors.push('owned must be a boolean');
  }

  if (typeof card.depicted_only !== 'boolean') {
    errors.push('depicted_only must be a boolean');
  }

  if (card.owned === true) {
    if (typeof card.owned_date !== 'string' || !DATE_RE.test(card.owned_date)) {
      errors.push('owned_date must be YYYY-MM-DD when owned is true');
    }
  } else if (card.owned === false) {
    if (card.owned_date !== null && card.owned_date !== undefined) {
      errors.push('owned_date must be null when owned is false');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateCardList(cards) {
  const messages = [];
  const seenIds = new Set();

  for (const card of cards) {
    const { valid, errors } = validateCard(card);
    if (!valid) {
      messages.push(`Invalid card "${card.id || '(missing id)'}": ${errors.join('; ')}`);
    }
    if (card.id) {
      if (seenIds.has(card.id)) {
        messages.push(`Duplicate id: "${card.id}"`);
      }
      seenIds.add(card.id);
    }
  }

  return { valid: messages.length === 0, messages };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test tests/cardSchema.test.js`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json js/cardSchema.js tests/cardSchema.test.js
git commit -m "feat: add card schema validation"
```

---

### Task 2: Seed data + validate-cards CLI

**Files:**
- Create: `data/cards.json`
- Create: `scripts/validate-cards.js`

**Interfaces:**
- Consumes: `validateCardList` from `js/cardSchema.js` (Task 1)
- Produces: `data/cards.json` — the live card database, read by every later task

- [ ] **Step 1: Create the seed data file with the one owned card**

```json
[
  {
    "id": "base1-koffing-48-1stEd-en",
    "species": "koffing",
    "card_name": "Koffing",
    "set_name": "Base Set",
    "set_code": "base1",
    "card_number": "48",
    "release_date": "1999-01-09",
    "language": "en",
    "edition": "1st-edition",
    "rarity": "common",
    "depicted_only": false,
    "image_url": "https://images.pokemontcg.io/base1/48_hires.png",
    "source_note": "Physically owned, Pokemon Center binder",
    "owned": true,
    "owned_date": "2026-09-01"
  }
]
```

- [ ] **Step 2: Implement the CLI wrapper**

```javascript
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
```

- [ ] **Step 3: Run it against the seed data**

Run: `npm run validate`
Expected: `All 1 card(s) valid.`

- [ ] **Step 4: Commit**

```bash
git add data/cards.json scripts/validate-cards.js
git commit -m "feat: seed card data and add validate-cards CLI"
```

---

### Task 3: Chronological ordering, next-unowned, and view-model logic

**Files:**
- Create: `js/cards.js`
- Test: `tests/cards.test.js`

**Interfaces:**
- Consumes: card objects matching the schema from Task 1
- Produces: `sortByReleaseDate(cards) => cards[]`
- Produces: `getNextUnowned(cards) => card | null`
- Produces: `buildCardViewModel(cards) => { id, label, imageUrl, releaseDate, owned, ownedDate, isNextUp }[]`

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/cards.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/cards.test.js`
Expected: FAIL — `js/cards.js` does not exist yet.

- [ ] **Step 3: Implement `js/cards.js`**

```javascript
// js/cards.js
export function sortByReleaseDate(cards) {
  return [...cards].sort((a, b) => a.release_date.localeCompare(b.release_date));
}

export function getNextUnowned(cards) {
  const sorted = sortByReleaseDate(cards);
  return sorted.find(c => !c.owned) ?? null;
}

export function buildCardViewModel(cards) {
  const sorted = sortByReleaseDate(cards);
  const nextUpId = getNextUnowned(sorted)?.id ?? null;

  return sorted.map(card => ({
    id: card.id,
    label: `${card.card_name} — ${card.set_name} (${card.language}${card.edition ? ', ' + card.edition : ''})`,
    imageUrl: card.image_url,
    releaseDate: card.release_date,
    owned: card.owned,
    ownedDate: card.owned_date,
    isNextUp: card.id === nextUpId,
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/cards.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add js/cards.js tests/cards.test.js
git commit -m "feat: add chronological sort, next-unowned, and view-model logic"
```

---

### Task 4: `mark-collected` logic and CLI

**Files:**
- Create: `js/markCollected.js`
- Create: `scripts/mark-collected.js`
- Test: `tests/markCollected.test.js`

**Interfaces:**
- Produces: `markCollected(cards, id, date) => cards[]` (throws if `id` not found)

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/markCollected.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/markCollected.test.js`
Expected: FAIL — `js/markCollected.js` does not exist yet.

- [ ] **Step 3: Implement `js/markCollected.js`**

```javascript
// js/markCollected.js
export function markCollected(cards, id, date) {
  const index = cards.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error(`No card found with id "${id}"`);
  }
  const updated = [...cards];
  updated[index] = { ...updated[index], owned: true, owned_date: date };
  return updated;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/markCollected.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Implement the CLI wrapper**

```javascript
// scripts/mark-collected.js
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
```

- [ ] **Step 6: Manually verify the CLI against the seed data**

Run: `node scripts/mark-collected.js base1-koffing-48-1stEd-en 2026-09-01 && npm run validate`
Expected: `Marked "base1-koffing-48-1stEd-en" as owned on 2026-09-01.` then `All 1 card(s) valid.` (re-asserts the already-owned seed card; confirms the script round-trips through `data/cards.json` correctly without corrupting it)

- [ ] **Step 7: Commit**

```bash
git add js/markCollected.js scripts/mark-collected.js tests/markCollected.test.js
git commit -m "feat: add mark-collected logic and CLI"
```

---

### Task 5: Static site (index.html, styles.css, app.js)

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `js/app.js`

**Interfaces:**
- Consumes: `buildCardViewModel` from `js/cards.js` (Task 3); fetches `data/cards.json` at runtime

- [ ] **Step 1: Create `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Koffing / Weezing Collection</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Koffing / Weezing Collection</h1>
  <div id="card-grid"></div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `styles.css`**

```css
body {
  font-family: sans-serif;
  background: #f5f5f0;
  margin: 0;
  padding: 2rem;
}

#card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.card {
  text-align: center;
}

.card img {
  width: 100%;
  border-radius: 6px;
}

.card.unowned img {
  filter: grayscale(1) brightness(0.6);
}

.card.next-up {
  outline: 3px solid #e63946;
  border-radius: 8px;
}

.card p {
  font-size: 0.8rem;
}
```

- [ ] **Step 3: Implement `js/app.js`**

```javascript
// js/app.js
import { buildCardViewModel } from './cards.js';

async function init() {
  const response = await fetch('data/cards.json');
  const cards = await response.json();
  render(buildCardViewModel(cards));
}

function render(viewModels) {
  const container = document.getElementById('card-grid');
  container.innerHTML = '';

  for (const vm of viewModels) {
    const el = document.createElement('div');
    el.className = `card ${vm.owned ? 'owned' : 'unowned'}${vm.isNextUp ? ' next-up' : ''}`;

    const img = document.createElement('img');
    img.src = vm.imageUrl;
    img.alt = vm.label;
    el.appendChild(img);

    const caption = document.createElement('p');
    caption.textContent = vm.owned
      ? `${vm.label} — collected ${vm.ownedDate}`
      : vm.isNextUp
        ? `${vm.label} — next up!`
        : vm.label;
    el.appendChild(caption);

    container.appendChild(el);
  }
}

init();
```

- [ ] **Step 4: Manually verify in a browser**

Run: `python3 -m http.server 8000` (from the repo root), then open `http://localhost:8000/`
Expected: the seed Koffing card renders with its image and "collected 2026-09-01" caption. (With only one, already-owned card in the data, there's no unowned/next-up card to see yet — that becomes visible once Task 7 adds more cards.)

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css js/app.js
git commit -m "feat: add static site rendering the chronological card grid"
```

---

### Task 6: Create the GitHub repo and deploy

**Files:**
- Create: `.gitignore`
- Create: `README.md`

**Interfaces:**
- Consumes: all files from Tasks 1–5

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
.DS_Store
```

- [ ] **Step 2: Create `README.md`**

```markdown
# Koffing / Weezing Collection

A chronological checklist of every Koffing/Weezing/Galarian Weezing card
(best effort, across editions and languages), tracking a physical binder
collection built one card per smoke-free day.

## Usage

- View the live site: see the GitHub Pages URL in the repo's "About" section.
- Log today's card: `node scripts/mark-collected.js <card-id> [YYYY-MM-DD]`
- Validate the data file: `npm run validate`
- Run tests: `npm test`
```

- [ ] **Step 3: Create the public GitHub repo and push**

Run: `gh repo create koffingweezing --public --source=. --remote=origin --push`
Expected: repo created at `https://github.com/<your-username>/koffingweezing`, `main` pushed.

- [ ] **Step 4: Enable GitHub Pages from the repo root**

Run: `gh api -X POST repos/{owner}/{repo}/pages -f "source[branch]=main" -f "source[path]=/"`
Expected: JSON response describing the new Pages site, including its `html_url`.

- [ ] **Step 5: Verify the live site**

Wait a minute for the initial Pages build, then open the `html_url` from Step 4 in a browser.
Expected: same rendering as the local verification in Task 5, Step 4.

- [ ] **Step 6: Commit**

```bash
git add .gitignore README.md
git commit -m "docs: add README and gitignore"
git push
```

---

### Task 7: Populate English cards from the Pokémon TCG API

**Files:**
- Create: `js/pokemonTcgImport.js`
- Create: `scripts/fetch-pokemontcg.js`
- Test: `tests/pokemonTcgImport.test.js`

**Interfaces:**
- Produces: `transformPokemonTCGCard(apiCard) => card` (schema-shaped, matching Task 1)
- Produces: `mergeCards(existing, incoming) => cards[]` (existing entries always win on id collision)

- [ ] **Step 1: Write the failing tests**

```javascript
// tests/pokemonTcgImport.test.js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/pokemonTcgImport.test.js`
Expected: FAIL — `js/pokemonTcgImport.js` does not exist yet.

- [ ] **Step 3: Implement `js/pokemonTcgImport.js`**

```javascript
// js/pokemonTcgImport.js
export function transformPokemonTCGCard(apiCard) {
  const species = apiCard.name.toLowerCase();

  return {
    id: `${apiCard.set.id}-${species}-${apiCard.number}-en`,
    species,
    card_name: apiCard.name,
    set_name: apiCard.set.name,
    set_code: apiCard.set.id,
    card_number: apiCard.number,
    release_date: apiCard.set.releaseDate.replaceAll('/', '-'),
    language: 'en',
    edition: null,
    rarity: apiCard.rarity ?? null,
    depicted_only: false,
    image_url: apiCard.images?.large ?? apiCard.images?.small ?? null,
    source_note: 'pokemontcg.io API — edition variant (1st/unlimited/shadowless) not distinguished by the API; verify manually',
    owned: false,
    owned_date: null,
  };
}

export function mergeCards(existing, incoming) {
  const existingIds = new Set(existing.map(c => c.id));
  const newOnes = incoming.filter(c => !existingIds.has(c.id));
  return [...existing, ...newOnes];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/pokemonTcgImport.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Implement the CLI wrapper**

```javascript
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
```

- [ ] **Step 6: Run it against the live API, validate, and review**

Run: `node scripts/fetch-pokemontcg.js && npm run validate`
Expected: console output reporting how many new cards were added, followed by `All N card(s) valid.` Then open `data/cards.json` and skim the new entries for obviously wrong data (missing images, wrong set names) before committing — this is live third-party data, not a fixture.

- [ ] **Step 7: Commit**

```bash
git add js/pokemonTcgImport.js scripts/fetch-pokemontcg.js tests/pokemonTcgImport.test.js data/cards.json
git commit -m "feat: import English Koffing/Weezing cards from pokemontcg.io"
git push
```

---

### Task 8: Manual research pass — other languages, Galarian Weezing, depicted-only cards

**Files:**
- Modify: `data/cards.json`

**Interfaces:**
- Consumes: `validateCardList` (Task 1, via `npm run validate`) as the structural gate for every entry added here

This task is open-ended research, not code — "best effort," per the spec, not a claim of completeness. Work in small batches (by source or by language) and validate + commit after each batch rather than as one giant change, so partial progress is never lost.

- [ ] **Step 1: Research Japanese printings**

Check Bulbapedia's "Koffing (TCG)" and "Weezing (TCG)" pages (they list every printing, including Japanese-exclusive sets and edition variants) and cross-check against Serebii's TCG card dex. For each Japanese printing not already in `data/cards.json`, add an entry following the Task 1 schema: `id` convention `<set_code>-<species>-<card_number>-jp[-<edition>]`, `language: "jp"`, `source_note` citing which page confirmed it (e.g. `"Bulbapedia: Koffing (TCG)"`), `image_url` pointing to that page's scan if no CDN image exists, `owned: false`, `owned_date: null`.

Run: `npm run validate` after adding the batch; fix any reported errors before moving on.

- [ ] **Step 2: Commit the Japanese batch**

```bash
git add data/cards.json
git commit -m "research: add Japanese Koffing/Weezing printings"
```

- [ ] **Step 3: Research other major languages (French, German, Italian, Spanish, Portuguese)**

Same process as Step 1, one language (or one source pass) at a time, using Bulbapedia/Serebii/TCG Collector. Add entries with `language` set to the appropriate ISO-ish code (`fr`, `de`, `it`, `es`, `pt`), validating after each batch.

- [ ] **Step 4: Commit each language batch separately**

```bash
git add data/cards.json
git commit -m "research: add <language> Koffing/Weezing printings"
```

(Repeat Steps 3–4 once per language.)

- [ ] **Step 5: Research Galarian Weezing**

Search Bulbapedia/Serebii/TCG Collector for "Galarian Weezing" TCG printings (Sword & Shield era onward). Add entries with `species: "galarian-weezing"`, `depicted_only: false`. Validate, then commit:

```bash
git add data/cards.json
git commit -m "research: add Galarian Weezing printings"
```

- [ ] **Step 6: Research depicted-only appearances**

Search Bulbapedia/Serebii for Trainer, Gym Leader, or similar cards whose artwork visibly depicts Koffing, Weezing, or Galarian Weezing as one of the Pokémon shown (not as the card's own subject) — e.g. a Gym Leader card illustrated with their team. Add entries with `depicted_only: true` and a `source_note` describing which card's artwork it appears in and why (e.g. `"Depicted in Koga's background art, Gym Heroes"`). This category has no catalog to exhaustively check against — treat it as best-effort and stop once further searching stops turning up new results, rather than chasing full coverage.

Validate, then commit:

```bash
git add data/cards.json
git commit -m "research: add cards depicting Koffing/Weezing in other artwork"
```

- [ ] **Step 7: Push all research commits**

```bash
git push
```

Expected: the live GitHub Pages site (from Task 6) now shows the expanded card list, grayed-out and in chronological order, with the earliest unowned card marked "next up."
