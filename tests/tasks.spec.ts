import { test, expect } from '@playwright/test';
import { mockBackend, userId } from './fixture';
import { CIPHER_LETTERS } from '../src/utils/cipher';
import { crosswordSolution } from '../src/utils/crossword';
import { initialPairDeck } from '../src/utils/pairs';
import { STEREOGRAM_LETTERS } from '../src/utils/stereogram';
import { solvedNonogram, filled } from '../src/content/nonogram';

test('cipher validates saves and reopens the confirmed result', async ({ page }) => {
  const backend = await mockBackend(page); await page.goto('/task/2');
  for (const [index, letter] of CIPHER_LETTERS.entries()) await page.locator(`#cipher-letter-${index}`).fill(letter);
  await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(backend.responses[2]).toEqual({ solved: true });
  await page.reload(); await expect(page.locator('#cipher-letter-0')).toHaveValue(CIPHER_LETTERS[0]!);
});
test('the October memory assignment accepts the story and confirms completion', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-22T12:00:00Z'));
  const backend = await mockBackend(page, { dateAtPosition: () => '2026-10-03' });
  await page.goto('/task/3');
  await expect(page.locator('.memory-date')).toHaveText('3 ОКТЯБРЯ');
  await page.locator('#memory-answer').fill('Наше воспоминание');
  await page.locator('#memory-author').fill('Тестовый автор');
  await page.getByRole('button', { name: 'Поделиться историей', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(backend.responses[3]).toEqual({ text: 'Наше воспоминание', author: 'Тестовый автор' });
});
test('a missing memory card with a past opening date can be fetched again', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-22T12:00:00Z'));
  const hiddenTasks = new Set([3]);
  await mockBackend(page, { hiddenTasks, dateAtPosition: () => '2026-10-03' });
  await page.goto('/task/3');
  await expect(page.getByText('Дата открытия уже наступила. Не удалось получить задание.')).toBeVisible();
  await expect(page.locator('#memory-answer')).toHaveCount(0);
  hiddenTasks.delete(3);
  await page.getByRole('button', { name: 'Обновить задание' }).click();
  await expect(page.locator('#memory-answer')).toBeEditable();
});
test('crossword restores a local draft and saves only the solved flag', async ({ page }) => {
  const backend = await mockBackend(page);
  await page.addInitScript(({ userId, solution }) => sessionStorage.setItem(`advent-crossword-v1:${userId}:4`, JSON.stringify(solution)), { userId, solution: crosswordSolution });
  await page.goto('/task/4'); await page.getByRole('button', { name: 'Проверить кроссворд', exact: true }).click();
  await expect.poll(() => backend.completed.has(4)).toBe(true); expect(backend.responses[4]).toEqual({ solved: true });
});
test('pairs complete all eight matches while keeping the existing turn animation', async ({ page }) => {
  const backend = await mockBackend(page);
  await page.addInitScript(({ userId, deck }) => sessionStorage.setItem(`advent-pairs-v1:${userId}:5`, JSON.stringify({ deck, matched: [], moves: 0 })), { userId, deck: initialPairDeck });
  await page.goto('/task/5');
  for (let id = 0; id < 8; id++) {
    const indexes = initialPairDeck.flatMap((value, index) => value === id ? [index] : []);
    await page.locator('.pair-card').nth(indexes[0]!).click(); await page.locator('.pair-card').nth(indexes[1]!).click();
  }
  await expect.poll(() => backend.completed.has(5)).toBe(true); expect(backend.responses[5]).toEqual({ solved: true });
});
test('tarot claims one card and restores it without drawing again', async ({ page }) => {
  const backend = await mockBackend(page); await page.goto('/task/6');
  await page.getByRole('button', { name: /Вытащить карту/ }).click();
  await page.locator('.tarot-deck-card').first().click();
  await expect(page.locator('.tarot-result')).toBeVisible();
  await expect.poll(() => page.locator('.tarot-chosen-image').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  const card = backend.responses[6]?.card_id; expect(typeof card).toBe('number');
  await page.locator('.tarot-header .tarot-back').click(); await page.locator('.calendar-window').nth(5).click();
  await expect(page.locator('.tarot-result')).toBeVisible();
  expect(backend.calls.filter(path => path.endsWith('/claim_tarot_card'))).toHaveLength(1);
});
test('gratitude uses a local function fixture and never sends real mail', async ({ page }) => {
  await mockBackend(page); let payload: Record<string, unknown> | undefined;
  await page.route('**/functions/v1/send-gratitude', async route => { payload = route.request().postDataJSON(); await route.fulfill({ json: { sent: true } }); });
  await page.goto('/task/8'); await page.getByLabel('От кого', { exact: true }).fill('Тестовый отправитель');
  await page.getByLabel('Кому', { exact: true }).fill('colleague@geropharm.com'); await page.getByLabel('Ваша благодарность').fill('Спасибо за помощь');
  await page.getByRole('button', { name: 'Отправить благодарность', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); expect(payload?.taskId).toBe(8); expect(payload?.requestId).toBeTruthy();
});
test('stereogram accepts СЕРДЦЕ in six cells and persists only completion', async ({ page }) => {
  const backend = await mockBackend(page); await page.goto('/task/11');
  const inputs = page.locator('.stereo-cell input');
  await expect(inputs).toHaveCount(6);
  expect(STEREOGRAM_LETTERS.join('')).toBe('сердце');
  for (const [index, letter] of STEREOGRAM_LETTERS.entries()) await inputs.nth(index).fill(letter);
  await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
  await expect.poll(() => backend.completed.has(11)).toBe(true); expect(backend.responses[11]).toEqual({ solved: true });
});
test('wish hides snow on confirmation and keeps it off on the saved screen', async ({ page }) => {
  const backend = await mockBackend(page);
  let release!: () => void;
  const saveGate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/rest/v1/rpc/save_task_progress', async route => {
    await saveGate;
    await route.fallback();
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/task/13');
  await page.getByRole('button', { name: 'Впустить волшебство', exact: true }).click();
  await expect(page.locator('.wish-snow')).toBeVisible();
  try {
    await page.getByRole('button', { name: 'Желание загадано', exact: true }).click();
    await expect(page.locator('main')).toHaveAttribute('data-stage', 'wishing');
    await expect(page.locator('.wish-snow')).toHaveCount(0);
  } finally {
    release();
  }
  await expect(page.locator('main')).toHaveAttribute('data-stage', 'accepted');
  await expect(page.locator('.wish-snow')).toHaveCount(0);
  expect(backend.responses[13]).toEqual({ wish_made: true });
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('data-stage', 'accepted');
  await expect(page.locator('.wish-snow')).toHaveCount(0);
});
test('raskobki reveals the nested clue and saves the new solution', async ({ page }) => {
  const backend = await mockBackend(page); await page.goto('/task/14');
  await page.getByLabel('Ваш ответ', { exact: true }).fill('технолог');
  await page.getByRole('button', { name: 'Вставить слово', exact: true }).click();
  await expect(page.getByText('Пока не подходит.', { exact: false })).toBeVisible();
  for (const guess of ['ГЕРО', 'процесс', 'технолог', 'лидер', 'актив']) {
    await page.getByLabel('Ваш ответ', { exact: true }).fill(guess); await page.getByRole('button', { name: 'Вставить слово', exact: true }).click();
  }
  await expect.poll(() => backend.completed.has(14)).toBe(true); expect(backend.responses[14]).toEqual({ solved: true });
  await expect(page.locator('.raskobki-letter')).toContainText('ГЕРОФАРМ — биотехнологическая компания');
});
test('nonogram paints the solution with native keyboard controls and saves', async ({ page }) => {
  const backend = await mockBackend(page); await page.goto('/task/21');
  await expect(page.locator('.nonogram-board')).toBeVisible();
  for (const [index, mark] of solvedNonogram.entries()) if (mark === filled) {
    await page.locator(`[data-cell-index="${index}"]`).focus(); await page.keyboard.press('Enter');
  }
  await page.getByRole('button', { name: 'Проверить кроссворд', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); expect(backend.responses[21]).toEqual({ solved: true });
});

test('the 10th window opens the word search and restores its prediction, and the 15th opens the pairs', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-22T12:00:00Z'));
  const backend = await mockBackend(page, { dateAtPosition: () => '2026-10-01' });
  await page.goto('/task/10');
  await expect(page.locator('[data-task-date]')).toHaveText('ОКОШКО 10 · 1 ОКТЯБРЯ');
  await expect(page.getByRole('heading', { name: 'Найдите свое предсказание на Новый год' })).toBeVisible();
  await page.getByLabel('Первое найденное слово').fill('Уют');
  await page.getByRole('button', { name: 'Сверить курс' }).click();
  await expect(page.getByRole('heading', { name: 'Ваше напутствие на 2027 год' })).toBeVisible();
  await expect(page.locator('.word-grid')).toHaveCount(0);
  expect(backend.responses[15]).toEqual({ word: 'уют' });
  await page.reload();
  await expect(page.getByText(/уют начинается с того/)).toBeVisible();
  await expect(page.getByLabel('Первое найденное слово')).toHaveCount(0);
  await page.goto('/task/15');
  await expect(page.locator('[data-task-date]')).toHaveText('ОКОШКО 15 · 1 ОКТЯБРЯ');
  await expect(page.getByRole('heading', { name: 'Кто здесь Дед Мороз?' })).toBeVisible();
});
