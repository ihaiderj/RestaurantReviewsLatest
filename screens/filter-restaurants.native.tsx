import * as React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Dimensions, Platform, ActivityIndicator, FlatList, Text, TextStyle, ViewStyle, Modal, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { OptimizedImage } from '@/components/images/OptimizedImage';
import FunLoadingMessages from '@/components/loading/FunLoadingMessages';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ThemedText } from '@/components/ThemedText';
import { useViewportFetch } from '@/hooks/useViewportFetch';
import { DistanceSelector } from '@/components/DistanceSelector';
import { useDebounced } from '@/hooks/useDebounced';

import AnimatedSearchBox from '@/components/AnimatedSearchBox';
import SearchDropdown from '@/components/SearchDropdown';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { getRestaurants, getNearbyRestaurants, searchRestaurantsByLocation, searchRestaurantsByName, getMediaUrl, getRestaurantCoordinates, BASE_URL, type ApiRestaurant, getAutocompleteSuggestions, type AutocompleteSuggestion, getRestaurantsInViewport } from '@/utils/api';
import axios from 'axios';
import { useLocation } from '@/contexts/location';
import { useRef as useComponentRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Ellipse, Rect } from 'react-native-svg';

import { dsColors, dsSpacing, dsRadius, dsShadows, dsTypography, dsComponents } from '@/utils/designSystem';


const { width, height } = Dimensions.get('window');

// Helper function to calculate distance between two coordinates
function getDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Simple map style to reduce features (helps with rendering)
const customMapStyle = [
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  }
];

// Restaurant type definition to match API response
interface Restaurant {
  id: number;
  name: string;
  logo: string | null;
  phone: string;
  website: string;
  email: string;
  latitude: number;
  longitude: number;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  cuisine_styles: string[];
  venue_types: string[];
  is_approved: boolean;
  // Adding fields needed for UI that might not be directly from API
  rating?: number;
  timeEstimate?: string;
  priceRange?: string;
  reviews?: number;
  review_count?: number;
  total_reviews?: number;
  full_address?: string;
  discount?: string;
}

// Create axios instance with baseURL
const restaurantApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// ErrorBoundary component for production error handling
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Ionicons name="alert" size={48} color="#FF3B30" />
        <ThemedText style={{ fontSize: 20, color: '#FF3B30', marginTop: 16, fontWeight: 'bold' }}>Something went wrong</ThemedText>
        <ThemedText style={{ fontSize: 16, color: '#666', marginTop: 8, textAlign: 'center' }}>
          An unexpected error occurred. Please try again or restart the app.
        </ThemedText>
      </View>
    );
  }

  // Only catch errors in production
  if (process.env.NODE_ENV === 'production') {
    try {
      return <>{children}</>;
    } catch (err: any) {
      setError(err);
      return null;
    }
  }
  return <>{children}</>;
}

// Import MapView components properly
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// New Restaurant Card Component following design system
function RestaurantCard({ item, onPress }: { item: Restaurant, onPress: (restaurant: Restaurant) => void }) {
  const { userLocation } = useLocation();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showMatchesModal, setShowMatchesModal] = useState(false);
  
  // Calculate distance from user location
  const calculateDistance = () => {
    if (!userLocation || !item.latitude || !item.longitude) return null;
    
    const distance = getDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: item.latitude, longitude: item.longitude }
    );
    
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`;
  };

  const distance = calculateDistance();
  return (
      <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() => onPress(item)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${item.name}`}
      >
      {/* Restaurant Image */}
      <View style={styles.restaurantImageContainer}>
          <OptimizedImage
            source={item.logo ? { uri: item.logo } : require('@/assets/images/default-res-img.jpg')}
            width="100%"
            height="100%"
            style={styles.restaurantImage}
            contentFit="cover"
            fallbackIcon="restaurant"
            alt={`${item.name} restaurant image`}
          />
        
        {/* Discount Badge */}
          {item.discount && (
          <View style={styles.restaurantDiscountBadge}>
            <ThemedText style={styles.restaurantDiscountText}>{item.discount}</ThemedText>
            </View>
          )}
        
        {/* Favorite Button */}
        <TouchableOpacity style={styles.restaurantFavoriteButton} accessibilityRole="button" accessibilityLabel="Add to favorites">
          <Ionicons name="heart-outline" size={20} color={dsColors.neutral.gray600} />
        </TouchableOpacity>
            </View>
      
      {/* Restaurant Info */}
      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantNameRow}>
        <ThemedText style={styles.restaurantName} numberOfLines={1}>{item.name}</ThemedText>
        
          {/* Address Button */}
          <TouchableOpacity 
            style={styles.addressButton} 
            onPress={() => setShowAddressModal(true)}
          >
            <Ionicons name="location-outline" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        {/* Rating and Meta Row - Conditional display */}
        <View style={styles.restaurantMetaRow}>
          {/* Rating - Only show if available */}
          {item.rating && item.rating > 0 && (
            <>
          <View style={styles.restaurantRating}>
            <Ionicons name="star" size={16} color="#FFD700" />
                <ThemedText style={styles.restaurantRatingText}>{item.rating.toFixed(1)}</ThemedText>
        </View>
              <View style={styles.restaurantMetaDot} />
            </>
          )}
          
          {/* Distance - Show actual distance instead of static text */}
          {distance && (
            <>
              <ThemedText style={styles.restaurantMetaText}>{distance}</ThemedText>
          <View style={styles.restaurantMetaDot} />
            </>
          )}
          
          {/* Cuisine */}
          <ThemedText style={styles.restaurantMetaText} numberOfLines={1}>
            {item.cuisine_styles.length > 0 ? item.cuisine_styles[0] : 'Restaurant'}
          </ThemedText>
        </View>
        
        {/* Reviews - Only show if available */}
        {(item.review_count || item.total_reviews) && ((item.review_count ?? 0) > 0 || (item.total_reviews ?? 0) > 0) && (
          <ThemedText style={styles.restaurantReviews} numberOfLines={1}>
            {item.review_count || item.total_reviews} reviews
          </ThemedText>
        )}

        {/* Matches Button */}
        <TouchableOpacity 
          style={styles.matchesButton} 
          onPress={() => setShowMatchesModal(true)}
        >
          <ThemedText style={styles.matchesButtonText}>Matches</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Address Modal */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowAddressModal(false)}
        >
          <View style={styles.addressModal}>
            <ThemedText style={styles.addressModalTitle}>{item.name}</ThemedText>
            <ThemedText style={styles.addressModalText}>
              {item.full_address || 
                `${item.street_address || ''}${item.street_address ? ', ' : ''}${item.city || ''}${item.city ? ', ' : ''}${item.state || ''}${item.state ? ' ' : ''}${item.postal_code || ''}${item.postal_code ? ', ' : ''}${item.country || ''}`.replace(/^,\s*|,\s*$/, '').replace(/,\s*,/g, ',').trim() || 
                'Address not available'
              }
          </ThemedText>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Matches Modal */}
      <Modal
        visible={showMatchesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMatchesModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowMatchesModal(false)}
        >
          <View style={styles.matchesModal}>
            <ThemedText style={styles.matchesModalTitle}>Filter Matches</ThemedText>
            {distance && (
              <ThemedText style={styles.matchText}>📍 Distance: {distance}</ThemedText>
            )}
            {item.cuisine_styles.length > 0 && (
              <ThemedText style={styles.matchText}>🍽️ Cuisine: {item.cuisine_styles.join(', ')}</ThemedText>
            )}
            {item.venue_types.length > 0 && (
              <ThemedText style={styles.matchText}>🏢 Venue: {item.venue_types.join(', ')}</ThemedText>
            )}
        </View>
        </TouchableOpacity>
      </Modal>
      </TouchableOpacity>
  );
}

// Add this helper for robust logging
function logErrorToConsole(error: any, context: string) {
  if (__DEV__ || process.env.NODE_ENV !== 'production') {
    // Log to JS console
    console.error(`[Map Error] ${context}:`, error);
  }
}

function isValidRegion(region: any): boolean {
  return (
    !!region &&
    typeof region.latitude === 'number' &&
    typeof region.longitude === 'number' &&
    typeof region.latitudeDelta === 'number' &&
    typeof region.longitudeDelta === 'number' &&
    isFinite(region.latitude) &&
    isFinite(region.longitude) &&
    isFinite(region.latitudeDelta) &&
    isFinite(region.longitudeDelta)
  );
}

