import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import * as ratelimitModule from '@/lib/ratelimit';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(),
}));

describe('waitlist actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = undefined;
    process.env.UPSTASH_REDIS_REST_TOKEN = undefined;
  });

  it('rejects invalid emails', async () => {
    const result = await joinWaitlist('not-an-email');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/valid email/i);
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('upserts valid emails successfully when ratelimit passes', async () => {
    vi.mocked(ratelimitModule.checkRateLimit).mockResolvedValue({ success: true, limit: 5, remaining: 4, reset: 1 });
    vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      feature: 'aiInterviewer',
      createdAt: new Date(),
    });

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'test@example.com' },
      })
    );
  });

  it('rejects when ratelimited', async () => {
    vi.mocked(ratelimitModule.checkRateLimit).mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: 1 });

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/too many requests/i);
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });
});
