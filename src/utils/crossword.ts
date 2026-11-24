export type CrosswordValues = Record<string, string>;
export const crosswordWords = [
  { number: 1, direction: 'down', row: 0, col: 2, answer: 'КАРАНТИН', clue: 'Статус сырья, упаковки или продукции, изолированной от основного производства до решения об одобрении или отбраковке' },
  { number: 2, direction: 'down', row: 0, col: 4, answer: 'БИОНАГРУЗКА', clue: 'Показатель количества микроорганизмов, поступающих от персонала, воздуха, поверхностей и сырья, до начала какой-либо обработки.' },
  { number: 3, direction: 'across', row: 1, col: 1, answer: 'КАЛИБРОВКА', clue: 'Процесс настройки измерительного прибора по эталону, чтобы его показания укладывались в допустимые пределы погрешности.' },
  { number: 4, direction: 'down', row: 2, col: 0, answer: 'ОТКЛОНЕНИЕ', clue: 'Несоответствие утвержденной инструкции, регламенту или норме' },
  { number: 5, direction: 'across', row: 4, col: 0, answer: 'КОНТАМИНАЦИЯ', clue: 'Нежелательное попадание примесей или микроорганизмов в сырье, продукцию или среду при производстве, хранении или перевозке.' },
  { number: 6, direction: 'down', row: 6, col: 11, answer: 'ИЗОЛЯТОР', clue: 'Закрытое оборудование, которое безопасно отделяет рабочую зону с чистотой класса A от воздуха помещения и персонала' },
  { number: 7, direction: 'down', row: 8, col: 7, answer: 'ПОДПИСЬ', clue: 'Обязательный реквизит документа, удостоверяющий, что проверку или действие выполнил конкретный человек; бывает в  рукописной, электронной  или в виде инициалов.' },
  { number: 8, direction: 'across', row: 10, col: 3, answer: 'ВАЛИДАЦИЯ', clue: 'Документально оформленные действия, которые дают высокую степень уверенности, что процесс, методика или система стабильно приводят к результату, соответствующему заранее заданным требованиям.' },
  { number: 9, direction: 'across', row: 13, col: 9, answer: 'ТАРА', clue: 'Изделие, предназначенное для размещения определённого количества лекарственного препарата, а также для его хранения, защиты и транспортировки, обеспечивающее сохранение качества и безопасности препарата в течение установленного срока годности.' },
  { number: 10, direction: 'across', row: 14, col: 1, answer: 'ПРИМЕСЬ', clue: 'Помимо действующего вещества и вспомогательных компонентов, в препарате может оказаться нечто, присутствие чего нежелательно. Как это называют?' },
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
