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
  const { user: authUser, signOut, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Don't make API calls if we're signing out
    if (isSigningOut) return;

    if (!authLoading && !authUser) {
      router.replace('/(auth)/login');
      return;
    }

    if (authUser) {
      loadProfile();
    }
  }, [authUser, authLoading, isMounted, isSigningOut]);

  const loadProfile = async () => {
    // Don't load profile if we're signing out
    if (isSigningOut || !isMounted) return;
    
    try {
      setIsLoading(true);
      const response = await getProfile();
      if (isMounted && !isSigningOut) {
        setUser(response.user);
        setError(null);
      }
    } catch (error) {
      if (isMounted && !isSigningOut) {
        setError('Failed to load profile');
        Alert.alert('Error', 'Failed to load profile. Please try again.');
      }
    } finally {
      if (isMounted && !isSigningOut) {
        setIsLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      // Clear local state first
      setUser(null);
      setError(null);
      // Then sign out which will clear the tokens
      await signOut();
      if (isMounted) {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      if (isMounted) {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    } finally {
      if (isMounted) {
        setIsSigningOut(false);
      }
    }
  };

  // If we're signing out or already signed out, don't show any loading states
  if (isSigningOut || !authUser) {
    return <Redirect href="/(auth)/login" />;
  }

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No profile data available</ThemedText>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadProfile}
          >
            <ThemedText style={styles.retryButtonText}>Refresh</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const MENU_ITEMS = user.user_type === 'OWNER' 
    ? [OWNER_MENU_ITEM, ...BASE_MENU_ITEMS]
    : BASE_MENU_ITEMS;

  const handleMenuPress = (id: typeof MENU_ITEMS[number]['id']) => {
    switch (id) {
      case 'profile':
        router.push('/edit-profile');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'language':
        router.push('/language');
        break;
      case 'help':
        router.push('/help');
        break;
      case 'invites':
        router.push('/invite-friends');
        break;
      case 'orders':
        router.push('/my-orders');
        break;
      case 'manage-restaurants':
        router.push('/manage-restaurants' as any);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={loadProfile}
            tintColor="#6B4EFF"
          />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {user.profile_picture ? (
              <Image 
                source={{ uri: getMediaUrl(user.profile_picture) }}
                style={styles.profileImage}
                onError={(e) => {
                  console.error('Profile image load error:', e.nativeEvent.error);
                  // When image fails to load, show placeholder
                  const img = e.target as any;
                  if (img) {
                    img.onerror = null; // Prevent infinite error loop
                  }
                }}
                defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/edit-profile')}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="pencil" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.userName}>
            {user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}`
              : user.username}
          </ThemedText>
          <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
          {user.phone_number && (
            <ThemedText style={styles.userPhone}>{user.phone_number}</ThemedText>
          )}
        </View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <ThemedText style={styles.menuItemTitle}>
                  {item.title}
                </ThemedText>
              </View>
              <View style={styles.menuItemRight}>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <View style={styles.signOutContent}>
            <Ionicons name="log-out-outline" size={24} color="#DC2626" />
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40, // Same width as back button for alignment
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
  },
  profileImagePlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    backgroundColor: '#6B4EFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    paddingVertical: 16,
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 