'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { InMemoryRateLimiter } from '@/lib/rate-limit';

// Limit to 5 requests per minute per IP/source.
const waitlistRateLimiter = new InMemoryRateLimiter(60 * 1000, 5);

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizeEmail(email);

  // Rate limit by IP address or fallback to email address
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || 'unknown';
  const rateLimitKey = ip !== 'unknown' ? `ip:${ip}` : `email:${normalized}`;

  if (!waitlistRateLimiter.checkLimit(rateLimitKey)) {
    return { success: false, error: 'Too many requests. Please try again later.' };
  }

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
