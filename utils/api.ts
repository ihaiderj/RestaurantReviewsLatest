import * as SecureStore from 'expo-secure-store';
import type { 
  LoginResponse, 
  RefreshTokenResponse, 
  LoginError, 
  User,
  RegisterRequest,
  RegisterResponse,
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ProfileError
} from '@/types/auth';
import Constants from 'expo-constants';
import { Storage } from '@/utils/storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { 
  resilientRequest, 
  debouncedRequest, 
  cancelAllRequests, 
  NetworkHealthMonitor, 
  PerformanceTelemetry 
} from '@/utils/network-resilience';

// Get the local IP address for development
const LOCAL_IP = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
export const BASE_URL = __DEV__ 
  ? 'https://restaurantreviews.io/'  // Development
  : 'https://restaurantreviews.io/'; // Production

// Helper function to get complete media URL
export function getMediaUrl(path: string | null): string {
  if (!path) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&q=80';
  if (path.startsWith('http')) return path;
  // Remove any leading slash from the path and ensure BASE_URL ends with a slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  return `${baseUrl}${cleanPath}`;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000, // Reduced to 8s - if server takes longer, it's a backend problem
  headers: {
    'Accept': 'application/json',
    // Remove default Content-Type to let FormData set it automatically
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await Storage.get('accessToken');
  console.log('Request interceptor - token:', token ? 'present' : 'missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add token refresh interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log('Response interceptor - error status:', error.response?.status);

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Attempting token refresh...');

      try {
        // Get the refresh token
        const refreshTokenValue = await Storage.get('refreshToken');
        console.log('Refresh token:', refreshTokenValue ? 'present' : 'missing');
        
        if (!refreshTokenValue) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await refreshToken(refreshTokenValue);
        console.log('Token refresh successful');
        
        // Store the new access token
        await Storage.set('accessToken', response.access);

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${response.access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, clear storage and throw error
        await Storage.delete('accessToken');
        await Storage.delete('refreshToken');
        await Storage.delete('user');
        throw error;
      }
    }

    return Promise.reject(error);
  }
);

export async function login(emailOrUsername: string, password: string): Promise<LoginResponse> {
  try {
    const response = await api.post('/api/auth/login/', {
      email_or_username: emailOrUsername,
      password
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error?.error || 'Login failed');
    }
    throw error;
  }
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await api.post('/api/auth/register/', data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      // Check if the error response has a structured error object
      if (typeof errorData === 'object' && errorData !== null) {
        // Convert all error messages to a single string
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');
        throw new Error(errorMessages || 'Registration failed');
      }
      throw new Error(errorData.error || errorData.message || 'Registration failed');
    }
    throw error;
  }
}

export async function refreshToken(refresh: string): Promise<RefreshTokenResponse> {
  try {
    const response = await api.post('/api/auth/refresh/', { refresh });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Token refresh failed');
    }
    throw error;
  }
}

export async function getProfile(): Promise<ProfileResponse> {
  try {
    const response = await api.get('/api/profile/');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch profile');
    }
    throw error;
  }
}

export async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  try {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'profile_picture') {
        formData.append(key, value.toString());
      }
    });

    // Add profile picture if provided
    if (data.profile_picture) {
      // Ensure we're sending the file with the correct field name
      formData.append('profile_picture', data.profile_picture);
    }

    const response = await api.patch('/api/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // Remove any existing Content-Type header that axios might set
        ...(Platform.OS === 'web' ? { 'Accept': 'application/json' } : {})
      },
      transformRequest: (data, headers) => {
        // Prevent axios from trying to transform FormData
        return data;
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data.error || error.response.data.message || 'Failed to update profile';
      console.error('Profile update error:', error.response.data);
      throw new Error(errorMessage);
    }
    throw error;
  }
}

// Add these types and functions for social login
interface SocialLoginResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
}

export async function socialLogin(provider: 'google' | 'facebook', token: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/${provider}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ access_token: token }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || `${provider} login failed`);
    }

    // Add status field to match LoginResponse type
    return {
      ...result,
      status: 'success'
    };
  } catch (error) {
    console.error(`${provider} login error:`, error);
    throw error;
  }
}

// Restaurant API Types and Functions
export interface ApiRestaurant {
  id: number;
  name: string;
  description?: string;
  street_address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: string | null;
  longitude?: string | null;
  coordinates?: string | { latitude: number; longitude: number };
  logo?: string;
  images?: Array<{ image: string }>;
  cuisine_styles: Array<string | { name: string }>;
  is_approved: boolean;
  rating?: number;
  review_count?: number;
  total_reviews?: number;
  full_address?: string;
  discount?: string;
  venue_types?: Array<string>;
  amenities?: Array<string>;
}

export interface RestaurantListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: ApiRestaurant[];
}

