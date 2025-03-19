import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

// Sample restaurant data
const RESTAURANTS = [
  {
    id: '1',
    name: 'Zestful Zenith Diner',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80',
    rating: 5.0,
    timeEstimate: '20 min',
    priceRange: '$$$',
    cuisine: 'Mexican',
    address: '3517 W. Gray St. Utica',
    reviews: 6,
    discount: '15% OFF',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.0060,
    },
  },
  {
    id: '2',
    name: 'Rustic Plate',
    image: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=500&h=300&q=80',
    rating: 4.8,
    timeEstimate: '25 min',
    priceRange: '$$',
    cuisine: 'Italian',
    address: '2972 Westheimer Rd.',
    reviews: 12,
    discount: '10% OFF',
    coordinates: {
      latitude: 40.7138,
      longitude: -74.0065,
    },
  },
  {
    id: '3',
    name: 'Azure Kitchen',
    image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=500&h=300&q=80',
    rating: 4.9,
    timeEstimate: '15 min',
    priceRange: '$$$$',
    cuisine: 'French',
    address: '3890 Poplar Dr.',
    reviews: 28,
    coordinates: {
      latitude: 40.7118,
      longitude: -74.0055,
    },
  },
  {
    id: '4',
    name: 'Spice Garden',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=300&q=80',
    rating: 4.7,
    timeEstimate: '30 min',
    priceRange: '$$',
    cuisine: 'Indian',
    address: '4140 Parker Rd.',
    reviews: 18,
    discount: '20% OFF',
    coordinates: {
      latitude: 40.7148,
      longitude: -74.0070,
    },
  },
  {
    id: '5',
    name: 'Golden Dragon',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&h=300&q=80',
    rating: 4.6,
    timeEstimate: '25 min',
    priceRange: '$$$',
    cuisine: 'Chinese',
    address: '2464 Royal Ln.',
    reviews: 32,
    coordinates: {
      latitude: 40.7108,
      longitude: -74.0050,
    },
  }
];

export default function FilterRestaurantsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const screenTitle = params.title as string || 'Near Me';
  const [selectedFilter, setSelectedFilter] = useState('Location');
  const filters = [
    { name: 'Location', icon: 'location' as const },
    { name: 'Most Likes', icon: 'heart' as const },
    { name: 'Menus', icon: 'restaurant' as const }
  ];

  // Fixed Google Maps API key access
  const googleMapsApiKey = Constants.expoConfig?.extra?.googleMapsApiKey || "";

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=40.7128,-74.0060&zoom=14`}
        />
      );
    }

    return (
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 40.7128,
          longitude: -74.0060,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {RESTAURANTS.map((restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={restaurant.coordinates}
            title={restaurant.name}
          />
        ))}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <View style={styles.backButtonInner}>
            <Ionicons name="chevron-back" size={24} color="#6B4EFF" />
          </View>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{screenTitle}</ThemedText>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {renderMap()}
      </View>

      {/* Overlay Content */}
      <View style={styles.overlayContent}>
        {/* Search and Filter Header */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6B4EFF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for restaurants..."
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#6B4EFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContentContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.name}
              style={[
                styles.filterPill,
                selectedFilter === filter.name && styles.activeFilterPill,
              ]}
              onPress={() => setSelectedFilter(filter.name)}
            >
              <Ionicons
                name={filter.icon}
                size={16}
                color={selectedFilter === filter.name ? '#FFFFFF' : '#666'}
                style={styles.filterIcon}
              />
              <ThemedText
                style={[
                  styles.filterPillText,
                  selectedFilter === filter.name && styles.activeFilterPillText,
                ]}
              >
                {filter.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Restaurant Cards */}
      <View style={styles.restaurantCardContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.restaurantCardsContent}
        >
          {RESTAURANTS.map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={styles.restaurantCard}
              onPress={() => router.push('/restaurant-profile')}
            >
              <Image
                source={{ uri: restaurant.image }}
                style={styles.restaurantImage}
              />
              {restaurant.discount && (
                <View style={styles.discountBadge}>
                  <ThemedText style={styles.discountText}>{restaurant.discount}</ThemedText>
                </View>
              )}
              <View style={styles.restaurantInfo}>
                <View style={styles.restaurantHeader}>
                  <ThemedText style={styles.restaurantName}>{restaurant.name}</ThemedText>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <ThemedText style={styles.rating}>{restaurant.rating}</ThemedText>
                  </View>
                </View>
                <View style={styles.restaurantDetails}>
                  <ThemedText style={styles.cuisine}>{restaurant.cuisine}</ThemedText>
                  <View style={styles.dot} />
                  <ThemedText style={styles.timeEstimate}>{restaurant.timeEstimate}</ThemedText>
                  <View style={styles.dot} />
                  <ThemedText style={styles.priceRange}>{restaurant.priceRange}</ThemedText>
                </View>
                <View style={styles.addressContainer}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <ThemedText style={styles.address} numberOfLines={1}>
                    {restaurant.address}
                  </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(107, 78, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'PoppinsBold',
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,

    paddingTop: 5,

  },
  mapContainer: {
    flex: 1,
  },
  overlayContent: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(107, 78, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontFamily: 'PoppinsRegular',
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(107, 78, 255, 0.1)',
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContentContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  filterIcon: {
    marginRight: 4,
  },
  activeFilterPill: {
    backgroundColor: '#6B4EFF',
  },
  filterPillText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterPillText: {
    color: '#FFFFFF',
  },
  restaurantCardContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 200,
  },
  restaurantCardsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  restaurantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: width * 0.7,
  },
  restaurantImage: {
    width: '100%',
    height: 100,
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
  },
  restaurantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  cuisine: {
    fontSize: 12,
    color: '#666',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: 8,
  },
  timeEstimate: {
    fontSize: 12,
    color: '#666',
  },
  priceRange: {
    fontSize: 12,
    color: '#666',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
}); 