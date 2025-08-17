import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Image, ImageSource, ImageContentFit } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { dsColors, dsSpacing, dsRadius } from '@/utils/designSystem';
import { SkeletonLoader } from '@/components/loading/SkeletonLoader';

interface OptimizedImageProps {
  source: ImageSource | string;
  width?: number | string;
  height?: number | string;
  style?: ViewStyle;
  contentFit?: ImageContentFit;
  placeholder?: ImageSource | string;
  fallbackIcon?: string;
  borderRadius?: number;
  showLoadingIndicator?: boolean;
  enableFadeIn?: boolean;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  priority?: 'low' | 'normal' | 'high';
  onLoad?: () => void;
  onError?: (error: any) => void;
  alt?: string; // For accessibility
}

/**
 * Optimized image component with lazy loading, caching, and fallbacks
 */
export function OptimizedImage({
  source,
  width = '100%',
  height = 200,
  style,
  contentFit = 'cover',
  placeholder,
  fallbackIcon = 'image',
  borderRadius = dsRadius.md,
  showLoadingIndicator = true,
  enableFadeIn = true,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  onLoad,
  onError,
  alt
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    
    if (enableFadeIn) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    onLoad?.();
  }, [enableFadeIn, fadeAnim, onLoad]);

  const handleError = useCallback((errorEvent: any) => {
    console.warn('OptimizedImage load error:', errorEvent);
    setLoading(false);
    setError(true);
    onError?.(errorEvent);
  }, [onError]);

  const imageSource = typeof source === 'string' 
    ? { uri: source, cacheKey: source }
    : source;

  const containerStyle = [
    styles.container,
    {
      width,
      height,
      borderRadius,
    },
    style,
  ];

  // Fallback component for errors
  if (error) {
    return (
      <View style={[containerStyle, styles.fallback]}>
        <Ionicons 
          name={fallbackIcon as any} 
          size={Math.min(Number(width) || 48, Number(height) || 48) * 0.3} 
          color={dsColors.neutral.gray400} 
        />
        <ThemedText style={styles.fallbackText}>
          Failed to load image
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Loading skeleton */}
      {loading && showLoadingIndicator && (
        <View style={styles.loadingOverlay}>
          <SkeletonLoader
            width="100%"
            height="100%"
            borderRadius={borderRadius}
          />
        </View>
      )}

      {/* Main image */}
      <Animated.View
        style={[
          styles.imageContainer,
          enableFadeIn && { opacity: fadeAnim }
        ]}
      >
        <Image
          source={imageSource}
          style={styles.image}
          contentFit={contentFit}
          placeholder={placeholder}
          cachePolicy={cachePolicy}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          accessible={!!alt}
          accessibilityLabel={alt}
          accessibilityRole="image"
        />
      </Animated.View>
    </View>
  );
}

/**
 * Restaurant image component with specific optimizations
 */
interface RestaurantImageProps extends Omit<OptimizedImageProps, 'fallbackIcon' | 'alt'> {
  restaurantName?: string;
  imageType?: 'logo' | 'banner' | 'food' | 'interior' | 'exterior';
}

export function RestaurantImage({
  restaurantName,
  imageType = 'banner',
  ...props
}: RestaurantImageProps) {
  const getFallbackIcon = () => {
    switch (imageType) {
      case 'logo': return 'business';
      case 'food': return 'restaurant';
      case 'interior': return 'home';
      case 'exterior': return 'storefront';
      default: return 'image';
    }
  };

  const getAltText = () => {
    if (restaurantName) {
      return `${restaurantName} ${imageType} image`;
    }
    return `Restaurant ${imageType} image`;
  };

  return (
    <OptimizedImage
      {...props}
      fallbackIcon={getFallbackIcon()}
      alt={getAltText()}
      priority="high" // Restaurant images are usually important
    />
  );
}

/**
 * User avatar component with circular styling
 */
interface UserAvatarProps extends Omit<OptimizedImageProps, 'contentFit' | 'borderRadius' | 'width' | 'height'> {
  size?: number;
  username?: string;
}

export function UserAvatar({
  size = 40,
  username,
  ...props
}: UserAvatarProps) {
  return (
    <OptimizedImage
      {...props}
      width={size}
      height={size}
      contentFit="cover"
      borderRadius={size / 2}
      fallbackIcon="person"
      alt={username ? `${username} avatar` : 'User avatar'}
      priority="low" // Avatars are less critical
      cachePolicy="memory-disk" // Cache avatars aggressively
    />
  );
}

/**
 * Gallery image component with lazy loading
 */
interface GalleryImageProps extends OptimizedImageProps {
  index?: number;
  isVisible?: boolean; // For lazy loading
}

export function GalleryImage({
  index,
  isVisible = true,
  ...props
}: GalleryImageProps) {
  // Only load if visible (for lazy loading in galleries)
  if (!isVisible) {
    return (
      <View style={[styles.container, { width: props.width, height: props.height }]}>
        <SkeletonLoader
          width="100%"
          height="100%"
          borderRadius={props.borderRadius || dsRadius.md}
        />
      </View>
    );
  }

  return (
    <OptimizedImage
      {...props}
      priority={index !== undefined && index < 3 ? 'high' : 'low'} // Prioritize first 3 images
      alt={`Gallery image ${index !== undefined ? index + 1 : ''}`}
    />
  );
}

/**
 * Progressive image component that loads a low-quality placeholder first
 */
interface ProgressiveImageProps extends OptimizedImageProps {
  thumbnailSource?: ImageSource | string;
}

export function ProgressiveImage({
  source,
  thumbnailSource,
  ...props
}: ProgressiveImageProps) {
  const [highResLoaded, setHighResLoaded] = useState(false);

  const handleHighResLoad = useCallback(() => {
    setHighResLoaded(true);
    props.onLoad?.();
  }, [props.onLoad]);

  return (
    <View style={[styles.container, { width: props.width, height: props.height }]}>
      {/* Low-res thumbnail */}
      {thumbnailSource && !highResLoaded && (
        <OptimizedImage
          {...props}
          source={thumbnailSource}
          showLoadingIndicator={false}
          enableFadeIn={false}
          cachePolicy="memory"
          priority="high"
        />
      )}

      {/* High-res image */}
      <OptimizedImage
        {...props}
        source={source}
        onLoad={handleHighResLoad}
        style={[
          props.style,
          !highResLoaded && thumbnailSource && { opacity: 0 }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: dsColors.neutral.gray100,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dsColors.neutral.gray50,
  },
  fallbackText: {
    marginTop: dsSpacing.xs,
    fontSize: 12,
    color: dsColors.neutral.gray500,
    textAlign: 'center',
  },
});

