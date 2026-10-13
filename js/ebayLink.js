// js/ebayLink.js
import { LANGUAGE_DISPLAY_NAMES } from './languageNames.js';

export function buildEbaySearchQuery(card) {
  const terms = [card.card_name_en, card.set_name, `#${card.card_number}`];

  if (card.language !== 'en') {
    terms.push(LANGUAGE_DISPLAY_NAMES[card.language] ?? card.language);
  }
  if (card.edition === '1st-edition') {
    terms.push('1st Edition');
  }

  return terms.join(' ');
}

export function buildEbaySearchUrl(card) {
  const query = buildEbaySearchQuery(card);
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;
}
