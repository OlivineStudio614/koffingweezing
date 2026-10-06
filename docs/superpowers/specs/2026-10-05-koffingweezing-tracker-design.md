# Koffing/Weezing Smoke-Free Card Tracker — Design

## Purpose

A personal habit-tracking project: for every day the user doesn't smoke, they
add one physical Koffing or Weezing Pokémon card to a dedicated binder (a
Pokémon Center Koffing/Weezing binder, already loaded with Koffing/Weezing
sleeves). They already own the Base Set (1st edition) Koffing.

This project is the companion GitHub Pages site: a visual checklist of every
Koffing/Weezing card that exists, shown in chronological order, so progress
toward "collect them all, one per smoke-free day" is visible over time.

## Scope: what counts as a card

- **Species:** Koffing, Weezing, and Galarian Weezing.
- **Variant granularity:** 1st edition vs. unlimited vs. shadowless, and each
  language, count as distinct cards (matches physical reality — these are
  different printed objects, not duplicates).
- **Depicted-but-not-named cards included:** any card where one of these
  three Pokémon appears as a visible depicted Pokémon — as the card's own
  subject (the normal case), or appearing in another card's artwork (e.g. a
  Trainer/Gym Leader card showing their team).
- **Best-effort, not exhaustive-by-claim:** there is no single authoritative
  database covering every language and every artwork appearance. The card
  list is a living document — built as thoroughly as current research
  allows, expected to grow and get corrected as more cards are found. The
  site must not assume the list is final.

## Data model

Single file: `data/cards.json` — an array of card objects:

```json
{
  "id": "base1-koffing-1stEd-en",
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
  "source_note": "pokemontcg.io API",
  "owned": true,
  "owned_date": "2026-09-01"
}
```

- `id` is a stable, human-readable slug (set-code + species + edition +
  language), used as the key for logging a day's acquisition.
- `depicted_only: true` marks cards where the species appears in another
  card's artwork rather than being the card's own subject.
- `image_url` may point to an external CDN (Pokémon TCG API, for English
  cards) or a repo-local path under `images/` for cards sourced manually.
- `owned` / `owned_date` are the only fields the daily workflow touches.

## Research approach

1. **English cards (mechanical):** pull all Koffing/Weezing cards from the
   Pokémon TCG API (pokemontcg.io) — gives set, release date, rarity,
   edition variants, and hosted images directly.
2. **Everything else (manual, best-effort):** cross-reference Bulbapedia,
   Serebii, and TCG Collector for:
   - Non-English printings (Japanese, and as many other languages as can be
     reliably sourced).
   - Galarian Weezing cards.
   - Cards where Koffing/Weezing/Galarian Weezing appear in another card's
     artwork (`depicted_only: true`).
3. This pass is done once up front by a research agent to seed
   `cards.json`, with the data model and tooling built to accept additions
   later — this is explicitly an ongoing project, not a one-shot import.

## Site

- Static site lives at the repo root on the `main` branch, served directly
  by GitHub Pages (Settings → Pages → Deploy from branch → `main` / `/`).
  No build step, no framework dependency, no GitHub Actions workflow needed.
  (Planning docs live under `docs/superpowers/specs/` — a different `docs/`
  than GitHub Pages' root serving, no collision since Pages serves from
  repo root here.)
- Reads `data/cards.json` directly (fetched client-side).
- Displays all cards in chronological order by `release_date`.
- Owned cards render normally with their image and `owned_date`; unowned
  cards render grayed-out/silhouetted.
- A "next up" marker highlights the earliest unowned card in chronological
  order. As the dataset has grown to include vintage and non-English
  printings, "earliest" may not always mean "easiest to acquire" — the
  marker reflects release-date order, not acquisition difficulty.
- Basic filters (language, species, edition) are reasonable but secondary —
  not required for v1.

## Daily logging workflow

- No backend, no form submission — stays a static site.
- A small script, `scripts/mark-collected.js <card-id> [date]`, flips that
  card's `owned`/`owned_date` fields in `cards.json` in place. Defaults
  `date` to today.
- The user (or Claude Code, on request) runs the script, then commits and
  pushes — GitHub Pages redeploys automatically.

## Repo

- New repo: `koffingweezing`, public (required for free GitHub Pages
  hosting on a personal account).
- GitHub Pages served from the repo root on `main` (see Site section).

## Explicit non-goals (v1)

- No user accounts, no backend, no database server.
- No web form for logging — the script-based workflow is the whole
  interface for adding a day's card.
- No claim of 100%, provably complete card coverage — the list is best
  effort and will be revised as new cards are found.

## Open items for the implementation plan

- Exact GitHub Pages serving configuration (branch/folder vs. Actions
  workflow).
- Initial size/scope of the research pass (how many languages, how deep the
  "depicted in other cards' artwork" search goes) — bounded by what a
  research agent can verify from the sources above in one pass.
