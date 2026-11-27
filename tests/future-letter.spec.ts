import { test, expect } from '@playwright/test';
import { mockBackend, userId } from './fixture';

for (const lostResponse of [false, true]) {
  test(`future letter uses the atomic RPC and restores its schedule (lost response: ${lostResponse})`, async ({ page }) => {
    const backend = await mockBackend(page);
    const due = '2026-11-27T12:15:00Z';
    const metadata = { letter_id: 'letter-1', deliver_on: due, scheduled: true };
    await page.route('**/auth/v1/user', route => route.fulfill({ json: {
      id: userId, email: 'audit@geropharm.com', email_confirmed_at: '2026-01-01T00:00:00Z',
      aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z',
    } }));
    let submissions = 0;
    await page.route('**/rest/v1/rpc/submit_future_letter', async route => {
      expect(route.request().postDataJSON()).toEqual({ p_body: 'Привет будущему себе' });
      const already = backend.completed.has(16); submissions++;
      backend.completed.add(16); backend.responses[16] = metadata;
      if (lostResponse && submissions === 1) {
        await route.fulfill({ status: 503, json: { message: 'Lost response after commit' } }); return;
      }
      await route.fulfill({ json: { letter_id: 'letter-1', task_id: 16, status: 'completed', due_at: due,
        already_submitted: already, ...(!already && { completed_at: '2026-11-27T12:00:00Z', response: metadata }) } });
    });
    await page.goto('/task/16');
    await expect(page.locator('input[type="email"]')).toHaveValue('audit@geropharm.com');
    await expect(page.locator('input[type="email"]')).toHaveAttribute('readonly', '');
    await page.locator('textarea').fill('Привет будущему себе');
    await page.getByRole('button', { name: 'Отправить в будущее' }).click();
    if (lostResponse) {
      await expect(page.getByRole('alert')).toContainText('Повторите запрос');
      await expect(page.locator('textarea')).toHaveValue('Привет будущему себе');
      await expect(page.getByText('Письмо сохранено.', { exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Отправить в будущее' }).click();
    }
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog')).toContainText('27 ноября 2026');
    await expect(page.getByRole('dialog')).toContainText('15:15 (МСК)');
    await page.getByRole('button', { name: 'Закрыть', exact: true }).click();
    await page.reload();
    await expect(page.getByText('Письмо сохранено.', { exact: true })).toBeVisible();
    await expect(page.locator('.future-form').getByText(/Запланированная отправка:/)).toContainText('15:15 (МСК)');
    expect(submissions).toBe(lostResponse ? 2 : 1);
    expect(backend.calls.some(path => path.endsWith('/save_task_progress'))).toBe(false);
  });
}
