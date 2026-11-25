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
    expect(podzhikTarget).toEqual({ x: 2896, y: 2640, radius: 30, width: 4096, height: 3102 });
    expect(isSearchHit(point(2896, 2640), podzhikTarget)).toBe(true);
    expect(isSearchHit({ x: 1850 / 2617, y: 1672 / 1982 }, podzhikTarget, podzhikBounds)).toBe(true);
  });
  it.each([[2926, 2640], [2866, 2640], [2896, 2670], [2896, 2610], [2914, 2664]])('accepts the radius boundary at (%s, %s)', (x, y) => {
    expect(isSearchHit(point(x, y), podzhikTarget)).toBe(true);
  });
  it.each([[2926.01, 2640], [2896, 2670.01], [2918, 2662], [1200, 2640]])('rejects points outside the circle at (%s, %s)', (x, y) => {
    expect(isSearchHit(point(x, y), podzhikTarget)).toBe(false);
  });
  it.each([0.075, .25, 0.75, 1, 1.5, 2, 3, 6])('keeps the same acceptance area at display scale %s', scale => {
    const selected = { x: (2906 * scale) / (4096 * scale), y: (2650 * scale) / (3102 * scale) };
    expect(isSearchHit(selected, podzhikTarget)).toBe(true);
  });
  it('rejects distant clicks and invalid coordinates', () => {
    expect(isSearchHit({ x: 0.1, y: 0.1 }, podzhikTarget)).toBe(false);
    expect(isSearchHit({ x: NaN, y: 0.6 }, podzhikTarget)).toBe(false);
    expect(isSearchHit({ x: -0.1, y: 0.6 }, podzhikTarget)).toBe(false);
  });
});

it('accepts the embedded character from head to feet, with a 30px tolerance, and rejects the mirrored location', () => {
  for (const [x, y] of [[1850, 1655], [1847, 1680], [1849, 1712]]) {
    expect(isSearchHit({ x: x / 2617, y: y / 1982 }, podzhikTarget, podzhikBounds)).toBe(true);
  }
  expect(isSearchHit({ x: podzhikBounds.right + 30 / 4096, y: podzhikBounds.top }, podzhikTarget, podzhikBounds)).toBe(true);
  expect(isSearchHit({ x: podzhikBounds.right + 30.01 / 4096, y: podzhikBounds.top }, podzhikTarget, podzhikBounds)).toBe(false);
  expect(isSearchHit({ x: 1200 / 4096, y: 2640 / 3102 }, podzhikTarget, podzhikBounds)).toBe(false);
});
