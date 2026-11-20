import { describe, expect, it } from 'vitest';
import { chooseGuidingStar, createGuidingStarProgress, guidingStarPhase, restoreGuidingStarProgress, serializeGuidingStarProgress } from '../src/utils/guiding-star';

const ids = Array.from({ length: 24 }, (_, index) => `star-${index + 1}`);

describe('individual guiding-star search', () => {
  it('recomputes a stable personal threshold without saving it locally', () => {
    const values = Array.from({ length: 100 }, (_, index) => createGuidingStarProgress(`user-${index}:20`, ids.length).requiredClicks);
    expect(values.every(value => Number.isInteger(value) && value >= 1 && value <= ids.length)).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(20);
    expect(createGuidingStarProgress('user-42:20', ids.length)).toEqual(createGuidingStarProgress('user-42:20', ids.length));
    expect(() => createGuidingStarProgress('user', 0)).toThrow();
  });

  it('counts only distinct valid star selections', () => {
    const initial = { requiredClicks: 4, checkedStars: [] };
    const selected = chooseGuidingStar(initial, ids[0]!, ids);
    expect(selected.checkedStars).toEqual([ids[0]]);
    expect(chooseGuidingStar(selected, ids[0]!, ids)).toBe(selected);
    expect(chooseGuidingStar(selected, 'unknown', ids)).toBe(selected);
  });

  it.each([1, 3, 10])('finds the star after the personal threshold of %s clicks', threshold => {
    let progress = { requiredClicks: threshold, checkedStars: [] as string[] };
    for (let index = 0; index < threshold; index++) {
      expect(guidingStarPhase(progress)).toBe('searching');
      progress = chooseGuidingStar(progress, ids[index]!, ids);
    }
    expect(guidingStarPhase(progress)).toBe('found');
    expect(chooseGuidingStar(progress, ids[12]!, ids)).toBe(progress);
  });

  it('ends the search after ten unsuccessful attempts', () => {
    let progress = { requiredClicks: ids.length, checkedStars: [] as string[] };
    for (const id of ids.slice(0, 10)) progress = chooseGuidingStar(progress, id, ids);
    expect(guidingStarPhase(progress)).toBe('exhausted');
    expect(chooseGuidingStar(progress, ids[10]!, ids)).toBe(progress);
  });

  it('stores only the attempt count and selected stars, and restores the threshold from identity', () => {
    const progress = { requiredClicks: 2, checkedStars: ids.slice(0, 2) };
    const raw = serializeGuidingStarProgress(progress);
    expect(JSON.parse(raw)).toEqual({ attempts: 2, checkedStars: ids.slice(0, 2) });
    expect(restoreGuidingStarProgress(raw, 'user', ids)).toEqual({
      ...createGuidingStarProgress('user', ids.length), checkedStars: ids.slice(0, 2),
    });
  });

  it('migrates old selections without trusting a local result or threshold', () => {
    const raw = JSON.stringify({ requiredClicks: 1, checkedStars: [ids[0]], wishMade: true });
    const progress = restoreGuidingStarProgress(raw, 'user', ids);
    expect(progress).toEqual({ ...createGuidingStarProgress('user', ids.length), checkedStars: [ids[0]] });
    expect(JSON.parse(serializeGuidingStarProgress(progress))).toEqual({ attempts: 1, checkedStars: [ids[0]] });
  });

  it.each(['broken', 'null', '{}', '{"attempts":-1,"checkedStars":[]}',
    '{"attempts":1,"checkedStars":["unknown"]}',
    '{"attempts":2,"checkedStars":["star-1","star-1"]}',
    '{"attempts":1,"checkedStars":[]}',
    JSON.stringify({ attempts: 11, checkedStars: ids.slice(0, 11) }),
  ])('recovers from invalid local data: %s', raw => {
    expect(restoreGuidingStarProgress(raw, 'user', ids)).toEqual(createGuidingStarProgress('user', ids.length));
  });
});
