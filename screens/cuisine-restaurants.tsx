import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CuisineRestaurantsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ThemedText>Cuisine Restaurants</ThemedText>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 