import { test, expect } from '@playwright/test';

test.describe('interview hub', () => {
  test('/interview is visible to signed-in users even when flag is dark', async ({ page }) => {
    await page.goto('/interview');
    await expect(page.getByRole('heading', { name: /interview hub/i })).toBeVisible();
    const seePlans = page.getByRole('link', { name: /see plans/i });
    await expect(seePlans.first()).toBeVisible();
    await expect(seePlans.first()).toHaveAttribute('href', '/pricing?feature=interviewMode');
  });
});
