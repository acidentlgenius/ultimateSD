import { describe, expect, it, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '@/app/actions/waitlist';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
    headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue('127.0.0.1') })
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid emails', async () => {
    const result = await joinWaitlist('invalid');
    expect(result.success).toBe(false);
  });

  it('upserts valid emails', async () => {
      vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValue({} as any);
      const result = await joinWaitlist('dev@example.com');
      expect(result.success).toBe(true);
      expect(prisma.waitlistSignup.upsert).toHaveBeenCalled();
  });
});