// Helper function to get coordinates from restaurant data
export function getRestaurantCoordinates(restaurant: ApiRestaurant): { latitude: number; longitude: number } | null {
  console.log('🔍 getRestaurantCoordinates called for restaurant:', restaurant.name);
  console.log('📊 Restaurant data:', {
    coordinates: restaurant.coordinates,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    id: restaurant.id,
    name: restaurant.name,
    street_address: restaurant.street_address
  });

  // Try coordinates object first (new format)
  if (restaurant.coordinates && typeof restaurant.coordinates === 'object') {
    console.log('✅ Using coordinates object:', restaurant.coordinates);
    return restaurant.coordinates;
  }

  // Try coordinates string (comma-separated lat,lon)
  if (restaurant.coordinates && typeof restaurant.coordinates === 'string') {
    console.log('🔍 Attempting to parse coordinates string:', restaurant.coordinates);
    try {
      const [lat, lon] = restaurant.coordinates.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lon)) {
        const result = { latitude: lat, longitude: lon };
        console.log('✅ Successfully parsed coordinates string:', result);
        return result;
      }
  } catch (error) {
      console.error('❌ Error parsing coordinates string:', error);
    }
  }

  // Try separate latitude/longitude fields
  if (restaurant.latitude && restaurant.longitude) {
    console.log('🔍 Using separate lat/lon fields');
    try {
      const lat = typeof restaurant.latitude === 'string' ? parseFloat(restaurant.latitude) : restaurant.latitude;
      const lon = typeof restaurant.longitude === 'string' ? parseFloat(restaurant.longitude) : restaurant.longitude;
      
      if (!isNaN(lat) && !isNaN(lon)) {
        const result = { latitude: lat, longitude: lon };
        console.log('✅ Successfully parsed separate lat/lon:', result);
        return result;
      }
  } catch (error) {
      console.error('❌ Error parsing separate lat/lon:', error);
    }
  }

  console.log('❌ No valid coordinates found for restaurant:', restaurant.name);
  return null;
}

// Get restaurants with filters
export async function getRestaurants(filters: any = {}): Promise<RestaurantListResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/restaurants/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching restaurants:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch restaurants');
    }
    throw error;
  }
}

// Get nearby restaurants with optimal pagination support
export async function getNearbyRestaurants(
  lat: number, 
  lon: number, 
  radius?: number,
  page: number = 1,
  limit: number = 20
): Promise<RestaurantListResponse> {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
    
  try {
    const queryParams = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      limit: limit.toString(),
      page: page.toString(),
      approved: 'true', // Only approved restaurants
    });

    if (radius) {
      queryParams.append('radius', radius.toString()); // Use actual radius
    } else {
      queryParams.append('radius', '5'); // Default 5km instead of server default
    }

    console.log(`🔍 [${requestId}] Starting nearby restaurants request...`);
    console.log(`🔍 [${requestId}] URL: /api/restaurants/nearby/?${queryParams.toString()}`);
    console.log(`🔍 [${requestId}] Base URL: ${BASE_URL}`);
    console.log(`🔍 [${requestId}] Requesting radius: ${radius}km, page: ${page}, limit: ${limit}`);
    
    // Use resilient request with critical-get config
    const response = await resilientRequest({
      method: 'GET',
      url: `/api/restaurants/nearby/?${queryParams.toString()}`,
      baseURL: BASE_URL,
    }, 'critical-get', requestId);
    
    const totalTime = Date.now() - startTime;
    
    console.log(`⚡ [${requestId}] PERFORMANCE METRICS:`);
    console.log(`   📊 Total request time: ${totalTime}ms`);
    console.log(`   📊 Found ${response.data.results?.length || 0} restaurants on page ${page}`);
    console.log(`   📊 Total count from API: ${response.data.count || 0}`);
    console.log(`   📊 Has next page: ${!!response.data.next}`);
    
    // Record performance telemetry
    PerformanceTelemetry.recordMetric(
      `/api/restaurants/nearby/`,
      'GET',
      totalTime,
      response.status,
      null,
      1, // Will be updated by resilientRequest if retries occur
      'critical-get'
    );
    
    // Debug: Check for Hamza Hotel specifically
    if (response.data.results) {
      const hamzaHotel = response.data.results.find((restaurant: any) => 
        restaurant.name.toLowerCase().includes('hamza') || 
        restaurant.name.toLowerCase().includes('hotel')
      );
      if (hamzaHotel) {
        console.log(`🏨 [${requestId}] Found Hamza Hotel on page ${page}:`, {
          name: hamzaHotel.name,
          id: hamzaHotel.id,
          coordinates: hamzaHotel.coordinates,
          latitude: hamzaHotel.latitude,
          longitude: hamzaHotel.longitude,
          is_approved: hamzaHotel.is_approved
        });
      } else {
        console.log(`🔍 [${requestId}] Hamza Hotel not found on page ${page}`);
      }
    }
    
    // Performance status
    if (totalTime < 2000) {
      console.log(`   ✅ [${requestId}] FAST - Excellent performance`);
    } else if (totalTime < 5000) {
      console.log(`   ⚠️ [${requestId}] NORMAL - Expected performance`);
    } else if (totalTime < 10000) {
      console.log(`   🐌 [${requestId}] SLOW - Performance issue detected`);
    } else {
      console.log(`   🚨 [${requestId}] VERY SLOW - Critical performance issue`);
    }
    
    return response.data;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.log(`🚨 [${requestId}] ERROR ANALYSIS:`);
    console.log(`   ⏱️  Time before error: ${totalTime}ms`);
    
    // Record error telemetry
    PerformanceTelemetry.recordMetric(
      `/api/restaurants/nearby/`,
      'GET',
      totalTime,
      null,
      error instanceof Error ? error.message : 'Unknown error',
      1,
      'critical-get'
    );
    
    if (axios.isAxiosError(error)) {
      console.log(`   🔍 Error type: Axios Error`);
      console.log(`   🔍 Error code: ${error.code}`);
      console.log(`   🔍 Error message: ${error.message}`);
      console.log(`   🔍 Response status: ${error.response?.status || 'No response'}`);
      console.log(`   🔍 Response data: ${error.response?.data ? JSON.stringify(error.response.data) : 'No data'}`);
      
      // Diagnose the issue
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        console.log(`   🌐 DIAGNOSIS: Network connectivity issue`);
        console.log(`   💡 SOLUTION: Check internet connection or server status`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`   ⏰ DIAGNOSIS: Request timeout`);
        console.log(`   💡 SOLUTION: Slow network or server response`);
      } else if (error.response?.status && error.response.status >= 500) {
        console.log(`   🖥️ DIAGNOSIS: Server error`);
        console.log(`   💡 SOLUTION: Backend server issue`);
      } else if (error.response?.status === 404) {
        console.log(`   🔍 DIAGNOSIS: API endpoint not found`);
        console.log(`   💡 SOLUTION: Check API URL configuration`);
        } else {
        console.log(`   ❓ DIAGNOSIS: Unknown error type`);
        }
      
      throw new Error(error.response?.data?.error || 'Failed to fetch nearby restaurants');
    } else {
      console.log(`   🔍 Error type: Non-Axios Error`);
      console.log(`   🔍 Error: ${error}`);
      console.log(`   ❓ DIAGNOSIS: Unexpected error type`);
    }
    
    throw error;
  }
}

