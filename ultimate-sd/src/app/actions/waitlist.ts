'use server';

import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { RateLimiter } from '@/lib/rate-limit';
import { headers } from 'next/headers';

// Limit to 5 signups per IP per hour to prevent abuse
const waitlistRateLimiter = new RateLimiter(5, 60 * 60 * 1000);

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown-ip';
  const { success: rateLimitSuccess } = waitlistRateLimiter.check(ip);

  if (!rateLimitSuccess) {
    return { success: false, error: 'Too many requests. Please try again later.' };
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
    console.error('Failed to join waitlist:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
