import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1,
  use: { baseURL: process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173', viewport: { width: Number(process.env.AUDIT_VIEWPORT_WIDTH || 393), height: Number(process.env.AUDIT_VIEWPORT_HEIGHT || 852) }, launchOptions: { executablePath: process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined), args: ['--no-sandbox'] } },
});
