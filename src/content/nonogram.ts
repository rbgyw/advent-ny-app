export const nonogramSize = 10;

export const unmarked = 0;
export const filled = 1;
export const crossed = 2;
export type CellMark = typeof unmarked | typeof filled | typeof crossed;
export type MarkingTool = typeof filled | typeof crossed;

const picture = [
  '......####',
  '......#..#',
  '......#..#',
  '.....##..#',
  '...###...#',
  '####.....#',
  '#........#',
  '##########',
  '.#......#.',
  '##########',
];

function cluesFor(line: string) {
  return Array.from(line.matchAll(/#+/g), group => group[0].length);
}

export const rowClues = picture.map(cluesFor);
export const columnClues = Array.from({ length: nonogramSize }, (_, column) =>
  cluesFor(picture.map(row => row[column]).join('')),
);
export const solvedNonogram = [...picture.join('')].map(cell => cell === '#' ? filled : unmarked);

// Derived marks never overwrite the user's draft. Editing a completed line
// withdraws its automatic crosses unless another completed line still supplies them.
export function withCompletedLineCrosses(cells: readonly CellMark[]): CellMark[] {
  const result = [...cells];
  for (let line = 0; line < nonogramSize; line++) {
    const row = Array.from({ length: nonogramSize }, (_, col) => line * nonogramSize + col);
    const column = Array.from({ length: nonogramSize }, (_, row) => row * nonogramSize + line);
    for (const indexes of [row, column]) {
      if (!indexes.every(index => (cells[index] === filled) === (solvedNonogram[index] === filled))) continue;
      for (const index of indexes) if (result[index] === unmarked) result[index] = crossed;
    }
  }
  return result;
}

export function isNonogramSolution(cells: readonly CellMark[]) {
  return cells.length === solvedNonogram.length && solvedNonogram.every((expected, index) =>
    expected === filled ? cells[index] === filled : cells[index] === unmarked || cells[index] === crossed,
  );
}
