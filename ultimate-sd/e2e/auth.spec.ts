import { test, expect } from '@playwright/test';

test.describe('Authenticated dashboard', () => {
  test('home shows personalized dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByText('E2E', { exact: true })).toBeVisible();
  });

  test('locked premium problem opens upgrade modal', async ({ page }) => {
    await page.goto('/#problems');
    await page.getByLabel('Unlock Design Uber').click();
    await expect(page.getByRole('heading', { name: /Unlock Premium Problems/i })).toBeVisible();
    await expect(page.getByText(/Design Uber/i).first()).toBeVisible();
  });

  test('free problem card links to practice', async ({ page }) => {
    await page.goto('/#problems');
    await page.getByRole('link', { name: /Practice Design TinyURL/i }).click();
    await expect(page).toHaveURL(/\/practice\/design-tinyurl/);
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible();
  });
});
