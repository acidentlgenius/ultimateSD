interface RateLimitInfo {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as { rateLimitCache: Map<string, RateLimitInfo> | undefined };

export const rateLimitCache = globalForRateLimit.rateLimitCache ?? new Map<string, RateLimitInfo>();

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimit.rateLimitCache = rateLimitCache;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const info = rateLimitCache.get(key);

  if (!info) {
    rateLimitCache.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (now > info.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (info.count >= limit) {
    return false;
  }

  info.count += 1;
  return true;
}

// Simple cleanup function that can be called periodically if needed
export function cleanupRateLimitCache(): void {
  const now = Date.now();
  for (const [key, info] of rateLimitCache.entries()) {
    if (now > info.resetAt) {
      rateLimitCache.delete(key);
    }
  }
}
