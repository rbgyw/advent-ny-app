export const raskobkiSlots = {
  gero: { word: 'ГЕРО', clue: 'Первые 4 буквы науки о здоровом долголетии — и названия компании-работодателя' },
  process: { word: 'процесс', clue: 'Последовательность действий для достижения результата' },
  technologist: { word: 'технолог', clue: 'Специалист, управляющий процессами на производстве' },
  leader: { word: 'лидер', clue: 'человек, который ведет за собой команду, принимает решения и вдохновляет личным примером' },
  asset: { word: 'актив', clue: 'В бухгалтерском балансе: статья, противостоящая пассиву' },
} as const;

export type RaskobkiAnswer = keyof typeof raskobkiSlots;
export const raskobkiAnswers = Object.keys(raskobkiSlots) as RaskobkiAnswer[];

function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ru-RU').replaceAll('ё', 'е')
    .trim().replace(/^[«"'„“]+|[»"'”.,!?]+$/gu, '').trim().replace(/\s+/gu, ' ');
}

export function findRaskobkiAnswer(guess: string): RaskobkiAnswer | undefined {
  const value = normalize(guess);
  return raskobkiAnswers.find(key => normalize(raskobkiSlots[key].word) === value);
}

export function isRaskobkiSolution(solved: readonly RaskobkiAnswer[]) {
  return raskobkiAnswers.every(answer => solved.includes(answer));
}
