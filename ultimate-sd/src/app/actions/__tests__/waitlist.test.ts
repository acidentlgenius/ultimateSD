import { describe, expect, it, vi, beforeEach } from 'vitest';
import { joinWaitlist } from '../waitlist';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: {
      upsert: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1')
  })
}));

describe('joinWaitlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid email', async () => {
    const res = await joinWaitlist('invalid-email');
    expect(res).toEqual({ success: false, error: 'Please enter a valid email address.' });
  });

  it('accepts valid email', async () => {
    const res = await joinWaitlist('test@example.com');
    expect(res).toEqual({ success: true });
  });
});
