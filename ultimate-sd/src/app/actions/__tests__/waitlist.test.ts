import { describe, expect, it, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { ratelimit } from '@/lib/ratelimit';

// Mock Next.js headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

// Mock ratelimit conditionally
vi.mock('@/lib/ratelimit', () => ({
  ratelimit: {
    limit: vi.fn(),
  },
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid email', async () => {
    const result = await joinWaitlist('invalid-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('blocks request if rate limit exceeded', async () => {
    vi.mocked(ratelimit!.limit).mockResolvedValue({ success: false } as any);

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Too many requests. Please try again later.');
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('allows request if rate limit not exceeded', async () => {
    vi.mocked(ratelimit!.limit).mockResolvedValue({ success: true } as any);
    vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValue({} as any);

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      update: {},
      create: { email: 'test@example.com', feature: 'aiInterviewer' },
    });
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(ratelimit!.limit).mockResolvedValue({ success: true } as any);
    vi.mocked(prisma.waitlistSignup.upsert).mockRejectedValue(new Error('DB Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong. Please try again.');

    consoleSpy.mockRestore();
  });
});
