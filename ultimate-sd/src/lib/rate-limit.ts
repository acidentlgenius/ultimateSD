export class RateLimiter {
  private counts = new Map<string, { count: number; expiresAt: number }>();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {
    // Periodic cleanup of expired entries
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.counts.entries()) {
        if (now > data.expiresAt) {
          this.counts.delete(key);
        }
      }
    }, 60000);
    // Ensure the interval doesn't prevent Node from exiting
    if (interval.unref) {
      interval.unref();
    }
  }

  public check(key: string): { allowed: boolean } {
    const now = Date.now();
    const data = this.counts.get(key);

    if (!data || now > data.expiresAt) {
      this.counts.set(key, { count: 1, expiresAt: now + this.windowMs });
      return { allowed: true };
    }

    if (data.count >= this.maxRequests) {
      return { allowed: false };
    }

    data.count++;
    return { allowed: true };
  }
}

// Global instance for waitlist (e.g., 5 requests per hour per IP)
export const waitlistRateLimiter = new RateLimiter(5, 60 * 60 * 1000);
