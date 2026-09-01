import { test, expect, type Page } from '@playwright/test';
import { suppressFirstRunUx } from './helpers/first-run';
import { mockAiEvaluate } from './helpers/ai-mocks';
import { seedE2eUser } from '../scripts/seed-e2e';

// Sessions must never lose work: refresh restores position and answers,
// skipped steps don't drag the user backwards, and diagram scenes survive
// refresh + step navigation. Regression suite for the Phase 2 work.
test.describe.configure({ mode: 'serial' });

const TEST_SCENE = {
  format: 'excalidraw',
  formatVersion: 1,
  stepKey: 'hld-0',
  scene: {
    type: 'excalidraw',
    version: 2,
    elements: [{
      id: 'e2e-rect', type: 'rectangle', x: 100, y: 100, width: 200, height: 80,
      angle: 0, strokeColor: '#1e1e1e', backgroundColor: '#a5d8ff', fillStyle: 'solid',
      strokeWidth: 2, strokeStyle: 'solid', roughness: 1, opacity: 100,
      groupIds: [], frameId: null, roundness: null, seed: 1, versionNonce: 1, version: 2,
      isDeleted: false, boundElements: null, updated: 1, link: null, locked: false,
    }],
    appState: { viewBackgroundColor: '#ffffff' },
    files: {},
  },
  timestamp: new Date().toISOString(),
};

async function passCurrentStep(page: Page, answer: string) {
  const listInput = page.getByPlaceholder(/short URL|e\.g\./i).first();
  const textarea = page.locator('textarea').first();
  if (await listInput.isVisible().catch(() => false)) {
    await listInput.fill(answer);
    const add = page.getByRole('button', { name: 'Add' });
    if (await add.isVisible().catch(() => false)) await add.click();
  } else {
    await textarea.fill(answer);
  }
  await page.getByRole('button', { name: /Submit for Review/i }).click();
  await expect(page.getByRole('heading', { name: /Great Job/i })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /Continue to Next Step/i }).click();
  // recordStepSubmission persists in a background server action — let it land
  // before any reload, or the refresh races the DB write.
  await page.waitForLoadState('networkidle');
}

test.describe('Session persistence', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
  });

  test.afterAll(async () => {
    await seedE2eUser({ resetProgress: true });
  });

  test.beforeEach(async ({ page }) => {
    await suppressFirstRunUx(page);
    await mockAiEvaluate(page);
  });

  test('refresh mid-session resumes after the last completed step', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');
    const firstStepTitle = await page.locator('main h3').first().textContent({ timeout: 15000 }).catch(() => null);

    await passCurrentStep(page, 'Users can shorten a long URL');
    const secondStepTitle = await page.locator('main h3').first().textContent();
    expect(secondStepTitle).not.toBe(firstStepTitle);

    await page.reload();

    // Restored to step 2, not dragged back to step 1.
    await expect(page.locator('main h3').first()).toHaveText(secondStepTitle!, { timeout: 15_000 });
  });

  test('skip + refresh resumes at the furthest position, not the skipped step', async ({ page }) => {
    await seedE2eUser({ resetProgress: true });
    await page.goto('/practice/design-tinyurl');
    const firstStepTitle = await page.locator('main h3').first().textContent({ timeout: 15000 }).catch(() => null);

    // Skip step 1, then PASS step 2.
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.locator('main h3').first()).not.toHaveText(firstStepTitle!);
    await passCurrentStep(page, 'Handle 100M redirects/day with a 100:1 read/write ratio.');
    const thirdStepTitle = await page.locator('main h3').first().textContent();

    await page.reload();

    // Regression (Phase 2): must resume at step 3 — NOT back at skipped step 1.
    await expect(page.locator('main h3').first()).toHaveText(thirdStepTitle!, { timeout: 15_000 });
    expect(thirdStepTitle).not.toBe(firstStepTitle);
  });

  test('diagram scene survives refresh and step navigation', async ({ page }) => {
    await page.addInitScript((scene) => {
      localStorage.setItem('diagram-hld-0', JSON.stringify(scene));
    }, TEST_SCENE);

    await page.goto('/practice/design-tinyurl');
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible();

    const readScene = () =>
      page.evaluate(() => {
        const raw = localStorage.getItem('diagram-hld-0');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed.scene.elements.filter((e: { isDeleted?: boolean }) => !e.isDeleted).length;
      });

    // Navigate to the diagram (HLD) step and give restore + flush cycles time to run.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('sd-navigate-step', { detail: { phase: 'hld', stepIndex: 0 } }));
    });
    await page.waitForTimeout(3000);
    expect(await readScene()).toBe(1);

    // Step-nav away and back — the flush path that historically wiped scenes.
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('sd-navigate-step', { detail: { phase: 'requirements', stepIndex: 0 } }));
    });
    await page.waitForTimeout(2500);
    expect(await readScene()).toBe(1);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('sd-navigate-step', { detail: { phase: 'hld', stepIndex: 0 } }));
    });
    await page.waitForTimeout(2500);
    expect(await readScene()).toBe(1);

    // And a full refresh.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible();
    await page.waitForTimeout(2000);
    expect(await readScene()).toBe(1);
  });
});
