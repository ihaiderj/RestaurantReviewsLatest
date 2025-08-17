import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from './ThemedText';
import { StarRating } from './StarRating';
import { CategoryRatingInput } from './CategoryRatingInput';
import { 
  ReviewCategory, 
  ReviewSubmission, 
  ReviewCategoryRating,
  getReviewCategories,
  submitReview 
} from '../utils/api';
import { useAuth } from '../contexts/auth';

interface ReviewFormProps {
  restaurantId: number;
  restaurantName: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ReviewForm({ restaurantId, restaurantName, onSubmit, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ReviewCategory[]>([]);
  const [formData, setFormData] = useState<ReviewSubmission>({
    overall_rating: 0,
    comment: '',
    category_ratings: [],
    photos: [],
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await getReviewCategories();
      setCategories(categoriesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load review categories');
    }
  };

  const handleOverallRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, overall_rating: rating }));
  };

  const handleCategoryRatingChange = (categoryId: number, rating: number) => {
    setFormData(prev => ({
      ...prev,
      category_ratings: [
        ...prev.category_ratings.filter(cr => cr.category_id !== categoryId),
        { category_id: categoryId, rating }
      ]
    }));
  };

  const handleCommentChange = (comment: string) => {
    setFormData(prev => ({ ...prev, comment }));
  };

  const pickImages = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to upload photos');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
        }));

        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), ...newPhotos].slice(0, 5) // Limit to 5 photos
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (formData.overall_rating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating');
      return false;
    }

    if (!formData.comment.trim()) {
      Alert.alert('Comment Required', 'Please write a review comment');
      return false;
    }

    if (formData.category_ratings.length !== categories.length) {
      Alert.alert('Category Ratings Required', 'Please rate all categories');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to submit a review');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await submitReview(restaurantId, formData);
      Alert.alert('Success', 'Your review has been submitted successfully!');
      onSubmit();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryRating = (categoryId: number): number => {
    return formData.category_ratings.find(cr => cr.category_id === categoryId)?.rating || 0;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Write a Review</ThemedText>
        <ThemedText style={styles.subtitle}>{restaurantName}</ThemedText>
      </View>

      {/* Overall Rating */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Overall Rating</ThemedText>
        <View style={styles.overallRatingContainer}>
          <StarRating
            rating={formData.overall_rating}
            onChange={handleOverallRatingChange}
            size="large"
            showValue={true}
          />
        </View>
      </View>

      {/* Category Ratings */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Rate by Category</ThemedText>
        {categories.map(category => (
          <CategoryRatingInput
            key={category.id}
            category={category}
            rating={getCategoryRating(category.id)}
            onChange={handleCategoryRatingChange}
          />
        ))}
      </View>

      {/* Comment */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Your Review</ThemedText>
        <TextInput
          style={styles.commentInput}
          value={formData.comment}
          onChangeText={handleCommentChange}
          placeholder="Share your experience with this restaurant..."
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      {/* Photo Upload */}
      <View style={styles.section}>
        <View style={styles.photoHeader}>
          <ThemedText style={styles.sectionTitle}>Add Photos (Optional)</ThemedText>
          <ThemedText style={styles.photoLimit}>
            {(formData.photos?.length || 0)}/5 photos
          </ThemedText>
        </View>
        
        <TouchableOpacity
          style={[styles.addPhotoButton, (formData.photos?.length || 0) >= 5 && styles.disabledButton]}
          onPress={pickImages}
          disabled={(formData.photos?.length || 0) >= 5}
        >
          <Ionicons name="camera-outline" size={24} color="#666" />
          <ThemedText style={styles.addPhotoText}>Add Photos</ThemedText>
        </TouchableOpacity>

        {/* Photo Preview */}
        {formData.photos && formData.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoPreview}>
            {formData.photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.submitButtonText}>Submit Review</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  overallRatingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoLimit: {
    fontSize: 14,
    color: '#666',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#666',
  },
  photoPreview: {
    marginTop: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 