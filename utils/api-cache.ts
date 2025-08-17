import { ApiRestaurant, RestaurantListResponse } from '@/utils/api';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

// Cache configuration by data type
const CACHE_CONFIG = {
  // Static/rarely changing data - cache for 1 hour
  'cuisine-types': { ttl: 60 * 60 * 1000, maxSize: 1 },
  'venue-types': { ttl: 60 * 60 * 1000, maxSize: 1 },
  'amenities': { ttl: 60 * 60 * 1000, maxSize: 1 },
  'review-categories': { ttl: 60 * 60 * 1000, maxSize: 1 },
  
  // Restaurant lists - cache for 5 minutes
  'restaurants-nearby': { ttl: 5 * 60 * 1000, maxSize: 20 },
  'restaurants-search': { ttl: 5 * 60 * 1000, maxSize: 10 },
  'restaurants-viewport': { ttl: 3 * 60 * 1000, maxSize: 15 },
  
  // Individual restaurant details - cache for 10 minutes  
  'restaurant-detail': { ttl: 10 * 60 * 1000, maxSize: 50 },
  'restaurant-reviews': { ttl: 5 * 60 * 1000, maxSize: 30 },
  'restaurant-analytics': { ttl: 10 * 60 * 1000, maxSize: 20 },
  
  // User-specific data - cache briefly
  'user-reviews': { ttl: 2 * 60 * 1000, maxSize: 5 },
  'user-profile': { ttl: 5 * 60 * 1000, maxSize: 1 },
  
  // Autocomplete/suggestions - cache very briefly
  'autocomplete': { ttl: 30 * 1000, maxSize: 50 }
} as const;

type CacheType = keyof typeof CACHE_CONFIG;

/**
 * Lightweight memory cache with TTL and LRU eviction
 */
class ApiCache {
  private caches: Map<CacheType, Map<string, CacheEntry<any>>> = new Map();
  
  constructor() {
    // Initialize cache maps
    Object.keys(CACHE_CONFIG).forEach(type => {
      this.caches.set(type as CacheType, new Map());
    });
    
    // Periodic cleanup every 2 minutes
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }
  
  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, params: any): string {
    if (typeof params === 'string' || typeof params === 'number') {
      return `${prefix}:${params}`;
    }
    
    if (typeof params === 'object' && params !== null) {
      // Sort keys for consistent hashing
      const sortedKeys = Object.keys(params).sort();
      const keyParts = sortedKeys.map(key => `${key}=${params[key]}`);
      return `${prefix}:${keyParts.join('&')}`;
    }
    
    return `${prefix}:${JSON.stringify(params)}`;
  }
  
  /**
   * Get data from cache
   */
  get<T>(cacheType: CacheType, key: string, params?: any): T | null {
    const cache = this.caches.get(cacheType);
    if (!cache) return null;
    
    const cacheKey = params ? this.generateKey(key, params) : key;
    const entry = cache.get(cacheKey);
    
    if (!entry) {
      console.log(`📦 Cache MISS: ${cacheType}:${cacheKey}`);
      return null;
    }
    
    // Check if entry is expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      console.log(`⏰ Cache EXPIRED: ${cacheType}:${cacheKey}`);
      cache.delete(cacheKey);
      return null;
    }
    
    console.log(`✅ Cache HIT: ${cacheType}:${cacheKey} (age: ${now - entry.timestamp}ms)`);
    
    // Move to end (LRU behavior)
    cache.delete(cacheKey);
    cache.set(cacheKey, entry);
    
    return entry.data;
  }
  
  /**
   * Set data in cache
   */
  set<T>(cacheType: CacheType, key: string, data: T, params?: any): void {
    const cache = this.caches.get(cacheType);
    if (!cache) return;
    
    const config = CACHE_CONFIG[cacheType];
    const cacheKey = params ? this.generateKey(key, params) : key;
    
    // Evict oldest entries if cache is full
    if (cache.size >= config.maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        console.log(`🗑️ Cache EVICT: ${cacheType}:${oldestKey}`);
        cache.delete(oldestKey);
      }
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      key: cacheKey
    };
    
    cache.set(cacheKey, entry);
    console.log(`💾 Cache SET: ${cacheType}:${cacheKey} (ttl: ${config.ttl}ms)`);
  }
  
  /**
   * Invalidate specific cache entry
   */
  invalidate(cacheType: CacheType, key: string, params?: any): void {
    const cache = this.caches.get(cacheType);
    if (!cache) return;
    
    const cacheKey = params ? this.generateKey(key, params) : key;
    
    if (cache.delete(cacheKey)) {
      console.log(`❌ Cache INVALIDATED: ${cacheType}:${cacheKey}`);
    }
  }
  
  /**
   * Invalidate all entries of a cache type
   */
  invalidateType(cacheType: CacheType): void {
    const cache = this.caches.get(cacheType);
    if (!cache) return;
    
    const count = cache.size;
    cache.clear();
    console.log(`🧹 Cache CLEARED: ${cacheType} (${count} entries)`);
  }
  
  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    let totalCleaned = 0;
    const now = Date.now();
    
    this.caches.forEach((cache, cacheType) => {
      const beforeSize = cache.size;
      
      // Remove expired entries
      cache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          cache.delete(key);
        }
      });
      
      const cleaned = beforeSize - cache.size;
      totalCleaned += cleaned;
      
      if (cleaned > 0) {
        console.log(`🧹 Cache cleanup: ${cacheType} - removed ${cleaned} expired entries`);
      }
    });
    
    if (totalCleaned > 0) {
      console.log(`✨ Cache cleanup complete: ${totalCleaned} total entries cleaned`);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): Record<CacheType, { size: number; maxSize: number; hitRate?: number }> {
    const stats = {} as Record<CacheType, { size: number; maxSize: number }>;
    
    Object.keys(CACHE_CONFIG).forEach(type => {
      const cacheType = type as CacheType;
      const cache = this.caches.get(cacheType);
      const config = CACHE_CONFIG[cacheType];
      
      stats[cacheType] = {
        size: cache?.size || 0,
        maxSize: config.maxSize
      };
    });
    
    return stats;
  }
  
  /**
   * Clear all caches
   */
  clearAll(): void {
    let totalCleared = 0;
    
    this.caches.forEach((cache, cacheType) => {
      totalCleared += cache.size;
      cache.clear();
    });
    
    console.log(`🧹 All caches cleared: ${totalCleared} total entries removed`);
  }
}

