import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  })),
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows valid email', async () => {
    (prisma.waitlistSignup.upsert as any).mockResolvedValueOnce({});

    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      update: {},
      create: { email: 'test@example.com', feature: 'aiInterviewer' },
    });
  });

  it('rejects invalid email', async () => {
    const result = await joinWaitlist('invalid-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });
});
