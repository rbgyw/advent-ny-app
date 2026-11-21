import { expect, test } from '@playwright/test';
import { mockBackend } from './fixture';

const viewports = [
  [320, 568], [393, 852], [393, 1100], [531, 875], [639, 900], [640, 900], [641, 900],
  [744, 1133], [768, 1024], [768, 1180], [820, 1180], [834, 1194], [1024, 768],
  [1194, 834], [1440, 811], [1920, 1080], [1999, 1440], [2000, 1080], [2000, 1440],
  [3840, 2160], [393, 852],
] as const;

for (const route of ['/', '/calendar']) {
  test(`${route} keeps its scenery attached to the bottom and both sides during resizing`, async ({ page }) => {
    await mockBackend(page);
    await page.goto(route);
    await expect(page.locator('.screen-loader')).toHaveCount(0);
    const firstWindow = page.locator('.calendar-window').first();
    if (route === '/calendar') await firstWindow.focus();
    const titleTopByWidth = new Map<number, number>();
    let standardHouseWidth = 0;
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      const wide = width >= 640;
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
      if (route === '/calendar') {
        await expect(page.locator('.calendar-window')).toHaveCount(25);
        await expect(page.locator('.desktop-window')).toHaveCount(wide ? 24 : 0);
        await expect(page.locator('.calendar-fullbleed')).toHaveCount(wide ? 1 : 0);
        await expect(firstWindow).toBeFocused();
        const logo = (await page.locator('.calendar-brand-link img').boundingBox())!;
        const title = (await page.locator('.calendar-heading').boundingBox())!;
        const intro = (await page.locator('.calendar-intro').boundingBox())!;
        const action = (await page.locator('.calendar-daily').boundingBox())!;
        const pill = (await page.locator('.calendar-daily-label').boundingBox())!;
        expect(logo.y).toBeLessThan(35);
        expect(title.y).toBeLessThanOrEqual(wide ? 84 : 56);
        expect(intro.y - title.y - title.height).toBeGreaterThanOrEqual(14);
        expect(intro.y - title.y - title.height).toBeLessThanOrEqual(28);
        expect(pill.y - intro.y - intro.height).toBeGreaterThanOrEqual(16);
        expect(pill.y - intro.y - intro.height).toBeLessThanOrEqual(28);
        expect(action.height).toBeGreaterThanOrEqual(44);
        expect(pill.height).toBeLessThan(28);
        expect(pill.width).toBeLessThanOrEqual(248);
        if (!wide) {
          const stage = (await page.locator('.calendar-stage').boundingBox())!;
          expect(intro.width).toBeLessThanOrEqual(stage.width * .58 + .5);
          const flurries = (await page.locator('.mobile-flurries').boundingBox())!;
          expect(flurries.x).toBeCloseTo(0);
          expect(flurries.width).toBeCloseTo(width);
        }
        if (wide && height > width) expect(logo.width).toBeGreaterThanOrEqual(156);
        const previousTitleTop = titleTopByWidth.get(width);
        if (previousTitleTop !== undefined) expect(title.y).toBeCloseTo(previousTitleTop, 0);
        titleTopByWidth.set(width, title.y);
      }
      if (route === '/calendar' && wide) {
        for (const side of ['left', 'right']) {
          const curtain = page.locator(`.calendar-curtain-${side}`);
          const bounds = await curtain.boundingBox();
          expect(side === 'left' ? bounds!.x : bounds!.x + bounds!.width).toBeCloseTo(side === 'left' ? 0 : width, 0);
          expect(bounds!.y).toBeCloseTo(0, 0);
          expect(bounds!.height).toBeCloseTo((await page.locator('main').boundingBox())!.height, 0);
        }
        const house = (await page.locator('.desktop-house').boundingBox())!;
        expect(house.y + house.height).toBeGreaterThan(height - 45);
        const action = (await page.locator('.calendar-daily').boundingBox())!;
        expect(house.y - action.y - action.height).toBeGreaterThanOrEqual(16);
        if (width === 1999) standardHouseWidth = house.width;
        if (width >= 2000) {
          expect(house.width).toBeGreaterThan(standardHouseWidth * (height >= 1440 ? 1.8 : 1.2));
          if (height >= 1600) expect(house.width).toBeCloseTo(standardHouseWidth * 2, 0);
        }
        const snow = (await page.locator('.calendar-ground-back').boundingBox())!;
        expect(snow.x).toBeCloseTo(0, 0);
        expect(snow.x + snow.width).toBeCloseTo(width, 0);
        expect(snow.y + snow.height).toBeCloseTo((await page.locator('main').boundingBox())!.height, 0);
        for (const selector of ['.calendar-tree', '.calendar-lantern']) {
          const decorations = page.locator(selector);
          await expect(decorations).toHaveCount(2);
          for (const decoration of await decorations.all()) {
            const box = (await decoration.boundingBox())!;
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(width);
          }
        }
      }
      if (route === '/') {
        for (const selector of ['.splash-arch', '.splash-mobile-header', '.splash-mobile-scenery', '.splash-mobile-lamps']) {
          await expect(page.locator(selector)).toHaveCount(1);
          await expect(page.locator(selector + ':visible')).toHaveCount(wide ? 0 : 1);
        }
        for (const selector of ['.splash-wide-header', '.splash-wide-city', '.splash-title-wide', '.splash-wide-lamp-left', '.splash-wide-lamp-right']) {
          await expect(page.locator(selector + ':visible')).toHaveCount(wide ? 1 : 0);
        }
        await expect(page.locator('.splash-fireworks-wide img:visible')).toHaveCount(wide ? 6 : 0);
        await expect(page.locator('.splash-wide-bow:visible')).toHaveCount(wide ? 2 : 0);
        await expect(ground.locator('img')).toHaveJSProperty('complete', true);
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
