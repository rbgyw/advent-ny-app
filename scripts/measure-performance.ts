// Local laboratory measurements. All Auth/Database requests are mocked; no production traffic.
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { mockBackend } from '../tests/fixture.ts';
const baseURL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173';
const output = process.argv[2] || '/tmp/advent-performance.json';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] });
const samples: Record<string, unknown>[] = [];
try {
  for (const path of ['/', '/calendar', '/task/25']) for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const backend = await mockBackend(page, { delay: 150 });
    await page.addInitScript(() => {
      const metrics = { lcp_ms: 0, cls: 0, long_tasks: [] as number[], event_durations: [] as number[] };
      (window as unknown as { auditMetrics: typeof metrics }).auditMetrics = metrics;
      let first = 0, last = 0, windowScore = 0;
      new PerformanceObserver(list => { for (const entry of list.getEntries()) metrics.lcp_ms = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[]) {
        if (entry.hadRecentInput) continue;
        if (entry.startTime - last > 1000 || entry.startTime - first > 5000) { first = entry.startTime; windowScore = 0; }
        windowScore += entry.value; last = entry.startTime; metrics.cls = Math.max(metrics.cls, windowScore);
      } }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries()) metrics.long_tasks.push(entry.duration); }).observe({ type: 'longtask', buffered: true });
      new PerformanceObserver(list => { for (const entry of list.getEntries() as (PerformanceEntry & { interactionId: number })[]) if (entry.interactionId) metrics.event_durations.push(entry.duration); }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 93_750 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.locator(path === '/calendar' ? '.calendar-intro' : 'h1').first().waitFor();
    await page.waitForTimeout(1000);
    const initial = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const metrics = (window as unknown as { auditMetrics: Record<string, unknown> }).auditMetrics;
      return { ...metrics, resource_requests: resources.length, transferred_bytes: resources.reduce((sum, resource) => sum + resource.transferSize, 0), timing_visible_js_bytes: resources.filter(resource => new URL(resource.name).pathname.endsWith('.js')).reduce((sum, resource) => sum + resource.encodedBodySize, 0), observed_at_ms: performance.now() };
    });
    const initialBackendRequests = backend.calls.length;
    if (path === '/calendar') await page.locator('.calendar-window').nth(24).click();
    else if (path === '/task/25') await page.getByRole('button', { name: 'Открыть печеньку' }).click();
    else await page.getByRole('link', { name: 'Начать', exact: true }).click();
    await page.waitForTimeout(500);
    const events = await page.evaluate(() => (window as unknown as { auditMetrics: { event_durations: number[] } }).auditMetrics.event_durations);
    samples.push({ path, run, ...initial, backend_requests: initialBackendRequests, sampled_interaction_ms: events.length ? Math.max(...events) : null });
    console.log(JSON.stringify(samples.at(-1)));
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(output, JSON.stringify({ conditions: { baseURL, viewport: '393x852', cpuSlowdown: 4, latencyMs: 150, downloadBytesPerSecond: 200000, backend: 'local fixtures, 150ms per call', cache: 'cold contexts; routing disables HTTP cache', samplesPerRoute: 3 }, samples }, null, 2) + '\n');
