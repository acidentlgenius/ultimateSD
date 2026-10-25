import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { ratelimit } from '@/lib/ratelimit';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/ratelimit', () => ({
  ratelimit: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue('127.0.0.1') }),
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a valid email to the waitlist', async () => {
    const res = await joinWaitlist('test@example.com');
    expect(res).toEqual({ success: true });
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'test@example.com' },
      })
    );
  });

  it('rejects an invalid email', async () => {
    const res = await joinWaitlist('not-an-email');
    expect(res).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('rate limits requests', async () => {
    (ratelimit.limit as any).mockResolvedValueOnce({ success: false });
    const res = await joinWaitlist('test@example.com');
    expect(res).toEqual({ success: false, error: 'Too many requests. Please try again later.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });
});
