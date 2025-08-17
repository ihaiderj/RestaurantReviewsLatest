import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
  maxRating?: number;
  color?: string;
}

export function StarRating({ 
  rating, 
  onChange, 
  readonly = false, 
  size = 'medium',
  showValue = false,
  maxRating = 5,
  color 
}: StarRatingProps) {
  const defaultStarColor = useThemeColor({}, 'tint');
  const starColor = color || defaultStarColor;
  const emptyStarColor = useThemeColor({}, 'tabIconDefault');
  
  const getStarSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const handleStarPress = (starRating: number) => {
    if (!readonly && onChange) {
      onChange(starRating);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= rating;
          
          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleStarPress(starValue)}
              disabled={readonly}
              style={styles.starButton}
              activeOpacity={readonly ? 1 : 0.7}
            >
              <Ionicons
                name={isFilled ? 'star' : 'star-outline'}
                size={getStarSize()}
                color={isFilled ? starColor : emptyStarColor}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {showValue && (
        <ThemedText style={[styles.ratingText, { fontSize: getStarSize() - 4 }]}>
          {rating}/{maxRating}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  starButton: {
    padding: 2,
  },
  ratingText: {
    fontWeight: '600',
    color: '#666',
  },
}); 