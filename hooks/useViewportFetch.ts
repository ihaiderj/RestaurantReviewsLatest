import { useCallback, useRef, useState, useEffect } from 'react';
import { useDebounced } from './useDebounced';
import { getRestaurantsInViewport, RestaurantListResponse } from '@/utils/api';
import { RestaurantCache } from '@/utils/api-cache';

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseViewportFetchOptions {
  debounceMs?: number;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  prefetchBuffer?: number; // Percentage to expand viewport for prefetching
  enablePrefetch?: boolean;
  cacheKey?: string;
}

interface ViewportFetchState {
  restaurants: RestaurantListResponse | null;
  loading: boolean;
  error: string | null;
  lastFetchRegion: ViewportBounds | null;
  fetchCount: number;
}

/**
 * Hook for efficient viewport-driven restaurant fetching with debouncing and caching
 */
export function useViewportFetch(options: UseViewportFetchOptions = {}) {
  const {
    debounceMs = 500,
    minZoomLevel = 0.001,
    maxZoomLevel = 1.0,
    prefetchBuffer = 0.2, // 20% buffer around viewport
    enablePrefetch = true,
    cacheKey = 'viewport-fetch'
  } = options;

  const [state, setState] = useState<ViewportFetchState>({
    restaurants: null,
    loading: false,
    error: null,
    lastFetchRegion: null,
    fetchCount: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const prefetchControllerRef = useRef<AbortController | null>(null);
  const lastRegionRef = useRef<MapRegion | null>(null);

  /**
   * Convert map region to viewport bounds
   */
  const regionToBounds = useCallback((region: MapRegion): ViewportBounds => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    
    return {
      north: latitude + latitudeDelta / 2,
      south: latitude - latitudeDelta / 2,
      east: longitude + longitudeDelta / 2,
      west: longitude - longitudeDelta / 2,
    };
  }, []);

  /**
   * Calculate if two regions are significantly different
   */
  const regionsDiffer = useCallback((region1: ViewportBounds, region2: ViewportBounds | null): boolean => {
    if (!region2) return true;

    const latDiff = Math.abs(region1.north - region2.north) + Math.abs(region1.south - region2.south);
    const lonDiff = Math.abs(region1.east - region2.east) + Math.abs(region1.west - region2.west);
    
    // Consider regions different if they differ by more than 10% of the viewport
    const threshold = 0.1;
    return latDiff > threshold || lonDiff > threshold;
  }, []);

  /**
   * Check if region is within zoom limits
   */
  const isValidZoomLevel = useCallback((region: MapRegion): boolean => {
    const zoomArea = region.latitudeDelta * region.longitudeDelta;
    return zoomArea >= minZoomLevel && zoomArea <= maxZoomLevel;
  }, [minZoomLevel, maxZoomLevel]);

  /**
   * Expand bounds for prefetching
   */
  const expandBounds = useCallback((bounds: ViewportBounds, buffer: number): ViewportBounds => {
    const latRange = bounds.north - bounds.south;
    const lonRange = bounds.east - bounds.west;
    
    return {
      north: bounds.north + (latRange * buffer),
      south: bounds.south - (latRange * buffer),
      east: bounds.east + (lonRange * buffer),
      west: bounds.west - (lonRange * buffer),
    };
  }, []);

  /**
   * Fetch restaurants for a given viewport
   */
  const fetchViewportRestaurants = useCallback(async (
    bounds: ViewportBounds,
    isPrefetch: boolean = false,
    signal?: AbortSignal
  ): Promise<RestaurantListResponse | null> => {
    try {
      console.log(`🗺️ [${cacheKey}] Fetching restaurants for viewport:`, {
        bounds,
        isPrefetch,
        area: `${(bounds.north - bounds.south).toFixed(4)} x ${(bounds.east - bounds.west).toFixed(4)}`
      });

      const startTime = Date.now();
      const restaurants = await getRestaurantsInViewport(bounds);
      const duration = Date.now() - startTime;

      console.log(`✅ [${cacheKey}] Viewport fetch completed in ${duration}ms:`, {
        count: restaurants.results.length,
        total: restaurants.count,
        isPrefetch
      });

      return restaurants;
    } catch (error) {
      if (signal?.aborted) {
        console.log(`🛑 [${cacheKey}] Viewport fetch cancelled`);
        return null;
      }
      
      console.error(`❌ [${cacheKey}] Viewport fetch error:`, error);
      throw error;
    }
  }, [cacheKey]);

  /**
   * Main fetch function with debouncing
   */
  const debouncedFetch = useDebounced(
    useCallback(async (region: MapRegion) => {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const bounds = regionToBounds(region);
      
      // Check if we need to fetch (region changed significantly)
      if (!regionsDiffer(bounds, state.lastFetchRegion)) {
        console.log(`🔄 [${cacheKey}] Skipping fetch - region unchanged`);
        return;
      }

      // Check zoom level constraints
      if (!isValidZoomLevel(region)) {
        console.log(`🔍 [${cacheKey}] Skipping fetch - zoom level out of range`);
        setState(prev => ({ ...prev, loading: false, error: null }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        fetchCount: prev.fetchCount + 1
      }));

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const restaurants = await fetchViewportRestaurants(bounds, false, abortController.signal);
        
        if (restaurants && !abortController.signal.aborted) {
          setState(prev => ({
            ...prev,
            restaurants,
            loading: false,
            error: null,
            lastFetchRegion: bounds
          }));

          // Trigger prefetch for expanded area if enabled
          if (enablePrefetch) {
            setTimeout(() => {
              prefetchSurroundingArea(bounds);
            }, 100);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch restaurants'
          }));
        }
      }
    }, [regionToBounds, regionsDiffer, isValidZoomLevel, fetchViewportRestaurants, state.lastFetchRegion, enablePrefetch, cacheKey]),
    debounceMs
  );

  /**
   * Prefetch surrounding area
   */
  const prefetchSurroundingArea = useCallback(async (bounds: ViewportBounds) => {
    if (!enablePrefetch) return;

    // Cancel any ongoing prefetch
    if (prefetchControllerRef.current) {
      prefetchControllerRef.current.abort();
    }

    const expandedBounds = expandBounds(bounds, prefetchBuffer);
    const prefetchController = new AbortController();
    prefetchControllerRef.current = prefetchController;

    try {
      console.log(`🔮 [${cacheKey}] Starting prefetch for expanded area`);
      await fetchViewportRestaurants(expandedBounds, true, prefetchController.signal);
      console.log(`✨ [${cacheKey}] Prefetch completed`);
    } catch (error) {
      if (!prefetchController.signal.aborted) {
        console.warn(`⚠️ [${cacheKey}] Prefetch failed:`, error);
      }
    }
  }, [enablePrefetch, expandBounds, prefetchBuffer, fetchViewportRestaurants, cacheKey]);

  /**
   * Handle map region change
   */
  const onRegionChangeComplete = useCallback((region: MapRegion) => {
    console.log(`📍 [${cacheKey}] Region change:`, {
      center: `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`,
      delta: `${region.latitudeDelta.toFixed(4)} x ${region.longitudeDelta.toFixed(4)}`
    });

    lastRegionRef.current = region;
    debouncedFetch(region);
  }, [debouncedFetch, cacheKey]);

  /**
   * Manual refresh
   */
  const refresh = useCallback((region?: MapRegion) => {
    const targetRegion = region || lastRegionRef.current;
    if (targetRegion) {
      // Force refresh by clearing last fetch region
      setState(prev => ({ ...prev, lastFetchRegion: null }));
      debouncedFetch(targetRegion);
    }
  }, [debouncedFetch]);

  /**
   * Cancel all ongoing requests
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (prefetchControllerRef.current) {
      prefetchControllerRef.current.abort();
      prefetchControllerRef.current = null;
    }
    
    setState(prev => ({ ...prev, loading: false }));
    console.log(`🛑 [${cacheKey}] All viewport fetch requests cancelled`);
  }, [cacheKey]);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    RestaurantCache.invalidateType('restaurants-viewport');
    console.log(`🗑️ [${cacheKey}] Viewport cache cleared`);
  }, [cacheKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    // State
    restaurants: state.restaurants,
    loading: state.loading,
    error: state.error,
    fetchCount: state.fetchCount,
    
    // Actions
    onRegionChangeComplete,
    refresh,
    cancel,
    clearCache,
    
    // Utils
    regionToBounds,
    isValidZoomLevel,
  };
}

