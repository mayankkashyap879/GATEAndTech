import Redis from 'ioredis';

// Redis connection for caching and sessions
// Use Upstash Redis or local Redis if REDIS_URL is set
const redisUrl = process.env.REDIS_URL;

// Create Redis client only if REDIS_URL is provided
let redis: Redis | null = null;
let isRedisAvailable = false;

if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  // Handle connection events
  redis.on('connect', () => {
    isRedisAvailable = true;
    console.log('✅ Redis connected successfully');
  });

  redis.on('error', (err) => {
    isRedisAvailable = false;
    console.error('❌ Redis connection error:', err.message);
  });
  
  // Connect to Redis
  redis.connect().catch((err) => {
    isRedisAvailable = false;
    console.warn('⚠️ Redis not available, running without caching:', err.message);
  });
} else {
  console.warn('⚠️ REDIS_URL not set, running without caching. Set REDIS_URL for production scalability.');
}

/**
 * Wait for Redis to be ready
 */
export async function waitForRedis(timeout: number = 5000): Promise<boolean> {
  if (!redis) return false;
  
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (isRedisAvailable) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

export { redis, isRedisAvailable };

// Cache helper functions with null safety
export const cache = {
  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis || !isRedisAvailable) return null;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set cached data with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!redis || !isRedisAvailable) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    if (!redis || !isRedisAvailable) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  },

  /**
   * Clear cache by pattern using SCAN (non-blocking)
   */
  async clearPattern(pattern: string): Promise<void> {
    if (!redis || !isRedisAvailable) return;
    try {
      let cursor = '0';
      do {
        const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = newCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      console.error(`Cache clear pattern error for ${pattern}:`, error);
    }
  },

  /**
   * Increment counter (for upvotes, view counts, etc.)
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!redis || !isRedisAvailable) return 0;
    try {
      return await redis.incrby(key, amount);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  },

  /**
   * Add to sorted set (for leaderboards, rankings)
   */
  async addToSortedSet(key: string, score: number, member: string): Promise<void> {
    if (!redis || !isRedisAvailable) return;
    try {
      await redis.zadd(key, score, member);
    } catch (error) {
      console.error(`Sorted set add error for key ${key}:`, error);
    }
  },

  /**
   * Get leaderboard (top N members)
   */
  async getLeaderboard(key: string, limit: number = 10): Promise<Array<{member: string, score: number}>> {
    if (!redis || !isRedisAvailable) return [];
    try {
      const results = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
      const leaderboard = [];
      for (let i = 0; i < results.length; i += 2) {
        leaderboard.push({
          member: results[i],
          score: parseFloat(results[i + 1]),
        });
      }
      return leaderboard;
    } catch (error) {
      console.error(`Leaderboard get error for key ${key}:`, error);
      return [];
    }
  },

  /**
   * Get member rank in sorted set
   */
  async getRank(key: string, member: string): Promise<number | null> {
    if (!redis || !isRedisAvailable) return null;
    try {
      const rank = await redis.zrevrank(key, member);
      return rank !== null ? rank + 1 : null; // Convert to 1-based ranking
    } catch (error) {
      console.error(`Rank get error for key ${key}:`, error);
      return null;
    }
  },
};

export default redis;
