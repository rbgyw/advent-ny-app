import { test, expect } from '@playwright/test';
import { mockBackend } from './fixture';

test('login and registration request email codes without password fields', async ({ page }) => {
  await mockBackend(page, { authenticated: false });
  const requests: Record<string, unknown>[] = [];
  await page.route('**/auth/v1/otp', async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: {} });
  });
  await page.goto('/auth?mode=login');
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await page.locator('#login-email').fill('audit@geropharm.com');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.locator('#verification-digit-0')).toBeVisible();
  expect(requests[0]).toMatchObject({ email: 'audit@geropharm.com', create_user: false });
  await page.getByRole('button', { name: 'Вернуться ко входу' }).click();
  await page.getByRole('button', { name: 'Нет аккаунта? Зарегистрироваться' }).click();
  await expect(page.locator('input[type=password]')).toHaveCount(0);
  await page.locator('#register-name').fill('Тестовый сотрудник');
  await page.locator('#register-email').fill('audit@geropharm.com');
  await page.locator('#register-workplace').selectOption('ПП Оптиков');
  const before = await page.locator('.auth-consent').boundingBox();
  await page.locator('#register-consent').check();
  const after = await page.locator('.auth-consent').boundingBox();
  expect(after!.height).toBeLessThan(before!.height);
  await page.getByRole('button', { name: 'Зарегистрироваться', exact: true }).click();
  await expect(page.locator('#verification-digit-0')).toBeVisible();
  expect(requests[1]).toMatchObject({ create_user: true, data: { full_name: 'Тестовый сотрудник', workplace: 'ПП Оптиков' } });
});

test('desktop headings and image-search boards fit their intended areas', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await mockBackend(page);
  for (const day of [8, 10, 11, 20, 21, 22, 23]) {
    await page.goto(`/task/${day}`);
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    const geometry = await heading.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { height: rect.height, lineHeight: parseFloat(style.lineHeight), right: rect.right };
    });
    expect(geometry.height, `day ${day} heading`).toBeLessThanOrEqual(geometry.lineHeight + 2);
    expect(geometry.right).toBeLessThanOrEqual(1366);
  }
  const sky = await page.goto('/task/20').then(async () => {
    await expect(page.locator('.guiding-sky')).toBeVisible();
    return page.locator('.guiding-sky').boundingBox();
  });
  expect(sky!.height).toBeLessThanOrEqual(672);
  await page.goto('/task/19');
  await page.getByRole('button', { name: 'Начать', exact: true }).click();
  const scene = await page.locator('.search-scene').boundingBox();
  expect(scene!.height).toBeLessThanOrEqual(528);
  await page.screenshot({ path: '/tmp/advent-review-19-desktop.png', fullPage: true });
});
