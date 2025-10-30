import rateLimit from 'express-rate-limit';
import { redis } from '../redis.js';

/**
 * Redis store for rate limiting (optional)
 * Falls back to memory store when Redis is unavailable
 */
class RedisStore {
  prefix: string;
  windowMs: number;

  constructor(prefix: string = 'rl:', windowMs: number = 60000) {
    this.prefix = prefix;
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
    // If Redis is not configured, skip (will use default memory store)
    if (!redis) {
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }

    const prefixedKey = this.prefix + key;
    
    try {
      // Runtime check: attempt to ping Redis
      const status = redis.status;
      if (status !== 'ready' && status !== 'connect') {
        return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
      }

      const multi = redis.multi();
      multi.incr(prefixedKey);
      multi.pttl(prefixedKey);
      
      const results = await multi.exec();
      if (!results) {
        throw new Error('Redis transaction failed');
      }

      const hits = results[0][1] as number;
      const ttl = results[1][1] as number;
      
      let resetTime: Date;
      if (ttl === -1) {
        // Key has no expiration, set it using windowMs
        const expirySeconds = Math.ceil(this.windowMs / 1000);
        await redis.expire(prefixedKey, expirySeconds);
        resetTime = new Date(Date.now() + this.windowMs);
      } else if (ttl > 0) {
        resetTime = new Date(Date.now() + ttl);
      } else {
        resetTime = new Date(Date.now() + this.windowMs);
      }

      return {
        totalHits: hits,
        resetTime,
      };
    } catch (error) {
      console.error('Rate limit Redis error:', error);
      // Fail open (allow request) on Redis errors
      return { totalHits: 1, resetTime: new Date(Date.now() + this.windowMs) };
    }
  }

  async decrement(key: string): Promise<void> {
    if (!redis) return;
    
    try {
      const status = redis.status;
      if (status !== 'ready' && status !== 'connect') {
        return;
      }
      
      await redis.decr(this.prefix + key);
    } catch (error) {
      console.error('Rate limit decrement error:', error);
      // Non-critical operation, just log
    }
  }

  async resetKey(key: string): Promise<void> {
    if (!redis) return;
    
    try {
      const status = redis.status;
      if (status !== 'ready' && status !== 'connect') {
        return;
      }
      
      await redis.del(this.prefix + key);
    } catch (error) {
      console.error('Rate limit reset error:', error);
      // Non-critical operation, just log
    }
  }
}

// Log warning if Redis is not configured
if (!redis && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Redis not configured. Using memory-based rate limiting. For production scalability across multiple instances, set REDIS_URL.');
}

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore('rl:auth:', 15 * 60 * 1000) : undefined,
  // Don't skip in production - always enforce
  skip: (req) => false,
});

/**
 * Moderate rate limiter for API endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore('rl:api:', 15 * 60 * 1000) : undefined,
  skip: (req) => false,
});

/**
 * Lenient rate limiter for general routes
 * 1000 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore('rl:general:', 15 * 60 * 1000) : undefined,
  skip: (req) => false,
});

/**
 * Strict limiter for test submission
 * 30 requests per 15 minutes per IP
 */
export const testSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Too many test submissions, please wait before submitting again',
  standardHeaders: true,
  legacyHeaders: false,
  store: redis ? new RedisStore('rl:test:', 15 * 60 * 1000) : undefined,
  skip: (req) => false,
});
