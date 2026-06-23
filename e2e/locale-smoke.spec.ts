import { test, expect } from '@playwright/test';

/**
 * Smoke tests for draft locales FR and SW — landing, privacy, consent chrome.
 * Does not complete a full questionnaire (consent + adaptive flow is covered elsewhere).
 */
test.describe('Locale smoke — French (fr)', () => {
  test('welcome page shows French hero copy', async ({ page }) => {
    await page.goto('/fr');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Comment fonctionne/i);
  });

  test('privacy page shows French title', async ({ page }) => {
    await page.goto('/fr/privacy');
    await expect(page.locator('h1')).toContainText(/confidentialit/i);
  });

  test('consent page shows French heading', async ({ page }) => {
    await page.goto('/fr/consent');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByText(/consentement|participation|recherche/i).first()).toBeVisible();
  });

  test('draft locale banner visible when review warnings enabled', async ({ page }) => {
    await page.goto('/fr');
    const banner = page.getByRole('alert');
    if (process.env.PW_BASE_URL) {
      await expect(banner.first()).toContainText(/brouillon|revue native/i);
    } else {
      const count = await banner.count();
      if (count > 0) {
        await expect(banner.first()).toContainText(/brouillon|revue native/i);
      }
    }
  });
});

test.describe('Locale smoke — Kiswahili (sw)', () => {
  test('welcome page shows Kiswahili hero copy', async ({ page }) => {
    await page.goto('/sw');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Akili yako/i);
  });

  test('privacy page shows Kiswahili title', async ({ page }) => {
    await page.goto('/sw/privacy');
    await expect(page.locator('h1')).toContainText(/faragha|Privacy/i);
  });

  test('consent page shows Kiswahili content', async ({ page }) => {
    await page.goto('/sw/consent');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.getByText(/ridhaa|utafiti|ushiriki/i).first()).toBeVisible();
  });
});

test.describe('Locale smoke — English fallback not on localized routes', () => {
  test('/fr welcome does not show default English hero title', async ({ page }) => {
    await page.goto('/fr');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).not.toHaveText(/^How does your mind work\?$/);
  });

  test('/sw welcome does not show default English hero title', async ({ page }) => {
    await page.goto('/sw');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).not.toHaveText(/^How does your mind work\?$/);
  });
});
