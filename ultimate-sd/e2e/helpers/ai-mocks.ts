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
