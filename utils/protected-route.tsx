import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { View, ActivityIndicator } from 'react-native';

export function withProtectedRoute<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function ProtectedRoute(props: T) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
      return () => setIsMounted(false);
    }, []);

    useEffect(() => {
      if (!isLoading && !user && isMounted) {
        // Only redirect if the component is mounted
        router.replace('/(auth)/login');
      }
    }, [user, isLoading, isMounted]);

    // Don't render anything if not mounted
    if (!isMounted) {
      return null;
    }

    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#6B4EFF" />
        </View>
      );
    }

    if (!user) {
      return null; // Will redirect in useEffect
    }

    return <WrappedComponent {...props} />;
  };
} 