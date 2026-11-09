export const STEREOGRAM_ANSWER = 'ценности';
export const STEREOGRAM_LETTERS = [...STEREOGRAM_ANSWER];

export function stereogramLetters(text: string): string[] {
  return [...text.normalize('NFC').toLocaleLowerCase('ru-RU').replace(/[^а-яё]/gu, '')];
}

export function isStereogramSolution(letters: readonly string[]): boolean {
  return letters.length === STEREOGRAM_LETTERS.length && letters.every((letter, index) =>
    /^[а-яё]$/iu.test(letter) && letter.toLocaleLowerCase('ru-RU') === STEREOGRAM_LETTERS[index]);
}
