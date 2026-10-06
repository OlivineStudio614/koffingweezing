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
