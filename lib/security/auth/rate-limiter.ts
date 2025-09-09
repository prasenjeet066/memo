interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiterSystem {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts: { [key: string]: number } = {
    login: 5,
    register: 3,
    default: 10
  };
  private readonly windowMs: number = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  checkRequest(identifier: string, type: string = 'default'): boolean {
    const key = `${identifier}-${type}`;
    const now = Date.now();
    const entry = this.attempts.get(key);
    
    // If no entry or window expired, allow request
    if (!entry || now > entry.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    // Check if limit exceeded
    const maxAttempts = this.maxAttempts[type] || this.maxAttempts.default;
    if (entry.count >= maxAttempts) {
      return false;
    }
    
    // Increment counter
    entry.count++;
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts) {
      if (now > entry.resetTime) {
        this.attempts.delete(key);
      }
    }
  }

  getRemainingAttempts(identifier: string, type: string = 'default'): number {
    const key = `${identifier}-${type}`;
    const entry = this.attempts.get(key);
    const maxAttempts = this.maxAttempts[type] || this.maxAttempts.default;
    
    if (!entry || Date.now() > entry.resetTime) {
      return maxAttempts;
    }
    
    return Math.max(0, maxAttempts - entry.count);
  }
}