import { test, expect } from '@playwright/test';
import { mockAiEvaluate } from './helpers/ai-mocks';

// Deliberately does NOT call suppressFirstRunUx — the intro step is the subject.
test.describe('Problem intro step', () => {
  test.beforeEach(async ({ page }) => {
    await mockAiEvaluate(page);
    await page.addInitScript(() => {
      localStorage.setItem('sd_practice_tour_done_v1', '1');
      localStorage.setItem('sd_first_step_hint_dismissed', '1');
    });
  });

  test('shows as first step, dismisses, and reopens via Problem brief', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');

    const intro = page.getByTestId('problem-intro-step');
    await expect(intro).toBeVisible();
    await expect(intro.getByText(/The scenario/i)).toBeVisible();
    await intro.getByRole('button', { name: /How to practice/i }).hover();
    await expect(intro.getByTestId('how-to-practice-tip')).toContainText(/How to practice/i);
    await expect(intro.getByText(/Your journey/i)).toHaveCount(0);

    await intro.getByRole('button', { name: /I'm ready/i }).click();
    await expect(intro).toBeHidden();
    await expect(page.getByText('Problem Brief')).toHaveCount(0);

    // Open menu tab on desktop to reach Problem brief
    await page.getByRole('button', { name: /Open menu/i }).click();
    await page.getByRole('button', { name: /Problem brief/i }).click();
    await expect(intro).toBeVisible();
    await intro.getByRole('button', { name: /I'm ready/i }).click();

    await page.reload();
    await expect(page.getByTestId('problem-intro-step')).toBeHidden();
  });

  test('step interaction hint shows on bulb hover', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sd_problem_intro_suppress_all', '1');
    });
    await page.goto('/practice/design-tinyurl');
    await page.getByRole('button', { name: 'Step tip' }).hover();
    await expect(page.getByTestId('step-interaction-hint')).toBeVisible();
    await expect(page.getByTestId('step-interaction-hint')).toContainText('Add one idea per line');
  });
});
