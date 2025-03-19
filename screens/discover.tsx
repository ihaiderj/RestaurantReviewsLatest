import { View, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// Separate map components for web and native
const MapComponent = () => {
  // Fixed Google Maps API key access
  const googleMapsApiKey = Constants.expoConfig?.extra?.googleMapsApiKey || "";
  
  if (Platform.OS === 'web') {
    return (
      <View style={styles.mapContainer}>
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/view?key=${googleMapsApiKey}&center=40.7128,-74.0060&zoom=14`}
        />
      </View>
    );
  }

  const MapView = require('react-native-maps').default;
  const Marker = require('react-native-maps').Marker;

  return (
    <MapView
      style={styles.mapContainer}
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

export default function DiscoverScreen() {
  const [selectedFilter, setSelectedFilter] = useState('Open Restaurants');
  const filters = ['Open Restaurants', 'Cuisine', 'Popular', 'Top Rated'];

  return (
    <View style={styles.container}>
      <MapComponent />
      
      {/* Overlay Content */}
      <View style={styles.overlay}>
        {/* Top Section */}
        <SafeAreaView style={styles.topSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search Restaurants"
                placeholderTextColor="#666"
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={24} color="#6B4EFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContentContainer}
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
        </SafeAreaView>

        {/* Bottom Sheet */}
        <View style={styles.bottomSheet}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.restaurantsContent}
          >
            {RESTAURANTS.map((restaurant) => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.restaurantCard}
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
                  <ThemedText style={styles.addressText}>
                    {restaurant.address}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  filterContentContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeFilterPill: {
    backgroundColor: '#6B4EFF',
    shadowColor: '#6B4EFF',
    shadowOpacity: 0.2,
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
  bottomSheet: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
    // borderTopLeftRadius: 20,
    // borderTopRightRadius: 20,
    // paddingVertical: 16,
    // paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    height: 235,
    // backgroundColor: 'rgba(255, 255, 255, 0.95)',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: -3,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 5,
  },
  scrollView: {
    flexGrow: 0,
  },
  restaurantsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  restaurantCard: {
    width: width * 0.35,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 12,
    gap: 4,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainer: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  filterIcon: {
    width: 16,
    height: 16,
  },
}); 