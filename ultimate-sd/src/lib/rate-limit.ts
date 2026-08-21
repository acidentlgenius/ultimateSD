export interface RateLimitResult {
  success: boolean;
}

export class RateLimiter {
  private store = new Map<string, { count: number; expiresAt: number }>();
  private windowMs: number;
  private maxRequests: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(options: { windowMs: number; maxRequests: number }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;

    // Cleanup periodically to prevent memory leaks
    const intervalTime = Math.min(Math.max(60_000, this.windowMs / 10), 5 * 60_000);
    this.cleanupInterval = setInterval(() => this.cleanup(), intervalTime);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.expiresAt < now) {
      this.store.set(key, { count: 1, expiresAt: now + this.windowMs });
      return { success: true };
    }

    if (entry.count >= this.maxRequests) {
      return { success: false };
    }

    entry.count += 1;
    return { success: true };
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  public destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// 5 requests per hour for waitlist
export const waitlistRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
});
