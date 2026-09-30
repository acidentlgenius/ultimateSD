'use server';

import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { waitlistRateLimiter } from '@/lib/ratelimit';

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  // Rate limit based on IP
  const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1';
  const { success: rateLimitSuccess } = await waitlistRateLimiter.limit(ip);
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
