import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, FlatList } from 'react-native';
import { OptimizedImage } from '@/components/images/OptimizedImage';
import FunLoadingMessages from '@/components/loading/FunLoadingMessages';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import { BASE_URL, getMediaUrl, getRestaurantCoordinates, getNearbyRestaurants, getRestaurants } from '@/utils/api';
import axios from 'axios';
import { useLocation } from '@/contexts/location';

const { width } = Dimensions.get('window');

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
  rating?: number;
  timeEstimate?: string;
  priceRange?: string;
  review_count?: number;
  discount?: string;
}

const restaurantApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export default function FilterRestaurantsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userLocation, locationError, isLocationReady, refreshLocation } = useLocation();
  const screenTitle = params.title as string || 'Near Me';
  const [selectedFilter, setSelectedFilter] = useState('Location');
  const [mapError, setMapError] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: userLocation?.latitude || 26.8467,
    longitude: userLocation?.longitude || 80.9462,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCard, setActiveCard] = useState(0);
  
  const apiCache = useRef<Record<string, any>>({});
  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);
  
  const filters = [
    { name: 'Location', icon: 'location' as const },
    { name: 'Most Likes', icon: 'heart' as const },
    { name: 'Menus', icon: 'restaurant' as const }
  ];

  const googleMapsApiKey = Constants.expoConfig?.extra?.googleMapsApiKey || '';

  const fetchRestaurants = useCallback(async (search?: string) => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      let url = '/api/restaurants/';
      const queryParams = [];
      const category = params.category as string;
      const filterType = params.type as string;
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
      if (filterType) queryParams.push(`type=${encodeURIComponent(filterType)}`);
      if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
      if (apiCache.current[url]) {
        setRestaurants(apiCache.current[url]);
        setIsLoading(false);
        return;
      }
      const response = await restaurantApi.get(url);
      const restaurantsData = Array.isArray(response.data) ? response.data : response.data.results;
      if (restaurantsData && Array.isArray(restaurantsData)) {
        console.log('Filter Restaurants Web - Total restaurants from API:', restaurantsData.length);
        
        // Filter out restaurants without valid coordinates using our enhanced helper
        const restaurantsWithValidCoordinates = restaurantsData.filter((restaurant: any) => {
          const coordinates = getRestaurantCoordinates(restaurant);
          const hasValidCoordinates = coordinates !== null;
          if (!hasValidCoordinates) {
            console.log(`Filter Restaurants Web - Filtering out restaurant "${restaurant.name}" - no valid coordinates`);
          }
          return hasValidCoordinates;
        });
        
        console.log('Filter Restaurants Web - Restaurants with valid coordinates:', restaurantsWithValidCoordinates.length);
        console.log('Filter Restaurants Web - Filtered out restaurants:', restaurantsData.length - restaurantsWithValidCoordinates.length);
        
        if (restaurantsWithValidCoordinates.length === 0) {
          console.log('Filter Restaurants Web - No restaurants with valid coordinates');
          setRestaurants([]);
          if (restaurantsData.length > 0) {
            setErrorMsg('No restaurants with valid location data found');
          } else {
            setErrorMsg('No restaurants found');
          }
          return;
        }
        
        const formattedRestaurants = restaurantsWithValidCoordinates.map((restaurant: any) => {
          // Use the helper function to get coordinates
          const coordinates = getRestaurantCoordinates(restaurant);
          
          return {
            ...restaurant,
            latitude: coordinates?.latitude || 0,
            longitude: coordinates?.longitude || 0,
            cuisine_styles: restaurant.cuisine_styles?.map((style: any) => style.name) || [],
            venue_types: restaurant.venue_types?.map((type: any) => type.name) || [],
            logo: restaurant.logo ? getMediaUrl(restaurant.logo) : null
          };
        });
        
        console.log('Filter Restaurants Web - Successfully formatted', formattedRestaurants.length, 'restaurants');
        apiCache.current[url] = formattedRestaurants;
        setRestaurants(formattedRestaurants);
      }
    } catch (error) {
      setErrorMsg('Failed to load restaurants. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [params.category, params.type]);

  useEffect(() => {
    isMounted.current = true;
    if (!initialFetchDone.current) {
      fetchRestaurants();
      initialFetchDone.current = true;
    }
    return () => {
      isMounted.current = false;
    };
  }, [fetchRestaurants]);

  useEffect(() => {
    if (isLocationReady && userLocation) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [userLocation, isLocationReady]);

  const renderMap = () => {
    const WebMapView = require('@/components/WebMapView').WebMapView;
    return (
      <WebMapView
        center={mapRegion}
        markers={[
          ...(restaurants.map(r => ({
            latitude: r.latitude,
            longitude: r.longitude,
            title: r.name,
            id: r.id,
          }))),
          userLocation && {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            title: 'You',
            id: 'user-location',
          },
        ].filter(Boolean)}
        zoom={15}
        style={{ height: '100%', width: '100%', minHeight: 400, borderRadius: 0 }}
      />
    );
  };

  const renderCarousel = () => (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 32,
      zIndex: 20,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
        onScroll={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / 320);
          setActiveCard(idx);
        }}
        snapToInterval={320}
        decelerationRate="fast"
      >
        {restaurants.map((restaurant, idx) => (
          <TouchableOpacity
            key={restaurant.id}
            style={[
              styles.carouselCard,
              idx === activeCard && styles.activeCarouselCard,
            ]}
            onPress={() => router.push(`/restaurant-profile?id=${restaurant.id}`)}
            activeOpacity={0.9}
          >
            <OptimizedImage
              source={restaurant.logo ? { uri: restaurant.logo } : require('@/assets/images/default-res-img.jpg')}
              width="100%"
              height="100%"
              style={styles.carouselImage}
              contentFit="cover"
              fallbackIcon="restaurant"
              alt={`${restaurant.name} restaurant image`}
            />
            <View style={styles.carouselContent}>
              <ThemedText style={styles.carouselName}>{restaurant.name}</ThemedText>
              <ThemedText style={styles.carouselCuisine}>{restaurant.cuisine_styles.join(', ')}</ThemedText>
              <ThemedText style={styles.carouselAddress}>{restaurant.street_address}</ThemedText>
              <View style={styles.carouselRatingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <ThemedText style={styles.carouselRatingText}>{restaurant.rating?.toFixed(1) ?? 'N/A'}</ThemedText>
                <ThemedText style={styles.carouselReviewText}>{restaurant.review_count ?? 0} reviews</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </div>
  );

  return (
    <View style={styles.webContainer}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400, zIndex: 1 }}>{renderMap()}</div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#6B4EFF" />
          </TouchableOpacity>
          <ThemedText style={styles.bigTitle}>{screenTitle}</ThemedText>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={styles.searchBarFloating}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for restaurants..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => fetchRestaurants(searchQuery)}
            />
          </View>
          <TouchableOpacity style={styles.filterButtonFloating} onPress={() => router.push('/filter-options')}>
            <Ionicons name="options-outline" size={20} color="#6B4EFF" />
          </TouchableOpacity>
        </div>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContentContainerFloating}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.name}
              style={[styles.filterPillFloating, selectedFilter === filter.name && styles.activeFilterPillFloating]}
              onPress={() => setSelectedFilter(filter.name)}
            >
              <Ionicons name={(filter.icon + '-outline') as any} size={16} color={selectedFilter === filter.name ? '#fff' : '#6B4EFF'} />
              <ThemedText style={[styles.filterPillTextFloating, selectedFilter === filter.name && styles.activeFilterPillTextFloating]}>
                {filter.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </div>
      {restaurants.length > 0 && renderCarousel()}
      {!isLocationReady ? (
        <div style={styles.overlayCenter}><FunLoadingMessages size="large" color="#6B4EFF" /><ThemedText style={styles.mapLoadingText}>Getting your location...</ThemedText></div>
      ) : locationError ? (
        <div style={styles.overlayCenter}><Ionicons name="warning" size={32} color="#FF3B30" /><ThemedText style={styles.mapLoadingText}>{locationError}</ThemedText></div>
      ) : null}
      <div style={{ height: 400 }} />
      <View style={styles.webContent}>
        {isLoading ? (
          <FunLoadingMessages size="large" color="#6B4EFF" containerStyle={{ marginTop: 32 }} />
        ) : errorMsg ? (
          <ThemedText style={styles.errorMsg}>{errorMsg}</ThemedText>
        ) : restaurants.length === 0 ? (
          <ThemedText style={styles.noResults}>No restaurants found.</ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: '#F8F8FF',
    position: 'relative',
    overflow: 'hidden',
  },
  webContent: {
    flex: 1,
    backgroundColor: '#F8F8FF',
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  bigTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#222',
    marginLeft: 8,
  },
  backButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  searchBarFloating: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  filterButtonFloating: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  filterContentContainerFloating: {
    paddingVertical: 8,
    gap: 8,
  },
  filterPillFloating: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  activeFilterPillFloating: {
    backgroundColor: '#6B4EFF',
  },
  filterPillTextFloating: {
    fontSize: 16,
    color: '#6B4EFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  activeFilterPillTextFloating: {
    color: '#fff',
    fontWeight: '700',
  },
  carouselCard: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    marginRight: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCarouselCard: {
    borderWidth: 2,
    borderColor: '#6B4EFF',
  },
  carouselImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  carouselContent: {
    flex: 1,
  },
  carouselName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  carouselCuisine: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  carouselAddress: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  carouselRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  carouselRatingText: {
    fontSize: 13,
    color: '#FFD700',
    marginLeft: 4,
    marginRight: 8,
    fontWeight: '600',
  },
  carouselReviewText: {
    fontSize: 12,
    color: '#888',
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
}); 