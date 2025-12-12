// Simple in-memory cache utility with TTL support
// For production, consider using Redis for distributed caching

class Cache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set a value in cache with optional TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
   */
  set(key, value, ttl = 300) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, value);

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl * 1000);

    this.timers.set(key, timer);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.cache.clear();
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Pattern to match (simple string contains)
   */
  deletePattern(pattern) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }
}

// Singleton instance
const cache = new Cache();

/**
 * Cache middleware wrapper for async functions
 * @param {string} keyPrefix - Prefix for cache key
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Function to generate cache key from req
 */
export const cacheMiddleware = (keyPrefix, ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      // Generate cache key
      let cacheKey = keyPrefix;
      if (keyGenerator && typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        // Default: use user id and query params
        const userId = req.user?.id || 'guest';
        const queryString = JSON.stringify(req.query);
        cacheKey = `${keyPrefix}:${userId}:${queryString}`;
      }

      // Check cache
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log(`Cache hit: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data) {
        if (res.statusCode === 200 && data?.success) {
          cache.set(cacheKey, data, ttl);
          console.log(`Cache set: ${cacheKey}`);
        }
        return originalJson(data);
      };

      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      next();
    }
  };
};

/**
 * Helper to invalidate cache for specific patterns
 * @param {string} pattern - Pattern to match
 */
export const invalidateCache = (pattern) => {
  cache.deletePattern(pattern);
  console.log(`Cache invalidated: ${pattern}`);
};

export default cache;
