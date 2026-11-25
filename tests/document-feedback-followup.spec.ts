import { expect, test } from '@playwright/test';
import { mockBackend } from './fixture';

for (const day of [1, 2, 3, 4, 7, 8, 9, 11, 12, 13, 14, 17, 19, 20, 21]) {
  test(`ordinary actions on task ${day} keep their dimensions and color on hover`, async ({ page }) => {
    await mockBackend(page);
    await page.goto(`/task/${day}`);
    await expect(page.locator('.screen-loader')).toHaveCount(0);
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const button of await page.locator('.task-action:visible').all()) {
        await expect(button).toHaveCSS('height', '52px');
        await expect(button).toHaveCSS('border-radius', '13px');
        expect(await button.evaluate(el => {
          const parent = el.parentElement!, style = getComputedStyle(parent);
          const contentWidth = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
          return Math.abs(el.getBoundingClientRect().width - contentWidth);
        })).toBeLessThanOrEqual(1);
        if (!await button.isEnabled()) continue;
        const color = await button.evaluate(el => getComputedStyle(el).backgroundColor);
        await button.hover();
        await expect(button).toHaveCSS('background-color', color);
        await expect(button).toHaveCSS('filter', 'brightness(0.94)');
      }
      const back = page.locator('.calendar-return:not(.calendar-return--header):visible').last();
      const color = await back.evaluate(el => getComputedStyle(el).backgroundColor);
      await back.hover();
      await expect(back).toHaveCSS('background-color', color);
      await expect(back).toHaveCSS('filter', 'brightness(0.94)');
    }
  });
}

test('crossword cells select questions without any text input or caret', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/task/3');
  await page.getByRole('button', { name: 'Начать кроссворд', exact: true }).click();
  const cell = page.locator('[data-cell="1:1"]');
  await cell.click();
  await expect(page.locator('#active-clue-title')).toContainText('Вопрос 3');
  await expect(page.locator('.crossword-cell input, .crossword-cell textarea, .crossword-cell [contenteditable]')).toHaveCount(0);
  await expect(cell).toHaveCSS('cursor', 'pointer');
  await expect(cell).toHaveCSS('caret-color', 'rgba(0, 0, 0, 0)');
  await page.keyboard.type('БУКВА');
  await expect(cell).toHaveText('');
});

test('starting the investigation returns to the top of the page', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/task/9');
  const start = page.getByRole('button', { name: 'Начать расследование', exact: true });
  await start.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await start.click();
  await expect(page.getByRole('heading', { name: 'Схема завода' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('the tarot action keeps its gold fill and uses a CSS border', async ({ page }) => {
  await mockBackend(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/task/6');
  const button = page.getByRole('button', { name: 'Вытянуть карту', exact: true });
  await expect(button).toHaveCSS('height', '60px');
  await expect(button).toHaveCSS('border-top-width', '1px');
  await expect(button).toHaveCSS('border-top-style', 'solid');
  await expect(button).toHaveCSS('background-image', /linear-gradient/);
  expect(await button.evaluate(el => getComputedStyle(el).backgroundImage)).not.toContain('.svg');
  await button.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('tarot-css-border.png') });
});

test('the snowfall result has one desktop heading line and no small mood captions', async ({ page }) => {
  await mockBackend(page, { completed: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/task/13');
  await expect(page.locator('.wish-note')).toHaveCount(0);
  await expect(page.locator('.wish-result-break')).not.toBeVisible();
  const title = page.locator('#wish-title');
  expect(await title.evaluate(el => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight))).toBeCloseTo(1, 1);
  await page.screenshot({ path: test.info().outputPath('snowfall-result-desktop.png') });
});

test('the photo receipt hides the task date, title and mandatory badge', async ({ page }) => {
  const backend = await mockBackend(page);
  backend.responses[17] = { submitted_for_review: true };
  await page.goto('/task/17');
  await expect(page.getByRole('heading', { name: 'Фото отправлено!', exact: true })).toBeVisible();
  await expect(page.locator('.december-date, h1, .december-badge, .december-wreath')).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('photo-receipt.png') });
});

test('nonogram derives crosses for a correct line, restores them after reload and withdraws them after an edit', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/task/21');
  for (const index of [6, 7, 8, 9]) await page.locator(`[data-cell-index="${index}"]`).click();
  for (const index of [0, 1, 2, 3, 4, 5]) await expect(page.locator(`[data-cell-index="${index}"]`).locator('..')).toHaveAttribute('data-mark', '2');
  await page.reload();
  await expect(page.locator('[data-cell-index="0"]').locator('..')).toHaveAttribute('data-mark', '2');
  await page.locator('[data-cell-index="6"]').click();
  await expect(page.locator('[data-cell-index="0"]').locator('..')).toHaveAttribute('data-mark', '0');
});

test('ordinary action groups and sport confirmation keep a 16px gap', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/task/1');
  const downloads = page.locator('.first-task-actions .task-action');
  await expect(downloads).toHaveCount(3);
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  const first = (await downloads.nth(0).boundingBox())!, second = (await downloads.nth(1).boundingBox())!;
  expect(second.y - first.y - first.height).toBeCloseTo(16, 0);
  await page.goto('/task/7');
  await page.locator('.sport-level .task-action').first().click();
  const buttons = page.locator('.sport-dialog .task-action');
  await expect(buttons).toHaveCount(2);
  const primary = (await buttons.nth(0).boundingBox())!, secondary = (await buttons.nth(1).boundingBox())!;
  expect(secondary.width).toBe(primary.width);
  expect(secondary.height).toBe(primary.height);
  expect(secondary.y - primary.y - primary.height).toBeCloseTo(16, 0);
  await buttons.nth(1).hover();
  await expect(buttons.nth(1)).toHaveCSS('background-color', 'rgb(252, 246, 232)');
});
