import { StyleSheet, View, TextInput, Image, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Platform, Easing, Modal, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';

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
    bgColor: 'rgba(0,0,0,0.5)'
  },
  { 
    id: '2', 
    name: 'International Cuisines', 
    icon: 'globe-outline' as const,
    bgColor: 'rgba(0,0,0,0.5)'
  },
  { 
    id: '3', 
    name: 'Casual Dining', 
    icon: 'restaurant-outline' as const,
    bgColor: 'rgba(0,0,0,0.5)'
  },
  { 
    id: '4', 
    name: 'Fine Dining', 
    icon: 'wine-outline' as const,
    bgColor: 'rgba(0,0,0,0.5)'
  },
  { 
    id: '5', 
    name: 'Fast Foods', 
    icon: 'fast-food-outline' as const,
    bgColor: 'rgba(0,0,0,0.5)'
  },
  { 
    id: '6', 
    name: "Today's Special", 
    icon: 'star-outline' as const,
    bgColor: 'rgba(0,0,0,0.5)'
  },
  { 
    id: '7', 
    name: 'Cakes & Coffee', 
    icon: 'cafe-outline' as const,
    bgColor: 'rgba(0,0,0,0.5)'
  },
  { 
    id: '8', 
    name: 'Child Friendly', 
    icon: 'happy-outline' as const,
    bgColor: 'rgba(0,0,0,0.5)'
  },
];

// Update the restaurant type definition
type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviews: number;
  image: { uri: string };
  distance: string;
  hasOffer: boolean;  // Add this property
};

