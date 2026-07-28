'use server';

import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { headers } from 'next/headers';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5; // requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

// Periodically clean up expired entries to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, info] of rateLimitMap.entries()) {
      if (now > info.resetAt) {
        rateLimitMap.delete(key);
      }
    }
    lastCleanup = now;
  }
}

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  cleanupRateLimitMap();

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const rateLimitInfo = rateLimitMap.get(ip);
  if (rateLimitInfo) {
    if (now < rateLimitInfo.resetAt) {
      if (rateLimitInfo.count >= RATE_LIMIT_MAX) {
        return { success: false, error: 'Too many requests. Please try again later.' };
      }
      rateLimitInfo.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
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
