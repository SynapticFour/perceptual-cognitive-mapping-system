import { test, expect } from '@playwright/test';

test('landing page renders', async ({ page }) => {
  await page.goto('/');
  // Copy comes from messages (welcome.title); assert primary heading, not a fixed marketing string.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
