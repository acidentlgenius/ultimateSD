import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    interviewDebrief: { findFirst: vi.fn() },
    interviewDebriefShare: { create: vi.fn() },
  },
}));
vi.mock('@/lib/feature-flags-server', () => ({ canAccessFeature: vi.fn() }));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { POST } from '../share/route';

const mockedAuth = vi.mocked(auth);
const mockedFindFirst = vi.mocked(prisma.interviewDebrief.findFirst);
const mockedCreate = vi.mocked(prisma.interviewDebriefShare.create);
const mockedFlag = vi.mocked(canAccessFeature);

describe('POST /api/interview/share', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a share token for own debrief', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockedFlag.mockResolvedValue(true);
    mockedFindFirst.mockResolvedValue({ id: 'd1' } as never);
    mockedCreate.mockResolvedValue({ token: 'tok123' } as never);

    const res = await POST(
      new NextRequest('http://localhost/api/interview/share', {
        method: 'POST',
        body: JSON.stringify({ debriefId: 'd1' }),
      })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).url).toMatch(/\/share\/debrief\/tok123/);
  });
});
