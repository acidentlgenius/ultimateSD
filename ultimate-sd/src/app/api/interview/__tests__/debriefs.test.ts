import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: { interviewDebrief: { findMany: vi.fn() } },
}));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { GET } from '../debriefs/route';

const mockedAuth = vi.mocked(auth);
const mockedFindMany = vi.mocked(prisma.interviewDebrief.findMany);
const mockedFlag = vi.mocked(canAccessFeature);

describe('GET /api/interview/debriefs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns debrief list for entitled user', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockedFlag.mockResolvedValue(true);
    mockedFindMany.mockResolvedValue([
      {
        id: 'd1',
        problemSlug: 'design-tinyurl',
        variant: 'lite',
        overallScore: 8,
        verdict: 'Hire',
        createdAt: new Date(),
      },
    ] as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.debriefs).toHaveLength(1);
    expect(body.debriefs[0].problemSlug).toBe('design-tinyurl');
  });
});
