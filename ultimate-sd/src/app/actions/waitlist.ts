'use server';

import { prisma } from '@/lib/prisma';
import { isValidEmail, normalizeEmail } from '@/lib/waitlist';
import { headers } from 'next/headers';

// Simple in-memory rate limiter for a single Node process instance.
// To prevent unbounded memory growth from a Map, we use an array of Maps
// to implement a rotating window. This requires zero external dependencies.
const RATE_LIMIT_WINDOWS = 2; // Keep current and previous window
const WINDOW_DURATION_MS = 60 * 1000;
const MAX_REQUESTS = 5;

let windows: Map<string, number>[] = [new Map(), new Map()];
let currentWindowIndex = 0;
let lastRotation = Date.now();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Rotate windows if enough time has passed
  if (now - lastRotation >= WINDOW_DURATION_MS) {
    const elapsedWindows = Math.floor((now - lastRotation) / WINDOW_DURATION_MS);
    if (elapsedWindows >= RATE_LIMIT_WINDOWS) {
      windows = [new Map(), new Map()];
    } else {
      // Just shift one window
      windows[1 - currentWindowIndex].clear();
      currentWindowIndex = 1 - currentWindowIndex;
    }
    lastRotation = now;
  }

  const currentWindow = windows[currentWindowIndex];
  const previousWindow = windows[1 - currentWindowIndex];

  // Calculate weighted count based on time elapsed in current window
  const currentCount = currentWindow.get(ip) || 0;
  const previousCount = previousWindow.get(ip) || 0;

  const timeInCurrentWindow = now - lastRotation;
  const weight = 1 - (timeInCurrentWindow / WINDOW_DURATION_MS);

  // Rolling window estimate
  const estimatedCount = currentCount + (previousCount * weight);

  if (estimatedCount >= MAX_REQUESTS) {
    return false;
  }

  currentWindow.set(ip, currentCount + 1);
  return true;
}

export async function joinWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  // Simple in-memory rate limit by IP to prevent abuse/DDoS
  const ip = (await headers()).get('x-forwarded-for') ?? '127.0.0.1';
  if (!checkRateLimit(ip)) {
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
