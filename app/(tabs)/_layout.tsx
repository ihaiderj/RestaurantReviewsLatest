import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth';

// Define the type for the icon props
interface TabIconProps {
  color: string;
  size: number;
}

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#6B4EFF',
      tabBarInactiveTintColor: '#666',
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
          href: user ? undefined : '/(auth)/login',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          href: user ? undefined : '/(auth)/login',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
          href: user ? undefined : '/(auth)/login',
        }}
      />
    </Tabs>
  );
} 