import { headers } from 'next/headers';

// Simple in-memory sliding window rate limiter
// Format: Map<ip_address, { count: number, timestamp: number }[]>
const ipCache = new Map<string, { count: number, timestamp: number }[]>();

// Cleans up old entries periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, history] of ipCache.entries()) {
    const valid = history.filter(h => now - h.timestamp < 60000); // 1 min window
    if (valid.length === 0) {
      ipCache.delete(ip);
    } else {
      ipCache.set(ip, valid);
    }
  }
}, 60000);

if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

export async function rateLimit(limit: number = 5, windowMs: number = 60000) {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';

  const now = Date.now();
  const history = ipCache.get(ip) || [];

  // Filter out events older than the window
  const validHistory = history.filter(h => now - h.timestamp < windowMs);

  const totalCount = validHistory.reduce((sum, h) => sum + h.count, 0);

  if (totalCount >= limit) {
    return { success: false };
  }

  validHistory.push({ count: 1, timestamp: now });
  ipCache.set(ip, validHistory);

  return { success: true };
}

// For testing purposes
export function _resetRateLimitCacheForTesting() {
  ipCache.clear();
}
