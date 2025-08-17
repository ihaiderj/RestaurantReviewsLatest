import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from './ThemedText';

interface BottomNavigationProps {
  currentTab?: 'home' | 'wishlist' | 'reviews' | 'profile';
  style?: object;
}

export function BottomNavigation({ currentTab, style }: BottomNavigationProps) {
  const router = useRouter();

  const tabs = [
    {
      key: 'home',
      title: 'Home',
      icon: 'home-outline',
      route: '/(tabs)/',
    },
    {
      key: 'wishlist',
      title: 'Wishlist',
      icon: 'heart-outline',
      route: '/(tabs)/wishlist',
    },
    {
      key: 'reviews',
      title: 'Reviews',
      icon: 'create-outline',
      route: '/(tabs)/review',
    },
    {
      key: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      route: '/(tabs)/profile',
    },
  ];

  return (
    <View style={[styles.bottomNav, style]}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navButton}
            onPress={() => router.push(tab.route)}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${tab.title}`}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={isActive ? '#6B4EFF' : '#666'}
            />
            <ThemedText
              style={[
                styles.navText,
                { color: isActive ? '#6B4EFF' : '#666' }
              ]}
            >
              {tab.title}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: 8,
    paddingTop: 8,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});