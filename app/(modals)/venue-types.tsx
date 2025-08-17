import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getVenueTypes, VenueType } from '@/utils/api';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 items per row with 16px padding on sides

// Helper function to get icon name based on venue type
const getVenueTypeIcon = (venueTypeName: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    'Casual Dining': 'restaurant-outline',
    'Fine Dining': 'wine-outline',
    'Fast Food': 'fast-food-outline',
    'Cafe': 'cafe-outline',
    'Bar': 'wine-outline',
    'Pub': 'beer-outline',
    'Bakery': 'storefront-outline',
    'Food Truck': 'car-outline',
    'Buffet': 'restaurant-outline',
    'Takeaway': 'bag-outline',
    'Delivery Only': 'bicycle-outline',
    'Child Friendly': 'happy-outline',
    'Rooftop': 'home-outline',
    'Outdoor Seating': 'leaf-outline',
    'Drive-Through': 'car-sport-outline',
  };
  
  return iconMap[venueTypeName] || 'business-outline';
};

export default function VenueTypesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // State management
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [filteredVenueTypes, setFilteredVenueTypes] = useState<VenueType[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load venue types from API
  useEffect(() => {
    const fetchVenueTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🏪 Fetching venue types from API...');
        const venueTypeData = await getVenueTypes();
        console.log('🏪 Venue type data received:', venueTypeData.length, 'venue types');
        
        // Filter only active venue types
        const activeVenueTypes = venueTypeData.filter((venueType: VenueType) => venueType.is_active);
        console.log('🏪 Active venue types:', activeVenueTypes.length);
        
        setVenueTypes(activeVenueTypes);
        setFilteredVenueTypes(activeVenueTypes);
        
        // Pre-select venue types if returning from filter screen
        const currentVenueTypesParam = params.currentVenueTypes as string;
        if (currentVenueTypesParam) {
          console.log('🏪 Pre-selecting venue types from params:', currentVenueTypesParam);
          const currentVenueTypeCodes = currentVenueTypesParam.split(',').map(c => c.trim());
          const venueTypeIdsToSelect = activeVenueTypes
            .filter((venueType: VenueType) => currentVenueTypeCodes.includes(venueType.code))
            .map((venueType: VenueType) => venueType.id);
          
          console.log('🏪 Pre-selecting venue type IDs:', venueTypeIdsToSelect);
          setSelectedVenueTypes(venueTypeIdsToSelect);
        }
      } catch (err) {
        console.error('❌ Error fetching venue types:', err);
        setError('Failed to load venue types. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVenueTypes();
  }, [params.currentVenueTypes]);

  // Filter venue types based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredVenueTypes(venueTypes);
    } else {
      const filtered = venueTypes.filter(venueType =>
        venueType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venueType.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVenueTypes(filtered);
    }
  }, [searchQuery, venueTypes]);

  // Toggle venue type selection
  const toggleVenueTypeSelection = (venueTypeId: number) => {
    setSelectedVenueTypes(prev => {
      if (prev.includes(venueTypeId)) {
        return prev.filter(id => id !== venueTypeId);
      } else {
        return [...prev, venueTypeId];
      }
    });
  };

  // Handle search restaurants
  const handleSearchRestaurants = () => {
    if (selectedVenueTypes.length === 0) {
      return;
    }

    // Get selected venue type codes
    const selectedVenueTypeCodes = venueTypes
      .filter(venueType => selectedVenueTypes.includes(venueType.id))
      .map(venueType => venueType.code);
    
    console.log('🏪 Searching restaurants for venue types:', selectedVenueTypeCodes);
    
    // Check if we're returning to filter screen
    const isReturning = params.returnToFilter === 'true';
    
    if (isReturning) {
      // Navigate back to filter screen with updated venue types
      router.push({
        pathname: '/filter-restaurants',
        params: { 
          title: `Selected Venue Types (${selectedVenueTypes.length})`,
          venue_types: selectedVenueTypeCodes.join(','),
          latitude: params.latitude,
          longitude: params.longitude,
          showDistancePrompt: 'false' // Don't show distance prompt again
        }
      });
    } else {
      // Navigate to filter screen with new venue types
      router.push({
        pathname: '/filter-restaurants',
        params: { 
          title: `Selected Venue Types (${selectedVenueTypes.length})`,
          venue_types: selectedVenueTypeCodes.join(','),
          latitude: params.latitude,
          longitude: params.longitude
        }
      });
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedVenueTypes.length === filteredVenueTypes.length) {
      setSelectedVenueTypes([]);
    } else {
      setSelectedVenueTypes(filteredVenueTypes.map(venueType => venueType.id));
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    setSelectedVenueTypes([]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
          <ThemedText style={styles.loadingText}>Loading venue types...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setError(null);
            setLoading(true);
          }}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Venue Types</ThemedText>
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
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venue types..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        style={styles.scrollView}
      >
        <View style={styles.selectionInfo}>
          <ThemedText style={styles.selectionText}>
            {selectedVenueTypes.length} of {filteredVenueTypes.length} venue types selected
          </ThemedText>
          {searchQuery.length > 0 && (
            <ThemedText style={styles.searchResultsText}>
              Showing {filteredVenueTypes.length} results for "{searchQuery}"
            </ThemedText>
          )}
        </View>

        <View style={styles.grid}>
          {filteredVenueTypes.map((venueType) => {
            const isSelected = selectedVenueTypes.includes(venueType.id);
            const iconName = getVenueTypeIcon(venueType.name);
            
            return (
              <TouchableOpacity
                key={venueType.id}
                style={[styles.gridItem, isSelected && styles.selectedGridItem]}
                onPress={() => toggleVenueTypeSelection(venueType.id)}
                activeOpacity={0.8}
              >
                <View style={styles.venueTypeContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={iconName} size={32} color={isSelected ? "#6B4EFF" : "#6B7280"} />
                  </View>
                  <View style={styles.venueTypeInfo}>
                    <ThemedText style={styles.venueTypeName} numberOfLines={2}>
                      {venueType.name}
                    </ThemedText>
                    {venueType.description && (
                      <ThemedText style={styles.venueTypeDescription} numberOfLines={2}>
                        {venueType.description}
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

      {/* Footer */}
      {selectedVenueTypes.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.searchRestaurantsButton}
            onPress={handleSearchRestaurants}
          >
            <Ionicons name="search" size={20} color="#fff" style={styles.buttonIcon} />
            <ThemedText style={styles.searchRestaurantsButtonText}>
              Search {selectedVenueTypes.length} Venue Type{selectedVenueTypes.length > 1 ? 's' : ''}
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginRight: 16,
  },
  headerActionText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  selectionInfo: {
    marginBottom: 16,
  },
  selectionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  searchResultsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedGridItem: {
    borderColor: '#6B4EFF',
    backgroundColor: '#F5F3FF',
  },
  venueTypeContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  venueTypeInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  venueTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  venueTypeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#6B4EFF',
    borderColor: '#6B4EFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  searchRestaurantsButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  searchRestaurantsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});