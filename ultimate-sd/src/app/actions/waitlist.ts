'use server';

import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { waitlistRateLimit } from '@/lib/ratelimit';
import { headers } from 'next/headers';


export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  // Rate-limit before heavy traffic
  const ip = (await headers()).get('x-forwarded-for') || '127.0.0.1';
  const { success } = await waitlistRateLimit.limit(ip);
  if (!success) {
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
