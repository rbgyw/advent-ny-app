import { expect, test } from '@playwright/test';
import { mockBackend, userId } from './fixture';
import { guidingStars } from '../src/content/guiding-star';
import { createGuidingStarProgress } from '../src/utils/guiding-star';

for (const width of [393, 1440]) {
  test(`review marks are gray until server completion at ${width}px`, async ({ page }) => {
    const backend = await mockBackend(page);
    backend.responses[7] = { level: 'advanced', submitted_for_review: true };
    backend.responses[17] = { submitted_for_review: true };
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/calendar');
    for (const day of [7, 17]) {
      const window = page.locator('.calendar-window').nth(day - 1);
      await expect(window).toHaveAccessibleName(/На проверке/);
      await expect(window.locator('.calendar-review')).toHaveCSS('filter', 'grayscale(1)');
      await expect(window.locator('.calendar-completed')).toHaveCount(0);
      await window.click();
      await expect(page.getByText('На проверке', { exact: true })).toBeVisible();
      await page.goto('/calendar');
    }
    // Simulate the only authoritative transition: updated server assignments.
    backend.completed.add(7); backend.completed.add(17);
    await page.reload();
    for (const day of [7, 17]) {
      const window = page.locator('.calendar-window').nth(day - 1);
      await expect(window).toHaveAccessibleName(/Выполнено/);
      await expect(window.locator('.calendar-review')).toHaveCount(0);
      await expect(window.locator('.calendar-completed')).toHaveCount(1);
    }
    expect(backend.calls.some(path => path.endsWith('/save_task_progress'))).toBe(false);
  });
}

test('rules and task copy match the requested wording and emphasis', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/rules');
  await expect(page.locator('.rules-card strong').filter({ hasText: 'С 1 по 25 декабря' })).toHaveCSS('font-weight', '700');
  await page.goto('/task/3');
  await expect(page.locator('.crossword-rules li').nth(1)).toContainText('Введите загаданное слово в поле ответа и нажмите кнопку «Вставить в сетку».');
  await page.goto('/task/11');
  await expect(page.getByText('Это обязательное задание для получения приза.', { exact: true })).toHaveCSS('color', 'rgb(167, 40, 11)');
});

for (const reduced of [false, true]) {
  test(`wizard card moves to its country and lifts (reduced motion: ${reduced})`, async ({ page }) => {
    const backend = await mockBackend(page);
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto('/task/15');
    await expect(page.getByText('Когда расставите всё по местам, нажмите кнопку «Проверить пары».', { exact: true })).toBeVisible();
    const countries = page.locator('.frost-pairs > div').first();
    const wizards = page.locator('.frost-wizards');
    await countries.getByRole('button', { name: 'Азербайджан', exact: true }).click();
    await wizards.getByRole('button', { name: 'Шахта Баба (Şaxta Baba)', exact: true }).click();
    const paired = wizards.getByRole('button', { name: 'Шахта Баба (Şaxta Baba)', exact: true });
    await expect(wizards.getByRole('button').first()).toHaveText('Шахта Баба (Şaxta Baba)');
    if (reduced) await expect(paired).toHaveCSS('animation-name', 'none');
    else await expect(paired).toHaveCSS('animation-name', /^frost-card-lift(?:-[a-z0-9]+)?$/);
    expect(new Set(await wizards.getByRole('button').allTextContents()).size).toBe(4);
    for (const [country, wizard] of [['Казахстан', 'Аяз Ата (Ayaz Ata)'], ['Узбекистан', 'Корбобо (Qor Bobo)'], ['Венесуэла', 'Сан-Николас (San Nicolás)']]) {
      await countries.getByRole('button', { name: country, exact: true }).click();
      await wizards.getByRole('button', { name: wizard, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Проверить пары', exact: true }).click();
    await expect.poll(() => backend.completed.has(10)).toBe(true);
    expect(backend.responses[10]).toEqual({ solved: true });
  });

  test(`found star celebrates only the discovery (reduced motion: ${reduced})`, async ({ page }) => {
    const backend = await mockBackend(page);
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await page.goto('/task/20');
    const progress = createGuidingStarProgress(`${userId}:20`, guidingStars.map(star => star.id));
    await page.locator(`[data-star-id="${progress.targetStarId}"]`).click();
    await expect(page.getByRole('heading', { name: 'Ваша звезда найдена!' })).toBeVisible();
    const star = page.locator('.guiding-dialog-star');
    await expect(star).toHaveClass(/is-found/);
    if (reduced) await expect(star).toHaveCSS('animation-name', 'none');
    else await expect(star).toHaveCSS('animation-name', /^guiding-star-found(?:-[a-z0-9]+)?, guiding-star-glow(?:-[a-z0-9]+)?$/);
    expect(backend.completed.has(20)).toBe(false);
    await page.getByRole('button', { name: 'Загадать желание', exact: true }).click();
    await expect.poll(() => backend.completed.has(20)).toBe(true);
    await expect(star).not.toHaveClass(/is-found/);
    await page.reload();
    await expect(page.locator('.guiding-dialog-star')).not.toHaveClass(/is-found/);
  });
}

test('wish confirmation preserves the form on failure and removes the extra result caption', async ({ page }) => {
  const backend = await mockBackend(page, { failSave: true });
  await page.goto('/task/13');
  await page.getByRole('button', { name: 'Запустить снегопад', exact: true }).click();
  await page.getByRole('button', { name: 'Желание загадано', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('.wish-snow')).toBeVisible();
  expect(backend.completed.has(13)).toBe(false);
  backend.options.failSave = false;
  await page.getByRole('button', { name: 'Желание загадано', exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-stage', 'accepted');
  await expect(page.getByText('Пусть задуманное сбудется!', { exact: true })).toHaveCount(0);
  await expect(page.locator('.wish-snow')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Пусть задуманное сбудется!', { exact: true })).toHaveCount(0);
});
