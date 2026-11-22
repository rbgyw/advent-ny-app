import { test, expect } from '@playwright/test';
import { campaignDate } from '../src/utils/calendar';
import { nextCampaignDayDelay } from '../src/utils/campaign-clock';
import { memorySubmissionOpen } from '../src/utils/memory';
import { filmSubmissionOpen, filmError } from '../src/utils/film';
import { CIPHER_LETTERS, isCipherSolution } from '../src/utils/cipher';
import { crosswordSolution, isCrosswordSolution } from '../src/utils/crossword';
import { createPairDeck, isPairDeck, isPairsSolution, pairIds } from '../src/utils/pairs';
import { isTarotCardId, shuffleTarotDeck } from '../src/utils/tarot';
import { solvedNonogram, isNonogramSolution } from '../src/content/nonogram';
test('Moscow midnight and deadline boundaries remain exact', () => {
  const before = new Date('2026-12-10T20:59:59.999Z'), after = new Date('2026-12-10T21:00:00Z');
  expect(campaignDate(before)).toBe('2026-12-10'); expect(campaignDate(after)).toBe('2026-12-11');
  expect(nextCampaignDayDelay(before.getTime())).toBe(1); expect(nextCampaignDayDelay(after.getTime())).toBe(86_400_000);
  expect(memorySubmissionOpen('2026-12-03', before)).toBe(true); expect(memorySubmissionOpen('2026-12-03', after)).toBe(false);
  expect(filmSubmissionOpen('2026-12-12', new Date('2026-12-17T20:59:59Z'))).toBe(true);
  expect(filmSubmissionOpen('2026-12-12', new Date('2026-12-17T21:00:00Z'))).toBe(false);
  expect(filmError({ title: 'Фильм', reason: '' })).toBeNull();
});
test('puzzle validation rejects partial and malformed results', () => {
  expect(isCipherSolution(CIPHER_LETTERS)).toBe(true); expect(isCipherSolution(CIPHER_LETTERS.slice(1))).toBe(false);
  expect(isCrosswordSolution(crosswordSolution)).toBe(true); expect(isCrosswordSolution({ ...crosswordSolution, '0:2': '' })).toBe(false);
  expect(isPairDeck(createPairDeck())).toBe(true); expect(isPairsSolution(pairIds)).toBe(true); expect(isPairsSolution([0, 0, 1, 2, 3, 4, 5, 6])).toBe(false);
  expect(new Set(shuffleTarotDeck()).size).toBe(78); for (const id of [-1, 78, 1.2, '1', null]) expect(isTarotCardId(id)).toBe(false);
  expect(isNonogramSolution(solvedNonogram)).toBe(true); expect(isNonogramSolution(solvedNonogram.slice(1))).toBe(false);
});
