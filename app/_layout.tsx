import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/auth';
import { LocationProvider } from '@/contexts/location';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" translucent />
      <AuthProvider>
        <LocationProvider>
          <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="(modals)" 
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }}
          />
        </Stack>
      </LocationProvider>
    </AuthProvider>
    </>
  );
}
