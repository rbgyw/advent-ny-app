import { test, expect, type Page } from '@playwright/test';
import { mockBackend, userId } from './fixture';

function barrier() {
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  return { wait, release };
}

function resourceDiagnostics(page: Page) {
  const messages: string[] = [];
  page.on('console', message => {
    if (message.text().startsWith('[advent]')) messages.push(message.text());
  });
  return messages;
}

test('calendar waits for data but reveals controls before a slow decorative layer', async ({ page }) => {
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
  await expect(page.locator('.calendar-completed').first()).toBeVisible();
  await expect(page.locator('.calendar-window').first()).toBeEnabled();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  shade.release();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.calendar-completed').first()).toBeVisible();
  await expect(page.locator('.calendar-illustration')).toBeVisible();
  await expect(page.locator('.calendar-window').nth(1)).toBeDisabled();
  await expect.poll(() => page.locator('.calendar-page img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
});

test('task reveals text with a fallback font while its custom font is pending', async ({ page }) => {
  await mockBackend(page);
  const font = barrier(), requested = barrier();
  await page.route('**/STIXTwoText-*.woff2', async route => { requested.release(); await font.wait; await route.continue(); });
  await page.goto('/task/1', { waitUntil: 'domcontentloaded' });
  await requested.wait;
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.first-task-page')).toBeVisible();
  await expect(page.locator('.first-task-page h1')).toBeVisible();
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
    if (viewport.width === 393 || viewport.width === 1440) await page.screenshot({ path: test.info().outputPath(`advent-loader-${viewport.width}.png`) });
  }
  data.release();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
});

test('password login opens the calendar after RPC 204 and an optional illustration 404', async ({ page }) => {
  await mockBackend(page, { authenticated: false });
  const email = 'audit@geropharm.com';
  const messages = resourceDiagnostics(page);
  await page.route('**/auth/v1/token?grant_type=password', route => route.fulfill({ json: {
    access_token: 'local-audit-token', refresh_token: 'local-refresh-token', expires_in: 3600, token_type: 'bearer',
    user: { id: userId, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' },
  } }));
  await page.route('**/rest/v1/rpc/prepare_advent_calendar', route => route.fulfill({ status: 204 }));
  await page.route('**/91-1115-*.svg', route => route.fulfill({ status: 404 }));
  const prepared = page.waitForResponse(response => response.url().endsWith('/rpc/prepare_advent_calendar') && response.status() === 204);
  await page.goto('/auth');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await prepared;
  await expect(page).toHaveURL('/calendar');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('img[data-screen-image-fallback]').first()).toHaveCSS('opacity', '0');
  expect(messages).toEqual(expect.arrayContaining([expect.stringMatching(/optional image load: .*\/assets\/91-1115-.*\.svg$/)]));
  expect(messages.join()).not.toMatch(/audit@|local-audit-token|test-only-password/);
  await page.locator('.calendar-window').first().click();
  await expect(page).toHaveURL('/task/1');
});

test('an image decode failure keeps the calendar usable and supplies a text heading', async ({ page }) => {
  await mockBackend(page);
  const messages = resourceDiagnostics(page);
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function () {
      if (this.classList.contains('desktop-calendar-title')) return Promise.reject(new DOMException('Decode failed', 'EncodingError'));
      return decode.call(this);
    };
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/calendar');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.calendar-title-fallback')).toBeVisible();
  await expect(page.locator('.calendar-window').first()).toBeEnabled();
  await expect.poll(() => messages).toEqual(expect.arrayContaining([expect.stringMatching(/optional image decode: .*\/assets\/.*\.svg$/)]));
});

