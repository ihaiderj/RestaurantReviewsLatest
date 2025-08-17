import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { dsColors, dsSpacing, dsTypography } from '@/utils/designSystem';

interface FunLoadingMessagesProps {
  size?: 'small' | 'large';
  color?: string;
  messageStyle?: any;
  containerStyle?: any;
  showSpinner?: boolean;
}

export default function FunLoadingMessages({
  size = 'large',
  color = dsColors.primary.main,
  messageStyle,
  containerStyle,
  showSpinner = true
}: FunLoadingMessagesProps) {
  const messages = [
    "🍽️ Sharpening the chef's knives...",
    "📍 Checking the map for delicious spots...",
    "🍜 Tasting the noodles for quality control...",
    "📡 Asking satellites for your cravings...",
    "🌶️ Finding the spiciest curry nearby...",
    "🍕 Counting pizza slices for accuracy...",
    "🥘 Stirring the pots of flavor...",
    "🍣 Rolling the perfect sushi...",
    "🥐 Checking the oven temperature...",
    "🍷 Uncorking the finest wines...",
    "🥗 Washing the fresh vegetables...",
    "🍰 Decorating the dessert plates...",
    "☕ Grinding the coffee beans...",
    "🍺 Chilling the craft beers...",
    "🥪 Assembling the perfect sandwich..."
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
    }, 1500); // Change message every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {showSpinner && (
        <ActivityIndicator size={size} color={color} />
      )}
      <ThemedText style={[styles.message, messageStyle]}>
        {messages[messageIndex]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: dsSpacing.lg,
  },
  message: {
    marginTop: dsSpacing.md,
    fontSize: dsTypography.fontSize.lg,
    color: dsColors.neutral.gray700,
    textAlign: 'center',
    paddingHorizontal: dsSpacing.lg,
    lineHeight: 24,
  }
});
