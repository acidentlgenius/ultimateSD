import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize if variables are present, else fallback to a mock/bypass
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
    analytics: true,
  });
}

export async function checkRateLimit(ip: string | null): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!ratelimit) {
    // Graceful degradation when missing env vars
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }

  const identifier = ip || 'anonymous';
  const { success, limit, remaining, reset } = await ratelimit.limit(`waitlist_ratelimit_${identifier}`);

  return { success, limit, remaining, reset };
}
