import { expect, test } from '@playwright/test';
import { mockBackend } from './fixture';

for (const width of [393, 551, 1440]) {
  test(`locked windows preserve foreground decoration and warm colors at ${width}px`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-27T12:00:00Z'));
    const backend = await mockBackend(page, { lockedAfter: 25 });
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/calendar');
    await expect(page.locator('.screen-loader')).toHaveCount(0, { timeout: 15_000 });
    await page.mouse.move(0, 0);
    const desktop = width >= 640;
    const facade = page.locator(desktop ? '.desktop-house' : '.calendar-illustration > div').first();
    const open = await facade.screenshot({ scale: 'css', path: test.info().outputPath('all-open.png') });
    backend.options.lockedAfter = 0;
    await page.reload();
    await expect(page.locator('.screen-loader')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('.calendar-window.is-locked')).toHaveCount(25);
    await expect(page.locator('.calendar-window').first()).toHaveCSS('mix-blend-mode', 'normal');
    await page.mouse.move(0, 0);
    const closed = await facade.screenshot({ scale: 'css', path: test.info().outputPath('all-closed.png') });
    const pixels = await page.evaluate(async ({ open, closed, desktop }) => {
      const decode = async (encoded: string) => {
        const img = new Image(); img.src = `data:image/png;base64,${encoded}`; await img.decode();
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
        const context = canvas.getContext('2d')!; context.drawImage(img, 0, 0);
        return { width: img.width, height: img.height, context };
      };
      const [a, b] = await Promise.all([decode(open), decode(closed)]);
      const reference = desktop ? [524, 627] : [375, 636];
      const points = desktop
        ? { wreath: [250, 553], bow: [242, 158], window: [87, 187] }
        : { wreath: [175, 540], bow: [165, 105], tree: [101, 563], window: [55, 280] };
      return Object.fromEntries(Object.entries(points).map(([name, point]) => {
        const x = Math.round(point[0]! / reference[0]! * a.width), y = Math.round(point[1]! / reference[1]! * a.height);
        return [name, { open: [...a.context.getImageData(x, y, 1, 1).data], closed: [...b.context.getImageData(x, y, 1, 1).data] }];
      }));
    }, { open: open.toString('base64'), closed: closed.toString('base64'), desktop });
    for (const name of ['wreath', 'bow', ...(desktop ? [] : ['tree'])]) {
      for (let channel = 0; channel < 3; channel++) {
        expect(Math.abs(pixels[name]!.closed[channel]! - pixels[name]!.open[channel]!), `${name} keeps its original colors`).toBeLessThanOrEqual(3);
      }
    }
    expect(pixels.window?.closed).not.toEqual(pixels.window?.open);
    // The mask darkens the original palette instead of desaturating it.
    expect(pixels.window!.closed[0]).toBeGreaterThan(pixels.window!.closed[2]! + 10);
    backend.options.lockedAfter = 8;
    await page.reload();
    await expect(page.locator('.screen-loader')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator('.calendar-window.is-locked')).toHaveCount(17);
    await page.mouse.move(0, 0);
    await facade.screenshot({ scale: 'css', path: test.info().outputPath('first-eight-open.png') });
  });

  test(`calendar menu dismisses only outside its area at ${width}px`, async ({ page }) => {
    await mockBackend(page, { lockedAfter: 0 });
    await page.setViewportSize({ width, height: 1100 });
    await page.goto('/calendar');
    const menu = page.locator('.calendar-menu');
    const toggle = menu.locator('summary');
    await toggle.click();
    await expect(menu).toHaveAttribute('open');
    await menu.locator('.calendar-account').click();
    await expect(menu).toHaveAttribute('open');
    const panel = await page.locator('.calendar-menu-panel').boundingBox();
    await page.mouse.click(panel!.x + 5, panel!.y + 5);
    await expect(menu).toHaveAttribute('open');
    await page.mouse.click(5, 300);
    await expect(menu).not.toHaveAttribute('open');
    await expect(page).toHaveURL(/\/calendar$/);
    await toggle.click();
    await page.locator('.calendar-window').first().click({ force: true });
    await expect(menu).not.toHaveAttribute('open');
    await expect(page).toHaveURL(/\/calendar$/);
    await toggle.click(); await toggle.click();
    await expect(menu).not.toHaveAttribute('open');
    await toggle.click(); await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open');
    await expect(toggle).toBeFocused();
  });
}
