import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize if we have the environment variables, to allow local build/dev to work
// without throwing errors if they don't have Upstash Redis set up.
export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Default ratelimiter: 10 requests per 10 seconds.
export const waitlistRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'), // Strict for waitlist
      analytics: true,
      prefix: '@upstash/ratelimit/waitlist',
    })
  : {
      limit: async () => ({ success: true }), // Dummy return for dev if redis is not set up
    };
