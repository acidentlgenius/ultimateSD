import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { waitlistRatelimit } from '@/lib/ratelimit';

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

const mockLimit = vi.fn();
vi.mock('@/lib/ratelimit', () => ({
  waitlistRatelimit: {
    limit: (...args: any[]) => mockLimit(...args),
  },
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return error if email is invalid', async () => {
    mockLimit.mockResolvedValue({ success: true });
    const result = await joinWaitlist('invalid-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
  });

  it('should return rate limit error if rate limited', async () => {
    mockLimit.mockResolvedValue({ success: false });
    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Too many requests. Please try again later.');
    expect(mockLimit).toHaveBeenCalledWith('waitlist_127.0.0.1');
  });

  it('should successfully join waitlist if not rate limited', async () => {
    mockLimit.mockResolvedValue({ success: true });
    vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValue({} as any);

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalled();
  });

  it('should handle missing ratelimiter gracefully', async () => {
    vi.doMock('@/lib/ratelimit', () => ({
      waitlistRatelimit: null,
    }));

    // We need to re-import the module to apply the doMock
    const { joinWaitlist: localJoinWaitlist } = await import('../waitlist');

    vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValue({} as any);
    const result = await localJoinWaitlist('test2@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalled();
  });
});
