import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/auth';
import { 
  ReviewCategory, 
  ReviewSubmission, 
  ReviewCategoryRating,
  getReviewCategories,
  submitReview,
  editReview,
  getMediaUrl 
} from '@/utils/api';

export default function WriteReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  // Edit mode check
  const isEditMode = params.editMode === 'true';
  const reviewId = params.reviewId as string;
  const existingData = params.existingData ? JSON.parse(params.existingData as string) : null;

  // Parse restaurant data from navigation params
  const restaurantData = {
    id: params.restaurantId ? parseInt(params.restaurantId as string) : null,
    name: params.restaurantName as string || 'Restaurant Name',
    image: params.restaurantImage as string || null,
    cuisine: params.restaurantCuisine as string || 'Cuisine',
    address: params.restaurantAddress as string || 'Address not available',
    timing: params.restaurantTiming as string || '15 min'
  };

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ReviewCategory[]>([]);
  const [categoryRatings, setCategoryRatings] = useState<{ [key: number]: number }>({});
  const [overallRating, setOverallRating] = useState(isEditMode ? existingData?.overall_rating || 0 : 0);
  const [comment, setComment] = useState(isEditMode ? existingData?.comment || '' : '');
  const [photos, setPhotos] = useState<Array<{ uri: string; type: string; name: string; isExisting?: boolean }>>([]);

  // Authentication check
  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to write a review.',
        [
          { text: 'Cancel', onPress: () => router.back() },
          { text: 'Login', onPress: () => router.replace('/(auth)/login') }
        ]
      );
      return;
    }

    if (!restaurantData.id) {
      Alert.alert('Error', 'Restaurant information is missing.');
      router.back();
      return;
    }

    fetchCategories();
  }, [user, restaurantData.id]);

  // Fetch review categories
  const fetchCategories = async () => {
    try {
      const categoriesData = await getReviewCategories();
      setCategories(categoriesData);
      console.log('📋 Fetched review categories:', categoriesData);
      console.log('📷 Photo section should now be visible after categories load');
      
      // Pre-populate category ratings in edit mode
      if (isEditMode && existingData?.category_ratings) {
        const initialRatings: { [key: number]: number } = {};
        existingData.category_ratings.forEach((rating: any) => {
          initialRatings[rating.category_id] = rating.rating;
        });
        setCategoryRatings(initialRatings);
        console.log('✏️ Pre-populated category ratings:', initialRatings);
      }
      
      // Pre-populate photos in edit mode
      if (isEditMode && existingData?.photos && existingData.photos.length > 0) {
        console.log('📸 Raw existing photos data:', existingData.photos);
        const existingPhotos = existingData.photos.map((photo: any, index: number) => ({
          uri: getMediaUrl(photo.image || photo.photo || photo.url || photo.uri),
          type: 'image/jpeg',
          name: photo.name || `existing_photo_${index + 1}.jpg`,
          isExisting: true // Mark as existing photo
        }));
        setPhotos(existingPhotos);
        console.log('✏️ Pre-populated existing photos:', existingPhotos.length, existingPhotos);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load review categories');
    }
  };

  // Calculate overall rating from category ratings (only rated categories)
  useEffect(() => {
    const ratedValues = Object.values(categoryRatings).filter(rating => rating > 0);
    if (ratedValues.length > 0) {
      const average = ratedValues.reduce((sum, rating) => sum + rating, 0) / ratedValues.length;
      setOverallRating(Math.round(average * 10) / 10); // Round to 1 decimal place
    } else {
      setOverallRating(0);
    }
  }, [categoryRatings]);

  // Handle category rating change
  const handleCategoryRating = (categoryId: number, rating: number) => {
    setCategoryRatings(prev => ({
      ...prev,
      [categoryId]: rating
    }));
  };

  // Handle photo upload
  const handleAddPhotos = async () => {
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

        setPhotos(prev => [...prev, ...newPhotos].slice(0, 5)); // Limit to 5 photos
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to submit a review');
      return false;
    }

    if (categories.length === 0) {
      Alert.alert('Error', 'Review categories are not loaded');
      return false;
    }

    // Check if at least one category is rated
    const ratedCategories = Object.keys(categoryRatings).filter(id => categoryRatings[parseInt(id)] > 0);
    if (ratedCategories.length === 0) {
      Alert.alert('Rating Required', 'Please rate at least one category before submitting');
      return false;
    }

    // Comment is now optional - no validation needed

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const reviewData: ReviewSubmission = {
        overall_rating: overallRating,
        comment: comment.trim() || '', // Empty string if no comment
        category_ratings: Object.entries(categoryRatings)
          .filter(([_, rating]) => rating > 0) // Only include rated categories
          .map(([categoryId, rating]) => ({
            category_id: parseInt(categoryId),
            rating
          })),
        photos: photos.length > 0 ? photos : undefined
      };

      if (isEditMode) {
        console.log('✏️ Updating review:', reviewData);
        // Add restaurant_id for edit endpoint
        const editData = { ...reviewData, restaurant_id: restaurantData.id };
        await editReview(reviewId, editData);
        
        Alert.alert(
          'Success', 
          'Your review has been updated successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        console.log('📝 Submitting review:', reviewData);
        await submitReview(restaurantData.id!, reviewData);
        
        Alert.alert(
          'Success', 
          'Your review has been submitted successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (comment.trim() || Object.keys(categoryRatings).length > 0 || photos.length > 0) {
      Alert.alert(
        'Discard Review?',
        'Are you sure you want to discard your review?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleCancel} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>
          {isEditMode ? 'Edit Review' : 'Leave Review'}
        </ThemedText>
        </View>

        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <Image 
            source={
              restaurantData.image && restaurantData.image !== 'default'
                ? { uri: getMediaUrl(restaurantData.image) }
                : require('@/assets/images/default-res-img.jpg')
            }
            style={styles.restaurantImage}
          />
          <View style={styles.restaurantDetails}>
            <ThemedText style={styles.restaurantName}>{restaurantData.name}</ThemedText>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color="#6B4EFF" />
              <ThemedText style={styles.detailText}>{restaurantData.timing}</ThemedText>
              <ThemedText style={styles.dot}>•</ThemedText>
              <Ionicons name="restaurant-outline" size={16} color="#6B4EFF" />
              <ThemedText style={styles.detailText}>{restaurantData.cuisine}</ThemedText>
            </View>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <ThemedText style={styles.addressText}>{restaurantData.address}</ThemedText>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <ThemedText style={styles.sectionTitle}>How is your experience?</ThemedText>
          
          {/* Overall Rating Display (Auto-calculated) */}
          {overallRating > 0 && (
            <View style={styles.overallRatingDisplay}>
              <ThemedText style={styles.overallRatingLabel}>Your overall rating (based on rated categories)</ThemedText>
              <View style={styles.overallStarsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star}
                    name={star <= Math.round(overallRating) ? "star" : "star-outline"} 
                    size={32} 
                    color={star <= Math.round(overallRating) ? "#FFB800" : "#E0E0E0"} 
                  />
                ))}
                <ThemedText style={styles.ratingValue}>({overallRating.toFixed(1)})</ThemedText>
              </View>
            </View>
          )}

          {/* Category Ratings */}
          {categories.length > 0 ? (
            <>
              <ThemedText style={styles.categoryHelpText}>Rate the categories that matter to you (optional)</ThemedText>
              {categories.map((category) => (
                <View key={category.id} style={styles.categoryRatingContainer}>
                  <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                  <View style={styles.categoryStarsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleCategoryRating(category.id, star)}
                        style={styles.starButton}
                      >
                        <Ionicons 
                          name={star <= (categoryRatings[category.id] || 0) ? "star" : "star-outline"} 
                          size={24} 
                          color={star <= (categoryRatings[category.id] || 0) ? "#FFB800" : "#E0E0E0"} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#6B4EFF" />
              <ThemedText style={styles.loadingText}>Loading categories...</ThemedText>
            </View>
          )}
        </View>

        {/* Review Input */}
        <View style={styles.reviewSection}>
          <ThemedText style={styles.sectionTitle}>Add detailed review (Optional)</ThemedText>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience (optional)..."
            multiline
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
            maxLength={1000}
          />
          <ThemedText style={styles.characterCount}>{comment.length}/1000</ThemedText>
        </View>

        {/* Photo Upload Section */}
        <View style={styles.photoSection}>
          <ThemedText style={styles.photoSectionTitle}>Add Photos (Optional)</ThemedText>
          <TouchableOpacity 
            style={styles.addPhotoButton} 
            onPress={() => {
              console.log('📸 Photo upload button pressed');
              handleAddPhotos();
            }}
          >
            <Ionicons name="camera-outline" size={24} color="#6B4EFF" />
            <ThemedText style={styles.addPhotoText}>add photo ({photos.length}/5)</ThemedText>
          </TouchableOpacity>

          {/* Photo Preview */}
          {photos.length > 0 && (
            <>
              <ThemedText style={styles.photoDebugText}>
                📸 Photos ({photos.length}): {photos.map(p => p.isExisting ? 'existing' : 'new').join(', ')}
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoPreview}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image 
                      source={{ uri: photo.uri }} 
                      style={styles.photoThumbnail}
                      onError={(e) => console.log(`📸 Image error for ${photo.name}:`, e.nativeEvent.error)}
                      onLoad={() => console.log(`📸 Image loaded successfully: ${photo.name}`)}
                    />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                    {photo.isExisting && (
                      <View style={styles.existingPhotoBadge}>
                        <ThemedText style={styles.existingPhotoText}>📷</ThemedText>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer with Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <ThemedText style={styles.cancelText}>Cancel</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (overallRating === 0 || loading) && styles.submitButtonDisabled
          ]}
          disabled={overallRating === 0 || loading}
          onPress={handleSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.submitText}>Submit</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 220, // Even more space to clear the footer completely
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
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  restaurantInfo: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  restaurantDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  dot: {
    color: '#666',
    marginHorizontal: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  ratingSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
  },
  overallRatingDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  overallRatingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  overallStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  categoryHelpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  categoryRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  categoryStarsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  starButton: {
    padding: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  reviewSection: {
    padding: 20,
  },
  reviewInput: {
    height: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  photoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Extra padding to ensure visibility
    marginBottom: 60, // Much more margin to push away from footer
    backgroundColor: '#FAFAFA', // Light background to make it visible
    borderRadius: 12,
    paddingTop: 20,
    marginTop: 20, // Add top margin for better separation
  },
  photoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#6B4EFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
  },
  addPhotoText: {
    color: '#6B4EFF',
    fontSize: 16,
    fontWeight: '500',
  },
  photoPreview: {
    marginTop: 16,
  },
  photoDebugText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  existingPhotoBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(107, 78, 255, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  existingPhotoText: {
    fontSize: 10,
    color: 'white',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 