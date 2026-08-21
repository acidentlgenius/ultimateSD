'use server';

import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {

  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';
  const { success: rateLimitSuccess } = checkRateLimit(ip);
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
