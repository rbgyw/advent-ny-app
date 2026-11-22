import { test, expect } from '@playwright/test';
import { mockBackend, taskIdAtPosition } from './fixture';
test('slow initial request is shared across a task-to-calendar transition', async ({ page }) => {
  const backend = await mockBackend(page, { delay: 200 });
  await page.goto('/task/9');
  await page.getByRole('button', { name: /Назад к календарю|К календарю/ }).first().click();
  await expect(page.locator('.calendar-window').nth(0)).toBeEnabled();
  expect(backend.calls.filter(path => path.endsWith('/initialize_user_calendar'))).toHaveLength(1);
});
test('calendar failure retries without losing navigation', async ({ page }) => {
  const backend = await mockBackend(page, { failCalendar: true });
  await page.goto('/calendar'); await expect(page.getByRole('alert')).toBeVisible();
  backend.options.failCalendar = false;
  await page.getByRole('button', { name: 'Попробовать ещё раз' }).click();
  await expect(page.locator('.calendar-window').nth(0)).toBeEnabled();
});
test('film submits through the native form, closes with Escape and restores focus', async ({ page }) => {
  const backend = await mockBackend(page);
  await page.goto('/task/12');
  await page.getByLabel('Название фильма').fill('Мой фильм');
  const submit = page.getByRole('button', { name: 'Посоветовать фильм', exact: true });
  await submit.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(backend.responses[12]).toEqual({ title: 'Мой фильм', reason: '' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(submit).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
});
test('locked assignments never expose interactive task content', async ({ page }) => {
  await mockBackend(page);
  await page.route('**/rest/v1/tasks?*', route => route.fulfill({ json: [] }));
  await page.goto('/task/25');
  await expect(page.getByText(/Задание откроется|Задание пока закрыто/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Открыть печеньку' })).toHaveCount(0);
});
test('logout clears session while calendar requests are pending', async ({ page }) => {
  await mockBackend(page, { delay: 200 });
  await page.goto('/calendar');
  await page.locator('.calendar-menu summary').click();
  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
  await page.goto('/task/9');
  await expect(page).toHaveURL(/\/auth/);
});
test('generic fallback tasks save and reopen their own response', async ({ page }) => {
  const backend = await mockBackend(page, { genericTasks: true });
  for (const day of [7, 9, 10, 15, 16, 17, 18, 19, 20, 22, 23, 24]) {
    await page.goto(`/task/${day}`);
    await page.locator('textarea').fill(`Ответ ${day}`);
    await page.getByRole('button', { name: 'Завершить задание', exact: true }).click();
    await expect(page.getByText('Задание выполнено!', { exact: true })).toBeVisible();
    await page.reload(); await expect(page.locator('textarea')).toHaveValue(`Ответ ${day}`);
    expect(backend.responses[taskIdAtPosition(day)]).toEqual({ text: `Ответ ${day}` });
  }
});
