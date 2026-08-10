import { test, expect } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import { mockAiEvaluate, mockAiProbe } from './helpers/ai-mocks';
import { grantFlagToE2eUser, removeFlagOverrideForE2eUser } from './helpers/flags';
import { seedE2eUser } from '../scripts/seed-e2e';

test.describe.configure({ mode: 'serial' });

test.describe('AI probe mode (flag granted)', () => {
  test.beforeAll(async () => {
    // Reset design-tinyurl progress first: interview-mode.spec.ts (and
    // practice.spec.ts) target the same problem for the same e2e user, and a
    // leftover completed "Functional Requirements" step would silently
    // advance this test past the step it expects to answer.
    await seedE2eUser({ resetProgress: true });
    await grantFlagToE2eUser('aiProbe');
  });

  test.afterAll(async () => {
    await removeFlagOverrideForE2eUser('aiProbe');
    await seedE2eUser({ resetProgress: true });
  });

  test.beforeEach(async ({ page }) => {
    await suppressFirstRunUx(page);
    await mockAiEvaluate(page);
    await mockAiProbe(page);
  });

  test('probe opt-in appears after a passing evaluation and runs a round-trip', async ({
    page,
  }) => {
    await page.goto('/practice/design-tinyurl');

    // Pass the first step (custom tinyurl list step, same as practice.spec.ts)
    await page.getByPlaceholder(/short URL/i).fill('Users can shorten a long URL');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.getByRole('button', { name: /Submit answer/i }).click();
    await expect(page.getByRole('heading', { name: /Great Job/i })).toBeVisible({
      timeout: 15_000,
    });

    // Opt in to probe mode from the feedback modal
    await page.getByRole('button', { name: 'Defend your design' }).click();
    await expect(page.getByText(/Probe question 1/)).toBeVisible({ timeout: 15_000 });

    // Round-trip: answer question 1 → question 2 arrives
    await page.getByPlaceholder('Defend your design…').fill('Cache absorbs hot keys; DB is sharded by code prefix.');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText(/Probe question 2/)).toBeVisible({ timeout: 15_000 });

    // Minimum 2 rounds reached — early exit allowed
    await page.getByRole('button', { name: 'End probe' }).click();
    await expect(page.getByText(/Probe question 1/)).toHaveCount(0);
  });
});
