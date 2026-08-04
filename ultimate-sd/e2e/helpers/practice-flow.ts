import { expect, type Page } from '@playwright/test';

/** Dismiss problem intro when suppressFirstRunUx did not apply (fresh profile race). */
export async function dismissProblemIntroIfVisible(page: Page) {
  const intro = page.getByTestId('problem-intro-step');
  if (await intro.isVisible().catch(() => false)) {
    await intro.getByRole('button', { name: /I'm ready/i }).click();
    await expect(intro).toBeHidden();
  }
}

export async function waitForSubmitAnswerButton(page: Page) {
  await expect(page.getByRole('button', { name: /Submit answer/i })).toBeVisible({
    timeout: 15_000,
  });
}

const DEFAULT_FR_ITEMS = [
  'Users can shorten a long URL',
  'Short URL redirects to the original URL',
  'Links can expire after a set time',
];

/** Ensure list items exist on the design-tinyurl FR step (skips duplicates). */
export async function ensureFunctionalRequirements(
  page: Page,
  items: string[] = DEFAULT_FR_ITEMS,
) {
  await dismissProblemIntroIfVisible(page);
  await waitForSubmitAnswerButton(page);

  const input = page.getByPlaceholder(/short URL|long URL/i).first();
  for (const item of items) {
    if ((await page.getByText(item, { exact: true }).count()) > 0) continue;
    await input.fill(item);
    await page.getByRole('button', { name: 'Add' }).click();
  }
}

export async function submitCurrentStep(page: Page) {
  await waitForSubmitAnswerButton(page);
  await page.getByRole('button', { name: /Submit answer/i }).click();
}

/** Fill FR list (if needed) and submit the current step. */
export async function submitFunctionalRequirements(
  page: Page,
  items: string[] = DEFAULT_FR_ITEMS,
) {
  await ensureFunctionalRequirements(page, items);
  await submitCurrentStep(page);
}
