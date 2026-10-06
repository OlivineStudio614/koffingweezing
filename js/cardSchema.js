export const SPECIES = ['koffing', 'weezing', 'galarian-weezing'];

const REQUIRED_STRING_FIELDS = ['id', 'card_name', 'set_name', 'release_date', 'language', 'image_url'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateCard(card) {
  const errors = [];

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof card[field] !== 'string' || card[field].trim() === '') {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  if (!SPECIES.includes(card.species)) {
    errors.push(`species must be one of ${SPECIES.join(', ')}, got "${card.species}"`);
  }

  if (typeof card.release_date === 'string' && !DATE_RE.test(card.release_date)) {
    errors.push(`release_date must match YYYY-MM-DD, got "${card.release_date}"`);
  }

  if (typeof card.owned !== 'boolean') {
    errors.push('owned must be a boolean');
  }

  if (typeof card.depicted_only !== 'boolean') {
    errors.push('depicted_only must be a boolean');
  }

  if (card.owned === true) {
    if (typeof card.owned_date !== 'string' || !DATE_RE.test(card.owned_date)) {
      errors.push('owned_date must be YYYY-MM-DD when owned is true');
    }
  } else if (card.owned === false) {
    if (card.owned_date !== null && card.owned_date !== undefined) {
      errors.push('owned_date must be null when owned is false');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateCardList(cards) {
  const messages = [];
  const seenIds = new Set();

  for (const card of cards) {
    const { valid, errors } = validateCard(card);
    if (!valid) {
      messages.push(`Invalid card "${card.id || '(missing id)'}": ${errors.join('; ')}`);
    }
    if (card.id) {
      if (seenIds.has(card.id)) {
        messages.push(`Duplicate id: "${card.id}"`);
      }
      seenIds.add(card.id);
    }
  }

  return { valid: messages.length === 0, messages };
}
