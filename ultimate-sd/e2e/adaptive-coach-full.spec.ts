import { test, expect, type Page } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import { grantFlagToE2eUser, removeFlagOverrideForE2eUser } from './helpers/flags';
import {
  dismissProblemIntroIfVisible,
  submitCurrentStep,
  submitFunctionalRequirements,
} from './helpers/practice-flow';
import {
  ADAPTIVE_COACH_TIP,
  mockAiCoachTurnAdaptive,
  type CoachTurnEvalMode,
} from './helpers/ai-mocks';
import { seedE2eUser } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

const evalMode: { current: CoachTurnEvalMode } = { current: 'teach_forward' };

async function passTextStep(page: Page, answer: string) {
  await dismissProblemIntroIfVisible(page);
  const answerSubmit = page.getByRole('button', { name: /Answer & submit/i });
  if (await answerSubmit.isVisible().catch(() => false)) {
    await answerSubmit.click();
    await page.waitForTimeout(500);
  }

  const submit = page.getByRole('button', { name: /Submit answer/i });
  if (!(await submit.isVisible({ timeout: 5_000 }).catch(() => false))) {
    await page.getByRole('button', { name: /^Skip$/i }).click();
    return;
  }

  const textarea = page.locator('main textarea').first();
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill(answer);
  }

  await submit.click();
  await expect(page.getByRole('heading', { name: /Great Job/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: /Continue to Next Step/i }).click();
  await page.waitForTimeout(600);
}

test.describe('TinyURL adaptive coach extended flow', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
    await grantFlagToE2eUser('adaptiveCoach');
  });

  test.afterAll(async () => {
    await removeFlagOverrideForE2eUser('adaptiveCoach');
    await seedE2eUser({ resetProgress: true });
  });

  test('FR teach_forward then pass Scale and Shortening', async ({ page }) => {
    test.setTimeout(120_000);
    evalMode.current = 'teach_forward';
    await suppressFirstRunUx(page);
    await mockAiCoachTurnAdaptive(page, evalMode);

    await page.goto('/practice/design-tinyurl');
    await expect(page.getByText('Functional Requirements').first()).toBeVisible();
    await dismissProblemIntroIfVisible(page);

    // Live agenda prompt from coach/turn start
    await expect(
      page.getByText(/List the core features for TinyURL./i).first(),
    ).toBeVisible({ timeout: 15_000 });

    await submitFunctionalRequirements(page);
    await expect(page.getByRole('heading', { name: 'Keep Practicing' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Try Again' }).click();
    await submitCurrentStep(page);
    await expect(page.getByRole('heading', { name: 'Keep Practicing' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Try Again' }).click();
    await submitCurrentStep(page);
    await expect(page.getByText(ADAPTIVE_COACH_TIP)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Continue with coach tip' }).click();
    await expect(page.getByText('Scale & Constraints').first()).toBeVisible({
      timeout: 15_000,
    });

    evalMode.current = 'pass';

    await passTextStep(
      page,
      '100M redirects/day, 100:1 read/write, store ~50B short links over 5 years.',
    );

    // Easy TinyURL journey jumps into HLD after Scale (not always Shortening Algorithm).
    await expect(
      page.getByText(/High-Level Architecture|Shortening Algorithm|Database Schema/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Open answer panel on diagram steps, then submit a short HLD write-up (or Skip).
    const answerSubmit = page.getByRole('button', { name: /Answer & submit/i });
    if (await answerSubmit.isVisible().catch(() => false)) {
      await answerSubmit.click();
      await page.waitForTimeout(700);
    }

    if (await page.getByRole('button', { name: /Submit answer/i }).isVisible().catch(() => false)) {
      await passTextStep(
        page,
        'Clients hit API; Redis caches short→long; Postgres stores mappings; ID generator on write path.',
      );
    } else {
      await page.getByRole('button', { name: /^Skip$/i }).click({ timeout: 5_000 }).catch(async () => {
        // Canvas-only: advance via skip in the practice strip if present after Answer & submit
        await page.keyboard.press('Escape');
      });
    }

    // Affirm we left Scale & Constraints
    await expect(page.getByText('Scale & Constraints').first()).toBeHidden({ timeout: 15_000 }).catch(
      () => undefined,
    );
    await expect(page.getByText(/Design TinyURL/i).first()).toBeVisible();
  });
});
