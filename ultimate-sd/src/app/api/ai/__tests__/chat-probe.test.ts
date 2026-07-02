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
vi.mock('@/lib/langgraph', () => ({
  getAIResponse: vi.fn(),
  getFeedback: vi.fn(),
  getProbeResponse: vi.fn(),
}));

import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { AIAccessError, getUserLLM } from '@/lib/user-llm';
import { getProbeResponse } from '@/lib/langgraph';
import { POST } from '@/app/api/ai/chat/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedLLM = vi.mocked(getUserLLM);
const mockedProbe = vi.mocked(getProbeResponse);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const PROBE_BODY = {
  mode: 'probe',
  slug: 'design-tinyurl',
  phase: 'HLD',
  stepAnswer: 'LB -> app -> Postgres with Redis cache',
  probeMessages: [],
  round: 1,
};

const AI_MESSAGE = {
  role: 'ai' as const,
  content: 'What breaks first at 10x traffic?',
  id: '1',
  timestamp: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
  mockedFlag.mockResolvedValue(true);
  mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
  mockedProbe.mockResolvedValue(AI_MESSAGE);
});

describe('POST /api/ai/chat mode=probe', () => {
  it('returns 401 for unauthenticated users', async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest(PROBE_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 403 while the aiProbe flag is dark', async () => {
    mockedFlag.mockResolvedValue(false);
    const res = await POST(makeRequest(PROBE_BODY));
    expect(res.status).toBe(403);
    expect(mockedFlag).toHaveBeenCalledWith('u1', 'aiProbe');
    expect(mockedLLM).not.toHaveBeenCalled();
  });

  it('rejects out-of-range rounds with 400 (max 3 follow-ups)', async () => {
    expect((await POST(makeRequest({ ...PROBE_BODY, round: 4 }))).status).toBe(400);
    expect((await POST(makeRequest({ ...PROBE_BODY, round: 0 }))).status).toBe(400);
  });

  it('rejects a missing stepAnswer with 400', async () => {
    const res = await POST(makeRequest({ ...PROBE_BODY, stepAnswer: '  ' }));
    expect(res.status).toBe(400);
  });

  it('funding denial surfaces as 403 with the canUseAI reason', async () => {
    mockedLLM.mockRejectedValue(
      new AIAccessError('Add your preferred API key in Settings to use AI on the Platform plan.')
    );
    const res = await POST(makeRequest(PROBE_BODY));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain('Platform plan');
  });

  it('returns the probe question with round metadata', async () => {
    const res = await POST(makeRequest(PROBE_BODY));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message.content).toBe('What breaks first at 10x traffic?');
    expect(data.round).toBe(1);
    expect(data.isFinal).toBe(false);
  });

  it('marks round 3 as final', async () => {
    const res = await POST(makeRequest({ ...PROBE_BODY, round: 3 }));
    expect((await res.json()).isFinal).toBe(true);
  });

  it('legacy chat (no mode) never consults the flag', async () => {
    const res = await POST(
      makeRequest({ slug: 'design-tinyurl', phase: 'init', input: '', messages: [] })
    );
    expect(res.status).toBe(200);
    expect(mockedFlag).not.toHaveBeenCalled();
  });
});
