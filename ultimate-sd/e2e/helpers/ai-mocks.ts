import type { Page } from '@playwright/test';

const DEFAULT_EVALUATE_FEEDBACK = {
  score: 8,
  accuracy: 85,
  strengths: ['Clear functional requirements', 'Good coverage of core features'],
  weaknesses: [],
  tips: ['Consider mentioning analytics on clicks'],
  missed: [],
  isAcceptable: true,
};

export async function mockAiEvaluate(
  page: Page,
  feedback: Partial<typeof DEFAULT_EVALUATE_FEEDBACK> = {},
) {
  await page.route('**/api/ai/evaluate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        feedback: { ...DEFAULT_EVALUATE_FEEDBACK, ...feedback },
      }),
    });
  });
}

/**
 * Simulate AI-provider failures with the same response shape the real route
 * returns ({ error, message } + real status). fetchWithRetry surfaces
 * `message` to the user via HttpError.serverMessage.
 */
export async function mockAiEvaluateFailure(
  page: Page,
  status: 403 | 429 | 500 | 502,
  message: string,
) {
  await page.route('**/api/ai/evaluate', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'ai_unavailable', message }),
    });
  });
}

/** Hang the evaluate route past the client's 15s fetch timeout. */
export async function mockAiEvaluateTimeout(page: Page) {
  await page.route('**/api/ai/evaluate', async (route) => {
    await new Promise((r) => setTimeout(r, 20_000));
    await route.abort('timedout').catch(() => undefined);
  });
}

export async function mockAiRoutes(page: Page) {
  await mockAiEvaluate(page);

  await page.route('**/api/ai/help', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Think about read/write ratio and redirect latency.',
      }),
    });
  });

  await page.route('**/api/ai/chat', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        role: 'ai',
        content: 'Can you clarify the expected read-to-write ratio for this service?',
      }),
    });
  });
}

const DEFAULT_INTERVIEW_SUMMARY = {
  overallScore: 8,
  verdict: 'Hire',
  strengths: ['Structured requirements', 'Clear trade-off reasoning'],
  improvements: ['Quantify capacity estimates earlier'],
  phaseNotes: [{ phase: 'HLD', comment: 'Solid component breakdown.' }],
};

export async function mockInterviewSummary(page: Page) {
  await page.route('**/api/interview/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ summary: DEFAULT_INTERVIEW_SUMMARY }),
    });
  });
}

export async function mockAiProbe(page: Page) {
  await page.route('**/api/ai/chat', async (route) => {
    const body = route.request().postDataJSON() as { round?: number };
    const round = body?.round ?? 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: {
          role: 'ai',
          content: `Probe question ${round}: what breaks first at 10x traffic?`,
          id: `probe-${round}`,
          timestamp: new Date().toISOString(),
        },
        round,
        isFinal: round >= 3,
      }),
    });
  });
}
