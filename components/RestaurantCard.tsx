import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { OptimizedImage } from '@/components/images/OptimizedImage';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/contexts/location';

const { width } = Dimensions.get('window');

export interface RestaurantCardProps {
  restaurant: {
    id: number;
    name: string;
    cuisine: string;
    rating: number;
    review_count: number;
    image: { uri: string };
    distance?: string;
    hasOffer?: boolean;
    street_address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    venue_types?: string[];
    cuisine_styles?: string[];
    logo?: string | null;
    is_approved?: boolean;
    discount?: string;
  };
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  showDistance?: boolean;
  cardWidth?: number;
  cardHeight?: number;
}

export function RestaurantCard({ 
  restaurant, 
  onPress, 
  onFavoritePress, 
  isFavorite = false,
  showDistance = true,
  cardWidth: customCardWidth,
  cardHeight: customCardHeight
}: RestaurantCardProps) {
  const { userLocation } = useLocation();
  
  const cardWidth = customCardWidth || width * 0.82;
  const cardHeight = customCardHeight || 200;

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

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

  const getDistanceText = () => {
    if (!showDistance || !userLocation || !restaurant.latitude || !restaurant.longitude) {
      return restaurant.distance || 'Distance N/A';
    }
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      restaurant.latitude,
      restaurant.longitude
    );
    
    return formatDistance(distance);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { width: cardWidth, height: cardHeight }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Restaurant Image */}
      <View style={styles.imageContainer}>
        <OptimizedImage 
          source={restaurant.image} 
          width="100%"
          height="100%"
          style={styles.restaurantImage}
          contentFit="cover"
          fallbackIcon="restaurant"
          alt={`${restaurant.name} restaurant image`}
        />
        
        {/* Favorite Icon Overlay */}
        {onFavoritePress && (
          <TouchableOpacity 
            style={styles.favoriteIconOverImage}
            onPress={onFavoritePress}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={20} 
              color={isFavorite ? "#FF6B6B" : "#fff"} 
            />
          </TouchableOpacity>
        )}

        {/* Discount Badge */}
        {(restaurant.discount || restaurant.hasOffer) && (
          <View style={styles.discountBadge}>
            <ThemedText style={styles.discountText}>
              {restaurant.discount || 'Special Offer'}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantContent}>
        <View style={styles.restaurantHeader}>
          <ThemedText style={styles.restaurantName} numberOfLines={2}>
            {restaurant.name}
          </ThemedText>
        </View>
        
        <View style={styles.restaurantFooter}>
          <View style={styles.leftFooterContent}>
            {/* Rating */}
            {restaurant.rating > 0 && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <ThemedText style={styles.ratingText}>
                  {restaurant.rating.toFixed(1)}
                </ThemedText>
              </View>
            )}
            
            {/* Reviews */}
            {(restaurant.review_count ?? 0) > 0 ? (
              <View style={styles.reviewsContainer}>
                <ThemedText style={styles.reviewsText}>
                  ({restaurant.review_count} reviews)
                </ThemedText>
              </View>
            ) : (
              <View style={styles.reviewsContainer}>
                <ThemedText style={styles.noReviewsText}>
                  No Reviews Yet
                </ThemedText>
              </View>
            )}
          </View>

          {/* Distance */}
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <ThemedText style={styles.distanceText}>{getDistanceText()}</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: '60%',
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  favoriteIconOverImage: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  restaurantContent: {
    flex: 1,
    padding: 10,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  restaurantHeader: {
    marginBottom: 6,
    width: '100%',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    flexShrink: 1,
    textAlign: 'left',
  },
  restaurantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  leftFooterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 2,
  },
  reviewsContainer: {
    marginLeft: 4,
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
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
}); 