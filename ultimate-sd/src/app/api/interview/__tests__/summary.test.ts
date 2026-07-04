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
vi.mock('@/lib/langgraph', () => ({ getInterviewSummary: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: { interviewDebrief: { create: vi.fn() } },
}));

import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { AIAccessError, getUserLLM } from '@/lib/user-llm';
import { getInterviewSummary } from '@/lib/langgraph';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/interview/summary/route';

const mockedAuth = vi.mocked(auth);
const mockedFlag = vi.mocked(canAccessFeature);
const mockedLLM = vi.mocked(getUserLLM);
const mockedSummary = vi.mocked(getInterviewSummary);
const mockedCreate = vi.mocked(prisma.interviewDebrief.create);

const VALID_BODY = {
  slug: 'design-tinyurl',
  answers: [
    { phase: 'Requirements', title: 'Functional Requirements', answer: 'Shorten URL', passed: true },
  ],
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/interview/summary', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
  mockedFlag.mockResolvedValue(true);
});

describe('POST /api/interview/summary', () => {
  it('rejects unauthenticated users with 401', async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 403 when the interviewMode flag denies (dark launch)', async () => {
    mockedFlag.mockResolvedValue(false);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect(mockedFlag).toHaveBeenCalledWith('u1', 'interviewMode');
    expect(mockedLLM).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown problem slug', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, slug: 'design-nothing' }));
    expect(res.status).toBe(404);
  });

  it('returns 400 when there are no answers', async () => {
    const res = await POST(makeRequest({ slug: 'design-tinyurl', answers: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 403 with the message when AI funding is denied', async () => {
    mockedLLM.mockRejectedValue(new AIAccessError('Add your preferred API key in Settings.'));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('Add your preferred API key in Settings.');
  });

  it('returns the summary on success', async () => {
    mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
    mockedSummary.mockResolvedValue({
      overallScore: 8,
      verdict: 'Hire',
      strengths: ['s'],
      improvements: ['i'],
      phaseNotes: [],
    });
    mockedCreate.mockResolvedValue({ id: 'd1' } as never);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.verdict).toBe('Hire');
    expect(body.debriefId).toBe('d1');
    expect(mockedCreate).toHaveBeenCalled();
  });

  it('returns 500 when the generator yields null', async () => {
    mockedLLM.mockResolvedValue({ llm: {} as never, source: 'byok' });
    mockedSummary.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });
});
