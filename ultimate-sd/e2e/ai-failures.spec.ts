import { test, expect, type Page } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import { mockAiEvaluateFailure } from './helpers/ai-mocks';
import { seedE2eUser } from '../scripts/seed-e2e';

// AI failures must read as ERRORS (amber banner, retryable, nothing recorded),
// never as a failing answer (red feedback / score 0). Regression suite for the
// Phase 0 "truthful AI errors" work.
test.describe.configure({ mode: 'serial' });

test.describe('AI evaluation failures', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
  });

  test.afterAll(async () => {
    await seedE2eUser({ resetProgress: true });
  });

  test.beforeEach(async ({ page }) => {
    await suppressFirstRunUx(page);
  });

  async function submitFirstStep(page: Page) {
    await page.goto('/practice/design-tinyurl');
    await page.getByPlaceholder(/short URL/i).fill('Users can shorten a long URL');
    // Squash: The 'Add' button detaches from the DOM during React state updates/animations.
    // Pressing 'Enter' on the input is a more stable interaction.
    await page.getByPlaceholder(/short URL/i).press('Enter');
    await page.getByRole('button', { name: /Submit for Review/i }).click();
  }

  test('403 (no credits / API key) shows the server message, not a score', async ({ page }) => {
    await mockAiEvaluateFailure(page, 403, 'AI credits exhausted. Add an API key in Settings or upgrade for more.');
    await submitFirstStep(page);

    const banner = page.getByTestId('evaluation-error-banner');
    await expect(banner).toBeVisible({ timeout: 15_000 });
    await expect(banner).toContainText('AI credits exhausted');
    await expect(banner).toContainText('nothing was scored or recorded');
    await expect(banner.getByRole('button', { name: 'Try again' })).toBeVisible();

    // Absolutely no feedback/score UI for an infrastructure failure.
    await expect(page.getByRole('heading', { name: /Great Job/i })).toHaveCount(0);
    await expect(page.getByText(/Needs Improvement/i)).toHaveCount(0);
  });

  test('429 (rate limited) shows rate-limit copy after retries', async ({ page }) => {
    test.setTimeout(60_000); // fetchWithRetry retries 429 twice with backoff
    await mockAiEvaluateFailure(page, 429, 'The AI provider is rate-limiting requests. Wait a moment and try again.');
    await submitFirstStep(page);

    const banner = page.getByTestId('evaluation-error-banner');
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText('rate-limiting');
    await expect(page.getByRole('heading', { name: /Great Job/i })).toHaveCount(0);
  });

  test('5xx (provider down) shows temporary-problem copy and allows retry to succeed', async ({ page }) => {
    test.setTimeout(60_000);
    await mockAiEvaluateFailure(page, 502, 'The AI evaluator hit a temporary problem. Your answer was not graded — try again.');
    await submitFirstStep(page);

    const banner = page.getByTestId('evaluation-error-banner');
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText('was not graded');

    // Provider recovers → the in-banner retry produces a real (mocked) pass,
    // proving the failed attempt recorded nothing that blocks progression.
    await page.unroute('**/api/ai/evaluate');
    await page.route('**/api/ai/evaluate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          feedback: {
            score: 8,
            accuracy: 85,
            strengths: ['Good'],
            weaknesses: [],
            missed: [],
            isAcceptable: true,
          },
        }),
      });
    });
    await banner.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('heading', { name: /Great Job/i })).toBeVisible({ timeout: 15_000 });
  });

  test('network failure shows connectivity copy', async ({ page }) => {
    test.setTimeout(60_000);
    await page.route('**/api/ai/evaluate', (route) => route.abort('failed'));
    await submitFirstStep(page);

    const banner = page.getByTestId('evaluation-error-banner');
    await expect(banner).toBeVisible({ timeout: 30_000 });
    await expect(banner).toContainText(/Could not reach the server|try again/i);
    await expect(page.getByRole('heading', { name: /Great Job/i })).toHaveCount(0);
  });
});
