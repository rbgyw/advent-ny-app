import { describe, expect, it } from 'vitest';
import { freshSearch, isSearchHit, remainingSearchSeconds, restoreSearch, settleSearch, startSearch } from '../src/utils/podzhik';
import { podzhikBounds, podzhikTarget } from '../src/content/podzhik';

describe('Podzhik local progress', () => {
  it('starts with five attempts and an absolute 60-second deadline', () => {
    const initial = freshSearch();
    expect(initial).toEqual({ attemptsLeft: 5, deadline: null, found: false });
    const started = startSearch(initial, 1000);
    expect(started.deadline).toBe(61_000);
    expect(remainingSearchSeconds(started, 1000)).toBe(60);
    expect(startSearch(started, 10_000)).toBe(started);
  });

  it('restores a running deadline without adding time', () => {
    const saved = JSON.stringify(startSearch(freshSearch(), 1000));
    const restored = restoreSearch(saved, 21_500);
    expect(remainingSearchSeconds(restored, 21_500)).toBe(40);
    expect(restored.attemptsLeft).toBe(5);
  });

  it('consumes an expired attempt exactly once, including after a long absence', () => {
    const started = startSearch(freshSearch(), 0);
    const expired = settleSearch(started, 3_600_000);
    expect(expired).toEqual({ attemptsLeft: 4, deadline: null, found: false });
    expect(settleSearch(expired, 3_700_000)).toBe(expired);
    expect(restoreSearch(JSON.stringify(expired), 3_800_000)).toEqual(expired);
  });

  it('exhausts exactly five rounds and refuses a sixth', () => {
    let progress = freshSearch();
    for (let round = 0; round < 5; round++) {
      progress = settleSearch(startSearch(progress, round * 60_000), (round + 1) * 60_000);
    }
    expect(progress.attemptsLeft).toBe(0);
    expect(startSearch(progress, 1_000_000)).toBe(progress);
  });

  it('keeps a found result available for retrying the DB save', () => {
    const found = { attemptsLeft: 2, deadline: null, found: true };
    expect(restoreSearch(JSON.stringify(found), 2_000_000)).toEqual(found);
    expect(startSearch(found, 2_000_000)).toBe(found);
  });

  it.each(['invalid', '{}', 'null', '[]', '{"attemptsLeft":6,"deadline":null,"found":false}',
    '{"attemptsLeft":1.5,"deadline":null,"found":false}', '{"attemptsLeft":0,"deadline":2000,"found":false}',
    '{"attemptsLeft":5,"deadline":1000000,"found":false}'])('handles invalid stored data: %s', raw => {
    expect(restoreSearch(raw, 1000)).toEqual(freshSearch());
  });
});

describe('30 px circular hit area in the 4096 × 3102 panorama', () => {
  const point = (x: number, y: number) => ({ x: x / 4096, y: y / 3102 });
  it('uses the supplied distance from the bottom and centers the character there', () => {
    expect(podzhikTarget).toEqual({ x: 1200, y: 2640, radius: 30, width: 4096, height: 3102 });
    expect(isSearchHit(point(1200, 2640), podzhikTarget)).toBe(true);
    expect((podzhikBounds.left + podzhikBounds.right) / 2).toBeCloseTo(1200 / 4096);
    expect((podzhikBounds.top + podzhikBounds.bottom) / 2).toBeCloseTo(1 - 462 / 3102);
  });
  it.each([[1230, 2640], [1170, 2640], [1200, 2670], [1200, 2610], [1218, 2664]])('accepts the radius boundary at (%s, %s)', (x, y) => {
    expect(isSearchHit(point(x, y), podzhikTarget)).toBe(true);
  });
  it.each([[1230.01, 2640], [1200, 2670.01], [1222, 2662], [192, 511]])('rejects points outside the circle at (%s, %s)', (x, y) => {
    expect(isSearchHit(point(x, y), podzhikTarget)).toBe(false);
  });
  it.each([0.075, .25, 0.75, 1, 1.5, 2, 3, 6])('keeps the same acceptance area at display scale %s', scale => {
    const selected = { x: (1210 * scale) / (4096 * scale), y: (2650 * scale) / (3102 * scale) };
    expect(isSearchHit(selected, podzhikTarget)).toBe(true);
  });
  it('rejects distant clicks and invalid coordinates', () => {
    expect(isSearchHit({ x: 0.1, y: 0.1 }, podzhikTarget)).toBe(false);
    expect(isSearchHit({ x: NaN, y: 0.6 }, podzhikTarget)).toBe(false);
    expect(isSearchHit({ x: -0.1, y: 0.6 }, podzhikTarget)).toBe(false);
  });
});
