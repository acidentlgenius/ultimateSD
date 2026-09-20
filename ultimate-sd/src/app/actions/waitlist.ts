'use server';

import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { headers } from 'next/headers';
import { ratelimit } from '@/lib/ratelimit';

// TODO: rate-limit before heavy traffic
export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1';

  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(`waitlist_${ip}`);
      if (!success) {
        return { success: false, error: 'Too many requests. Please try again later.' };
      }
    } catch (error) {
      console.warn('Rate limiter failed, allowing request:', error);
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
    console.error('Failed to join waitlist:', error);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
