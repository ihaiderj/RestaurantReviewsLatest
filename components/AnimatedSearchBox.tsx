import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  StyleSheet, 
  Dimensions,
  Text,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AutocompleteSuggestion } from '@/utils/api';

const { width } = Dimensions.get('window');

interface AnimatedSearchBoxProps {
  onSearch: (query: string) => void;
  onTextChange: (text: string) => void;
  onFocus: () => void;
  placeholder?: string;
  phrases: string[];
  selectedSuggestions: AutocompleteSuggestion[];
  onSuggestionRemove: (suggestion: AutocompleteSuggestion) => void;
  onProceedWithSelections?: () => void;
  dropdownOpen?: boolean;
  searchQuery?: string; // Add this prop to sync with parent
}

export default function AnimatedSearchBox({
  onSearch,
  onTextChange,
  onFocus,
  placeholder = "Search restaurants, cuisines...",
  phrases,
  selectedSuggestions,
  onSuggestionRemove,
  onProceedWithSelections,
  dropdownOpen = false, // Add this prop with default value
  searchQuery // Add this prop
}: AnimatedSearchBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Sync searchText with parent's searchQuery
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearchText(searchQuery);
      setIsTyping(searchQuery.length > 0);
    }
  }, [searchQuery]);

  // Animation logic
  useEffect(() => {
    if (!isFocused && searchText.length === 0 && selectedSuggestions.length === 0 && !isTyping) {
      // Start animation when not focused, no text, no selections, and not typing
      const animation = Animated.loop(
        Animated.sequence([
          // Fade in from bottom to center (0 to 1)
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          // Stay visible in center (1 to 1 - no change, just delay)
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          // Fade out from center to top (1 to 2)
          Animated.timing(animatedValue, {
            toValue: 2,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      
      // Change phrase every 5 seconds (1.5s fade in + 2s stay + 1.5s fade out)
      const phraseInterval = setInterval(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, 5000);
      
      return () => {
        animation.stop();
        clearInterval(phraseInterval);
      };
    } else {
      // Stop animation and reset when there are selections, text, or focus
      animatedValue.setValue(0);
    }
  }, [isFocused, searchText, selectedSuggestions.length, isTyping, phrases.length]);

  const handlePress = () => {
    console.log('Search box pressed, selectedSuggestions:', selectedSuggestions.length);
    
    // Set to focused and typing mode immediately
    setIsFocused(true);
    setIsTyping(true);
    
    // Single focus attempt - let the TextInput's onFocus handle the rest
    setTimeout(() => {
      console.log('Attempting to focus inputRef.current');
      inputRef.current?.focus();
    }, 50);
  };

  const handleFocus = () => {
    console.log('Focusing input...');
    setIsFocused(true);
    
    // Small delay to ensure state updates before focusing the visible TextInput
    setTimeout(() => {
      inputRef.current?.focus();
      console.log('Input focused');
    }, 50);
  };

  const handleBlur = () => {
    console.log('Input blurred, dropdownOpen:', dropdownOpen);
    
    // Don't clear if dropdown is open - user might be selecting a suggestion
    if (dropdownOpen) {
      console.log('Dropdown is open, keeping focus state');
      return;
    }
    
    // When dropdown closes, show selected suggestions instead of typed text
    if (selectedSuggestions.length > 0) {
      setIsFocused(false);
      setIsTyping(false);
      setSearchText(''); // Clear the typed text
      onTextChange(''); // Clear the parent's search text
      console.log('Dropdown closed, showing selected suggestions');
      return;
    }
    
    setIsFocused(false);
    setIsTyping(false);
    setSearchText('');
    onTextChange('');
  };

  const handleTextChange = (text: string) => {
    console.log('TextInput onChangeText called with:', text);
    console.log('Current selectedSuggestions:', selectedSuggestions.map(s => s.name));
    
    // Extract only the new text being typed (after the comma)
    let newText = text;
    if (selectedSuggestions.length > 0) {
      const selectionNames = selectedSuggestions.map(s => s.name);
      const selectionsText = selectionNames.join(', ');
      
      console.log('Selections text:', selectionsText);
      console.log('Full text received:', text);
      
      // Check if the text starts with selections followed by comma
      if (text.startsWith(selectionsText + ', ')) {
        newText = text.substring(selectionsText.length + 2); // Remove selections + ", "
        console.log('Extracted new text (with comma):', newText);
      } else if (text === selectionsText) {
        // User deleted the comma and new text, show only selections
        newText = '';
        console.log('User deleted new text, showing only selections');
      } else if (text.startsWith(selectionsText)) {
        // User is typing right after selections without comma
        newText = text.substring(selectionsText.length);
        console.log('Extracted new text (without comma):', newText);
      }
    }
    
    console.log('Final newText to send to API:', newText);
    setSearchText(newText);
    setIsTyping(newText.length > 0);
    
    // Only call onFocus (which shows suggestions) when user starts typing
    if (newText.length > 0 && !isTyping) {
      onFocus();
    }
    
    // Send only the new text to the parent for API calls
    onTextChange(newText);
    
    // Force cursor to the end when typing with selections
    if (selectedSuggestions.length > 0 && newText.length > 0) {
      // Use multiple timeouts to ensure cursor positioning works
      setTimeout(() => {
        const displayText = `${selectedSuggestions.map(s => s.name).join(', ')}, ${newText}`;
        if (inputRef.current && displayText.length > 0) {
          inputRef.current.setNativeProps({
            selection: { start: displayText.length, end: displayText.length }
          });
        }
      }, 10);
      
      setTimeout(() => {
        const displayText = `${selectedSuggestions.map(s => s.name).join(', ')}, ${newText}`;
        if (inputRef.current && displayText.length > 0) {
          inputRef.current.setNativeProps({
            selection: { start: displayText.length, end: displayText.length }
          });
        }
      }, 50);
      
      // Also use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        const displayText = `${selectedSuggestions.map(s => s.name).join(', ')}, ${newText}`;
        if (inputRef.current && displayText.length > 0) {
          inputRef.current.setNativeProps({
            selection: { start: displayText.length, end: displayText.length }
          });
        }
      });
    }
  };

  // Ensure cursor is positioned at the end when typing with selections
  useEffect(() => {
    if (isTyping && selectedSuggestions.length > 0 && inputRef.current) {
      // Use multiple approaches to ensure cursor positioning works
      const positionCursor = () => {
        const displayText = getDisplayText();
        console.log('Positioning cursor for text:', displayText, 'length:', displayText.length);
        if (displayText.length > 0) {
          inputRef.current?.setNativeProps({
            selection: { start: displayText.length, end: displayText.length }
          });
        }
      };
      
      // Try multiple times with different delays
      setTimeout(positionCursor, 10);
      setTimeout(positionCursor, 50);
      setTimeout(positionCursor, 100);
      
      // Also use requestAnimationFrame
      requestAnimationFrame(positionCursor);
    }
  }, [isTyping, searchText, selectedSuggestions]);

  const handleSubmit = () => {
    const allSelections = selectedSuggestions.map(s => s.name).join(', ');
    const finalQuery = searchText ? `${allSelections} ${searchText}`.trim() : allSelections;
    onSearch(finalQuery);
  };

  const handleClear = () => {
    setSearchText('');
    setIsTyping(false);
    onTextChange('');
  };

  const handleRemoveIndividualSuggestion = (suggestion: AutocompleteSuggestion) => {
    onSuggestionRemove(suggestion);
  };

  const handleClearSelections = () => {
    // Clear all selections by calling onSuggestionRemove for each one
    selectedSuggestions.forEach(suggestion => {
      onSuggestionRemove(suggestion);
    });
  };

  const getDisplayText = (): string => {
    console.log('getDisplayText called - isTyping:', isTyping, 'searchText:', searchText, 'selectedSuggestions:', selectedSuggestions.map(s => s.name));
    
    if (isTyping) {
      // When typing, show selections + new text (but hide "more")
      const selectionNames = selectedSuggestions.map(s => s.name);
      if (selectionNames.length > 0) {
        const displayText = `${selectionNames.join(', ')}, ${searchText}`;
        console.log('Display text (typing with selections):', displayText);
        return displayText;
      }
      console.log('Display text (typing without selections):', searchText);
      return searchText;
    }
    
    if (selectedSuggestions.length > 0) {
      const selectionNames = selectedSuggestions.map(s => s.name);
      if (selectionNames.length <= 3) {
        const displayText = selectionNames.join(', ');
        console.log('Display text (selections <= 3):', displayText);
        return displayText;
      } else {
        const displayText = selectionNames.slice(0, 3).join(', ');
        console.log('Display text (selections > 3):', displayText);
        return displayText;
      }
    }
    
    console.log('Display text (empty):', '');
    return '';
  };

  const shouldShowMore = (): boolean => {
    // Since we're now showing all chips in a scrollable view, we don't need the "more" text
    return false;
  };

  const getMoreText = (): string => {
    return `+${selectedSuggestions.length - 3} more`;
  };

  // Improved cursor positioning
  const positionCursorAtEnd = useCallback(() => {
    if (inputRef.current && isTyping && selectedSuggestions.length > 0) {
      const displayText = getDisplayText();
      if (displayText.length > 0) {
        // Use multiple approaches to ensure cursor positioning works
        setTimeout(() => {
          inputRef.current?.setNativeProps({
            selection: { start: displayText.length, end: displayText.length }
          });
        }, 10);
        
        requestAnimationFrame(() => {
          inputRef.current?.setNativeProps({
            selection: { start: displayText.length, end: displayText.length }
          });
        });
      }
    }
  }, [isTyping, selectedSuggestions, searchText]);

  // Ensure chips are shown when dropdown closes (disabled temporarily to fix keyboard issue)
  // useEffect(() => {
  //   if (!dropdownOpen && selectedSuggestions.length > 0 && isTyping) {
  //     setIsFocused(false);
  //     setIsTyping(false);
  //     setSearchText('');
  //     onTextChange('');
  //   }
  // }, [dropdownOpen, selectedSuggestions.length, isTyping]);

  // Position cursor at the end when typing with selections
  useEffect(() => {
    positionCursorAtEnd();
  }, [positionCursorAtEnd]);

  return (
    <>
      <TouchableOpacity 
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.textContainer}>
          {isFocused || isTyping || selectedSuggestions.length > 0 ? (
            <View style={styles.inputContainer}>
              {/* Always render TextInput - change visibility and content based on state */}
              <TextInput
                ref={inputRef}
                style={[
                  styles.textInput,
                  { 
                    color: isTyping ? '#333' : '#999',
                    opacity: (isTyping || selectedSuggestions.length === 0) ? 1 : 0,
                    zIndex: (isTyping || selectedSuggestions.length === 0) ? 1 : 0
                  }
                ]}
                value={getDisplayText()}
                onChangeText={handleTextChange}
                onFocus={() => {
                  console.log('TextInput focused - mode:', isTyping ? 'typing' : 'chips');
                  setIsFocused(true);
                  if (!isTyping && selectedSuggestions.length > 0) {
                    console.log('Switching from chips to typing mode');
                    setIsTyping(true);
                    // Position cursor at the end when switching from chips to typing
                    setTimeout(() => {
                      const displayText = getDisplayText();
                      if (displayText.length > 0 && inputRef.current) {
                        inputRef.current.setNativeProps({
                          selection: { start: displayText.length, end: displayText.length }
                        });
                      }
                    }, 50);
                  }
                  handleFocus();
                }}
                onBlur={handleBlur}
                onSubmitEditing={handleSubmit}
                placeholder={placeholder}
                placeholderTextColor="#999"
                autoCorrect={false}
                autoCapitalize="none"
                numberOfLines={1}
              />
              
              {/* Show chips overlay when not typing and have selections */}
              {!isTyping && selectedSuggestions.length > 0 && (
                <View style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center'
                }}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    pointerEvents="box-none"
                  >
                    <View style={styles.suggestionsContainer}>
                        {selectedSuggestions.map((suggestion, index) => (
                          <View key={`${suggestion.type}_${suggestion.id}`} style={styles.suggestionChip}>
                            <Text style={styles.suggestionChipText}>{suggestion.name}</Text>
                            <TouchableOpacity
                              style={styles.suggestionChipRemove}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleRemoveIndividualSuggestion(suggestion);
                              }}
                            >
                              <Ionicons name="close-circle" size={14} color="#999" />
                            </TouchableOpacity>
                          </View>
                        ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <>
              <Animated.Text
                style={[
                  styles.animatedText,
                  {
                    opacity: animatedValue.interpolate({
                      inputRange: [0, 0.2, 1.8, 2],
                      outputRange: [0, 1, 1, 0],
                    }),
                    transform: [{
                      translateY: animatedValue.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: [30, 0, -30],
                      }),
                    }],
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {phrases[currentPhraseIndex]}
              </Animated.Text>
              
              {/* Invisible TextInput for tap handling during animation */}
              <TextInput
                style={[
                  styles.textInput, 
                  { 
                    opacity: 0, 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1
                  }
                ]}
                onFocus={handleFocus}
                editable={true}
                value=""
                onChangeText={() => {}}
              />
            </>
          )}
        </View>

        {/* Action Icons */}
        <View style={styles.actionIcons}>
          {/* Edit Icon - Show when there are selections and not typing */}
          {selectedSuggestions.length > 0 && !isTyping && (
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={() => {
                setIsFocused(true);
                setIsTyping(true);
                onFocus();
              }}
            >
              <Ionicons name="create-outline" size={18} color="#6B4EFF" />
            </TouchableOpacity>
          )}

          {/* Clear Selections Icon */}
          {selectedSuggestions.length > 0 && !isTyping && (
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={handleClearSelections}
            >
              <Ionicons name="close-circle" size={18} color="#EF4444" />
            </TouchableOpacity>
          )}

          {/* Clear Text Icon */}
          {isTyping && searchText.length > 0 && (
            <TouchableOpacity
              style={styles.actionIcon}
              onPress={handleClear}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}

          {/* Search Icon - Always visible */}
          <TouchableOpacity
            style={styles.actionIcon}
            onPress={selectedSuggestions.length > 0 ? onProceedWithSelections : handleSubmit}
          >
            <Ionicons name="search" size={18} color="#6B4EFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    flex: 1,
    backgroundColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textContainer: {
    flex: 1,
    minHeight: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  animatedText: {
    fontSize: 16,
    color: '#999',
    paddingLeft: 16,
    width: '100%',
    position: 'absolute',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    width: '100%',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionIcon: {
    marginLeft: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moreButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginLeft: 8,
  },
  moreText: {
    fontSize: 12,
    color: '#6B4EFF',
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8, // Add some padding at the end for better scrolling
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  suggestionChipText: {
    fontSize: 14,
    color: '#6B4EFF',
    fontWeight: '500',
    marginRight: 4,
    flexShrink: 1,
  },
  suggestionChipRemove: {
    padding: 2,
    marginLeft: 2,
  },
}); 