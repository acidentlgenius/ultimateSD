export type RateLimitRecord = {
  count: number;
  resetTime: number;
};

export class RateLimiter {
  private store: Map<string, RateLimitRecord>;
  private limit: number;
  private windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(limit: number, windowMs: number) {
    this.store = new Map();
    this.limit = limit;
    this.windowMs = windowMs;

    // Cleanup expired entries periodically
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (now > record.resetTime) {
          this.store.delete(key);
        }
      }
    }, Math.max(windowMs, 60000));

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public check(key: string): { success: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      const resetTime = now + this.windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { success: true, remaining: Math.max(0, this.limit - 1), resetTime };
    }

    if (record.count < this.limit) {
      record.count += 1;
      return { success: true, remaining: this.limit - record.count, resetTime: record.resetTime };
    }

    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  public reset(key: string) {
    this.store.delete(key);
  }

  public close() {
    clearInterval(this.cleanupInterval);
  }
}
