/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse with configurable limits
 */

import { useState, useEffect } from 'react';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: Date;
  };
}

/** Deterministic short fingerprint for in-memory rate keys — not persisted to PCMS databases. */
function fingerprintClientIp(ip: string): string {
  let h = 5381;
  for (let i = 0; i < ip.length; i++) {
    h = (h * 33) ^ ip.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };
  }

  /**
   * Check if request is allowed
   */
  check(request: Request): RateLimitResult {
    const key = this.getKey(request);
    const now = new Date();
    
    // Clean up expired entries
    this.cleanup(now);
    
    // Get or create entry
    let entry = this.store[key];
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: new Date(now.getTime() + this.config.windowMs),
      };
      this.store[key] = entry;
    }

    // Check if limit exceeded
    const success = entry.count < this.config.maxRequests;
    
    if (success) {
      entry.count++;
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const retryAfter = success ? undefined : Math.ceil((entry.resetTime.getTime() - now.getTime()) / 1000);

    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  /**
   * Generate key for request
   */
  private getKey(request: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }

    // Default: in-memory bucket keyed by hashed client IP (never written to Supabase session rows).
    const forwarded = request.headers.get('x-forwarded-for');
    const raw = forwarded ? forwarded.split(',')[0].trim() : '';
    if (!raw) return 'ip:unknown';
    return `ip:${fingerprintClientIp(raw)}`;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(now: Date): void {
    for (const key in this.store) {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    }
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string): {
    count: number;
    limit: number;
    remaining: number;
    resetTime: Date;
  } | null {
    const entry = this.store[key];
    if (!entry) return null;

    return {
      count: entry.count,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset limit for a key
   */
  reset(key: string): void {
    delete this.store[key];
  }

  /**
   * Get all current limits
   */
  getAllLimits(): RateLimitStore {
    return { ...this.store };
  }
}

// Predefined rate limiters
export const publicApiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

export const researchApiLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // 1000 requests per minute
  keyGenerator: (req) => {
    const apiKey = req.headers.get('x-research-api-key') || req.headers.get('authorization');
    return apiKey ? `api:${apiKey}` : `ip:${req.headers.get('x-forwarded-for') || 'unknown'}`;
  },
});

export const exportApiLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 requests per hour
  keyGenerator: (req) => {
    const apiKey = req.headers.get('x-research-api-key') || req.headers.get('authorization');
    return apiKey ? `api:${apiKey}` : `ip:${req.headers.get('x-forwarded-for') || 'unknown'}`;
  },
});

// Middleware function for Next.js API routes
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return function rateLimitMiddleware(request: Request) {
    const result = limiter.check(request);
    
    if (!result.success) {
      return Response.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            retryAfter: result.retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toISOString(),
            'Retry-After': result.retryAfter?.toString() || '',
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    return {
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toISOString(),
      },
    };
  };
}

// Rate limiting hook for React components
export function useRateLimit(limiter: RateLimiter, key: string) {
  const [status, setStatus] = useState<{
    count: number;
    limit: number;
    remaining: number;
    resetTime: Date;
  } | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = limiter.getStatus(key);
      setStatus(currentStatus);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000); // Update every second

    return () => clearInterval(interval);
  }, [limiter, key]);

  return status;
}
