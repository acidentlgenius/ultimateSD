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
vi.mock('@/lib/adaptive-coach', () => ({ runCoachTurn: vi.fn() }));
vi.mock('@/lib/adaptive-coach/tools/load-profile', () => ({ loadProfile: vi.fn() }));
vi.mock('@/lib/posthog', () => ({
  default: { capture: vi.fn() },
}));

import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { AIAccessError, getUserLLM } from '@/lib/user-llm';
import { runCoachTurn } from '@/lib/adaptive-coach';
import { loadProfile } from '@/lib/adaptive-coach/tools/load-profile';
import posthog from '@/lib/posthog';
import { POST } from '@/app/api/ai/coach/turn/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedLLM = vi.mocked(getUserLLM);
const mockedRunCoachTurn = vi.mocked(runCoachTurn);
const mockedLoadProfile = vi.mocked(loadProfile);
const mockedPosthog = vi.mocked(posthog.capture);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/ai/coach/turn', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const START_BODY = {
  event: { type: 'start' },
  problemSlug: 'design-parking-lot',
  mode: 'practice',
  sessionState: null,
};

const COACH_RESPONSE = {
  sessionState: {
    version: 'adaptive-1',
    mode: 'practice',
    problemSlug: 'design-parking-lot',
    stageId: 'requirements-0',
    agenda: [],
    attempts: {},
    stageStartedAt: '2026-07-15T00:00:00.000Z',
    sessionBudgetSec: 2700,
    status: 'running',
  },
  ui: { agenda: [] },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
  mockedFlag.mockResolvedValue(true);
  mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
  mockedLoadProfile.mockResolvedValue({
    userId: 'u1',
    level: 'sde1',
    companies: [],
    intent: 'interview',
    competencies: [],
    memoryNotes: [],
  });
  mockedRunCoachTurn.mockResolvedValue(COACH_RESPONSE);
});

describe('POST /api/ai/coach/turn', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest(START_BODY));
    expect(res.status).toBe(401);
    expect(mockedFlag).not.toHaveBeenCalled();
  });

  it('returns 403 while the adaptiveCoach flag is dark', async () => {
    mockedFlag.mockResolvedValue(false);
    const res = await POST(makeRequest(START_BODY));
    expect(res.status).toBe(403);
    expect(mockedFlag).toHaveBeenCalledWith('u1', 'adaptiveCoach');
    expect(mockedLLM).not.toHaveBeenCalled();
    expect(mockedRunCoachTurn).not.toHaveBeenCalled();
  });

  it('returns 403 when AI access is denied', async () => {
    mockedLLM.mockRejectedValue(
      new AIAccessError('Add your API key or credentials in Settings to use AI.')
    );
    const res = await POST(makeRequest(START_BODY));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('ai_unavailable');
  });

  it('returns 402 when AI credits are exhausted', async () => {
    mockedLLM.mockRejectedValue(
      new AIAccessError('You have used all AI credits for this month.')
    );
    const res = await POST(makeRequest(START_BODY));
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('ai_unavailable');
  });

  it('returns 400 for invalid body', async () => {
    const res = await POST(makeRequest({ mode: 'practice' }));
    expect(res.status).toBe(400);
  });

  it('returns coach turn response and captures posthog without answer text', async () => {
    const res = await POST(makeRequest(START_BODY));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(COACH_RESPONSE);
    expect(mockedRunCoachTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        problemSlug: 'design-parking-lot',
        mode: 'practice',
        difficulty: 'Easy',
        event: { type: 'start' },
      })
    );
    expect(mockedPosthog).toHaveBeenCalledWith({
      distinctId: 'u1',
      event: 'coach_turn',
      properties: {
        gateAction: undefined,
        mode: 'practice',
        level: 'sde1',
      },
    });
  });
});
