import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { ratelimit } from '@/lib/ratelimit';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: () => '127.0.0.1' }),
}));

vi.mock('@/lib/ratelimit', () => ({
  ratelimit: {
    limit: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject invalid emails', async () => {
    const result = await joinWaitlist('not-an-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('should successfully join the waitlist', async () => {
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

  it('should handle rate limiting', async () => {
    vi.mocked(ratelimit!.limit).mockResolvedValue({ success: false } as any);

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Too many requests. Please try again later.');
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(ratelimit!.limit).mockResolvedValue({ success: true } as any);
    vi.mocked(prisma.waitlistSignup.upsert).mockRejectedValue(new Error('DB Error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong. Please try again.');
  });
});
