import { test, expect } from '@playwright/test';
import { mockBackend } from './fixture';

test.skip(process.env.AUDIT_APACHE !== '1', 'Requires real Apache; run npm run test:apache after building');

test('Apache serves deep routes without caching the application HTML', async ({ request }) => {
  for (const path of ['/', '/index.html', '/calendar', '/auth', '/task/4']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(await response.text()).toContain('id="app"');
  }
});

test('Apache returns real 404 for missing static files and caches only fingerprinted assets', async ({ request }) => {
  for (const path of ['/assets/missing-aBcDe123.js', '/assets/missing-aBcDe123.css', '/assets/missing-aBcDe123.svg', '/assets/missing', '/collections/missing.json', '/images/missing.png']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(await response.text()).not.toContain('id="app"');
    expect(response.headers()['cache-control'] ?? '').not.toContain('immutable');
  }
  const html = await (await request.get('/')).text();
  const source = html.match(/src="(\/assets\/index-[^" ]+\.js)"/)![1];
  const script = await request.get(source);
  expect(script.status()).toBe(200);
  expect(script.headers()['content-type']).toContain('javascript');
  expect(script.headers()['cache-control']).toContain('immutable');
  const catalog = await request.get('/collections/videos.json');
  expect(catalog.headers()['cache-control']).toBe('no-cache');
});

test('authorized task 4 survives an actual Apache history-route refresh', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/task/4');
  await expect(page.locator('.crossword-page')).toBeVisible();
  await page.reload();
  await expect(page.locator('.crossword-page')).toBeVisible();
  await expect(page.locator('.screen-loader')).toHaveCount(0);
});

test('HTML refresh sees a new publication while the old tab can still fetch an old chunk', async ({ page, request }) => {
  const { readFile, writeFile, rename } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  const root = process.env.AUDIT_DOCUMENT_ROOT!;
  const index = resolve(root, 'index.html');
  const original = await readFile(index, 'utf8');
  const oldChunk = '/assets/deployment-before-00000001.js';
  const newChunk = '/assets/deployment-after-00000002.js';
  await writeFile(resolve(root, oldChunk.slice(1)), 'export const version = "before";');
  await mockBackend(page);
  await page.goto('/calendar');
  await expect(page.locator('.calendar-page')).toBeVisible();
  try {
    // Simulate the SFTP protocol: finish new assets, then replace index atomically.
    await writeFile(resolve(root, newChunk.slice(1)), 'export const version = "after";');
    await writeFile(index + '.upload', original.replace('</head>', '<meta name="audit-publication" content="after"></head>'));
    await rename(index + '.upload', index);
    // The already-open tab may first request this lazy chunk after publication.
    expect(await page.evaluate(async url => (await import(/* @vite-ignore */ url)).version, oldChunk)).toBe('before');
    expect((await request.get(newChunk)).status()).toBe(200);
    await page.reload();
    await expect(page.locator('meta[name="audit-publication"]')).toHaveAttribute('content', 'after');
    await expect(page.locator('.calendar-page')).toBeVisible();
  } finally {
    await writeFile(index, original);
  }
});
