import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3; // 3 items per row with 16px padding on sides

const CUISINES = [
  {
    id: '1',
    name: 'Italian',
    image: { uri: 'https://cdn.countryflags.com/thumbs/italy/flag-round-250.png' },
  },
  {
    id: '2',
    name: 'Mexican',
    image: { uri: 'https://cdn.countryflags.com/thumbs/mexico/flag-round-250.png' },
  },
  {
    id: '3',
    name: 'Chinese',
    image: { uri: 'https://cdn.countryflags.com/thumbs/china/flag-round-250.png' },
  },
  {
    id: '4',
    name: 'Indian',
    image: { uri: 'https://cdn.countryflags.com/thumbs/india/flag-round-250.png' },
  },
  {
    id: '5',
    name: 'Thai',
    image: { uri: 'https://cdn.countryflags.com/thumbs/thailand/flag-round-250.png' },
  },
  {
    id: '6',
    name: 'American',
    image: { uri: 'https://cdn.countryflags.com/thumbs/united-states-of-america/flag-round-250.png' },
  },
  {
    id: '7',
    name: 'Japanese',
    image: { uri: 'https://cdn.countryflags.com/thumbs/japan/flag-round-250.png' },
  },
  {
    id: '8',
    name: 'French',
    image: { uri: 'https://cdn.countryflags.com/thumbs/france/flag-round-250.png' },
  },
  {
    id: '9',
    name: 'European',
    image: { uri: 'https://cdn.countryflags.com/thumbs/european-union/flag-round-250.png' },
  },
];

export default function InternationalCuisinesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Cuisines</ThemedText>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.grid}>
          {CUISINES.map((cuisine) => (
            <TouchableOpacity
              key={cuisine.id}
              style={styles.gridItem}
              onPress={() => router.push({
                pathname: '/filter-restaurants',
                params: { cuisine: cuisine.name }
              })}
            >
              <View style={styles.circleContainer}>
                <Image 
                  source={cuisine.image}
                  style={styles.flagImage}
                />
                <View style={styles.overlay} />
                <ThemedText style={styles.cuisineName}>
                  {cuisine.name}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    width: ITEM_SIZE,
    aspectRatio: 1,
  },
  circleContainer: {
    width: '100%',
    height: '100%',
    borderRadius: ITEM_SIZE / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#F5F5F5',
  },
  flagImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cuisineName: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 8,
  },
}); 