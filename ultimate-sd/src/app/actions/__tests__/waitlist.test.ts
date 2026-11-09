import { vi, describe, it, expect, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue('127.0.0.1') }),
}));

const mockLimit = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true }));

vi.mock('@upstash/ratelimit', () => {
  const MockRatelimit = vi.fn(function (this: any) {
    this.limit = mockLimit;
  });
  Object.assign(MockRatelimit, {
    slidingWindow: vi.fn(),
  });
  return { Ratelimit: MockRatelimit };
});

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ success: true });
  });

  it('allows valid email signups', async () => {
    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalled();
  });

  it('blocks invalid emails', async () => {
    const result = await joinWaitlist('invalid-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
  });
});
