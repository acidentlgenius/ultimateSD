import { test, expect } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import {
  ADAPTIVE_COACH_TIP,
  mockAiCoachTurnAdaptive,
} from './helpers/ai-mocks';
import { grantFlagToE2eUser, removeFlagOverrideForE2eUser } from './helpers/flags';
import {
  dismissProblemIntroIfVisible,
  submitCurrentStep,
  submitFunctionalRequirements,
  waitForSubmitAnswerButton,
} from './helpers/practice-flow';
import { seedE2eUser } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

test.describe('Adaptive coach teach_forward (flag granted)', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
    await grantFlagToE2eUser('adaptiveCoach');
  });

  test.afterAll(async () => {
    await removeFlagOverrideForE2eUser('adaptiveCoach');
    await seedE2eUser({ resetProgress: true });
  });

  test.beforeEach(async ({ page }) => {
    await suppressFirstRunUx(page);
    await mockAiCoachTurnAdaptive(page);
  });

  test('low scores retry then teach_forward tip unblocks the step', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/practice/design-tinyurl');
    await expect(page.getByText('Functional Requirements').first()).toBeVisible();
    await dismissProblemIntroIfVisible(page);
    await expect(
      page.getByText(/List the core features for TinyURL./i).first(),
    ).toBeVisible({ timeout: 15_000 });
    await waitForSubmitAnswerButton(page);

    // Attempts 1–2: gate retry — modal shows Try Again, no infinite pass loop.
    await submitFunctionalRequirements(page);
    await expect(page.getByRole('heading', { name: 'Keep Practicing' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
    await page.getByRole('button', { name: 'Try Again' }).click();

    // Attempt 2: retry with persisted answers.
    await submitCurrentStep(page);
    await expect(page.getByRole('heading', { name: 'Keep Practicing' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Try Again' }).click();

    // Attempt 3: teach_forward — coach tip toast + continue despite low score.
    await submitCurrentStep(page);
    await expect(page.getByRole('heading', { name: 'Keep Practicing' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(ADAPTIVE_COACH_TIP)).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole('button', { name: 'Continue with coach tip' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Continue with coach tip' }).click();
    await expect(page.getByText('Scale & Constraints').first()).toBeVisible();
  });
});
