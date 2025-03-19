import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

type PriceRange = 'All' | '$' | '$$' | '$$$' | '$$$$';
type SortOption = 'All' | 'Nearest' | 'Newest' | 'Popular';
type CuisineType = 'All' | 'Italian' | 'European' | 'Mexican' | 'Asian' | 'Indian';

interface RatingOption {
  range: string;
  value: [number, number];
}

const RATING_OPTIONS: RatingOption[] = [
  { range: '4.5 and above', value: [4.5, 5.0] },
  { range: '4.0 - 4.5', value: [4.0, 4.5] },
  { range: '3.5 - 4.0', value: [3.5, 4.0] },
  { range: '3.0 - 3.5', value: [3.0, 3.5] },
  { range: '2.5 - 3.0', value: [2.5, 3.0] },
];

export default function FilterOptionsScreen() {
  const router = useRouter();
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>('All');
  const [selectedPrice, setSelectedPrice] = useState<PriceRange>('All');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedSort, setSelectedSort] = useState<SortOption>('All');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Filter</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Location</ThemedText>
          <TouchableOpacity style={styles.locationSelector}>
            <ThemedText style={styles.locationText}>New York, USA</ThemedText>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Cuisine</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {(['All', 'Italian', 'European', 'Mexican'] as CuisineType[]).map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                style={[
                  styles.chip,
                  selectedCuisine === cuisine && styles.activeChip
                ]}
                onPress={() => setSelectedCuisine(cuisine)}
              >
                <ThemedText style={[
                  styles.chipText,
                  selectedCuisine === cuisine && styles.activeChipText
                ]}>
                  {cuisine}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Price</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {(['All', '$', '$$', '$$$', '$$$$'] as PriceRange[]).map((price) => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.chip,
                  selectedPrice === price && styles.activeChip
                ]}
                onPress={() => setSelectedPrice(price)}
              >
                <ThemedText style={[
                  styles.chipText,
                  selectedPrice === price && styles.activeChipText
                ]}>
                  {price}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Reviews</ThemedText>
          {RATING_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={option.range}
              style={styles.ratingOption}
              onPress={() => setSelectedRating(index)}
            >
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={16}
                    color="#FFB800"
                  />
                ))}
                <ThemedText style={styles.ratingText}>{option.range}</ThemedText>
              </View>
              <View style={[
                styles.radioButton,
                selectedRating === index && styles.radioButtonSelected
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sort by</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {(['All', 'Nearest', 'Newest', 'Popular'] as SortOption[]).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.chip,
                  selectedSort === sort && styles.activeChip
                ]}
                onPress={() => setSelectedSort(sort)}
              >
                <ThemedText style={[
                  styles.chipText,
                  selectedSort === sort && styles.activeChipText
                ]}>
                  {sort}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={() => {
            setSelectedCuisine('All');
            setSelectedPrice('All');
            setSelectedRating(0);
            setSelectedSort('All');
          }}
        >
          <ThemedText style={styles.resetText}>Reset Filter</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.applyText}>Apply</ThemedText>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#333',
  },
  chipScroll: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeChip: {
    backgroundColor: '#6B4EFF',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  activeChipText: {
    color: '#fff',
  },
  ratingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  radioButtonSelected: {
    borderColor: '#6B4EFF',
    backgroundColor: '#6B4EFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#6B4EFF',
    borderRadius: 8,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B4EFF',
  },
  applyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
}); 