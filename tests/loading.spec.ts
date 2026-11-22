import { test, expect } from '@playwright/test';
import { mockBackend } from './fixture';

function barrier() {
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  return { wait, release };
}

test('calendar reveals data, checks, house and closed windows together', async ({ page }) => {
  await mockBackend(page, { completed: true, lockedAfter: 1 });
  const data = barrier(), shade = barrier(), requested = barrier();
  await page.route('**/rest/v1/user_tasks?*', async route => { await data.wait; await route.fallback(); });
  await page.route('**/91-2080-*.svg', async route => { requested.release(); await shade.wait; await route.continue(); });
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.screen-loader [role=status]')).toHaveText('Открываем календарь...');
  await expect(page.locator('.screen-content')).toHaveAttribute('inert', '');
  await expect(page.locator('.calendar-page')).toBeHidden();
  data.release();
  await requested.wait;
  await expect(page.locator('.calendar-completed').first()).toBeHidden();
  await expect(page.locator('.calendar-illustration')).toBeHidden();
  await expect(page.locator('[role=status]:visible')).toHaveCount(1);
  shade.release();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.calendar-completed').first()).toBeVisible();
  await expect(page.locator('.calendar-illustration')).toBeVisible();
  await expect(page.locator('.calendar-window').nth(1)).toBeDisabled();
  expect(await page.locator('.calendar-page img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.fonts.status)).toBe('loaded');
});

test('task waits for its text font and has the destination background', async ({ page }) => {
  await mockBackend(page);
  const font = barrier(), requested = barrier();
  await page.route('**/STIXTwoText-*.woff2', async route => { requested.release(); await font.wait; await route.continue(); });
  await page.goto('/task/1', { waitUntil: 'domcontentloaded' });
  await requested.wait;
  await expect(page.locator('.screen-loader [role=status]')).toHaveText('Загружаем задание...');
  await expect(page.locator('.first-task-page')).toBeHidden();
  expect(await page.locator('.screen-loader').evaluate(element => getComputedStyle(element).background)).toBe(await page.locator('.first-task-page').evaluate(element => getComputedStyle(element).background));
  font.release();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.first-task-page')).toBeVisible();
});

test('loader fits narrow, landscape, tablet and desktop screens and respects reduced motion', async ({ page }) => {
  await mockBackend(page);
  const data = barrier();
  await page.route('**/rest/v1/user_tasks?*', async route => { await data.wait; await route.fallback(); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.screen-loader')).toBeVisible();
  for (const viewport of [{ width: 320, height: 568 }, { width: 393, height: 852 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const layout = await page.locator('.screen-loader').evaluate(element => {
      const box = element.getBoundingClientRect();
      const snow = element.querySelector('.screen-loader-snowflake')!;
      const snowBox = snow.getBoundingClientRect();
      const text = element.querySelector('.screen-loader-label')!.getBoundingClientRect();
      return { width: box.width, height: box.height, snowWidth: snowBox.width, center: snowBox.x + snowBox.width / 2, textBottom: text.bottom, textTop: text.top, snowBottom: snowBox.bottom, animation: getComputedStyle(snow).animationName };
    });
    expect(layout.width).toBe(viewport.width);
    expect(layout.height).toBe(viewport.height);
    expect(layout.snowWidth).toBe(75);
    expect(layout.center).toBe(viewport.width / 2);
    expect(layout.textTop).toBeGreaterThan(layout.snowBottom);
    expect(layout.textBottom).toBeLessThan(viewport.height);
    expect(layout.animation).toBe('none');
    if (viewport.width === 393 || viewport.width === 1440) await page.screenshot({ path: `/tmp/advent-loader-${viewport.width}.png` });
  }
  data.release();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
});

test('failed illustration offers a retry instead of exposing a partial calendar', async ({ page }) => {
  await mockBackend(page);
  const asset = '**/91-1115-*.svg';
  await page.route(asset, route => route.abort());
  await page.goto('/calendar');
  await expect(page.locator('.screen-loader [role=alert]')).toContainText('Не удалось загрузить экран');
  await expect(page.locator('.calendar-page')).toBeHidden();
  await page.unroute(asset);
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.calendar-page')).toBeVisible();
});

test('leaving a pending task never reveals it over the next screen', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/calendar');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  const code = barrier(), requested = barrier();
  await page.route('**/FirstTaskScreen-*.js', async route => { requested.release(); await code.wait; await route.continue(); });
  await page.locator('.calendar-window').first().click();
  await requested.wait;
  await expect(page.locator('.screen-loader [role=status]')).toHaveText('Загружаем задание...');
  await page.goBack();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.calendar-page')).toBeVisible();
  code.release();
  await expect(page.locator('.first-task-page')).toHaveCount(0);
});

test('saving a task keeps its screen visible', async ({ page }) => {
  await mockBackend(page, { delay: 80 });
  await page.goto('/task/12');
  await page.getByLabel('Название фильма').fill('Зимняя история');
  await page.getByRole('button', { name: 'Посоветовать фильм', exact: true }).click();
  await expect(page.locator('.film-page')).toBeVisible();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('warm gradient follows the destination when the viewport changes during loading', async ({ page }) => {
  await mockBackend(page);
  const font = barrier(), requested = barrier();
  await page.route('**/STIXTwoText-*.woff2', async route => { requested.release(); await font.wait; await route.continue(); });
  await page.goto('/task/3', { waitUntil: 'domcontentloaded' });
  await requested.wait;
  const layer = page.locator('.screen-loader-background > div');
  await expect(layer).toBeAttached();
  for (const viewport of [{ width: 393, height: 852 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const source = await page.locator('.memory-gradient').evaluate(element => {
        const style = getComputedStyle(element);
        return [style.backgroundImage, style.width, style.height, style.transform];
      });
      const loader = await layer.evaluate(element => {
        const style = getComputedStyle(element);
        return [style.backgroundImage, style.width, style.height, style.transform];
      });
      return JSON.stringify(loader) === JSON.stringify(source);
    }).toBe(true);
  }
  font.release();
  await expect(page.locator('.memory-page')).toBeVisible();
});

test('a completed task prepares its initial dialog before opening the modal', async ({ page }) => {
  await mockBackend(page, { completed: true });
  await page.route('**/rest/v1/task_responses?*', route => route.fulfill({ json: [{ id: 'response-20', task_id: 20, response: { result: 'wished' } }] }));
  const font = barrier(), requested = barrier();
  await page.route('**/STIXTwoText-*.woff2', async route => { requested.release(); await font.wait; await route.continue(); });
  await page.goto('/task/20', { waitUntil: 'domcontentloaded' });
  await requested.wait;
  await expect(page.locator('dialog[data-screen-dialog-pending]')).toBeAttached();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('.screen-loader')).toBeVisible();
  font.release();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('night boot loader fills non-iPhone aspect ratios without SVG side bars', async ({ page }) => {
  await mockBackend(page);
  const code = barrier(), requested = barrier();
  await page.route('**/assets/index-*.js', async route => { requested.release(); await code.wait; await route.continue(); });
  await page.goto('/task/6', { waitUntil: 'commit' });
  await requested.wait;
  for (const viewport of [{ width: 551, height: 917 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    const loader = page.locator('#startup-loader');
    await expect(loader).toHaveCSS('background-image', /linear-gradient/);
    await expect(loader).not.toHaveCSS('background-image', /url\(/);
    const box = await loader.boundingBox();
    expect(box).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });
    if (viewport.width === 551) await page.screenshot({ path: '/tmp/advent-loader-no-side-bars.png' });
  }
  code.release();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
});

test('focused calendar controls are made inert without aria-hidden violations on navigation', async ({ page }) => {
  await mockBackend(page);
  const warnings: string[] = [];
  page.on('console', message => { if (/aria-hidden|retained focus|Blocked aria/i.test(message.text())) warnings.push(message.text()); });
  const accessibility = await page.context().newCDPSession(page);
  await accessibility.send('Accessibility.enable');
  await page.goto('/calendar');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  const code = barrier(), requested = barrier();
  await page.route('**/SixthTaskScreen-*.js', async route => { requested.release(); await code.wait; await route.continue(); });
  const window = page.locator('.calendar-window').nth(5);
  await window.focus();
  await expect(window).toBeFocused();
  await page.keyboard.press('Enter');
  await requested.wait;
  await expect(page.locator('.screen-content')).toHaveAttribute('inert', '');
  await expect(page.locator('.screen-content')).not.toHaveAttribute('aria-hidden');
  await accessibility.send('Accessibility.getFullAXTree');
  expect(await page.evaluate(() => !!document.activeElement?.closest('[inert], [aria-hidden=true]'))).toBe(false);
  code.release();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('button', { name: /Назад к календарю|К календарю/ }).first().click();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('main')).toBeFocused();
  await accessibility.send('Accessibility.getFullAXTree');
  expect(warnings).toEqual([]);
});

test('a failed route keeps the previous screen inert behind the retry button', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/calendar');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await page.route('**/TaskView-*.js', route => route.abort());
  await page.locator('.calendar-window').first().click();
  await expect(page.locator('.screen-loader [role=alert]')).toContainText('Не удалось открыть страницу');
  await expect(page.locator('.screen-content')).toHaveAttribute('inert', '');
  await expect(page.locator('.calendar-page')).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Попробовать снова' })).toBeFocused();
  expect(await page.getByRole('button').count()).toBe(1);
});
