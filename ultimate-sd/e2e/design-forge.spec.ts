import { test, expect } from '@playwright/test';
import { seedE2eUser, setFeatureFlagStateForE2e } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

test.describe('designForge canvas mode', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
    await setFeatureFlagStateForE2e('designForge', [
      'free',
      'platform',
      'lifetime',
      'ai',
    ]);
  });

  test.afterAll(async () => {
    await setFeatureFlagStateForE2e('designForge', []);
  });

  test('classic practice URL stays on legacy UI', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');
    await expect(page.getByTestId('forge-practice-ui')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Submit for Review/i })).toBeVisible();
  });

  test('?canvas=forge opens immersion then canvas session', async ({ page }) => {
    await page.goto('/practice/design-tinyurl?canvas=forge');
    await expect(page.getByTestId('problem-immersion')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('start-designing')).toBeVisible();

    await page.getByTestId('start-designing').click();

    await expect(page.getByTestId('seniority-calibration')).toBeVisible();
    await page.getByRole('button', { name: 'Continue →' }).click();

    await expect(page.getByTestId('forge-practice-ui')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('journey-map')).toBeVisible();
    await expect(page.getByTestId('guidance-panel')).toBeVisible();
    await expect(page.getByTestId('forge-coach')).toBeVisible();
    await expect(page.getByTestId('forge-review-step')).toBeVisible();
  });

  test('?canvas=forge without flag shows upsell', async ({ page }) => {
    await setFeatureFlagStateForE2e('designForge', []);
    await page.goto('/practice/design-tinyurl?canvas=forge');
    await expect(page.getByText(/DesignForge Canvas/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /classic practice UI/i })).toBeVisible();
    await setFeatureFlagStateForE2e('designForge', ['free', 'platform', 'lifetime', 'ai']);
  });
});
