import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DistanceSelectorProps {
  selectedDistance: number;
  onDistanceChange: (distance: number) => void;
  buttonStyle?: any;
  textStyle?: any;
  iconColor?: string;
  distanceOptions?: number[];
}

const DEFAULT_DISTANCES = [0.25, 0.5, 1, 2, 5, 10, 15, 20, 25, 50];

export function DistanceSelector({
  selectedDistance,
  onDistanceChange,
  buttonStyle,
  textStyle,
  iconColor = '#6366F1',
  distanceOptions = DEFAULT_DISTANCES,
}: DistanceSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [customDistance, setCustomDistance] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  const selectDistance = (distance: number) => {
    onDistanceChange(distance);
    closeModal();
  };

  const handleCustomDistance = () => {
    const distance = parseFloat(customDistance);
    if (isNaN(distance) || distance <= 0) {
      Alert.alert('Invalid Distance', 'Please enter a valid positive number');
      return;
    }
    if (distance > 100) {
      Alert.alert('Distance Too Large', 'Please enter a distance less than 100 km');
      return;
    }
    selectDistance(distance);
    setCustomDistance('');
    setShowCustomInput(false);
  };

  const toggleCustomInput = () => {
    setShowCustomInput(!showCustomInput);
    if (!showCustomInput) {
      setCustomDistance('');
    }
  };

  const formatDistance = (distance: number) => {
    return distance < 1 ? `${distance * 1000}M` : `${distance} KM`;
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[styles.button, buttonStyle]}
        onPress={openModal}
        activeOpacity={0.7}
      >
        <Ionicons name="location" size={16} color={iconColor} />
        <ThemedText style={[styles.buttonText, textStyle]}>
          {formatDistance(selectedDistance)}
        </ThemedText>
        <Ionicons name="chevron-down" size={12} color={iconColor} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {/* Header */}
                <View style={styles.header}>
                  <ThemedText style={styles.title}>Select Distance</ThemedText>
                  <ThemedText style={styles.subtitle}>Choose search radius</ThemedText>
                </View>

                {/* Distance Grid */}
                <View style={styles.distanceGrid}>
                  {distanceOptions.map((distance, index) => (
                    <TouchableOpacity
                      key={distance}
                      style={[
                        styles.distanceOption,
                        selectedDistance === distance && styles.selectedOption,
                      ]}
                      onPress={() => selectDistance(distance)}
                      activeOpacity={0.7}
                    >
                      <ThemedText
                        style={[
                          styles.distanceText,
                          selectedDistance === distance && styles.selectedText,
                        ]}
                      >
                        {formatDistance(distance)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Custom Distance Option */}
                  <TouchableOpacity
                    style={[
                      styles.distanceOption,
                      styles.customOption,
                      showCustomInput && styles.selectedOption,
                    ]}
                    onPress={toggleCustomInput}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="add-circle-outline" 
                      size={18} 
                      color={showCustomInput ? '#6366F1' : '#6B7280'} 
                    />
                    <ThemedText
                      style={[
                        styles.distanceText,
                        styles.customText,
                        showCustomInput && styles.selectedText,
                      ]}
                    >
                      Custom
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Custom Distance Input */}
                {showCustomInput && (
                  <View style={styles.customInputContainer}>
                    <ThemedText style={styles.customInputLabel}>
                      Enter distance in kilometers:
                    </ThemedText>
                    <View style={styles.customInputRow}>
                      <TextInput
                        style={styles.customInput}
                        placeholder="e.g. 3.5"
                        placeholderTextColor="#9CA3AF"
                        value={customDistance}
                        onChangeText={setCustomDistance}
                        keyboardType="numeric"
                        autoFocus={true}
                      />
                      <TouchableOpacity
                        style={styles.applyButton}
                        onPress={handleCustomDistance}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.closeButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Trigger Button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
  },
  buttonText: {
    marginHorizontal: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: screenHeight * 0.7,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Distance Grid
  distanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  distanceOption: {
    width: (screenWidth - 60) / 3 - 8, // 3 columns with spacing
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedText: {
    color: '#6366F1',
    fontWeight: '600',
  },

  // Custom Distance Option
  customOption: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  customText: {
    fontSize: 14,
  },

  // Custom Distance Input
  customInputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customInputLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    fontWeight: '500',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
    color: '#111827',
  },
  applyButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Close Button
  closeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});
