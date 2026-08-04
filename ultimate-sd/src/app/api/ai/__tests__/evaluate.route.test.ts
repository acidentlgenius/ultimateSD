// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));
vi.mock('@/lib/session-user', () => ({
  resolveSessionUserId: vi.fn(async (user: { id?: string | null }) => user.id ?? null),
  SESSION_STALE_MESSAGE: 'Your session is out of date. Sign out and sign back in.',
}));
vi.mock('@/lib/user-llm', () => {
  class AIAccessError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AIAccessError';
    }
  }
  return { AIAccessError, getUserLLM: vi.fn() };
});
vi.mock('@/lib/adaptive-coach/adapters/classic', () => ({
  evaluateClassicAnswer: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    stepSubmission: { count: vi.fn() },
  },
}));
vi.mock('@/lib/posthog', () => ({
  default: { capture: vi.fn() },
}));

import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getUserLLM } from '@/lib/user-llm';
import { evaluateClassicAnswer } from '@/lib/adaptive-coach/adapters/classic';
import { prisma } from '@/lib/prisma';
import { resolveSessionUserId } from '@/lib/session-user';
import { POST } from '@/app/api/ai/evaluate/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedLLM = vi.mocked(getUserLLM);
const mockedClassic = vi.mocked(evaluateClassicAnswer);
const mockedCount = vi.mocked(prisma.stepSubmission.count);
const mockedResolveUser = vi.mocked(resolveSessionUserId);

const EVALUATE_BODY = {
  problem: 'design-tinyurl',
  phase: 'Requirements',
  phaseKey: 'requirements',
  subStep: 'Functional Requirements',
  userAnswer: 'Shorten URLs and redirect',
  stageId: 'requirements-0',
  problemDetails: {
    slug: 'design-tinyurl',
    title: 'Design TinyURL',
    difficulty: 'Easy',
    context: 'URL shortener',
    functionalRequirements: ['Create short links'],
    nonFunctionalRequirements: ['100M redirects/day'],
  },
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/ai/evaluate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function mockLegacyLlm(feedback: {
  score: number;
  accuracy: number;
  isAcceptable: boolean;
}) {
  mockedLLM.mockResolvedValue({
    llm: {
      invoke: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          ...feedback,
          strengths: ['clear'],
          weaknesses: ['thin'],
          missed: ['analytics'],
        }),
      }),
    },
    source: 'byok',
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
  mockedResolveUser.mockResolvedValue('u1');
  mockedFlag.mockResolvedValue(false);
  mockedCount.mockResolvedValue(0);
});

describe('POST /api/ai/evaluate', () => {
  it('uses legacy acceptability when adaptiveCoach flag is off', async () => {
    mockLegacyLlm({ score: 8, accuracy: 75, isAcceptable: true });

    const res = await POST(makeRequest(EVALUATE_BODY));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.feedback.isAcceptable).toBe(true);
    expect(data.feedback.score).toBe(8);
    expect(mockedClassic).not.toHaveBeenCalled();
  });

  it('keeps legacy fail path when score is below bar and flag is off', async () => {
    mockLegacyLlm({ score: 6, accuracy: 80, isAcceptable: false });

    const res = await POST(makeRequest(EVALUATE_BODY));
    const data = await res.json();

    expect(data.feedback.isAcceptable).toBe(false);
    expect(mockedClassic).not.toHaveBeenCalled();
  });

  it('delegates to classic adapter when adaptiveCoach flag is on', async () => {
    mockedFlag.mockResolvedValue(true);
    mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
    mockedClassic.mockResolvedValue({
      feedback: {
        score: 8,
        accuracy: 70,
        strengths: ['good'],
        weaknesses: [],
        missed: [],
        isAcceptable: true,
      },
      gate: {
        action: 'pass',
        reason: 'Score 8 meets threshold 6',
        threshold: 6,
      },
    });

    const res = await POST(makeRequest({ ...EVALUATE_BODY, attemptCount: 2 }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.feedback.isAcceptable).toBe(true);
    expect(data.gate.action).toBe('pass');
    expect(mockedClassic).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        problemSlug: 'design-tinyurl',
        attemptCount: 2,
        stageId: 'requirements-0',
      }),
    );
  });

  it('returns teach_forward tip without isAcceptable when attempts are exhausted', async () => {
    mockedFlag.mockResolvedValue(true);
    mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
    mockedClassic.mockResolvedValue({
      feedback: {
        score: 4,
        accuracy: 40,
        strengths: [],
          weaknesses: ['missing FRs'],
        missed: ['custom aliases'],
        isAcceptable: false,
      },
      gate: {
        action: 'teach_forward',
        reason: 'Attempts exhausted (3/3)',
        threshold: 6,
        tipSkillId: 'teach-forward',
      },
      tip: 'List three functional needs before designing.',
    });

    const res = await POST(makeRequest({ ...EVALUATE_BODY, attemptCount: 3 }));
    const data = await res.json();

    expect(data.feedback.isAcceptable).toBe(false);
    expect(data.gate.action).toBe('teach_forward');
    expect(data.tip).toMatch(/functional/i);
  });

  it('uses server attempt count when sessionId and stepId are present', async () => {
    mockedFlag.mockResolvedValue(true);
    mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
    mockedCount.mockResolvedValue(2);
    mockedClassic.mockResolvedValue({
      feedback: {
        score: 4,
        accuracy: 40,
        strengths: [],
        weaknesses: ['thin'],
        missed: [],
        isAcceptable: false,
      },
      gate: {
        action: 'teach_forward',
        reason: 'Attempts exhausted (3/3)',
        threshold: 6,
      },
      tip: 'Add more detail.',
    });

    await POST(
      makeRequest({
        ...EVALUATE_BODY,
        sessionId: 'sess-1',
        stepId: 'requirements-0',
        attemptCount: 1,
      }),
    );

    expect(mockedCount).toHaveBeenCalledWith({
      where: {
        userId: 'u1',
        sessionId: 'sess-1',
        stepId: 'requirements-0',
        isPassing: false,
      },
    });
    expect(mockedClassic).toHaveBeenCalledWith(
      expect.objectContaining({ attemptCount: 3 }),
    );
  });

  it('falls back to client attemptCount when sessionId is missing', async () => {
    mockedFlag.mockResolvedValue(true);
    mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
    mockedClassic.mockResolvedValue({
      feedback: {
        score: 8,
        accuracy: 70,
        strengths: ['good'],
        weaknesses: [],
        missed: [],
        isAcceptable: true,
      },
      gate: {
        action: 'pass',
        reason: 'Score 8 meets threshold 6',
        threshold: 6,
      },
    });

    await POST(makeRequest({ ...EVALUATE_BODY, attemptCount: 2 }));

    expect(mockedCount).not.toHaveBeenCalled();
    expect(mockedClassic).toHaveBeenCalledWith(
      expect.objectContaining({ attemptCount: 2 }),
    );
  });

  it('returns session_stale when user id cannot be resolved', async () => {
    mockedResolveUser.mockResolvedValue(null);
    const res = await POST(makeRequest(EVALUATE_BODY));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('session_stale');
    expect(mockedLLM).not.toHaveBeenCalled();
  });
});
