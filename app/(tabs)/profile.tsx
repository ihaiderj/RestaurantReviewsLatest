import { useEffect, useState } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import ProfileScreen from '@/screens/profile';
import { View, ActivityIndicator } from 'react-native';

export default function ProfileTab() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    // Reset redirect state when component mounts or auth state changes
    setShouldRedirect(false);
    
    if (!isLoading && !user) {
      setShouldRedirect(true);
    }
  }, [user, isLoading]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  // If we should redirect and we're not loading, redirect to login
  if (shouldRedirect) {
    return <Redirect href="/(auth)/login" />;
  }

  // If we have no user but haven't triggered redirect yet, show loading
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  // If we have a user, show the profile screen
  return <ProfileScreen />;
} 