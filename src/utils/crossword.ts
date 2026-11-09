export type CrosswordValues = Record<string, string>;
export const crosswordWords = [
  { number: 1, direction: 'down', row: 0, col: 2, answer: 'КАРАНТИН', clue: 'Статус материалов, которые физически отделены от остальных, пока не решено, одобрить их или отклонить.' },
  { number: 2, direction: 'down', row: 0, col: 4, answer: 'БИОНАГРУЗКА', clue: 'Общее количество микроорганизмов, связанное с источником: персоналом, воздухом, поверхностями, сырьём. Первая часть слова: «био».' },
  { number: 3, direction: 'across', row: 1, col: 1, answer: 'КАЛИБРОВКА', clue: 'Проверка прибора по эталону: показывает, что он выдаёт результаты в допустимых пределах.' },
  { number: 4, direction: 'down', row: 2, col: 0, answer: 'ОТКЛОНЕНИЕ', clue: 'Отступление от утверждённой инструкции или документа.' },
  { number: 5, direction: 'across', row: 4, col: 0, answer: 'КОНТАМИНАЦИЯ', clue: 'Нежелательное попадание примесей или микроорганизмов в сырьё или продукцию при производстве, хранении, перевозке. Проще говоря, загрязнение, но слово научное.' },
  { number: 6, direction: 'down', row: 6, col: 11, answer: 'ИЗОЛЯТОР', clue: 'Закрытое оборудование, которое безопасно отделяет рабочую зону с чистотой класса А от воздуха помещения и персонала.' },
  { number: 7, direction: 'down', row: 8, col: 7, answer: 'ПОДПИСЬ', clue: 'Личный знак человека, выполнившего действие или проверку: рукописный, в виде инициалов или защищённый электронный.' },
  { number: 8, direction: 'across', row: 10, col: 3, answer: 'ВАЛИДАЦИЯ', clue: 'Документально оформленные действия, которые дают высокую уверенность, что процесс, методика или система стабильно приводят к результату, соответствующему заранее заданным требованиям. Начинается на «В».' },
  { number: 9, direction: 'across', row: 13, col: 9, answer: 'ТАРА', clue: 'Изделие, элемент упаковки, в который помещают продукцию.' },
  { number: 10, direction: 'across', row: 14, col: 1, answer: 'ПРИМЕСЬ', clue: 'Любой компонент в продукции, присутствие которого нежелательно.' },
] as const;
export type CrosswordWord = typeof crosswordWords[number];
export function normalizeCrossword(value: string): string {
  return value.toLocaleUpperCase('ru-RU').replace(/Ё/g, 'Е').replace(/[^А-Я]/g, '');
}
export function wordKeys(word: CrosswordWord): string[] {
  return Array.from(word.answer, (_, i) => `${word.row + (word.direction === 'down' ? i : 0)}:${word.col + (word.direction === 'across' ? i : 0)}`);
}
const cells = new Map<string, { key: string; row: number; col: number; answer: string; words: number[]; number?: number }>();
for (const word of crosswordWords) {
  wordKeys(word).forEach((key, index) => {
    const existing = cells.get(key);
    if (existing && existing.answer !== word.answer[index]) throw new Error(`Crossword intersection mismatch: ${key}`);
    if (existing) existing.words.push(word.number);
    else cells.set(key, { key, row: Number(key.split(':')[0]), col: Number(key.split(':')[1]), answer: word.answer[index]!, words: [word.number] });
    if (index === 0) cells.get(key)!.number = word.number;
  });
}
export const crosswordCells = [...cells.values()].sort((a, b) => a.row - b.row || a.col - b.col);
export const crosswordSolution: CrosswordValues = Object.fromEntries(crosswordCells.map(cell => [cell.key, cell.answer]));
export function isCrosswordSolution(values: Readonly<CrosswordValues>): boolean {
  return crosswordCells.every(cell => normalizeCrossword(values[cell.key] ?? '') === cell.answer);
}
