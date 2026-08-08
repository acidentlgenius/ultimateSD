import { describe, it, expect, beforeEach, vi } from 'vitest';
import { joinWaitlist } from '@/app/actions/waitlist';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ success: true } as any);
  });

  it('rejects if rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValue({ success: false } as any);
    const res = await joinWaitlist('test@test.com');
    expect(res).toEqual({ success: false, error: 'Too many requests. Please try again later.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('rejects invalid emails', async () => {
    const res = await joinWaitlist('invalid');
    expect(res).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('upserts valid emails', async () => {
    const res = await joinWaitlist('test@test.com');
    expect(res).toEqual({ success: true });
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith({
      where: { email: 'test@test.com' },
      update: {},
      create: { email: 'test@test.com', feature: 'aiInterviewer' },
    });
  });

  it('catches prisma errors', async () => {
    vi.mocked(prisma.waitlistSignup.upsert).mockRejectedValueOnce(new Error('test'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await joinWaitlist('test@test.com');
    expect(res).toEqual({ success: false, error: 'Something went wrong. Please try again.' });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
