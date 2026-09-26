import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}

// Global rate limiter for general API routes
export const globalRatelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"), // 20 requests per minute
  analytics: true,
}) : null;

// Stricter rate limiter for AI operations
export const aiRatelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
  analytics: true,
}) : null;

export async function checkRateLimit(
    identifier: string,
    limiter: Ratelimit | null = globalRatelimit
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    if (!limiter) {
        // Graceful degradation: If Upstash is not configured, allow requests by default.
        return { success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 };
    }

    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier);
        return { success, limit, remaining, reset };
    } catch (error) {
        console.error("Rate limit check failed, allowing request to proceed:", error);
        return { success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 };
    }
}
