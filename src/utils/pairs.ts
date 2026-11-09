export const pairIds = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const initialPairDeck = [0, 1, 2, 3, 3, 4, 4, 0, 5, 1, 6, 7, 2, 7, 5, 6];

export function createPairDeck(): number[] {
  const deck = [...initialPairDeck];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  return deck;
}
export function isPairDeck(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 16 && pairIds.every(id => value.filter(item => item === id).length === 2);
}
export function isPairsSolution(matched: readonly number[]): boolean {
  return matched.length === pairIds.length && pairIds.every(id => matched.includes(id));
}
