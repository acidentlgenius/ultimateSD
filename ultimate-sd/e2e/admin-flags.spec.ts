import { test, expect } from '@playwright/test';
import { E2E_TEST_EMAIL } from './constants';

test.describe('admin feature flags', () => {
  test('admin can launch a flag to a plan and grant a user override', async ({ page }) => {
    let dialogFired = false;
    page.on('dialog', (d) => {
      dialogFired = true;
      d.accept();
    });

    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

    await page.getByRole('button', { name: 'Feature Flags' }).click();

    // aiProbe's intended plans are ['ai'] only, so enabling it for 'free'
    // is a genuine deviation and must trigger the confirm-dialog branch
    // in FeatureFlagsPanel's togglePlan.
    const aiProbeHeading = page.getByRole('heading', { level: 3, name: 'aiProbe' });
    await expect(aiProbeHeading).toBeVisible();
    const aiProbeCard = aiProbeHeading.locator('xpath=ancestor::div[contains(@class,"rounded-lg")]').first();

    // Use .click() rather than .check(): .check() polls the DOM to confirm
    // the click changed state, and that polling deadlocks against the
    // blocking native confirm() dialog. .click() just dispatches the click
    // and lets the page.on('dialog') handler above resolve it, after which
    // we assert the eventual checked state separately.
    const aiProbeFreeCheckbox = aiProbeCard.getByLabel('Free', { exact: true });
    await aiProbeFreeCheckbox.click();
    await expect(aiProbeFreeCheckbox).toBeChecked();
    expect(dialogFired).toBe(true);
    // The panel disables every checkbox on every flag card while the
    // server-action transition for the click above is pending. Wait for it
    // to re-enable before interacting with another card, otherwise the next
    // click lands on a disabled input and is a no-op.
    await expect(aiProbeFreeCheckbox).toBeEnabled();

    // fresherTrack's intended plans already include 'free', so this
    // exercises the non-deviating (no-confirm) path and the override grant.
    const flagHeading = page.getByRole('heading', { level: 3, name: 'fresherTrack' });
    await expect(flagHeading).toBeVisible();
    const flagCard = flagHeading.locator('xpath=ancestor::div[contains(@class,"rounded-lg")]').first();

    // Same reasoning as aiProbe above: use .click() + a separate assertion
    // rather than .check(), since .check()'s own "did the click take effect"
    // poll can sample a transient un-checked frame mid-transition.
    const freeCheckbox = flagCard.getByLabel('Free', { exact: true });
    await expect(freeCheckbox).toBeEnabled();
    await freeCheckbox.click();
    await expect(freeCheckbox).toBeChecked();

    await flagCard.getByPlaceholder('user@example.com').fill(E2E_TEST_EMAIL);
    await flagCard.getByRole('button', { name: 'Grant' }).click();

    await expect(flagCard.getByText(E2E_TEST_EMAIL)).toBeVisible();
    await expect(flagCard.getByText('granted', { exact: true })).toBeVisible();
  });
});
