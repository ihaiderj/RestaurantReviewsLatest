import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCuisineTypes } from '@/utils/api';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 items per row with 16px padding on sides

// Interface for cuisine data from API
interface CuisineType {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  region?: { id: number; name: string; code: string };
  region_id?: number;
  subregion?: { id: number; name: string; code: string; region?: { id: number; name: string; code: string } };
  subregion_id?: number;
  image?: string | null;
}

// Helper function to get flag URL based on cuisine name
const getFlagUrl = (cuisineName: string): string => {
  const flagMap: { [key: string]: string } = {
    'Italian': 'https://cdn.countryflags.com/thumbs/italy/flag-round-250.png',
    'Mexican': 'https://cdn.countryflags.com/thumbs/mexico/flag-round-250.png',
    'Chinese': 'https://cdn.countryflags.com/thumbs/china/flag-round-250.png',
    'Indian': 'https://cdn.countryflags.com/thumbs/india/flag-round-250.png',
    'Thai': 'https://cdn.countryflags.com/thumbs/thailand/flag-round-250.png',
    'American': 'https://cdn.countryflags.com/thumbs/united-states-of-america/flag-round-250.png',
    'Japanese': 'https://cdn.countryflags.com/thumbs/japan/flag-round-250.png',
    'French': 'https://cdn.countryflags.com/thumbs/france/flag-round-250.png',
    'European': 'https://cdn.countryflags.com/thumbs/european-union/flag-round-250.png',
    'Korean': 'https://cdn.countryflags.com/thumbs/south-korea/flag-round-250.png',
    'Vietnamese': 'https://cdn.countryflags.com/thumbs/vietnam/flag-round-250.png',
    'Spanish': 'https://cdn.countryflags.com/thumbs/spain/flag-round-250.png',
    'Greek': 'https://cdn.countryflags.com/thumbs/greece/flag-round-250.png',
    'Turkish': 'https://cdn.countryflags.com/thumbs/turkey/flag-round-250.png',
    'Lebanese': 'https://cdn.countryflags.com/thumbs/lebanon/flag-round-250.png',
    'Mediterranean': 'https://cdn.countryflags.com/thumbs/mediterranean/flag-round-250.png',
    'Middle Eastern': 'https://cdn.countryflags.com/thumbs/middle-east/flag-round-250.png',
    'African': 'https://cdn.countryflags.com/thumbs/africa/flag-round-250.png',
    'Caribbean': 'https://cdn.countryflags.com/thumbs/caribbean/flag-round-250.png',
    'Latin American': 'https://cdn.countryflags.com/thumbs/latin-america/flag-round-250.png',
  };

  // Try exact match first
  if (flagMap[cuisineName]) {
    return flagMap[cuisineName];
  }

  // Try partial matches
  const lowerName = cuisineName.toLowerCase();
  for (const [key, value] of Object.entries(flagMap)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }

  // Default flag
  return 'https://cdn.countryflags.com/thumbs/world/flag-round-250.png';
};

