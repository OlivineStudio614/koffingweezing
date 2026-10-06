export function markCollected(cards, id, date) {
  const index = cards.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error(`No card found with id "${id}"`);
  }
  const updated = [...cards];
  updated[index] = { ...updated[index], owned: true, owned_date: date };
  return updated;
}
