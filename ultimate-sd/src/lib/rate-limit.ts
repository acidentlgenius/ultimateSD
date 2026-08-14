export class RateLimiter {
  private cache = new Map<string, { count: number; expiresAt: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  check(key: string): { success: boolean; remaining: number } {
    const now = Date.now();
    this.startCleanupInterval();

    let record = this.cache.get(key);
    if (!record || now > record.expiresAt) {
      record = { count: 0, expiresAt: now + this.windowMs };
    }

    if (record.count >= this.maxRequests) {
      return { success: false, remaining: 0 };
    }

    record.count++;
    this.cache.set(key, record);

    return {
      success: true,
      remaining: this.maxRequests - record.count,
    };
  }

  private startCleanupInterval() {
    if (!this.cleanupInterval) {
      // Run cleanup every windowMs
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.cache.entries()) {
          // Changed from > to >= just to be safe, but more importantly, we need to make sure the time advanced is greater than windowMs
          if (now >= record.expiresAt) {
            this.cache.delete(key);
          }
        }
        if (this.cache.size === 0 && this.cleanupInterval) {
          clearInterval(this.cleanupInterval);
          this.cleanupInterval = null;
        }
      }, this.windowMs);

      // Allow node to exit even if this is running
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  // for testing
  _resetStorageCacheForTesting() {
    this.cache.clear();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
