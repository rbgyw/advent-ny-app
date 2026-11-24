import { test, expect } from '@playwright/test';
import { mockBackend } from './fixture';
import { CIPHER_LETTERS } from '../src/utils/cipher';

for (const viewport of [{ width: 320, height: 568 }, { width: 393, height: 852 }, { width: 1366, height: 768 }]) {
  test(`day 2 gift video loops only inside the open popup at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockBackend(page);
    const videoRequests: string[] = [];
    page.on('request', request => { if (request.resourceType() === 'media' && /\.mp4(?:$|\?)/.test(request.url())) videoRequests.push(request.url()); });
    await page.goto('/task/2');
    await expect(page.locator('#cipher-letter-0')).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);
    expect(videoRequests).toHaveLength(0);

    for (const [index, letter] of CIPHER_LETTERS.entries()) await page.locator(`#cipher-letter-${index}`).fill(letter);
    await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const video = dialog.locator('video');
    await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate((player: HTMLVideoElement) => player.currentTime)).toBeGreaterThan(0.15);
    const state = await video.evaluate((player: HTMLVideoElement) => ({
      controls: player.controls, loop: player.loop, muted: player.muted, inline: player.playsInline,
      noPip: player.disablePictureInPicture, noRemote: player.disableRemotePlayback,
      width: player.videoWidth, height: player.videoHeight, duration: player.duration,
    }));
    expect(state).toMatchObject({ controls: false, loop: true, muted: true, inline: true, noPip: true, noRemote: true, width: 1280, height: 720 });
    expect(state.duration).toBeGreaterThan(17);
    await expect(video).toHaveAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    await video.scrollIntoViewIfNeeded();
    const box = await video.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.height).toBeLessThanOrEqual(viewport.height * 0.4 + 1);
    expect(Math.abs(box!.width / box!.height - 16 / 9)).toBeLessThan(0.02);

    await video.evaluate(async (player: HTMLVideoElement) => {
      const seeked = new Promise<void>(resolve => player.addEventListener('seeked', () => resolve(), { once: true }));
      player.currentTime = player.duration - 0.15;
      await seeked;
    });
    await expect.poll(() => video.evaluate((player: HTMLVideoElement) => !player.paused && player.currentTime < 2)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('gift-video-popup.png') });

    const first = await video.elementHandle();
    await dialog.getByRole('button', { name: 'Закрыть окно результата' }).click();
    await expect(page.locator('video')).toHaveCount(0);
    expect(await first!.evaluate((player: HTMLVideoElement) => player.paused && !player.hasAttribute('src'))).toBe(true);

    await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    await expect.poll(() => video.evaluate((player: HTMLVideoElement) => player.currentTime)).toBeGreaterThan(0.15);
    const reopened = await video.elementHandle();
    await dialog.getByRole('button', { name: 'К календарю', exact: true }).click();
    await expect(page).toHaveURL(/\/calendar$/);
    expect(await reopened!.evaluate((player: HTMLVideoElement) => player.paused && !player.hasAttribute('src'))).toBe(true);
  });
}
