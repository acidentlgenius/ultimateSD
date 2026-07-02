import { test, expect } from '@playwright/test';
import { E2E_TEST_EMAIL } from './constants';

test.describe('admin feature flags', () => {
  test('admin can launch a flag to a plan and grant a user override', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

    await page.getByRole('button', { name: 'Feature Flags' }).click();

    const flagHeading = page.getByRole('heading', { level: 3, name: 'fresherTrack' });
    await expect(flagHeading).toBeVisible();
    const flagCard = flagHeading.locator('xpath=ancestor::div[contains(@class,"rounded-lg")]').first();

    const freeCheckbox = flagCard.getByLabel('Free', { exact: true });
    await freeCheckbox.check();
    await expect(freeCheckbox).toBeChecked();

    await flagCard.getByPlaceholder('user@example.com').fill(E2E_TEST_EMAIL);
    await flagCard.getByRole('button', { name: 'Grant' }).click();

    await expect(flagCard.getByText(E2E_TEST_EMAIL)).toBeVisible();
    await expect(flagCard.getByText('granted', { exact: true })).toBeVisible();
  });
});
