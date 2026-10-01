'use server';

import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { headers } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';



const upstashRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = upstashRestUrl && upstashRestToken
  ? new Redis({ url: upstashRestUrl, token: upstashRestToken })
  : null;

const ratelimit = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), analytics: true })
  : null;

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (ratelimit) {
    const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(`ratelimit_waitlist_${ip}`);
    if (!success) {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }
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
    console.error('Failed to join waitlist:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
