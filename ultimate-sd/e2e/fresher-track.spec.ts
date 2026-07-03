import { test, expect } from '@playwright/test';
import { seedE2eUser, setFeatureFlagStateForE2e } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

test.describe('fresher track when the flag is enabled', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
    await setFeatureFlagStateForE2e('fresherTrack', [
      'free',
      'platform',
      'lifetime',
      'ai',
    ]);
  });

  test.afterAll(async () => {
    // Restore dark launch so flag-gating.spec.ts and reruns start clean.
    await setFeatureFlagStateForE2e('fresherTrack', []);
  });

  test('fresher track is selectable and shows the full curriculum', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');

    await expect(
      page.getByRole('button', { name: /Fresher & Campus/i }),
    ).toBeVisible();
    await expect(page.getByText(/Phase 0: Foundations/i)).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'What Is System Design?' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Design a Parking Lot' }),
    ).toBeVisible();
    await expect(page.getByText(/Phase 4: Interview Ready/i)).toBeVisible();
  });

  test('first fresher problem is unlocked and navigable despite Phase 0 concepts', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');

    const parkingHeading = page.getByRole('heading', { name: 'Design a Parking Lot' });
    await expect(parkingHeading).toBeVisible();

    const parkingCard = parkingHeading
      .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]')
      .first();
    await expect(parkingCard.locator('svg.lucide-lock')).toHaveCount(0);

    await parkingCard.click(); // expand the card
    await parkingCard.getByRole('link', { name: /Solve Challenge/i }).click();
    await page.waitForURL(/\/practice\/design-parking-lot/);
  });

  test('fresher 8-week schedule renders for the track', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');
    await expect(page.getByText(/Foundations first/i)).toBeVisible();
    await expect(page.getByText(/Interview ready/i).first()).toBeVisible();
  });

  test.describe('guest hero', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('hero shows the fresher split CTA for guests when the flag is on', async ({ page }) => {
      await page.goto('/');
      const cta = page.getByRole('link', {
        name: /Starting from zero\? Fresher Path/i,
      });
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('href', '/roadmap?track=fresher');
      // Senior message is untouched.
      await expect(page.getByRole('link', { name: /Start Exploring/i })).toBeVisible();
    });
  });
});
