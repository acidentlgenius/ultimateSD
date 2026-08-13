import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';
import { InMemoryRateLimiter } from '@/lib/rate-limit';
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

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (headers as any).mockResolvedValue({
      get: (key: string) => {
        if (key === 'x-forwarded-for') return '192.168.1.1';
        return null;
      }
    });
  });

  it('rejects invalid emails', async () => {
    const result = await joinWaitlist('invalid-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
  });

  it('calls prisma upsert for valid emails', async () => {
    (prisma.waitlistSignup.upsert as any).mockResolvedValue({});

    const result = await joinWaitlist('test@example.com');

    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: 'test@example.com' }
    }));
  });
});
