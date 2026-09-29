import { describe, expect, it, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { joinWaitlist } from '../waitlist';
import { headers } from 'next/headers';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('joinWaitlist action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (headers as any).mockResolvedValue({ get: vi.fn().mockReturnValue('127.0.0.1') });
  });

  it('works correctly for valid email', async () => {
    (prisma.waitlistSignup.upsert as any).mockResolvedValue({});

    const res = await joinWaitlist('test@example.com');
    expect(res).toEqual({ success: true });
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledTimes(1);
  });

  it('rate limits multiple requests from the same IP', async () => {
    (prisma.waitlistSignup.upsert as any).mockResolvedValue({});
    (headers as any).mockResolvedValue({ get: vi.fn().mockReturnValue('192.168.1.100') });

    // Simulate multiple requests
    const results = [];
    for (let i = 0; i < 7; i++) {
      results.push(await joinWaitlist(`test${i}@example.com`));
    }

    // The first 5 should succeed
    expect(results[0].success).toBe(true);
    expect(results[4].success).toBe(true);

    // The 6th and 7th should fail with rate limit error
    expect(results[5].success).toBe(false);
    expect(results[5].error).toBe('Too many requests. Please try again later.');
    expect(results[6].success).toBe(false);
  });
});
