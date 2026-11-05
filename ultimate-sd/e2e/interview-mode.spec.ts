import { test, expect } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import { mockAiEvaluate, mockInterviewSummary } from './helpers/ai-mocks';
import { grantFlagToE2eUser, removeFlagOverrideForE2eUser } from './helpers/flags';
import { seedE2eUser } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

test.describe('timed interview mode (flag granted)', () => {
  test.beforeAll(async () => {
    // This test completes a design-tinyurl step and shares the same
    // ProblemProgress row (keyed by problem.id, not by interview variant) as
    // practice.spec.ts and probe.spec.ts, which also target design-tinyurl
    // for the same e2e user. Reset progress before and after so this session
    // doesn't leak completed steps into whichever spec runs next.
    await seedE2eUser({ resetProgress: true });
    await grantFlagToE2eUser('interviewMode');
  });

  test.afterAll(async () => {
    await removeFlagOverrideForE2eUser('interviewMode');
    await seedE2eUser({ resetProgress: true });
  });

  test.beforeEach(async ({ page }) => {
    await suppressFirstRunUx(page);
    await mockAiEvaluate(page);
    await mockInterviewSummary(page);
  });

  test('lite session: start, lite steps, no help, answer, end, AI debrief + PDF', async ({
    page,
  }) => {
    await page.goto('/practice/design-tinyurl');

    // Entry visible when granted
    await page.getByRole('button', { name: 'Start Interview' }).click();
    await page.getByRole('button', { name: /45-min lite/ }).click();
    await expect(page).toHaveURL(/interview=lite/);

    // Interview badge, lite step set (lite placeholder, not the custom tinyurl one),
    // and Socratic help disabled
    await expect(page.getByText('Interview · 45 min')).toBeVisible();
    await expect(page.getByPlaceholder(/compact link/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Help Assistant' })).toHaveCount(0);

    // Answer the first lite step (list input)
    await page.getByPlaceholder(/compact link/i).fill('Shorten a long URL');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: /Submit answer/i }).click();
    await expect(page.getByRole('heading', { name: /Great Job/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /Continue to Next Step/i }).click();

    // Finish early → auto summary → PDF export offered
    await page.getByRole('button', { name: 'End Interview' }).click();
    // getByText('Interview Debrief') is ambiguous while the debrief is still
    // generating: the loading copy "Generating your interview debrief…"
    // case-insensitively matches the same substring as the dialog title, so
    // scope this to the heading role to avoid a strict-mode violation.
    await expect(page.getByRole('heading', { name: 'Interview Debrief' })).toBeVisible();
    await expect(page.getByText('8/10')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Hire', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export debrief PDF/i })).toBeVisible();
  });
});
