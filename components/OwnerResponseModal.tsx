import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { respondToReview } from '../utils/api';
import { Review } from '../utils/api';

interface OwnerResponseModalProps {
  visible: boolean;
  review: Review | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function OwnerResponseModal({ visible, review, onClose, onSuccess }: OwnerResponseModalProps) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!review) return;

    if (!response.trim()) {
      Alert.alert('Response Required', 'Please write a response to the review.');
      return;
    }

    try {
      setLoading(true);
      await respondToReview(review.id, response.trim());
      Alert.alert('Success', 'Your response has been submitted successfully!');
      setResponse('');
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setResponse('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Respond to Review</ThemedText>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>

        {review && (
          <View style={styles.reviewPreview}>
            <ThemedText style={styles.reviewPreviewTitle}>Review by {review.user.username}</ThemedText>
            <ThemedText style={styles.reviewPreviewText} numberOfLines={3}>
              {review.comment}
            </ThemedText>
          </View>
        )}

        <View style={styles.content}>
          <ThemedText style={styles.label}>Your Response</ThemedText>
          <TextInput
            style={styles.responseInput}
            value={response}
            onChangeText={setResponse}
            placeholder="Write your response to this review..."
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={1000}
          />
          <ThemedText style={styles.characterCount}>
            {response.length}/1000 characters
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.submitButtonText}>Submit Response</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  reviewPreview: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  reviewPreviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 160,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
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