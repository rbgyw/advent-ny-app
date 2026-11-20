import { describe, expect, it } from 'vitest';
import { chooseGuidingStar, createGuidingStarProgress, guidingStarPhase, makeGuidingStarWish, restoreGuidingStarProgress } from '../src/utils/guiding-star';

const ids = Array.from({ length: 27 }, (_, index) => `star-${index + 1}`);

describe('individual guiding-star search', () => {
  it('keeps the threshold stable for each user and varies it between users', () => {
    const values = Array.from({ length: 100 }, (_, index) => createGuidingStarProgress(`user-${index}:20`, 27).requiredClicks);
    expect(values.every(value => Number.isInteger(value) && value >= 1 && value <= 27)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(20);
    expect(createGuidingStarProgress('user-42:20', 27)).toEqual(createGuidingStarProgress('user-42:20', 27));
    expect(() => createGuidingStarProgress('user', 0)).toThrow();
  });

  it('counts only distinct valid star selections', () => {
    const initial = { requiredClicks: 4, checkedStars: [], wishMade: false };
    const selected = chooseGuidingStar(initial, ids[0]!, ids);
    expect(selected.checkedStars).toEqual([ids[0]]);
    expect(chooseGuidingStar(selected, ids[0]!, ids)).toBe(selected);
    expect(chooseGuidingStar(selected, 'unknown', ids)).toBe(selected);
  });

  it.each([1, 3, 10])('finds the star after the individual threshold of %s clicks', threshold => {
    let progress = { requiredClicks: threshold, checkedStars: [] as string[], wishMade: false };
    for (let index = 0; index < threshold; index++) {
      expect(guidingStarPhase(progress)).toBe('searching');
      progress = chooseGuidingStar(progress, ids[index]!, ids);
    }
    expect(guidingStarPhase(progress)).toBe('found');
    expect(chooseGuidingStar(progress, ids[12]!, ids)).toBe(progress);
  });

  it('ends the search after ten attempts when the threshold is higher', () => {
    let progress = { requiredClicks: 27, checkedStars: [] as string[], wishMade: false };
    for (const id of ids.slice(0, 10)) progress = chooseGuidingStar(progress, id, ids);
    expect(guidingStarPhase(progress)).toBe('exhausted');
    expect(chooseGuidingStar(progress, ids[10]!, ids)).toBe(progress);
    expect(makeGuidingStarWish(progress)).toBe(progress);
  });

  it('requires a found star before accepting a wish and accepts it once', () => {
    const initial = { requiredClicks: 1, checkedStars: [], wishMade: false };
    expect(makeGuidingStarWish(initial)).toBe(initial);
    const found = chooseGuidingStar(initial, ids[0]!, ids);
    const wished = makeGuidingStarWish(found);
    expect(wished.wishMade).toBe(true);
    expect(guidingStarPhase(wished)).toBe('wished');
    expect(makeGuidingStarWish(wished)).toBe(wished);
  });

  it.each([
    { requiredClicks: 8, checkedStars: ids.slice(0, 3), wishMade: false },
    { requiredClicks: 2, checkedStars: ids.slice(0, 2), wishMade: false },
    { requiredClicks: 2, checkedStars: ids.slice(0, 2), wishMade: true },
    { requiredClicks: 25, checkedStars: ids.slice(0, 10), wishMade: false },
  ])('restores searching, found, wished, and exhausted local progress: %j', progress => {
    expect(restoreGuidingStarProgress(JSON.stringify(progress), 'user', ids)).toEqual(progress);
  });

  it.each(['broken', 'null', '{}', '{"requiredClicks":28,"checkedStars":[],"wishMade":false}',
    '{"requiredClicks":2,"checkedStars":["unknown"],"wishMade":false}',
    '{"requiredClicks":2,"checkedStars":["star-1","star-1"],"wishMade":false}',
    '{"requiredClicks":2,"checkedStars":[],"wishMade":true}'])('recovers from invalid local data: %s', raw => {
    expect(restoreGuidingStarProgress(raw, 'user', ids)).toEqual(createGuidingStarProgress('user', ids.length));
  });
});
