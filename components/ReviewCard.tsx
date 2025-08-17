import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { StarRating } from './StarRating';
import { Review, likeReview, flagReview, deleteReview, editReview } from '../utils/api';
import { useAuth } from '../contexts/auth';

interface ReviewCardProps {
  review: Review;
  onRefresh: () => void;
  onEdit?: (review: Review) => void;
  onRespond?: (review: Review) => void;
}

export function ReviewCard({ review, onRefresh, onEdit, onRespond }: ReviewCardProps) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  
  // Debug photo data for reviews
  console.log('📸 ReviewCard DEBUG - Review ID:', review.id);
  console.log('📷 ReviewCard DEBUG - Photos data:', review.photos);
  console.log('📊 ReviewCard DEBUG - Photos count:', review.photos?.length || 0);
  if (review.photos && review.photos.length > 0) {
    console.log('🖼️ ReviewCard DEBUG - First photo:', review.photos[0]);
  }
  
  const isOwner = review.restaurant.owner === user?.id;
  const isAuthor = review.user.id === user?.id;

  const handleLike = async (isLike: boolean) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to like reviews');
      return;
    }

    try {
      setIsLiking(true);
      await likeReview(review.id, isLike);
      onRefresh();
    } catch (error) {
      Alert.alert('Error', 'Failed to like review. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleFlag = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to flag reviews');
      return;
    }

    Alert.prompt(
      'Flag Review',
      'Please select a reason for flagging this review:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitFlag('Spam') },
        { text: 'Inappropriate', onPress: () => submitFlag('Inappropriate') },
        { text: 'Fake Review', onPress: () => submitFlag('Fake') },
        { text: 'Offensive', onPress: () => submitFlag('Offensive') },
        { text: 'Other', onPress: () => submitFlag('Other') },
      ]
    );
  };

  const submitFlag = async (reason: string) => {
    try {
      await flagReview(review.id, reason);
      Alert.alert('Success', 'Review has been flagged for review.');
    } catch (error) {
      Alert.alert('Error', 'Failed to flag review. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReview(review.id);
              onRefresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={
              review.user.profile_picture
                ? { uri: review.user.profile_picture }
                : require('../assets/images/default-avatar.jpg')
            }
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <ThemedText style={styles.username}>{review.user.username}</ThemedText>
            <ThemedText style={styles.date}>{formatDate(review.created_at)}</ThemedText>
          </View>
        </View>
        
        {/* Status indicator */}
        {review.status !== 'new' && (
          <View style={[styles.statusBadge, styles[`status_${review.status}`]]}>
            <ThemedText style={styles.statusText}>{review.status}</ThemedText>
          </View>
        )}
      </View>

      {/* Overall Rating */}
      <View style={styles.overallRating}>
        <StarRating 
          rating={review.overall_rating} 
          readonly 
          size="medium" 
          showValue={true}
          color="#FFB800"
        />
      </View>

      {/* Category Ratings */}
      {review.category_ratings.length > 0 && (
        <View style={styles.categoryRatings}>
          {review.category_ratings.map((cr) => (
            <View key={cr.id} style={styles.categoryRating}>
              <ThemedText style={styles.categoryName}>{cr.category.name}:</ThemedText>
              <StarRating 
                rating={cr.rating} 
                readonly 
                size="small"
                color="#FFB800"
              />
            </View>
          ))}
        </View>
      )}

      {/* Comment */}
      <ThemedText style={styles.comment}>{review.comment}</ThemedText>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <View style={styles.photosSection}>
          <ThemedText style={styles.photosLabel}>Photos ({review.photos.length})</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {review.photos.map((photo) => (
              <TouchableOpacity key={photo.id} style={styles.photoWrapper}>
                <Image 
                  source={{ uri: photo.image }} 
                  style={styles.photo}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Owner Response */}
      {review.owner_response && (
        <View style={styles.ownerResponse}>
          <View style={styles.ownerResponseHeader}>
            <Ionicons name="business-outline" size={16} color="#007AFF" />
            <ThemedText style={styles.ownerResponseTitle}>Owner Response</ThemedText>
          </View>
          <ThemedText style={styles.ownerResponseText}>{review.owner_response}</ThemedText>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.likeDislike}>
          <TouchableOpacity
            style={[styles.actionButton, isLiking && styles.disabledButton]}
            onPress={() => handleLike(true)}
            disabled={isLiking}
          >
            <Ionicons name="thumbs-up-outline" size={16} color="#666" />
            <ThemedText style={styles.actionText}>{review.likes_count}</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, isLiking && styles.disabledButton]}
            onPress={() => handleLike(false)}
            disabled={isLiking}
          >
            <Ionicons name="thumbs-down-outline" size={16} color="#666" />
            <ThemedText style={styles.actionText}>{review.dislikes_count}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.rightActions}>
          {!isAuthor && (
            <TouchableOpacity style={styles.actionButton} onPress={handleFlag}>
              <Ionicons name="flag-outline" size={16} color="#666" />
              <ThemedText style={styles.actionText}>Report</ThemedText>
            </TouchableOpacity>
          )}

          {isAuthor && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={() => onEdit?.(review)}>
                <Ionicons name="create-outline" size={16} color="#666" />
                <ThemedText style={styles.actionText}>Edit</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                <ThemedText style={[styles.actionText, styles.deleteText]}>Delete</ThemedText>
              </TouchableOpacity>
            </>
          )}

          {isOwner && !review.owner_response && (
            <TouchableOpacity style={styles.actionButton} onPress={() => onRespond?.(review)}>
              <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
              <ThemedText style={[styles.actionText, styles.respondText]}>Respond</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  status_flagged: {
    backgroundColor: '#FFE5E5',
  },
  status_resolved: {
    backgroundColor: '#E5F4E5',
  },
  status_responded: {
    backgroundColor: '#E5F0FF',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  overallRating: {
    marginBottom: 12,
  },
  categoryRatings: {
    marginBottom: 12,
  },
  categoryRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
  },
  comment: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  photosSection: {
    marginBottom: 12,
  },
  photosLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photosContainer: {
    marginBottom: 8,
  },
  photoWrapper: {
    marginRight: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  ownerResponse: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  ownerResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ownerResponseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  ownerResponseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  likeDislike: {
    flexDirection: 'row',
    gap: 16,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  deleteText: {
    color: '#FF3B30',
  },
  respondText: {
    color: '#007AFF',
  },
}); 