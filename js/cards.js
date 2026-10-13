import { buildEbaySearchUrl } from './ebayLink.js';
import { LANGUAGE_DISPLAY_NAMES } from './languageNames.js';

export { LANGUAGE_DISPLAY_NAMES };

export function sortByReleaseDate(cards) {
  return [...cards].sort((a, b) => a.release_date.localeCompare(b.release_date));
}

export function getNextUnowned(cards) {
  const sorted = sortByReleaseDate(cards);
  return sorted.find(c => !c.owned) ?? null;
}

export function buildCollectionStats(cards) {
  const total = cards.length;
  const owned = cards.filter(c => c.owned).length;
  const percent = total === 0 ? 0 : (owned / total) * 100;
  return { owned, total, percent };
}

export function formatCollectionStatsText({ owned, total, percent }) {
  return `${owned} / ${total} collected (${Number(percent.toFixed(1))}%)`;
}

export function buildCardViewModel(cards) {
  const sorted = sortByReleaseDate(cards);
  const nextUpId = getNextUnowned(sorted)?.id ?? null;

  return sorted.map(card => {
    const languageDisplayName = LANGUAGE_DISPLAY_NAMES[card.language] ?? card.language;
    const showNative = card.language !== 'en' || card.card_name !== card.card_name_en;

    return {
      id: card.id,
      labelEn: `${card.card_name_en} — ${card.set_name} — ${languageDisplayName} — #${card.card_number}`,
      labelNative: showNative ? card.card_name : null,
      imageUrl: card.image_url,
      ebayUrl: buildEbaySearchUrl(card),
      releaseDate: card.release_date,
      owned: card.owned,
      ownedDate: card.owned_date,
      isNextUp: card.id === nextUpId,
    };
  });
}
