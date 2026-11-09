export const CIPHER_ANSWER = 'спортивная сумка'
export const CIPHER_LETTERS = [...CIPHER_ANSWER.replace(/\s/g, '')]

/** Compare every cell; never expose which position differs. */
export function isCipherSolution(letters: readonly string[]): boolean {
  return letters.length === CIPHER_LETTERS.length && letters.every((letter, index) =>
    /^[а-яё]$/iu.test(letter) && letter.toLocaleLowerCase('ru-RU') === CIPHER_LETTERS[index],
  )
}

export function cipherLettersFromText(text: string): string[] {
  return [...text.normalize('NFC').toLocaleLowerCase('ru-RU').replace(/[^а-яё]/gu, '')]
}
