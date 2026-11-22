import { test, expect } from '@playwright/test';
import { mockBackend } from './fixture';

const required = [4, 7, 11, 14, 17, 19, 21];

for (const state of ['available', 'closed', 'completed'] as const) {
  test(`calendar marks exactly the seven required windows when ${state}`, async ({ page }) => {
    await mockBackend(page, { completed: state === 'completed', ...(state === 'closed' ? { lockedAfter: 0 } : {}) });
    await page.goto('/calendar');
    await expect(page.locator('.screen-loader')).toHaveCount(0);
    const artwork = page.locator('.calendar-illustration [data-mandatory=true]');
    expect(await artwork.evaluateAll(nodes => nodes.map(node => Number(node.querySelector('p')?.textContent)).sort((a, b) => a - b))).toEqual(required);
    await expect(page.locator('.calendar-window.is-mandatory')).toHaveCount(required.length);
    for (const viewport of [{ width: 320, height: 568 }, { width: 551, height: 917 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await expect.poll(async () => page.locator('.calendar-canvas').evaluate(el => Math.abs(el.getBoundingClientRect().width - document.querySelector('.calendar-stage')!.getBoundingClientRect().width))).toBeLessThan(1);
      for (const day of [3, 9, ...required]) {
        const window = page.locator('.calendar-window').nth(day - 1);
        const number = page.locator(`.calendar-illustration [data-name="window-${day}"] > p`);
        const buttonBox = await window.boundingBox(), numberBox = await number.boundingBox();
        expect(buttonBox).not.toBeNull(); expect(numberBox).not.toBeNull();
        expect(Math.abs(numberBox!.x + numberBox!.width / 2 - buttonBox!.x - buttonBox!.width / 2)).toBeLessThan(2);
        const art = page.locator(`.calendar-illustration [data-name="window-${day}"][data-mandatory]`);
        if (required.includes(day)) {
          await expect(window).toHaveAccessibleName(/Обязательное задание/);
          await expect(art.locator('[data-name=window-ornament]')).toHaveCount(1);
          expect(await art.evaluate(element => {
            const ornament = element.querySelector('[data-name=window-ornament]')!;
            const number = element.querySelector('p')!;
            return Boolean(ornament.compareDocumentPosition(number) & Node.DOCUMENT_POSITION_FOLLOWING);
          }), `day ${day}: the number must paint above its ornament`).toBe(true);
        } else {
          await expect(window).not.toHaveClass(/is-mandatory/);
          await expect(page.locator(`.calendar-illustration [data-name="window-${day}"] [data-name=window-ornament]`)).toHaveCount(0);
        }
        if (state === 'closed') await expect(window).toBeDisabled();
        if (state === 'completed') await expect(window.locator('.calendar-completed')).toHaveCount(1);
      }
      if (state === 'available' && viewport.width === 551) await page.screenshot({ path: test.info().outputPath('advent-calendar-required-windows.png'), fullPage: true });
    }
  });
}

test('every task uses its assigned date and keeps a full-width background without overflow', async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(new Date('2026-11-22T12:00:00Z'));
  const dateAtPosition = (day: number) => `2026-10-${String(day).padStart(2, '0')}`;
  await mockBackend(page, { dateAtPosition });
  for (let day = 1; day <= 25; day++) {
    await page.goto(`/task/${day}`);
    await expect(page.locator('.screen-loader')).toHaveCount(0);
    const date = page.locator('[data-task-date] time');
    await expect(date, `date label for window ${day}`).toHaveText(`${day} ОКТЯБРЯ`);
    await expect(date).toHaveAttribute('datetime', dateAtPosition(day));
    for (const viewport of [{ width: 320, height: 568 }, { width: 551, height: 917 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await expect.poll(async () => page.locator('main').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { left: Math.round(rect.left), width: Math.round(rect.width), overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) };
      }), `task ${day} at ${viewport.width}px`).toEqual({ left: 0, width: viewport.width, overflow: 0 });
      const background = await page.locator('main').evaluate(element => {
        const style = getComputedStyle(element);
        const gradient = element.querySelector('[class$="-gradient"]');
        return { image: style.backgroundImage, layer: gradient ? getComputedStyle(gradient).backgroundImage : 'none', repeat: style.backgroundRepeat, size: style.backgroundSize };
      });
      expect(background.image !== 'none' || background.layer !== 'none', `task ${day} background`).toBe(true);
      if (background.image.includes('url(')) {
        expect(background.repeat, `task ${day} repeat`).toBe('no-repeat');
        expect(background.size, `task ${day} sizing`).toBe('cover');
      }
    }
  }
});