export default function FilterRestaurantsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userLocation, locationError, isLocationReady, refreshLocation } = useLocation();
  
  const screenTitle = useMemo(() => {
    const title = params.title as string;
    const venueType = params.venue_type as string;
    
    if (venueType) {
      return `${title} (${venueType})`;
    }
    
    return title || 'Near Me';
  }, [params.title, params.venue_type]);
  const [selectedFilter, setSelectedFilter] = useState('Location');
  const [errorMsg, setErrorMsg] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: userLocation?.latitude || 26.8467,
    longitude: userLocation?.longitude || 80.9462,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Viewport-based loading state
  const [viewportRestaurants, setViewportRestaurants] = useState<Restaurant[]>([]);
  const [isViewportLoading, setIsViewportLoading] = useState(false);
  const [currentViewport, setCurrentViewport] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  // Parse cuisine parameters
  const selectedCuisines = useMemo(() => {
    const cuisinesParam = params.cuisines as string;
    if (cuisinesParam) {
      return cuisinesParam.split(',').map(c => c.trim()).filter(Boolean);
    }
    return [];
  }, [params.cuisines]);

  // Parse venue_type parameter (single)
  const selectedVenueType = useMemo(() => {
    return params.venue_type as string;
  }, [params.venue_type]);

  // Parse venue_types parameter (multiple)
  const selectedVenueTypes = useMemo(() => {
    const venueTypesParam = params.venue_types as string;
    if (venueTypesParam) {
      return venueTypesParam.split(',').map(c => c.trim()).filter(Boolean);
    }
    return [];
  }, [params.venue_types]);

  // Parse amenities parameter
  const selectedAmenities = useMemo(() => {
    const amenitiesParam = params.amenities as string;
    if (amenitiesParam) {
      return amenitiesParam.split(',').map(c => c.trim()).filter(Boolean);
    }
    return [];
  }, [params.amenities]);

  // Parse keywords parameter from search selections
  const searchKeywords = useMemo(() => {
    return params.keywords as string;
  }, [params.keywords]);

  // Parse search mode parameter
  const searchMode = useMemo(() => {
    return (params.searchMode as 'near_me' | 'all') || 'near_me';
  }, [params.searchMode]);

  console.log('🍽️ Selected cuisines from params:', selectedCuisines);
  console.log('🏪 Selected venue type from params:', selectedVenueType);
  console.log('🏪 Selected venue types from params:', selectedVenueTypes);
  console.log('🏨 Selected amenities from params:', selectedAmenities);
  console.log('🔍 Search keywords from params:', searchKeywords);
  console.log('📍 Search mode from params:', searchMode);

  // Initialize selected suggestions from suggestion data if available
  useEffect(() => {
    if (searchKeywords && selectedSuggestions.length === 0) {
      // Try to get detailed suggestion data first
      if (params.suggestionData) {
        try {
          const suggestionData = JSON.parse(params.suggestionData as string);
          console.log('Initializing suggestions from detailed data:', suggestionData);
          
          const initialSuggestions: AutocompleteSuggestion[] = suggestionData.map((s: any) => ({
            type: s.type,
            id: s.id,
            name: s.name,
            display: s.name,
            code: s.code,
          }));
          
          setSelectedSuggestions(initialSuggestions);
          return;
        } catch (error) {
          console.log('Failed to parse suggestion data, falling back to keywords');
        }
      }
      
      // Fallback: Parse the keywords to create initial suggestions
      const keywordParts = searchKeywords.split(',').map(k => k.trim()).filter(Boolean);
      console.log('Initializing suggestions from keywords (fallback):', keywordParts);
      
      // Create placeholder suggestions with better type detection
      const initialSuggestions: AutocompleteSuggestion[] = keywordParts.map((keyword, index) => {
        // Try to detect type based on keyword content
        let type: 'restaurant' | 'venue_type' | 'cuisine' | 'amenity' = 'restaurant';
        const lowerKeyword = keyword.toLowerCase();
        
        // This is a simplified type detection - in a real app, you'd have a more sophisticated approach
        if (lowerKeyword.includes('pizza') || lowerKeyword.includes('sushi') || lowerKeyword.includes('thai') || 
            lowerKeyword.includes('italian') || lowerKeyword.includes('chinese') || lowerKeyword.includes('indian')) {
          type = 'cuisine';
        } else if (lowerKeyword.includes('cafe') || lowerKeyword.includes('bar') || lowerKeyword.includes('restaurant')) {
          type = 'venue_type';
        }
        
        return {
          type,
          id: index + 1,
          name: keyword,
          display: keyword,
        };
      });
      
      setSelectedSuggestions(initialSuggestions);
    }
  }, [searchKeywords, params.suggestionData]);

  // Handle screen title click to open selection screens
  const handleScreenTitlePress = () => {
    if (screenTitle.includes('Selected Cuisines')) {
      console.log('🍽️ Opening cuisine selection screen to adjust filters');
      router.push({
        pathname: '/international-cuisines',
        params: { 
          title: 'Cuisine Types',
          latitude: params.latitude,
          longitude: params.longitude,
          returnToFilter: 'true',
          currentCuisines: params.cuisines
        }
      });
    } else if (screenTitle.includes('Selected Venue Types')) {
      console.log('🏪 Opening venue types selection screen to adjust filters');
      router.push({
        pathname: '/venue-types',
        params: { 
          title: 'Venue Types',
          latitude: params.latitude,
          longitude: params.longitude,
          returnToFilter: 'true',
          currentVenueTypes: params.venue_types
        }
      });
    } else if (screenTitle.includes('Selected Amenities')) {
      console.log('🏨 Opening amenities selection screen to adjust filters');
      router.push({
        pathname: '/amenities',
        params: { 
          title: 'Amenities',
          latitude: params.latitude,
          longitude: params.longitude,
          returnToFilter: 'true',
          currentAmenities: params.amenities
        }
      });
    } else if (selectedVenueType) {
      console.log('🏪 Opening home screen to adjust venue type filters');
      router.push('/(tabs)/');
    }
  };

  // Viewport-based restaurant loading
  const loadRestaurantsInViewport = useCallback(async (region: any) => {
    if (isViewportLoading) return; // Prevent multiple simultaneous requests
    
    const bounds = {
      north: region.latitude + region.latitudeDelta / 2,
      south: region.latitude - region.latitudeDelta / 2,
      east: region.longitude + region.longitudeDelta / 2,
      west: region.longitude - region.longitudeDelta / 2
    };
    
    // Check if viewport has changed significantly
    if (currentViewport) {
      const latDiff = Math.abs(bounds.north - currentViewport.north) + Math.abs(bounds.south - currentViewport.south);
      const lngDiff = Math.abs(bounds.east - currentViewport.east) + Math.abs(bounds.west - currentViewport.west);
      
      // Only update if viewport changed by more than 10% of the current viewport size
      const significantChange = latDiff > (region.latitudeDelta * 0.1) || lngDiff > (region.longitudeDelta * 0.1);
      if (!significantChange) return;
    }
    
    setIsViewportLoading(true);
    console.log('🗺️ Loading restaurants in viewport:', bounds);
    
    try {
      const response = await getRestaurantsInViewport(bounds);
      
      if (response.results && Array.isArray(response.results)) {
        const formattedRestaurants = response.results.map((restaurant: any) => {
          let logo = null;
          if (restaurant.images && restaurant.images[0]?.image) {
            const img = restaurant.images[0].image;
            logo = img.startsWith('http') ? img : getMediaUrl(img);
          } else if (restaurant.logo) {
            logo = restaurant.logo.startsWith('http') ? restaurant.logo : getMediaUrl(restaurant.logo);
          } else {
            logo = null;
          }
          
          const coordinates = getRestaurantCoordinates(restaurant);
          
          return {
            ...restaurant,
            latitude: coordinates?.latitude || 0,
            longitude: coordinates?.longitude || 0,
            cuisine_styles: Array.isArray(restaurant.cuisine_styles)
              ? restaurant.cuisine_styles.map((style: any) => typeof style === 'string' ? style : style.name).filter(Boolean)
              : [],
            venue_types: Array.isArray(restaurant.venue_types)
              ? restaurant.venue_types.map((type: any) => typeof type === 'string' ? type : type.name).filter(Boolean)
              : [],
            logo,
          };
        });
        
        setViewportRestaurants(formattedRestaurants);
        setCurrentViewport(bounds);
        console.log(`✅ Loaded ${formattedRestaurants.length} restaurants in viewport`);
      }
    } catch (error) {
      console.error('❌ Error loading viewport restaurants:', error);
    } finally {
      setIsViewportLoading(false);
    }
  }, [isViewportLoading, currentViewport]);

  // Throttle map region updates to reduce excessive re-renders
  const handleRegionChange = useCallback((region: any) => {
    // Only update map region for significant changes
    const latDiff = Math.abs(region.latitude - mapRegion.latitude);
    const lngDiff = Math.abs(region.longitude - mapRegion.longitude);
    const deltaLat = Math.abs(region.latitudeDelta - mapRegion.latitudeDelta);
    const deltaLng = Math.abs(region.longitudeDelta - mapRegion.longitudeDelta);
    
    // Only update if there's a significant change (reduces excessive updates)
    if (latDiff > 0.0001 || lngDiff > 0.0001 || deltaLat > 0.001 || deltaLng > 0.001) {
      setMapRegion(region);
      
      // Temporarily disabled viewport loading to prevent conflicts
      // TODO: Re-enable with proper conflict resolution
      // loadRestaurantsInViewport(region);
    }
  }, [mapRegion]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCard, setActiveCard] = useState(0);
  const [isCarouselCollapsed, setIsCarouselCollapsed] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<Restaurant | null>(null);
  const [selectedDistance, setSelectedDistance] = useState(1); // Default to 1km
  const [isFromNearbyAPI, setIsFromNearbyAPI] = useState(false); // Track if restaurants came from nearby API
  const DISTANCE_OPTIONS = [0.25, 0.5, 1, 2, 5, 10, 15, 25, 40, 50]; // Distance options in kilometers (250m, 500m, 1km, etc.)

  const [manualDistance, setManualDistance] = useState('');

  // Autocomplete search state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  const apiCache = useRef<Record<string, any>>({});
  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);

  // MapView ref for animating region
  const mapRef = useComponentRef<any>(null);

  const filters = [
    { name: 'Location', icon: 'location' as const },
    { name: 'Most Likes', icon: 'heart' as const },
    { name: 'Menus', icon: 'restaurant' as const },
  ];

  const fetchRestaurants = useCallback(async (search?: string) => {
    const fetchStartTime = Date.now();
    const performanceId = Math.random().toString(36).substr(2, 9);
    
    console.log(`⚡ [${performanceId}] FILTER SCREEN FETCH START`);
    console.log('fetchRestaurants called with search:', search);
    
    // Set 10-second timeout for user feedback
    const performanceTimer = setTimeout(() => {
      console.log(`🚨 [${performanceId}] PERFORMANCE WARNING: Request taking >10s`);
      setErrorMsg('Loading taking longer than usual... Please wait or try again');
    }, 10000);
    
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      console.log('BASE_URL:', BASE_URL);
      console.log('userLocation available:', !!userLocation);
      console.log('search parameter:', search);
      console.log('isLocationReady:', isLocationReady);
      console.log('userLocation object:', userLocation);
      
      // Priority 1: If we have restaurant name searches (specific restaurant names), use restaurant name search API
      if (searchKeywords && selectedSuggestions.some(s => s.type === 'restaurant')) {
        console.log('🏪 Restaurant name search detected - using restaurant name search API');
        console.log('🏪 Search keywords:', searchKeywords);
        console.log('🏪 Selected restaurant suggestions:', selectedSuggestions.filter(s => s.type === 'restaurant'));
        
        try {
          // Get all restaurant names from selected suggestions
          const restaurantNames = selectedSuggestions
            .filter(s => s.type === 'restaurant')
            .map(s => s.name);
          
          console.log('🏪 Searching for specific restaurants:', restaurantNames);
          
          // Search for each restaurant name
          const allRestaurants: any[] = [];
          for (const restaurantName of restaurantNames) {
            const restaurants = await searchRestaurantsByName(restaurantName);
            allRestaurants.push(...restaurants);
          }
          
          // Remove duplicates based on restaurant ID
          const uniqueRestaurants = allRestaurants.filter((restaurant, index, self) => 
            index === self.findIndex(r => r.id === restaurant.id)
          );
          
          console.log(`✅ Found ${uniqueRestaurants.length} unique restaurants from name search`);
          
          if (uniqueRestaurants.length > 0) {
            let formattedRestaurants = uniqueRestaurants.map((restaurant: any) => {
              let logo = null;
              if (restaurant.images && restaurant.images[0]?.image) {
                const img = restaurant.images[0].image;
                logo = img.startsWith('http') ? img : getMediaUrl(img);
              } else if (restaurant.logo) {
                logo = restaurant.logo.startsWith('http') ? restaurant.logo : getMediaUrl(restaurant.logo);
              } else {
                logo = null;
              }
              
              const coordinates = getRestaurantCoordinates(restaurant);
              
              return {
                ...restaurant,
                latitude: coordinates?.latitude || 0,
                longitude: coordinates?.longitude || 0,
                cuisine_styles: Array.isArray(restaurant.cuisine_styles)
                  ? restaurant.cuisine_styles.map((style: any) => typeof style === 'string' ? style : style.name).filter(Boolean)
                  : [],
                venue_types: Array.isArray(restaurant.venue_types)
                  ? restaurant.venue_types.map((type: any) => typeof type === 'string' ? type : type.name).filter(Boolean)
                  : [],
                logo,
              };
            });

            // Apply distance filtering if location is available and search mode is 'near_me'
            let filteredRestaurants = formattedRestaurants;
            if (userLocation && searchMode === 'near_me') {
              console.log('📍 Applying distance filter for restaurant name search');
              filteredRestaurants = filterRestaurantsByDistance(formattedRestaurants);
            }

            console.log(`✅ Restaurant name search complete: ${formattedRestaurants.length} → ${filteredRestaurants.length} restaurants`);
            setRestaurants(filteredRestaurants);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('❌ Error in restaurant name search:', error);
          // Fall through to other search methods
        }
      }
      
      // Priority 2: If location is available and we have distance/location filters, use nearby API
      if (userLocation && (searchMode === 'near_me' || selectedDistance > 0)) {
        console.log('📍 Location-based search detected - using nearby API');
        console.log('📍 User location:', userLocation);
        console.log('📍 Selected distance:', selectedDistance);
        console.log('📍 Search mode:', searchMode);
        
        try {
          // Use getNearbyRestaurants with proper radius parameter
          console.log('🍽️ Using getNearbyRestaurants with params:', {
            lat: userLocation.latitude,
            lon: userLocation.longitude,
            radius: selectedDistance
          });
          
          const response = await getNearbyRestaurants(
            userLocation.latitude, 
            userLocation.longitude, 
            selectedDistance
          );
          console.log('Nearby restaurants response:', response);
          
          if (response.results && Array.isArray(response.results)) {
            let formattedRestaurants = response.results.map((restaurant: any) => {
              let logo = null;
              if (restaurant.images && restaurant.images[0]?.image) {
                const img = restaurant.images[0].image;
                logo = img.startsWith('http') ? img : getMediaUrl(img);
              } else if (restaurant.logo) {
                logo = restaurant.logo.startsWith('http') ? restaurant.logo : getMediaUrl(restaurant.logo);
              } else {
                logo = null;
              }
              
              const coordinates = getRestaurantCoordinates(restaurant);
              
              return {
                ...restaurant,
                latitude: coordinates?.latitude || 0,
                longitude: coordinates?.longitude || 0,
                cuisine_styles: Array.isArray(restaurant.cuisine_styles)
                  ? restaurant.cuisine_styles.map((style: any) => typeof style === 'string' ? style : style.name).filter(Boolean)
                  : [],
                venue_types: Array.isArray(restaurant.venue_types)
                  ? restaurant.venue_types.map((type: any) => typeof type === 'string' ? type : type.name).filter(Boolean)
                  : [],
                logo,
              };
            });

            // Apply client-side filtering for cuisines, venue types, and amenities
            let filteredRestaurants = formattedRestaurants;

            // Filter by cuisines if selected
            if (selectedCuisines.length > 0) {
              console.log('🍽️ Applying cuisine filter:', selectedCuisines);
              filteredRestaurants = filteredRestaurants.filter(restaurant => {
                const restaurantCuisines = restaurant.cuisine_styles || [];
                const hasMatchingCuisine = selectedCuisines.some(selectedCuisine => 
                  restaurantCuisines.some((cuisine: string) => 
                    cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()) ||
                    selectedCuisine.toLowerCase().includes(cuisine.toLowerCase())
                  )
                );
                console.log(`Restaurant ${restaurant.name} cuisines:`, restaurantCuisines, 'Match:', hasMatchingCuisine);
                return hasMatchingCuisine;
              });
            }

            // Filter by venue type if selected
            if (selectedVenueType || selectedVenueTypes.length > 0) {
              const venueTypesToCheck = selectedVenueType ? [selectedVenueType] : selectedVenueTypes;
              console.log('🏪 Applying venue type filter:', venueTypesToCheck);
              filteredRestaurants = filteredRestaurants.filter(restaurant => {
                const restaurantVenueTypes = restaurant.venue_types || [];
                const hasMatchingVenueType = venueTypesToCheck.some(selectedVenue => 
                  restaurantVenueTypes.some((venue: string) => 
                    venue.toLowerCase().includes(selectedVenue.toLowerCase()) ||
                    selectedVenue.toLowerCase().includes(venue.toLowerCase())
                  )
                );
                console.log(`Restaurant ${restaurant.name} venue types:`, restaurantVenueTypes, 'Match:', hasMatchingVenueType);
                return hasMatchingVenueType;
              });
            }

            // Filter by amenities if selected (basic implementation)
            if (selectedAmenities.length > 0) {
              console.log('🏨 Applying amenity filter:', selectedAmenities);
              filteredRestaurants = filteredRestaurants.filter(restaurant => {
                console.log(`Restaurant ${restaurant.name} - amenity filter applied but not fully implemented`);
                return true; // Placeholder - keep all restaurants for now
              });
            }

            console.log(`✅ Location-based filtering complete: ${formattedRestaurants.length} → ${filteredRestaurants.length} restaurants`);
            setRestaurants(filteredRestaurants);
            setIsFromNearbyAPI(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('❌ Error in nearby API:', error);
          // Fall through to general search API
        }
      }
      
      // Priority 2: Handle search with keywords - use general search API
      if (searchKeywords) {
        console.log('🔍 Search with keywords detected - using general search API');
        console.log('🔍 Search keywords:', searchKeywords);
        try {
          // Use general search API with keywords
          let url = '/api/restaurants/';
          const queryParams = [];
          queryParams.push(`search=${encodeURIComponent(searchKeywords)}`);
          
          if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
          
          console.log('🍽️ Making search API call to:', url);
          
          if (apiCache.current[url]) {
            console.log('Using cached data for:', url);
            setRestaurants(apiCache.current[url]);
            setIsLoading(false);
            return;
          }
          
          const response = await restaurantApi.get(url);
          console.log('Search API Response:', response.data);
          
          if (response.data && response.data.results && Array.isArray(response.data.results)) {
            let formattedRestaurants = response.data.results.map((restaurant: any) => {
              let logo = null;
              if (restaurant.images && restaurant.images[0]?.image) {
                const img = restaurant.images[0].image;
                logo = img.startsWith('http') ? img : getMediaUrl(img);
              } else if (restaurant.logo) {
                logo = restaurant.logo.startsWith('http') ? restaurant.logo : getMediaUrl(restaurant.logo);
              } else {
                logo = null;
              }
              
              const coordinates = getRestaurantCoordinates(restaurant);
              
              return {
                ...restaurant,
                latitude: coordinates?.latitude || 0,
                longitude: coordinates?.longitude || 0,
                cuisine_styles: Array.isArray(restaurant.cuisine_styles)
                  ? restaurant.cuisine_styles.map((style: any) => typeof style === 'string' ? style : style.name).filter(Boolean)
                  : [],
                venue_types: Array.isArray(restaurant.venue_types)
                  ? restaurant.venue_types.map((type: any) => typeof type === 'string' ? type : type.name).filter(Boolean)
                  : [],
                logo,
              };
            });

            // Apply client-side filtering for cuisines, venue types, and amenities
            let filteredRestaurants = formattedRestaurants;

            // Filter by cuisines if selected
            if (selectedCuisines.length > 0) {
              console.log('🍽️ Applying cuisine filter:', selectedCuisines);
              filteredRestaurants = filteredRestaurants.filter((restaurant: any) => {
                const restaurantCuisines = restaurant.cuisine_styles || [];
                const hasMatchingCuisine = selectedCuisines.some(selectedCuisine => 
                  restaurantCuisines.some((cuisine: string) => 
                    cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()) ||
                    selectedCuisine.toLowerCase().includes(cuisine.toLowerCase())
                  )
                );
                return hasMatchingCuisine;
              });
            }

            // Filter by venue type if selected
            if (selectedVenueType || selectedVenueTypes.length > 0) {
              const venueTypesToCheck = selectedVenueType ? [selectedVenueType] : selectedVenueTypes;
              console.log('🏪 Applying venue type filter:', venueTypesToCheck);
              filteredRestaurants = filteredRestaurants.filter((restaurant: any) => {
                const restaurantVenueTypes = restaurant.venue_types || [];
                const hasMatchingVenueType = venueTypesToCheck.some(selectedVenue => 
                  restaurantVenueTypes.some((venue: string) => 
                    venue.toLowerCase().includes(selectedVenue.toLowerCase()) ||
                    selectedVenue.toLowerCase().includes(venue.toLowerCase())
                  )
                );
                return hasMatchingVenueType;
              });
            }

            // Filter by amenities if selected (basic implementation)
            if (selectedAmenities.length > 0) {
              console.log('🏨 Applying amenity filter:', selectedAmenities);
              filteredRestaurants = filteredRestaurants.filter((restaurant: any) => {
                // For now, we'll keep all restaurants if amenity filter is applied
                console.log(`Restaurant ${restaurant.name} - amenity filter applied but not fully implemented`);
                return true; // Placeholder - keep all restaurants for now
              });
            }

            console.log(`✅ Search filtering complete: ${formattedRestaurants.length} → ${filteredRestaurants.length} restaurants`);
            
            // Cache the results
            apiCache.current[url] = filteredRestaurants;
            setRestaurants(filteredRestaurants);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('❌ Error in search API:', error);
          // Fall through to general API fallback
        }
      }
      
      // Fallback to general restaurants API
      let url = '/api/restaurants/';
      const queryParams = [];
      const category = params.category as string;
      const filterType = params.type as string;
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
      if (filterType) queryParams.push(`type=${encodeURIComponent(filterType)}`);
      
      // Add cuisine filtering
      if (selectedCuisines.length > 0) {
        // Use the filter endpoint for multiple cuisines
        if (selectedCuisines.length === 1) {
          queryParams.push(`cuisine=${encodeURIComponent(selectedCuisines[0])}`);
        } else {
          // For multiple cuisines, use the filter endpoint
          url = '/api/restaurants/filter/';
          selectedCuisines.forEach(cuisine => {
            queryParams.push(`cuisines[]=${encodeURIComponent(cuisine)}`);
          });
        }
      }
      
      // Add venue_type filtering
      if (selectedVenueType) {
        queryParams.push(`venue_type=${encodeURIComponent(selectedVenueType)}`);
      }
      
      if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
      
      console.log('🍽️ Making API call to:', url);
      
      if (apiCache.current[url]) {
        console.log('Using cached data for:', url);
        setRestaurants(apiCache.current[url]);
        setIsLoading(false);
        return;
      }
      
      const response = await restaurantApi.get(url);
      console.log('API Response status:', response.status);
      console.log('API Response data type:', typeof response.data);
      console.log('API Response data:', JSON.stringify(response.data, null, 2));
      
      // Log first few restaurants to see coordinate format
      if (response.data && response.data.results && response.data.results.length > 0) {
        console.log('Sample restaurant coordinate data:');
        response.data.results.slice(0, 3).forEach((restaurant: any, index: number) => {
          console.log(`Restaurant ${index + 1} (${restaurant.name}):`, {
            coordinates: restaurant.coordinates,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            lat_type: typeof restaurant.latitude,
            lng_type: typeof restaurant.longitude,
            coords_type: typeof restaurant.coordinates,
            full_restaurant: restaurant
          });
        });
      }
      
      const restaurantsData = Array.isArray(response.data) ? response.data : response.data.results;
      console.log('Restaurants data length:', restaurantsData?.length);
      if (restaurantsData && Array.isArray(restaurantsData)) {
        console.log('Filter Restaurants - Total restaurants from API:', restaurantsData.length);
        
        // First filter out restaurants without valid coordinates
        const restaurantsWithValidCoordinates = restaurantsData.filter((restaurant: any) => {
          const coordinates = getRestaurantCoordinates(restaurant);
          const hasValidCoordinates = coordinates !== null;
          if (!hasValidCoordinates) {
            console.log(`Filter Restaurants - Filtering out restaurant "${restaurant.name}" - no valid coordinates`);
          }
          return hasValidCoordinates;
        });
        
        console.log('Filter Restaurants - Restaurants with valid coordinates:', restaurantsWithValidCoordinates.length);
        console.log('Filter Restaurants - Filtered out restaurants:', restaurantsData.length - restaurantsWithValidCoordinates.length);
        
        if (restaurantsWithValidCoordinates.length === 0) {
          console.log('Filter Restaurants - No restaurants with valid coordinates');
          setRestaurants([]);
          if (restaurantsData.length > 0) {
            setErrorMsg('No restaurants with valid location data found');
          } else {
            setErrorMsg('No restaurants found');
          }
          return;
        }
        
        const formattedRestaurants = restaurantsWithValidCoordinates.map((restaurant: any) => {
          let logo = null;
          if (restaurant.images && restaurant.images[0]?.image) {
            const img = restaurant.images[0].image;
            logo = img.startsWith('http') ? img : getMediaUrl(img);
          } else if (restaurant.logo) {
            logo = restaurant.logo.startsWith('http') ? restaurant.logo : getMediaUrl(restaurant.logo);
          } else {
            logo = 'https://placehold.co/120x80';
          }
          
          // Use the helper function to get coordinates
          const coordinates = getRestaurantCoordinates(restaurant);
          
          return {
            ...restaurant,
            latitude: coordinates?.latitude || 0,
            longitude: coordinates?.longitude || 0,
            cuisine_styles: Array.isArray(restaurant.cuisine_styles)
              ? restaurant.cuisine_styles.map((style: any) => typeof style === 'string' ? style : style.name).filter(Boolean)
              : [],
            venue_types: Array.isArray(restaurant.venue_types)
              ? restaurant.venue_types.map((type: any) => typeof type === 'string' ? type : type.name).filter(Boolean)
              : [],
            logo,
          };
        });
        
        console.log('Filter Restaurants - Successfully formatted', formattedRestaurants.length, 'restaurants');
        console.log('Filter Restaurants - Sample restaurant data:', formattedRestaurants[0]);
        apiCache.current[url] = formattedRestaurants;
        setRestaurants(formattedRestaurants);
        setIsFromNearbyAPI(false); // Mark that these restaurants came from general API (not distance-filtered)
      }
    } catch (error) {
      console.error('Error in fetchRestaurants:', error);
      setErrorMsg('Failed to load restaurants. Please check your connection and try again.');
      
      // For debugging: Add test restaurant data if API fails
      if (__DEV__) {
        console.log('Adding test restaurant data for debugging...');
        const testRestaurants = [
          {
            id: 1,
            name: "Test Restaurant 1",
            latitude: 26.8467,
            longitude: 80.9462,
            street_address: "Test Address 1",
            cuisine_styles: ["Italian"],
            venue_types: ["Restaurant"],
            logo: null,
            phone: "",
            website: "",
            email: "",
            city: "Test City",
            state: "Test State",
            postal_code: "12345",
            country: "Test Country",
            is_approved: true,
          },
          {
            id: 2,
            name: "Test Restaurant 2", 
            latitude: 26.8500,
            longitude: 80.9500,
            street_address: "Test Address 2",
            cuisine_styles: ["Chinese"],
            venue_types: ["Restaurant"],
            logo: null,
            phone: "",
            website: "",
            email: "",
            city: "Test City",
            state: "Test State", 
            postal_code: "12345",
            country: "Test Country",
            is_approved: true,
          }
        ];
        console.log('Setting test restaurants:', testRestaurants);
        setRestaurants(testRestaurants);
      }
    } finally {
      clearTimeout(performanceTimer);
      const totalTime = Date.now() - fetchStartTime;
      console.log(`🏁 [${performanceId}] FILTER SCREEN FETCH COMPLETE: ${totalTime}ms`);
      
      if (totalTime > 5000) {
        console.log(`🚨 [${performanceId}] CRITICAL: Filter screen took ${totalTime}ms - UX severely impacted`);
      } else if (totalTime > 2000) {
        console.log(`⚠️ [${performanceId}] SLOW: Filter screen took ${totalTime}ms - room for improvement`);
      } else {
        console.log(`✅ [${performanceId}] FAST: Filter screen took ${totalTime}ms - good performance`);
      }
      
      // Clear any timeout error message if the request completed successfully
      if (totalTime < 10000) {
        setErrorMsg('');
      }
      
      setIsLoading(false);
    }
  }, [params.category, params.type, selectedDistance, selectedCuisines, selectedVenueType, selectedVenueTypes, selectedAmenities]);

  useEffect(() => {
    isMounted.current = true;
    if (!initialFetchDone.current && isLocationReady && userLocation) {
      // Clear cache to ensure fresh data load, especially for location-based searches
      console.log('🗑️ Clearing API cache for fresh filter screen load');
      console.log('🌍 Location ready, starting filter screen data fetch');
      console.log('📍 User location for filter screen:', userLocation);
      console.log('⚡ FORCING nearby API usage for performance');
      apiCache.current = {};
      fetchRestaurants();
      initialFetchDone.current = true;
    } else if (!initialFetchDone.current && isLocationReady && !userLocation) {
      console.log('❌ Location ready but no userLocation - cannot use nearby API');
      console.log('🚫 Filter screen requires location for optimal performance');
      setErrorMsg('Location required for nearby restaurants. Please enable location access.');
      setIsLoading(false);
    }
    return () => {
      isMounted.current = false;
    };
  }, [fetchRestaurants, isLocationReady, userLocation]);

  useEffect(() => {
    if (isLocationReady && userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [userLocation, isLocationReady]);

  useEffect(() => {
    if (initialFetchDone.current && userLocation) {
      console.log('Distance changed to:', selectedDistance, 'km - refetching restaurants');
      fetchRestaurants();
    }
  }, [selectedDistance, fetchRestaurants]);

  // Refetch restaurants when cuisines change
  useEffect(() => {
    if (initialFetchDone.current) {
      console.log('🍽️ Cuisines changed to:', selectedCuisines, '- refetching restaurants');
      fetchRestaurants();
    }
  }, [selectedCuisines, fetchRestaurants]);

  function isValidLocation(loc: any): boolean {
    return (
      !!loc &&
      typeof loc.latitude === 'number' &&
      typeof loc.longitude === 'number' &&
      !isNaN(loc.latitude) &&
      !isNaN(loc.longitude) &&
      loc.latitude !== 0 &&
      loc.longitude !== 0
    );
  }

  // Only render map/markers when location is ready and valid
  const shouldShowMap = isLocationReady && isValidLocation(userLocation) && isValidRegion(mapRegion);
  


  // Memoize restaurant markers to prevent unnecessary re-renders
  const filteredRestaurants = useMemo(() => {
    console.log('=== FILTERING TRIGGERED ===');
    console.log('Triggered by change in:', {
      restaurantsCount: restaurants.length,
      selectedDistance,
      userLocation: userLocation ? 'available' : 'not available',
      isFromNearbyAPI
    });
    console.log('Filtering restaurants:', restaurants.length, 'available');
    
    // Skip client-side distance filtering if restaurants came from nearby API (already filtered by server)
    if (isFromNearbyAPI) {
      console.log('✅ Skipping client-side distance filtering - restaurants already filtered by nearby API');
      console.log('=== FILTERING COMPLETE (SKIPPED) ===');
      return restaurants;
    }
    
    // Apply client-side distance filtering for restaurants from general API
    console.log('🔍 Applying client-side distance filtering for general API results');
    const filtered = filterRestaurantsByDistance(restaurants);
    console.log('After filtering:', filtered.length, 'restaurants within', selectedDistance, 'km');
    console.log('=== FILTERING COMPLETE ===');
    return filtered;
  }, [restaurants, selectedDistance, userLocation, isFromNearbyAPI]);

  const restaurantMarkers = useMemo(() => {
    // For now, use only filtered restaurants to avoid conflicts
    // TODO: Implement viewport-based loading properly in next iteration
    const restaurantsToShow = filteredRestaurants;
    console.log('Creating', restaurantsToShow.length, 'restaurant markers');
    
    // Ensure we have valid restaurants and prevent duplicate keys
    const validRestaurants = restaurantsToShow.filter((restaurant, index, self) => 
      restaurant && restaurant.id && self.findIndex(r => r.id === restaurant.id) === index
    );
    
    const markers = validRestaurants.map((restaurant) => {
      if (!isValidLocation(restaurant)) {
        console.log(`Skipping restaurant ${restaurant.name} - invalid location`);
        return null;
      }
      
      try {
        const lat = Number(restaurant.latitude);
        const lng = Number(restaurant.longitude);
        
        // Additional validation
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
          console.log(`Skipping restaurant ${restaurant.name} - invalid coordinates: ${lat}, ${lng}`);
          return null;
        }
        
        return (
          <Marker
            key={`restaurant-${restaurant.id}-${lat.toFixed(6)}-${lng.toFixed(6)}`}
            coordinate={{ latitude: lat, longitude: lng }}
            title={restaurant.name}
            description={restaurant.street_address || 'Restaurant'}
            onPress={() => handleMarkerPress(restaurant)}
            anchor={{ x: 0.5, y: 1 }}
          >
            <Svg width={44} height={60} viewBox="0 0 44 60">
              {/* Teardrop pin shape */}
              <Path
                d="M22 0C10 0 0 10 0 23c0 12 9.5 21.5 21 23.4L22 60l1-13.6C34.5 44.5 44 35 44 23 44 10 34 0 22 0z"
                fill="#D44C4C"
              />
              {/* White circle in center */}
              <Circle cx={22} cy={22} r={14} fill="#fff" />
              {/* Fork (left) - 4 tines */}
              <Path d="M15 13 v13" stroke="#D44C4C" strokeWidth="2" strokeLinecap="round" />
              <Path d="M16.5 13 v13" stroke="#D44C4C" strokeWidth="1.2" strokeLinecap="round" />
              <Path d="M18 13 v13" stroke="#D44C4C" strokeWidth="1.2" strokeLinecap="round" />
              <Path d="M19.5 13 v13" stroke="#D44C4C" strokeWidth="2" strokeLinecap="round" />
              <Rect x={15} y={22} width={4.5} height={7} rx={1.2} fill="#D44C4C" />
              {/* Spoon (right) */}
              <Ellipse cx={28.5} cy={18.5} rx={3} ry={5} fill="#D44C4C" />
              <Rect x={27.2} y={23.5} width={2.6} height={8} rx={1.1} fill="#D44C4C" />
            </Svg>
          </Marker>
        );
      } catch (err) {
        logErrorToConsole(err, `Restaurant Marker: ${restaurant.name}`);
        return null;
      }
    }).filter(Boolean);
    console.log('Created', markers.length, 'valid markers');
    return markers;
  }, [filteredRestaurants]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setViewportRestaurants([]);
      setCurrentViewport(null);
      setIsViewportLoading(false);
    };
  }, []);

  function handleCardScroll(e: any) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (width * 0.5 + 16));
    setActiveCard(idx);
  }

  function handleCardPress(restaurant: Restaurant) {
    // Animate map to restaurant location
    if (restaurant && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
      
      console.log('Animated map to restaurant location:', restaurant.name);
    }
  }

  function handleMarkerPress(restaurant: Restaurant) {
    console.log('Marker pressed:', restaurant.name);
    setSelectedMarker(restaurant);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 300);
    }
  }

  function handleTooltipPress(restaurant: Restaurant) {
    // Navigate to restaurant profile
    console.log('Navigating to restaurant profile:', restaurant.id, restaurant.name);
    router.push({
      pathname: '/(modals)/restaurant-profile/[id]',
      params: { id: restaurant.id.toString() }
    });
    setSelectedMarker(null);
  }

  function handleRecenterLocation() {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    } else {
      // Refresh location if not available
      refreshLocation();
    }
  }

  // Calculate distance between two points using Haversine formula
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  // Filter restaurants by distance
  function filterRestaurantsByDistance(restaurants: Restaurant[]): Restaurant[] {
    if (!userLocation) {
      console.log('No user location available, returning all restaurants');
      return restaurants;
    }
    
    console.log('User location:', userLocation);
    console.log('Selected distance:', selectedDistance, 'km');
    console.log('Total restaurants to filter:', restaurants.length);
    
    const filtered = restaurants.filter(restaurant => {
      if (!userLocation) return false;
      
      console.log(`Checking restaurant ${restaurant.name}:`, {
        restaurantLat: restaurant.latitude,
        restaurantLng: restaurant.longitude,
        userLat: userLocation.latitude,
        userLng: userLocation.longitude
      });
      
      // Check if coordinates are valid
      if (!restaurant.latitude || !restaurant.longitude || 
          restaurant.latitude === 0 || restaurant.longitude === 0) {
        console.log(`Restaurant ${restaurant.name} has invalid coordinates`);
        return false;
      }
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurant.latitude,
        restaurant.longitude
      );
      
      console.log(`Distance to ${restaurant.name}: ${distance.toFixed(2)} km`);
      
      const isWithinRange = distance <= selectedDistance;
      console.log(`Restaurant ${restaurant.name} within ${selectedDistance}km range: ${isWithinRange}`);
      
      return isWithinRange;
    });
    
    console.log(`Distance filtering result: ${restaurants.length} total → ${filtered.length} within ${selectedDistance}km`);
    return filtered;
  }

  // Voice Search Function
  async function handleVoiceSearch() {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      // Here you would stop the recording and process the speech
      // For now, we'll simulate with a placeholder
      setTimeout(() => {
        setSearchQuery("Italian restaurants"); // Simulated voice result
        fetchRestaurants("Italian restaurants");
      }, 1000);
    } else {
      // Start listening
      setIsListening(true);
      // Here you would start recording
      // For now, we'll simulate the listening state
      setTimeout(() => {
        setIsListening(false);
        setSearchQuery("Pizza places near me"); // Simulated voice result
        fetchRestaurants("Pizza places near me");
      }, 3000);
    }
  }

  // Autocomplete search handlers
  const handleSearchFocus = () => {
    console.log('Search focused');
    setShowSearchSuggestions(true);
  };

  const handleSearchTextChange = async (text: string) => {
    console.log('Search text changed:', text);
    setSearchQuery(text);
    
    if (text.length > 0) {
      setShowSearchSuggestions(true);
      setSearchLoading(true);
      
      try {
        const suggestions = await getAutocompleteSuggestions(text);
        setAutocompleteSuggestions(suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setAutocompleteSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setAutocompleteSuggestions([]);
      setShowSearchSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    console.log('Suggestion selected:', suggestion);
    
    // Add to selected suggestions if not already selected
    if (!selectedSuggestions.some(selected => 
      selected.type === suggestion.type && selected.id === suggestion.id
    )) {
      setSelectedSuggestions(prev => [...prev, suggestion]);
    }
  };

  const handleSuggestionDeselect = (suggestion: AutocompleteSuggestion) => {
    console.log('Suggestion deselected:', suggestion);
    setSelectedSuggestions(prev => 
      prev.filter(s => !(s.type === suggestion.type && s.id === suggestion.id))
    );
  };

  const handleSearchModeChange = (mode: 'near_me' | 'all') => {
    console.log('Search mode changed:', mode);
    // Update the params to reflect the new search mode
    router.setParams({ ...params, searchMode: mode });
  };

  const handleDistanceChange = (distance: number) => {
    console.log('Distance changed:', distance);
    setSelectedDistance(distance);
    
    // Trigger a refresh with new distance if we have location
    if (userLocation) {
      console.log('🔄 Refreshing results with new distance:', distance);
      // Update the current parameters to trigger a re-fetch
      const newParams = {
        ...params,
        radius: distance,
        searchMode: 'near_me',
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
      router.setParams(newParams);
    }
  };

  const handleApplySelections = () => {
    console.log('Applying selections:', selectedSuggestions);
    
    // Check if we have restaurant name selections
    const restaurantSelections = selectedSuggestions.filter(s => s.type === 'restaurant');
    const otherSelections = selectedSuggestions.filter(s => s.type !== 'restaurant');
    
    // Construct the search query from selected suggestions
    const selectionNames = selectedSuggestions.map(s => s.name).join(', ');
    const finalQuery = searchQuery ? `${selectionNames} ${searchQuery}`.trim() : selectionNames;
    
    // Navigate to filter restaurants with all parameters
    const params: any = {
      keywords: finalQuery,
      searchMode: 'near_me', // Always use near_me mode when filters are applied
    };

    // Always include location and distance parameters for proper filtering
    if (userLocation) {
      params.latitude = userLocation.latitude;
      params.longitude = userLocation.longitude;
      params.radius = selectedDistance;
    }

    // Set appropriate title based on selections
    if (restaurantSelections.length > 0) {
      if (restaurantSelections.length === 1) {
        params.title = `Search: ${restaurantSelections[0].name}`;
      } else {
        params.title = `Search: ${restaurantSelections.length} Restaurants`;
      }
    } else if (otherSelections.length > 0) {
      params.title = `Search: ${otherSelections.map(s => s.name).join(', ')}`;
    } else {
      params.title = 'Search Results';
    }

    console.log('🔍 Setting filter parameters:', params);

    // Update the current screen with new parameters
    router.setParams(params);
    
    // Close suggestions and clear search text
    setShowSearchSuggestions(false);
    setSearchQuery('');
  };

  const handleProceedWithSelections = () => {
    handleApplySelections();
  };

  const handleSingleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    console.log('Single suggestion selected:', suggestion);
    setShowSearchSuggestions(false);
    setSearchQuery(suggestion.name);

    // Navigate based on suggestion type
    switch (suggestion.type) {
      case 'restaurant':
        // Navigate to filter restaurants with restaurant name search
        const restaurantParams: any = { 
          title: `Search: ${suggestion.name}`,
          keywords: suggestion.name,
          searchMode: 'near_me', // Always use near_me mode for restaurant searches
        };
        if (userLocation) {
          restaurantParams.latitude = userLocation.latitude;
          restaurantParams.longitude = userLocation.longitude;
          restaurantParams.radius = selectedDistance;
        }
        router.push({
          pathname: '/filter-restaurants',
          params: restaurantParams
        });
        break;
      
      case 'cuisine':
        // Navigate to filter restaurants with cuisine filter
        const cuisineParams: any = { 
          title: `${suggestion.name} Restaurants`,
          cuisine: suggestion.code || suggestion.name,
        };
        if (searchMode === 'near_me') {
          cuisineParams.latitude = userLocation?.latitude;
          cuisineParams.longitude = userLocation?.longitude;
          cuisineParams.radius = selectedDistance;
          cuisineParams.searchMode = 'near_me';
        } else {
          cuisineParams.searchMode = 'all';
        }
        router.push({
          pathname: '/filter-restaurants',
          params: cuisineParams
        });
        break;
      
      case 'venue_type':
        // Navigate to filter restaurants with venue type filter
        const venueParams: any = { 
          title: `${suggestion.name} Venues`,
          venue_type: suggestion.code || suggestion.name,
        };
        if (searchMode === 'near_me') {
          venueParams.latitude = userLocation?.latitude;
          venueParams.longitude = userLocation?.longitude;
          venueParams.radius = selectedDistance;
          venueParams.searchMode = 'near_me';
        } else {
          venueParams.searchMode = 'all';
        }
        router.push({
          pathname: '/filter-restaurants',
          params: venueParams
        });
        break;
      
      case 'amenity':
        // Navigate to filter restaurants with amenity filter
        const amenityParams: any = { 
          title: `Restaurants with ${suggestion.name}`,
          amenities: suggestion.code || suggestion.name,
        };
        if (searchMode === 'near_me') {
          amenityParams.latitude = userLocation?.latitude;
          amenityParams.longitude = userLocation?.longitude;
          amenityParams.radius = selectedDistance;
          amenityParams.searchMode = 'near_me';
        } else {
          amenityParams.searchMode = 'all';
        }
        router.push({
          pathname: '/filter-restaurants',
          params: amenityParams
        });
        break;
      
      default:
        console.log('Unknown suggestion type:', suggestion.type);
        // Default to filter restaurants
        const defaultParams: any = { 
          title: `Search: ${suggestion.name}`,
          searchQuery: suggestion.name,
        };
        if (searchMode === 'near_me') {
          defaultParams.latitude = userLocation?.latitude;
          defaultParams.longitude = userLocation?.longitude;
          defaultParams.radius = selectedDistance;
          defaultParams.searchMode = 'near_me';
        } else {
          defaultParams.searchMode = 'all';
        }
        router.push({
          pathname: '/filter-restaurants',
          params: defaultParams
        });
    }
  };

  const closeSuggestions = () => {
    console.log('Closing suggestions');
    setShowSearchSuggestions(false);
    
    // If there are selected suggestions, clear the search text to show selections
    if (selectedSuggestions.length > 0) {
      console.log('Clearing search text to show selected suggestions');
      setSearchQuery('');
    }
  };

  // Helper function to format distance display
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  };

  const renderMap = () => {
    try {
      if (!isLocationReady) {
        return (
          <View style={[styles.map, styles.mapLoadingContainer]}>
            <FunLoadingMessages 
              size="large" 
              color="#6366F1" 
              messageStyle={styles.mapLoadingText}
            />
          </View>
        );
      }

            return (
              <MapView
                ref={mapRef}
          style={styles.map}
                region={mapRegion}
                // provider prop removed - using default
                mapType="standard"
                loadingEnabled={true}
                loadingIndicatorColor="#666666"
                loadingBackgroundColor="#eeeeee"
                // customMapStyle={customMapStyle} // Temporarily disabled for debugging
          showsMyLocationButton={false}
          showsUserLocation={false}
          showsCompass={false}
          showsScale={false}
          minZoomLevel={8}
          maxZoomLevel={18}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={true}
          zoomEnabled={true}
          onRegionChangeComplete={handleRegionChange}
          onMapReady={() => {
            // Map is ready
          }}
          onLayout={() => {
            // Map layout completed
          }}
          onRegionChange={(region) => {
            // Map region changing
          }}
        >
          {/* Custom User Location Marker */}
          {userLocation && (
                        <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="Your Location"
              description="You are here"
              identifier="user-location"
            >
              <View style={styles.userLocationMarker}>
                <View style={styles.userLocationDot} />
                          </View>
                        </Marker>
          )}
          
          {/* Test Marker - Simple Red Marker */}
                      <Marker
            coordinate={{
              latitude: 26.8467,
              longitude: 80.9462,
            }}
            title="Test Marker"
            description="This is a test marker"
            pinColor="red"
          />
          
          {/* Another Test Marker - Orange */}
          <Marker
            coordinate={{
              latitude: 26.8500,
              longitude: 80.9500,
            }}
            title="Test Marker 2"
            description="This is another test marker"
            pinColor="#DC4C48"
          />
          
          {/* Restaurant Markers */}
          {restaurantMarkers}
          
          {/* Viewport Loading Indicator */}
          {isViewportLoading && (
            <View style={styles.viewportLoadingOverlay}>
              <FunLoadingMessages 
                size="small" 
                color="#6366F1" 
                messageStyle={styles.viewportLoadingText}
              />
            </View>
          )}
              </MapView>
            );
    } catch (error) {
      logErrorToConsole(error, 'Map component rendering');
            return (
        <View style={[styles.map, styles.mapErrorContainer]}>
          <Ionicons name="warning" size={48} color="#EF4444" />
          <ThemedText style={styles.mapErrorText}>Map unavailable</ThemedText>
          <ThemedText style={styles.mapErrorSubtext}>Please try again later</ThemedText>

              </View>
            );
          }
  };

  // Function to zoom map to show all markers
  const zoomToShowAllMarkers = useCallback(() => {
    if (mapRef.current && filteredRestaurants.length > 0) {
      console.log('Zooming to show all markers...');
      
      // Calculate bounds to include all restaurants
      const latitudes = filteredRestaurants.map(r => r.latitude);
      const longitudes = filteredRestaurants.map(r => r.longitude);
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const midLat = (minLat + maxLat) / 2;
      const midLng = (minLng + maxLng) / 2;
      
      const deltaLat = (maxLat - minLat) * 1.2; // Add 20% padding
      const deltaLng = (maxLng - minLng) * 1.2;
      
      console.log('Calculated region:', { 
        latitude: midLat, 
        longitude: midLng, 
        latitudeDelta: Math.max(deltaLat, 0.01), 
        longitudeDelta: Math.max(deltaLng, 0.01) 
      });
      
      mapRef.current.animateToRegion({
        latitude: midLat,
        longitude: midLng,
        latitudeDelta: Math.max(deltaLat, 0.01),
        longitudeDelta: Math.max(deltaLng, 0.01),
      }, 1000);
    }
  }, [filteredRestaurants]);

  // Call zoom function when filtered restaurants change
  useEffect(() => {
    if (filteredRestaurants.length > 0) {
      setTimeout(() => zoomToShowAllMarkers(), 1000);
    }
  }, [filteredRestaurants, zoomToShowAllMarkers]);



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}> 
      <View style={styles.relativeContainer}>
        {/* Map as background */}
        {shouldShowMap && renderMap()}
        {!shouldShowMap ? (
          <View style={styles.overlayCenter} pointerEvents="box-none">
            <FunLoadingMessages 
              size="large" 
              color="#6B4EFF" 
              messageStyle={styles.mapLoadingText}
              showSpinner={false}
            />
            <ThemedText style={styles.mapLoadingText}>
              {locationError ? locationError : 'Getting your location...'}
            </ThemedText>
          </View>
        ) : null}
        


        {/* Screen Header with Navigation */}
        <View style={styles.screenHeader}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          {/* Title Section */}
              <TouchableOpacity 
            onPress={handleScreenTitlePress}
            disabled={!screenTitle.includes('Selected Cuisines') && !screenTitle.includes('Selected Venue Types') && !screenTitle.includes('Selected Amenities') && !selectedVenueType}
            style={[styles.titleContainer, (screenTitle.includes('Selected Cuisines') || screenTitle.includes('Selected Venue Types') || screenTitle.includes('Selected Amenities') || selectedVenueType) ? styles.clickableTitle : null]}
          >
            <ThemedText style={[
              styles.screenTitle,
              (screenTitle.includes('Selected Cuisines') || screenTitle.includes('Selected Venue Types') || screenTitle.includes('Selected Amenities') || selectedVenueType) && styles.clickableTitleText
            ]}>
              {screenTitle}
              {(screenTitle.includes('Selected Cuisines') || screenTitle.includes('Selected Venue Types') || screenTitle.includes('Selected Amenities') || selectedVenueType) && (
                <Ionicons name="chevron-forward" size={16} color="#6B4EFF" style={styles.titleChevron} />
              )}
            </ThemedText>
            
            {/* Restaurant Count */}
            <ThemedText style={styles.headerCountText}>
              {restaurants.length} found
            </ThemedText>
          </TouchableOpacity>
          
          {/* Navigation Options */}
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)/')}
                accessibilityRole="button"
            accessibilityLabel="Go to home"
          >
            <Ionicons name="home-outline" size={24} color="#6B4EFF" />
              </TouchableOpacity>
            </View>

        {/* Connection Status */}
        <ConnectionStatus key="filter-connection-status" />

        {/* Top Search Section */}
        <View style={styles.topSearchSection}>
          {/* Animated Search Box */}
          <View style={styles.searchContainer}>
            <AnimatedSearchBox
              onSearch={handleApplySelections}
              onTextChange={handleSearchTextChange}
              onFocus={handleSearchFocus}
              selectedSuggestions={selectedSuggestions}
              onSuggestionRemove={handleSuggestionDeselect}
              onProceedWithSelections={handleProceedWithSelections}
              dropdownOpen={showSearchSuggestions}
              searchQuery={searchQuery}
              phrases={[
                "Find the best pizza in town",
                "Discover amazing sushi spots",
                "Search for cozy coffee shops",
                "Explore fine dining restaurants",
                "Find restaurants near you",
                "Search by cuisine type"
              ]}
              placeholder="Search restaurants, cuisines, amenities..."
            />
            <TouchableOpacity style={styles.filterButton} onPress={() => router.push('/filter-options')} accessibilityRole="button" accessibilityLabel="Filter options">
              <Ionicons name="options" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Search Dropdown */}
          <SearchDropdown
            suggestions={autocompleteSuggestions}
            loading={searchLoading}
            visible={showSearchSuggestions}
            selectedSuggestions={selectedSuggestions}
            searchMode={searchMode}
            selectedDistance={selectedDistance}
            onSuggestionSelect={handleSuggestionSelect}
            onSuggestionDeselect={handleSuggestionDeselect}
            onSearchModeChange={handleSearchModeChange}
            onDistanceChange={handleDistanceChange}
            onClose={closeSuggestions}
            onApplySelections={handleApplySelections}
          />
          
          {/* Filter Pills Row */}
          <View style={styles.filterRow}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterContainer}
            style={styles.filterScrollView}
          >
            {/* Distance Filter - First */}
            <DistanceSelector
              selectedDistance={selectedDistance}
              onDistanceChange={setSelectedDistance}
              buttonStyle={[styles.filterChip, styles.distanceFilterChip]}
              textStyle={[styles.filterChipText, styles.distanceFilterText]}
              iconColor="#6366F1"
              distanceOptions={DISTANCE_OPTIONS}
            />
            
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'Open Restaurants' && styles.activeFilterChip]}
              onPress={() => setSelectedFilter('Open Restaurants')}
            >
              <ThemedText style={[styles.filterChipText, selectedFilter === 'Open Restaurants' && styles.activeFilterChipText]}>
                Open Restaurants
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterChip, styles.filterChipWithDropdown, selectedFilter === 'Cuisins' && styles.activeFilterChip]}
              onPress={() => setSelectedFilter('Cuisins')}
            >
              <ThemedText style={[styles.filterChipText, selectedFilter === 'Cuisins' && styles.activeFilterChipText]}>
                Cuisins
              </ThemedText>
              <Ionicons name="chevron-down" size={14} color="#6B7280" style={styles.dropdownIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'Popular' && styles.activeFilterChip]}
              onPress={() => setSelectedFilter('Popular')}
            >
              <ThemedText style={[styles.filterChipText, selectedFilter === 'Popular' && styles.activeFilterChipText]}>
                Popular
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'Top Rated' && styles.activeFilterChip]}
              onPress={() => setSelectedFilter('Top Rated')}
            >
              <ThemedText style={[styles.filterChipText, selectedFilter === 'Top Rated' && styles.activeFilterChipText]}>
                Top Rated
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
              </View>


        {/* Restaurant Cards Carousel - Bottom Sheet Style */}
        {filteredRestaurants.length > 0 && (
          <View style={[styles.bottomSheet, isCarouselCollapsed && styles.bottomSheetCollapsed]}>
            {/* Collapse/Expand Handle */}
            <TouchableOpacity 
              style={styles.carouselHandle}
              onPress={() => setIsCarouselCollapsed(!isCarouselCollapsed)}
              accessibilityRole="button"
              accessibilityLabel={isCarouselCollapsed ? "Expand restaurant list" : "Collapse restaurant list"}
            >
              <View style={styles.handleBar} />
              <Ionicons 
                name={isCarouselCollapsed ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#9CA3AF" 
                style={styles.handleIcon}
              />
            </TouchableOpacity>

            {/* Carousel Content */}
            {!isCarouselCollapsed && (
              <FlatList
                data={filteredRestaurants}
                renderItem={({ item }) => (
                  <RestaurantCard item={item} onPress={handleCardPress} />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
                snapToInterval={width * 0.85 + dsSpacing.lg}
                snapToAlignment="start"
                decelerationRate="fast"
                pagingEnabled={false}
              />
            )}

            {/* Collapsed State - Show Restaurant Count */}
            {isCarouselCollapsed && (
              <View style={styles.collapsedContent}>
                <ThemedText style={styles.collapsedText}>
                  {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
                </ThemedText>
                <ThemedText style={styles.collapsedSubtext}>
                  Tap to expand and view details
                </ThemedText>
              </View>
            )}
          </View>
        )}
        {/* Loading/Error/No Results */}
        <View style={styles.statusContent} pointerEvents="box-none">
          {isLoading ? (
            <FunLoadingMessages 
              size="large" 
              color="#6B4EFF" 
              containerStyle={{ marginTop: 32 }}
            />
          ) : errorMsg ? (
            <ThemedText style={styles.errorMsg}>{errorMsg}</ThemedText>
          ) : restaurants.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#9CA3AF" />
              <ThemedText style={styles.noResultsTitle}>No Restaurants Found</ThemedText>
              <ThemedText style={styles.noResultsSubtitle}>
                We couldn't find any restaurants matching your criteria.
              </ThemedText>
              <View style={styles.noResultsSuggestions}>
                <ThemedText style={styles.suggestionsTitle}>Try these alternatives:</ThemedText>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => {
                    setSelectedDistance(5);
                    fetchRestaurants();
                  }}
                >
                  <Ionicons name="location-outline" size={20} color="#6B4EFF" />
                  <ThemedText style={styles.suggestionButtonText}>Increase search radius to 5km</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => router.push('/(tabs)/')}
                >
                  <Ionicons name="home-outline" size={20} color="#6B4EFF" />
                  <ThemedText style={styles.suggestionButtonText}>Browse all restaurants</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => router.push('/international-cuisines')}
                >
                  <Ionicons name="globe-outline" size={20} color="#6B4EFF" />
                  <ThemedText style={styles.suggestionButtonText}>Try different cuisines</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : filteredRestaurants.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="location-outline" size={64} color="#9CA3AF" />
              <ThemedText style={styles.noResultsTitle}>No Restaurants in Range</ThemedText>
              <ThemedText style={styles.noResultsSubtitle}>
                No restaurants found within {formatDistance(selectedDistance)} of your location.
              </ThemedText>
              <View style={styles.noResultsSuggestions}>
                <ThemedText style={styles.suggestionsTitle}>Try these alternatives:</ThemedText>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => {
                    setSelectedDistance(5);
                    fetchRestaurants();
                  }}
                >
                  <Ionicons name="location-outline" size={20} color="#6B4EFF" />
                  <ThemedText style={styles.suggestionButtonText}>Increase search radius to 5km</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => {
                    setSelectedDistance(10);
                    fetchRestaurants();
                  }}
                >
                  <Ionicons name="location-outline" size={20} color="#6B4EFF" />
                  <ThemedText style={styles.suggestionButtonText}>Increase search radius to 10km</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.suggestionButton}
                  onPress={() => router.push('/(tabs)/')}
                >
                  <Ionicons name="home-outline" size={20} color="#6B4EFF" />
                  <ThemedText style={styles.suggestionButtonText}>Browse all restaurants</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
        {/* My Location Button */}
        {shouldShowMap && (
          <TouchableOpacity style={styles.myLocationButton} onPress={handleRecenterLocation} accessibilityRole="button" accessibilityLabel="Go to my location">
            <Ionicons name="locate" size={24} color="#6366F1" />
          </TouchableOpacity>
        )}

        {/* Simple Restaurant Tooltip - Matching Reference Design */}
        {selectedMarker && (
          <View style={styles.simpleTooltipContainer}>
            <TouchableOpacity 
              style={styles.simpleTooltipOverlay}
              onPress={() => setSelectedMarker(null)}
              activeOpacity={1}
            />
            <View style={styles.simpleTooltip}>
              <TouchableOpacity 
                style={styles.simpleTooltipContent}
                onPress={() => handleTooltipPress(selectedMarker)}
                activeOpacity={0.9}
              >
                        {/* Restaurant Image */}
        <OptimizedImage
          source={selectedMarker.logo ? { uri: selectedMarker.logo } : require('@/assets/images/default-res-img.jpg')}
          width="100%"
          height="100%"
          style={styles.simpleTooltipImage}
          contentFit="cover"
          fallbackIcon="restaurant"
          alt={`${selectedMarker.name} restaurant image`}
        />
                
                {/* Restaurant Info */}
                <View style={styles.simpleTooltipInfo}>
                  <ThemedText style={styles.simpleTooltipTitle} numberOfLines={1}>
                    {selectedMarker.name}
                  </ThemedText>
                  
                  {/* Rating Row */}
                  <View style={styles.simpleTooltipRating}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <ThemedText style={styles.simpleTooltipRatingText}>
                      {selectedMarker.rating ? selectedMarker.rating.toFixed(1) : '4.5'}
                    </ThemedText>
                    <ThemedText style={styles.simpleTooltipReviews}>
                      ({selectedMarker.review_count || '100'} reviews)
                    </ThemedText>
                  </View>
                  
                  {/* Cuisine */}
                  <ThemedText style={styles.simpleTooltipCuisine} numberOfLines={1}>
                    {selectedMarker.cuisine_styles.length > 0 ? selectedMarker.cuisine_styles[0] : 'Restaurant'}
                  </ThemedText>
                  
                  {/* Time and Address */}
                  <View style={styles.simpleTooltipMeta}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" />
                    <ThemedText style={styles.simpleTooltipMetaText}>
                      {selectedMarker.timeEstimate || '20-30 min'}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.simpleTooltipMeta}>
                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                    <ThemedText style={styles.simpleTooltipMetaText} numberOfLines={1}>
                      {selectedMarker.street_address}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
              
              {/* Action Link */}
              <TouchableOpacity 
                style={styles.simpleTooltipAction}
                onPress={() => handleTooltipPress(selectedMarker)}
              >
                <ThemedText style={styles.simpleTooltipActionText}>Tap to view details</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation />

      </View>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dsColors.neutral.white,
  },
  relativeContainer: {
    flex: 1,
    position: 'relative',
  },
  fullscreenMapBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  // Top bar absolute, sharp corners, bluish transparent

  // Screen Header
  screenHeader: {
    position: 'absolute',
    top: Constants.statusBarHeight + 8,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 78, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 2,
  },
  headerCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B4EFF',
    textAlign: 'center',
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(107, 78, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickableTitle: {
    // Style for clickable titles - no additional changes needed
  },
  clickableTitleText: {
    color: '#6B4EFF',
  },
  titleChevron: {
    marginLeft: 4,
  },
  // Top Search Section - Matching Screenshot
  topSearchSection: {
    position: 'absolute',
    top: Constants.statusBarHeight + 80,
    left: 0,
    right: 0,
    zIndex: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 0,
  },
  microphoneButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dsSpacing.md,
    paddingVertical: dsSpacing.xs,
  },
  filterScrollView: {
    flex: 1,
    maxHeight: 50, // Ensure adequate height for filter pills
  },
  filterContainer: {
    paddingHorizontal: 0,
    gap: 8,
    alignItems: 'center',
    minHeight: 40, // Ensure minimum height for filter pills
  },
  countContainer: {
    marginLeft: dsSpacing.sm,
    paddingHorizontal: dsSpacing.xs,
    paddingVertical: dsSpacing.xs / 2,
    backgroundColor: dsColors.neutral.gray100,
    borderRadius: dsSpacing.xs,
  },
  countText: {
    fontSize: dsTypography.fontSize.sm,
    color: dsColors.neutral.gray700,
    fontWeight: '600',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipWithDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  dropdownIcon: {
    marginLeft: 4,
  },
  // Bottom Sheet for Restaurant Cards
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 90, // Account for bottom navigation height (70px + padding)
    zIndex: 20,
    paddingBottom: dsSpacing.lg,
    backgroundColor: 'transparent',
  },
  bottomSheetCollapsed: {
    bottom: 75, // Account for bottom navigation height (70px + small padding)
  },
  carouselContainer: {
    paddingHorizontal: dsSpacing.lg,
  },
  carouselHandle: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  handleBar: {
    width: 32,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginRight: 8,
  },
  handleIcon: {
    marginLeft: 4,
  },
  collapsedContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  collapsedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 4,
  },
  collapsedSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // My Location Button
  myLocationButton: {
    position: 'absolute',
    top: Constants.statusBarHeight + 200,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 15,
  },
  // Simple Restaurant Tooltip Styles - Matching Reference Design
  simpleTooltipContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  simpleTooltipOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  simpleTooltip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    width: '100%',
    maxWidth: 320,
  },
  simpleTooltipContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  simpleTooltipImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  simpleTooltipInfo: {
    flex: 1,
  },
  simpleTooltipTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 4,
  },
  simpleTooltipRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  simpleTooltipRatingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1F2937',
    marginLeft: 4,
  },
  simpleTooltipReviews: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  simpleTooltipCuisine: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500' as const,
    marginBottom: 6,
  },
  simpleTooltipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  simpleTooltipMetaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  simpleTooltipAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  simpleTooltipActionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6366F1',
  },
  tooltipCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tooltipContent: {
    flex: 1,
  },
  tooltipImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  tooltipMainImage: {
    width: '100%',
    height: '100%',
  },
  tooltipImageOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  tooltipRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tooltipRatingBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  tooltipBody: {
    padding: 20,
  },
  tooltipMainInfo: {
    marginBottom: 16,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 26,
  },
  tooltipSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipReviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  tooltipDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  tooltipCuisine: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500' as const,
  },
  tooltipMetaContainer: {
    marginBottom: 20,
  },
  tooltipMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tooltipMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tooltipMetaLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#374151',
    marginLeft: 6,
  },
  tooltipAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tooltipAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
  },
  tooltipActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tooltipActionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginRight: 8,
  },
  // New Restaurant Card Styles - Reduced by 35%
  restaurantCard: {
    width: width * 0.55, // Reduced from 0.85 to 0.55 (35% reduction)
    backgroundColor: dsComponents.RestaurantCard.backgroundColor,
    borderRadius: dsComponents.RestaurantCard.borderRadius,
    marginRight: dsSpacing.lg,
    elevation: dsComponents.RestaurantCard.elevation,
    shadowColor: dsComponents.RestaurantCard.shadowColor,
    shadowOffset: dsComponents.RestaurantCard.shadowOffset,
    shadowOpacity: dsComponents.RestaurantCard.shadowOpacity,
    shadowRadius: dsComponents.RestaurantCard.shadowRadius,
    overflow: 'hidden',
  },
  restaurantImageContainer: {
    position: 'relative',
    width: '100%',
    height: dsComponents.RestaurantCard.image.height * 0.65, // Reduced from 160 to ~104 (35% reduction)
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: dsComponents.RestaurantCard.borderRadius,
    borderTopRightRadius: dsComponents.RestaurantCard.borderRadius,
  },
  restaurantDiscountBadge: {
    position: 'absolute' as const,
    top: dsComponents.RestaurantCard.badge.top,
    left: dsComponents.RestaurantCard.badge.left,
    backgroundColor: dsComponents.RestaurantCard.badge.backgroundColor,
    paddingHorizontal: dsComponents.RestaurantCard.badge.paddingHorizontal,
    paddingVertical: dsComponents.RestaurantCard.badge.paddingVertical,
    borderRadius: dsComponents.RestaurantCard.badge.borderRadius,
    zIndex: 2,
  },
  restaurantDiscountText: {
    fontSize: dsComponents.RestaurantCard.badge.fontSize,
    color: dsComponents.RestaurantCard.badge.color,
    fontWeight: '600' as const,
  },
  restaurantFavoriteButton: {
    position: 'absolute' as const,
    top: dsComponents.RestaurantCard.favoriteButton.top,
    right: dsComponents.RestaurantCard.favoriteButton.right,
    width: dsComponents.RestaurantCard.favoriteButton.width,
    height: dsComponents.RestaurantCard.favoriteButton.height,
    borderRadius: dsComponents.RestaurantCard.favoriteButton.borderRadius,
    backgroundColor: dsComponents.RestaurantCard.favoriteButton.backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: dsComponents.RestaurantCard.favoriteButton.shadowColor,
    shadowOffset: dsComponents.RestaurantCard.favoriteButton.shadowOffset,
    shadowOpacity: dsComponents.RestaurantCard.favoriteButton.shadowOpacity,
    shadowRadius: dsComponents.RestaurantCard.favoriteButton.shadowRadius,
    elevation: dsComponents.RestaurantCard.favoriteButton.elevation,
  },
  restaurantInfo: {
    padding: dsComponents.RestaurantCard.content.padding * 0.8, // Slightly reduced padding for smaller card
  },
  restaurantName: {
    fontSize: dsTypography.fontSize.lg,
    fontWeight: '700' as const,
    color: dsColors.neutral.gray900,
    marginBottom: dsSpacing.xs,
  },
  restaurantMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dsSpacing.sm,
  },
  restaurantRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantRatingText: {
    fontSize: dsTypography.fontSize.sm,
    fontWeight: '600' as const,
    color: dsColors.neutral.gray900,
    marginLeft: dsSpacing.xs,
  },
  restaurantMetaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: dsColors.neutral.gray400,
    marginHorizontal: dsSpacing.sm,
  },
  restaurantMetaText: {
    fontSize: dsTypography.fontSize.sm,
    color: dsColors.neutral.gray600,
  },
  restaurantAddress: {
    fontSize: dsTypography.fontSize.sm,
    color: dsColors.neutral.gray600,
  },
  // New card component styles
  restaurantNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dsSpacing.xs,
  },
  addressButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: dsColors.neutral.gray100,
  },
  restaurantReviews: {
    fontSize: dsTypography.fontSize.sm,
    color: dsColors.neutral.gray600,
    marginTop: dsSpacing.xs,
  },
  matchesButton: {
    marginTop: dsSpacing.sm,
    backgroundColor: dsColors.primary.light,
    paddingHorizontal: dsSpacing.sm,
    paddingVertical: dsSpacing.xs,
    borderRadius: dsSpacing.xs,
    alignSelf: 'flex-start',
  },
  matchesButtonText: {
    fontSize: dsTypography.fontSize.sm,
    color: dsColors.neutral.white,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressModal: {
    backgroundColor: dsColors.neutral.white,
    margin: dsSpacing.lg,
    padding: dsSpacing.lg,
    borderRadius: dsSpacing.md,
    minWidth: width * 0.7,
  },
  addressModalTitle: {
    fontSize: dsTypography.fontSize.lg,
    fontWeight: '700',
    color: dsColors.neutral.gray900,
    marginBottom: dsSpacing.sm,
  },
  addressModalText: {
    fontSize: dsTypography.fontSize.base,
    color: dsColors.neutral.gray700,
    lineHeight: 22,
  },
  matchesModal: {
    backgroundColor: dsColors.neutral.white,
    margin: dsSpacing.lg,
    padding: dsSpacing.lg,
    borderRadius: dsSpacing.md,
    minWidth: width * 0.7,
  },
  matchesModalTitle: {
    fontSize: dsTypography.fontSize.lg,
    fontWeight: '700',
    color: dsColors.neutral.gray900,
    marginBottom: dsSpacing.sm,
  },
  matchText: {
    fontSize: dsTypography.fontSize.base,
    color: dsColors.neutral.gray700,
    marginBottom: dsSpacing.xs,
    lineHeight: 22,
  },

  mapLoadingText: {
    marginTop: 12,
    color: '#6B4EFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorMsg: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  noResults: {
    color: '#888',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  statusContent: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  overlayCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  restaurantMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantMarkerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC4C48',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  restaurantIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantMarkerTail: {
    width: 3,
    height: 8,
    backgroundColor: '#DC4C48',
    marginTop: -2,
    borderRadius: 1.5,
  },
  userLocationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  userLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  mapControlFab: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24,
    padding: 8,
    elevation: 4,
  },
  reviewsBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 3,
    minWidth: 36,
    alignItems: 'center',
  },
  reviewsBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapErrorText: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mapErrorSubtext: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
  // Distance Filter Styles
  distanceFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: dsSpacing.sm,
    paddingVertical: dsSpacing.xs,
    borderRadius: dsRadius.md,
    marginRight: dsSpacing.sm,
    gap: dsSpacing.xs,
  },
  distanceFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  // Distance Modal Styles
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'flex-end',
  },
  distanceModal: {
    backgroundColor: dsColors.neutral.white,
    borderTopLeftRadius: dsRadius.lg,
    borderTopRightRadius: dsRadius.lg,
    paddingBottom: dsSpacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: dsSpacing.lg,
    paddingVertical: dsSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: dsColors.neutral.gray200,
  },
  modalTitle: {
    fontSize: dsTypography.fontSize.lg,
    fontWeight: '600',
    color: dsColors.neutral.gray900,
  },
  distanceOptions: {
    paddingHorizontal: dsSpacing.lg,
    paddingTop: dsSpacing.md,
  },
  distanceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dsSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: dsColors.neutral.gray200,
  },
  selectedDistanceOption: {
    backgroundColor: dsColors.primary.surface,
  },
  distanceOptionText: {
    fontSize: dsTypography.fontSize.base,
    color: dsColors.neutral.gray900,
  },
  selectedDistanceOptionText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  manualDistanceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dsSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: dsColors.neutral.gray200,
  },
  manualDistanceContent: {
    padding: dsSpacing.lg,
  },
  manualDistanceLabel: {
    fontSize: dsTypography.fontSize.base,
    color: dsColors.neutral.gray600,
    marginBottom: dsSpacing.xs,
  },
  manualDistanceInput: {
    fontSize: dsTypography.fontSize.lg,
    color: dsColors.neutral.gray900,
    borderWidth: 1,
    borderColor: dsColors.neutral.gray300,
    borderRadius: dsRadius.md,
    paddingHorizontal: dsSpacing.sm,
    paddingVertical: dsSpacing.xs,
    marginBottom: dsSpacing.md,
  },
  manualDistanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: dsSpacing.md,
  },
  cancelButton: {
    backgroundColor: dsColors.neutral.gray200,
    paddingVertical: dsSpacing.sm,
    paddingHorizontal: dsSpacing.lg,
    borderRadius: dsRadius.md,
    width: '45%',
  },
  cancelButtonText: {
    color: dsColors.neutral.gray600,
    fontSize: dsTypography.fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: dsColors.primary.main,
    paddingVertical: dsSpacing.sm,
    paddingHorizontal: dsSpacing.lg,
    borderRadius: dsRadius.md,
    width: '45%',
  },
  applyButtonText: {
    color: dsColors.neutral.white,
    fontSize: dsTypography.fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  cuisinePromptContainer: {
    paddingHorizontal: dsSpacing.lg,
    paddingVertical: dsSpacing.md,
    marginBottom: dsSpacing.md,
  },
  cuisinePromptText: {
    fontSize: dsTypography.fontSize.sm,
    color: dsColors.neutral.gray600,
    textAlign: 'center',
  },

  noResultsContainer: {
    height: 300,
    top: 210,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 8,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noResultsTitle: {
    fontSize: 20,
    color: '#6B7280',
    marginBottom: 8,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  noResultsSuggestions: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 18,
    color: '#6B4EFF',
    marginBottom: 8,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionButtonText: {
    fontSize: 16,
    color: '#6B4EFF',
    marginLeft: 8,
  },

  // Viewport loading styles
  viewportLoadingOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewportLoadingText: {
    fontSize: 12,
    color: '#6B4EFF',
    marginLeft: 8,
    fontWeight: '500',
  },

});