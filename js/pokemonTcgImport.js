// js/pokemonTcgImport.js

// The pokemontcg.io API returns cards whose `name` field includes trainer
// prefixes/suffixes (e.g. "Koga's Koffing", "Dark Weezing", "Team Rocket's
// Weezing") and "Galarian Weezing" (space-separated). Our schema's `species`
// field is a closed enum (koffing / weezing / galarian-weezing) representing
// the underlying Pokémon, not the card's display name, so we normalize to it
// here rather than lowercasing the raw name verbatim.
function deriveSpecies(name) {
  const lower = name.toLowerCase();
  if (lower.includes('galarian') && lower.includes('weezing')) return 'galarian-weezing';
  if (lower.includes('weezing')) return 'weezing';
  if (lower.includes('koffing')) return 'koffing';
  return lower;
}

export function transformPokemonTCGCard(apiCard) {
  const species = deriveSpecies(apiCard.name);

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
