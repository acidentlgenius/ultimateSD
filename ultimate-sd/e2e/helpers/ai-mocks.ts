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

const ADAPTIVE_COACH_LOW_FEEDBACK = {
  score: 3,
  accuracy: 30,
  strengths: [] as string[],
  weaknesses: ['Too vague', 'Missing key features'],
  missed: ['Custom aliases', 'Redirect latency'],
  isAcceptable: false,
};

export const ADAPTIVE_COACH_TIP =
  'List three functional needs (shorten, redirect, optional click count) before moving on.';

/**
 * Mock /api/ai/evaluate for adaptive-coach e2e: retries on attempts 1–2,
 * teach_forward + tip on attempt 3+ (matches StepByStepChat gate handling).
 */
export async function mockAiEvaluateAdaptiveCoach(page: Page) {
  await page.route('**/api/ai/evaluate', async (route) => {
    const body = route.request().postDataJSON() as { attemptCount?: number };
    const attempt = body?.attemptCount ?? 1;

    if (attempt >= 3) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          feedback: ADAPTIVE_COACH_LOW_FEEDBACK,
          gate: {
            action: 'teach_forward',
            reason: 'Attempts exhausted (3/3)',
          },
          tip: ADAPTIVE_COACH_TIP,
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        feedback: ADAPTIVE_COACH_LOW_FEEDBACK,
        gate: {
          action: 'retry',
          reason: 'Score below threshold (3/10)',
        },
      }),
    });
  });
}

/** TinyURL Easy practice rails (first stages) — keep in sync with problem-steps. */
const TINYURL_EASY_STAGES = [
  'requirements-0',
  'requirements-1',
  'algorithm-0',
  'database-0',
  'database-1',
  'hld-0',
  'deep-dive-0',
  'cleanup-0',
] as const;

const STAGE_ASK_PROMPTS: Record<string, string> = {
  'requirements-0':
    'As your coach: list three must-have functional requirements for TinyURL (shorten, redirect, and one more).',
  'requirements-1':
    'Estimate daily traffic, storage, and whether reads or writes dominate for TinyURL.',
  'algorithm-0': 'How will you generate unique short keys? Base62 vs hash truncation?',
  'database-0': 'Sketch the core table(s) for short→long mappings.',
  'database-1': 'Would you choose SQL or NoSQL for TinyURL storage, and why?',
  'hld-0': 'Outline the high-level architecture: clients, API, cache, database.',
  'deep-dive-0': 'When should TinyURL use 301 vs 302 redirects?',
  'cleanup-0': 'How do you clean up expired short links?',
};

type CoachTurnBody = {
  event:
    | { type: 'start' }
    | { type: 'submit'; userAnswer: string; stageId: string }
    | { type: 'finish' }
    | { type: 'tick'; sessionRemainingSec: number };
  problemSlug: string;
  mode?: string;
  sessionState: {
    version: 'adaptive-1';
    mode: 'practice' | 'mock';
    problemSlug: string;
    stageId: string;
    agenda: Array<{
      id: string;
      kind: 'ask' | 'probe' | 'teach' | 'skip' | 'advance';
      prompt: string;
      skillFocus: string[];
      source: 'rail' | 'rag' | 'planner';
    }>;
    attempts: Record<string, number>;
    stageStartedAt: string;
    sessionBudgetSec: number;
    status: 'running' | 'complete' | 'summary-error';
  } | null;
};

function agendaAsk(stageId: string) {
  return [
    {
      id: `ask-${stageId}`,
      kind: 'ask' as const,
      prompt: STAGE_ASK_PROMPTS[stageId] ?? `Continue practice for ${stageId}.`,
      skillFocus: ['requirements'],
      source: 'planner' as const,
    },
  ];
}

function baseSession(
  stageId: string,
  attempts: Record<string, number> = {},
  status: 'running' | 'complete' = 'running',
) {
  return {
    version: 'adaptive-1' as const,
    mode: 'practice' as const,
    problemSlug: 'design-tinyurl',
    stageId,
    agenda: agendaAsk(stageId),
    attempts,
    stageStartedAt: new Date().toISOString(),
    sessionBudgetSec: 2700,
    status,
  };
}

function nextTinyUrlStage(stageId: string): string | null {
  const idx = TINYURL_EASY_STAGES.indexOf(stageId as (typeof TINYURL_EASY_STAGES)[number]);
  if (idx < 0 || idx >= TINYURL_EASY_STAGES.length - 1) return null;
  return TINYURL_EASY_STAGES[idx + 1];
}

export type CoachTurnEvalMode = 'teach_forward' | 'pass';

/**
 * Mock /api/ai/coach/turn for flag-on practice: start plans agenda; submit
 * retries then teach_forward (or always pass when modeRef.current === 'pass').
 */
export async function mockAiCoachTurnAdaptive(
  page: Page,
  modeRef: { current: CoachTurnEvalMode } = { current: 'teach_forward' },
) {
  await page.route('**/api/ai/coach/turn', async (route) => {
    const body = route.request().postDataJSON() as CoachTurnBody;

    if (body.event.type === 'start') {
      const sessionState = baseSession('requirements-0');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessionState, ui: { agenda: sessionState.agenda } }),
      });
      return;
    }

    if (body.event.type === 'finish') {
      const sessionState = {
        ...(body.sessionState ?? baseSession('requirements-0')),
        status: 'complete' as const,
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionState,
          ui: { agenda: sessionState.agenda },
        }),
      });
      return;
    }

    if (body.event.type !== 'submit') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unsupported event in mock' }),
      });
      return;
    }

    const stageId = body.event.stageId;
    const prevAttempts = body.sessionState?.attempts ?? {};
    const attempt = (prevAttempts[stageId] ?? 0) + 1;
    const attempts = { ...prevAttempts, [stageId]: attempt };

    if (modeRef.current === 'pass') {
      const nextId = nextTinyUrlStage(stageId);
      const sessionState = nextId
        ? baseSession(nextId, attempts)
        : { ...baseSession(stageId, attempts, 'complete') };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionState,
          ui: {
            agenda: sessionState.agenda,
            feedback: {
              score: 8,
              accuracy: 85,
              strengths: ['Good'],
              weaknesses: [],
              missed: [],
              isAcceptable: true,
            },
            gate: { action: 'pass', reason: 'Score meets threshold', threshold: 6 },
          },
        }),
      });
      return;
    }

    if (attempt >= 3) {
      const nextId = nextTinyUrlStage(stageId);
      const sessionState = nextId
        ? baseSession(nextId, attempts)
        : { ...baseSession(stageId, attempts, 'complete') };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionState,
          ui: {
            agenda: sessionState.agenda,
            feedback: ADAPTIVE_COACH_LOW_FEEDBACK,
            gate: { action: 'teach_forward', reason: 'Attempts exhausted (3/3)' },
            tip: ADAPTIVE_COACH_TIP,
          },
        }),
      });
      return;
    }

    const sessionState = {
      ...baseSession(stageId, attempts),
      agenda: [
        {
          id: `retry-${stageId}-${attempt}`,
          kind: 'ask' as const,
          prompt: `${STAGE_ASK_PROMPTS[stageId] ?? 'Try again.'} (focus on what you missed)`,
          skillFocus: ['requirements'],
          source: 'planner' as const,
        },
      ],
    };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionState,
        ui: {
          agenda: sessionState.agenda,
          feedback: ADAPTIVE_COACH_LOW_FEEDBACK,
          gate: { action: 'retry', reason: 'Score below threshold (3/10)' },
        },
      }),
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
