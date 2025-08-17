import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { getAutocompleteSuggestions, AutocompleteSuggestion } from '@/utils/api';
import { CacheHelpers } from '@/utils/cache';

const { width } = Dimensions.get('window');

interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  category: 'recent' | 'restaurant' | 'cuisine' | 'venue_type' | 'amenity';
  icon: keyof typeof Ionicons.glyphMap;
  data?: any; // Additional data for the suggestion
}

interface SearchSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onClose: () => void;
  isVisible: boolean;
  multiSelect?: boolean;
  selectedSuggestions?: SearchSuggestion[];
  onMultiSelectChange?: (suggestions: SearchSuggestion[]) => void;
}

export default function SearchSuggestions({ 
  query, 
  onSuggestionSelect, 
  onClose, 
  isVisible, 
  multiSelect = false,
  selectedSuggestions = [],
  onMultiSelectChange 
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Load recent searches from cache
  const loadRecentSearches = async () => {
    try {
      const recent = await CacheHelpers.getSearchHistory();
      setRecentSearches(Array.isArray(recent) ? recent : []);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Convert autocomplete suggestions to search suggestions
  const convertAutocompleteToSearchSuggestions = (autocompleteSuggestions: AutocompleteSuggestion[]): SearchSuggestion[] => {
    return autocompleteSuggestions.map((suggestion, index) => {
      const categoryMap = {
        restaurant: 'restaurant' as const,
        cuisine: 'cuisine' as const,
        venue_type: 'venue_type' as const,
        amenity: 'amenity' as const,
      };

      const iconMap = {
        restaurant: 'storefront-outline' as const,
        cuisine: 'restaurant-outline' as const,
        venue_type: 'business-outline' as const,
        amenity: 'options-outline' as const,
      };

      return {
        id: `${suggestion.type}_${suggestion.id}`,
        title: suggestion.name,
        subtitle: suggestion.display !== suggestion.name ? suggestion.display : undefined,
        category: categoryMap[suggestion.type],
        icon: iconMap[suggestion.type],
        data: suggestion
      };
    });
  };

  // Generate suggestions based on query using new autocomplete API
  const generateSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // Show recent searches when no query
      const recentSuggestions: SearchSuggestion[] = recentSearches.slice(0, 5).map((search, index) => ({
        id: `recent_${index}`,
        title: search,
        category: 'recent',
        icon: 'time-outline',
        subtitle: 'Recent search'
      }));
      
      setSuggestions(recentSuggestions);
      return;
    }

    setLoading(true);

    try {
      // Use the new autocomplete API
      const autocompleteSuggestions = await getAutocompleteSuggestions(searchQuery, 8);
      
      // Convert to search suggestions format
      const apiSuggestions = convertAutocompleteToSearchSuggestions(autocompleteSuggestions);

      // Add recent searches that match the query
      const matchingRecent = recentSearches
        .filter(search => search.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 2)
        .map((search, index) => ({
          id: `recent_match_${index}`,
          title: search,
          category: 'recent' as const,
          icon: 'time-outline' as const,
          subtitle: 'Recent search'
        }));

      const allSuggestions = [...apiSuggestions, ...matchingRecent];
      setSuggestions(allSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [recentSearches]);

  // Update suggestions when query changes
  useEffect(() => {
    if (isVisible) {
      const timeoutId = setTimeout(() => {
        generateSuggestions(query);
      }, 300); // Debounce for 300ms

      return () => clearTimeout(timeoutId);
    }
  }, [query, isVisible, generateSuggestions]);

  // Handle suggestion selection
  const handleSuggestionPress = async (suggestion: SearchSuggestion) => {
    // Add to recent searches if it's not already there
    if (suggestion.category !== 'recent') {
      await CacheHelpers.addSearchTerm(suggestion.title);
      await loadRecentSearches(); // Refresh recent searches
    }

    if (multiSelect && onMultiSelectChange) {
      // Multi-select mode
      const isSelected = selectedSuggestions.some(s => s.id === suggestion.id);
      let updatedSelections;
      
      if (isSelected) {
        // Remove from selection
        updatedSelections = selectedSuggestions.filter(s => s.id !== suggestion.id);
      } else {
        // Add to selection
        updatedSelections = [...selectedSuggestions, suggestion];
      }
      
      onMultiSelectChange(updatedSelections);
    } else {
      // Single select mode
      onSuggestionSelect(suggestion);
    }
  };

  // Check if suggestion is selected (for multi-select mode)
  const isSuggestionSelected = (suggestion: SearchSuggestion): boolean => {
    return selectedSuggestions.some(s => s.id === suggestion.id);
  };

  // Apply selections in multi-select mode
  const applyMultipleSelections = () => {
    if (selectedSuggestions.length > 0) {
      // Create a complex filter action
      onSuggestionSelect({
        id: 'multi_select',
        title: `${selectedSuggestions.length} filters selected`,
        category: 'recent',
        icon: 'checkmark-circle-outline',
        data: selectedSuggestions
      });
    }
    onClose();
  };

  // Clear recent searches
  const clearRecentSearches = async () => {
    try {
      await CacheHelpers.clearSearchHistory();
      setRecentSearches([]);
      setSuggestions([]);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  // Group suggestions by category
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = [];
    }
    acc[suggestion.category].push(suggestion);
    return acc;
  }, {} as Record<string, SearchSuggestion[]>);

  const categoryLabels = {
    recent: 'Recent Searches',
    restaurant: 'Restaurants',
    cuisine: 'Cuisines',
    venue_type: 'Venue Types',
    amenity: 'Amenities'
  };

  const categoryOrder = ['restaurant', 'cuisine', 'venue_type', 'amenity', 'recent'];

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      
      {/* Suggestions Dropdown */}
      <View style={styles.dropdown}>
        {/* Multi-select header */}
        {multiSelect && (
          <View style={styles.multiSelectHeader}>
            <ThemedText style={styles.multiSelectTitle}>
              Select multiple filters ({selectedSuggestions.length} selected)
            </ThemedText>
            <View style={styles.multiSelectActions}>
              {selectedSuggestions.length > 0 && (
                <TouchableOpacity onPress={() => onMultiSelectChange?.([])} style={styles.clearAllButton}>
                  <ThemedText style={styles.clearAllButtonText}>Clear All</ThemedText>
                </TouchableOpacity>
              )}
              {selectedSuggestions.length > 0 && (
                <TouchableOpacity onPress={applyMultipleSelections} style={styles.applyButton}>
                  <ThemedText style={styles.applyButtonText}>Apply ({selectedSuggestions.length})</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {categoryOrder.map(category => {
            const categorySuggestions = groupedSuggestions[category];
            if (!categorySuggestions || categorySuggestions.length === 0) return null;

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <ThemedText style={styles.categoryTitle}>
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </ThemedText>
                  {category === 'recent' && recentSearches.length > 0 && (
                    <TouchableOpacity onPress={clearRecentSearches} style={styles.clearButton}>
                      <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
                
                {categorySuggestions.map((suggestion) => {
                  const isSelected = multiSelect && isSuggestionSelected(suggestion);
                  
                  return (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={[
                        styles.suggestionItem,
                        isSelected && styles.selectedSuggestionItem
                      ]}
                      onPress={() => handleSuggestionPress(suggestion)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.iconContainer, 
                        { backgroundColor: getCategoryColor(suggestion.category) },
                        isSelected && styles.selectedIconContainer
                      ]}>
                        <Ionicons name={suggestion.icon} size={20} color="#fff" />
                      </View>
                      
                      <View style={styles.suggestionContent}>
                        <ThemedText style={styles.suggestionTitle} numberOfLines={1}>
                          {suggestion.title}
                        </ThemedText>
                        {suggestion.subtitle && (
                          <ThemedText style={styles.suggestionSubtitle} numberOfLines={1}>
                            {suggestion.subtitle}
                          </ThemedText>
                        )}
                      </View>
                      
                      {multiSelect ? (
                        <View style={[styles.checkbox, isSelected && styles.selectedCheckbox]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                      ) : (
                        <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Searching...</ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// Helper function to get category colors
function getCategoryColor(category: string): string {
  const colors = {
    recent: '#6B7280',
    restaurant: '#EF4444',
    cuisine: '#10B981',
    venue_type: '#F59E0B',
    amenity: '#8B5CF6'
  };
  return colors[category as keyof typeof colors] || '#6B7280';
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdown: {
    position: 'absolute',
    top: 120, // Position below search bar
    left: 16,
    right: 16,
    maxHeight: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollView: {
    maxHeight: 400,
  },
  categorySection: {
    paddingVertical: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#6B4EFF',
    fontWeight: '500',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  // Multi-select styles
  multiSelectHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  multiSelectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  multiSelectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  clearAllButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  applyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#6B4EFF',
  },
  applyButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  selectedSuggestionItem: {
    backgroundColor: '#F5F3FF',
    borderLeftWidth: 3,
    borderLeftColor: '#6B4EFF',
  },
  selectedIconContainer: {
    borderWidth: 2,
    borderColor: '#6B4EFF',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#6B4EFF',
    borderColor: '#6B4EFF',
  },
});