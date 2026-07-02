import { test, expect } from '@playwright/test';

test('lifetime card is hidden while the flag is dark', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText('₹1,999')).toHaveCount(0);
});

test('lifetime order API returns 403 while dark', async ({ request }) => {
  const res = await request.post('/api/orders', { data: { planType: 'lifetime' } });
  expect([401, 403]).toContain(res.status());
});
