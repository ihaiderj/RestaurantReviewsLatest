import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, TextInput } from 'react-native';
import { OptimizedImage } from '@/components/images/OptimizedImage';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';

const { width } = Dimensions.get('window');

type SpecialOffer = {
  id: string;
  type: string;
  title: string;
  discount: string;
  image: string;
  gradientColors: [string, string];
};

const SPECIAL_OFFERS: SpecialOffer[] = [
  {
    id: '1',
    type: 'Weekend Special',
    title: 'Get 30% Off on Italian Cuisine',
    discount: '30',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&h=500&q=80',
    gradientColors: ['#FF6B6B', '#FF8E53'] as [string, string],
  },
  {
    id: '2',
    type: 'Festival Offer',
    title: 'Special Discount on Family Meals',
    discount: '25',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&h=500&q=80',
    gradientColors: ['#4E54C8', '#8F94FB'] as [string, string],
  },
  {
    id: '3',
    type: 'Happy Hours',
    title: 'Lunch Time Special Offers',
    discount: '20',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=500&q=80',
    gradientColors: ['#11998e', '#38ef7d'] as [string, string],
  },
  {
    id: '4',
    type: 'New Year Special',
    title: 'Celebrate with Special Deals',
    discount: '35',
    image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=500&h=500&q=80',
    gradientColors: ['#8E2DE2', '#4A00E0'] as [string, string],
  },
  {
    id: '5',
    type: 'First Order',
    title: 'Special First Order Discount',
    discount: '40',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=500&q=80',
    gradientColors: ['#FF416C', '#FF4B2B'] as [string, string],
  },
  {
    id: '6',
    type: 'Premium Members',
    title: 'Exclusive Premium Offers',
    discount: '15',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=500&q=80',
    gradientColors: ['#00B4DB', '#0083B0'] as [string, string],
  },
];

export default function SpecialOffersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Popular', 'New', 'Weekend', 'Festival'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Special Offers</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search special offers..."
              placeholderTextColor="#999"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter && styles.activeFilterPill,
              ]}
              onPress={() => setActiveFilter(filter)}
              activeOpacity={0.7}
            >
              {filter === 'All' && (
                <Ionicons 
                  name="grid-outline" 
                  size={16} 
                  color={activeFilter === filter ? '#fff' : '#666'} 
                />
              )}
              {filter === 'Popular' && (
                <Ionicons 
                  name="flame-outline" 
                  size={16} 
                  color={activeFilter === filter ? '#fff' : '#666'} 
                />
              )}
              {filter === 'New' && (
                <Ionicons 
                  name="star-outline" 
                  size={16} 
                  color={activeFilter === filter ? '#fff' : '#666'} 
                />
              )}
              {filter === 'Weekend' && (
                <Ionicons 
                  name="calendar-outline" 
                  size={16} 
                  color={activeFilter === filter ? '#fff' : '#666'} 
                />
              )}
              {filter === 'Festival' && (
                <Ionicons 
                  name="gift-outline" 
                  size={16} 
                  color={activeFilter === filter ? '#fff' : '#666'} 
                />
              )}
              <ThemedText 
                style={[
                  styles.filterPillText,
                  activeFilter === filter && styles.activeFilterPillText
                ]}
              >
                {filter}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {SPECIAL_OFFERS.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <LinearGradient
                colors={offer.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.8 }}
                style={styles.gradientOverlay}
              />
              <View style={styles.offerInfo}>
                <View>
                  <ThemedText style={styles.offerType}>{offer.type.toUpperCase()}</ThemedText>
                  <ThemedText style={styles.offerTitle}>{offer.title}</ThemedText>
                  <View style={styles.discountContainer}>
                    <ThemedText style={styles.upToText}>UP TO</ThemedText>
                    <View style={styles.discountWrapper}>
                      <ThemedText style={styles.discountText}>{offer.discount}%</ThemedText>
                      <Ionicons 
                        name="pricetag"
                        size={24} 
                        color="#fff" 
                        style={styles.percentIcon}
                      />
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.bookButton}
                  activeOpacity={0.8}
                >
                  <ThemedText style={styles.bookButtonText}>Book Now</ThemedText>
                </TouchableOpacity>
              </View>
              <View style={styles.imageContainer}>
                <OptimizedImage 
                  source={{ uri: offer.image }} 
                  width="100%"
                  height="100%"
                  style={styles.offerImage}
                  contentFit="cover"
                  fallbackIcon="restaurant"
                  alt={`${offer.title} offer image`}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
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
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: 0,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  offerCard: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    height: 180,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.95,
  },
  offerInfo: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 1,
    paddingRight: width * 0.38,
    paddingTop: 16,
  },
  offerType: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    width: '90%',
    letterSpacing: 0.3,
  },
  discountContainer: {
    marginBottom: 12,
    marginTop: 4,
  },
  upToText: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  discountWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    height: 40,
  },
  discountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    lineHeight: 38,
  },
  percentIcon: {
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginTop: 12,
    transform: [{ scale: 1.05 }],
  },
  bookButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  imageContainer: {
    width: width * 0.38,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  offerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    transform: [{ scale: 1.1 }],
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    padding: 0,
    height: 24,
  },
  filterContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
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
  },
  activeFilterPill: {
    backgroundColor: '#6B4EFF',
    borderColor: '#5B3EEF',
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
}); 