import { test, expect } from '@playwright/test';
import { seedE2eUser, setFeatureFlagStateForE2e } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

// Runs under the `authenticated` Playwright project (storageState: USER_AUTH_FILE),
// so both `page` and the built-in `request` fixture carry a signed-in free-tier
// user's session cookie. This is required for the /api/orders check below: it
// must prove a genuinely signed-in user is rejected while the flag is dark, not
// merely that an unauthenticated request is rejected (that's already covered by
// e2e/lifetime-pricing.spec.ts under the `guest` project).
test.describe('dark features are invisible and unreachable', () => {
  test('lifetime order API rejects a signed-in user while dark', async ({ request }) => {
    const res = await request.post('/api/orders', { data: { planType: 'lifetime' } });
    expect(res.status()).toBe(403);
  });
});

test.describe('fresherTrack dark: zero visual change', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
    await setFeatureFlagStateForE2e('fresherTrack', []);
  });

  test('roadmap shows only the four role tracks', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page.getByRole('button', { name: 'Software Engineer' })).toBeVisible();
    await expect(page.getByText(/Fresher & Campus/i)).toHaveCount(0);
    await expect(page.getByText(/Phase 0: Foundations/i)).toHaveCount(0);
  });

  test('deep link ?track=fresher falls back to the SE track', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');
    await page.waitForURL(/track=se/);
    await expect(page.getByText(/Phase 1: Web Fundamentals/i)).toBeVisible();
    await expect(page.getByText(/Phase 0: Foundations/i)).toHaveCount(0);
  });

  test.describe('guest landing', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('hero has no fresher CTA while dark', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText(/Fresher Path/i)).toHaveCount(0);
      // Senior hero is byte-identical: original CTAs still present.
      await expect(page.getByRole('link', { name: /Start Exploring/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Free Canvas/i })).toBeVisible();
    });
  });
});
