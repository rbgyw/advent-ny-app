import { test, expect } from '@playwright/test';
import { mockBackend, userId } from './fixture';
test('verification handles an invalid code and then restores an authenticated calendar', async ({ page }) => {
  await mockBackend(page, { authenticated: false });
  await page.addInitScript(() => sessionStorage.setItem('advent.pending-confirmation-email', 'audit@geropharm.com'));
  let invalid = true;
  await page.route('**/auth/v1/verify', async route => {
    expect(route.request().postDataJSON().token).toBe('123456');
    await route.fulfill(invalid ? { status: 403, json: { code: 'otp_expired', msg: 'Invalid code' } } : { json: {
      access_token: 'local-audit-token', refresh_token: 'local-refresh-token', expires_in: 3600, token_type: 'bearer',
      user: { id: userId, email: 'audit@geropharm.com', aud: 'authenticated', app_metadata: {}, user_metadata: {} },
    } });
  });
  await page.goto('/auth'); await page.locator('#verification-digit-0').fill('123456');
  await page.getByRole('button', { name: 'Подтвердить', exact: true }).click(); await expect(page.getByRole('alert')).toBeVisible();
  invalid = false; await page.getByRole('button', { name: 'Подтвердить', exact: true }).click();
  await expect(page).toHaveURL(/\/calendar$/); await expect(page.locator('.calendar-window').nth(0)).toBeEnabled();
});
test('invalid attachments are rejected before reserving storage or sending a file', async ({ page }) => {
  const backend = await mockBackend(page, { genericTasks: true }); await page.goto('/task/17');
  const input = page.locator('input[type=file][multiple]'); await expect(input).toBeEnabled();
  await input.setInputFiles({ name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toContainText('Выберите фотографию');
  expect(backend.calls.some(path => /reserve_task_attachment|storage/.test(path))).toBe(false);
});

test('photo actions attach, replace and remove a photo with a temporary confirmation', async ({ page }) => {
  await mockBackend(page);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jAE0AAAAASUVORK5CYII=', 'base64');
  type Photo = { id: string; task_id: number; file_name: string; mime_type: string; file_size: number; storage_path: string };
  let photo: Photo | undefined;
  let reserved: Photo | undefined;
  let nextId = 0;
  await page.route('**/rest/v1/attachments?*', route => route.fulfill({ json: photo ? [photo] : [] }));
  await page.route('**/rest/v1/rpc/*attachment*', async route => {
    const name = new URL(route.request().url()).pathname.split('/').at(-1);
    const request = route.request().postDataJSON();
    if (name === 'reserve_task_attachment' || name === 'reserve_attachment_replacement') {
      if (name === 'reserve_attachment_replacement') expect(request.p_attachment_id).toBe(photo?.id);
      const id = String(++nextId);
      reserved = { id, task_id: 3, file_name: request.p_file_name, mime_type: request.p_mime_type, file_size: request.p_file_size, storage_path: `audit/${id}.png` };
      await route.fulfill({ json: { attachment_id: id, storage_path: reserved.storage_path } });
    } else if (name === 'confirm_task_attachment') {
      expect(request.p_attachment_id).toBe(reserved?.id);
      photo = reserved;
      await route.fulfill({ json: true });
    } else if (name === 'delete_task_attachment') {
      expect(request.p_attachment_id).toBe(photo?.id);
      photo = undefined;
      await route.fulfill({ json: true });
    } else await route.fallback();
  });
  await page.route('**/storage/v1/object/**', route => route.request().method() === 'GET'
    ? route.fulfill({ body: png, contentType: 'image/png' })
    : route.fulfill({ json: { Key: reserved?.storage_path } }));
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/task/3');

  async function pick(button: string, name: string) {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: button, exact: true }).click();
    await (await chooser).setFiles({ name, mimeType: 'image/png', buffer: png });
  }

  await pick('Прикрепить фото', 'photo.png');
  await expect(page.getByRole('img', { name: 'photo.png' })).toBeVisible();
  await pick('Заменить фото', 'new-photo.png');
  await expect(page.getByRole('img', { name: 'new-photo.png' })).toBeVisible();
  await page.getByRole('button', { name: 'Удалить фото' }).click();
  const removed = page.getByText('Фотография удалена.', { exact: true });
  await expect(removed).toBeVisible();
  await expect(page.getByRole('img', { name: 'new-photo.png' })).toHaveCount(0);
  await expect(removed).toHaveCount(0, { timeout: 6500 });
});
