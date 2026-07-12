import { test, expect } from '@playwright/test';
import { mockAiEvaluate } from './helpers/ai-mocks';

// Deliberately does NOT call suppressFirstRunUx — the overlay is the subject.
// Only the tour/hint keys are pre-set so they don't stack after dismissal.
test.describe('Problem intro overlay', () => {
  test.beforeEach(async ({ page }) => {
    await mockAiEvaluate(page);
    await page.addInitScript(() => {
      localStorage.setItem('sd_practice_tour_done_v1', '1');
      localStorage.setItem('sd_first_step_hint_dismissed', '1');
    });
  });

  test('auto-shows once, dismisses, and reopens via Problem brief', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');

    const overlay = page.getByTestId('problem-intro-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay.getByText(/The scenario/i)).toBeVisible();
    await expect(overlay.getByText(/Your journey/i)).toBeVisible();
    await expect(overlay.getByRole('heading', { name: /Key concepts/i })).toBeVisible();

    await overlay.getByRole('button', { name: /Start solving/i }).click();
    await expect(overlay).toBeHidden();

    await page.getByRole('button', { name: /Problem brief/i }).click();
    await expect(overlay).toBeVisible();
    await overlay.getByRole('button', { name: /Start solving/i }).click();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible();
    await expect(page.getByTestId('problem-intro-overlay')).toBeHidden();
  });

  test('step interaction hint renders under the prompt', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sd_problem_intro_suppress_all', '1');
    });
    await page.goto('/practice/design-tinyurl');
    await expect(page.getByTestId('step-interaction-hint')).toBeVisible();
  });
});
