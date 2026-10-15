import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis only if the required env vars are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = (redisUrl && redisToken)
  ? new Redis({ url: redisUrl, token: redisToken })
  : null;

// Create a generic rate limiter instance
export const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
      analytics: true,
    })
  : null;

export async function checkRateLimit(ip: string): Promise<{ success: boolean }> {
  if (!ratelimit) {
    // Graceful degradation if Redis is not configured
    return { success: true };
  }

  try {
    const { success } = await ratelimit.limit(ip);
    return { success };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open if Upstash is down
    return { success: true };
  }
}
