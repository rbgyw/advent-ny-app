import { test, expect, type Page } from '@playwright/test';
import { mockBackend, taskIdAtPosition, userId } from './fixture';

const viewports = [
  { width: 320, height: 568 }, { width: 360, height: 740 },
  { width: 393, height: 852 }, { width: 551, height: 917 },
  { width: 768, height: 1024 }, { width: 844, height: 390 },
  { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 },
];
async function layoutReady(page: Page) {
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect.poll(() => page.locator('.design-canvas').evaluateAll(canvases => {
    return canvases.filter(canvas => canvas.checkVisibility()).every(canvas => {
      const art = canvas.firstElementChild!;
      return Math.abs(canvas.getBoundingClientRect().width - art.getBoundingClientRect().width) < .5;
    });
  })).toBe(true);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await expect(page.locator('main')).toHaveCSS('background-image', /gradient/);
}

for (const route of ['/', '/rules']) {
  test(`${route} reflows from a narrow phone to a wide desktop`, async ({ page }) => {
    const backend = await mockBackend(page, { authenticated: false });
    await page.goto(route);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await layoutReady(page); await noOverflow(page);
      await expect(page.locator('h1')).toBeVisible();
      const callsToAction = page.locator(route === '/' ? '.splash-start' : '.rules-register, .rules-continue, .rules-back');
      for (const link of await callsToAction.all()) {
        const box = await link.boundingBox();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + .5);
      }
      if (route === '/') {
        const font = await page.locator('.splash-description').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
        expect(font).toBeGreaterThanOrEqual(14);
        const title = await page.locator('h1').boundingBox(), action = await page.locator('.splash-start').boundingBox();
        expect(action!.y).toBeGreaterThan(title!.y + title!.height);
      } else {
        const font = await page.locator('.rules-card > p').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
        expect(font).toBeGreaterThanOrEqual(14.7);
        const items = await page.locator('.rules-required-examples > *').evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()));
        expect(items[1]!.x).toBeGreaterThan(items[0]!.right);
        expect(items[3]!.x).toBeGreaterThan(items[2]!.right);
        const gift = await page.locator('.rules-gift').boundingBox(), examples = await page.locator('.rules-required').boundingBox();
        expect(gift!.y).toBeGreaterThan(examples!.y + examples!.height);
      }
      if ([393, 1440].includes(viewport.width)) await page.screenshot({ path: test.info().outputPath(`advent-fluid-${route === '/' ? 'splash' : 'rules'}-${viewport.width}.png`), fullPage: true });
    }
    expect(backend.calls).toHaveLength(0);
  });
}

