'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { waitlistRateLimiter } from '@/lib/rate-limit';

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  // Apply rate limiting based on client IP
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'anonymous';

  const rateLimitResult = waitlistRateLimiter.check(ip);
  if (!rateLimitResult.success) {
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
