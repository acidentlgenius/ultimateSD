import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { waitlistRatelimit } from '@/lib/ratelimit';

// Mock dependencies
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
  waitlistRatelimit: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success when rate limit passes and email is valid', async () => {
    (prisma.waitlistSignup.upsert as any).mockResolvedValueOnce({});

    const result = await joinWaitlist('test@example.com');

    expect(result).toEqual({ success: true });
    expect(waitlistRatelimit!.limit).toHaveBeenCalledWith('waitlist_127.0.0.1');
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      update: {},
      create: { email: 'test@example.com', feature: 'aiInterviewer' },
    });
  });

  it('should return error when rate limit fails', async () => {
    (waitlistRatelimit!.limit as any).mockResolvedValueOnce({ success: false });

    const result = await joinWaitlist('test@example.com');

    expect(result).toEqual({ success: false, error: 'Too many requests. Please try again later.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('should return error for invalid email', async () => {
    const result = await joinWaitlist('invalid-email');

    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });
});
