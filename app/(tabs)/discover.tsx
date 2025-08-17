import { View, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { getRestaurants, getNearbyRestaurants, getMediaUrl, getRestaurantCoordinates, type ApiRestaurant } from '@/utils/api';
import { useLocation } from '@/contexts/location';

const { width } = Dimensions.get('window');

// Fallback data removed as per backend team request - all endpoints now fully operational

export default function DiscoverScreen() {
  const router = useRouter();
  const { userLocation } = useLocation();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const filters = ['All', 'Near Me', 'Popular', 'Top Rated', 'New'];

  const fetchRestaurants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      
      // Use the same logic as home screen - try nearby restaurants if location available
      if (userLocation) {
        console.log('Using nearby restaurants API for discover screen');
        try {
          response = await getNearbyRestaurants(userLocation.latitude, userLocation.longitude, 50);
        } catch (nearbyError) {
          console.log('Nearby restaurants failed, falling back to general restaurants');
          response = await getRestaurants({ approved: true });
        }
      } else {
        // Use general restaurants API if no location
        response = await getRestaurants({ approved: true });
      }
      
      console.log('Discover - Total restaurants from API:', response.results?.length || 0);
      
      if (response.results && response.results.length > 0) {
        // Filter out restaurants without valid coordinates
        const restaurantsWithValidCoordinates = response.results.filter((restaurant: ApiRestaurant) => {
          const coordinates = getRestaurantCoordinates(restaurant);
          const hasValidCoordinates = coordinates !== null;
          if (!hasValidCoordinates) {
            console.log(`Discover - Filtering out restaurant "${restaurant.name}" - no valid coordinates`);
          }
          return hasValidCoordinates;
        });

        console.log('Discover - Restaurants with valid coordinates:', restaurantsWithValidCoordinates.length);
        console.log('Discover - Filtered out restaurants:', response.results.length - restaurantsWithValidCoordinates.length);

        if (restaurantsWithValidCoordinates.length === 0) {
          console.log('Discover - No restaurants with valid coordinates from API');
          if (userLocation) {
            // If user has location, show empty state
            setRestaurants([]);
            setError('No restaurants found with valid locations in your area');
          } else {
            // Show empty state as per backend team request
            console.log('Discover - No fallback data - showing empty state');
            setRestaurants([]);
            setError('No restaurants found - please check your connection');
          }
          return;
        }

        // Transform API data to match our UI format
        const transformedRestaurants = restaurantsWithValidCoordinates.map((restaurant: ApiRestaurant) => {
          const coordinates = getRestaurantCoordinates(restaurant);
          
          return {
            id: restaurant.id,
            name: restaurant.name,
            image: restaurant.images && restaurant.images.length > 0 
              ? getMediaUrl(restaurant.images[0].image)
              : restaurant.logo 
              ? getMediaUrl(restaurant.logo)
              : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80',
            rating: 4.5 + Math.random() * 0.5, // Generate random rating
            timeEstimate: `${Math.floor(Math.random() * 30) + 10} min`,
            priceRange: ['$', '$$', '$$$', '$$$$'][Math.floor(Math.random() * 4)],
            cuisine: restaurant.cuisine_styles.length > 0 
              ? (typeof restaurant.cuisine_styles[0] === 'string' 
                  ? restaurant.cuisine_styles[0] 
                  : restaurant.cuisine_styles[0].name)
              : 'Restaurant',
            address: restaurant.street_address || 'Address not available',
            reviews: Math.floor(Math.random() * 500) + 50,
            discount: Math.random() > 0.6 ? `${Math.floor(Math.random() * 30) + 10}% OFF` : undefined,
            coordinates: coordinates,
          };
        });
        
        setRestaurants(transformedRestaurants);
      } else {
        // Show empty state as per backend team request
        console.log('Discover - No restaurants from API, showing empty state');
        setRestaurants([]);
        setError('No restaurants found');
      }
    } catch (err) {
      console.error('Discover - Error fetching restaurants:', err);
      setError('Failed to load restaurants');
      // Show empty state as per backend team request
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const getFilteredRestaurants = () => {
    switch (selectedFilter) {
      case 'Near Me':
        return restaurants.filter(r => r.rating > 4.5);
      case 'Popular':
        return restaurants.filter(r => r.reviews > 200);
      case 'Top Rated':
        return restaurants.filter(r => r.rating > 4.7);
      case 'New':
        return restaurants.slice(0, 3);
      default:
        return restaurants;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B4EFF" />
        <ThemedText style={styles.loadingText}>Discovering restaurants...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Discover</ThemedText>
        <ThemedText style={styles.subtitle}>Find amazing places to eat</ThemedText>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterPill,
              selectedFilter === filter && styles.activeFilterPill,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <ThemedText style={[
              styles.filterPillText,
              selectedFilter === filter && styles.activeFilterPillText
            ]}>
              {filter}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Restaurant Grid */}
      <ScrollView 
        style={styles.restaurantsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.restaurantsContent}
      >
        {error && (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity style={styles.retryButton} onPress={fetchRestaurants}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </TouchableOpacity>
          </View>
        )}
        
        {getFilteredRestaurants().map((restaurant) => (
          <TouchableOpacity
            key={restaurant.id}
            style={styles.restaurantCard}
            onPress={() => router.push({
              pathname: '/(modals)/restaurant-profile/[id]',
              params: { id: restaurant.id.toString() }
            })}
          >
            <Image 
              source={{ uri: restaurant.image }}
              style={styles.restaurantImage}
            />
            {restaurant.discount && (
              <View style={styles.discountBadge}>
                <ThemedText style={styles.discountText}>
                  {restaurant.discount}
                </ThemedText>
              </View>
            )}
            <View style={styles.cardContent}>
              <ThemedText style={styles.restaurantName}>
                {restaurant.name}
              </ThemedText>
              <View style={styles.infoContainer}>
                <ThemedText style={styles.infoText}>
                  {restaurant.rating} ★
                </ThemedText>
                <View style={styles.timeContainer}>
                  <ThemedText style={styles.infoText}>
                    {restaurant.timeEstimate}
                  </ThemedText>
                </View>
                <ThemedText style={styles.infoText}>
                  {restaurant.priceRange}
                </ThemedText>
              </View>
              <ThemedText style={styles.cuisineText}>
                {restaurant.cuisine}
              </ThemedText>
              <ThemedText style={styles.addressText}>
                {restaurant.address}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  restaurantsContainer: {
    flex: 1,
  },
  restaurantsContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4B55',
    textAlign: 'center',
    marginBottom: 16,
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
  restaurantCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cuisineText: {
    fontSize: 14,
    color: '#6B4EFF',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
}); 