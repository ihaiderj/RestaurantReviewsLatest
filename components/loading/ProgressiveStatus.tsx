import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { dsColors, dsSpacing, dsTypography } from '@/utils/designSystem';

interface ProgressiveStatusProps {
  isLoading: boolean;
  loadingStages?: Array<{
    message: string;
    duration: number; // milliseconds to show this stage
    icon?: string;
  }>;
  successMessage?: string;
  errorMessage?: string;
  error?: boolean;
}

const DEFAULT_LOADING_STAGES = [
  { message: 'Connecting to server...', duration: 1000, icon: 'wifi' },
  { message: 'Searching restaurants...', duration: 2000, icon: 'search' },
  { message: 'Loading details...', duration: 1500, icon: 'download' },
  { message: 'Almost ready...', duration: 1000, icon: 'checkmark-circle' },
];

const RESTAURANT_LOADING_STAGES = [
  { message: 'Finding your location...', duration: 1000, icon: 'location' },
  { message: 'Searching nearby restaurants...', duration: 2500, icon: 'restaurant' },
  { message: 'Loading menu details...', duration: 1500, icon: 'list' },
  { message: 'Finalizing results...', duration: 800, icon: 'checkmark-circle' },
];

const REVIEW_LOADING_STAGES = [
  { message: 'Uploading photos...', duration: 2000, icon: 'camera' },
  { message: 'Processing review...', duration: 1500, icon: 'create' },
  { message: 'Updating ratings...', duration: 1000, icon: 'star' },
  { message: 'Almost done...', duration: 500, icon: 'checkmark-circle' },
];

export function ProgressiveStatus({ 
  isLoading, 
  loadingStages = DEFAULT_LOADING_STAGES,
  successMessage = 'Success!',
  errorMessage = 'Something went wrong',
  error = false 
}: ProgressiveStatusProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (!isLoading) {
      if (!error) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setCurrentStageIndex(0);
        }, 2000);
      } else {
        setCurrentStageIndex(0);
      }
      return;
    }
    
    setShowSuccess(false);
    setCurrentStageIndex(0);
    
    // Progress through loading stages
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;
    
    const progressStages = () => {
      if (currentIndex < loadingStages.length - 1) {
        const currentStage = loadingStages[currentIndex];
        
        // Animate stage transition
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        
        timeoutId = setTimeout(() => {
          currentIndex++;
          setCurrentStageIndex(currentIndex);
          progressStages();
        }, currentStage.duration);
      }
    };
    
    progressStages();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, error, loadingStages, fadeAnim]);
  
  useEffect(() => {
    if (showSuccess) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showSuccess, scaleAnim]);
  
  if (showSuccess) {
    return (
      <Animated.View style={[styles.container, styles.successContainer, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons 
          name="checkmark-circle" 
          size={24} 
          color={dsColors.status.success} 
        />
        <ThemedText style={[styles.message, styles.successMessage]}>
          {successMessage}
        </ThemedText>
      </Animated.View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons 
          name="alert-circle" 
          size={24} 
          color={dsColors.status.error} 
        />
        <ThemedText style={[styles.message, styles.errorMessage]}>
          {errorMessage}
        </ThemedText>
      </View>
    );
  }
  
  if (!isLoading) {
    return null;
  }
  
  const currentStage = loadingStages[currentStageIndex];
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        styles.loadingContainer,
        { opacity: fadeAnim }
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={currentStage.icon as any || 'hourglass'} 
          size={20} 
          color={dsColors.primary.main} 
        />
        <View style={styles.spinner} />
      </View>
      <ThemedText style={styles.message}>
        {currentStage.message}
      </ThemedText>
      
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {loadingStages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= currentStageIndex && styles.progressDotActive
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Specialized components for common use cases
export function RestaurantLoadingStatus(props: Omit<ProgressiveStatusProps, 'loadingStages'>) {
  return (
    <ProgressiveStatus
      {...props}
      loadingStages={RESTAURANT_LOADING_STAGES}
      successMessage="Restaurants loaded!"
    />
  );
}

export function ReviewSubmissionStatus(props: Omit<ProgressiveStatusProps, 'loadingStages'>) {
  return (
    <ProgressiveStatus
      {...props}
      loadingStages={REVIEW_LOADING_STAGES}
      successMessage="Review submitted!"
      errorMessage="Failed to submit review"
    />
  );
}

// Quick status messages for fast operations
interface QuickStatusProps {
  message: string;
  type: 'loading' | 'success' | 'error';
  icon?: string;
}

export function QuickStatus({ message, type, icon }: QuickStatusProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'loading': return 'refresh';
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };
  
  const getColor = () => {
    switch (type) {
      case 'loading': return dsColors.primary.main;
      case 'success': return dsColors.status.success;
      case 'error': return dsColors.status.error;
      default: return dsColors.neutral.gray500;
    }
  };
  
  return (
    <View style={[styles.quickStatus, styles[`${type}Container`]]}>
      <Ionicons 
        name={getIcon() as any} 
        size={18} 
        color={getColor()} 
      />
      <ThemedText style={[styles.quickMessage, { color: getColor() }]}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dsSpacing.md,
    paddingVertical: dsSpacing.sm,
    borderRadius: 8,
    marginVertical: dsSpacing.xs,
  },
  loadingContainer: {
    backgroundColor: dsColors.neutral.gray50,
    borderWidth: 1,
    borderColor: dsColors.neutral.gray200,
  },
  successContainer: {
    backgroundColor: dsColors.neutral.gray50,
    borderWidth: 1,
    borderColor: dsColors.status.success,
  },
  errorContainer: {
    backgroundColor: dsColors.neutral.gray50,
    borderWidth: 1,
    borderColor: dsColors.status.error,
  },
  iconContainer: {
    position: 'relative',
    marginRight: dsSpacing.sm,
  },
  spinner: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: dsColors.primary.light,
    borderTopColor: 'transparent',
    borderRadius: 12,
    // Note: Animation would need to be implemented with Animated API for rotation
  },
  message: {
    fontSize: 14,
    color: dsColors.neutral.gray700,
    flex: 1,
  },
  successMessage: {
    color: dsColors.status.success,
    fontWeight: '600',
  },
  errorMessage: {
    color: dsColors.status.error,
  },
  progressContainer: {
    flexDirection: 'row',
    marginLeft: dsSpacing.sm,
    gap: 4,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: dsColors.neutral.gray300,
  },
  progressDotActive: {
    backgroundColor: dsColors.primary.main,
  },
  quickStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dsSpacing.sm,
    paddingVertical: dsSpacing.xs,
    borderRadius: 6,
  },
  quickMessage: {
    fontSize: 12,
    marginLeft: dsSpacing.xs,
    fontWeight: '500',
  },
});
