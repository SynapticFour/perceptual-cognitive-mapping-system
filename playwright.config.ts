import { defineConfig, devices } from '@playwright/test';

const useDevServer = process.env.PW_DEV === '1';
/** CI runs `npm run build` first; skip the duplicate build inside Playwright. */
const reuseBuild = process.env.PW_REUSE_BUILD === '1';
/** Dedicated port so e2e does not collide with a developer `next dev` on :3000. */
const port = process.env.PLAYWRIGHT_PORT ?? '3040';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: 'e2e',
  /** Default 30s caps `waitForSelector({ timeout: 60_000 })`; results boot + chart chunk need headroom. */
  timeout: 120_000,
  /** `next start` is single-threaded; serial e2e avoids flaky chunk loads under burst traffic. */
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: !process.env.CI,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: useDevServer
    ? {
        command: `npx next dev -p ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : {
        command: reuseBuild ? `npx next start -p ${port}` : `npm run build && npx next start -p ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: reuseBuild ? 60_000 : 300_000,
      },
});
