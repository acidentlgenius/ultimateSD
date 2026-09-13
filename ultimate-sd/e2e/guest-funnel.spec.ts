import { test, expect } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import { E2E_TEST_EMAIL, E2E_TEST_PASSWORD } from './constants';
import { seedE2eUser } from '../scripts/seed-e2e';

// The anonymous acquisition funnel: landing → honest login gate → callback
// lands the user back on the problem they picked. Login is required for all
// practice (no guest sessions, by product decision) — the funnel's job is to
// never lose the user's place.
test.describe('Anonymous funnel', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
  });

  test.beforeEach(async ({ page }) => {
    await suppressFirstRunUx(page);
  });

  test('landing shows the beginner track and honest problem CTAs', async ({ page }) => {
    await page.goto('/');

    // Start Here track with its CTA
    // await expect(page.getByRole('heading', { name: /New here\? Start with these five/i })).toBeVisible();
    // await expect(page.getByTestId('start-here-cta')).toBeVisible();

    // Hero primary CTA points at a real destination
    const heroCta = page.getByRole('link', { name: /Start Solving/i });
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute('href', '/practice/design-tinyurl');

    // Problem cards tell anonymous visitors the truth
    await expect(page.getByLabel(/Sign in to practice Design TinyURL/i)).toBeVisible();
  });

  test('free problem → login gate with callbackUrl → lands back on the problem', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Start Solving/i }).click();

    // Hard gate, place preserved
    await page.waitForURL(/\/login\?callbackUrl=/);
    expect(decodeURIComponent(page.url())).toContain('/practice/design-tinyurl');

    // Sign in → back to the exact problem, not the homepage
    await page.getByLabel('Email').fill(E2E_TEST_EMAIL);
    await page.getByLabel('Password').fill(E2E_TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.waitForURL(/\/practice\/design-tinyurl/, { timeout: 30_000 });
    await expect(page).toHaveURL(/\/practice\/design-tinyurl/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible({ timeout: 15_000 });
  });
});
