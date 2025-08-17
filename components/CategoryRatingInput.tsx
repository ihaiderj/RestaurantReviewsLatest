import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { StarRating } from './StarRating';
import { ReviewCategory } from '../utils/api';

interface CategoryRatingInputProps {
  category: ReviewCategory;
  rating: number;
  onChange: (categoryId: number, rating: number) => void;
}

export function CategoryRatingInput({ category, rating, onChange }: CategoryRatingInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.categoryInfo}>
        <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
        {category.description && (
          <ThemedText style={styles.categoryDescription}>{category.description}</ThemedText>
        )}
      </View>
      <View style={styles.ratingSection}>
        <StarRating
          rating={rating}
          onChange={(newRating) => onChange(category.id, newRating)}
          size="medium"
          showValue={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  ratingSection: {
    alignItems: 'flex-end',
  },
}); 