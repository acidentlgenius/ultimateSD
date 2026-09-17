import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 3 requests per 1 minute
// Conditional initialization because Upstash vars are optional at build time
export const waitlistRatelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit:waitlist",
    })
  : null;