// Helper function to calculate radius from map bounds
function calculateRadiusFromBounds(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): number {
  // Calculate the diagonal distance of the viewport
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  
  // Convert to approximate kilometers (rough calculation)
  const latKm = latDiff * 111; // 1 degree latitude ≈ 111 km
  const lngKm = lngDiff * 111 * Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);
  
  // Return the larger dimension as radius
  return Math.max(latKm, lngKm);
}

// Get restaurants in map viewport (for map-based screens)
export async function getRestaurantsInViewport(
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }
): Promise<RestaurantListResponse> {
  const center = {
    lat: (bounds.north + bounds.south) / 2,
    lng: (bounds.east + bounds.west) / 2
  };
  
  const radius = calculateRadiusFromBounds(bounds);
  
  console.log(`🗺️ Fetching restaurants in viewport:`, {
    center: center,
    radius: `${radius.toFixed(2)}km`,
    bounds: bounds
  });
  
  return getNearbyRestaurants(center.lat, center.lng, radius, 1, 100);
}

// Network connectivity test - enhanced with resilience
export async function testNetworkConnectivity(): Promise<{ isConnected: boolean; latency: number; error?: string }> {
  // Use the NetworkHealthMonitor for more sophisticated testing
  const healthMonitor = NetworkHealthMonitor.getInstance();
  const startTime = Date.now();
  
  try {
    const isHealthy = await healthMonitor.checkHealth();
    const latency = Date.now() - startTime;
    
    if (isHealthy) {
      return { isConnected: true, latency };
    } else {
      return { isConnected: false, latency, error: 'Network health check failed' };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    let errorMessage = 'Unknown network error';
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'No internet connection';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout';
      } else if (error.response?.status) {
        errorMessage = `Server error (${error.response.status})`;
      }
    }
    
    return { isConnected: false, latency, error: errorMessage };
  }
}

// Get cuisine types - with debounced caching
export async function getCuisineTypes(): Promise<any[]> {
  try {
    console.log('🍽️ Fetching cuisine types from API...');
    
    // Use debounced request to prevent duplicate calls
    const response = await debouncedRequest({
      method: 'GET',
      url: '/api/restaurants/cuisine-types/',
      baseURL: BASE_URL,
    }, 'standard-get', 500); // 500ms debounce
    
    console.log(`✅ Fetched ${response.data.length} cuisine types`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching cuisine types:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch cuisine types');
    }
    throw error;
  }
}

// Get venue types - with debounced caching
export async function getVenueTypes(): Promise<any[]> {
  try {
    console.log('🏪 Fetching venue types from API...');
    
    // Use debounced request to prevent duplicate calls
    const response = await debouncedRequest({
      method: 'GET',
      url: '/api/restaurants/venue-types/',
      baseURL: BASE_URL,
    }, 'standard-get', 500); // 500ms debounce
    
    console.log(`✅ Fetched ${response.data.length} venue types`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching venue types:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch venue types');
    }
    throw error;
  }
}

