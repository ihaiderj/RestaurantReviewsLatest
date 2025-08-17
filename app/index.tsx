import { Redirect } from 'expo-router';
import { SplashScreen } from '@/components/SplashScreen';
import { View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <SplashScreen />
    </View>
  );
} 