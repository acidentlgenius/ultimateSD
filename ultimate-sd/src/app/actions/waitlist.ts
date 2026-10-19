'use server';

import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { headers } from 'next/headers';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize rate limiter only if Upstash Redis credentials are set
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 signups per hour per IP
    analytics: true,
  });
}

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // Rate limiting logic
  if (ratelimit) {
    let ip = '127.0.0.1'; // Default IP if not found
    try {
      const headersList = await headers();
      const forwardedFor = headersList.get('x-forwarded-for');
      if (forwardedFor) {
        ip = forwardedFor.split(',')[0].trim();
      } else {
        const realIp = headersList.get('x-real-ip');
        if (realIp) {
            ip = realIp;
        }
      }
    } catch (e) {
      console.warn("Could not retrieve IP address for rate limiting", e);
    }

    try {
      const { success } = await ratelimit.limit(`waitlist_signup_${ip}`);
      if (!success) {
        return { success: false, error: 'Too many requests. Please try again later.' };
      }
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open if rate limiter throws an error to avoid blocking legitimate users
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
