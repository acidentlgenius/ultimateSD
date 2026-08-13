interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number
  ) {
    // Run cleanup every windowMs / 2 to ensure timely eviction
    this.cleanupInterval = setInterval(() => this.cleanup(), Math.max(1000, Math.floor(this.windowMs / 2)));
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public checkLimit(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (now > entry.resetAt) {
      // Window expired, reset
      entry.count = 1;
      entry.resetAt = now + this.windowMs;
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false; // Rate limited
    }

    entry.count++;
    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  public destroy() {
    clearInterval(this.cleanupInterval);
  }
}
