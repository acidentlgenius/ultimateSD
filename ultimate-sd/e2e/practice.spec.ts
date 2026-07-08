import { test, expect } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import { mockAiEvaluate } from './helpers/ai-mocks';

test.describe('Practice flow', () => {
  test.beforeEach(async ({ page }) => {
    await suppressFirstRunUx(page);
    await mockAiEvaluate(page);
  });

  test('free practice page renders timer and first step', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible();
    await expect(page.getByText('Functional Requirements').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Submit for Review/i })).toBeVisible();
  });

  test('submitting a step opens feedback modal', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');

    await page.getByPlaceholder(/short URL/i).fill('Users can shorten a long URL');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Users can shorten a long URL')).toBeVisible();

    await page.getByRole('button', { name: /Submit for Review/i }).click();

    await expect(page.getByRole('heading', { name: /Great Job/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Performance Score')).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue to Next Step/i })).toBeVisible();
  });

  test('solution viewer shows confirm dialog then expert guide', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');

    await page.getByRole('button', { name: 'View Solution' }).click();
    await expect(page.getByRole('heading', { name: /View expert solution/i })).toBeVisible();
    await page.getByRole('button', { name: /View anyway/i }).click();

    await expect(page.getByText(/TinyURL \(Expert Guide\)/i)).toBeVisible();
    await expect(page.getByText(/Expert Architecture Guide/i)).toBeVisible();
  });
});
