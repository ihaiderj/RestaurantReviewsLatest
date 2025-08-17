import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
  Animated,
  TextInput,
  Share,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { 
  getRestaurantById, 
  getMenuItemsWithCategories, 
  getMenuCategories, 
  getReviewCategories,
  getRestaurantReviews,
  getReviewAnalytics,
  ApiRestaurant,
  MenuItemWithCategory,
  MenuCategory,
  ReviewCategory,
  Review,
  ReviewAnalytics as ReviewAnalyticsType,
} from '../utils/api';
import { getMediaUrl } from '../utils/api';
import { categorizeRestaurantImages, RestaurantImage } from '../utils/api';
import { ReviewCard } from '../components/ReviewCard';

import { OwnerResponseModal } from '../components/OwnerResponseModal';
import { ReviewAnalytics } from '../components/ReviewAnalytics';
import { useAuth } from '../contexts/auth';
import { useLocation } from '../contexts/location';
import { getRestaurantCoordinates } from '../utils/api';

const { width } = Dimensions.get('window');

// Helper function to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to detect and convert YouTube URLs
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubeRegex);
  
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=0&controls=1`;
  }
  
  return null;
};

// Helper function to check if URL is a video file
const isVideoFile = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

// Helper function to get platform icon
const getPlatformIcon = (platform?: string): string => {
  if (!platform) return 'play-circle';
  
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('youtube')) return 'logo-youtube';
  if (platformLower.includes('vimeo')) return 'logo-vimeo';
  if (platformLower.includes('facebook')) return 'logo-facebook';
  if (platformLower.includes('instagram')) return 'logo-instagram';
  if (platformLower.includes('tiktok')) return 'logo-tiktok';
  
  return 'play-circle';
};

const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube\.com\/watch\?v=([^"&?\/\s]{11})/,
    /youtu\.be\/([^"&?\/\s]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const TABS: TabType[] = ['Menu', 'Reviews', 'Photos', 'Info'];

// Add new type for tabs
type TabType = 'Menu' | 'Reviews' | 'Photos' | 'Info';

// Type for gallery items (can be image, video, or logo)
type GalleryItem = {
  id: string;
  type: 'image' | 'video' | 'logo';
  source: any; // Can be require() for local images or { uri: string } for remote
  videoUrl?: string;
  youtubeEmbedUrl?: string;
  caption?: string;
  platform?: string;
  platformDisplay?: string;
};

export default function RestaurantProfileScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { userLocation } = useLocation();
  const [restaurant, setRestaurant] = useState<ApiRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Menu');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [tabAnimation] = useState(new Animated.Value(0));
  const [tabWidths, setTabWidths] = useState<{ [key: string]: number }>({});
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('All');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[] | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewAnalytics, setReviewAnalytics] = useState<ReviewAnalyticsType | null>(null);

  const [showOwnerResponseModal, setShowOwnerResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [reviewCategories, setReviewCategories] = useState<ReviewCategory[]>([]);
  const [categorizedImages, setCategorizedImages] = useState<{
    food: RestaurantImage[];
    interior: RestaurantImage[];
    ambiance: RestaurantImage[];
    exterior: RestaurantImage[];
    other: RestaurantImage[];
  }>({ food: [], interior: [], ambiance: [], exterior: [], other: [] });
  const [isThumbnailStripVisible, setIsThumbnailStripVisible] = useState(true);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleSnapToImage = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * width,
      animated: true,
    });
    setCurrentImageIndex(index);
  };

  const handleTabPress = (tab: TabType) => {
    const currentIndex = TABS.indexOf(activeTab);
    const nextIndex = TABS.indexOf(tab);
    
    Animated.spring(tabAnimation, {
      toValue: nextIndex,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    
    setActiveTab(tab);
  };

  const measureTab = (event: any, tab: string) => {
    const { width } = event.nativeEvent.layout;
    setTabWidths(prev => ({
      ...prev,
      [tab]: width,
    }));
  };

  const translateX = tabAnimation.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((tab, i) => {
      const leftOffset = TABS.slice(0, i).reduce((acc, t) => acc + (tabWidths[t] || 0), 0);
      return leftOffset;
    }),
    extrapolate: 'clamp',
  });

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {galleryItems.map((_, index: number) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.5, 1, 0.5],
            extrapolate: 'clamp',
          });

          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: ['rgba(255,255,255,0.5)', '#6B4EFF', 'rgba(255,255,255,0.5)'],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const getFilteredMenuItems = () => {
    if (!menuItems) return [];
    
    return menuItems.filter((item: MenuItemWithCategory) => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedMenuCategory === 'All' || 
        item.menu_category?.name === selectedMenuCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  const getFilteredPhotos = () => {
    // Create array combining videos, logo and regular images
    const allPhotos = [];
    
    // Add new API videos first (if available)
    if (restaurant?.videos && restaurant.videos.length > 0) {
      const sortedVideos = [...restaurant.videos].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return 0;
      });
      
      sortedVideos.forEach((video) => {
        allPhotos.push({
          id: `video-${video.id}`,
          image: video.thumbnail || video.url,
          is_video_thumbnail: true,
          video_url: video.url,
          caption: video.title || video.description || `Video ${video.id}`,
          keywords: video.platform || 'video',
          copyright: '',
          created_at: video.created_at,
        });
      });
    }
    
    // Add logo as photo if available
    if (restaurant?.logo) {
      allPhotos.push({
        id: `logo-${restaurant.id}`,
        image: restaurant.logo,
        is_video_thumbnail: false,
        video_url: null,
        caption: 'Restaurant Logo',
        keywords: 'logo',
        copyright: '',
        created_at: '',
      });
    }
    
    // Add regular restaurant images
    if (restaurant?.images) {
      allPhotos.push(...restaurant.images);
    }
    
    if (selectedPhotoCategory === 'All') {
      return allPhotos;
    }
    
    const categoryKey = selectedPhotoCategory.toLowerCase() as keyof typeof categorizedImages;
    const categoryPhotos = categorizedImages[categoryKey] || [];
    
    // For specific categories, include logo only if 'All' is selected
    // For now, logo will only appear in 'All' category
    return categoryPhotos;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Menu':
        return (
          <View style={styles.tabContent}>
            {menuLoading ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                <ThemedText style={styles.noResultsText}>Loading menu...</ThemedText>
              </View>
            ) : menuError ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
                <ThemedText style={styles.noResultsText}>{menuError}</ThemedText>
                <ThemedText style={[styles.noResultsText, { fontSize: 14, color: '#999', marginTop: 8 }]}>
                  Please try again later
                </ThemedText>
              </View>
            ) : menuItems && menuItems.length > 0 ? (
              <>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search menu items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.menuCategories}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['All', ...Array.from(new Set(menuItems.map(item => item.menu_category?.name).filter((name): name is string => !!name)))].map((category) => (
                  <TouchableOpacity 
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedMenuCategory === category && styles.activeChip
                    ]}
                    onPress={() => setSelectedMenuCategory(category)}
                  >
                    <ThemedText 
                      style={[
                        styles.categoryText,
                        selectedMenuCategory === category && styles.activeText
                      ]}
                    >
                      {category}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
              <View style={styles.menuGrid}>
                  {getFilteredMenuItems().map((item: MenuItemWithCategory) => (
                  <TouchableOpacity key={item.id} style={styles.menuItem}>
                    <View style={styles.menuImageContainer}>
                        <Image
                          source={{
                            uri: item.image || 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&q=80'
                          }}
                          style={styles.menuItemImage}
                        />
                    </View>
                    <View style={styles.menuItemInfo}>
                      <ThemedText style={styles.menuItemName} numberOfLines={1}>{item.name}</ThemedText>
                      <ThemedText style={styles.menuItemDescription} numberOfLines={2}>{item.description}</ThemedText>
                      <View style={styles.menuItemFooter}>
                          <ThemedText style={styles.menuItemPrice}>
                            {item.price ? 
                              (typeof item.price === 'number' ? 
                                `$${item.price.toFixed(2)}` : 
                                `$${parseFloat(item.price).toFixed(2)}`
                              ) : 
                              'Price not available'
                            }
                          </ThemedText>
                        <TouchableOpacity style={styles.addButton}>
                          <Ionicons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                <ThemedText style={styles.noResultsText}>Menus not available right now</ThemedText>
                <ThemedText style={[styles.noResultsText, { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }]}>
                  This restaurant hasn't uploaded their menu yet.{'\n'}
                  Please check back later or contact the restaurant directly.
                </ThemedText>
              </View>
            )}
          </View>
        );
      
      case 'Reviews':
        return (
          <View style={styles.tabContent}>
            {/* Analytics Section - Only show if there are actual reviews */}
            {reviews.length > 0 && reviewAnalytics && (
              <ReviewAnalytics analytics={reviewAnalytics} />
            )}

            {/* Write Review Button */}
            <View style={styles.writeReviewSection}>
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => {
                  console.log('🔗 Navigating to write review with restaurant data:', {
                    id: restaurant?.id,
                    name: restaurant?.name,
                    image: restaurant?.logo || restaurant?.images?.[0]?.image
                  });
                  
                  router.push({
                    pathname: '/(modals)/write-review',
                    params: {
                      restaurantId: restaurant?.id?.toString() || '',
                      restaurantName: restaurant?.name || '',
                      restaurantImage: restaurant?.logo || restaurant?.images?.[0]?.image || '',
                      restaurantCuisine: restaurant?.cuisine_styles?.[0]?.name || 'Cuisine',
                      restaurantAddress: restaurant?.full_address || 'Address not available',
                      restaurantTiming: userLocation && restaurant ? calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        restaurant.latitude || 0,
                        restaurant.longitude || 0
                      ).toFixed(1) + ' km' : '15 min'
                    }
                  });
                }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
                <ThemedText style={styles.writeReviewButtonText}>Write a Review</ThemedText>
                </TouchableOpacity>
            </View>

            {/* Reviews List */}
            {reviewsLoading ? (
              <View style={styles.noResultsContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
                <ThemedText style={styles.noResultsText}>Loading reviews...</ThemedText>
                        </View>
            ) : reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((item) => (
                  <ReviewCard
                    key={item.id.toString()}
                    review={item}
                    onRefresh={fetchReviews}
                    onEdit={handleEditReview}
                    onRespond={handleOwnerResponse}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color="#ccc" />
                <ThemedText style={styles.noResultsText}>No Reviews Available right now for this Restaurant</ThemedText>
                <ThemedText style={[styles.noResultsText, { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }]}>
                  Be the first to share your experience!
                </ThemedText>
                    </View>
            )}
          </View>
        );
      
      case 'Photos':
        return (
          <View style={styles.tabContent}>
            <View style={styles.photoCategories}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['All', 'Food', 'Interior', 'Ambiance', 'Exterior'].map((category) => (
                  <TouchableOpacity 
                    key={category}
                    style={[
                      styles.categoryChip,
                      selectedPhotoCategory === category && styles.activeChip
                    ]}
                    onPress={() => setSelectedPhotoCategory(category)}
                  >
                    <ThemedText 
                      style={[
                        styles.categoryText,
                        selectedPhotoCategory === category && styles.activeText
                      ]}
                    >
                      {category}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.photoGrid}>
              {getFilteredPhotos().length > 0 ? (
                getFilteredPhotos().map((photo) => (
                <TouchableOpacity key={photo.id} style={styles.photoItem}>
                    <Image source={{ uri: getMediaUrl(photo.image) }} style={styles.photo} />
                </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="images-outline" size={48} color="#ccc" />
                  <ThemedText style={styles.noResultsText}>No Photos Available</ThemedText>
                  <ThemedText style={[styles.noResultsText, { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }]}>
                    This restaurant hasn't uploaded any photos yet.{'\n'}
                    Check back later for updates!
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        );
      
      case 'Info':
        return (
          <View style={styles.tabContent}>
            {/* Opening Hours */}
            {restaurant?.operating_hours && restaurant.operating_hours.length > 0 && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoTitle}>Operating Hours</ThemedText>
                {restaurant.operating_hours.map((oh: any, idx: number) => {
                  const formatTime = (timeString: string) => {
                    if (!timeString) return '';
                    const time = timeString.split(' ')[0]; // Remove timezone if present
                    const [hours, minutes] = time.split(':');
                    const hour = parseInt(hours);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    return `${displayHour}:${minutes} ${ampm}`;
                  };

                  return (
                  <View key={idx} style={styles.hoursRow}>
                      <ThemedText style={styles.dayText}>
                        {oh.day_of_week || oh.day || 'Day'}
                      </ThemedText>
                    {oh.is_closed ? (
                      <ThemedText style={styles.timeText}>Closed</ThemedText>
                    ) : (
                        <ThemedText style={styles.timeText}>
                          {formatTime(oh.open_time_1 || oh.open_time)} - {formatTime(oh.close_time_1 || oh.close_time)}
                        </ThemedText>
                    )}
                  </View>
                  );
                })}
              </View>
            )}

            {/* Contact Info */}
            {(restaurant?.phone?.trim() || restaurant?.email?.trim() || restaurant?.website?.trim() || 
              restaurant?.primary_phone?.trim() || restaurant?.primary_email?.trim()) && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoTitle}>Contact Details</ThemedText>
                {(restaurant.phone?.trim() || restaurant.primary_phone?.trim()) && (
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={20} color="#666" />
                    <ThemedText style={styles.contactText}>
                      {parseInt(restaurant.phone || restaurant.primary_phone || '0').toString()}
                    </ThemedText>
                  </View>
                )}
                {restaurant.other_phones?.trim() && (
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={20} color="#666" />
                    <ThemedText style={styles.contactText}>{restaurant.other_phones}</ThemedText>
                  </View>
                )}
                {(restaurant.email?.trim() || restaurant.primary_email?.trim()) && (
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <ThemedText style={styles.contactText}>{restaurant.email || restaurant.primary_email}</ThemedText>
                  </View>
                )}
                {restaurant.other_emails?.trim() && (
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <ThemedText style={styles.contactText}>{restaurant.other_emails}</ThemedText>
                  </View>
                )}
                {restaurant.website?.trim() && (
                  <View style={styles.contactRow}>
                    <Ionicons name="globe-outline" size={20} color="#666" />
                    <ThemedText style={styles.contactText}>{restaurant.website}</ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Address/Location */}
            {(restaurant?.street_address || restaurant?.city || restaurant?.state || restaurant?.country) && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoTitle}>Location</ThemedText>
                <View style={styles.contactRow}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                <ThemedText style={styles.contactText}>
                  {[restaurant.street_address, restaurant.city, restaurant.state, restaurant.country].filter(Boolean).join(', ')}
                </ThemedText>
                </View>
              </View>
            )}

            {/* Venue Types */}
            {restaurant?.venue_types && restaurant.venue_types.length > 0 && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoTitle}>Venue Type</ThemedText>
                <View style={styles.venueTypesContainer}>
                  {restaurant.venue_types.map((venueType, index) => (
                    <View key={index} style={styles.venueTypeChip}>
                      <ThemedText style={styles.venueTypeText}>{venueType.name}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Cuisine Styles */}
            {restaurant?.cuisine_styles && restaurant.cuisine_styles.length > 0 && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoTitle}>Cuisine Type</ThemedText>
                <View style={styles.cuisineContainer}>
                  {restaurant.cuisine_styles.map((cuisine, index) => (
                    <View key={index} style={styles.cuisineChip}>
                      <ThemedText style={styles.cuisineText}>{cuisine.name}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Amenities */}
            {restaurant?.amenities && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoTitle}>Amenities</ThemedText>
                {restaurant.amenities.grouped_amenities && restaurant.amenities.grouped_amenities.length > 0 && (
                  restaurant.amenities.grouped_amenities.map((group: any, groupIndex: number) => (
                    <View key={groupIndex} style={styles.amenityGroup}>
                      <ThemedText style={styles.amenitySuperCategory}>{group.super_category}</ThemedText>
                      {group.categories.map((category: any, catIndex: number) => (
                        <View key={catIndex} style={styles.amenityCategory}>
                          <ThemedText style={styles.amenityCategoryName}>{category.category}</ThemedText>
                          <View style={styles.amenityItems}>
                            {category.amenities.map((amenity: any, itemIndex: number) => (
                              <View key={itemIndex} style={styles.amenityItem}>
                                <ThemedText style={styles.amenityText}>{amenity.name}</ThemedText>
                      </View>
                  ))}
                </View>
              </View>
                      ))}
                    </View>
                  ))
                )}
                {restaurant.amenities.additional_amenities && (
                  <View style={styles.additionalAmenitiesContainer}>
                    {restaurant.amenities.additional_amenities.split(',').map((amenity: string, index: number) => (
                      <View key={index} style={styles.additionalAmenityItem}>
                        <ThemedText style={styles.additionalAmenityText}>{amenity.trim()}</ThemedText>
                      </View>
                    ))}
              </View>
            )}
              </View>
            )}



            {/* Fallback message if no info available */}
            {!restaurant?.operating_hours?.length && 
             !restaurant?.phone?.trim() && !restaurant?.primary_phone?.trim() && !restaurant?.other_phones?.trim() &&
             !restaurant?.email?.trim() && !restaurant?.primary_email?.trim() && !restaurant?.other_emails?.trim() &&
             !restaurant?.website?.trim() &&
             !restaurant?.street_address && !restaurant?.city && !restaurant?.state && !restaurant?.country &&
             !restaurant?.venue_types?.length && !restaurant?.cuisine_styles?.length &&
             !restaurant?.amenities && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="information-circle-outline" size={48} color="#ccc" />
                <ThemedText style={styles.noResultsText}>No Information Available</ThemedText>
                <ThemedText style={[styles.noResultsText, { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' }]}>
                  This restaurant hasn't provided any additional information yet.
                </ThemedText>
              </View>
            )}
          </View>
        );
    }
  };

  const fetchReviews = async () => {
    if (!restaurant?.id) return;
    setReviewsLoading(true);
    try {
      const reviewsData = await getRestaurantReviews(restaurant.id);
      setReviews(reviewsData);
    } catch (e) {
      console.error('Failed to fetch reviews:', e);
      Alert.alert('Error', 'Failed to load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchReviewAnalytics = async () => {
    if (!restaurant?.id) return;
    try {
      console.log('🔄 Fetching review analytics for restaurant:', restaurant.id);
      const analytics = await getReviewAnalytics(restaurant.id);
      console.log('📊 Received review analytics:', analytics);
      console.log('📊 Analytics structure check:', {
        exists: !!analytics,
        overall_average: analytics?.overall_average,
        total_reviews: analytics?.total_reviews,
        category_averages: analytics?.category_averages,
        rating_distribution: analytics?.rating_distribution
      });
      setReviewAnalytics(analytics);
    } catch (e) {
      console.error('❌ Failed to fetch review analytics:', e);
      setReviewAnalytics(null); // Ensure it's set to null on error
    }
  };



  const handleOwnerResponse = (review: Review) => {
    setSelectedReview(review);
    setShowOwnerResponseModal(true);
  };

  const handleOwnerResponseSuccess = () => {
    setShowOwnerResponseModal(false);
    setSelectedReview(null);
    fetchReviews();
    fetchReviewAnalytics();
  };

  const handleEditReview = (review: Review) => {
    // Navigate to write review screen with pre-filled data
    router.push({
      pathname: '/(modals)/write-review',
      params: { 
        restaurantId: restaurant?.id.toString(),
        editMode: 'true',
        reviewId: review.id.toString(),
        existingData: JSON.stringify({
          overall_rating: review.overall_rating,
          comment: review.comment,
          category_ratings: review.category_ratings.map(cr => ({
            category_id: cr.category.id,
            rating: cr.rating
          })),
          photos: review.photos
        })
      }
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${restaurant?.name || 'this restaurant'}! Download our app to see more details.`,
        title: restaurant?.name || 'Restaurant'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleWishlist = () => {
    // For now, just show an alert. In a real app, this would save to wishlist
    Alert.alert(
      'Wishlist',
      `${restaurant?.name || 'Restaurant'} has been added to your wishlist!`,
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getRestaurantById(Number(id))
      .then(restaurantData => {
        setRestaurant(restaurantData);
      })
      .catch(e => setError(e.message || 'Failed to load restaurant'))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch reviews and analytics
  useEffect(() => {
    if (restaurant?.id) {
      fetchReviews();
      fetchReviewAnalytics();
    }
  }, [restaurant?.id]);

  // Refresh reviews when screen comes into focus (e.g., returning from write-review)
  useFocusEffect(
    React.useCallback(() => {
      if (restaurant?.id) {
        console.log('🔄 Screen focused - refreshing reviews and analytics');
        fetchReviews();
        fetchReviewAnalytics();
      }
    }, [restaurant?.id])
  );

  // Fetch menu categories (optional - won't break if it fails)
  useEffect(() => {
    getMenuCategories()
      .then(setMenuCategories)
      .catch(e => {
        console.error('Failed to load menu categories:', e);
        // Don't set error, just use fallback categories
      });
  }, []);
  
  // Fetch review categories (optional - won't break if it fails)
  useEffect(() => {
    getReviewCategories()
      .then(setReviewCategories)
      .catch(e => {
        console.error('Failed to load review categories:', e);
        // Don't set error, just use fallback categories
      });
  }, []);
  
  // Categorize restaurant images
  useEffect(() => {
    if (restaurant?.images && restaurant.images.length > 0) {
      const categorized = categorizeRestaurantImages(restaurant.images);
      setCategorizedImages(categorized);
    }
  }, [restaurant?.images]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>{error}</ThemedText>
      </View>
    );
  }

  // Create gallery items from restaurant videos, logo and images
    const createGalleryItems = (): GalleryItem[] => {
    const items: GalleryItem[] = [];
    
    console.log('🏪 Restaurant data for gallery creation:', {
      id: restaurant?.id,
      name: restaurant?.name,
      videosCount: restaurant?.videos?.length || 0,
      imagesCount: restaurant?.images?.length || 0,
      hasLogo: !!restaurant?.logo
    });

    // 1. Add videos first (if available) - NEW API FIELD
    if (restaurant?.videos && restaurant.videos.length > 0) {
      console.log('🎥 Found videos:', restaurant.videos.length);
      // Sort videos: featured videos first, then others
      const sortedVideos = [...restaurant.videos].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return 0;
      });

      sortedVideos.forEach((video, index) => {
        console.log(`🎬 Processing video ${index + 1}:`, {
          id: video.id,
          url: video.url,
          thumbnail: video.thumbnail,
          platform: video.platform,
          title: video.title
        });

        const youtubeUrl = getYouTubeEmbedUrl(video.url);
        const isVideo = isVideoFile(video.url) || youtubeUrl;

        console.log('🔍 Video analysis:', {
          youtubeUrl,
          isVideo,
          isVideoFile: isVideoFile(video.url)
        });

        if (isVideo) {
          // Create proper video thumbnail
          let thumbnailSource;
          if (video.thumbnail) {
            thumbnailSource = { uri: getMediaUrl(video.thumbnail) };
            console.log('✅ Using API thumbnail:', getMediaUrl(video.thumbnail));
          } else if (youtubeUrl) {
            // For YouTube videos, generate thumbnail from video ID
            const videoId = getYouTubeVideoId(video.url);
            if (videoId) {
              thumbnailSource = { uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
              console.log('✅ Generated YouTube thumbnail:', `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
            } else {
              thumbnailSource = { uri: getMediaUrl(video.url) };
              console.log('⚠️ Using video URL as thumbnail (fallback):', getMediaUrl(video.url));
            }
          } else {
            // For other video files, use a default video thumbnail
            thumbnailSource = require('../assets/images/icon.png');
            console.log('✅ Using default icon as thumbnail');
          }

          console.log('📸 Final thumbnail source:', thumbnailSource);

          items.push({
            id: `video-${video.id}`,
            type: 'video',
            source: thumbnailSource,
            videoUrl: video.url,
            youtubeEmbedUrl: youtubeUrl || undefined,
            caption: video.title || video.description || `Video ${video.id}`,
            platform: video.platform,
            platformDisplay: video.platform_display,
          });
        } else {
          console.log('❌ Skipping non-video item:', video.url);
        }
      });
    } else {
      console.log('❌ No videos found in restaurant data');
    }
    
        // 2. Add legacy videos from images array (backward compatibility)
    if (restaurant?.images && restaurant.images.length > 0) {
      console.log('🖼️ Found images:', restaurant.images.length);
      const legacyVideos = restaurant.images.filter(img => img.is_video_thumbnail && img.video_url);
      console.log('🎬 Found legacy videos:', legacyVideos.length);
      
      legacyVideos.forEach((video, index) => {
        console.log(`🎬 Processing legacy video ${index + 1}:`, {
          id: video.id,
          image: video.image,
          video_url: video.video_url,
          caption: video.caption
        });

        const youtubeUrl = getYouTubeEmbedUrl(video.video_url!);
        const isVideo = isVideoFile(video.video_url!) || youtubeUrl;

        console.log('🔍 Legacy video analysis:', {
          youtubeUrl,
          isVideo,
          isVideoFile: isVideoFile(video.video_url!)
        });

        if (isVideo) {
          // Create proper video thumbnail for legacy videos
          let thumbnailSource;
          if (video.image) {
            thumbnailSource = { uri: getMediaUrl(video.image) };
            console.log('✅ Using legacy image as thumbnail:', getMediaUrl(video.image));
          } else if (youtubeUrl) {
            // For YouTube videos, generate thumbnail from video ID
            const videoId = getYouTubeVideoId(video.video_url!);
            if (videoId) {
              thumbnailSource = { uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
              console.log('✅ Generated YouTube thumbnail for legacy video:', `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
            } else {
              thumbnailSource = { uri: getMediaUrl(video.video_url!) };
              console.log('⚠️ Using legacy video URL as thumbnail (fallback):', getMediaUrl(video.video_url!));
            }
          } else {
            // For other video files, use a default video thumbnail
            thumbnailSource = require('../assets/images/icon.png');
            console.log('✅ Using default icon as thumbnail for legacy video');
          }

          console.log('📸 Final legacy thumbnail source:', thumbnailSource);

          items.push({
            id: `legacy-video-${video.id}`,
            type: 'video',
            source: thumbnailSource,
            videoUrl: video.video_url!,
            youtubeEmbedUrl: youtubeUrl || undefined,
            caption: video.caption || `Video ${index + 1}`,
          });
        } else {
          console.log('❌ Skipping non-video legacy item:', video.video_url);
        }
      });
    } else {
      console.log('❌ No images found in restaurant data');
    }
    
    // 2. Add logo if available
    if (restaurant?.logo) {
      items.push({
        id: `logo-${restaurant.id}`,
        type: 'logo',
        source: { uri: getMediaUrl(restaurant.logo) },
        caption: 'Restaurant Logo',
      });
    }
    
    // 3. Add restaurant images (excluding videos)
    if (restaurant?.images && restaurant.images.length > 0) {
      const imageItems = restaurant.images
        .filter(img => !img.is_video_thumbnail || !img.video_url) // Exclude videos
        .map(img => ({
          id: `image-${img.id}`,
          type: 'image' as const,
          source: { uri: getMediaUrl(img.image) },
          caption: img.caption || 'Restaurant Image',
        }));
      items.push(...imageItems);
    }
    
    // 4. If no restaurant media, use appBanner images as fallback
    if (items.length === 0) {
      const bannerImages = [
        require('../assets/images/appBanner/1.png'),
        require('../assets/images/appBanner/2.png'),
        require('../assets/images/appBanner/3.png'),
        require('../assets/images/appBanner/4.png'),
        require('../assets/images/appBanner/5.png'),
        require('../assets/images/appBanner/6.png'),
        require('../assets/images/appBanner/7.png'),
        require('../assets/images/appBanner/8.png'),
        require('../assets/images/appBanner/9.png'),
      ];
      
      bannerImages.forEach((bannerImage, index) => {
        items.push({
          id: `banner-${index + 1}`,
          type: 'image',
          source: bannerImage,
          caption: `App Banner ${index + 1}`,
        });
      });
    }
    
    console.log('🎯 Final gallery items created:', items.length);
    items.forEach((item, index) => {
      console.log(`📸 Item ${index + 1}:`, {
        id: item.id,
        type: item.type,
        source: typeof item.source === 'object' && item.source.uri ? item.source.uri : 'local asset',
        videoUrl: item.videoUrl,
        platform: item.platform
      });
    });
    
    return items;
  };

  const galleryItems = createGalleryItems();
  const hasMultipleItems = galleryItems.length > 1;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Image Slider */}
        <View style={[
          styles.imageSliderContainer,
          hasMultipleItems && !isThumbnailStripVisible && styles.imageSliderContainerFull
        ]}>
          {/* Main Media Display - Slideshow only if multiple items */}
          {hasMultipleItems ? (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(newIndex);
            }}
          >
              {galleryItems.map((item, index) => (
                <View key={item.id} style={[
                  styles.mediaContainer,
                  hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
                ]}>
                  {item.type === 'video' && item.youtubeEmbedUrl ? (
                    // YouTube Video
                    <WebView
                      source={{ uri: item.youtubeEmbedUrl }}
                      style={[
                        styles.mainVideo,
                        hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
                      ]}
                      allowsFullscreenVideo={true}
                      mediaPlaybackRequiresUserAction={false}
                    />
                  ) : item.type === 'video' ? (
                    // Video thumbnail (clickable to play)
                    <TouchableOpacity 
                      style={[
                        styles.videoThumbnailContainer,
                        hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
                      ]}
                      onPress={() => {
                        Alert.alert(
                          'Video',
                          'Video playback feature coming soon!',
                          [{ text: 'OK' }]
                        );
                      }}
                    >
                      <Image source={item.source} style={[
                        styles.mainImage,
                        hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
                      ]} />
                      <View style={styles.videoPlayOverlay}>
                        <Ionicons 
                          name={getPlatformIcon(item.platform) as any} 
                          size={60} 
                          color="rgba(255,255,255,0.9)" 
                        />
                      </View>
                      {item.platformDisplay && (
                        <View style={styles.platformBadge}>
                          <ThemedText style={styles.platformText}>{item.platformDisplay}</ThemedText>
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    // Regular Image or Logo
                    <Image source={item.source} style={styles.mainImage} />
                  )}
                </View>
            ))}
          </ScrollView>
          ) : (
            // Single item - no slideshow
            <View style={[
              styles.mediaContainer,
              hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
            ]}>
              {galleryItems[0]?.type === 'video' && galleryItems[0]?.youtubeEmbedUrl ? (
                <WebView
                  source={{ uri: galleryItems[0].youtubeEmbedUrl }}
                  style={[
                    styles.mainVideo,
                    hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
                  ]}
                  allowsFullscreenVideo={true}
                  mediaPlaybackRequiresUserAction={false}
                />
              ) : galleryItems[0]?.type === 'video' ? (
                <TouchableOpacity 
                  style={[
                    styles.videoThumbnailContainer,
                    hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Video',
                      'Video playback feature coming soon!',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Image source={galleryItems[0].source} style={[
                    styles.mainImage,
                    hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
                  ]} />
                  <View style={styles.videoPlayOverlay}>
                    <Ionicons 
                      name={getPlatformIcon(galleryItems[0].platform) as any} 
                      size={60} 
                      color="rgba(255,255,255,0.9)" 
                    />
                  </View>
                  {galleryItems[0].platformDisplay && (
                    <View style={styles.platformBadge}>
                      <ThemedText style={styles.platformText}>{galleryItems[0].platformDisplay}</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <Image source={galleryItems[0]?.source} style={[
                  styles.mainImage,
                  hasMultipleItems && !isThumbnailStripVisible && { height: width * 0.9 }
                ]} />
              )}
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navigationHeader}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#6B4EFF" />
            </TouchableOpacity>
            <View style={styles.rightButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="#6B4EFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleWishlist}>
                <Ionicons name="heart-outline" size={24} color="#6B4EFF" />
              </TouchableOpacity>
            </View>
          </View>



          {/* Thumbnail Toggle Button - Only show if multiple items */}
          {hasMultipleItems && (
            <TouchableOpacity 
              style={styles.thumbnailToggleButton}
              onPress={() => setIsThumbnailStripVisible(!isThumbnailStripVisible)}
            >
              <Ionicons 
                name={isThumbnailStripVisible ? "chevron-down" : "chevron-up"} 
                size={20} 
                color="#fff" 
              />
          </TouchableOpacity>
          )}

          {/* Thumbnail Container - Only show if multiple items and visible */}
          {hasMultipleItems && isThumbnailStripVisible && (
          <View style={styles.thumbnailOuterContainer}>
            <View style={styles.thumbnailBackground}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.thumbnailContent,
                    { justifyContent: 'center' }
                  ]}
                decelerationRate="fast"
                snapToInterval={64} // thumbnail width + gap
                snapToAlignment="center"
              >
                  {galleryItems.map((item, index) => (
                  <TouchableOpacity
                      key={item.id}
                    onPress={() => handleSnapToImage(index)}
                    style={[
                      styles.thumbnailWrapper,
                      currentImageIndex === index && styles.activeThumbnail
                    ]}
                  >
                    <Image
                        source={item.source}
                      style={styles.thumbnailImage}
                    />
                      {item.type === 'video' && (
                        <View style={styles.thumbnailVideoIndicator}>
                          <Ionicons name="play" size={12} color="#fff" />
                        </View>
                      )}
                    <View style={[
                      styles.thumbnailOverlay,
                      currentImageIndex === index && styles.activeThumbnailOverlay
                    ]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          )}

          {/* Pagination dots - Only show if multiple items */}
          {hasMultipleItems && renderPaginationDots()}
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          {/* Offer and Rating Row */}
          <View style={styles.statsRow}>
            <View style={styles.offerContainer}>
              <Ionicons name="pricetag" size={16} color="#666" />
              <ThemedText style={styles.offerText}>No Offers Available</ThemedText>
            </View>
            {reviews.length > 0 ? (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
                <ThemedText style={styles.ratingText}>
                  {reviewAnalytics?.overall_average?.toFixed(1) || '0.0'}
                </ThemedText>
                <ThemedText style={styles.reviewCount}>({reviews.length} reviews)</ThemedText>
            </View>
            ) : (
              <View style={styles.ratingContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#666" />
                <ThemedText style={styles.reviewCount}>No Reviews Available</ThemedText>
              </View>
            )}
          </View>

          {/* Restaurant Details */}
          <View style={styles.restaurantHeader}>
            <Image
              source={restaurant?.logo ? { uri: getMediaUrl(restaurant.logo) } : require('../assets/images/icon.png')}
              style={styles.restaurantLogo}
            />
          <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
          </View>
          <View style={styles.detailsRow}>
            {userLocation && restaurant && (() => {
              const coords = getRestaurantCoordinates(restaurant);
              if (coords) {
                const distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  coords.latitude,
                  coords.longitude
                );
                return (
            <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>{distance.toFixed(1)} km</Text>
            </View>
                );
              }
              return null;
            })()}
            <View style={styles.detailItem}>
              <Ionicons name="restaurant-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {restaurant?.venue_types?.[0]?.name || restaurant?.cuisine_styles?.[0]?.name || 'Restaurant'}
              </Text>
            </View>
          </View>
          <Text style={styles.address}>
            {restaurant?.full_address || 'Address not available'}
          </Text>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <View 
              style={styles.tabs}
              onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            >
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <ThemedText 
                    style={[
                      styles.tabText, 
                      activeTab === tab && styles.activeTabText
                    ]}
                  >
                    {tab}
                  </ThemedText>
                  {activeTab === tab && <View style={styles.activeTabIndicator} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {renderTabContent()}
          </View>
        </View>
      </ScrollView>

      {/* Book Table Button */}
      <View style={styles.bottomButton}>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push('/book-table')}
        >
          <ThemedText style={styles.bookButtonText}>Book a Table</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Review Form Modal - Replaced with navigation to dedicated screen */}

      {/* Owner Response Modal */}
      <OwnerResponseModal
        visible={showOwnerResponseModal}
        review={selectedReview}
        onClose={() => setShowOwnerResponseModal(false)}
        onSuccess={handleOwnerResponseSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  imageSliderContainer: {
    position: 'relative',
    backgroundColor: '#000',
    height: width * 0.7,
  },
  imageSliderContainerFull: {
    height: width * 0.9, // Full height when thumbnails are hidden
  },
  mainImage: {
    width: width,
    height: width * 0.7,
    resizeMode: 'cover',
  },
  mediaContainer: {
    width: width,
    height: width * 0.7,
    position: 'relative',
  },
  mainVideo: {
    width: width,
    height: width * 0.7,
  },
  videoThumbnailContainer: {
    width: width,
    height: width * 0.7,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 30,
  },
  thumbnailVideoIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 2,
    zIndex: 1,
  },
  platformBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 2,
  },
  platformText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  thumbnailToggleButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  navigationHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  playButtonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailOuterContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    height: 80,
  },
  thumbnailBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnailContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  thumbnailWrapper: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  activeThumbnail: {
    borderColor: '#6B4EFF',
    transform: [{ scale: 1.1 }],
  },
  activeThumbnailOverlay: {
    backgroundColor: 'rgba(0,0,0,0)',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  offerText: {
    color: '#6B4EFF',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  reviewCount: {
    color: '#666',
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  restaurantLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '600',
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: '#666',
  },
  address: {
    color: '#666',
    marginBottom: 16,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    position: 'relative',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#F5F3FF',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6B4EFF',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#6B4EFF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabContent: {
    flex: 1,
  },
  menuCategories: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#6B4EFF',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
  },
  activeText: {
    color: '#fff',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'center',
  },
  menuItem: {
    width: (width - 48) / 2.2,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  menuImageContainer: {
    position: 'relative',
    width: '100%',
    height: 110,
  },
  menuItemImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItemInfo: {
    padding: 8,
  },
  menuItemName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
    color: '#333',
  },
  menuItemDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
    marginBottom: 6,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B4EFF',
  },
  addButton: {
    backgroundColor: '#6B4EFF',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewsHeader: {
    padding: 16,
    backgroundColor: '#fff',
  },
  overallRatingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  totalReviews: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  writeReviewButton: {
    backgroundColor: '#6B4EFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  writeReviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
  },
  reviewImages: {
    padding: 12,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  photoCategories: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'center',
  },
  photoItem: {
    width: (width - 40) / 2.2,
    height: (width - 40) / 2.2,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayText: {
    fontSize: 15,
    color: '#666',
  },
  timeText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactText: {
    marginLeft: 8,
    color: '#666',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  facilityText: {
    color: '#666',
  },
  bottomButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  bookButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 108,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    height: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  venueTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
  },
  venueTypeChip: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  venueTypeText: {
    color: '#6B4EFF',
    fontSize: 13,
    fontWeight: '500',
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
  },
  cuisineChip: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cuisineText: {
    color: '#6B4EFF',
    fontSize: 13,
    fontWeight: '500',
  },
  amenityGroup: {
    marginBottom: 24,
  },
  amenitySuperCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
    paddingHorizontal: 20,
  },
  amenityCategory: {
    marginBottom: 16,
  },
  amenityCategoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  amenityItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amenityText: {
    color: '#666',
    fontSize: 13,
  },
  additionalAmenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
  },
  additionalAmenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  additionalAmenityText: {
    color: '#FFB800',
    fontSize: 13,
    fontWeight: '500',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  writeReviewSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  reviewsList: {
    paddingBottom: 16,
  },
}); 