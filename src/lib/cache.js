/**
 * Simple in-memory cache with TTL (Time To Live) support.
 * Used for caching search results to improve performance.
 */

class Cache {
  constructor() {
    this.store = new Map();
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const item = this.store.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Update hit count for analytics
    item.hits++;
    item.lastAccessed = Date.now();
    
    return item.value;
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    const expiresAt = Date.now() + ttl;
    
    this.store.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      hits: 0,
    });
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key from cache
   * @param {string} key - Cache key
   * @returns {boolean} - True if key was deleted
   */
  delete(key) {
    return this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.store.clear();
  }

  /**
   * Remove expired entries
   * @returns {number} - Number of entries removed
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    let totalHits = 0;
    let expired = 0;
    const now = Date.now();

    for (const [key, item] of this.store.entries()) {
      totalHits += item.hits;
      if (now > item.expiresAt) {
        expired++;
      }
    }

    return {
      size: this.store.size,
      totalHits,
      expired,
      active: this.store.size - expired,
    };
  }

  /**
   * Get all cache keys
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.store.keys());
  }
}

// Export singleton instance
const cache = new Cache();

// Auto-cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const removed = cache.cleanup();
    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  }, 10 * 60 * 1000);
}

export default cache;
