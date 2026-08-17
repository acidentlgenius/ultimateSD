export class RateLimiter {
  private store: Map<string, { count: number; expiresAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private maxRequests: number, private windowMs: number) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public check(ip: string): boolean {
    const now = Date.now();
    const record = this.store.get(ip);

    if (!record || record.expiresAt < now) {
      this.store.set(ip, { count: 1, expiresAt: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count += 1;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.store.entries()) {
      if (record.expiresAt < now) {
        this.store.delete(ip);
      }
    }
  }

  // Exported purely to reset state during testing
  public _resetForTesting(): void {
    this.store.clear();
  }
}
