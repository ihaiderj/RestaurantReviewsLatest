import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const RESTAURANTS = [
  {
    id: '1',
    name: 'LibertyBite Bistro',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80',
    cuisine: 'Italian',
    timeEstimate: '15 min',
    priceRange: '$$$',
    address: '8502 Preston Rd. Inglewood, Maine 98380',
    discount: '10% OFF',
    rating: 4.9,
  },
  {
    id: '2',
    name: 'PatriotPlates Diner',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=300&q=80',
    cuisine: 'Mexican',
    timeEstimate: '20 min',
    priceRange: '$$$',
    address: '6391 Elgin St. Celina, Delaware 10299',
    discount: '20% OFF',
    rating: 4.8,
  },
  {
    id: '3',
    name: "Umami'tastic House",
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=300&q=80',
    cuisine: 'Japanese',
    timeEstimate: '25 min',
    priceRange: '$$',
    address: '2464 Royal Ln. Mesa, New Jersey 45463',
    discount: '25% OFF',
    rating: 4.9,
  },
  // Add more restaurants as needed
];

export default function PopularRestaurantsScreen() {
  const [activeFilter, setActiveFilter] = useState('Nearest');
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Popular Restaurants</ThemedText>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {['Nearest', 'Great Offers', 'Rating 4.5+'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.activeFilterPill,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <ThemedText 
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Restaurant List */}
      <ScrollView 
        style={styles.restaurantsContainer}
        showsVerticalScrollIndicator={false}
      >
        {RESTAURANTS.map((restaurant) => (
          <TouchableOpacity 
            key={restaurant.id}
            style={styles.restaurantCard}
            onPress={() => router.push('/restaurant-profile')}
            activeOpacity={0.7}
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
            <TouchableOpacity style={styles.heartButton}>
              <Ionicons name="heart-outline" size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.restaurantInfo}>
              <View style={styles.nameRating}>
                <ThemedText style={styles.restaurantName}>
                  {restaurant.name}
                </ThemedText>
                <View style={styles.rating}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <ThemedText style={styles.ratingText}>
                    {restaurant.rating}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.details}>
                <View style={styles.detail}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <ThemedText style={styles.detailText}>
                    {restaurant.timeEstimate}
                  </ThemedText>
                </View>
                <View style={styles.dot} />
                <View style={styles.detail}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <ThemedText style={styles.detailText}>
                    {restaurant.priceRange}
                  </ThemedText>
                </View>
                <View style={styles.dot} />
                <View style={styles.detail}>
                  <Ionicons name="restaurant-outline" size={16} color="#666" />
                  <ThemedText style={styles.detailText}>
                    {restaurant.cuisine}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <ThemedText style={styles.addressText}>
                  {restaurant.address}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterPill: {
    backgroundColor: '#6B4EFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
  restaurantsContainer: {
    flex: 1,
    padding: 16,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  restaurantImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  restaurantInfo: {
    padding: 16,
  },
  nameRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
}); 