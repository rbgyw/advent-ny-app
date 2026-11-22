import predictions from './word-predictions.json';

export const wordSearchRows = [
  "КАРЬЕРАЕГВПЕРЕМЕНЫ",
  "БОБУЧЕНИЕДРУЮТБУЁЬ",
  "ЛНПИЖЮЪЕНООГЩЪАИМН",
  "АЧЕЗЛПГНЬХЕАНПЛШЦЭ",
  "ГМРОНРМЖХНКРПУАШЭН",
  "ОЪЕБЮОЛШЬОТМРТНЯСЕ",
  "ПЩЗИЮРФЮЛВЛОЕЕСЦЬР",
  "ОДАЛСЫЕЫЕЕЮНМШФЪЗГ",
  "ЛОГИПВЪЗГНБИИЕЮУРИ",
  "УСРЕОФЬПКИОЯЯСУЮЮЯ",
  "ЧТУАРЧЭВОЕВКСТФТЭЯ",
  "ИИЗЩТХИЗСИЬЖЧВЫХХС",
  "ЕЖКЁНЮОРТЧЮЖАИНРОО",
  "СЕАЁУДЙЪЬПФРСЕЦТТА",
  "ЕНЗЗДОРОВЬЕГТФЕЗДХ",
  "МИДОЯОТПУСККЬШЦЕЫМ",
  "ЬЕПАИТРАЁЬЗНЕУЖЬХХ",
  "ЯЗЮХКЧЧПЫЦИЭЪШЦПЬФ"
] as const;

export function normalizeWord(value: string) {
  return value.trim().toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
}

export function wordPrediction(value: string): string | undefined {
  const word = normalizeWord(value);
  return Object.hasOwn(predictions, word) ? predictions[word as keyof typeof predictions] : undefined;
}

export function findWord(value: string): number[] {
  const word = normalizeWord(value);
  if (!wordPrediction(word)) return [];
  const size = wordSearchRows.length;
  const rows = wordSearchRows.map(normalizeWord);
  for (let index = 0; index < size; index++) {
    const column = rows.map(row => row[index]).join('');
    const across = rows[index]!.indexOf(word);
    if (across >= 0) return Array.from(word, (_, offset) => index * size + across + offset);
    const down = column.indexOf(word);
    if (down >= 0) return Array.from(word, (_, offset) => (down + offset) * size + index);
  }
  return [];
}
