import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    waitlistSignup: { upsert: vi.fn() },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { joinWaitlist } from '../waitlist';

const mockedHeaders = vi.mocked(headers);
const mockedPrisma = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('joinWaitlist', () => {
  it('successfully joins waitlist', async () => {
    mockedHeaders.mockResolvedValue({ get: () => '1.1.1.1' } as never);
    mockedPrisma.waitlistSignup.upsert.mockResolvedValue({} as never);

    const result = await joinWaitlist('test@example.com');
    expect(result).toEqual({ success: true });
    expect(mockedPrisma.waitlistSignup.upsert).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      update: {},
      create: { email: 'test@example.com', feature: 'aiInterviewer' },
    });
  });

  it('rejects invalid email', async () => {
    mockedHeaders.mockResolvedValue({ get: () => '1.1.1.1' } as never);
    const result = await joinWaitlist('not-an-email');
    expect(result).toEqual({ success: false, error: 'Please enter a valid email address.' });
  });

  it('enforces rate limits', async () => {
    mockedHeaders.mockResolvedValue({ get: () => 'rate-limit-ip' } as never);
    mockedPrisma.waitlistSignup.upsert.mockResolvedValue({} as never);

    await joinWaitlist('test1@example.com');
    await joinWaitlist('test2@example.com');
    await joinWaitlist('test3@example.com');
    await joinWaitlist('test4@example.com');
    await joinWaitlist('test5@example.com');

    const blockedResult = await joinWaitlist('test6@example.com');
    expect(blockedResult).toEqual({ success: false, error: 'Too many requests. Please try again later.' });
  });
});
