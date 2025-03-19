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
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500&h=300&q=80',
    cuisine: 'Mexican',
    timeEstimate: '20 min',
    priceRange: '$$$',
    address: '6391 Elgin St. Celina, Delaware 10299',
    discount: '20% OFF',
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Gourmet Garden',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=500&h=300&q=80',
    cuisine: 'European',
    timeEstimate: '25 min',
    priceRange: '$$$$',
    address: '2464 Royal Ln. Mesa, New Jersey 45463',
    discount: '15% OFF',
    rating: 4.7,
  },
  {
    id: '4',
    name: 'Taco Fiesta',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=300&q=80',
    cuisine: 'Mexican',
    timeEstimate: '20 min',
    priceRange: '$$',
    address: '3891 Ranchview Dr. Richardson, California 62639',
    discount: '20% OFF',
    rating: 4.6,
  },
];

export default function WishlistScreen() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const categories = ['All', 'Italian', 'European', 'Mexican'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          }} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Wishlist</ThemedText>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.fixedContent}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search saved restaurants..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryPill,
                activeCategory === category && styles.activeCategoryPill,
              ]}
              onPress={() => setActiveCategory(category)}
            >
              {category === 'All' && (
                <Ionicons 
                  name="restaurant-outline" 
                  size={16} 
                  color={activeCategory === category ? '#fff' : '#666'} 
                />
              )}
              {category === 'Italian' && (
                <Ionicons 
                  name="pizza-outline" 
                  size={16} 
                  color={activeCategory === category ? '#fff' : '#666'} 
                />
              )}
              {category === 'European' && (
                <Ionicons 
                  name="wine-outline" 
                  size={16} 
                  color={activeCategory === category ? '#fff' : '#666'} 
                />
              )}
              {category === 'Mexican' && (
                <Ionicons 
                  name="flame-outline" 
                  size={16} 
                  color={activeCategory === category ? '#fff' : '#666'} 
                />
              )}
              <ThemedText style={[
                styles.categoryText,
                activeCategory === category && styles.activeCategoryText,
              ]}>
                {category}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.restaurantsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.restaurantsContent}
      >
        {RESTAURANTS.map((restaurant) => (
          <TouchableOpacity 
            key={restaurant.id} 
            style={styles.restaurantCard}
            onPress={() => router.push('/restaurant-profile')}
            activeOpacity={0.7}
          >
            <View style={styles.imageContainer}>
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
                <Ionicons name="heart" size={24} color="#FF4B4B" />
              </TouchableOpacity>
            </View>
            <View style={styles.restaurantInfo}>
              <View style={styles.nameRatingContainer}>
                <ThemedText style={styles.restaurantName}>{restaurant.name}</ThemedText>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <ThemedText style={styles.rating}>{restaurant.rating}</ThemedText>
                </View>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detail}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <ThemedText style={styles.detailText}>{restaurant.timeEstimate}</ThemedText>
                </View>
                <View style={styles.dot} />
                <View style={styles.detail}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <ThemedText style={styles.detailText}>{restaurant.priceRange}</ThemedText>
                </View>
                <View style={styles.dot} />
                <View style={styles.detail}>
                  <Ionicons name="restaurant-outline" size={16} color="#666" />
                  <ThemedText style={styles.detailText}>{restaurant.cuisine}</ThemedText>
                </View>
              </View>
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <ThemedText style={styles.addressText}>{restaurant.address}</ThemedText>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  fixedContent: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    height: 36,
    marginRight: 8,
  },
  activeCategoryPill: {
    backgroundColor: '#6B4EFF',
    borderColor: '#5B3EEF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  restaurantsContainer: {
    flex: 1,
  },
  restaurantsContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
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
    fontWeight: '600',
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
  nameRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  detailsContainer: {
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