// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));
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
vi.mock('@/lib/posthog', () => ({
  default: { capture: vi.fn() },
}));

import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { getUserLLM } from '@/lib/user-llm';
import { evaluateClassicAnswer } from '@/lib/adaptive-coach/adapters/classic';
import { POST } from '@/app/api/ai/evaluate/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedLLM = vi.mocked(getUserLLM);
const mockedClassic = vi.mocked(evaluateClassicAnswer);

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
  mockedFlag.mockResolvedValue(false);
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
        weaknesses: ['missing redirects'],
        missed: ['custom aliases'],
        isAcceptable: false,
      },
      gate: {
        action: 'teach_forward',
        reason: 'Attempts exhausted (3/3)',
        threshold: 6,
        tipSkillId: 'teach-forward',
      },
      tip: 'Mention redirect latency and analytics on clicks.',
    });

    const res = await POST(makeRequest({ ...EVALUATE_BODY, attemptCount: 3 }));
    const data = await res.json();

    expect(data.feedback.isAcceptable).toBe(false);
    expect(data.gate.action).toBe('teach_forward');
    expect(data.tip).toContain('redirect');
  });
});
