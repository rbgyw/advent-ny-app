import { describe, expect, it } from 'vitest';
import { chooseGuidingStar, createGuidingStarProgress, guidingStarPhase, restoreGuidingStarProgress, serializeGuidingStarProgress } from '../src/utils/guiding-star';
import { guidingStars } from '../src/content/guiding-star';

const ids = guidingStars.map(star => star.id);
const target = ids[2]!;
const misses = ids.filter(id => id !== target);

describe('individual guiding-star search', () => {
  it('chooses a stable actual star ID per user, varying the target between users', () => {
    const values = Array.from({ length: 100 }, (_, index) => createGuidingStarProgress(`user-${index}:20`, ids).targetStarId);
    expect(values.every(value => ids.includes(value as typeof ids[number]))).toBe(true);
    expect(new Set(values).size).toBeGreaterThan(20);
    expect(createGuidingStarProgress('user-42:20', ids)).toEqual(createGuidingStarProgress('user-42:20', ids));
    expect(() => createGuidingStarProgress('user', [])).toThrow();
  });

  it('counts only distinct valid star selections', () => {
    const initial = { targetStarId: target, checkedStars: [] };
    const selected = chooseGuidingStar(initial, misses[0]!, ids);
    expect(selected.checkedStars).toEqual([misses[0]]);
    expect(chooseGuidingStar(selected, misses[0]!, ids)).toBe(selected);
    expect(chooseGuidingStar(selected, 'unknown', ids)).toBe(selected);
    expect(guidingStarPhase(selected)).toBe('searching');
  });

  it.each([1, 3, 10])('finds the target star when selected on attempt %s', attempt => {
    let progress = { targetStarId: target, checkedStars: [] as string[] };
    for (const id of misses.slice(0, attempt - 1)) {
      progress = chooseGuidingStar(progress, id, ids);
      expect(guidingStarPhase(progress)).toBe('searching');
    }
    progress = chooseGuidingStar(progress, target, ids);
    expect(guidingStarPhase(progress)).toBe('found');
    expect(chooseGuidingStar(progress, misses[12]!, ids)).toBe(progress);
  });

  it('allows the same user to succeed or fail depending on the stars they choose', () => {
    const initial = createGuidingStarProgress('same-user:20', ids);
    expect(guidingStarPhase(chooseGuidingStar(initial, initial.targetStarId, ids))).toBe('found');
    let progress = initial;
    for (const id of ids.filter(id => id !== initial.targetStarId).slice(0, 10)) progress = chooseGuidingStar(progress, id, ids);
    expect(guidingStarPhase(progress)).toBe('exhausted');
    expect(chooseGuidingStar(progress, initial.targetStarId, ids)).toBe(progress);
  });

  it('stores only attempts and selections and restores the same target from identity', () => {
    const progress = { ...createGuidingStarProgress('user', ids), checkedStars: misses.slice(0, 2) };
    const raw = serializeGuidingStarProgress(progress);
    expect(JSON.parse(raw)).toEqual({ attempts: 2, checkedStars: misses.slice(0, 2) });
    expect(restoreGuidingStarProgress(raw, 'user', ids)).toEqual(progress);
  });

  it('ignores a legacy local result, click threshold or forged target', () => {
    const raw = JSON.stringify({ requiredClicks: 1, targetStarId: 'fake', checkedStars: [ids[0]], wishMade: true });
    const progress = restoreGuidingStarProgress(raw, 'user', ids);
    expect(progress).toEqual({ ...createGuidingStarProgress('user', ids), checkedStars: [ids[0]] });
    expect(JSON.parse(serializeGuidingStarProgress(progress))).toEqual({ attempts: 1, checkedStars: [ids[0]] });
  });

  it.each(['broken', 'null', '{}', '{"attempts":-1,"checkedStars":[]}',
    '{"attempts":1,"checkedStars":["unknown"]}',
    '{"attempts":2,"checkedStars":["star-01","star-01"]}',
    '{"attempts":1,"checkedStars":[]}',
    JSON.stringify({ attempts: 11, checkedStars: ids.slice(0, 11) }),
  ])('recovers from invalid local data: %s', raw => {
    expect(restoreGuidingStarProgress(raw, 'user', ids)).toEqual(createGuidingStarProgress('user', ids));
  });
});