test('mobile splash keeps the Figma artwork proportions and the start action works', async ({ page }) => {
  await mockBackend(page, { authenticated: false });
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/'); await layoutReady(page);
  const title = await page.locator('.splash-title-art').boundingBox();
  expect(title!.width).toBeCloseTo(270, 0); expect(title!.height).toBeCloseTo(151, 0);
  expect(title!.y).toBeCloseTo(232, 0);
  const start = await page.locator('.splash-start').boundingBox();
  expect(start!.width).toBeCloseTo(305, 0); expect(start!.y).toBeCloseTo(492, 0);
  expect(await page.locator('.design-canvas-art > img').evaluateAll(async images => {
    const valid = await Promise.all(images.filter(img => img.checkVisibility()).map(async img => {
      const image = img as HTMLImageElement, box = image.getBoundingClientRect();
      if (!image.complete || !image.naturalWidth) return false;
      let width = image.naturalWidth, height = image.naturalHeight;
      // naturalWidth rounds fractional SVG dimensions (for example 226.6 × 1.6).
      // Compare the render with the actual SVG root, not those rounded integers.
      if (!image.currentSrc.includes('.webp')) {
        const source = await (await fetch(image.currentSrc)).text();
        const root = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
        width = parseFloat(root.getAttribute('width')!); height = parseFloat(root.getAttribute('height')!);
      }
      return Math.abs((box.width / box.height) / (width / height) - 1) < .02;
    }));
    return valid.every(Boolean);
  })).toBe(true);
  await page.getByRole('link', { name: 'Начать', exact: true }).click();
  await expect(page).toHaveURL(/\/rules$/); await layoutReady(page);
  await page.getByRole('link', { name: 'Вернуться к заставке' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('calendar scales the artwork and hit areas together and keeps its menu usable', async ({ page }) => {
  await mockBackend(page);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  await page.route('**/rest/v1/user_tasks?*', route => route.fulfill({ json: Array.from({ length: 25 }, (_, i) => ({ id: `assignment-${i + 1}`, user_id: userId, task_id: taskIdAtPosition(i + 1), position: i + 1, available_date: i === 0 ? today : i === 2 ? '2026-11-01' : '2026-12-25', status: i === 2 ? 'completed' : 'not_started', completed_at: i === 2 ? new Date().toISOString() : null })) }));
  await page.goto('/calendar');
  for (const viewport of viewports) {
    await page.setViewportSize(viewport); await layoutReady(page); await noOverflow(page);
    await expect(page.locator('.calendar-window')).toHaveCount(25);
    await expect(page.locator('.calendar-window').nth(1)).toBeDisabled();
    await expect(page.locator('.calendar-today-badge')).toHaveCount(1);
    await expect(page.locator('.calendar-completed')).toHaveCount(1);
    await expect(page.locator('.calendar-window').nth(2).locator('.calendar-completed')).toHaveCount(1);
    for (const day of [1, 4, 14, 21, 24]) {
      const label = page.locator(`.calendar-illustration [data-name="window-${day}"] > p`);
      const labelBox = await label.boundingBox(), buttonBox = await page.locator('.calendar-window').nth(day - 1).boundingBox();
      expect(Math.abs(labelBox!.x + labelBox!.width / 2 - buttonBox!.x - buttonBox!.width / 2)).toBeLessThan(3);
      expect(labelBox!.y).toBeGreaterThanOrEqual(buttonBox!.y);
      expect(labelBox!.y + labelBox!.height).toBeLessThan(buttonBox!.y + buttonBox!.height + 2);
    }
    for (const selector of ['.calendar-menu summary', '.calendar-daily', '.calendar-brand-link']) {
      const box = await page.locator(selector).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(43.9);
      expect(box!.width).toBeGreaterThanOrEqual(43.9);
    }
    await page.locator('.calendar-menu summary').click();
    const panel = await page.locator('.calendar-menu-panel').boundingBox();
    expect(panel!.x).toBeGreaterThanOrEqual(0); expect(panel!.x + panel!.width).toBeLessThanOrEqual(viewport.width);
    expect((await page.getByRole('link', { name: 'Правила участия' }).boundingBox())!.height).toBeGreaterThanOrEqual(43.9);
    await page.keyboard.press('Escape');
    await expect(page.locator('.calendar-menu')).not.toHaveAttribute('open');
    if ([393, 1440].includes(viewport.width)) await page.screenshot({ path: test.info().outputPath(`advent-fluid-calendar-${viewport.width}.png`), fullPage: true });
  }
  await page.locator('.calendar-window').first().click();
  await expect(page).toHaveURL(/\/task\/1$/);
  await expect(page.locator('main')).toBeVisible();
});

test('reduced motion keeps the same fluid layout and disables hover transitions', async ({ page }) => {
  await mockBackend(page, { authenticated: false });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await layoutReady(page);
  await expect(page.locator('.splash-start')).toHaveCSS('transition-duration', '0s');
  await noOverflow(page);
});

for (const entry of [
  { route: '/?utm_source=advent', pattern: '**/SplashView-*.js', selector: '.screen-loader' },
  { route: '/rules/', pattern: '**/assets/index-*.js', selector: '#startup-loader' },
]) {
  test(`${entry.route} keeps its gradient while JavaScript is loading`, async ({ page }) => {
    await mockBackend(page, { authenticated: false });
    let release!: () => void, signalRequest!: () => void;
    const hold = new Promise<void>(resolve => { release = resolve; });
    const requested = new Promise<void>(resolve => { signalRequest = resolve; });
    await page.route(entry.pattern, async route => { signalRequest(); await hold; await route.continue(); });
    await page.goto(entry.route, { waitUntil: 'commit' });
    await requested;
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator(entry.selector)).toHaveAttribute('data-theme', 'night');
    await expect(page.locator(entry.selector)).toHaveCSS('background-image', /linear-gradient/);
    release();
    await layoutReady(page);
    await noOverflow(page);
  });
}