// Update the RESTAURANTS constant with hasOffer property
const RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'The Italian Place',
    cuisine: 'Italian • Pizza',
    rating: 4.8,
    reviews: 1234,
    image: { uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80' },
    distance: '1.2 km away',
    hasOffer: true,  // Add this field
  },
  {
    id: '2',
    name: 'Sushi Master',
    cuisine: 'Japanese • Sushi',
    rating: 4.6,
    reviews: 890,
    image: { uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80' },
    distance: '0.8 km away',
    hasOffer: false,  // Add this field
  },
  {
    id: '3',
    name: 'Taco Fiesta',
    cuisine: 'Mexican • Tacos',
    rating: 4.5,
    reviews: 756,
    image: { uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80' },
    distance: '2.0 km away',
    hasOffer: true,  // Add this field
  },
  {
    id: '4',
    name: 'Curry House',
    cuisine: 'Indian • Curry',
    rating: 4.7,
    reviews: 1100,
    image: { uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80' },
    distance: '1.5 km away',
    hasOffer: false,  // Add this field
  },
  {
    id: '5',
    name: 'Golden Dragon',
    cuisine: 'Chinese • Dim Sum',
    rating: 4.4,
    reviews: 925,
    image: { uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80' },
    distance: '1.8 km away',
    hasOffer: true,  // Add this field
  },
];

// Add these filter types and data at the top with other constants
type FilterType = 'nearest' | 'offers' | 'rating';

const FILTER_OPTIONS = [
  { id: 'nearest', label: 'Nearest', icon: 'location-outline' as const },
  { id: 'offers', label: 'Great Offers', icon: 'pricetag-outline' as const },
  { id: 'rating', label: 'Rating 4.5+', icon: 'star-outline' as const },
] as const;

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
            <Image source={offer.foodImage} style={styles.offerFoodImage} />
            <Image source={offer.image} style={styles.offerDecorativeImage} />
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

export default function IndexScreen() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [fontsLoaded] = useFonts({
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
  });
  const router = useRouter();
  const [activeSpecialOfferIndex, setActiveSpecialOfferIndex] = useState(0);
  const specialOffersScrollRef = useRef<ScrollView>(null);
  const [activeCuisineIndex, setActiveCuisineIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>('nearest');
  const [location, setLocation] = useState<LocationState>({
    address: 'Loading location...',
    isLoading: true,
    error: null
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;

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
  }, [showNotifications]);

  if (!isClient || !fontsLoaded) {
    return <ActivityIndicator />;
  }

  const handleSpecialOffersScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (width * 0.85 + 16));
    setActiveSpecialOfferIndex(index);
  };

  const getFilteredRestaurants = () => {
    switch (activeFilter) {
      case 'nearest':
        return RESTAURANTS.sort((a, b) => {
          const distA = parseFloat(a.distance.split(' ')[0]);
          const distB = parseFloat(b.distance.split(' ')[0]);
          return distA - distB;
        });
      case 'offers':
        return RESTAURANTS.filter(r => r.hasOffer);
      case 'rating':
        return RESTAURANTS.filter(r => r.rating >= 4.5);
      default:
        return RESTAURANTS;
    }
  };

  const handleNotificationPress = () => {
    setShowNotifications(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6B4EFF', '#9747FF']}
        style={styles.header}
      >
        <View style={styles.headerBackground}>
          <SafeAreaView edges={['top']}>
            {/* Location and Notification Row */}
            <View style={styles.headerTop}>
              <View>
                <ThemedText style={styles.locationLabel}>Location</ThemedText>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={20} color="#FF4B55" />
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

            {/* Search Bar Row */}
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="#666" />
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="#999"
                />
              </View>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => router.push('/filter-options')}
              >
                <Ionicons name="options-outline" size={20} color="#6B4EFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        bounces={false}
      >

      {/* Filters */}
      <View style={styles.searchSection}>
          <View style={styles.searchHeader}>
            <ThemedText style={styles.searchTitle}>
              Search for your favourite meal
            </ThemedText>
            <ThemedText style={styles.searchSubtitle}>
              View Your Meal Before You Order It
            </ThemedText>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.cuisinesContainer}
            contentContainerStyle={styles.cuisinesContent}
            onScroll={(event) => {
              const x = event.nativeEvent.contentOffset.x;
              const index = Math.round(x / (80 + 24)); // width + marginRight
              setActiveCuisineIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {Filters.map((cuisine) => (
              <TouchableOpacity 
                key={cuisine.id}
                style={styles.cuisineItem}
                onPress={() => {
                  if (cuisine.name === 'Near Me') {
                    router.push({
                      pathname: '/filter-restaurants',
                      params: { title: cuisine.name }
                    })
                  }
                  else if (cuisine.name=== 'International Cuisines') {
                    router.push({
                      pathname: '/international-cuisines',
                      params: { title: cuisine.name }
                    })
                  }
                  else if (cuisine.name=== 'Casual Dining') {
                    router.push({
                      pathname: '/filter-restaurants',
                      params: { title: cuisine.name }
                    })
                  }
                  else if (cuisine.name=== 'Fine Dining') {
                    router.push({
                      pathname: '/filter-restaurants',
                      params: { title: cuisine.name }
                    })
                  }
                  else if (cuisine.name=== 'Fast Foods') {
                    router.push({
                      pathname: '/filter-restaurants',
                      params: { title: cuisine.name }
                    })
                  }
                  else if (cuisine.name=== 'Child Friendly') {
                    router.push({
                      pathname: '/filter-restaurants',
                      params: { title: cuisine.name }
                    })
                  }
                  else if (cuisine.name=== "Today's Special") {
                    router.push({
                      pathname: '/filter-restaurants',
                      params: { title: cuisine.name }
                    })
                  }
                  else if (cuisine.name=== 'Cakes & Coffee') {
                    router.push({
                      pathname: '/filter-restaurants',
                      params: { title: cuisine.name }
                    })
                  }
                  else if (cuisine.name=== 'Child Friendly') {
                    router.push({
                      pathname: '/filter-restaurants',
                      params: { title: cuisine.name }
                    })
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.cuisineIconContainer, { backgroundColor: '#6B4EFF' }]}>
                  <Ionicons name={cuisine.icon} size={24} color="#FFF" />
                </View>
                <ThemedText style={styles.cuisineName}>{cuisine.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {Filters.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  activeCuisineIndex === index && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* Special Offers */}
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

          {/* Pagination Dots */}
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

        

        {/* Popular Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.subtitle}>Popular Restaurants</ThemedText>
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
          {getFilteredRestaurants().map((restaurant) => (
            <TouchableOpacity 
              key={restaurant.id}
              style={styles.restaurantCard}
              onPress={() => router.push({
                pathname: './restaurant-profile',
                params: { restaurantId: restaurant.id }
              })}
            >
              <Image source={restaurant.image} style={styles.restaurantImage} />
              <View style={styles.restaurantContent}>
                <View style={styles.restaurantHeader}>
                  <ThemedText style={styles.restaurantName}>{restaurant.name}</ThemedText>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <ThemedText style={styles.ratingText}>{restaurant.rating}</ThemedText>
                    
                  </View>
                  
                </View>
                <TouchableOpacity style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={24} color="#666" />
              </TouchableOpacity>
                <ThemedText style={styles.restaurantCuisine}>{restaurant.cuisine}</ThemedText>
                <View style={styles.restaurantFooter}>
                  <View style={styles.reviewsContainer}>
                    <ThemedText style={styles.reviewsText}>{restaurant.reviews} Reviews</ThemedText>
                  </View>
                  <ThemedText style={styles.distanceText}>{restaurant.distance}</ThemedText>
                </View>
              </View>
              
            </TouchableOpacity>
          ))}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  headerBackground: {
    width: '100%',
    height: '18%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
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
  },
  searchBar: {
    flex: 1,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 24,
    width: 80,
  },
  cuisineIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#6B4EFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cuisineName: {
    fontSize: 13,
    textAlign: 'center',
    color: '#333',
    fontFamily: 'PoppinsMedium',
    marginTop: 4,
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
    height: 100,
    borderRadius: 16,
    margin: 12,
  },
  restaurantContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#000000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
  cuisinesContainer: {
    marginTop: 12,
  },
  cuisinesContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  searchSection: {
    paddingTop: Platform.OS === 'ios' ? 24 : 32,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  searchHeader: {
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  searchSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
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
});
