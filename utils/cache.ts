import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache configuration
const CACHE_CONFIG = {
  CUISINES: {
    key: 'app_cache_cuisines',
    ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  VENUE_TYPES: {
    key: 'app_cache_venue_types',
    ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  AMENITIES: {
    key: 'app_cache_amenities',
    ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  RESTAURANTS: {
    key: 'app_cache_restaurants',
    ttl: 5 * 60 * 1000, // 5 minutes for restaurant data (more dynamic)
  },
  SEARCH_HISTORY: {
    key: 'app_cache_search_history',
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days for search history
  }
};

// Cache data structure
interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string; // For cache invalidation
}

// Cache utility class
class CacheManager {
  // Generate cache version based on current date (daily invalidation)
  private getCacheVersion(type: keyof typeof CACHE_CONFIG): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `v1_${today}_${type.toLowerCase()}`;
  }

  // Check if cache item is still valid
  private isValidCacheItem<T>(item: CacheItem<T>, config: typeof CACHE_CONFIG[keyof typeof CACHE_CONFIG]): boolean {
    const now = Date.now();
    const age = now - item.timestamp;
    const isWithinTTL = age < config.ttl;
    const hasValidVersion = item.version === this.getCacheVersion(this.getConfigKey(config));
    
    return isWithinTTL && hasValidVersion;
  }

  // Get config key from config object
  private getConfigKey(config: typeof CACHE_CONFIG[keyof typeof CACHE_CONFIG]): keyof typeof CACHE_CONFIG {
    return Object.keys(CACHE_CONFIG).find(
      key => CACHE_CONFIG[key as keyof typeof CACHE_CONFIG].key === config.key
    ) as keyof typeof CACHE_CONFIG;
  }

  // Generic cache get method
  async get<T>(type: keyof typeof CACHE_CONFIG): Promise<T | null> {
    try {
      const config = CACHE_CONFIG[type];
      const cached = await AsyncStorage.getItem(config.key);
      
      if (!cached) {
        console.log(`📦 Cache miss for ${type}`);
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      if (this.isValidCacheItem(cacheItem, config)) {
        console.log(`📦 Cache hit for ${type} (age: ${Math.round((Date.now() - cacheItem.timestamp) / 1000 / 60)}min)`);
        return cacheItem.data;
      } else {
        console.log(`📦 Cache expired for ${type}, removing...`);
        await this.remove(type);
        return null;
      }
    } catch (error) {
      console.error(`📦 Cache get error for ${type}:`, error);
      return null;
    }
  }

  // Generic cache set method
  async set<T>(type: keyof typeof CACHE_CONFIG, data: T): Promise<void> {
    try {
      const config = CACHE_CONFIG[type];
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.getCacheVersion(type)
      };

      await AsyncStorage.setItem(config.key, JSON.stringify(cacheItem));
      console.log(`📦 Cached ${type} data (${Array.isArray(data) ? data.length : 'object'} items)`);
    } catch (error) {
      console.error(`📦 Cache set error for ${type}:`, error);
    }
  }

  // Remove specific cache
  async remove(type: keyof typeof CACHE_CONFIG): Promise<void> {
    try {
      const config = CACHE_CONFIG[type];
      await AsyncStorage.removeItem(config.key);
      console.log(`📦 Removed cache for ${type}`);
    } catch (error) {
      console.error(`📦 Cache remove error for ${type}:`, error);
    }
  }

  // Clear all app caches
  async clearAll(): Promise<void> {
    try {
      const keys = Object.values(CACHE_CONFIG).map(config => config.key);
      await AsyncStorage.multiRemove(keys);
      console.log('📦 Cleared all caches');
    } catch (error) {
      console.error('📦 Cache clear all error:', error);
    }
  }

  // Get cache info for debugging
  async getCacheInfo(): Promise<{ [key: string]: { size: string; age: string; version: string } | null }> {
    const info: { [key: string]: { size: string; age: string; version: string } | null } = {};
    
    for (const [type, config] of Object.entries(CACHE_CONFIG)) {
      try {
        const cached = await AsyncStorage.getItem(config.key);
        if (cached) {
          const cacheItem = JSON.parse(cached);
          const age = Math.round((Date.now() - cacheItem.timestamp) / 1000 / 60);
          info[type] = {
            size: `${Math.round(cached.length / 1024)}KB`,
            age: `${age}min`,
            version: cacheItem.version
          };
        } else {
          info[type] = null;
        }
      } catch (error) {
        info[type] = null;
      }
    }
    
    return info;
  }

  // Force refresh cache by updating version
  async invalidateCache(type: keyof typeof CACHE_CONFIG): Promise<void> {
    await this.remove(type);
    console.log(`📦 Invalidated cache for ${type}`);
  }

  // Check if cache needs update by comparing with server
  async shouldRefreshCache(type: keyof typeof CACHE_CONFIG, serverVersion?: string): Promise<boolean> {
    try {
      const cached = await this.get(type);
      
      // If no cache exists, definitely need to refresh
      if (!cached) {
        return true;
      }

      // If server version provided, compare with cached version
      if (serverVersion) {
        const config = CACHE_CONFIG[type];
        const cacheItem = await AsyncStorage.getItem(config.key);
        if (cacheItem) {
          const parsed = JSON.parse(cacheItem);
          return parsed.version !== serverVersion;
        }
      }

      // Default to TTL-based expiration
      return false;
    } catch (error) {
      console.error(`📦 Error checking cache refresh for ${type}:`, error);
      return true; // When in doubt, refresh
    }
  }

  // Update cache with new version
  async updateCacheVersion<T>(type: keyof typeof CACHE_CONFIG, data: T, version?: string): Promise<void> {
    try {
      const config = CACHE_CONFIG[type];
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: version || this.getCacheVersion(type)
      };

      await AsyncStorage.setItem(config.key, JSON.stringify(cacheItem));
      console.log(`📦 Updated cache for ${type} with version ${cacheItem.version}`);
    } catch (error) {
      console.error(`📦 Cache version update error for ${type}:`, error);
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Helper functions for specific data types
export const CacheHelpers = {
  // Cuisines cache helpers
  async getCuisines(): Promise<any[] | null> {
    return await cacheManager.get('CUISINES');
  },
  
  async setCuisines(data: any[]) {
    return await cacheManager.set('CUISINES', data);
  },

  // Venue types cache helpers
  async getVenueTypes(): Promise<any[] | null> {
    return await cacheManager.get('VENUE_TYPES');
  },
  
  async setVenueTypes(data: any[]) {
    return await cacheManager.set('VENUE_TYPES', data);
  },

  // Amenities cache helpers
  async getAmenities(): Promise<any[] | null> {
    return await cacheManager.get('AMENITIES');
  },
  
  async setAmenities(data: any[]) {
    return await cacheManager.set('AMENITIES', data);
  },

  // Search history helpers
  async getSearchHistory() {
    return await cacheManager.get('SEARCH_HISTORY') || [];
  },
  
  async addSearchTerm(term: string) {
    const history = await this.getSearchHistory() as string[];
    const updatedHistory = [term, ...history.filter(h => h !== term)].slice(0, 10); // Keep last 10 searches
    return await cacheManager.set('SEARCH_HISTORY', updatedHistory);
  },

  // Clear specific data
  async clearCuisines() {
    return await cacheManager.remove('CUISINES');
  },
  
  async clearVenueTypes() {
    return await cacheManager.remove('VENUE_TYPES');
  },
  
  async clearAmenities() {
    return await cacheManager.remove('AMENITIES');
  },

  async clearSearchHistory() {
    return await cacheManager.remove('SEARCH_HISTORY');
  },

  // Debug helper
  async logCacheInfo() {
    const info = await cacheManager.getCacheInfo();
    console.log('📦 Cache Status:', info);
    return info;
  }
};

export default cacheManager;