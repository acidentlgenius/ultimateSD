interface RateLimitInfo {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitInfo>();
const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60000;

let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, info] of rateLimits.entries()) {
      if (now > info.resetAt) {
        rateLimits.delete(key);
      }
    }
  }, DEFAULT_WINDOW_MS);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

export function rateLimit(
  identifier: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS
): { success: boolean; limit: number; remaining: number; resetAt: number } {
  startCleanup();

  const now = Date.now();
  const record = rateLimits.get(identifier);

  if (!record || now >= record.resetAt) {
    const newRecord = { count: 1, resetAt: now + windowMs };
    rateLimits.set(identifier, newRecord);
    return { success: true, limit, remaining: limit - 1, resetAt: newRecord.resetAt };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, resetAt: record.resetAt };
}

export function _resetStorageCacheForTesting() {
  rateLimits.clear();
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
