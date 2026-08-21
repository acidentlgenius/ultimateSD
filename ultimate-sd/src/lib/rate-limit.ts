interface RateLimitData {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitData>();
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

// Periodic cleanup to prevent memory leaks
let cleanupTimer: NodeJS.Timeout | null = null;

function ensureCleanupTimer() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of rateLimits.entries()) {
        if (now > data.resetAt) {
          rateLimits.delete(key);
        }
      }

      // Stop the timer if the map is empty to save resources
      if (rateLimits.size === 0 && cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
      }
    }, CLEANUP_INTERVAL_MS);

    // Ensure the timer doesn't keep the Node.js process alive
    if (cleanupTimer.unref) {
      cleanupTimer.unref();
    }
  }
}

/**
 * A simple in-memory rate limiter.
 * @param key The unique identifier for the client (e.g., IP address).
 * @param limit The maximum number of requests allowed within the window.
 * @param windowMs The time window in milliseconds.
 * @returns An object indicating whether the limit is exceeded and the remaining requests.
 */
export function checkRateLimit(key: string, limit: number = 5, windowMs: number = 60 * 1000): {
  success: boolean;
  remaining: number;
  resetAt: number;
} {
  ensureCleanupTimer();

  const now = Date.now();
  const data = rateLimits.get(key);

  if (!data || now > data.resetAt) {
    // New or expired entry
    const resetAt = now + windowMs;
    rateLimits.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (data.count >= limit) {
    // Rate limit exceeded
    return { success: false, remaining: 0, resetAt: data.resetAt };
  }

  // Increment count
  data.count += 1;
  return { success: true, remaining: limit - data.count, resetAt: data.resetAt };
}

/**
 * Primarily for testing: completely reset the rate limiter state.
 */
export function _resetRateLimitCacheForTesting() {
  rateLimits.clear();
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
