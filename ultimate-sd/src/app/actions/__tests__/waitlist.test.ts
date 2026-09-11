import { describe, expect, it, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

// We need to mock next/headers to test rate limiting IP extraction
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

const mockLimit = vi.fn().mockResolvedValue({ success: true });

// We need to test the file with env vars set, so we can't easily re-evaluate the module
// inside the test in a clean way without dynamic imports. Since Vitest runs tests in isolation
// per file, we'll mock Ratelimit before the module is imported.
vi.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: vi.fn().mockImplementation(() => ({
      limit: mockLimit,
    })),
  };
});

// Since the module is evaluated with whatever process.env is at the time of import,
// we need to ensure the variables are set *before* we import `joinWaitlist`, but Vitest
// hoists `vi.mock` and imports.
// However, the module is already imported at the top. Let's see if we can trigger
// rate limiting logic by mocking the limit function directly if Ratelimit was instantiated.
// Wait, `UPSTASH_REDIS_REST_URL` might not be set in the test environment by default.

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a valid email to the waitlist (no rate limit active)', async () => {
    // If ratelimit is null, it skips the check.
    const result = await joinWaitlist('test@example.com');
    expect(result).toEqual({ success: true });
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      update: {},
      create: { email: 'test@example.com', feature: 'aiInterviewer' },
    });
  });

  it('rejects invalid emails', async () => {
    const result = await joinWaitlist('invalid-email');
    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });
});
