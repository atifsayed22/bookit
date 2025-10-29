import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Cache Configuration
 * 
 * Why Redis?
 * 1. In-memory storage = lightning fast access
 * 2. Supports complex data structures
 * 3. Built-in expiration (TTL - Time To Live)
 * 4. Horizontal scaling support
 */

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize Redis connection
   * Learning: Connection patterns for reliability
   */
  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          // Exponential backoff for reconnection
          // Learning: Resilient connection handling
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server connection refused.');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Graceful degradation - app works without cache
      this.isConnected = false;
    }
  }

  /**
   * Generic GET method with error handling
   * Learning: Always handle cache misses gracefully
   */
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache GET error:', error);
      return null; // Fail silently, don't break the app
    }
  }

  /**
   * Generic SET method with TTL (Time To Live)
   * Learning: Always set expiration to prevent memory bloat
   */
  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache SET error:', error);
      return false;
    }
  }

  /**
   * Delete cache entry
   * Learning: Cache invalidation is crucial for data consistency
   */
  async delete(key) {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Cache DELETE error:', error);
      return false;
    }
  }

  /**
   * User-specific caching methods
   * Learning: Domain-specific cache methods improve code readability
   */
  
  // Cache user profile (24 hours)
  async cacheUser(userId, userData) {
    return this.set(`user:${userId}`, userData, 86400);
  }

  async getUser(userId) {
    return this.get(`user:${userId}`);
  }

  // Cache business profile (1 hour)
  async cacheBusiness(businessId, businessData) {
    return this.set(`business:${businessId}`, businessData, 3600);
  }

  async getBusiness(businessId) {
    return this.get(`business:${businessId}`);
  }

  // Cache search results (30 minutes)
  async cacheSearchResults(query, location, results) {
    const key = `search:${query}:${location}`;
    return this.set(key, results, 1800);
  }

  async getSearchResults(query, location) {
    const key = `search:${query}:${location}`;
    return this.get(key);
  }

  /**
   * Cache invalidation patterns
   * Learning: When data changes, related caches must be cleared
   */
  async invalidateUserCache(userId) {
    return this.delete(`user:${userId}`);
  }

  async invalidateBusinessCache(businessId) {
    // Clear business cache
    await this.delete(`business:${businessId}`);
    
    // Clear related search caches (more complex, but important)
    // In production, you'd use Redis patterns or tags for this
  }

  /**
   * Graceful shutdown
   * Learning: Always clean up resources
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log('Redis disconnected');
    }
  }
}

// Export singleton instance
// Learning: Singleton pattern ensures one Redis connection per app
export default new CacheService();