import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { dsColors, dsSpacing, dsRadius } from '@/utils/designSystem';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  animationDuration?: number;
}

export function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = dsRadius.sm,
  style,
  animationDuration = 1200
}: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: animationDuration / 2,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: animationDuration / 2,
          useNativeDriver: false,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [animatedValue, animationDuration]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [dsColors.neutral.gray200, dsColors.neutral.gray100],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

// Restaurant card skeleton
export function RestaurantCardSkeleton() {
  return (
    <View style={styles.restaurantCard}>
      {/* Image skeleton */}
      <SkeletonLoader width="100%" height={120} borderRadius={dsRadius.md} />
      
      <View style={styles.restaurantContent}>
        {/* Title */}
        <SkeletonLoader width="80%" height={18} style={{ marginBottom: dsSpacing.xs }} />
        
        {/* Subtitle */}
        <SkeletonLoader width="60%" height={14} style={{ marginBottom: dsSpacing.sm }} />
        
        {/* Rating and distance row */}
        <View style={styles.restaurantMeta}>
          <SkeletonLoader width={60} height={16} />
          <SkeletonLoader width={40} height={16} />
        </View>
        
        {/* Tags */}
        <View style={styles.tagRow}>
          <SkeletonLoader width={50} height={24} borderRadius={12} />
          <SkeletonLoader width={70} height={24} borderRadius={12} />
          <SkeletonLoader width={45} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

// Map marker skeleton
export function MapMarkerSkeleton() {
  return (
    <View style={styles.mapMarker}>
      <SkeletonLoader 
        width={40} 
        height={40} 
        borderRadius={20}
        animationDuration={800}
      />
    </View>
  );
}

// Search results skeleton
export function SearchResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.searchResults}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.searchResultItem}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={styles.searchResultText}>
            <SkeletonLoader width="70%" height={16} style={{ marginBottom: dsSpacing.xs }} />
            <SkeletonLoader width="50%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Filter options skeleton
export function FilterOptionsSkeleton() {
  return (
    <View style={styles.filterOptions}>
      <View style={styles.filterRow}>
        <SkeletonLoader width={80} height={32} borderRadius={16} />
        <SkeletonLoader width={90} height={32} borderRadius={16} />
        <SkeletonLoader width={70} height={32} borderRadius={16} />
      </View>
      <View style={styles.filterRow}>
        <SkeletonLoader width={100} height={32} borderRadius={16} />
        <SkeletonLoader width={60} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

// Review card skeleton
export function ReviewCardSkeleton() {
  return (
    <View style={styles.reviewCard}>
      {/* User info */}
      <View style={styles.reviewHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.reviewUserInfo}>
          <SkeletonLoader width="60%" height={16} style={{ marginBottom: dsSpacing.xs }} />
          <SkeletonLoader width="40%" height={12} />
        </View>
      </View>
      
      {/* Rating stars */}
      <View style={styles.ratingRow}>
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonLoader 
            key={index}
            width={16} 
            height={16} 
            borderRadius={2}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
      
      {/* Review text */}
      <SkeletonLoader width="100%" height={14} style={{ marginBottom: dsSpacing.xs }} />
      <SkeletonLoader width="90%" height={14} style={{ marginBottom: dsSpacing.xs }} />
      <SkeletonLoader width="70%" height={14} style={{ marginBottom: dsSpacing.sm }} />
      
      {/* Review images */}
      <View style={styles.reviewImages}>
        <SkeletonLoader width={60} height={60} borderRadius={dsRadius.sm} />
        <SkeletonLoader width={60} height={60} borderRadius={dsRadius.sm} />
        <SkeletonLoader width={60} height={60} borderRadius={dsRadius.sm} />
      </View>
    </View>
  );
}

// Restaurant list skeleton
export function RestaurantListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.restaurantList}>
      {Array.from({ length: count }, (_, index) => (
        <RestaurantCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  restaurantCard: {
    backgroundColor: dsColors.neutral.white,
    borderRadius: dsRadius.md,
    marginBottom: dsSpacing.md,
    padding: dsSpacing.md,
    elevation: 2,
    shadowColor: dsColors.neutral.gray800,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  restaurantContent: {
    paddingTop: dsSpacing.sm,
  },
  restaurantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dsSpacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    gap: dsSpacing.xs,
    flexWrap: 'wrap',
  },
  mapMarker: {
    position: 'absolute',
    zIndex: 1000,
  },
  searchResults: {
    padding: dsSpacing.md,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dsSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: dsColors.neutral.gray200,
  },
  searchResultText: {
    marginLeft: dsSpacing.sm,
    flex: 1,
  },
  filterOptions: {
    padding: dsSpacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: dsSpacing.sm,
    marginBottom: dsSpacing.sm,
  },
  reviewCard: {
    backgroundColor: dsColors.neutral.white,
    borderRadius: dsRadius.md,
    padding: dsSpacing.md,
    marginBottom: dsSpacing.md,
    elevation: 1,
    shadowColor: dsColors.neutral.gray800,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dsSpacing.sm,
  },
  reviewUserInfo: {
    marginLeft: dsSpacing.sm,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: dsSpacing.sm,
  },
  reviewImages: {
    flexDirection: 'row',
    gap: dsSpacing.sm,
  },
  restaurantList: {
    padding: dsSpacing.md,
  },
});
