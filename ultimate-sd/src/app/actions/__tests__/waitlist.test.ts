import { describe, expect, it, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { ratelimit } from '@/lib/ratelimit';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('@/lib/ratelimit', () => ({
  ratelimit: {
    limit: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid email', async () => {
    // We mock ratelimit success to test email validation
    vi.mocked(ratelimit.limit).mockResolvedValueOnce({ success: true } as any);

    const result = await joinWaitlist('invalid-email');
    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('returns success for valid email', async () => {
    vi.mocked(ratelimit.limit).mockResolvedValueOnce({ success: true } as any);
    vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValueOnce({} as any);

    const result = await joinWaitlist('test@example.com');
    expect(result).toEqual({ success: true });
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      update: {},
      create: { email: 'test@example.com', feature: 'aiInterviewer' },
    });
  });

  it('handles ratelimit failure', async () => {
    vi.mocked(ratelimit.limit).mockResolvedValueOnce({ success: false } as any);

    const result = await joinWaitlist('test@example.com');
    expect(result).toEqual({ success: false, error: 'Too many requests. Please try again later.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('handles database error', async () => {
    vi.mocked(ratelimit.limit).mockResolvedValueOnce({ success: true } as any);
    vi.mocked(prisma.waitlistSignup.upsert).mockRejectedValueOnce(new Error('DB Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await joinWaitlist('test@example.com');
    expect(result).toEqual({ success: false, error: 'Something went wrong. Please try again.' });

    consoleSpy.mockRestore();
  });
});
