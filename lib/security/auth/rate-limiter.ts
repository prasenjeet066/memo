interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiterSystem {
  private requests: Map < string, RateLimitRecord > ;
  private readonly limits: Record < string, { max: number;window: number } > ;
  
  constructor() {
    this.requests = new Map();
    this.limits = {
      register: { max: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
      login: { max: 10, window: 15 * 60 * 1000 }, // 10 attempts per 15 minutes
      default: { max: 30, window: 60 * 1000 }, // 30 requests per minute
    };
    
    // Clean up expired records every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  checkRequest(identifier: string, type: string = 'default'): boolean {
    const key = `${type}:${identifier}`;
    const now = Date.now();
    const limit = this.limits[type] || this.limits.default;
    
    const record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      this.requests.set(key, {
        count: 1,
        resetTime: now + limit.window,
      });
      return true;
    }
    
    if (record.count >= limit.max) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
  
  reset(identifier: string, type: string = 'default'): void {
    const key = `${type}:${identifier}`;
    this.requests.delete(key);
  }
}