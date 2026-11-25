export const murdokuPeople = ['mark', 'oleg', 'polina', 'roman', 'dmitry', 'natalya', 'filipp'] as const;
export type MurdokuPerson = typeof murdokuPeople[number];
export type MurdokuPositions = Partial<Record<MurdokuPerson, number>>;

export const murdokuEquipment: Record<number, string> = {
  7: 'Хроматограф', 15: 'Стерилизатор', 10: 'Лиофильная сушилка',
  19: 'Холодильная камера', 20: 'Ламинарный бокс', 30: 'Весовая ячейка',
  34: 'Ферментер', 48: 'Криохранилище для клеточных банков',
};
export function canOccupyMurdokuCell(cell: number): boolean {
  return Number.isInteger(cell) && cell >= 0 && cell < 49 && (!(cell in murdokuEquipment) || cell === 10 || cell === 30);
}
function zone(cell: number) {
  const row = Math.floor(cell / 7), col = cell % 7;
  return row < 4 ? col < 3 ? 'analytic' : col < 6 ? 'endocrine' : 'pharma' : col < 3 ? 'finished' : 'insulin';
}
function adjacent(a: number, b: number) {
  return a !== b && zone(a) === zone(b) && Math.abs(Math.floor(a / 7) - Math.floor(b / 7)) <= 1 && Math.abs(a % 7 - b % 7) <= 1;
}
export function murdokuCandidates(person: MurdokuPerson): number[] {
  return Array.from({ length: 49 }, (_, cell) => cell).filter(cell => {
    if (!canOccupyMurdokuCell(cell)) return false;
    switch (person) {
      case 'mark': return zone(cell) === 'pharma' && !adjacent(cell, 20);
      case 'oleg': return cell === 10 || adjacent(cell, 10);
      case 'polina': return adjacent(cell, 7) && adjacent(cell, 15);
      case 'roman': return zone(cell) === 'analytic';
      case 'dmitry': return cell === 30;
      case 'natalya': return adjacent(cell, 34) && adjacent(cell, 48);
      case 'filipp': return true;
    }
  });
}
export function isMurdokuSolution(positions: MurdokuPositions, suspect: string): boolean {
  if (!murdokuPeople.every(person => murdokuCandidates(person).includes(positions[person] ?? -1))) return false;
  const cells = murdokuPeople.map(person => positions[person]!);
  if (new Set(cells.map(cell => Math.floor(cell / 7))).size !== 7 || new Set(cells.map(cell => cell % 7)).size !== 7) return false;
  if (!adjacent(positions.roman!, positions.polina!)) return false;
  const witnesses = murdokuPeople.filter(person => person !== 'filipp' && zone(positions[person]!) === zone(positions.filipp!));
  return witnesses.length === 1 && witnesses[0] === suspect;
}
