import { expect, it } from 'vitest';
import { isMurdokuSolution, murdokuCandidates, murdokuPeople, type MurdokuPositions } from '../src/utils/murdoku';

it('finds exactly the two valid arrangements from every clue, row, column and equipment constraint', () => {
  const solutions: MurdokuPositions[] = [];
  function visit(positions: MurdokuPositions, index: number) {
    const person = murdokuPeople[index];
    if (!person) {
      if (isMurdokuSolution(positions, 'natalya')) solutions.push({ ...positions });
      return;
    }
    for (const cell of murdokuCandidates(person)) visit({ ...positions, [person]: cell }, index + 1);
  }
  visit({}, 0);
  expect(solutions).toEqual([
    { mark: 6, oleg: 10, polina: 14, roman: 22, dmitry: 30, natalya: 40, filipp: 46 },
    { mark: 6, oleg: 11, polina: 14, roman: 22, dmitry: 30, natalya: 40, filipp: 45 },
  ]);
  expect(isMurdokuSolution(solutions[0]!, 'oleg')).toBe(false);
  expect(isMurdokuSolution({ ...solutions[0], roman: 23 }, 'natalya')).toBe(false);
});
