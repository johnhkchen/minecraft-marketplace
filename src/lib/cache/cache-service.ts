/**
 * Cache Service - Simple in-memory caching with TTL
 * REFACTOR phase: Extract caching logic for better separation of concerns
 */

import type { ICacheService } from '../interfaces/marketplace-api.interface.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CacheService implements ICacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL: number;

  constructor(defaultTTL = 60000) { // 1 minute default
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get data from cache or execute fetch function if not cached/expired
   */
  async getOrFetch<T>(
    cacheKey: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    
    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache the result
    this.cache.set(cacheKey, { data, timestamp: now });
    
    return data;
  }

  /**
   * Clear specific cache entry
   */
  clear(cacheKey: string): void {
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): { size: number, keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance for shared caching
export const cacheService = new CacheService();