test('a missing background and font fall back to the background color and system font', async ({ page }) => {
  await mockBackend(page);
  const messages = resourceDiagnostics(page);
  await page.route('**/assets/FirstTaskScreen-*.css', async route => {
    const response = await route.fetch();
    const css = await response.text();
    // Vite inlines this task's background. Exercise the emitted-file case too.
    await route.fulfill({ response, body: `${css}\n.first-task-page { background-image: url('/assets/screen-bg-aBcDe123.svg?token=private') !important; }` });
  });
  await page.route('**/assets/screen-bg-aBcDe123.svg*', route => route.fulfill({ status: 404 }));
  await page.route('**/assets/STIXTwoText-*.woff2', route => route.fulfill({ status: 404 }));
  await page.goto('/task/1');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.first-task-page')).toHaveCSS('background-color', 'rgb(198, 61, 15)');
  await expect(page.locator('h1')).toBeVisible();
  await expect.poll(() => messages).toEqual(expect.arrayContaining([
    expect.stringMatching(/optional background load: .*\/assets\/screen-bg-aBcDe123\.svg$/),
    expect.stringMatching(/optional font load: .*\/assets\/STIXTwoText-.*\.woff2$/),
  ]));
  expect(messages.join()).not.toContain('token=private');
});

test('a stalled optional image times out without blocking the calendar', async ({ page }) => {
  await mockBackend(page);
  const messages = resourceDiagnostics(page);
  const asset = barrier();
  await page.route('**/91-1115-*.svg', async route => { await asset.wait; await route.continue(); });
  try {
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.screen-loader')).toHaveCount(0, { timeout: 3_000 });
    await expect(page.locator('.calendar-window').first()).toBeEnabled();
    await expect.poll(() => messages, { timeout: 7_000 }).toEqual(expect.arrayContaining([expect.stringMatching(/optional image timeout: .*\/assets\/91-1115-.*\.svg$/)]));
  } finally {
    asset.release();
  }
  await expect(page.locator('img[data-screen-image-fallback]')).toHaveCount(0);
});

test('an unavailable game image offers a local retry without hiding the whole task', async ({ page }) => {
  await mockBackend(page);
  const messages = resourceDiagnostics(page);
  const asset = '**/heart-*.webp';
  await page.route(asset, route => route.fulfill({ status: 404 }));
  await page.goto('/task/11');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.stereo-page')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить изображение задания');
  await expect.poll(() => messages).toEqual(expect.arrayContaining([expect.stringMatching(/optional image load: .*\/assets\/heart-.*\.webp$/)]));
  await page.unroute(asset);
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await expect(page.locator('.stereo-photo')).toBeVisible();
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

test('warm gradient remains responsive while an optional font is pending', async ({ page }) => {
  await mockBackend(page);
  const font = barrier(), requested = barrier();
  await page.route('**/STIXTwoText-*.woff2', async route => { requested.release(); await font.wait; await route.continue(); });
  await page.goto('/task/4', { waitUntil: 'domcontentloaded' });
  await requested.wait;
  await expect(page.locator('.memory-page')).toBeVisible();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  const gradient = page.locator('.memory-gradient');
  const before = await gradient.evaluate(element => getComputedStyle(element).transform);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => gradient.evaluate(element => getComputedStyle(element).transform)).not.toBe(before);
  await expect(gradient).toHaveCSS('background-image', /radial-gradient/);
  font.release();
});

