import { test, expect } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
test('initial JavaScript stays within budget and Supabase remains outside the public static graph', async () => {
  const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8')) as Record<string, { file: string; imports?: string[] }>;
  const seen = new Set<string>();
  function visit(key: string) { if (seen.has(key)) return; seen.add(key); for (const dependency of manifest[key]?.imports || []) visit(dependency); }
  visit('index.html');
  expect([...seen].some(key => /auth|supabase/i.test(key))).toBe(false);
  const bytes = (await Promise.all([...seen].map(key => stat(`dist/${manifest[key]!.file}`)))).reduce((sum, item) => sum + item.size, 0);
  expect(bytes).toBeLessThan(150_000);
});
