import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAmenities, Amenity } from '@/utils/api';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 items per row with 16px padding on sides

// Helper function to get icon name based on amenity
const getAmenityIcon = (amenityName: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    // Parking amenities
    'Free Parking': 'car-outline',
    'Valet Parking': 'car-sport-outline',
    'Street Parking': 'location-outline',
    'Garage Parking': 'business-outline',
    
    // Kids amenities
    'High Chairs': 'happy-outline',
    'Kids Menu': 'restaurant-outline',
    'Play Area': 'game-controller-outline',
    'Baby Changing': 'person-outline',
    'Kids Friendly': 'heart-outline',
    
    // Accessibility
    'Wheelchair Accessible': 'accessibility-outline',
    'Disabled Parking': 'car-outline',
    'Elevator Access': 'arrow-up-circle-outline',
    
    // Payment & Technology
    'Credit Cards': 'card-outline',
    'WiFi': 'wifi-outline',
    'Mobile Payment': 'phone-portrait-outline',
    'Contactless Payment': 'radio-outline',
    
    // Dining Features
    'Outdoor Seating': 'leaf-outline',
    'Private Dining': 'lock-closed-outline',
    'Buffet': 'restaurant-outline',
    'Takeaway': 'bag-outline',
    'Delivery': 'bicycle-outline',
    'Drive Through': 'car-outline',
    'Bar': 'wine-outline',
    'Live Music': 'musical-notes-outline',
    'TV': 'tv-outline',
    
    // Service Features
    'Reservations': 'calendar-outline',
    'Online Booking': 'globe-outline',
    'Waiter Service': 'person-outline',
    'Self Service': 'hand-left-outline',
    'Air Conditioning': 'snow-outline',
    'Heating': 'flame-outline',
    
    // Special Features
    'Pet Friendly': 'paw-outline',
    'Smoking Area': 'cloud-outline',
    'Non Smoking': 'ban-outline',
    'Halal': 'checkmark-circle-outline',
    'Vegetarian': 'leaf-outline',
    'Vegan': 'nutrition-outline',
    'Organic': 'flower-outline',
  };
  
  // Try to find a match by checking if the amenity name contains any key
  for (const key in iconMap) {
    if (amenityName.toLowerCase().includes(key.toLowerCase())) {
      return iconMap[key];
    }
  }
  
  return 'options-outline';
};

// Helper function to get category color
const getCategoryColor = (categoryName: string): string => {
  const colorMap: { [key: string]: string } = {
    'Kids Amenities': '#10B981',
    'Parking Amenities': '#3B82F6',
    'Accessibility': '#8B5CF6',
    'Payment': '#F59E0B',
    'Dining': '#EF4444',
    'Service': '#06B6D4',
    'Special': '#84CC16',
  };
  
  for (const key in colorMap) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return colorMap[key];
    }
  }
  
  return '#6B7280';
};

