import { expect, test } from '@playwright/test';
import { mockBackend } from './fixture';

const widths = [320, 393, 430, 551, 559, 560, 600, 767, 768, 899, 900, 901, 1024, 1199, 1440, 1601, 1920, 2560];

for (const route of ['/', '/calendar']) {
  test(`${route} keeps its scenery attached to the bottom and both sides during resizing`, async ({ page }) => {
    await mockBackend(page);
    await page.goto(route);
    await expect(page.locator('.screen-loader')).toHaveCount(0);
    for (const width of widths) {
      await page.setViewportSize({ width, height: width % 2 ? 1080 : 740 });
      const ground = page.locator(route === '/' ? '.splash-ground' : '.calendar-ground-front');
      await expect.poll(() => ground.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const scene = element.closest('section, .calendar-layout')!.getBoundingClientRect();
        return Math.max(Math.abs(rect.left), Math.abs(rect.right - innerWidth), Math.abs(rect.bottom - scene.bottom));
      }), `full width snow at ${width}px`).toBeLessThanOrEqual(1.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (route === '/calendar') {
        await expect.poll(() => page.locator('.calendar-stage').evaluate(element => {
          const canvas = element.firstElementChild!;
          return Math.abs(canvas.getBoundingClientRect().width - element.getBoundingClientRect().width);
        }), `art and hit areas use the same scale at ${width}px`).toBeLessThan(.5);
      }
      if (route === '/calendar' && width >= 900) {
        for (const side of ['left', 'right']) {
          const curtain = page.locator(`.calendar-curtain-${side}`);
          const bounds = await curtain.boundingBox();
          expect(side === 'left' ? bounds!.x : bounds!.x + bounds!.width).toBeCloseTo(side === 'left' ? 0 : width, 0);
          expect(bounds!.y).toBeCloseTo(0, 0);
          expect(bounds!.height).toBeCloseTo((await page.locator('main').boundingBox())!.height, 0);
        }
        await expect(page.locator('.calendar-window')).toHaveCount(25);
        await expect(page.locator('.desktop-window')).toHaveCount(24);
      }
    }
  });
}

test('desktop splash includes its two-line heading, fireworks, city and both lanterns', async ({ page }) => {
  await mockBackend(page, { authenticated: false });
  await page.setViewportSize({ width: 1440, height: 813 });
  await page.goto('/');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  for (const selector of ['.splash-title-wide', '.splash-fireworks-wide', '.splash-wide-city', '.splash-city-distant', '.splash-wide-lamp-left', '.splash-wide-lamp-right']) await expect(page.locator(selector)).toBeVisible();
  expect(await page.locator('.splash-title-wide > .design-canvas-art > img').count()).toBe(4);
  await expect(page.locator('.splash-fireworks-wide > img')).toHaveCount(6);
  expect(await page.locator('.splash-wide-lamp-left').evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(813);
  await page.getByRole('link', { name: 'Начать', exact: true }).click();
  await expect(page).toHaveURL(/\/rules$/);
});
