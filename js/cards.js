export const LANGUAGE_DISPLAY_NAMES = {
  en: 'English',
  jp: 'Japanese',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  'zh-cn': 'Chinese (Simplified)',
  'zh-tw': 'Chinese (Traditional)',
  ko: 'Korean',
  id: 'Indonesian',
  th: 'Thai',
};

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

  return sorted.map(card => {
    const languageDisplayName = LANGUAGE_DISPLAY_NAMES[card.language] ?? card.language;
    const showNative = card.language !== 'en' || card.card_name !== card.card_name_en;

    return {
      id: card.id,
      labelEn: `${card.card_name_en} — ${card.set_name} — ${languageDisplayName} — #${card.card_number}`,
      labelNative: showNative ? card.card_name : null,
      imageUrl: card.image_url,
      releaseDate: card.release_date,
      owned: card.owned,
      ownedDate: card.owned_date,
      isNextUp: card.id === nextUpId,
    };
  });
}
