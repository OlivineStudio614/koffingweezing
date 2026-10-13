// js/tcgdexImport.js
//
// TCGdex (tcgdex.dev) exposes per-language card lists queryable by national
// Pokédex number (dexId), with a card `id` scheme (`${setId}-${localId}`)
// that is stable across every language a card was printed in. We build an
// English reference map once (species + card_name_en + rarity, keyed by
// that shared id) and reuse it to classify cards fetched in every other
// language, rather than re-deriving species from untranslated native text.

export function parseTcgdexId(id) {
  const idx = id.lastIndexOf('-');
  return { setId: id.slice(0, idx), localId: id.slice(idx + 1) };
}

// TCG Pocket (the digital-only app) uses set ids like "A1", "A1a" — this is
// a physical-binder collection, so those are out of scope.
export function isDigitalOnlySet(setId) {
  return /^A\d/i.test(setId);
}

export function classifySpecies({ id, isKoffingDex, nativeName, referenceMap }) {
  const ref = referenceMap[id];
  if (ref) return ref.species;
  if (isKoffingDex) return 'koffing';
  return /galar/i.test(nativeName) ? 'galarian-weezing' : 'weezing';
}

export function transformTcgdexCard({ id, localId, nativeName, image, language, setName, releaseDate, referenceMap, isKoffingDex }) {
  const { setId } = parseTcgdexId(id);
  const ref = referenceMap[id];
  const species = classifySpecies({ id, isKoffingDex, nativeName, referenceMap });
  const card_name_en = ref
    ? ref.card_name_en
    : (species === 'galarian-weezing' ? 'Galarian Weezing' : species === 'koffing' ? 'Koffing' : 'Weezing');
  const sourceDetail = ref
    ? `TCGdex API: card https://api.tcgdex.net/v2/${language}/cards/${id} (set "${setName}", number ${localId}); set release date from https://api.tcgdex.net/v2/${language}/sets/${setId}. Species/English name cross-checked against the English TCGdex printing of the same card id.`
    : `TCGdex API: card https://api.tcgdex.net/v2/${language}/cards/${id} (set "${setName}", number ${localId}); set release date from https://api.tcgdex.net/v2/${language}/sets/${setId}. No English TCGdex printing shares this card id (likely an Asia-region-exclusive set) — species/card_name_en inferred from the native name rather than cross-checked; verify manually.`;

  return {
    id: `${setId}-${species}-${localId}-${language}`,
    species,
    card_name: nativeName,
    card_name_en,
    set_name: setName,
    set_code: setId,
    card_number: localId,
    release_date: releaseDate,
    language,
    edition: null,
    rarity: ref?.rarity ?? null,
    depicted_only: false,
    image_url: `${image}/high.png`,
    source_note: sourceDetail,
    owned: false,
    owned_date: null,
  };
}
