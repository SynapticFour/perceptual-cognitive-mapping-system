import { test, expect } from '@playwright/test';
import { resultsPlaywrightStorage } from './fixtures/results-playwright-storage';

test.describe('Results visualisation', () => {
  test.use({ storageState: resultsPlaywrightStorage });

  test('results layout at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/results');
    await page.waitForSelector('main#main-content', { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1, name: /Your cognitive profile/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({ path: 'e2e/screenshots/results-375.png', fullPage: true });
  });

  test('results layout at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/results');
    await page.waitForSelector('main#main-content', { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1, name: /Your cognitive profile/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.screenshot({ path: 'e2e/screenshots/results-1280.png', fullPage: true });
  });
});
