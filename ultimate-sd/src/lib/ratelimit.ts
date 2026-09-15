import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a redis client conditionally based on env variables.
const createRedisClient = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
};

const redis = createRedisClient();

// Default fallback when Redis is disabled/missing env var
export const getWaitlistRateLimit = () => {
    if (!redis) {
        return {
            limit: async (identifier: string) => ({ success: true })
        } as any;
    }
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
        prefix: '@upstash/ratelimit',
    });
};
