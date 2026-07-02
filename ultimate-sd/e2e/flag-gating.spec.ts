import { test, expect } from '@playwright/test';
import { seedE2eUser, setFeatureFlagStateForE2e } from '../scripts/seed-e2e';
import { removeFlagOverrideForE2eUser } from './helpers/flags';

test.describe.configure({ mode: 'serial' });

// Runs under the `authenticated` Playwright project (storageState: USER_AUTH_FILE),
// so both `page` and the built-in `request` fixture carry a signed-in free-tier
// user's session cookie. This is required for the /api/orders check below: it
// must prove a genuinely signed-in user is rejected while the flag is dark, not
// merely that an unauthenticated request is rejected (that's already covered by
// e2e/lifetime-pricing.spec.ts under the `guest` project).
test.describe('dark features are invisible and unreachable', () => {
  test('lifetime order API rejects a signed-in user while dark', async ({ request }) => {
    const res = await request.post('/api/orders', { data: { planType: 'lifetime' } });
    expect(res.status()).toBe(403);
  });
});

test.describe('fresherTrack dark: zero visual change', () => {
  test.beforeAll(async () => {
    await seedE2eUser({ resetProgress: true });
    await setFeatureFlagStateForE2e('fresherTrack', []);
  });

  test('roadmap shows only the four role tracks', async ({ page }) => {
    await page.goto('/roadmap');
    await expect(page.getByRole('button', { name: 'Software Engineer' })).toBeVisible();
    await expect(page.getByText(/Fresher & Campus/i)).toHaveCount(0);
    await expect(page.getByText(/Phase 0: Foundations/i)).toHaveCount(0);
  });

  test('deep link ?track=fresher falls back to the SE track', async ({ page }) => {
    await page.goto('/roadmap?track=fresher');
    await page.waitForURL(/track=se/);
    await expect(page.getByText(/Phase 1: Web Fundamentals/i)).toBeVisible();
    await expect(page.getByText(/Phase 0: Foundations/i)).toHaveCount(0);
  });

  test.describe('guest landing', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('hero has no fresher CTA while dark', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText(/Fresher Path/i)).toHaveCount(0);
      // Senior hero is byte-identical: original CTAs still present.
      await expect(page.getByRole('link', { name: /Start Exploring/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Free Canvas/i })).toBeVisible();
    });
  });
});

// NOTE: interview-mode.spec.ts and probe.spec.ts grant overrides to the same
// e2e user. CI runs with workers=1, so file order (flag-gating → interview-mode
// → probe) keeps these isolated. Locally run:
//   npx playwright test e2e/flag-gating.spec.ts e2e/interview-mode.spec.ts e2e/probe.spec.ts --workers=1

test.describe('interview mode & probe stay dark', () => {
  test.beforeAll(async () => {
    await removeFlagOverrideForE2eUser('interviewMode');
    await removeFlagOverrideForE2eUser('aiProbe');
  });

  test('no Start Interview entry on the practice page', async ({ page }) => {
    await page.goto('/practice/design-tinyurl');
    await expect(page.getByRole('heading', { level: 1, name: /Design TinyURL/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Interview' })).toHaveCount(0);
  });

  test('?interview=lite is stripped for unentitled users', async ({ page }) => {
    await page.goto('/practice/design-tinyurl?interview=lite');
    await expect(page).toHaveURL(/\/practice\/design-tinyurl$/);
    await expect(page.getByText(/Interview · 45 min/)).toHaveCount(0);
  });

  test('interview summary API returns 403 while dark', async ({ request }) => {
    const res = await request.post('/api/interview/summary', {
      data: {
        slug: 'design-tinyurl',
        answers: [{ phase: 'HLD', title: 'x', answer: 'y', passed: true }],
      },
    });
    expect(res.status()).toBe(403);
  });

  test('probe chat API returns 403 while dark', async ({ request }) => {
    const res = await request.post('/api/ai/chat', {
      data: {
        mode: 'probe',
        slug: 'design-tinyurl',
        phase: 'HLD',
        stepAnswer: 'answer',
        round: 1,
      },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('voice APIs are unreachable while voiceInterview is dark', () => {
  test('JSON voice routes return 403 for a signed-in unentitled user', async ({ request }) => {
    const cases: Array<[string, Record<string, string>]> = [
      ['/api/voice/session', { slug: 'design-tinyurl' }],
      ['/api/voice/reply', { sessionId: 'nope', transcript: 'hello' }],
      ['/api/voice/speak', { sessionId: 'nope', text: 'hello' }],
    ];
    for (const [path, data] of cases) {
      const res = await request.post(path, { data });
      expect(res.status(), path).toBe(403);
    }
  });

  test('transcribe route returns 403 before touching the audio', async ({ request }) => {
    const res = await request.post('/api/voice/transcribe', {
      multipart: {
        sessionId: 'nope',
        audio: { name: 'a.webm', mimeType: 'audio/webm', buffer: Buffer.from('fake') },
      },
    });
    expect(res.status()).toBe(403);
  });
});
