import { describe, expect, it } from 'vitest';
import { crossed, filled, nonogramSize, solvedNonogram, unmarked, withCompletedLineCrosses, type CellMark } from '../src/content/nonogram';

const empty = () => Array<CellMark>(nonogramSize ** 2).fill(unmarked);

describe('completed nonogram lines', () => {
  it('crosses the remaining cells of a correct row without changing the draft', () => {
    const cells = empty();
    for (const index of [6, 7, 8, 9]) cells[index] = filled;
    const result = withCompletedLineCrosses(cells);
    expect(result.slice(0, 10)).toEqual([crossed, crossed, crossed, crossed, crossed, crossed, filled, filled, filled, filled]);
    expect(cells[0]).toBe(unmarked);
  });
  it('crosses a correct column and leaves unfinished neighboring lines alone', () => {
    const cells = empty();
    for (const row of [5, 6, 7, 9]) cells[row * 10] = filled;
    const result = withCompletedLineCrosses(cells);
    expect(Array.from({ length: 10 }, (_, row) => result[row * 10])).toEqual([crossed, crossed, crossed, crossed, crossed, filled, filled, filled, crossed, filled]);
    expect(result[1]).toBe(unmarked);
  });
  it('does not cross a misplaced group even when its length matches the clue', () => {
    const cells = empty();
    for (const index of [4, 5, 6, 7]) cells[index] = filled;
    expect(withCompletedLineCrosses(cells)).toEqual(cells);
  });
  it('withdraws derived crosses when the completed line is edited', () => {
    const cells = empty();
    for (const index of [6, 7, 8, 9]) cells[index] = filled;
    expect(withCompletedLineCrosses(cells)[0]).toBe(crossed);
    cells[6] = unmarked;
    expect(withCompletedLineCrosses(cells)[0]).toBe(unmarked);
  });
  it('keeps manual crosses and handles both completed axes', () => {
    const cells = [...solvedNonogram];
    cells[0] = crossed;
    const result = withCompletedLineCrosses(cells);
    expect(result.every((mark, index) => mark === (solvedNonogram[index] === filled ? filled : crossed))).toBe(true);
  });
});
