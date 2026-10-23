'use server';

import { headers } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';

let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
  });
}

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  if (ratelimit) {
    try {
      const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1';
      const { success } = await ratelimit.limit(`waitlist:${ip}`);
      if (!success) {
        return { success: false, error: 'Too many requests. Please try again later.' };
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Rate limit failed, bypassing:', error);
      }
    }
  }

  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    // Upsert = idempotent: signing up twice is a no-op, not an error.
    await prisma.waitlistSignup.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized, feature: 'aiInterviewer' },
    });
    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to join waitlist:', error);
    }
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
