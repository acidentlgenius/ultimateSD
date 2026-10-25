import { describe, expect, it, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}));

const mocks = vi.hoisted(() => ({
  mockLimit: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('@/lib/ratelimit', () => ({
  ratelimit: {
    limit: mocks.mockLimit,
  },
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error for invalid email', async () => {
    const result = await joinWaitlist('invalid-email');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
  });

  it('should return success for valid email', async () => {
    mocks.mockLimit.mockResolvedValueOnce({ success: true });
    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalled();
  });

  it('should return error when rate limited', async () => {
    mocks.mockLimit.mockResolvedValueOnce({ success: false });
    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Too many requests. Please try again later.');
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });
});