test('a completed task prepares its initial dialog before opening the modal', async ({ page }) => {
  await mockBackend(page, { completed: true });
  await page.route('**/rest/v1/task_responses?*', route => route.fulfill({ json: [{ id: 'response-20', task_id: 20, response: { result: 'wished' } }] }));
  const data = barrier(), requested = barrier();
  await page.route('**/rest/v1/rpc/is_admin', async route => { requested.release(); await data.wait; await route.fallback(); });
  await page.goto('/task/20', { waitUntil: 'domcontentloaded' });
  await requested.wait;
  await expect(page.locator('dialog[data-screen-dialog-pending]')).toBeAttached();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('.screen-loader')).toBeVisible();
  data.release();
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
    if (viewport.width === 551) await page.screenshot({ path: test.info().outputPath('advent-loader-no-side-bars.png') });
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

test('a failed route moves keyboard focus to retry and keeps the previous screen inert', async ({ page }) => {
  await mockBackend(page);
  const messages = resourceDiagnostics(page);
  await page.goto('/calendar');
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await page.route('**/TaskView-*.js', route => route.abort());
  await page.locator('.calendar-window').first().press('Enter');
  await expect(page.locator('.screen-loader [role=alert]')).toContainText('Не удалось открыть страницу');
  await expect(page.locator('.screen-content')).toHaveAttribute('inert', '');
  await expect(page.locator('.calendar-page')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Попробовать снова' })).toBeFocused();
  expect(await page.getByRole('button').count()).toBe(1);
  expect(messages).toEqual(expect.arrayContaining([expect.stringMatching(/critical module load: .*\/assets\/TaskView-.*\.js$/)]));
});


test('direct task 4 and nested-route refresh retain the authorized crossword', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/task/3');
  await expect(page.locator('.crossword-page')).toBeVisible();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
  await page.reload();
  await expect(page).toHaveURL('/task/3');
  await expect(page.locator('.crossword-page')).toBeVisible();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
});

test('an entry module 404 leaves a working startup retry before Vue exists', async ({ page }) => {
  await mockBackend(page);
  await page.route('**/assets/index-*.js', route => route.fulfill({ status: 404 }));
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#startup-status')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#startup-retry')).toBeVisible();
  await page.unroute('**/assets/index-*.js');
  await page.locator('#startup-retry').click();
  await expect(page.locator('.calendar-page')).toBeVisible();
});

test('a failed child module is diagnosed separately and can reload after a build change', async ({ page }) => {
  await mockBackend(page);
  const messages = resourceDiagnostics(page);
  await page.route('**/FourthTaskScreen-*.js', route => route.fulfill({ status: 404 }));
  await page.goto('/task/3');
  await expect(page.getByRole('button', { name: 'Загрузить снова' })).toBeVisible();
  expect(messages.some(message => /critical module load: .*FourthTaskScreen/.test(message))).toBe(true);
  await page.unroute('**/FourthTaskScreen-*.js');
  await page.getByRole('button', { name: 'Загрузить снова' }).click();
  await expect(page.locator('.crossword-page')).toBeVisible();
});

test('a stalled entry module offers retry after a bounded startup wait', async ({ page }) => {
  await mockBackend(page);
  await page.clock.install();
  const code = barrier(), requested = barrier();
  await page.route('**/assets/index-*.js', async route => { requested.release(); await code.wait; await route.continue(); });
  await page.goto('/calendar', { waitUntil: 'commit' });
  await requested.wait;
  // The preload scanner can request JS before the inline startup timer runs.
  await expect(page.locator('#startup-loader')).toHaveAttribute('data-theme', 'calendar');
  await page.clock.fastForward(30_001);
  await expect(page.locator('#startup-status')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#startup-retry')).toBeVisible();
  code.release();
  await expect(page.locator('.calendar-page')).toBeVisible();
});

test('a stalled route import offers retry instead of an endless navigation loader', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/calendar');
  await expect(page.locator('.calendar-page')).toBeVisible();
  await page.clock.install();
  const code = barrier(), requested = barrier();
  await page.route('**/TaskView-*.js', async route => { requested.release(); await code.wait; await route.continue(); });
  await page.locator('.calendar-window').first().click();
  await requested.wait;
  await page.clock.fastForward(30_001);
  await expect(page.locator('.screen-loader [role=alert]')).toContainText('Не удалось завершить переход');
  await expect(page.getByRole('button', { name: 'Попробовать снова' })).toBeVisible();
  code.release();
});

test('a stalled child component has a local module timeout and retry', async ({ page }) => {
  await mockBackend(page);
  await page.clock.install();
  const code = barrier(), requested = barrier();
  await page.route('**/FourthTaskScreen-*.js', async route => { requested.release(); await code.wait; await route.continue(); });
  await page.goto('/task/3', { waitUntil: 'domcontentloaded' });
  await requested.wait;
  await page.clock.fastForward(25_001);
  await expect(page.getByText('Не удалось загрузить код задания. Обновите страницу и попробуйте снова.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Загрузить снова' })).toBeVisible();
  code.release();
});
