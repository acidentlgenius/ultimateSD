import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { joinWaitlist } from '@/app/actions/waitlist';
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
  headers: vi.fn(),
}));

const mockLimit = vi.fn();
vi.mock('@upstash/ratelimit', () => {
  const MockRatelimit = vi.fn(function(this: any) {
    this.limit = mockLimit;
  });
  Object.assign(MockRatelimit, {
    slidingWindow: vi.fn(),
  });
  return { Ratelimit: MockRatelimit };
});

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(),
}));

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('dev@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.domain.co.in')).toBe(true);
  });

  it('rejects garbage', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('a b@example.com')).toBe(false);
  });

  it('rejects overly long addresses', () => {
    expect(isValidEmail('a'.repeat(250) + '@example.com')).toBe(false);
    expect(isValidEmail('dev@example.com')).toBe(true);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Dev@Example.COM ')).toBe('dev@example.com');
  });
});

describe('joinWaitlist', () => {
  const mockHeaders = new Map();

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.clear();
    mockHeaders.set('x-forwarded-for', '127.0.0.1');
    vi.mocked(headers).mockResolvedValue({ get: (key: string) => mockHeaders.get(key) } as any);

    mockLimit.mockResolvedValue({ success: true });
    vi.mocked(prisma.waitlistSignup.upsert).mockResolvedValue({} as any);

    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8080';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
  });

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('fails for invalid email', async () => {
    const result = await joinWaitlist('invalid');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please enter a valid email address.');
  });

  it('succeeds for valid email', async () => {
    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(true);
    expect(prisma.waitlistSignup.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'test@example.com' },
      })
    );
  });

  it('fails if rate limited', async () => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8080';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    mockLimit.mockResolvedValue({ success: false });

    // Ensure we re-import the module under test so the mock is picked up freshly
    const { joinWaitlist: localJoinWaitlist } = await import('@/app/actions/waitlist');
    const result = await localJoinWaitlist('test@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Too many requests. Please try again later.');
    expect(prisma.waitlistSignup.upsert).not.toHaveBeenCalled();
  });

  it('fails gracefully if upsert throws', async () => {
    vi.mocked(prisma.waitlistSignup.upsert).mockRejectedValue(new Error('DB Error'));
    const result = await joinWaitlist('test@example.com');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong. Please try again.');
  });
});
