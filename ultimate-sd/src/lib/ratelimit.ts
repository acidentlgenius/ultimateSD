import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client conditionally to avoid build errors if env vars are missing
let redis: Redis | undefined;
let ratelimiter: Ratelimit | undefined;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Create a new ratelimiter, that allows 10 requests per 10 seconds
  ratelimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
  });
}

export async function rateLimit(identifier: string) {
  if (!ratelimiter) {
    // If not configured, allow by default
    return { success: true };
  }
  return await ratelimiter.limit(identifier);
}
