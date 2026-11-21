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
  const backend = await mockBackend(page); await page.goto('/task/7');
  const input = page.locator('input[type=file][multiple]'); await expect(input).toBeEnabled();
  await input.setInputFiles({ name: 'invalid.pdf', mimeType: 'application/pdf', buffer: Buffer.from('invalid') });
  await expect(page.getByRole('alert')).toContainText('Выберите фотографию');
  expect(backend.calls.some(path => /reserve_task_attachment|storage/.test(path))).toBe(false);
});
