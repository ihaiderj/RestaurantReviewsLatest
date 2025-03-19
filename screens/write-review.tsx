import { View, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function WriteReviewScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Leave Review</ThemedText>
      </View>

      {/* Restaurant Info */}
      <View style={styles.restaurantInfo}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&q=80' }}
          style={styles.restaurantImage}
        />
        <View style={styles.restaurantDetails}>
          <ThemedText style={styles.restaurantName}>LibertyBite Bistro</ThemedText>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#6B4EFF" />
            <ThemedText style={styles.detailText}>15 min</ThemedText>
            <ThemedText style={styles.dot}>•</ThemedText>
            <Ionicons name="restaurant-outline" size={16} color="#6B4EFF" />
            <ThemedText style={styles.detailText}>Italian</ThemedText>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <ThemedText style={styles.addressText}>1012 Ocean avenue, New y..</ThemedText>
          </View>
        </View>
      </View>

      {/* Rating Section */}
      <View style={styles.ratingSection}>
        <ThemedText style={styles.sectionTitle}>How is your experience?</ThemedText>
        <ThemedText style={styles.ratingLabel}>Your overall rating</ThemedText>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
            >
              <Ionicons 
                name={star <= rating ? "star" : "star-outline"} 
                size={40} 
                color={star <= rating ? "#FFB800" : "#E0E0E0"} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Review Input */}
      <View style={styles.reviewSection}>
        <ThemedText style={styles.sectionTitle}>Add detailed review</ThemedText>
        <TextInput
          style={styles.reviewInput}
          placeholder="Enter here"
          multiline
          value={review}
          onChangeText={setReview}
          textAlignVertical="top"
        />
      </View>

      {/* Add Photo Button */}
      <TouchableOpacity style={styles.addPhotoButton}>
        <Ionicons name="camera-outline" size={24} color="#6B4EFF" />
        <ThemedText style={styles.addPhotoText}>add photo</ThemedText>
      </TouchableOpacity>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, (!rating || !review) && styles.submitButtonDisabled]}
          disabled={!rating || !review}
          onPress={() => {
            // Handle submit
            router.back();
          }}
        >
          <ThemedText style={styles.submitText}>Submit</ThemedText>
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
  },
  restaurantInfo: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reviewSection: {
    padding: 16,
  },
  reviewInput: {
    height: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  addPhotoText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
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