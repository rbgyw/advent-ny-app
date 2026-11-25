import { expect, test } from '@playwright/test';
import { mockBackend } from './fixture';

for (let day = 1; day <= 25; day++) {
  test(`task ${day} uses the same responsive container and keeps calendar navigation usable`, async ({ page }) => {
    const backend = await mockBackend(page);
    await page.goto(`/task/${day}`);
    await expect(page.locator('.screen-loader')).toHaveCount(0);
    if (day === 23 || day === 24) await expect.poll(() => backend.completed.has(day)).toBe(true);
    const container = page.locator('.task-container');
    await expect(container).toHaveCount(1);
    for (const width of [320, 393, 844, 1440]) {
      await page.setViewportSize({ width, height: width === 844 ? 390 : 852 });
      await expect.poll(() => container.evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(Math.min(width, 760));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      const returns = page.locator('.calendar-return:not(.calendar-return--header):visible');
      expect(await returns.count()).toBeGreaterThan(0);
      for (const button of await returns.all()) {
        const rect = (await button.boundingBox())!;
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(width);
        expect(rect.height).toBeGreaterThanOrEqual(52);
        await expect(button).toHaveCSS('background-color', day === 23 || day === 24 ? 'rgb(167, 40, 11)' : 'rgb(252, 246, 232)');
      }
    }
  });
}

test('team sport reveals the carousel and photo upload together', async ({ page }) => {
  const backend = await mockBackend(page);
  backend.responses[7] = { level: 'team' };
  await page.goto('/task/7');
  await expect(page.getByRole('button', { name: 'Получить задание', exact: true })).toBeVisible();
  await expect(page.locator('.sport-form')).toHaveCount(0);
  await page.getByRole('button', { name: 'Получить задание', exact: true }).click();
  await expect(page.locator('.sport-poses')).toBeVisible();
  await expect(page.locator('.sport-form')).toBeVisible();
  await expect(page.getByText('Фотография попадет в подборку ГЕРОФАРМ LIFE в Telegram и Max.', { exact: false })).toBeVisible();
});

test('stereogram opens fullscreen without changing its proportions and closes with Escape', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/task/11');
  for (const width of [320, 393, 1440]) {
    await page.setViewportSize({ width, height: 852 });
    const title = page.locator('#stereo-title');
    expect(await title.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.getByRole('button', { name: 'Открыть на весь экран', exact: false }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const rect = (await dialog.locator('img').boundingBox())!;
    expect(rect.width / rect.height).toBeCloseTo(314 / 201, 2);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  }
});

test('Podzhik and guiding star reopen as full result screens without task headings or dates', async ({ page }) => {
  await mockBackend(page, { completed: true });
  for (const day of [19, 20]) {
    await page.goto(`/task/${day}`);
    await expect(page.locator('.december-card--result')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.december-date, .december-badge, h1')).toHaveCount(0);
    await expect(page.locator('.december-calendar')).toHaveCSS('background-color', 'rgb(167, 40, 11)');
    await page.screenshot({ path: test.info().outputPath(`result-${day}.png`), fullPage: true });
  }
});

test('photo submission leaves just the receipt and calendar action', async ({ page }) => {
  const backend = await mockBackend(page);
  backend.responses[17] = { submitted_for_review: true };
  await page.goto('/task/17');
  await expect(page.getByRole('heading', { name: 'Фото отправлено!', exact: true })).toBeVisible();
  await expect(page.locator('.photo-required, .photo-reference, .december-copy')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.december-calendar')).toHaveCSS('background-color', 'rgb(167, 40, 11)');
});

test('completion popups fit a narrow phone and a short landscape viewport', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/task/14');
  for (const guess of ['ГЕРО', 'процесс', 'технолог', 'лидер', 'актив']) {
    await page.getByLabel('Ваш ответ', { exact: true }).fill(guess);
    await page.getByRole('button', { name: 'Вставить слово', exact: true }).click();
  }
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    const rect = (await dialog.boundingBox())!;
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width);
    expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);
    const button = dialog.getByRole('button', { name: 'К календарю', exact: true });
    await expect(button).toHaveCSS('background-color', 'rgb(167, 40, 11)');
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeInViewport();
    await page.screenshot({ path: test.info().outputPath(`popup-${viewport.width}.png`) });
  }
});

for (const width of [393, 1440]) {
  test(`new Podzhik panorama checks the built-in character after zooming at ${width}px`, async ({ page }) => {
    const backend = await mockBackend(page);
    await page.setViewportSize({ width, height: 852 });
    await page.goto('/task/19');
    await page.getByRole('button', { name: 'Начать', exact: true }).click();
    const scene = page.locator('.search-scene');
    await expect(scene).toHaveAttribute('src', /search-panorama.*\.webp/);
    expect(await scene.evaluate((img: HTMLImageElement) => img.naturalWidth / img.naturalHeight)).toBeCloseTo(4096 / 3102, 3);
    for (let step = 0; step < 10; step++) await page.getByRole('button', { name: 'Увеличить изображение', exact: true }).click();
    await expect(page.locator('.search-zoom output')).toHaveText('600%');
    await expect(page.locator('.search-target')).toHaveCount(0);
    // Click the built-in character's head, measured from the review screenshot,
    // independently of the app's target coordinates.
    const point = width === 393 ? { x: 1850 / 2617, y: 1655 / 1982 } : { x: 1849 / 2617, y: 1712 / 1982 };
    await page.locator('.search-viewport').evaluate((el, point) => {
      el.scrollLeft = point.x * el.scrollWidth - el.clientWidth / 2;
      el.scrollTop = point.y * el.scrollHeight - el.clientHeight / 2;
    }, point);
    await page.locator('.search-viewport').scrollIntoViewIfNeeded();
    const imageRect = (await scene.boundingBox())!;
    await page.mouse.click(imageRect.x + point.x * imageRect.width, imageRect.y + point.y * imageRect.height);
    await page.getByRole('button', { name: 'Проверить выбор', exact: true }).click();
    await expect(page.locator('#podzhik-result-title')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(backend.responses[19]).toEqual({ solved: true });
    await page.screenshot({ path: test.info().outputPath(`podzhik-found-${width}.png`), fullPage: true });
  });
}
