import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resultsPlaywrightStorage } from './fixtures/results-playwright-storage';

test.describe('Results accessibility', () => {
  test.use({ storageState: resultsPlaywrightStorage });

  test('seeded /results has no serious or critical axe violations', async ({ page }) => {
    await page.goto('/results');
    await page.waitForSelector('main#main-content', { timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1, name: /Your cognitive profile/i })).toBeVisible({
      timeout: 30_000,
    });

    const { violations } = await new AxeBuilder({ page }).exclude('#__next_error__').analyze();
    const severe = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(severe, severe.map((v) => `${v.id}: ${v.help}`).join('\n')).toEqual([]);
  });
});
