import { test, expect } from '@playwright/test';
import { mockBackend } from './fixture';
test('public routes and guest guard', async ({ page }) => {
  const backend = await mockBackend(page, { authenticated: false });
  await page.goto('/'); await expect(page.getByRole('link', { name: 'Начать' })).toBeVisible();
  await page.screenshot({ path: '/tmp/advent-current-splash.png', fullPage: true });
  expect(backend.calls).toHaveLength(0);
  await page.goto('/rules'); await expect(page.getByRole('link', { name: 'Зарегистрироваться' })).toBeVisible();
  await page.goto('/calendar'); await expect(page).toHaveURL(/\/auth/); await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
});
test('all 25 task routes open and return', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await mockBackend(page);
  await page.goto('/calendar'); await expect(page.locator('.calendar-window')).toHaveCount(25);
  for (let day = 1; day <= 25; day++) {
    await page.goto(`/task/${day}`);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText('Задание не найдено.', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `/tmp/advent-current-task-${day}.png`, fullPage: true });
    await page.locator('main header button, main > button').first().click();
    await expect(page).toHaveURL(/\/calendar$/);
  }
  expect(errors).toEqual([]);
});
