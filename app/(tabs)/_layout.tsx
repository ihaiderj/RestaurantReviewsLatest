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
      tabBarStyle: {
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
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
      },
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
        name="review"
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="create-outline" size={size} color={color} />
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
      {/* Hide discover screen */}
      <Tabs.Screen
        name="discover"
        options={{
          href: null, // This hides the tab
        }}
      />
    </Tabs>
  );
} 