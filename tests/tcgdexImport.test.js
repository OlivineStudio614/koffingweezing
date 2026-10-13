import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTcgdexId, isDigitalOnlySet, classifySpecies, transformTcgdexCard } from '../js/tcgdexImport.js';

test('parseTcgdexId splits on the last hyphen', () => {
  assert.deepEqual(parseTcgdexId('xy10-27'), { setId: 'xy10', localId: '27' });
  assert.deepEqual(parseTcgdexId('swsh4.5-41'), { setId: 'swsh4.5', localId: '41' });
  assert.deepEqual(parseTcgdexId('swsh4.5sv-SV076'), { setId: 'swsh4.5sv', localId: 'SV076' });
});

test('isDigitalOnlySet flags TCG Pocket set ids', () => {
  assert.equal(isDigitalOnlySet('A1'), true);
  assert.equal(isDigitalOnlySet('A1a'), true);
  assert.equal(isDigitalOnlySet('swsh2'), false);
  assert.equal(isDigitalOnlySet('base1'), false);
});

test('classifySpecies uses the English reference map when the id is known', () => {
  const referenceMap = { 'swsh2-113': { species: 'galarian-weezing', card_name_en: 'Galarian Weezing', rarity: 'Holo Rare' } };
  assert.equal(classifySpecies({ id: 'swsh2-113', isKoffingDex: false, nativeName: 'anything', referenceMap }), 'galarian-weezing');
});

test('classifySpecies falls back to koffing for an unmapped dex-109 id', () => {
  assert.equal(classifySpecies({ id: 'xyz1-1', isKoffingDex: true, nativeName: '', referenceMap: {} }), 'koffing');
});

test('classifySpecies falls back to native-name Galar detection for an unmapped dex-110 id', () => {
  assert.equal(classifySpecies({ id: 'xyz1-2', isKoffingDex: false, nativeName: 'Weezing de Galar', referenceMap: {} }), 'galarian-weezing');
  assert.equal(classifySpecies({ id: 'xyz1-3', isKoffingDex: false, nativeName: 'Weezing', referenceMap: {} }), 'weezing');
});

test('transformTcgdexCard builds a schema-shaped card from a reference-mapped id', () => {
  const referenceMap = { 'swsh2-113': { species: 'galarian-weezing', card_name_en: 'Galarian Weezing', rarity: 'Holo Rare' } };
  const card = transformTcgdexCard({
    id: 'swsh2-113',
    localId: '113',
    nativeName: 'Weezing de Galar',
    image: 'https://assets.tcgdex.net/es/swsh/swsh2/113',
    language: 'es',
    setName: 'Choque Rebelde',
    releaseDate: '2020-05-01',
    referenceMap,
    isKoffingDex: false,
  });

  assert.equal(card.id, 'swsh2-galarian-weezing-113-es');
  assert.equal(card.species, 'galarian-weezing');
  assert.equal(card.card_name, 'Weezing de Galar');
  assert.equal(card.card_name_en, 'Galarian Weezing');
  assert.equal(card.set_code, 'swsh2');
  assert.equal(card.card_number, '113');
  assert.equal(card.release_date, '2020-05-01');
  assert.equal(card.language, 'es');
  assert.equal(card.rarity, 'Holo Rare');
  assert.equal(card.image_url, 'https://assets.tcgdex.net/es/swsh/swsh2/113/high.png');
  assert.equal(card.owned, false);
  assert.equal(card.owned_date, null);
  assert.equal(card.depicted_only, false);
});

test('transformTcgdexCard flags cards with no English counterpart in the source note', () => {
  const card = transformTcgdexCard({
    id: 'sv10s-100',
    localId: '100',
    nativeName: 'มาตาโดกัซ ของแก๊งร็อกเกต',
    image: 'https://assets.tcgdex.net/th/sv/sv10s/100',
    language: 'th',
    setName: 'การผงาดของผู้ไร้พ่าย',
    releaseDate: '2025-06-13',
    referenceMap: {},
    isKoffingDex: false,
  });

  assert.equal(card.species, 'weezing');
  assert.match(card.source_note, /No English TCGdex printing/);
});
