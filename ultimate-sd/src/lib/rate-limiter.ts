import { RateLimiterMemory } from 'rate-limiter-flexible';
import { headers } from 'next/headers';

// Set up a simple in-memory rate limiter for waitlist signups
const waitlistRateLimiter = new RateLimiterMemory({
  points: 5, // 5 requests
  duration: 60 * 60, // per hour by IP
});

export async function checkRateLimit(): Promise<{ success: boolean; error?: string }> {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
    await waitlistRateLimiter.consume(ip, 1);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
        // Just unexpected error
    } else {
        // RateLimiterRes
        return { success: false, error: 'Too many requests, please try again later.' };
    }
    return { success: false, error: 'Too many requests, please try again later.' };
  }
}