// Get amenities
export async function getAmenities(): Promise<any[]> {
  try {
    console.log('🏨 Fetching amenities from API...');
    const response = await api.get('/api/restaurants/amenities/');
    console.log(`✅ Fetched ${response.data.length} amenities`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching amenities:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch amenities');
    }
    throw error;
  }
}

// Get restaurant by ID
export async function getRestaurantById(id: string | number): Promise<any> {
  try {
    console.log(`🍽️ Fetching restaurant details for ID: ${id}`);
    const response = await api.get(`/api/restaurants/${id}/`);
    console.log(`✅ Fetched restaurant details: ${response.data.name}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching restaurant ${id}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch restaurant details');
    }
    throw error;
  }
}

// Search restaurants by location
export async function searchRestaurantsByLocation(params: {
  lat: number;
  lon: number;
  radius?: number;
  cuisine?: string;
  venue_type?: string;
  sort?: string;
  limit?: number;
}): Promise<RestaurantListResponse> {
  try {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lon: params.lon.toString(),
    });

    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.cuisine) queryParams.append('cuisine', params.cuisine);
    if (params.venue_type) queryParams.append('venue_type', params.venue_type);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/api/restaurants/nearby/?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error in location search:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to search restaurants');
    }
    throw error;
  }
}

// Get menu categories
export async function getMenuCategories(): Promise<any[]> {
  try {
    console.log('🍽️ Fetching menu categories from API...');
    const response = await api.get('/api/menus/categories/');
    console.log(`✅ Fetched ${response.data.length} menu categories`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching menu categories:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch menu categories');
    }
    throw error;
  }
}

// Get review categories
export async function getReviewCategories(): Promise<any[]> {
  try {
    console.log('⭐ Fetching review categories from API...');
    const startTime = Date.now();
    const response = await api.get('/api/review-categories/');
    const endTime = Date.now();
    console.log(`⏱️ API call took ${endTime - startTime}ms`);
    
    // Handle paginated response
    const categories = response.data.results || response.data;
    console.log(`✅ Fetched ${categories.length} review categories`);
    return categories;
  } catch (error) {
    console.error('❌ Error fetching review categories:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
      throw new Error(error.response.data.error || 'Failed to fetch review categories');
    }
    throw error;
  }
}

// Get restaurant reviews
export async function getRestaurantReviews(restaurantId: string | number): Promise<any[]> {
  try {
    console.log(`📝 Fetching reviews for restaurant ID: ${restaurantId}`);
    const response = await api.get(`/api/restaurants/${restaurantId}/reviews/`);
    console.log(`✅ Fetched ${response.data.results?.length || 0} reviews (total: ${response.data.count || 0})`);
    
    // Debug photo data in reviews
    if (response.data.results && response.data.results.length > 0) {
      console.log('📋 Sample review data:', response.data.results[0]);
      response.data.results.forEach((review: any, index: number) => {
        console.log(`🔍 Review ${review.id} photos:`, review.photos);
        if (review.photos && review.photos.length > 0) {
          console.log(`📸 Review ${review.id} has ${review.photos.length} photos:`, review.photos);
        } else {
          console.log(`📷 Review ${review.id} has no photos`);
        }
      });
    }
    
    return response.data.results || [];
  } catch (error) {
    console.error('❌ Error fetching restaurant reviews:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch restaurant reviews');
    }
    throw error;
  }
}

// Get review analytics
export async function getReviewAnalytics(restaurantId: string | number): Promise<any> {
  try {
    console.log(`📊 Fetching review analytics for restaurant ID: ${restaurantId}`);
    const response = await api.get(`/api/restaurants/${restaurantId}/reviews/analytics/`);
    console.log(`✅ Fetched review analytics`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching review analytics:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch review analytics');
    }
    throw error;
  }
}

// Edit review
export async function editReview(reviewId: string | number, reviewData: any): Promise<any> {
  try {
    console.log(`✏️ Editing review ID: ${reviewId}`);
    
    // First, verify the review exists by trying to get it
    try {
      const verifyResponse = await fetch(`${BASE_URL}/api/reviews/${reviewId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await Storage.get('accessToken')}`,
        },
      });
      
      if (!verifyResponse.ok) {
        console.error(`❌ Review ${reviewId} not found or not accessible`);
        throw new Error(`Review ${reviewId} not found or not accessible (HTTP ${verifyResponse.status})`);
      }
      
      console.log(`✅ Review ${reviewId} exists and is accessible`);
    } catch (verifyError: any) {
      console.error(`❌ Error verifying review ${reviewId}:`, verifyError);
      console.error(`🚨 Review ${reviewId} doesn't exist or user can't access it`);
      console.error(`💡 This might be a data sync issue - review was deleted but still shows in frontend`);
      throw new Error(`Cannot edit review ${reviewId}: ${verifyError.message || 'Unknown error'}`);
    }
    console.log('📤 Edit review data being sent:', {
      overall_rating: reviewData.overall_rating,
      comment: reviewData.comment || '',
      category_ratings: reviewData.category_ratings,
      photos_count: reviewData.photos?.length || 0,
      photos_sample: reviewData.photos?.[0] ? {
        uri: reviewData.photos[0].uri?.substring(0, 50) + '...',
        type: reviewData.photos[0].type,
        name: reviewData.photos[0].name,
        isExisting: reviewData.photos[0].isExisting
      } : null
    });
    
    // Create FormData for multipart upload (same as submit)
    const formData = new FormData();
    
    // Add restaurant field (required for edit endpoint too)
    if (reviewData.restaurant_id) {
      formData.append('restaurant', reviewData.restaurant_id.toString());
    }
    
    // Add basic review data
    formData.append('overall_rating', reviewData.overall_rating.toString());
    formData.append('comment', reviewData.comment || 'No comment provided');
    
    // Add category ratings as JSON string (same format as working CREATE)
    formData.append('category_ratings', JSON.stringify(reviewData.category_ratings));
    console.log('📊 Added category_ratings as JSON string:', JSON.stringify(reviewData.category_ratings));
    
    // ✅ FIXED: Complete photo replacement - upload ALL photos user wants to keep
    if (reviewData.photos && reviewData.photos.length > 0) {
      console.log(`📸 Total photos to keep: ${reviewData.photos.length}`);
      console.log(`🔧 EDIT MODE: Uploading ALL photos for complete replacement`);
      
      // Upload ALL photos (existing + new) for complete replacement
      for (let index = 0; index < reviewData.photos.length; index++) {
        const photo = reviewData.photos[index];
        console.log(`📸 Photo ${index + 1} original:`, {
          uri: photo.uri?.substring(0, 50) + '...',
          type: photo.type,
          name: photo.name
        });
        
        try {
          // Convert React Native image to blob for proper upload
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          
          console.log(`📸 Photo ${index + 1} converted to blob:`, {
            size: blob.size,
            type: blob.type || photo.type || 'image/jpeg'
          });
          
          // Create a proper file-like object for FormData
          const file = new File([blob], photo.name || `photo_${index}.jpg`, {
            type: photo.type || 'image/jpeg'
          });
          
          console.log(`📸 Photo ${index + 1} as File:`, {
            name: file.name,
            size: file.size,
            type: file.type
          });
          
          formData.append('photos', file);
        } catch (photoError) {
          console.error(`❌ Error processing photo ${index + 1}:`, photoError);
          // Fallback to React Native format - but still as file
          const photoFormData = {
            uri: photo.uri,
            type: photo.type || 'image/jpeg',
            name: photo.name || `photo_${index}.jpg`,
          };
          formData.append('photos', photoFormData as any);
        }
      }
      console.log(`✅ All ${reviewData.photos.length} photos processed for FormData`);
      console.log(`📋 Complete replacement: Backend will save exactly ${reviewData.photos.length} photos`);
    } else {
      console.log('📸 No photos to upload - no new photos added');
    }
    
    // 🚨 CRITICAL: Handle photo deletion case
    if (!reviewData.photos || reviewData.photos.length === 0) {
      console.log('📸 EDIT MODE: ALL photos were removed - sending deletion signal');
      formData.append('delete_all_photos', 'true');
      formData.append('photo_management', JSON.stringify({
        action: 'delete_all',
        total_photos_after_edit: 0,
        existing_photos_to_keep: 0,
        new_photos_to_add: 0
      }));
    } else {
      const hasNewPhotos = reviewData.photos.some((photo: any) => !photo.isExisting);
      const hasExistingPhotos = reviewData.photos.some((photo: any) => photo.isExisting);
      
      if (!hasNewPhotos && hasExistingPhotos) {
        console.log('📋 EDIT MODE: Only existing photos, no new uploads needed');
      } else if (hasNewPhotos && !hasExistingPhotos) {
        console.log('📋 EDIT MODE: All existing photos deleted, only new photos remain');
      } else if (hasNewPhotos && hasExistingPhotos) {
        console.log('📋 EDIT MODE: Mixed - keeping existing + adding new photos');
      }
    }
    
    // 🔍 Final FormData debug summary
    console.log(`📋 EDIT FormData Summary:`);
    console.log(`   📊 Review ID: ${reviewId}`);
    console.log(`   📊 Restaurant: ${reviewData.restaurant_id || 'from FormData'}`);
    console.log(`   📊 Rating: ${reviewData.overall_rating}`);
    console.log(`   📊 Comment: ${reviewData.comment?.substring(0, 20)}...`);
    console.log(`   📊 Categories: ${reviewData.category_ratings?.length} ratings`);
    console.log(`   📊 Total photos in form: ${reviewData.photos?.length || 0}`);
    console.log(`   📊 New photos uploading: ${reviewData.photos?.filter((p: any) => !p.isExisting).length || 0}`);
    console.log(`   📊 Existing photos: ${reviewData.photos?.filter((p: any) => p.isExisting).length || 0}`);

    // Use Fetch API instead of Axios for FormData (React Native compatibility)
    const token = await Storage.get('accessToken');
    const editUrl = `${BASE_URL}/api/reviews/${reviewId}/edit/`;
    
    console.log(`🔗 Making PUT request to: ${editUrl}`);
    console.log(`🔑 Authorization token: ${token ? 'Present' : 'Missing'}`);
    console.log(`📦 FormData size: ${formData ? 'Present' : 'Missing'}`);
    
    const response = await fetch(editUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // No Content-Type - let browser set it automatically
      },
      body: formData
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ HTTP ${response.status} Error:`, errorData);
      throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
      
    console.log(`✅ Review edited successfully - Backend response received`);
    console.log(`📊 Backend should now have ${reviewData.photos?.length || 0} total photos`);
      return responseData;
  } catch (error) {
    console.error('❌ Error editing review:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('📋 Edit error response data:', error.response.data);
      console.error('📋 Edit error response status:', error.response.status);
      throw new Error(error.response.data.error || JSON.stringify(error.response.data) || 'Failed to edit review');
    }
    throw error;
  }
}

