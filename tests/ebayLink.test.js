import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEbaySearchQuery, buildEbaySearchUrl } from '../js/ebayLink.js';

const baseCard = {
  card_name_en: 'Koffing',
  set_name: 'Base Set',
  card_number: '51',
  language: 'en',
  edition: null,
};

test('buildEbaySearchQuery includes name, set, and number for an English card', () => {
  assert.equal(buildEbaySearchQuery(baseCard), 'Koffing Base Set #51');
});

test('buildEbaySearchQuery appends the language label for a non-English card', () => {
  const card = { ...baseCard, set_name: 'Expansion Pack', card_number: '006', language: 'jp' };
  assert.equal(buildEbaySearchQuery(card), 'Koffing Expansion Pack #006 Japanese');
});

test('buildEbaySearchQuery appends "1st Edition" when the card is that edition', () => {
  const card = { ...baseCard, edition: '1st-edition' };
  assert.equal(buildEbaySearchQuery(card), 'Koffing Base Set #51 1st Edition');
});

test('buildEbaySearchQuery falls back to the raw language code if unmapped', () => {
  const card = { ...baseCard, language: 'xx' };
  assert.equal(buildEbaySearchQuery(card), 'Koffing Base Set #51 xx');
});

test('buildEbaySearchUrl URL-encodes the query onto an ebay.com search', () => {
  const url = buildEbaySearchUrl(baseCard);
  assert.equal(url, 'https://www.ebay.com/sch/i.html?_nkw=Koffing%20Base%20Set%20%2351');
});

test('buildEbaySearchUrl handles special characters in names/sets', () => {
  const card = { ...baseCard, card_name_en: "Koga's Koffing", set_name: 'Gym Challenge' };
  const url = buildEbaySearchUrl(card);
  assert.ok(url.startsWith('https://www.ebay.com/sch/i.html?_nkw='));
  assert.equal(decodeURIComponent(url.split('_nkw=')[1]), "Koga's Koffing Gym Challenge #51");
});
