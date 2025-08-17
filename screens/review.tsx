import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { DistanceSelector } from '@/components/DistanceSelector';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useLocation } from '@/contexts/location';
import { RestaurantCard } from '@/components/RestaurantCard';

import { 
  getNearbyRestaurants, 
  searchRestaurantsByLocation,
  getUserReviews,
  getMediaUrl,
  type ApiRestaurant 
} from '@/utils/api';
import { transformApiRestaurant, type Restaurant } from '@/utils/restaurantTransforms';

const { width } = Dimensions.get('window');

type TabType = 'post' | 'my-reviews';

interface UserReview {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  restaurant: {
    id: number;
    name: string;
    logo?: string;
    street_address?: string;
    city?: string;
  };
  overall_rating: number;
  comment: string;
  created_at: string;
  photos?: Array<{ image: string }>;
}

export default function ReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userLocation, isLocationReady } = useLocation();
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('post');
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistance, setSelectedDistance] = useState(1); // Default to 1km like home screen
  const [searchMode, setSearchMode] = useState<'near_me' | 'all'>('near_me');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);

  // Authentication check
  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to access reviews.',
        [
          { text: 'Cancel', onPress: () => router.back() },
          { text: 'Login', onPress: () => router.replace('/(auth)/login') }
        ]
      );
      return;
    }
  }, [user]);

  // Load restaurants when location is ready
  useEffect(() => {
    if (isLocationReady && userLocation && activeTab === 'post') {
      loadNearbyRestaurants();
    }
  }, [isLocationReady, userLocation, activeTab, selectedDistance, searchMode]);

  // Load user reviews when switching to My Reviews tab
  useEffect(() => {
    if (activeTab === 'my-reviews') {
      loadUserReviews();
    }
  }, [activeTab]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter restaurants based on search query and distance
  useEffect(() => {
    let filtered = restaurants;
    
    console.log(`🔍 Filtering restaurants: ${restaurants.length} total, search: "${searchQuery}", mode: ${searchMode}, distance: ${selectedDistance}km`);
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log(`📝 After search filter: ${filtered.length} restaurants`);
    }
    
    // Apply distance filter for "near_me" mode
    if (searchMode === 'near_me' && userLocation) {
      filtered = filtered.filter(restaurant => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          restaurant.latitude,
          restaurant.longitude
        );
        return distance <= selectedDistance;
      });
      console.log(`📍 After distance filter: ${filtered.length} restaurants within ${selectedDistance}km`);
    }
    
    setFilteredRestaurants(filtered);
  }, [searchQuery, restaurants, searchMode, selectedDistance, userLocation]);

  const loadNearbyRestaurants = async () => {
    if (!userLocation) return;
    
    try {
      setLoading(true);
      console.log('🏪 Loading restaurants for review...');
      
      let response;
      if (searchMode === 'near_me') {
        console.log(`📏 Loading ALL restaurants within ${selectedDistance}km`);
        response = await getNearbyRestaurants(
          userLocation.latitude,
          userLocation.longitude,
          selectedDistance
        );
      } else {
        console.log('🌍 Loading all restaurants');
        response = await searchRestaurantsByLocation(
          userLocation.latitude,
          userLocation.longitude,
          50 // Large radius for "all" mode
        );
      }
      
      const transformedRestaurants = response.results.map((apiRestaurant: ApiRestaurant) => 
        transformApiRestaurant(apiRestaurant, userLocation.latitude, userLocation.longitude)
      );
      
      setRestaurants(transformedRestaurants);
      setFilteredRestaurants(transformedRestaurants);
      console.log(`✅ Loaded ${transformedRestaurants.length} restaurants`);
    } catch (error) {
      console.error('❌ Error loading restaurants:', error);
      Alert.alert('Error', 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const loadUserReviews = async () => {
    try {
      setLoading(true);
      console.log('👤 Loading user reviews...');
      
      const reviews = await getUserReviews();
      console.log('📋 Raw API response for user reviews:', reviews);
      if (reviews.length > 0) {
        console.log('🔍 Sample review structure:', {
          id: reviews[0].id,
          user: reviews[0].user,
          restaurant: reviews[0].restaurant,
          has_user_field: !!reviews[0].user,
          user_id: reviews[0].user?.id,
          current_user_id: user?.id
        });
      }
      setUserReviews(reviews);
      console.log(`✅ Loaded ${reviews.length} user reviews`);
    } catch (error) {
      console.error('❌ Error loading user reviews:', error);
      Alert.alert('Error', 'Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    router.push({
      pathname: '/restaurant-profile',
      params: { 
        id: restaurant.id.toString(),
        name: restaurant.name,
        image: restaurant.image.uri,
        cuisine: restaurant.cuisine,
        address: restaurant.street_address || restaurant.city || 'Address not available',
        timing: '15 min'
      }
    });
  };

  const handleWriteReview = (restaurant: Restaurant) => {
    router.push({
      pathname: '/write-review',
      params: {
        restaurantId: restaurant.id.toString(),
        restaurantName: restaurant.name,
        restaurantImage: restaurant.image.uri,
        restaurantCuisine: restaurant.cuisine,
        restaurantAddress: restaurant.street_address || restaurant.city || 'Address not available',
        restaurantTiming: '15 min'
      }
    });
  };

  const handleEditReview = (review: UserReview) => {
    router.push({
      pathname: '/write-review',
      params: {
        editMode: 'true',
        reviewId: review.id.toString(),
        restaurantId: review.restaurant.id.toString(),
        restaurantName: review.restaurant.name,
        restaurantImage: review.restaurant.logo ? getMediaUrl(review.restaurant.logo) : 'default',
        restaurantCuisine: 'Cuisine',
        restaurantAddress: review.restaurant.street_address || review.restaurant.city || 'Address not available',
        restaurantTiming: '15 min',
        existingData: JSON.stringify({
          overall_rating: review.overall_rating,
          comment: review.comment,
          category_ratings: review.category_ratings || [],
          photos: review.photos
        })
      }
    });
  };

  const renderTabButton = (tab: TabType, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? '#6B4EFF' : '#666'} 
      />
      <ThemedText style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderPostReviewTab = () => (
    <View style={styles.tabContent}>
      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants by name or cuisine..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <DistanceSelector
          selectedDistance={selectedDistance}
          onDistanceChange={setSelectedDistance}
          buttonStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: 'white',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#e5e7eb',
            marginVertical: 8
          }}
          textStyle={{ marginLeft: 8, marginRight: 8, fontSize: 14, fontWeight: '500' }}
          iconColor="#6366F1"
          distanceOptions={[0.25, 0.5, 1, 2, 5, 10, 15, 20, 25, 50]}
        />
      </View>

      {/* Location Status */}
      {!isLocationReady && (
        <View style={styles.locationStatus}>
          <ActivityIndicator size="small" color="#6B4EFF" />
          <ThemedText style={styles.locationStatusText}>Getting your location...</ThemedText>
        </View>
      )}

      {/* Restaurants List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
          <ThemedText style={styles.loadingText}>Loading restaurants...</ThemedText>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.restaurantsList}
        >
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((restaurant) => (
              <View key={restaurant.id} style={styles.restaurantItem}>
                <RestaurantCard
                  restaurant={restaurant}
                  onPress={() => handleRestaurantPress(restaurant)}
                  cardWidth={width - 32}
                  cardHeight={160}
                />
                <View style={styles.restaurantActions}>
                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => handleRestaurantPress(restaurant)}
                  >
                    <Ionicons name="eye-outline" size={16} color="#6B4EFF" />
                    <ThemedText style={styles.viewProfileButtonText}>View Profile</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.writeReviewButton}
                    onPress={() => handleWriteReview(restaurant)}
                  >
                    <Ionicons name="create-outline" size={16} color="#fff" />
                    <ThemedText style={styles.writeReviewButtonText}>Write Review</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>
                {searchQuery 
                  ? 'No restaurants found matching your search' 
                  : searchMode === 'near_me'
                    ? `No restaurants found within ${selectedDistance}km`
                    : 'No restaurants found in your area'
                }
              </ThemedText>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  const renderMyReviewsTab = () => (
    <View style={styles.tabContent}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
          <ThemedText style={styles.loadingText}>Loading your reviews...</ThemedText>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.reviewsList}
        >
          {userReviews.length > 0 ? (
            userReviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.restaurantInfo}>
                    <ThemedText style={styles.restaurantName}>{review.restaurant.name}</ThemedText>
                    <ThemedText style={styles.restaurantAddress}>
                      {review.restaurant.street_address || review.restaurant.city || 'Address not available'}
                    </ThemedText>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <ThemedText style={styles.ratingText}>{review.overall_rating.toFixed(1)}</ThemedText>
                  </View>
                </View>
                
                <ThemedText style={styles.reviewComment} numberOfLines={3}>
                  {review.comment}
                </ThemedText>
                
                <View style={styles.reviewFooter}>
                  <ThemedText style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </ThemedText>
                  {user && review.user.id === user.id && (
                    <TouchableOpacity
                      style={styles.editReviewButton}
                      onPress={() => handleEditReview(review)}
                    >
                      <Ionicons name="create-outline" size={14} color="#6B4EFF" />
                      <ThemedText style={styles.editReviewButtonText}>Edit</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
              <ThemedText style={styles.emptyStateText}>You haven't written any reviews yet</ThemedText>
              <TouchableOpacity
                style={styles.startReviewingButton}
                onPress={() => setActiveTab('post')}
              >
                <ThemedText style={styles.startReviewingButtonText}>Start Reviewing</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Reviews</ThemedText>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {renderTabButton('post', 'Post a Review', 'create-outline')}
        {renderTabButton('my-reviews', 'My Reviews', 'chatbubble-outline')}
      </View>

      {/* Tab Content */}
      {activeTab === 'post' ? renderPostReviewTab() : renderMyReviewsTab()}


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#6B4EFF',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#6B4EFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 4,
  },

  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  locationStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  restaurantsList: {
    padding: 16,
  },
  restaurantItem: {
    marginBottom: 16,
  },
  restaurantActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  viewProfileButtonText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B4EFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  writeReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  reviewsList: {
    padding: 16,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restaurantInfo: {
    flex: 1,
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  restaurantAddress: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  editReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editReviewButtonText: {
    fontSize: 12,
    color: '#6B4EFF',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  startReviewingButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  startReviewingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

}); 