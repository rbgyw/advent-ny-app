import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { mockBackend } from '../tests/fixture.ts';
const baseURL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
const samples = [];
try {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
  await mockBackend(page);
  await page.goto(`${baseURL}/calendar`);
  const cdp = await page.context().newCDPSession(page);
  for (const repeat of [1, 2, 2]) {
    for (let cycle = 0; cycle < repeat; cycle++) for (const day of [4, 5, 6, 13, 21, 25]) {
      await page.locator('.calendar-window').nth(day - 1).click();
      await page.locator('main:not(.task-loading-page) h1').first().waitFor();
      await page.locator('main header button').first().click();
      await page.locator('.calendar-window').first().waitFor();
    }
    await cdp.send('HeapProfiler.collectGarbage');
    const heap = await cdp.send('Runtime.getHeapUsage');
    const dom = await cdp.send('Memory.getDOMCounters');
    samples.push({ visits: (samples.at(-1)?.visits ?? 0) + repeat * 6, js_heap_used: heap.usedSize, ...dom });
  }
} finally { await browser.close(); }
await writeFile(process.argv[2] || '/tmp/advent-memory.json', JSON.stringify({ baseURL, notes: 'One warm-up batch loads all six task chunks. Snapshots after explicit GC; JS heap is not total browser RAM.', samples }, null, 2) + '\n');
console.log(JSON.stringify(samples));
