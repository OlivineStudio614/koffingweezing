// scripts/fetch-tcgdex.js
//
// Pulls all known Koffing/Weezing/Galarian Weezing printings for a given
// language from the TCGdex API (tcgdex.dev) and merges any not already in
// data/cards.json. Builds an English reference map once (species,
// card_name_en, rarity — keyed by TCGdex's cross-language card id) to
// classify cards in every other language, since TCGdex's card `id` scheme
// is stable across the languages a card was printed in.
//
// Usage: node scripts/fetch-tcgdex.js <lang> [<lang> ...]
// Language codes match TCGdex's own (e.g. ja, fr, de, es, it, pt, zh-tw,
// zh-cn, ko, th, id) — see data/cards.json's existing `language` values.

import { readFileSync, writeFileSync } from 'node:fs';
import { isDigitalOnlySet, transformTcgdexCard } from '../js/tcgdexImport.js';
import { mergeCards } from '../js/pokemonTcgImport.js';

const API = 'https://api.tcgdex.net/v2';

async function fetchJsonWithRetry(url, tries = 10) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // transient network error — retry
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Failed to fetch after ${tries} tries: ${url}`);
}

async function buildEnglishReferenceMap() {
  const [koffingList, weezingList] = await Promise.all([
    fetchJsonWithRetry(`${API}/en/cards?dexId=109`),
    fetchJsonWithRetry(`${API}/en/cards?dexId=110`),
  ]);

  const map = {};
  for (const { id, name } of [...koffingList, ...weezingList]) {
    if (isDigitalOnlySet(id.split('-')[0])) continue;
    const isKoffing = koffingList.some(c => c.id === id);
    const species = isKoffing ? 'koffing' : (/galarian/i.test(name) ? 'galarian-weezing' : 'weezing');
    map[id] = { species, card_name_en: name };
  }

  // Enrich with rarity, one detail call per unique id (reused across every language).
  for (const id of Object.keys(map)) {
    const detail = await fetchJsonWithRetry(`${API}/en/cards/${id}`);
    map[id].rarity = detail.rarity ?? null;
    await new Promise(r => setTimeout(r, 100));
  }

  return map;
}

async function fetchLanguageCandidates(lang, referenceMap) {
  const [koffingList, weezingList] = await Promise.all([
    fetchJsonWithRetry(`${API}/${lang}/cards?dexId=109`),
    fetchJsonWithRetry(`${API}/${lang}/cards?dexId=110`),
  ]);

  const setNameCache = {};
  const candidates = [];

  for (const [list, isKoffingDex] of [[koffingList, true], [weezingList, false]]) {
    for (const item of list) {
      const setId = item.id.slice(0, item.id.lastIndexOf('-'));
      if (isDigitalOnlySet(setId)) continue;

      const cacheKey = `${lang}:${setId}`;
      if (!setNameCache[cacheKey]) {
        const setDetail = await fetchJsonWithRetry(`${API}/${lang}/sets/${setId}`);
        setNameCache[cacheKey] = {
          name: setDetail.name,
          releaseDate: setDetail.releaseDate,
        };
        await new Promise(r => setTimeout(r, 100));
      }
      const setInfo = setNameCache[cacheKey];
      if (!setInfo.releaseDate) continue; // skip sets TCGdex has no release date for

      candidates.push(transformTcgdexCard({
        id: item.id,
        localId: item.localId,
        nativeName: item.name,
        image: item.image,
        language: lang,
        setName: setInfo.name,
        releaseDate: setInfo.releaseDate,
        referenceMap,
        isKoffingDex,
      }));
    }
  }

  return candidates;
}

const langs = process.argv.slice(2);
if (langs.length === 0) {
  console.error('Usage: node scripts/fetch-tcgdex.js <lang> [<lang> ...]');
  process.exit(1);
}

const dataPath = new URL('../data/cards.json', import.meta.url);
let cards = JSON.parse(readFileSync(dataPath, 'utf8'));

console.log('Building English reference map...');
const referenceMap = await buildEnglishReferenceMap();
console.log(`Reference map: ${Object.keys(referenceMap).length} ids.`);

for (const lang of langs) {
  console.log(`\nFetching candidates for "${lang}"...`);
  const candidates = await fetchLanguageCandidates(lang, referenceMap);
  const before = cards.length;
  cards = mergeCards(cards, candidates);
  console.log(`  ${candidates.length} candidate(s) found, ${cards.length - before} new.`);
}

writeFileSync(dataPath, JSON.stringify(cards, null, 2) + '\n');
console.log('\nWrote data/cards.json.');
