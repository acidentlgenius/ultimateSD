export class RateLimiter {
  private tokens = new Map<string, { count: number; lastRefill: number }>();
  private readonly maxTokens: number;
  private readonly refillRate: number; // Tokens to add per millisecond
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxTokens: number, windowMs: number) {
    this.maxTokens = maxTokens;
    this.refillRate = maxTokens / windowMs;

    // Cleanup stale entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.tokens.entries()) {
        // If the time since last refill would fully replenish the bucket, it's stale
        if (now - data.lastRefill >= windowMs) {
          this.tokens.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  check(identifier: string, tokensToConsume = 1): boolean {
    const now = Date.now();
    const data = this.tokens.get(identifier);

    if (!data) {
      if (tokensToConsume <= this.maxTokens) {
        this.tokens.set(identifier, { count: this.maxTokens - tokensToConsume, lastRefill: now });
        return true;
      }
      return false;
    }

    const timePassed = now - data.lastRefill;
    const newTokens = Math.min(this.maxTokens, data.count + timePassed * this.refillRate);

    if (newTokens >= tokensToConsume) {
      this.tokens.set(identifier, { count: newTokens - tokensToConsume, lastRefill: now });
      return true;
    }

    return false;
  }

  reset(identifier: string) {
    this.tokens.delete(identifier);
  }
}

// Default instance for AI routes: 10 requests per minute
export const aiRateLimiter = new RateLimiter(10, 60 * 1000);