// Delete review
export async function deleteReview(reviewId: string | number): Promise<void> {
  try {
    console.log(`🗑️ Deleting review ID: ${reviewId}`);
    
    await api.delete(`/api/reviews/${reviewId}/delete/`);
    
    console.log(`✅ Review deleted successfully`);
  } catch (error) {
    console.error('❌ Error deleting review:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to delete review');
    }
    throw error;
  }
}

// Get user reviews - NOW AVAILABLE (as per backend team)
export async function getUserReviews(): Promise<any[]> {
  try {
    console.log('👤 Fetching user reviews from API...');
    const startTime = Date.now();
    const response = await api.get('/api/reviews/my-reviews/');
    const endTime = Date.now();
    console.log(`⏱️ My Reviews API call took ${endTime - startTime}ms`);
    
    // Handle paginated response (backend returns results array)
    const reviews = response.data.results || response.data;
    console.log(`✅ Fetched ${reviews.length} user reviews`);
    if (reviews.length > 0) {
      console.log('📋 Sample review data:', reviews[0]);
    }
    return reviews;
  } catch (error) {
    console.error('❌ Error fetching user reviews:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
      throw new Error(error.response.data.error || 'Failed to fetch user reviews');
    }
    throw error;
  }
}

// Submit review with photos
export async function submitReview(restaurantId: string | number, reviewData: any): Promise<any> {
  try {
    console.log(`📝 Submitting review for restaurant ID: ${restaurantId}`);
    console.log('📤 Review data being sent:', {
      overall_rating: reviewData.overall_rating,
      comment: reviewData.comment || '',
      category_ratings: reviewData.category_ratings,
      photos_count: reviewData.photos?.length || 0,
      photos_sample: reviewData.photos?.[0] ? {
        uri: reviewData.photos[0].uri?.substring(0, 50) + '...',
        type: reviewData.photos[0].type,
        name: reviewData.photos[0].name
      } : null
    });
    
    // If no photos, use JSON format; if photos, use multipart
    if (!reviewData.photos || reviewData.photos.length === 0) {
      console.log('📡 No photos - using JSON format');
      
      // JSON request for reviews without photos
      const jsonData = {
        restaurant: parseInt(restaurantId.toString()),
        overall_rating: reviewData.overall_rating,
        comment: reviewData.comment || 'No comment provided',
        category_ratings: reviewData.category_ratings
      };

      console.log('📋 JSON data being sent:', jsonData);
      
      const response = await api.post(`/api/restaurants/${restaurantId}/reviews/add/`, jsonData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`✅ Review submitted successfully (JSON)`);
      return response.data;
    }
    
    // FormData for reviews with photos (CONFIRMED WORKING!)
    console.log('📸 Photos present - using multipart FormData (CONFIRMED WORKING!)');
      const formData = new FormData();
      
    // Add required restaurant ID (explicit for FormData, unlike JSON)
    formData.append('restaurant', restaurantId.toString());
    
    // Add basic review data
      formData.append('overall_rating', reviewData.overall_rating.toString());
    formData.append('comment', reviewData.comment || 'No comment provided');
    
    // Add category ratings as JSON string (backend confirmed working format)
      formData.append('category_ratings', JSON.stringify(reviewData.category_ratings));
    console.log('📊 Added category_ratings as JSON string:', JSON.stringify(reviewData.category_ratings));
    
    // Add photos
    reviewData.photos.forEach((photo: any, index: number) => {
      console.log(`📸 Photo ${index + 1} original:`, {
        uri: photo.uri?.substring(0, 50) + '...',
          type: photo.type,
        name: photo.name
      });
      
      const photoFormData = {
          uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.name || `photo_${index}.jpg`,
      };
      
      console.log(`📸 Photo ${index + 1} formatted for React Native:`, {
        uri_preview: photoFormData.uri.substring(0, 50) + '...',
        type: photoFormData.type,
        name: photoFormData.name
      });
      
      formData.append('photos', photoFormData as any);
    });
    console.log(`✅ All ${reviewData.photos.length} photos processed for FormData`);

    // Debug FormData contents
    console.log('📋 FormData debug - checking all fields:');
    console.log('📋 Restaurant ID inferred from URL path:', restaurantId);
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'object' && (value as any).uri) {
        console.log(`📋 FormData[${key}]:`, { 
          type: 'file', 
          name: (value as any).name, 
          fileType: (value as any).type 
        });
    } else {
        console.log(`📋 FormData[${key}]:`, value);
      }
    }
    
    console.log('📡 Sending FormData request...');
    
    // Use Fetch API instead of Axios for FormData (React Native compatibility)
    const token = await Storage.get('accessToken');
    const response = await fetch(`${BASE_URL}/api/restaurants/${restaurantId}/reviews/add/`, {
      method: 'POST',
        headers: {
        'Authorization': `Bearer ${token}`,
        // No Content-Type - let browser set it automatically
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
      
    console.log(`✅ Review submitted successfully (FormData)`);
    return responseData;
  } catch (error) {
    console.error('❌ Error submitting review:', error);
    if (axios.isAxiosError(error)) {
    if (error.response) {
        console.error('📋 Error response data:', error.response.data);
        console.error('📋 Error response status:', error.response.status);
        console.error('📋 Error response headers:', error.response.headers);
        throw new Error(error.response.data.error || JSON.stringify(error.response.data) || 'Failed to submit review');
      } else if (error.request) {
        console.error('🌐 Network error - no response received:', error.request);
        console.error('🔗 Request config:', error.config);
        throw new Error('Network error - could not connect to server. Please check your connection.');
      } else {
        console.error('⚙️ Request setup error:', error.message);
        throw new Error('Request configuration error: ' + error.message);
      }
    }
    throw error;
  }
}

// Categorize restaurant images (utility function)
export function categorizeRestaurantImages(images: any[]): any {
  try {
    console.log(`🖼️ Categorizing ${images?.length || 0} restaurant images`);
    
    if (!images || images.length === 0) {
      return {
        food: [],
        interior: [],
        exterior: [],
        menu: [],
        other: []
      };
    }

    const categorized: {
      food: any[];
      interior: any[];
      exterior: any[];
      menu: any[];
      other: any[];
    } = {
      food: [],
      interior: [],
      exterior: [],
      menu: [],
      other: []
    };

    images.forEach((image: any) => {
      const category = image.category?.toLowerCase() || 'other';
      
      switch (category) {
        case 'food':
        case 'dish':
        case 'meal':
          categorized.food.push(image);
          break;
        case 'interior':
        case 'inside':
        case 'dining':
          categorized.interior.push(image);
          break;
        case 'exterior':
        case 'outside':
        case 'building':
          categorized.exterior.push(image);
          break;
        case 'menu':
        case 'card':
          categorized.menu.push(image);
          break;
        default:
          categorized.other.push(image);
      }
    });

    console.log(`✅ Images categorized: Food(${categorized.food.length}), Interior(${categorized.interior.length}), Exterior(${categorized.exterior.length}), Menu(${categorized.menu.length}), Other(${categorized.other.length})`);
    return categorized;
  } catch (error) {
    console.error('❌ Error categorizing restaurant images:', error);
    return {
      food: [],
      interior: [],
      exterior: [],
      menu: [],
      other: []
    };
  }
}

// Type exports for components
export interface ReviewCategory {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface Review {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  restaurant: number;
  overall_rating: number;
  comment: string;
  category_ratings: Array<{
    id: number;
    category: ReviewCategory;
    rating: number;
  }>;
  photos: Array<{
    id: number;
    image: string;
  }>;
  owner_response: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewSubmission {
  overall_rating: number;
  comment: string;
  category_ratings: Array<{
    category_id: number;
    rating: number;
  }>;
  photos?: Array<any>;
}

export interface ReviewCategoryRating {
  category_id: number;
  rating: number;
}

export interface Amenity {
  id: number;
  name: string;
  code: string;
  description: string;
  category: number;
  category_name: string;
  super_category: {
    id: number;
    name: string;
    code: string;
  };
  is_active: boolean;
  image?: string;
}

export interface VenueType {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  image?: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export interface MenuItemWithCategory {
  id: number;
  name: string;
  description: string;
  category: MenuCategory;
  price: number;
  is_active: boolean;
}

export interface RestaurantImage {
  id: number;
  image: string;
  category_id: number;
  category_name: string;
  caption: string;
  keywords: string;
  copyright: string;
  created_at: string;
}

// Placeholder functions for missing implementations
export async function likeReview(reviewId: number): Promise<void> {
  // TODO: Implement when backend provides endpoint
  console.log('likeReview not implemented yet:', reviewId);
}

export async function flagReview(reviewId: number, reason: string): Promise<void> {
  // TODO: Implement when backend provides endpoint
  console.log('flagReview not implemented yet:', reviewId, reason);
}

export async function respondToReview(reviewId: number, response: string): Promise<void> {
  // TODO: Implement when backend provides endpoint
  console.log('respondToReview not implemented yet:', reviewId, response);
}

export async function searchRestaurantsByName(query: string): Promise<ApiRestaurant[]> {
  try {
    console.log('🔍 Searching restaurants by name:', query);
    
    // Use the general search API with the restaurant name
    const response = await api.get(`/api/restaurants/?search=${encodeURIComponent(query)}`);
    
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      console.log(`✅ Found ${response.data.results.length} restaurants matching "${query}"`);
      return response.data.results;
    }
    
    console.log('❌ No restaurants found for query:', query);
    return [];
  } catch (error) {
    console.error('❌ Error searching restaurants by name:', error);
    return [];
  }
}

export async function getMenuItemsWithCategories(restaurantId: string | number): Promise<MenuItemWithCategory[]> {
  // TODO: Implement when menu system is ready
  console.log('getMenuItemsWithCategories not implemented yet:', restaurantId);
  return [];
} 

// Export network resilience utilities for use in components
export {
  cancelAllRequests,
  NetworkHealthMonitor,
  PerformanceTelemetry
} from '@/utils/network-resilience';

// Autocomplete search API
export interface AutocompleteSuggestion {
  type: 'restaurant' | 'venue_type' | 'cuisine' | 'amenity';
  id: number;
  name: string;
  display: string;
  code?: string;
  category_name?: string;
}

export interface AutocompleteResponse {
  query: string;
  suggestions: {
    restaurants: Array<{ id: number; name: string }>;
    venue_types: Array<{ id: number; name: string; code: string }>;
    cuisine_types: Array<{ id: number; name: string; code: string }>;
    amenities: Array<{ id: number; name: string; code: string; category__name: string }>;
  };
  total_results: number;
}

export async function getAutocompleteSuggestions(query: string, limit: number = 5): Promise<AutocompleteSuggestion[]> {
  try {
    console.log(`🔍 Fetching autocomplete suggestions for: "${query}"`);
    
    if (query.length < 2) {
      console.log('⚠️ Query too short, returning empty results');
      return [];
    }

    const response = await api.get(`/api/restaurants/autocomplete/?query=${encodeURIComponent(query)}&limit=${limit}`);
    const data: AutocompleteResponse = response.data;
    
    console.log(`✅ Autocomplete API response:`, {
      query: data.query,
      total_results: data.total_results,
      restaurants: data.suggestions.restaurants.length,
      venue_types: data.suggestions.venue_types.length,
      cuisine_types: data.suggestions.cuisine_types.length,
      amenities: data.suggestions.amenities.length
    });

    // Combine all suggestions into a single list with proper formatting
    const allSuggestions: AutocompleteSuggestion[] = [
      ...data.suggestions.restaurants.map(r => ({
        type: 'restaurant' as const,
        id: r.id,
        name: r.name,
        display: r.name
      })),
      ...data.suggestions.venue_types.map(v => ({
        type: 'venue_type' as const,
        id: v.id,
        name: v.name,
        display: `${v.name} (Venue Type)`,
        code: v.code
      })),
      ...data.suggestions.cuisine_types.map(c => ({
        type: 'cuisine' as const,
        id: c.id,
        name: c.name,
        display: `${c.name} (Cuisine)`,
        code: c.code
      })),
      ...data.suggestions.amenities.map(a => ({
        type: 'amenity' as const,
        id: a.id,
        name: a.name,
        display: `${a.name} (${a.category__name})`,
        code: a.code,
        category_name: a.category__name
      }))
    ];

    console.log(`✅ Processed ${allSuggestions.length} suggestions`);
    return allSuggestions;
    } catch (error) {
    console.error('❌ Error fetching autocomplete suggestions:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch suggestions');
    }
        throw error;
      }
}

// Simple search suggestions API (alternative)
export interface SimpleSearchResponse {
  restaurants: string[];
  cities: string[];
  cuisines: string[];
}

export async function getSimpleSearchSuggestions(query: string): Promise<SimpleSearchResponse> {
  try {
    console.log(`🔍 Fetching simple search suggestions for: "${query}"`);
    
    if (query.length < 2) {
      return { restaurants: [], cities: [], cuisines: [] };
    }

    const response = await api.get(`/api/restaurants/search-suggestions/?q=${encodeURIComponent(query)}`);
    const data: SimpleSearchResponse = response.data;
    
    console.log(`✅ Simple search API response:`, {
      restaurants: data.restaurants.length,
      cities: data.cities.length,
      cuisines: data.cuisines.length
    });

    return data;
    } catch (error) {
    console.error('❌ Error fetching simple search suggestions:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch suggestions');
    }
        throw error;
      }
} 