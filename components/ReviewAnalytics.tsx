import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { StarRating } from './StarRating';
import { ReviewAnalytics as ReviewAnalyticsType } from '../utils/api';

interface ReviewAnalyticsProps {
  analytics: ReviewAnalyticsType | null | undefined;
}

export function ReviewAnalytics({ analytics }: ReviewAnalyticsProps) {
  // Add safety checks for undefined analytics
  if (!analytics) {
    console.log('❌ ReviewAnalytics: analytics is undefined');
    return null;
  }

  const formatRating = (rating: number) => {
    return (rating || 0).toFixed(1);
  };



  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Review Statistics</ThemedText>

      {/* Overall Stats */}
      <View style={styles.overallStats}>
        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Overall Rating</ThemedText>
          <View style={styles.ratingDisplay}>
            <StarRating
              rating={Math.round(analytics.overall_average || 0)}
              readonly
              size="medium"
              showValue={false}
              color="#FFB800"
            />
            <ThemedText style={styles.ratingValue}>
              {formatRating(analytics.overall_average || 0)}/5
            </ThemedText>
          </View>
        </View>

        <View style={styles.statCard}>
          <ThemedText style={styles.statLabel}>Total Reviews</ThemedText>
          <ThemedText style={styles.statValue}>{analytics.total_reviews || 0}</ThemedText>
        </View>
      </View>

      {/* Category Averages */}
      {analytics.category_averages && analytics.category_averages.length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Category Averages</ThemedText>
          {analytics.category_averages.map((cat) => (
            <View key={cat.category?.id || Math.random()} style={styles.categoryStat}>
              <View style={styles.categoryInfo}>
                <ThemedText style={styles.categoryName}>{cat.category?.name || 'Unknown'}</ThemedText>
                <ThemedText style={styles.categoryRating}>
                  {formatRating(cat.average || 0)}/5
                </ThemedText>
              </View>
              <StarRating 
                rating={Math.round(cat.average || 0)} 
                readonly 
                size="small" 
                color="#FFB800"
              />
            </View>
          ))}
        </View>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  overallStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
    color: '#333',
  },
  categoryRating: {
    fontSize: 12,
    color: '#666',
  },
}); 