import { test, expect } from '@playwright/test';

// Runs under the `authenticated` Playwright project (storageState: USER_AUTH_FILE),
// so both `page` and the built-in `request` fixture carry a signed-in free-tier
// user's session cookie. This is required for the /api/orders check below: it
// must prove a genuinely signed-in user is rejected while the flag is dark, not
// merely that an unauthenticated request is rejected (that's already covered by
// e2e/lifetime-pricing.spec.ts under the `guest` project).
test.describe('dark features are invisible and unreachable', () => {
  test('no fresher track entry on landing or roadmap', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/fresher path/i)).toHaveCount(0);
    await page.goto('/roadmap');
    await expect(page.getByText(/fresher/i)).toHaveCount(0);
  });

  test('lifetime order API rejects a signed-in user while dark', async ({ request }) => {
    const res = await request.post('/api/orders', { data: { planType: 'lifetime' } });
    expect(res.status()).toBe(403);
  });
});
