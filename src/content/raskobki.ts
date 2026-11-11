const answers = {
  medicine: ['препарат', 'препараты', 'препаратов'],
  tirzepatide: ['тирзепатид', 'тирзепатида'],
  uzbekistan: ['Узбекистан', 'Узбекистане'],
  azerbaijan: ['Азербайджан', 'Азербайджане'],
  belarus: ['Беларусь', 'Беларуси', 'Белоруссия', 'Белоруссии'],
  semaglutide: ['семаглутид', 'семаглутида'],
  venezuela: ['Венесуэла', 'Венесуэлы', 'Венесуэле'],
  ecuador: ['Эквадор', 'Эквадора', 'Эквадоре'],
  certificate: ['Работодатель нового поколения'],
  strategy: ['2030', '2030 год', '2030 года'],
} as const;

export type RaskobkiAnswer = keyof typeof answers;

const slots = [
  { answer: 'medicine', text: 'препарат' },
  { answer: 'tirzepatide', text: 'тирзепатида' },
  { answer: 'uzbekistan', text: 'Узбекистане' },
  { answer: 'azerbaijan', text: 'Азербайджане' },
  { answer: 'belarus', text: 'Беларуси' },
  { answer: 'semaglutide', text: 'семаглутида' },
  { answer: 'belarus', text: 'Беларуси' },
  { answer: 'venezuela', text: 'Венесуэлы' },
  { answer: 'ecuador', text: 'Эквадора' },
  { answer: 'certificate', text: 'Работодатель нового поколения' },
  { answer: 'strategy', text: '2030' },
] satisfies { answer: RaskobkiAnswer; text: string }[];

const letter = `Дорогие коллеги!

До Нового года — считанные дни, и в воздухе уже витает волшебство. Чувствуете? Вот и я спешу поздравить вас с наступающим.

Для нас этот год особенный: компании исполнилось 25 лет. За четверть века мы вместе прошли огромный путь: от первых [синоним слова лекарство]ов до компании, которая выводит Россию в лидеры по продолжительности активной жизни.

Событий в 2026 году накопилось много — и всё это благодаря вам. Седжаро стал первым препаратом на основе [действующее вещество Седжаро] в [стране, где Седжаро зарегистрировали в сентябре 2026 года] и [в этой стране Седжаро стал первым препаратом тирзепатида в форме шприц-ручки] и был зарегистрирован в [стране, куда россияне ездят без загранпаспорта]. Семавик укрепил лидерство на российском рынке [действующее вещество Семавика] и вышел на рынок [стране, куда россияне ездят без загранпаспорта] , [страна, где ГЕРОФАРМ с 2019 года является единственным поставщиком инсулинов для государственного сектора здравоохранения] и [страна, где Семавик продаётся под названием Somerix] . А ещё ГЕРОФАРМ стал первой фармацевтической компанией России, сертифицированной как «[сертификация Changellenge для молодых сотрудников]». Неплохой получился год, правда?

Но главное — впереди. Я горжусь тем, как наша команда умеет расти и учиться. Нас ждёт Стратегия до [год, до которого рассчитана Стратегия ГЕРОФАРМ] года, и я знаю: мы не просто достигнем целей — мы сами определим, насколько высоко сможем подняться.

Загадывайте самые смелые желания. А воплощать их будем вместе.

С наступающим Новым годом!
Пётр Родионов`;

let slotIndex = 0;
export const raskobkiLetter = letter.split('\n\n').map(paragraph =>
  paragraph.split(/(\[[^\]]+\])/u).map(text => ({
    text,
    slot: text.startsWith('[') ? slots[slotIndex++] : undefined,
  })),
);

export const raskobkiSlots = slots;

function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ru-RU').replaceAll('ё', 'е')
    .trim().replace(/^[«"'„“]+|[»"'”.,!?]+$/gu, '').trim().replace(/\s+/gu, ' ');
}

export function findRaskobkiAnswer(guess: string): RaskobkiAnswer | undefined {
  const value = normalize(guess);
  return (Object.keys(answers) as RaskobkiAnswer[]).find(key =>
    answers[key].some(answer => normalize(answer) === value),
  );
}

export function isRaskobkiSolution(solved: readonly RaskobkiAnswer[]) {
  return raskobkiSlots.every(slot => solved.includes(slot.answer));
}
