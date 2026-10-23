import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@upstash/ratelimit', () => {
  const MockRatelimit = vi.fn(function(this: any) { this.limit = vi.fn(); });
  Object.assign(MockRatelimit, { slidingWindow: vi.fn() });
  return { Ratelimit: MockRatelimit };
});
vi.mock('@upstash/redis', () => ({
  Redis: { fromEnv: vi.fn() },
}));
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue('127.0.0.1') }),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { joinWaitlist } from '@/app/actions/waitlist';

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('rejects invalid emails', async () => {
    const result = await joinWaitlist('invalid-email');
    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
  });

  it('upserts a valid email when upstash config is missing', async () => {
    const upsertSpy = vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValue({} as any);
    const result = await joinWaitlist('test@example.com');
    expect(result).toEqual({ success: true });
    expect(upsertSpy).toHaveBeenCalled();
  });
});
