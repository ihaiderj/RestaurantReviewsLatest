import { StyleSheet, View, TextInput, Image, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Platform, Easing, Modal, NativeSyntheticEvent, NativeScrollEvent, ImageBackground, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { OptimizedImage } from '@/components/images/OptimizedImage';
import FunLoadingMessages from '@/components/loading/FunLoadingMessages';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import SearchDropdown from '@/components/SearchDropdown';
import { RestaurantCard } from '@/components/RestaurantCard';
import { DistanceSelector } from '@/components/DistanceSelector';

import AnimatedSearchBox from '@/components/AnimatedSearchBox';
import { 
  getRestaurants, 
  getNearbyRestaurants, 
  searchRestaurantsByLocation,
  getMediaUrl,
  getRestaurantCoordinates,
  getAutocompleteSuggestions,
  type ApiRestaurant, 
  type RestaurantListResponse,
  type AutocompleteSuggestion
} from '@/utils/api';

const { width, height } = Dimensions.get('window');
const cardWidth = width * 0.82;
const cardSpacing = width * 0.06;

const ANIMATION_CONFIG = {
  duration: 400,
  useNativeDriver: true,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// Define offers data
type SpecialOffer = {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  image: { uri: string };
  foodImage: { uri: string };
  gradientColors: [string, string];
  textColor: string;
  backgroundColor?: string;
};

const SPECIAL_OFFERS: SpecialOffer[] = [
  {
    id: '1',
    title: 'Summer Special',
    subtitle: 'Get amazing discounts on selected restaurants',
    discount: '25%',
    image: { uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=500&q=80' },
    foodImage: { uri: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&q=80' },
    gradientColors: ['#FF6B6B', '#FF8E53'],
    textColor: '#FFFFFF',
    backgroundColor: '#FF6B6B',
  },
  {
    id: '2',
    title: 'Weekend Brunch',
    subtitle: 'Special weekend brunch offers',
    discount: '30%',
    image: { uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=500&q=80' },
    foodImage: { uri: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&h=500&q=80' },
    gradientColors: ['#4E54C8', '#8F94FB'],
    textColor: '#FFFFFF',
    backgroundColor: '#4E54C8',
  },
  {
    id: '3',
    title: 'Happy Hours',
    subtitle: 'Special discounts during happy hours',
    discount: '40%',
    image: { uri: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&h=500&q=80' },
    foodImage: { uri: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&h=500&q=80' },
    gradientColors: ['#11998e', '#38ef7d'],
    textColor: '#FFFFFF',
    backgroundColor: '#11998e',
  },
  {
    id: '4',
    title: 'Family Pack',
    subtitle: 'Special family dinner packages',
    discount: '35%',
    image: { uri: 'https://images.unsplash.com/photo-1516062423079-7ca13cdc7f5a?w=500&h=500&q=80' },
    foodImage: { uri: 'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=500&h=500&q=80' },
    gradientColors: ['#8E2DE2', '#4A00E0'],
    textColor: '#FFFFFF',
    backgroundColor: '#8E2DE2',
  },
  {
    id: '5',
    title: 'First Order',
    subtitle: 'Special discount on your first order',
    discount: '50%',
    image: { uri: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=500&h=500&q=80' },
    foodImage: { uri: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=500&h=500&q=80' },
    gradientColors: ['#F857A6', '#FF5858'],
    textColor: '#FFFFFF',
    backgroundColor: '#F857A6',
  },
];

// Define cuisine data
const Filters = [
  { 
    id: '1', 
    name: 'Near Me', 
    icon: 'location-outline' as const,
    bgColor: '#E3F2FD',
    iconColor: '#1976D2'
  },
  { 
    id: '2', 
    name: 'International Cuisines', 
    icon: 'globe-outline' as const,
    bgColor: '#E8F5E8',
    iconColor: '#388E3C'
  },
  { 
    id: '3', 
    name: 'Venue Types', 
    icon: 'business-outline' as const,
    bgColor: '#FFF3E0',
    iconColor: '#F57C00'
  },
  { 
    id: '4', 
    name: 'Amenities', 
    icon: 'options-outline' as const,
    bgColor: '#F3E5F5',
    iconColor: '#7B1FA2'
  },
];

// Update the restaurant type definition to match API response
type Restaurant = {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  review_count: number;
  image: { uri: string };
  distance: string;
  hasOffer: boolean;
  // Additional fields from API
  street_address: string;
  city: string;
  latitude: number;
  longitude: number;
  venue_types: string[];
  cuisine_styles: string[];
  logo: string | null;
  is_approved: boolean;
};

// Add these filter types and data at the top with other constants
type FilterType = 'nearest' | 'offers' | 'rating';

const FILTER_OPTIONS = [
  { id: 'nearest', label: 'Nearest', icon: 'location-outline' as const },
  { id: 'offers', label: 'Great Offers', icon: 'pricetag-outline' as const },
  { id: 'rating', label: 'Rating 4.5+', icon: 'star-outline' as const },
] as const;

const DISTANCE_OPTIONS = [0.25, 0.5, 1, 2, 5, 10, 15, 25, 40, 50]; // Distance options in kilometers (250m, 500m, 1km, etc.)

// Helper function to format distance display
const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance}km`;
};

const SpecialOfferCard = ({ offer, index }: { offer: SpecialOffer; index: number }) => {
  const translateX = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        delay: index * 100,
        ...ANIMATION_CONFIG,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        delay: index * 100,
        ...ANIMATION_CONFIG,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.offerCard,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      <LinearGradient
        colors={offer.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.offerCardGradient}
      >
        <View style={styles.offerCardContent}>
          <View style={styles.offerTextContent}>
            <ThemedText style={[styles.offerTitle, { color: offer.textColor }]}>
              {offer.title}
            </ThemedText>
            <ThemedText style={[styles.offerSubtitle, { color: offer.textColor }]}>
              {offer.subtitle}
            </ThemedText>
            <View style={styles.discountSection}>
              <View style={styles.discountContainer}>
                <View style={styles.discountWrapper}>
                  <ThemedText style={[styles.discountText, { color: offer.textColor }]}>
                    {offer.discount}
                  </ThemedText>
                  <ThemedText style={[styles.offText, { color: offer.textColor }]}>
                    OFF
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity style={styles.bookButton}>
                <ThemedText style={styles.bookButtonText}>Claim Now</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
                        <View style={styles.offerImagesContainer}>
                <OptimizedImage 
                  source={offer.foodImage} 
                  width="100%"
                  height="100%"
                  style={styles.offerFoodImage} 
                  contentFit="cover"
                  fallbackIcon="restaurant"
                  alt="Food image"
                />
                <OptimizedImage 
                  source={offer.image} 
                  width="100%"
                  height="100%"
                  style={styles.offerDecorativeImage} 
                  contentFit="cover"
                  fallbackIcon="restaurant"
                  alt="Decorative image"
                />
              </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// Add these types at the top with other type definitions
interface LocationState {
  address: string;
  isLoading: boolean;
  error: string | null;
}

// Add these types at the top with other type definitions
type NotificationType = {
  id: string;
  title: string;
  message: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBgColor: string;
  iconColor: string;
  time: string;
  date: 'TODAY' | 'YESTERDAY';
};

// Add this constant with other constants
const NOTIFICATIONS: Record<string, NotificationType[]> = {
  'TODAY': [
    {
      id: '1',
      title: 'Table Booked Successfully!',
      message: 'Your table has been booked at The Italian Place for today at 7:00 PM.',
      icon: 'restaurant-outline',
      iconBgColor: '#F0F0FF',
      iconColor: '#6B4EFF',
      time: '1h ago',
      date: 'TODAY',
    },
    {
      id: '2',
      title: 'Special Offer Available',
      message: 'New 25% discount available on your favorite restaurant.',
      icon: 'pricetag-outline',
      iconBgColor: '#FFE6E6',
      iconColor: '#FF4B55',
      time: '2h ago',
      date: 'TODAY',
    }
  ],
  'YESTERDAY': [
    {
      id: '3',
      title: 'Review Reminder',
      message: 'Don\'t forget to review your recent visit to Sushi Master.',
      icon: 'star-outline',
      iconBgColor: '#FFF0E6',
      iconColor: '#FF8C40',
      time: '1d ago',
      date: 'YESTERDAY',
    }
  ]
};

// Fallback data removed as per backend team request - all endpoints now fully operational

export default function IndexScreen() {
  // All useState hooks first
  const [isClient, setIsClient] = useState(false);
  const [activeSpecialOfferIndex, setActiveSpecialOfferIndex] = useState(0);

  const [activeFilter, setActiveFilter] = useState<FilterType>('nearest');
  const [location, setLocation] = useState<LocationState>({
    address: 'Loading location...',
    isLoading: true,
    error: null
  });
  const [userCoordinates, setUserCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);
  const [selectedDistance, setSelectedDistance] = useState(1); // Default to 1km
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [manualDistance, setManualDistance] = useState('');
  const [showOffersMessage, setShowOffersMessage] = useState(false);
  
  // Search suggestions state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [searchMode, setSearchMode] = useState<'near_me' | 'all'>('near_me');

  // All useRef hooks
  const specialOffersScrollRef = useRef<ScrollView>(null);
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // Other hooks
  const [fontsLoaded] = useFonts({
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
  });
  const router = useRouter();

  // Handle animated search box press
  const handleAnimatedSearchPress = () => {
    setShowSearchSuggestions(true);
  };

  // Handle search box focus
  const handleSearchFocus = () => {
    console.log('Search focused');
    setShowSearchSuggestions(true);
  };

  // Handle search text change
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

  // Handle search submission
  const handleSearchSubmit = (query: string) => {
    console.log('Search submitted:', query);
    setSearchQuery(query);
    setShowSearchSuggestions(false);
    
    const params: any = {
      title: `Search: ${query}`,
      searchQuery: query,
    };

    if (searchMode === 'near_me') {
      params.latitude = userCoordinates?.latitude;
      params.longitude = userCoordinates?.longitude;
      params.radius = selectedDistance;
      params.searchMode = 'near_me';
    } else {
      params.searchMode = 'all';
    }

    // Navigate to filter restaurants screen with search query
    router.push({
      pathname: '/filter-restaurants',
      params
    });
  };

  // Handle search query change (for suggestions)
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim() && !showSearchSuggestions) {
      setShowSearchSuggestions(true);
    }
  };

  // Handle suggestion selection (multi-select)
  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    console.log('Suggestion selected:', suggestion);
    
    // Add to selected suggestions if not already selected
    if (!selectedSuggestions.some(selected => 
      selected.type === suggestion.type && selected.id === suggestion.id
    )) {
      setSelectedSuggestions(prev => [...prev, suggestion]);
    }
  };

  // Handle suggestion deselection
  const handleSuggestionDeselect = (suggestion: AutocompleteSuggestion) => {
    console.log('Suggestion deselected:', suggestion);
    setSelectedSuggestions(prev => 
      prev.filter(selected => 
        !(selected.type === suggestion.type && selected.id === suggestion.id)
      )
    );
  };

  // Handle search mode change
  const handleSearchModeChange = (mode: 'near_me' | 'all') => {
    console.log('Search mode changed:', mode);
    setSearchMode(mode);
  };

  // Handle distance change
  const handleDistanceChange = (distance: number) => {
    console.log('Distance changed:', distance);
    setSelectedDistance(distance);
  };

  // Handle apply selections
  const handleApplySelections = () => {
    // This function is called when the "Apply" button in the dropdown is pressed
    const selectionNames = selectedSuggestions.map(s => s.name).join(', ');
    const finalQuery = searchQuery ? `${selectionNames} ${searchQuery}`.trim() : selectionNames;
    
    // Create detailed suggestion data for the result page
    const suggestionData = selectedSuggestions.map(s => ({
      type: s.type,
      id: s.id,
      name: s.name,
      code: s.code || s.name
    }));
    
    // Navigate to filter restaurants with all parameters
    const params: any = {
      keywords: finalQuery,
      searchMode,
      suggestionData: JSON.stringify(suggestionData), // Pass full suggestion data
    };

    if (searchMode === 'near_me') {
      params.latitude = userCoordinates?.latitude;
      params.longitude = userCoordinates?.longitude;
      params.radius = selectedDistance;
    }

    router.push({
      pathname: '/filter-restaurants',
      params
    });
    
    // Close suggestions and clear search text
    setShowSearchSuggestions(false);
    setSearchQuery('');
  };

  const handleProceedWithSelections = () => {
    // This function is called when the arrow icon is pressed
    handleApplySelections();
  };

  // Handle single suggestion selection (for immediate navigation)
  const handleSingleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    console.log('Single suggestion selected:', suggestion);
    setShowSearchSuggestions(false);
    setSearchQuery(suggestion.name);

    // Navigate based on suggestion type
    switch (suggestion.type) {
      case 'restaurant':
        // Navigate to restaurant profile
        router.push({
          pathname: '/(modals)/restaurant-profile/[id]',
          params: { id: suggestion.id.toString() }
        });
        break;
      
      case 'cuisine':
        // Navigate to filter restaurants with cuisine filter
        const cuisineParams: any = { 
          title: `${suggestion.name} Restaurants`,
          cuisine: suggestion.code || suggestion.name,
        };
        if (searchMode === 'near_me') {
          cuisineParams.latitude = userCoordinates?.latitude;
          cuisineParams.longitude = userCoordinates?.longitude;
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
          venueParams.latitude = userCoordinates?.latitude;
          venueParams.longitude = userCoordinates?.longitude;
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
          amenityParams.latitude = userCoordinates?.latitude;
          amenityParams.longitude = userCoordinates?.longitude;
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
          defaultParams.latitude = userCoordinates?.latitude;
          defaultParams.longitude = userCoordinates?.longitude;
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



  // Close search suggestions
  const closeSuggestions = () => {
    console.log('Closing suggestions');
    setShowSearchSuggestions(false);
    
    // If there are selected suggestions, clear the search text to show selections
    if (selectedSuggestions.length > 0) {
      console.log('Clearing search text to show selected suggestions');
      setSearchQuery('');
    }
  };

  // Helper function to calculate distance between two coordinates
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Function to convert API restaurant to UI restaurant
  const transformApiRestaurant = useCallback((apiRestaurant: ApiRestaurant, userLat?: number, userLon?: number): Restaurant => {
    // Get the best image from the restaurant
    let imageUri = null;
    
    if (apiRestaurant.images && apiRestaurant.images.length > 0) {
      imageUri = getMediaUrl(apiRestaurant.images[0].image);
    } else if (apiRestaurant.logo) {
      imageUri = getMediaUrl(apiRestaurant.logo);
    }

    // Get coordinates using the helper function
    const coordinates = getRestaurantCoordinates(apiRestaurant);

    // Calculate distance if user location is available
    let distance = 'Unknown distance';
    if (userLat && userLon && coordinates) {
      const dist = calculateDistance(userLat, userLon, coordinates.latitude, coordinates.longitude);
      distance = `${dist.toFixed(1)} km away`;
    }

    // Create cuisine string from cuisine_styles
    const cuisineString = apiRestaurant.cuisine_styles.length > 0 
      ? apiRestaurant.cuisine_styles.map(style => typeof style === 'string' ? style : style.name).join(' • ')
      : 'Restaurant';

    return {
      id: apiRestaurant.id,
      name: apiRestaurant.name,
      cuisine: cuisineString,
      rating: typeof apiRestaurant.rating === 'number' && apiRestaurant.rating > 0 ? apiRestaurant.rating : 0,
      review_count: typeof apiRestaurant.review_count === 'number' && apiRestaurant.review_count > 0
        ? apiRestaurant.review_count
        : typeof apiRestaurant.total_reviews === 'number' && apiRestaurant.total_reviews > 0
        ? apiRestaurant.total_reviews
        : 0,
      image: imageUri ? { uri: imageUri } : require('@/assets/images/default-res-img.jpg'),
      distance,
      hasOffer: false, // Temporarily disabled
      street_address: apiRestaurant.street_address || '',
      city: apiRestaurant.city || '',
      latitude: coordinates?.latitude || 0,
      longitude: coordinates?.longitude || 0,
      venue_types: [],  // Simplified for now to avoid type issues
      cuisine_styles: apiRestaurant.cuisine_styles.map((style: any) => typeof style === 'string' ? style : style.name),
      logo: apiRestaurant.logo || null,
      is_approved: apiRestaurant.is_approved,
    };
  }, [calculateDistance]);

  // Function to load more restaurants (lazy loading)
  const loadMoreRestaurants = useCallback(async () => {
    if (!hasMore || isLoadingMore || !userCoordinates) return;
    
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      console.log(`📄 Loading page ${nextPage} of restaurants...`);
      
      const response = await getNearbyRestaurants(
        userCoordinates.latitude,
        userCoordinates.longitude,
        selectedDistance,
        nextPage,
        20
      );
      
      if (response.results && response.results.length > 0) {
        const restaurantsWithValidCoordinates = response.results.filter(restaurant => {
          const coordinates = getRestaurantCoordinates(restaurant);
          return coordinates !== null;
        });
        
        const transformedRestaurants = restaurantsWithValidCoordinates.map(restaurant =>
          transformApiRestaurant(
            restaurant,
            userCoordinates.latitude,
            userCoordinates.longitude
          )
        );
        
        setRestaurants(prev => [...prev, ...transformedRestaurants]);
        setPage(nextPage);
        setHasMore(!!response.next);
        
        console.log(`✅ Loaded ${transformedRestaurants.length} more restaurants (page ${nextPage})`);
      } else {
        setHasMore(false);
        console.log(`📄 No more restaurants available (page ${nextPage})`);
      }
    } catch (error) {
      console.error('❌ Error loading more restaurants:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, userCoordinates, page, selectedDistance]);

  // Function to fetch restaurants
  const fetchRestaurants = useCallback(async () => {
    const fetchStartTime = Date.now();
    const fetchId = Math.random().toString(36).substr(2, 9);
    
    try {
      console.log(`🚀 [${fetchId}] Starting restaurant fetch process...`);
      setIsLoadingRestaurants(true);
      setRestaurantError(null);

      let response: RestaurantListResponse;
      
      if (userCoordinates) {
        // Always use location-based search when user location is available
        console.log(`🔍 [${fetchId}] Using location-based search with optimized radius`);
        console.log(`📍 [${fetchId}] User location:`, userCoordinates);
        console.log(`📏 [${fetchId}] Selected distance: ${selectedDistance} km`);
        
        const apiStartTime = Date.now();
        response = await getNearbyRestaurants(
          userCoordinates.latitude, 
          userCoordinates.longitude, 
          selectedDistance, // Use actual selected distance
          page, // Current page
          20 // 20 restaurants per page for lazy loading
        );
        const apiEndTime = Date.now();
        console.log(`⚡ [${fetchId}] API call completed in: ${apiEndTime - apiStartTime}ms`);
      } else {
        // Use general restaurants API with filters only when no location
        console.log(`🔍 [${fetchId}] Using general search (no location available)`);
        const filters = {
          approved: true, // Only show approved restaurants
          limit: 20, // Limit results for better performance
          ...(activeFilter === 'rating' && { sort: 'name' as const }),
        };
        
        const apiStartTime = Date.now();
        response = await getRestaurants(filters);
        const apiEndTime = Date.now();
        console.log(`⚡ [${fetchId}] API call completed in: ${apiEndTime - apiStartTime}ms`);
      }

      console.log(`📊 [${fetchId}] Total restaurants from API: ${response.results?.length || 0}`);
      console.log(`📊 [${fetchId}] API response count: ${response.count || 0}`);

      // Start data processing timing
      const processingStartTime = Date.now();

      // Filter out restaurants without valid coordinates
      const restaurantsWithValidCoordinates = response.results.filter(restaurant => {
        const coordinates = getRestaurantCoordinates(restaurant);
        const hasValidCoordinates = coordinates !== null;
        
        // Special debugging for Hamza Hotel
        if (restaurant.name.toLowerCase().includes('hamza') || restaurant.name.toLowerCase().includes('hotel')) {
          console.log(`🏨 [${fetchId}] Hamza Hotel check:`, {
            name: restaurant.name,
            coordinates: coordinates,
            hasValidCoordinates: hasValidCoordinates,
            raw_coordinates: restaurant.coordinates,
            raw_latitude: restaurant.latitude,
            raw_longitude: restaurant.longitude
          });
        }
        
        if (!hasValidCoordinates) {
          console.log(`🚫 [${fetchId}] Filtering out restaurant "${restaurant.name}" - no valid coordinates`);
        }
        return hasValidCoordinates;
      });

      console.log(`📊 [${fetchId}] Restaurants with valid coordinates: ${restaurantsWithValidCoordinates.length}`);
      console.log(`📊 [${fetchId}] Filtered out restaurants: ${response.results.length - restaurantsWithValidCoordinates.length}`);

      // If no restaurants with valid coordinates, use fallback data or show empty state
      if (restaurantsWithValidCoordinates.length === 0) {
        console.log(`⚠️ [${fetchId}] No restaurants with valid coordinates from API`);
        if (userCoordinates) {
          setRestaurants([]);
          setRestaurantError('No restaurants found with valid locations in your area');
        } else {
          console.log(`🔄 [${fetchId}] No fallback data - showing empty state as per backend team`);
          setRestaurants([]);
          setRestaurantError('No restaurants found - please check your connection');
        }
        
        const totalTime = Date.now() - fetchStartTime;
        console.log(`⏱️ [${fetchId}] Total fetch time (no results): ${totalTime}ms`);
        return;
      }

      // Transform restaurants data
      const transformStartTime = Date.now();
      const transformedRestaurants = restaurantsWithValidCoordinates.map(restaurant =>
        transformApiRestaurant(
          restaurant,
          userCoordinates?.latitude,
          userCoordinates?.longitude
        )
      );
      const transformEndTime = Date.now();
      
      // Update UI with pagination support
      const uiUpdateStartTime = Date.now();
      
      if (page === 1) {
        // First page: replace all restaurants
        setRestaurants(transformedRestaurants);
        setHasMore(!!response.next);
      } else {
        // Subsequent pages: append to existing restaurants
        setRestaurants(prev => [...prev, ...transformedRestaurants]);
        setHasMore(!!response.next);
      }
      
      setRestaurantError(null);
      const uiUpdateEndTime = Date.now();
      
      // Calculate and log performance metrics
      const totalTime = Date.now() - fetchStartTime;
      const processingTime = transformEndTime - processingStartTime;
      const transformTime = transformEndTime - transformStartTime;
      const uiUpdateTime = uiUpdateEndTime - uiUpdateStartTime;
      
      console.log(`🎯 [${fetchId}] COMPLETE PERFORMANCE BREAKDOWN:`);
      console.log(`   ⏱️  Total time: ${totalTime}ms`);
      console.log(`   🔄 Data processing: ${processingTime}ms`);
      console.log(`   🔧 Transform time: ${transformTime}ms`);
      console.log(`   🎨 UI update time: ${uiUpdateTime}ms`);
      console.log(`   📊 Restaurants displayed: ${transformedRestaurants.length}`);
      
      // Performance analysis
      if (totalTime < 1500) {
        console.log(`   ✅ [${fetchId}] EXCELLENT - Very fast user experience`);
      } else if (totalTime < 3000) {
        console.log(`   ⚠️ [${fetchId}] GOOD - Acceptable but room for improvement`);
      } else if (totalTime < 5000) {
        console.log(`   🐌 [${fetchId}] SLOW - User might notice delay`);
      } else {
        console.log(`   🚨 [${fetchId}] VERY SLOW - Poor user experience`);
      }
    } catch (error) {
      const totalTime = Date.now() - fetchStartTime;
      console.log(`🚨 [${fetchId}] FETCH ERROR ANALYSIS:`);
      console.log(`   ⏱️  Time before error: ${totalTime}ms`);
      console.log(`   🔍 Error details:`, error);
      
      // Determine error type and provide user-friendly message
      let userMessage = 'Something went wrong. Please try again.';
      let shouldUseFallback = !userCoordinates;
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('network')) {
          console.log(`   🌐 [${fetchId}] DIAGNOSIS: Network connectivity issue`);
          userMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          console.log(`   ⏰ [${fetchId}] DIAGNOSIS: Request timeout`);
          userMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          console.log(`   🔗 [${fetchId}] DIAGNOSIS: Server connection failed`);
          userMessage = 'Could not connect to server. Please try again later.';
        } else {
          console.log(`   ❓ [${fetchId}] DIAGNOSIS: Unknown error - ${error.message}`);
        }
      }
      
      if (userCoordinates) {
        setRestaurants([]);
        setRestaurantError(userMessage);
        console.log(`   📱 [${fetchId}] Action: Showing error message to user`);
      } else {
        console.log(`   🔄 [${fetchId}] Action: No fallback data - showing empty state as per backend team`);
        setRestaurants([]);
        setRestaurantError('No restaurants found - please check your connection');
      }
      
      // Log performance impact
      if (totalTime > 10000) {
        console.log(`   🚨 [${fetchId}] CRITICAL: Error took too long (${totalTime}ms) - user likely frustrated`);
      } else {
        console.log(`   ⚠️ [${fetchId}] Error occurred after ${totalTime}ms - manageable delay`);
      }
    } finally {
      const finalTime = Date.now() - fetchStartTime;
      console.log(`🏁 [${fetchId}] Fetch process completed in ${finalTime}ms`);
      setIsLoadingRestaurants(false);
    }
  }, [userCoordinates, activeFilter, selectedDistance, transformApiRestaurant]);

  // Reset pagination when distance changes
  useEffect(() => {
    if (userCoordinates) {
      setPage(1);
      setHasMore(true);
      setRestaurants([]);
      fetchRestaurants();
    }
  }, [selectedDistance, userCoordinates]);

  // Filter restaurants by distance and other filters
  const filterRestaurantsByDistance = useCallback((restaurantList: Restaurant[]) => {
    if (!userCoordinates) {
      // Only log once to avoid spam
      return restaurantList;
    }
    
    console.log('📍 Filtering restaurants by distance:', selectedDistance, 'km');
    console.log('📍 Total restaurants to filter:', restaurantList.length);
    
    const filtered = restaurantList.filter(restaurant => {
      if (!restaurant.latitude || !restaurant.longitude) {
        return true;
      }
      
      const distance = calculateDistance(
        userCoordinates.latitude,
        userCoordinates.longitude,
        restaurant.latitude,
        restaurant.longitude
      );
      
      return distance <= selectedDistance;
    });
    
    console.log(`📍 Distance filtering result: ${restaurantList.length} total → ${filtered.length} within ${selectedDistance}km`);
    return filtered;
  }, [userCoordinates, selectedDistance, calculateDistance]);

  const getFilteredRestaurants = useCallback(() => {
    let filtered: Restaurant[];
    
    switch (activeFilter) {
      case 'nearest':
        filtered = restaurants.sort((a: Restaurant, b: Restaurant) => {
          const distA = parseFloat(a.distance.split(' ')[0]);
          const distB = parseFloat(b.distance.split(' ')[0]);
          return distA - distB;
        });
        break;
      case 'offers':
        // No offers available currently
        filtered = [];
        break;
      case 'rating':
        filtered = restaurants.filter((r: Restaurant) => r.rating >= 4.5);
        break;
      default:
        filtered = restaurants;
    }
    
    // Only apply distance filter for non-location-based results
    // (when userCoordinates is null, we use general API which needs client-side filtering)
    if (!userCoordinates) {
    return filterRestaurantsByDistance(filtered);
    }
    
    // For location-based results, API already filtered by distance
    return filtered;
  }, [activeFilter, restaurants, userCoordinates, filterRestaurantsByDistance]);

  const handleSpecialOffersScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (width * 0.85 + 16));
    setActiveSpecialOfferIndex(index);
  }, []);

  const handleNotificationPress = useCallback(() => {
    setShowNotifications(true);
  }, []);

  // All useEffect hooks together
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation(prev => ({
            ...prev,
            error: 'Permission denied',
            isLoading: false,
            address: 'Location access needed'
          }));
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        
        // Store coordinates for later use
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        
        const [address] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        if (address) {
          const formattedAddress = `${address.street || ''}, ${address.city || ''}`;
          setLocation({
            address: formattedAddress,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        setLocation(prev => ({
          ...prev,
          error: 'Error getting location',
          isLoading: false,
          address: 'Location unavailable'
        }));
      }
    })();
  }, []);

  useEffect(() => {
    if (showNotifications) {
      Animated.spring(slideAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    } else {
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start();
    }
  }, [showNotifications, slideAnimation]);

  // Single useEffect to handle all fetch triggers
  useEffect(() => {
    const shouldFetch = isClient && fontsLoaded && userCoordinates !== null;
    if (shouldFetch) {
    fetchRestaurants();
    }
  }, [fetchRestaurants, isClient, fontsLoaded, userCoordinates]);

  // Handle offers message state
  useEffect(() => {
    setShowOffersMessage(activeFilter === 'offers');
  }, [activeFilter]);

  if (!isClient || !fontsLoaded) {
            return <FunLoadingMessages size="large" color="#6B4EFF" />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/home-bg.jpg')}
        style={styles.header}
        resizeMode="cover"
      >

        <View style={styles.headerBackground}>
          <SafeAreaView edges={['top']}>
              {/* Connection Status */}
              <ConnectionStatus key="header-connection-status" />
              
              {/* Location and search section */}
              <View style={styles.headerTop}>
                <View>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={20} color="#6B4EFF" />
                    <ThemedText style={styles.locationText}>{location.isLoading ? 'Loading...' : 
                     location.error ? 'Location Error' : 
                     location.address}</ThemedText>
                    <Ionicons name="chevron-down" size={16} color="#fff" />
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={handleNotificationPress}
                >
                  <Ionicons name="notifications-outline" size={24} color="#000" />
                  <View style={styles.notificationBadge}>
                    <ThemedText style={styles.notificationCount}>2</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Header Text Section */}
              <View style={styles.headerTextSection}>
                <ThemedText style={styles.headerTitle}>
                  Search for your favourite meal
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>
                  View Your Meal Before You Order It
                </ThemedText>
              </View>

              {/* Animated Search Bar Row */}
              <View style={styles.searchRow}>
                <AnimatedSearchBox
                  onSearch={handleSearchSubmit}
                  onTextChange={handleSearchTextChange}
                  onFocus={handleSearchFocus}
                  selectedSuggestions={selectedSuggestions}
                  onSuggestionRemove={handleSuggestionDeselect}
                  onProceedWithSelections={handleProceedWithSelections}
                  dropdownOpen={showSearchSuggestions}
                  searchQuery={searchQuery}
                  phrases={[
                    "Find the best pizza in town",
                    "Find amazing sushi spots",
                    "Search for cozy coffee shops",
                    "Explore fine dining restaurants",
                    "Find restaurants near you",
                    "Search by cuisine type"
                  ]}
                  placeholder="Search restaurants, cuisines, amenities..."
                />
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => router.push('/filter-options')}
                >
                  <Ionicons name="options-outline" size={20} color="#6B4EFF" />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          bounces={false}
        >

        {/* Filters */}
        <View style={styles.searchSection}>
            <View style={styles.cuisinesRow}>
              {Filters.map((cuisine) => (
                <TouchableOpacity 
                  key={cuisine.id}
                  style={styles.featureCard}
                  onPress={() => {
                    if (cuisine.name === 'Near Me') {
                      router.push({
                        pathname: '/filter-restaurants',
                        params: { 
                          title: cuisine.name,
                          latitude: userCoordinates?.latitude,
                          longitude: userCoordinates?.longitude 
                        }
                      })
                    }
                    else if (cuisine.name === 'International Cuisines') {
                      router.push({
                        pathname: '/international-cuisines',
                        params: { 
                          title: cuisine.name,
                          latitude: userCoordinates?.latitude,
                          longitude: userCoordinates?.longitude 
                        }
                      })
                    }
                    else if (cuisine.name === 'Venue Types') {
                      router.push({
                        pathname: '/venue-types',
                        params: { 
                          title: cuisine.name,
                          latitude: userCoordinates?.latitude,
                          longitude: userCoordinates?.longitude 
                        }
                      })
                    }
                    else if (cuisine.name === 'Amenities') {
                      router.push({
                        pathname: '/amenities',
                        params: { 
                          title: cuisine.name,
                          latitude: userCoordinates?.latitude,
                          longitude: userCoordinates?.longitude 
                        }
                      })
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.featureIconContainer}>
                    <Ionicons name={cuisine.icon} size={32} color="#6B4EFF" />
                  </View>
                  <ThemedText style={styles.featureTitle}>
                    {cuisine.name.split(' ')[0]}
                  </ThemedText>
                  {cuisine.name.split(' ').length > 1 && (
                    <ThemedText style={styles.featureSubtitle}>
                      {cuisine.name.split(' ').slice(1).join(' ')}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Offers */}
          {/* Temporarily hidden
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Special Offers</ThemedText>
              <TouchableOpacity 
                style={styles.sectionViewAllButton}
                onPress={() => router.push('/(modals)/special-offers')}
              >
                <ThemedText style={styles.sectionViewAllText}>View All</ThemedText>
                <Ionicons name="arrow-forward" size={16} color="#6B4EFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              ref={specialOffersScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialOffersContainer}
              onScroll={handleSpecialOffersScroll}
              scrollEventThrottle={16}
              pagingEnabled
              snapToInterval={width * 0.85 + 16}
              decelerationRate="fast"
            >
              {SPECIAL_OFFERS.map((offer) => (
                <TouchableOpacity 
                  key={offer.id} 
                  style={styles.specialOfferCard}
                  onPress={() => router.push('/(modals)/special-offers')}
                  activeOpacity={0.8}
                >
                  <SpecialOfferCard offer={offer} index={0} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.paginationContainer}>
              {SPECIAL_OFFERS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeSpecialOfferIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          </View>
          */}

          

          {/* Popular Restaurants */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.subtitle}>Popular Restaurants ({getFilteredRestaurants().length})</ThemedText>
              <TouchableOpacity 
                style={styles.sectionViewAllButton}
                onPress={() => router.push('./popular-restaurants')}
              >
                <ThemedText style={styles.sectionViewAllText}>See All</ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* Filter Pills */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.filterPills}
              contentContainerStyle={styles.filterPillsContent}
            >
              {/* Distance Filter - First */}
              <DistanceSelector
                selectedDistance={selectedDistance}
                onDistanceChange={setSelectedDistance}
                buttonStyle={styles.distanceFilterChip}
                textStyle={styles.distanceFilterText}
                iconColor="#6366F1"
                distanceOptions={DISTANCE_OPTIONS}
              />
              
              {FILTER_OPTIONS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterPill,
                    activeFilter === filter.id && styles.activeFilterPill
                  ]}
                  onPress={() => setActiveFilter(filter.id as FilterType)}
                >
                  <Ionicons 
                    name={filter.icon} 
                    size={16} 
                    color={activeFilter === filter.id ? '#fff' : '#666'} 
                  />
                  <ThemedText 
                    style={[
                      styles.filterPillText,
                      activeFilter === filter.id && styles.activeFilterPillText
                    ]}
                  >
                    {filter.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Restaurant Cards */}
            {isLoadingRestaurants || !userCoordinates ? (
              <View style={styles.loadingContainer}>
                <FunLoadingMessages size="large" color="#6B4EFF" />
                <ThemedText style={styles.loadingText}>
                  {!userCoordinates ? 'Getting your location...' : 'Loading restaurants...'}
                </ThemedText>
              </View>
            ) : restaurantError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF4B55" />
                <ThemedText style={styles.errorTitle}>Failed to load restaurants</ThemedText>
                <ThemedText style={styles.errorText}>{restaurantError}</ThemedText>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={fetchRestaurants}
                >
                  <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
                </TouchableOpacity>
              </View>
            ) : getFilteredRestaurants().length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={48} color="#999" />
                <ThemedText style={styles.emptyTitle}>
                  {showOffersMessage ? 'No offers available' : 'No restaurants found'}
                </ThemedText>
                <ThemedText style={styles.emptyText}>
                  {showOffersMessage 
                    ? 'Check back later for special offers and discounts' 
                    : 'Try adjusting your filters or check back later'
                  }
                </ThemedText>
              </View>
            ) : (
              getFilteredRestaurants().map((restaurant: Restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onPress={() => {
                    console.log('Navigating to restaurant profile:', restaurant.id, restaurant.name);
                    router.push({
                      pathname: '/(modals)/restaurant-profile/[id]',
                      params: { id: restaurant.id.toString() }
                    });
                  }}
                  onFavoritePress={() => {
                    // TODO: Implement favorite functionality
                    console.log('Toggle favorite for restaurant:', restaurant.id);
                  }}
                  isFavorite={false}
                  cardWidth={width - 32}
                  cardHeight={180}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* Add the Notifications Modal */}
        <Modal
          visible={showNotifications}
          transparent
          animationType="none"
          onRequestClose={() => setShowNotifications(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowNotifications(false)}
          >
            <Animated.View 
              style={[
                styles.notificationsContainer,
                {
                  transform: [{
                    translateY: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height, 0]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.notificationsHeader}>
                <ThemedText style={styles.notificationsTitle}>Notifications</ThemedText>
                <View style={styles.newBadge}>
                  <ThemedText style={styles.newBadgeText}>2 NEW</ThemedText>
                </View>
              </View>

              <ScrollView style={styles.notificationsList}>
                {Object.entries(NOTIFICATIONS).map(([date, notifications]) => (
                  <View key={date}>
                    <View style={styles.dateHeader}>
                      <ThemedText style={styles.dateText}>{date}</ThemedText>
                      <TouchableOpacity>
                        <ThemedText style={styles.markAllText}>Mark all as read</ThemedText>
                      </TouchableOpacity>
                    </View>

                    {notifications.map((notification: NotificationType) => (
                      <TouchableOpacity 
                        key={notification.id}
                        style={styles.notificationItem}
                      >
                        <View style={[styles.iconContainer, { backgroundColor: notification.iconBgColor }]}>
                          <Ionicons name={notification.icon} size={24} color={notification.iconColor} />
                        </View>
                        <View style={styles.notificationContent}>
                          <View style={styles.notificationHeader}>
                            <ThemedText style={styles.notificationTitle}>{notification.title}</ThemedText>
                            <ThemedText style={styles.timeText}>{notification.time}</ThemedText>
                          </View>
                          <ThemedText numberOfLines={2} style={styles.messageText}>
                            {notification.message}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => {
                  setShowNotifications(false);
                  router.push('./notifications');
                }}
              >
                <ThemedText style={styles.viewAllText}>View All Notifications</ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>



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
        </View>
      </TouchableWithoutFeedback>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      width: '100%',
      paddingHorizontal: 0,
      paddingBottom: 16,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
    },
    headerBackground: {
      width: '100%',
      height: '30%',
    },
    headerBackgroundOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(107, 78, 255, 0.3)', // Lighter overlay to show the food image
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 0,
      marginBottom: 12,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      fontSize: 16,
      color: '#fff',
      fontWeight: '600',
    },
    headerTextSection: {
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    headerTitle: {
      fontSize: 21,
      fontWeight: '600',
      color: '#fff',
      marginBottom: 4,
      fontFamily: 'Poppins-Medium',
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#fff',
      fontFamily: 'Poppins-Regular',
      textAlign: 'center',
      opacity: 0.9,
    },
    notificationButton: {
      position: 'relative',
      padding: 8,
    },
    notificationBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: '#6B4EFF',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
    },
    notificationCount: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    searchRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      paddingHorizontal: 16,
    },

    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
    },
    featureCard: {
      alignItems: 'center',
      width: 90,
    },
    featureIconContainer: {
      width: 80,
      height: 80,
      backgroundColor: '#f0f0ff',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#6B4EFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      textAlign: 'center',
      lineHeight: 20,
    },
    featureSubtitle: {
      fontSize: 16,
      fontWeight: '500',
      color: '#374151',
      textAlign: 'center',
      lineHeight: 20,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: height * 0.1,
      paddingHorizontal: 8,
    },
    section: {
      marginVertical: 8,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#000',
    },
    sectionViewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    sectionViewAllText: {
      fontSize: 14,
      color: '#6B4EFF',
      fontWeight: '500',
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#000',
    },
    seeAll: {
      fontSize: 14,
      color: '#6B4EFF',
      fontWeight: '500',
    },
    offersScrollContent: {
      paddingHorizontal: width * 0.04,
      gap: 16,
    },
    cardsContainer: {
      height: 250,
      overflow: 'visible',
    },
    offerCard: {
      width: cardWidth,
      height: 160,
      marginRight: 16,
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    offerCardGradient: {
      flex: 1,
    },
    offerCardContent: {
      flex: 1,
      flexDirection: 'row',
      padding: 16,
      position: 'relative',
    },
    offerTextContent: {
      flex: 1,
      justifyContent: 'space-between',
      zIndex: 2,
      width: '60%',
    },
    offerImagesContainer: {
      position: 'absolute',
      right: -20,
      bottom: -20,
      width: width * 0.35,
      height: width * 0.35,
      zIndex: 1,
    },
    offerFoodImage: {
      width: '100%',
      height: '100%',
      borderRadius: width * 0.225,
      transform: [{ rotate: '10deg' }],
    },
    offerDecorativeImage: {
      position: 'absolute',
      width: '60%',
      height: '60%',
      right: 0,
      bottom: 0,
      borderRadius: width * 0.135,
      transform: [{ rotate: '-15deg' }],
    },
    offerTitle: {
      fontSize: Math.min(24, width * 0.055),
      fontWeight: '700',
      marginBottom: height * 0.01,
      maxWidth: '90%',
    },
    offerSubtitle: {
      fontSize: Math.min(14, width * 0.035),
      marginBottom: height * 0.015,
      maxWidth: '85%',
      opacity: 0.9,
    },
    discountSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    discountContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    discountWrapper: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    discountText: {
      fontSize: 28,
      fontWeight: '700',
      paddingTop: 10
    },
    percentText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 2,
    },
    bookButton: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: width * 0.04,
      paddingVertical: height * 0.01,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      opacity: 0.9
    },
    bookButtonText: {
      color: '#000',
      fontSize: Math.min(14, width * 0.035),
      fontWeight: '600',
    },
    paginationDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: width * 0.02,
      marginTop: height * 0.02,
    },
    dot: {
      height: 8,
      borderRadius: 4,
      marginHorizontal: 2,
    },
    cuisineItem: {
      alignItems: 'center',
    marginRight: 16,
    width: 100,
    backgroundColor: '#FFFFFF',
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
  cuisineIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    },
    cuisineName: {
    fontSize: 12,
      textAlign: 'center',
    color: 'black',
      fontFamily: 'PoppinsMedium',
    lineHeight: 16,
    },
    filterPills: {
      marginBottom: 16,
    },
    filterPillsContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#F5F5F5',
      borderRadius: 20,
      gap: 6,
    },
    activeFilterPill: {
      backgroundColor: '#6B4EFF',
    },
    filterPillText: {
      fontSize: 14,
      color: '#666',
      fontWeight: '500',
    },
    activeFilterPillText: {
      color: '#fff',
    },
    restaurantCard: {
      flexDirection: 'row',
      backgroundColor: '#fff',
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    restaurantImage: {
      width: 100,
      minHeight: 100, // Minimum height for consistency
      borderRadius: 16,
      margin: 12,
      alignSelf: 'stretch', // Stretch to match content height
    },
    restaurantContent: {
      flex: 1,
      padding: 12,
      paddingRight: 48, // Extra padding to ensure space for heart icon (24 + 24 margin)
      // Removed justifyContent: 'space-between' to allow flexible height
    },
    restaurantHeader: {
      marginBottom: 8, // Flexible spacing
      // Removed minHeight to allow flexible height based on content
      width: '100%', // Explicit width
    },
    restaurantName: {
      fontSize: 16,
      fontFamily: 'Poppins-Medium',
      color: '#000000',
      lineHeight: 22, // Override ThemedText default lineHeight
      flexShrink: 1, // Allow shrinking to fit container
      textAlign: 'left', // Ensure left alignment
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginRight: 8, // Add space between rating and reviews
    },
    ratingText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
    },
    leftFooterContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    restaurantFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    reviewsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reviewsText: {
      fontSize: 12,
      color: '#666',
    },
    noReviewsText: {
      fontSize: 12,
      color: '#999',
      fontStyle: 'italic',
    },
    distanceText: {
      fontSize: 12,
      color: '#666',
    },
    favoriteButton: {
      padding: 12,
      position: 'absolute',
      right: -5,
      top: 22,
      
    },
    upToTextStyle: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 4,
    },
    offText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 2,
    },
    specialOffersContainer: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 12,
    },
    specialOfferCard: {
      width: width * 0.85,
      marginRight: 16,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      gap: 8,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#E0E0E0',
    },
    paginationDotActive: {
      width: 24,
      backgroundColor: '#6B4EFF',
    },
    subheading: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    cuisinesRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      paddingHorizontal: 8,
      marginTop: 12,
    },
    restaurantCuisine: {
      fontSize: 14,
      color: '#666',
      marginBottom: 6, // Slightly increased for better spacing in flexible cards
    },
    searchSection: {
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: '#fff',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    notificationsContainer: {
      backgroundColor: '#fff',
      height: height * 0.7,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 16,
    },
    notificationsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    notificationsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
    },
    newBadge: {
      backgroundColor: '#6B4EFF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    newBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    notificationsList: {
      flex: 1,
    },
    dateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dateText: {
      fontSize: 13,
      color: '#666',
      fontWeight: '500',
    },
    markAllText: {
      fontSize: 13,
      color: '#6B4EFF',
      fontWeight: '500',
    },
    notificationItem: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      flex: 1,
    },
    timeText: {
      fontSize: 12,
      color: '#666',
      marginLeft: 8,
    },
    messageText: {
      fontSize: 13,
      color: '#666',
      lineHeight: 18,
    },
    viewAllButton: {
      backgroundColor: '#6B4EFF',
      margin: 16,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    viewAllText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    // Loading, Error, and Empty States
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 16,
    },
    loadingText: {
      fontSize: 16,
      color: '#666',
      marginTop: 12,
      textAlign: 'center',
    },
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 16,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FF4B55',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
    retryButton: {
      backgroundColor: '#6B4EFF',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      lineHeight: 20,
    },
    offerBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: '#FF4B55',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      zIndex: 1,
    },
    offerBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '600',
    },
    // Distance Filter Styles
    distanceFilterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EEF2FF',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    distanceFilterText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6366F1',
    },
    // Distance Modal Styles
    distanceModal: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 24,
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
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
    },
    distanceOptions: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    distanceOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    selectedDistanceOption: {
      backgroundColor: '#F8FAFC',
    },
    distanceOptionText: {
      fontSize: 16,
      color: '#333',
    },
    selectedDistanceOptionText: {
      color: '#6366F1',
      fontWeight: '600',
    },
    manualDistanceOption: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    manualDistanceContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    manualDistanceLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    manualDistanceInput: {
      height: 50,
      borderColor: '#E0E0E0',
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      fontSize: 16,
      color: '#333',
      marginBottom: 16,
    },
    manualDistanceButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 10,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#F5F5F5',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: '#666',
      fontSize: 16,
      fontWeight: '600',
    },
    applyButton: {
      flex: 1,
      backgroundColor: '#6B4EFF',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    applyButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    cuisineIconContainerFlat: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    cuisineNameFlat: {
      fontSize: 15,
      fontWeight: '700',
      color: '#6B4EFF',
      textAlign: 'center',
      marginTop: 2,
    },
    favoriteIconOverImage: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 10,
      backgroundColor: 'rgba(255,255,255,0.85)',
      borderRadius: 16,
      padding: 4,
    },
    animatedSearchBox: {
      flex: 1,
      marginHorizontal: 0,
      borderRadius: 12,
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    animatedSearchText: {
      fontSize: 16,
      color: '#666',
      fontFamily: 'Poppins-Regular',
    },
  });
