import { test, expect } from '@playwright/test';
import { seedE2eUser } from '../scripts/seed-e2e';

test.describe.serial('Roadmap progress unlocks', () => {
  test('completing TinyURL unlocks the next roadmap step', async ({ page }) => {
    await seedE2eUser({ tinyUrlCompleted: true, resetProgress: true });

    await page.goto('/roadmap?track=se');

    await expect(page.getByRole('heading', { name: /Phase 1: Web Fundamentals/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Design TinyURL' })).toBeVisible();

    const restApiCard = page.getByRole('heading', { name: 'Design a REST API' });
    await expect(restApiCard).toBeVisible();

    const restApiRow = restApiCard.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    await expect(restApiRow.locator('svg.lucide-lock')).toHaveCount(0);
    await expect(restApiRow.getByRole('link', { name: /Solve Challenge/i })).toBeVisible();
  });

  test('without progress, the next roadmap step stays locked', async ({ page }) => {
    await seedE2eUser({ tinyUrlCompleted: false, resetProgress: true });

    await page.goto('/roadmap?track=se');

    const restApiCard = page.getByRole('heading', { name: 'Design a REST API' });
    await expect(restApiCard).toBeVisible();

    const restApiRow = restApiCard.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")]').first();
    await expect(restApiRow.locator('svg.lucide-lock')).toBeVisible();
  });
});
