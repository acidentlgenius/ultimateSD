import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Conditionally initialize Redis to prevent crashing if env vars are missing
let redisClient: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = Redis.fromEnv();
}

export const ratelimit = redisClient
  ? new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(5, '10 s'), // e.g. 5 requests per 10 seconds for waitlist
      analytics: true,
      prefix: 'waitlist-ratelimit',
    })
  : null;
