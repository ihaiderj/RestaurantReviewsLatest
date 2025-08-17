import { View, StyleSheet, Image, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth';
import { useEffect, useState } from 'react';
import { getMediaUrl, getProfile } from '@/utils/api';
import type { User } from '@/types/auth';

const { width } = Dimensions.get('window');

const BASE_MENU_ITEMS = [
  {
    id: 'profile',
    icon: 'person-outline',
    title: 'Your profile',
    color: '#6B4EFF',
  },
  {
    id: 'orders',
    icon: 'document-text-outline',
    title: 'My Orders',
    color: '#6B4EFF',
  },
  {
    id: 'settings',
    icon: 'settings-outline',
    title: 'Settings',
    color: '#6B4EFF',
  },
  {
    id: 'help',
    icon: 'information-circle-outline',
    title: 'Help Center',
    color: '#6B4EFF',
  },
  {
    id: 'language',
    icon: 'globe-outline',
    title: 'Language',
    color: '#6B4EFF',
  },
  {
    id: 'invites',
    icon: 'people-outline',
    title: 'Invites Friends',
    color: '#6B4EFF',
  },
] as const;

const OWNER_MENU_ITEM = {
  id: 'manage-restaurants',
  icon: 'restaurant-outline',
  title: 'Manage Restaurants',
  color: '#6B4EFF',
} as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authUser) {
      return;
    }
    loadProfile();
  }, [authUser]);

  const loadProfile = async () => {
    if (!authUser) return;
    
    try {
      setIsLoading(true);
      const response = await getProfile();
      if (response?.user) {
        setUser(response.user);
        setError(null);
      } else {
        throw new Error('No user data received');
      }
    } catch (error) {
      console.error('Profile loading error:', error);
      setError('Failed to load profile');
      setUser(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (!authUser) {
    return null;
  }

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadProfile}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayUser = user || authUser;
  const MENU_ITEMS = displayUser.user_type === 'OWNER' 
    ? [OWNER_MENU_ITEM, ...BASE_MENU_ITEMS]
    : BASE_MENU_ITEMS;

  const handleMenuPress = (id: typeof MENU_ITEMS[number]['id']) => {
    switch (id) {
      case 'profile':
        router.push('/(modals)/edit-profile' as any);
        break;
      case 'orders':
        router.push('/(modals)/my-orders' as any);
        break;
      case 'settings':
        router.push('/(modals)/settings' as any);
        break;
      case 'help':
        router.push('/(modals)/help' as any);
        break;
      case 'language':
        router.push('/(modals)/language' as any);
        break;
      case 'invites':
        router.push('/(modals)/invite-friends' as any);
        break;
      case 'manage-restaurants':
        router.push('/(modals)/restaurant-profile' as any);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6B4EFF']}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Image
              source={
                displayUser.profile_picture
                  ? { uri: getMediaUrl(displayUser.profile_picture) }
                  : require('@/assets/images/default-avatar.jpg')
              }
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <ThemedText style={styles.name}>
                {displayUser.first_name
                  ? `${displayUser.first_name} ${displayUser.last_name || ''}`
                  : displayUser.username}
              </ThemedText>
              <ThemedText style={styles.email}>{displayUser.email}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '10' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  menuContainer: {
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  signOutButton: {
    marginTop: 20,
    marginBottom: 40,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#FF5B5B',
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5B5B',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Poppins-Regular',
  },
  retryButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
}); 