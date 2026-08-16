import { test, expect } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';

test.beforeEach(async ({ page }) => {
  await suppressFirstRunUx(page);
});

test.describe('Guest smoke', () => {
  test('home page loads for visitors', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /Master Systems/i }),
    ).toBeVisible();
    // Removed because MostAskedSection is not currently rendered on the home page
    // await expect(page.getByText(/Popular at top companies/i)).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(
      page.getByRole('heading', { name: /Simple, transparent pricing/i }),
    ).toBeVisible();
  });

  test('roadmap page loads without auth', async ({ page }) => {
    await page.goto('/roadmap?track=se');
    await expect(page.getByText(/Phase 1: Web Fundamentals/i)).toBeVisible();
    await expect(page.getByText(/8-week study schedule/i)).toBeVisible();
  });

  test('login page renders sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });

  test('practice page redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.url()).toContain('callbackUrl');
  });
});
