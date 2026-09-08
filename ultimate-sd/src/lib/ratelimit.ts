import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter, that allows 5 requests per 1 minute
export const ratelimit = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      /**
       * Optional prefix for the keys used in redis. This is useful if you want to share a redis
       * instance with other applications and want to avoid key collisions. The default prefix is
       * "@upstash/ratelimit"
       */
      prefix: "@upstash/ratelimit/waitlist",
    })
  : null;