export default function AmenitiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // State management
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [filteredAmenities, setFilteredAmenities] = useState<Amenity[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set()); // All groups collapsed by default

  // Load amenities from API
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🏨 Fetching amenities from API...');
        const amenityData = await getAmenities();
        console.log('🏨 Amenity data received:', amenityData.length, 'amenities');
        
        // Filter only active amenities
        const activeAmenities = amenityData.filter((amenity: Amenity) => amenity.is_active);
        console.log('🏨 Active amenities:', activeAmenities.length);
        
        setAmenities(activeAmenities);
        setFilteredAmenities(activeAmenities);
        
        // Pre-select amenities if returning from filter screen
        const currentAmenitiesParam = params.currentAmenities as string;
        if (currentAmenitiesParam) {
          console.log('🏨 Pre-selecting amenities from params:', currentAmenitiesParam);
          const currentAmenityCodes = currentAmenitiesParam.split(',').map(c => c.trim());
          const amenityIdsToSelect = activeAmenities
            .filter((amenity: Amenity) => currentAmenityCodes.includes(amenity.code))
            .map((amenity: Amenity) => amenity.id);
          
          console.log('🏨 Pre-selecting amenity IDs:', amenityIdsToSelect);
          setSelectedAmenities(amenityIdsToSelect);
        }
      } catch (err) {
        console.error('❌ Error fetching amenities:', err);
        setError('Failed to load amenities. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAmenities();
  }, [params.currentAmenities]);

  // Filter amenities based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAmenities(amenities);
    } else {
      const filtered = amenities.filter(amenity =>
        amenity.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amenity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amenity.super_category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amenity.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAmenities(filtered);
    }
  }, [searchQuery, amenities]);

  // Toggle amenity selection
  const toggleAmenitySelection = (amenityId: number) => {
    setSelectedAmenities(prev => {
      if (prev.includes(amenityId)) {
        return prev.filter(id => id !== amenityId);
      } else {
        return [...prev, amenityId];
      }
    });
  };

  // Toggle group collapse state
  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Initialize all groups as collapsed after amenities load
  useEffect(() => {
    if (amenities.length > 0) {
      const groupNames = [...new Set(amenities.map(amenity => amenity.super_category?.name || 'Other'))];
      setCollapsedGroups(new Set(groupNames)); // Collapse all groups by default
    }
  }, [amenities]);

  // Handle search restaurants
  const handleSearchRestaurants = () => {
    if (selectedAmenities.length === 0) {
      return;
    }

    // Get selected amenity codes
    const selectedAmenityCodes = amenities
      .filter(amenity => selectedAmenities.includes(amenity.id))
      .map(amenity => amenity.code);
    
    console.log('🏨 Searching restaurants for amenities:', selectedAmenityCodes);
    
    // Check if we're returning to filter screen
    const isReturning = params.returnToFilter === 'true';
    
    if (isReturning) {
      // Navigate back to filter screen with updated amenities
      router.push({
        pathname: '/filter-restaurants',
        params: { 
          title: `Selected Amenities (${selectedAmenities.length})`,
          amenities: selectedAmenityCodes.join(','),
          latitude: params.latitude,
          longitude: params.longitude,
          showDistancePrompt: 'false' // Don't show distance prompt again
        }
      });
    } else {
      // Navigate to filter screen with new amenities
      router.push({
        pathname: '/filter-restaurants',
        params: { 
          title: `Selected Amenities (${selectedAmenities.length})`,
          amenities: selectedAmenityCodes.join(','),
          latitude: params.latitude,
          longitude: params.longitude
        }
      });
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAmenities.length === filteredAmenities.length) {
      setSelectedAmenities([]);
    } else {
      setSelectedAmenities(filteredAmenities.map(amenity => amenity.id));
    }
  };

  // Handle clear all
  const handleClearAll = () => {
    setSelectedAmenities([]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
          <ThemedText style={styles.loadingText}>Loading amenities...</ThemedText>
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

  // Group amenities by super category
  const groupedAmenities = filteredAmenities.reduce((acc, amenity) => {
    const superCategoryName = amenity.super_category?.name || 'Other';
    if (!acc[superCategoryName]) {
      acc[superCategoryName] = [];
    }
    acc[superCategoryName].push(amenity);
    return acc;
  }, {} as { [key: string]: Amenity[] });

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
          <ThemedText style={styles.headerTitle}>Amenities</ThemedText>
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
            placeholder="Search amenities..."
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
            {selectedAmenities.length} of {filteredAmenities.length} amenities selected
          </ThemedText>
          {searchQuery.length > 0 && (
            <ThemedText style={styles.searchResultsText}>
              Showing {filteredAmenities.length} results for "{searchQuery}"
            </ThemedText>
          )}
        </View>

        {Object.entries(groupedAmenities).map(([superCategory, categoryAmenities]) => {
          const isCollapsed = collapsedGroups.has(superCategory);
          const selectedCount = categoryAmenities.filter(amenity => selectedAmenities.includes(amenity.id)).length;
          
          return (
            <View key={superCategory} style={styles.categorySection}>
              <TouchableOpacity 
                style={styles.categoryHeader}
                onPress={() => toggleGroupCollapse(superCategory)}
              >
                <View style={styles.categoryTitleRow}>
                  <ThemedText style={styles.categoryTitle}>{superCategory}</ThemedText>
                  {selectedCount > 0 && (
                    <View style={styles.selectedBadge}>
                      <ThemedText style={styles.selectedBadgeText}>{selectedCount}</ThemedText>
                    </View>
                  )}
                </View>
                <Ionicons 
                  name={isCollapsed ? "chevron-down" : "chevron-up"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {!isCollapsed && (
                <View style={styles.grid}>
              {categoryAmenities.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity.id);
                const iconName = getAmenityIcon(amenity.name);
                const categoryColor = getCategoryColor(amenity.super_category?.name || 'Other');
                
                return (
                  <TouchableOpacity
                    key={amenity.id}
                    style={[styles.gridItem, isSelected && styles.selectedGridItem]}
                    onPress={() => toggleAmenitySelection(amenity.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.amenityContainer}>
                      <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
                        <Ionicons name={iconName} size={28} color={isSelected ? "#6B4EFF" : categoryColor} />
                      </View>
                      <View style={styles.amenityInfo}>
                        <ThemedText style={styles.amenityName} numberOfLines={2}>
                          {amenity.name}
                        </ThemedText>
                        {amenity.description && (
                          <ThemedText style={styles.amenityDescription} numberOfLines={2}>
                            {amenity.description}
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
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Footer */}
      {selectedAmenities.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.searchRestaurantsButton}
            onPress={handleSearchRestaurants}
          >
            <Ionicons name="search" size={20} color="#fff" style={styles.buttonIcon} />
            <ThemedText style={styles.searchRestaurantsButtonText}>
              Search {selectedAmenities.length} Amenit{selectedAmenities.length > 1 ? 'ies' : 'y'}
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
    paddingBottom: 80,
  },
  scrollView: {
    flex: 1,
  },
  selectionInfo: {
    marginBottom: 24,
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
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  selectedBadge: {
    backgroundColor: '#6B4EFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  amenityContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  amenityInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  amenityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  amenityDescription: {
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