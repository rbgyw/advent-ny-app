export const TAROT_CARD_COUNT = 78;
export function isTarotCardId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < TAROT_CARD_COUNT;
}
export function tarotCardId(response: Record<string, unknown> | undefined | null): number | null {
  return isTarotCardId(response?.card_id) ? response.card_id : null;
}
export function shuffleTarotDeck(): number[] {
  const cards = Array.from({ length: TAROT_CARD_COUNT }, (_, id) => id);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j]!, cards[i]!];
  }
  return cards;
}