// Global cache instance
const apiCache = new ApiCache();

/**
 * Cached wrapper for API functions
 */
export function withCache<T extends any[], R>(
  cacheType: CacheType,
  cacheKey: string,
  apiFunction: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    // Try cache first
    const params = args.length > 0 ? args[0] : undefined;
    const cached = apiCache.get<R>(cacheType, cacheKey, params);
    
    if (cached !== null) {
      return cached;
    }
    
    // Cache miss - call API
    console.log(`🔄 Cache miss, calling API: ${cacheType}:${cacheKey}`);
    const result = await apiFunction(...args);
    
    // Cache the result
    apiCache.set(cacheType, cacheKey, result, params);
    
    return result;
  };
}

/**
 * Restaurant-specific cache utilities
 */
export const RestaurantCache = {
  /**
   * Cache nearby restaurants with location-based key
   */
  cacheNearbyRestaurants(
    lat: number,
    lon: number, 
    radius: number,
    page: number,
    limit: number,
    result: RestaurantListResponse
  ): void {
    const params = { lat, lon, radius, page, limit };
    apiCache.set('restaurants-nearby', 'nearby', result, params);
  },
  
  /**
   * Get cached nearby restaurants
   */
  getCachedNearbyRestaurants(
    lat: number,
    lon: number,
    radius: number, 
    page: number,
    limit: number
  ): RestaurantListResponse | null {
    const params = { lat, lon, radius, page, limit };
    return apiCache.get('restaurants-nearby', 'nearby', params);
  },
  
  /**
   * Cache restaurant details
   */
  cacheRestaurantDetail(id: string | number, restaurant: ApiRestaurant): void {
    apiCache.set('restaurant-detail', 'detail', restaurant, { id });
  },
  
  /**
   * Get cached restaurant details
   */
  getCachedRestaurantDetail(id: string | number): ApiRestaurant | null {
    return apiCache.get('restaurant-detail', 'detail', { id });
  },
  
  /**
   * Invalidate restaurant caches when data changes
   */
  invalidateRestaurant(id: string | number): void {
    apiCache.invalidate('restaurant-detail', 'detail', { id });
    apiCache.invalidate('restaurant-reviews', 'reviews', { id });
    apiCache.invalidate('restaurant-analytics', 'analytics', { id });
    
    // Also invalidate nearby searches that might include this restaurant
    apiCache.invalidateType('restaurants-nearby');
    apiCache.invalidateType('restaurants-search');
    apiCache.invalidateType('restaurants-viewport');
  }
};

/**
 * Manual cache controls for debugging
 */
export const CacheControls = {
  getStats: () => apiCache.getStats(),
  clearAll: () => apiCache.clearAll(),
  invalidateType: (type: CacheType) => apiCache.invalidateType(type),
  invalidate: (type: CacheType, key: string, params?: any) => apiCache.invalidate(type, key, params)
};

export { apiCache };
export type { CacheType };