export default function InternationalCuisinesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [cuisines, setCuisines] = useState<CuisineType[]>([]);
  const [filteredCuisines, setFilteredCuisines] = useState<CuisineType[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load cuisines from API
  useEffect(() => {
    const fetchCuisines = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🍽️ Fetching cuisine types from API...');
        const cuisineData = await getCuisineTypes();
        console.log('🍽️ Cuisine data received:', cuisineData.length, 'cuisines');
        
        // Filter only active cuisines
        const activeCuisines = cuisineData.filter((cuisine: CuisineType) => cuisine.is_active);
        console.log('🍽️ Active cuisines:', activeCuisines.length);
        
        setCuisines(activeCuisines);
        setFilteredCuisines(activeCuisines);
        
        // Pre-select cuisines if returning from filter screen
        const currentCuisinesParam = params.currentCuisines as string;
        if (currentCuisinesParam) {
          console.log('🍽️ Pre-selecting cuisines from params:', currentCuisinesParam);
          const currentCuisineCodes = currentCuisinesParam.split(',').map(c => c.trim());
          const cuisineIdsToSelect = activeCuisines
            .filter((cuisine: CuisineType) => currentCuisineCodes.includes(cuisine.code))
            .map((cuisine: CuisineType) => cuisine.id);
          
          console.log('🍽️ Pre-selecting cuisine IDs:', cuisineIdsToSelect);
          setSelectedCuisines(cuisineIdsToSelect);
        }
      } catch (err) {
        console.error('❌ Error fetching cuisines:', err);
        setError('Failed to load cuisines. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCuisines();
  }, [params.currentCuisines]);

  // Filter cuisines based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCuisines(cuisines);
    } else {
      const filtered = cuisines.filter(cuisine =>
        cuisine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cuisine.region?.name && cuisine.region.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCuisines(filtered);
    }
  }, [searchQuery, cuisines]);

  // Handle cuisine selection
  const toggleCuisineSelection = (cuisineId: number) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisineId)) {
        return prev.filter(id => id !== cuisineId);
      } else {
        return [...prev, cuisineId];
      }
    });
  };

  // Handle search restaurants
  const handleSearchRestaurants = () => {
    if (selectedCuisines.length === 0) {
      return;
    }

    // Get selected cuisine codes
    const selectedCuisineCodes = cuisines
      .filter(cuisine => selectedCuisines.includes(cuisine.id))
      .map(cuisine => cuisine.code);
    
    console.log('🍽️ Searching restaurants for cuisines:', selectedCuisineCodes);
    
    // Check if we're returning to filter screen
    const isReturning = params.returnToFilter === 'true';
    
    if (isReturning) {
      // Navigate back to filter screen with updated cuisines
      router.push({
        pathname: '/filter-restaurants',
        params: { 
          title: `Selected Cuisines (${selectedCuisines.length})`,
          cuisines: selectedCuisineCodes.join(','),
          latitude: params.latitude,
          longitude: params.longitude,
          showDistancePrompt: 'false' // Don't show distance prompt again
        }
      });
    } else {
      // Navigate to filter screen with new cuisines
      router.push({
        pathname: '/filter-restaurants',
        params: { 
          title: `Selected Cuisines (${selectedCuisines.length})`,
          cuisines: selectedCuisineCodes.join(','),
          latitude: params.latitude,
          longitude: params.longitude
        }
      });
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    setSelectedCuisines(filteredCuisines.map(cuisine => cuisine.id));
  };

  // Handle clear all
  const handleClearAll = () => {
    setSelectedCuisines([]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Cuisine Types</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
          <ThemedText style={styles.loadingText}>Loading cuisines...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Cuisine Types</ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4B55" />
          <ThemedText style={styles.errorTitle}>Failed to load cuisines</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Cuisine Types</ThemedText>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.headerAction}>
              <ThemedText style={styles.headerActionText}>Select All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearAll} style={styles.headerAction}>
              <ThemedText style={styles.headerActionText}>Clear</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cuisines..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.selectionInfo}>
          <ThemedText style={styles.selectionText}>
            {selectedCuisines.length} of {filteredCuisines.length} cuisines selected
          </ThemedText>
          {searchQuery.length > 0 && (
            <ThemedText style={styles.searchResultsText}>
              Showing {filteredCuisines.length} results for "{searchQuery}"
            </ThemedText>
          )}
        </View>

        <View style={styles.grid}>
          {filteredCuisines.map((cuisine) => {
            const isSelected = selectedCuisines.includes(cuisine.id);
            const flagUrl = getFlagUrl(cuisine.name);
            
            return (
            <TouchableOpacity
              key={cuisine.id}
                style={[styles.gridItem, isSelected && styles.selectedGridItem]}
                onPress={() => toggleCuisineSelection(cuisine.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cuisineContainer}>
                <Image 
                    source={{ uri: flagUrl }}
                  style={styles.flagImage}
                    defaultSource={{ uri: 'https://cdn.countryflags.com/thumbs/world/flag-round-250.png' }}
                />
                  <View style={styles.cuisineInfo}>
                    <ThemedText style={styles.cuisineName} numberOfLines={2}>
                  {cuisine.name}
                </ThemedText>
                    {cuisine.region && (
                      <ThemedText style={styles.cuisineRegion} numberOfLines={1}>
                        {cuisine.region.name}
                      </ThemedText>
                    )}
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.selectedCheckbox]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
              </View>
            </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer with Search Restaurants button */}
      {selectedCuisines.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.searchRestaurantsButton}
            onPress={handleSearchRestaurants}
          >
            <Ionicons name="search" size={20} color="#fff" style={styles.buttonIcon} />
            <ThemedText style={styles.searchRestaurantsButtonText}>
              Search {selectedCuisines.length} Cuisine{selectedCuisines.length > 1 ? 's' : ''}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  headerActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 8, // Further reduced from 12 to 8
    paddingBottom: 60, // Further reduced from 80 to 60
  },
  scrollView: {
    flex: 1,
  },
  selectionInfo: {
    marginBottom: 8, // Further reduced from 12 to 8
    paddingHorizontal: 8,
  },
  selectionText: {
    fontSize: 14,
    color: '#666',
  },
  searchResultsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    width: ITEM_WIDTH,
    aspectRatio: 1.2, // Adjust as needed for 2 columns
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedGridItem: {
    borderColor: '#6B4EFF',
    borderWidth: 2,
  },
  cuisineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  flagImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  cuisineInfo: {
    flex: 1,
    marginRight: 10,
  },
  cuisineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cuisineRegion: {
    fontSize: 12,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#6B4EFF',
    borderColor: '#6B4EFF',
  },
  footer: {
    position: 'absolute',
    bottom: 5, // Further reduced from 10 to 5
    left: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8, // Further reduced from 10 to 8
    backgroundColor: '#6B4EFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  searchRestaurantsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B4EFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    justifyContent: 'center',
  },
  searchRestaurantsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF4B55',
    marginTop: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 