import { expect, test } from '@playwright/test';
import { mockBackend, userId } from './fixture';

// Run against the corresponding locally built VITE_* mode. All Auth/mail calls are mocked.
const corporateOnly = process.env.AUDIT_CORPORATE_EMAIL !== 'false';
const email = 'qa@example.org';

for (const mode of ['login', 'register'] as const) {
  test(`${mode} applies the email policy and keeps OTP confirmation`, async ({ page }) => {
    await mockBackend(page, { authenticated: false });
    const otp: Record<string, unknown>[] = [];
    await page.route('**/auth/v1/otp*', async route => {
      otp.push(route.request().postDataJSON());
      await route.fulfill({ json: {} });
    });
    await page.route('**/auth/v1/verify', async route => {
      expect(route.request().postDataJSON()).toMatchObject({ email, token: '123456', type: 'email' });
      await route.fulfill({ json: {
        access_token: 'local-audit-token', refresh_token: 'local-refresh-token', expires_in: 3600, token_type: 'bearer',
        user: { id: userId, email, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} },
      } });
    });
    await page.goto(`/auth?mode=${mode}`);
    if (mode === 'register') {
      await page.locator('#register-name').fill('Тестовый пользователь');
      await page.locator('#register-workplace').selectOption('Другое');
      await page.locator('#register-consent').check();
    }
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByRole('button', { name: mode === 'register' ? 'Зарегистрироваться' : 'Войти', exact: true }).click();
    if (corporateOnly) {
      await expect(page.getByRole('alert')).toContainText('корпоративную');
      expect(otp).toHaveLength(0);
      await expect(page.locator('#verification-digit-0')).toHaveCount(0);
    } else {
      await expect(page.locator('#verification-digit-0')).toBeVisible();
      expect(otp).toHaveLength(1);
      expect(otp[0]).toMatchObject({ email, create_user: mode === 'register' });
      await page.locator('#verification-digit-0').fill('123456');
      await page.getByRole('button', { name: 'Подтвердить', exact: true }).click();
      await expect(page).toHaveURL(/\/calendar$/);
    }
  });
}

test('future letter uses only the confirmed account address and atomic RPC', async ({ page }) => {
  const backend = await mockBackend(page);
  const accountEmail = corporateOnly ? 'audit@geropharm.com' : email;
  const due = '2026-11-27T12:15:00Z';
  const metadata = { letter_id: 'letter-1', deliver_on: due, scheduled: true };
  const submissions: Record<string, unknown>[] = [];
  await page.route('**/auth/v1/user', route => route.fulfill({ json: {
    id: userId, email: accountEmail, email_confirmed_at: '2026-01-01T00:00:00Z',
    aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z',
  } }));
  await page.route('**/rest/v1/rpc/submit_future_letter', async route => {
    submissions.push(route.request().postDataJSON());
    backend.completed.add(16); backend.responses[16] = metadata;
    await route.fulfill({ json: { letter_id: 'letter-1', task_id: 16, status: 'completed', due_at: due,
      already_submitted: false, completed_at: '2026-11-27T12:00:00Z', response: metadata } });
  });
  await page.goto('/task/16');
  await expect(page.locator('input[type=email]')).toHaveValue(accountEmail);
  await expect(page.locator('input[type=email]')).toHaveAttribute('readonly', '');
  await page.locator('textarea').fill('Тестовое письмо в будущее');
  await page.getByRole('button', { name: 'Отправить в будущее', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(submissions).toEqual([{ p_body: 'Тестовое письмо в будущее' }]);
  expect(backend.responses[16]).toEqual(metadata);
  expect(backend.calls.some(path => path.endsWith('/save_task_progress'))).toBe(false);
  await page.reload();
  await expect(page.getByText('Письмо сохранено.', { exact: true })).toBeVisible();
  await expect(page.locator('.future-form')).toContainText('15:15 (МСК)');
});

test('gratitude validates an external recipient with a mocked Edge Function', async ({ page }) => {
  await mockBackend(page);
  const sends: Record<string, unknown>[] = [];
  await page.route('**/functions/v1/send-gratitude', async route => {
    sends.push(route.request().postDataJSON());
    await route.fulfill({ json: { sent: true } });
  });
  await page.goto('/task/8');
  await page.getByLabel('От кого', { exact: true }).fill('Тестовый автор');
  await page.getByLabel('Кому', { exact: true }).fill(email);
  await page.getByLabel('Ваша благодарность').fill('Спасибо за помощь!');
  await page.getByRole('button', { name: 'Отправить благодарность', exact: true }).click();
  if (corporateOnly) {
    await expect(page.getByRole('alert')).toContainText('корпоративную');
    expect(sends).toHaveLength(0);
  } else {
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(sends).toHaveLength(1);
    expect(sends[0]).toMatchObject({ recipient: email, taskId: 8 });
    expect(sends[0]?.requestId).toBeTruthy();
  }
});
