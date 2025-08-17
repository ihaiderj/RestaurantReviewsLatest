import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { AutocompleteSuggestion } from '@/utils/api';
import { DistanceSelector } from '@/components/DistanceSelector';


const { width } = Dimensions.get('window');

interface SearchDropdownProps {
  suggestions: AutocompleteSuggestion[];
  loading: boolean;
  visible: boolean;
  selectedSuggestions: AutocompleteSuggestion[];
  searchMode: 'near_me' | 'all';
  selectedDistance: number;
  onSuggestionSelect: (suggestion: AutocompleteSuggestion) => void;
  onSuggestionDeselect: (suggestion: AutocompleteSuggestion) => void;
  onSearchModeChange: (mode: 'near_me' | 'all') => void;
  onDistanceChange: (distance: number) => void;
  onClose: () => void;
  onApplySelections: () => void;
}

export default function SearchDropdown({ 
  suggestions, 
  loading, 
  visible, 
  selectedSuggestions,
  searchMode,
  selectedDistance,
  onSuggestionSelect, 
  onSuggestionDeselect,
  onSearchModeChange,
  onDistanceChange,
  onClose,
  onApplySelections
}: SearchDropdownProps) {
  if (!visible) {
    return null;
  }

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = [];
    }
    acc[suggestion.type].push(suggestion);
    return acc;
  }, {} as Record<string, AutocompleteSuggestion[]>);

  const categoryLabels = {
    restaurant: 'Restaurants',
    cuisine: 'Cuisines',
    venue_type: 'Venue Types',
    amenity: 'Amenities'
  };

  const categoryOrder = ['restaurant', 'cuisine', 'venue_type', 'amenity'];

  const getCategoryIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      restaurant: 'storefront-outline',
      cuisine: 'restaurant-outline',
      venue_type: 'business-outline',
      amenity: 'options-outline'
    };
    return iconMap[type] || 'search-outline';
  };

  const getCategoryColor = (type: string): string => {
    const colors = {
      restaurant: '#EF4444',
      cuisine: '#10B981',
      venue_type: '#F59E0B',
      amenity: '#8B5CF6'
    };
    return colors[type as keyof typeof colors] || '#6B7280';
  };

  const isSuggestionSelected = (suggestion: AutocompleteSuggestion): boolean => {
    return selectedSuggestions.some(selected => 
      selected.type === suggestion.type && selected.id === suggestion.id
    );
  };

  const handleSuggestionPress = (suggestion: AutocompleteSuggestion) => {
    if (isSuggestionSelected(suggestion)) {
      onSuggestionDeselect(suggestion);
    } else {
      onSuggestionSelect(suggestion);
    }
  };

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      
      {/* Dropdown */}
      <View style={styles.dropdown}>
        {/* Close Button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Integrated Distance Selector */}
        <View style={styles.distanceSection}>
          <DistanceSelector
            selectedDistance={selectedDistance}
            onDistanceChange={onDistanceChange}
            buttonStyle={styles.distanceButton}
            textStyle={styles.distanceButtonText}
            iconColor="#6B4EFF"
          />
        </View>

        {/* Header with selected count and apply button */}
        {selectedSuggestions.length > 0 && (
          <View style={styles.header}>
            <View style={styles.selectedHeader}>
              <ThemedText style={styles.selectedHeaderText}>
                Selected Items ({selectedSuggestions.length})
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.clearAllButton}
                onPress={() => selectedSuggestions.forEach(onSuggestionDeselect)}
              >
                <ThemedText style={styles.clearAllText}>Clear All</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={onApplySelections}
              >
                <ThemedText style={styles.applyText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Selected items display */}
        {selectedSuggestions.length > 0 && (
          <View style={styles.selectedSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.selectedScroll}
              scrollEventThrottle={16}
            >
              {selectedSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={`selected_${suggestion.type}_${suggestion.id}`}
                  style={styles.selectedChip}
                  onPress={() => onSuggestionDeselect(suggestion)}
                >
                  <View style={[
                    styles.selectedChipIcon,
                    { backgroundColor: getCategoryColor(suggestion.type) }
                  ]}>
                    <Ionicons name={getCategoryIcon(suggestion.type)} size={12} color="#fff" />
                  </View>
                  <ThemedText style={styles.selectedChipText} numberOfLines={1}>
                    {suggestion.name}
                  </ThemedText>
                  <Ionicons name="close" size={14} color="#6B7280" style={styles.selectedChipClose} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Searching...</ThemedText>
            </View>
          ) : suggestions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No suggestions found</ThemedText>
            </View>
          ) : (
            categoryOrder.map(category => {
              const categorySuggestions = groupedSuggestions[category];
              if (!categorySuggestions || categorySuggestions.length === 0) return null;

              return (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <ThemedText style={styles.categoryTitle}>
                      {categoryLabels[category as keyof typeof categoryLabels]}
                    </ThemedText>
                  </View>
                  
                  {categorySuggestions.map((suggestion) => {
                    const isSelected = isSuggestionSelected(suggestion);
                    
                    return (
                      <TouchableOpacity
                        key={`${suggestion.type}_${suggestion.id}`}
                        style={[
                          styles.suggestionItem,
                          isSelected && styles.selectedSuggestionItem
                        ]}
                        onPress={() => handleSuggestionPress(suggestion)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.iconContainer, 
                          { backgroundColor: getCategoryColor(suggestion.type) },
                          isSelected && styles.selectedIconContainer
                        ]}>
                          <Ionicons name={getCategoryIcon(suggestion.type)} size={18} color="#fff" />
                        </View>
                        
                        <View style={styles.suggestionContent}>
                          <ThemedText style={styles.suggestionTitle} numberOfLines={1}>
                            {suggestion.name}
                          </ThemedText>
                          {suggestion.display !== suggestion.name && (
                            <ThemedText style={styles.suggestionSubtitle} numberOfLines={1}>
                              {suggestion.display}
                            </ThemedText>
                          )}
                        </View>
                        
                        <View style={[styles.checkbox, isSelected && styles.selectedCheckbox]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
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
    top: 180, // Position below header and search box
    left: 16,
    right: 16,
    maxHeight: 390, // Increased by 30% (300 * 1.3 = 390)
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  distanceSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  distanceButton: {
    backgroundColor: '#F5F3FF',
    borderColor: '#6B4EFF',
    borderWidth: 1,
    minWidth: 120,
  },
  distanceButtonText: {
    color: '#6B4EFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  selectedHeader: {
    flex: 1,
  },
  selectedHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  headerActions: {
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
  clearAllText: {
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
  applyText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 390, // Increased by 30%
  },
  categorySection: {
    paddingVertical: 4,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedSuggestionItem: {
    backgroundColor: '#F5F3FF',
    borderLeftWidth: 3,
    borderLeftColor: '#6B4EFF',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    borderWidth: 2,
    borderColor: '#6B4EFF',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  selectedSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9EB',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  selectedChipIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  selectedChipText: {
    flex: 1,
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  selectedChipClose: {
    marginLeft: 6,
  },
}); 