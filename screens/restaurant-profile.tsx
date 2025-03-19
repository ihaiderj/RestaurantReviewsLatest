import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Text, Animated, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';

const { width } = Dimensions.get('window');

const GALLERY_IMAGES = [
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=500&h=300&q=80',
  'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=500&h=300&q=80',
  'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=500&h=300&q=80',
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=300&q=80',
];

const GALLERY_GRID_IMAGES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&q=80',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&q=80',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&q=80',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&h=300&q=80',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&q=80',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&h=300&q=80',
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1515669097368-22e68427d265?w=400&h=300&q=80',
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=400&h=300&q=80',
  },
  // Add more images as needed
];

const TABS: TabType[] = ['Menu', 'Reviews', 'Photos', 'Info'];

interface MenuItem {
  id: number;
  name: string;
  rating: number;
  price: number;
  image: string;
  category: string;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 1,
    name: 'Margherita Pizza',
    rating: 4.9,
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&q=80',
    category: 'Bestseller Items',
    description: 'Fresh tomatoes, mozzarella, basil, and olive oil',
  },
  {
    id: 2,
    name: 'Pasta Arrabiata',
    rating: 4.8,
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&h=300&q=80',
    category: 'Top rated Items',
    description: 'Spicy tomato sauce, garlic, and red chili peppers',
  },
  {
    id: 3,
    name: 'Pepperoni Pizza',
    rating: 4.7,
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&q=80',
    category: 'Bestseller Items',
    description: 'Classic pepperoni pizza with a crispy crust',
  },
  {
    id: 4,
    name: 'Chicken Alfredo',
    rating: 4.6,
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&h=300&q=80',
    category: 'Top rated Items',
    description: 'Creamy Alfredo sauce with grilled chicken',
  },
  {
    id: 5,
    name: 'Greek Salad',
    rating: 4.5,
    price: 10.99,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&q=80',
    category: 'Healthy Options',
    description: 'Fresh Greek salad with tomatoes, cucumber, and feta cheese',
  },
  {
    id: 6,
    name: 'Mushroom Risotto',
    rating: 4.7,
    price: 13.99,
    image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&q=80',
    category: 'Top rated Items',
    description: 'Creamy mushroom risotto with Parmigiano-Reggiano',
  },
  // Add more items as needed
];

interface Review {
  id: string;
  userName: string;
  userImage: string;
  rating: number;
  date: string;
  comment: string;
  images?: string[];
  isVerified?: boolean;
}

const REVIEWS: Review[] = [
  {
    id: '1',
    userName: 'Sarah Johnson',
    userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&q=80',
    rating: 4.8,
    date: '2 days ago',
    comment: 'Amazing food and atmosphere! The pasta was perfectly cooked and the service was exceptional.',
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&q=80'
    ],
    isVerified: true
  },
  {
    id: '2',
    userName: 'Michael Chen',
    userImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&q=80',
    rating: 4.5,
    date: '3 days ago',
    comment: 'Great ambiance and delicious food. The wine selection is impressive!',
    isVerified: true
  },
  {
    id: '3',
    userName: 'Emily Davis',
    userImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&q=80',
    rating: 4.9,
    date: '5 days ago',
    comment: 'Best Italian restaurant in town! The homemade pasta is incredible.',
    images: [
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&h=200&q=80'
    ],
    isVerified: false
  },
  {
    id: '4',
    userName: 'Sophie Martin',
    userImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&q=80',
    rating: 4.6,
    date: '1 week ago',
    comment: 'Fantastic date night spot! The candlelit atmosphere and excellent service made our anniversary dinner special.',
    isVerified: true
  }
];

// Add new type for tabs
type TabType = 'Menu' | 'Reviews' | 'Photos' | 'Info';

// Add interfaces for tab content
interface PhotoGallery {
  id: string;
  image: string;
  type: 'Food' | 'Interior' | 'Ambiance';
}

// Update the PHOTOS array with more categorized images
const PHOTOS: PhotoGallery[] = [
  // Food Category
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&q=80',
    type: 'Food'
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&q=80',
    type: 'Food'
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=300&q=80',
    type: 'Food'
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&q=80',
    type: 'Food'
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&q=80',
    type: 'Food'
  },

  // Interior Category
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=300&q=80',
    type: 'Interior'
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1537223292554-2a42a42c1aaa?w=300&h=300&q=80',
    type: 'Interior'
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=300&q=80',
    type: 'Interior'
  },
  {
    id: '9',
    image: 'https://images.unsplash.com/photo-1484659619207-9165d119dafe?w=300&h=300&q=80',
    type: 'Interior'
  },
  {
    id: '10',
    image: 'https://images.unsplash.com/photo-1530229540764-e6b414dc5c49?w=300&h=300&q=80',
    type: 'Interior'
  },

  // Ambiance Category
  {
    id: '11',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&q=80',
    type: 'Ambiance'
  },
  {
    id: '12',
    image: 'https://images.unsplash.com/photo-1519690889869-e705e59f72e1?w=300&h=300&q=80',
    type: 'Ambiance'
  },
  {
    id: '13',
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=300&h=300&q=80',
    type: 'Ambiance'
  },
  {
    id: '14',
    image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=300&h=300&q=80',
    type: 'Ambiance'
  },
  {
    id: '15',
    image: 'https://images.unsplash.com/photo-1517677129300-07b130802f46?w=300&h=300&q=80',
    type: 'Ambiance'
  }
];

export default function RestaurantProfileScreen() {
  const router = useRouter();
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
        {GALLERY_IMAGES.map((_, index) => {
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
    const searchFilter = searchQuery.toLowerCase();
    let filtered = MENU_ITEMS;
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchFilter) ||
        item.description.toLowerCase().includes(searchFilter)
      );
    }
    
    if (selectedMenuCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedMenuCategory);
    }
    
    return filtered;
  };

  const getFilteredPhotos = () => {
    if (selectedPhotoCategory === 'All') {
      return PHOTOS;
    }
    return PHOTOS.filter(photo => photo.type === selectedPhotoCategory);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Menu':
        return (
          <View style={styles.tabContent}>
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
                {['All', 'Bestseller Items', 'Top rated Items', 'Healthy Options'].map((category) => (
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
            
            {getFilteredMenuItems().length > 0 ? (
              <View style={styles.menuGrid}>
                {getFilteredMenuItems().map((item) => (
                  <TouchableOpacity key={item.id} style={styles.menuItem}>
                    <View style={styles.menuImageContainer}>
                      <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#FFB800" />
                        <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.menuItemInfo}>
                      <ThemedText style={styles.menuItemName} numberOfLines={1}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={styles.menuItemDescription} numberOfLines={2}>
                        {item.description}
                      </ThemedText>
                      <View style={styles.menuItemFooter}>
                        <ThemedText style={styles.menuItemPrice}>
                          ${item.price.toFixed(2)}
                        </ThemedText>
                        <TouchableOpacity style={styles.addButton}>
                          <Ionicons name="add" size={20} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#ccc" />
                <ThemedText style={styles.noResultsText}>No menu items found</ThemedText>
              </View>
            )}
          </View>
        );
      
      case 'Reviews':
        return (
          <View style={styles.tabContent}>
            <View style={styles.reviewsHeader}>
              <View style={styles.overallRatingContainer}>
                <View style={styles.ratingRow}>
                  <ThemedText style={styles.ratingNumber}>4.8</ThemedText>
                  <View style={styles.starsRow}>
                    {[1,2,3,4,5].map((star) => (
                      <Ionicons key={star} name="star" size={16} color="#FFB800" />
                    ))}
                  </View>
                </View>
                <ThemedText style={styles.totalReviews}>Based on 2.5k reviews</ThemedText>
                <TouchableOpacity 
                  style={styles.writeReviewButton}
                  onPress={() => router.push('/write-review')}
                >
                  <ThemedText style={styles.writeReviewText}>Write a Review</ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {REVIEWS.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: review.userImage }} style={styles.reviewerImage} />
                  <View style={styles.reviewerInfo}>
                    <ThemedText style={styles.reviewerName}>{review.userName}</ThemedText>
                    <View style={styles.reviewMeta}>
                      <View style={styles.starsRow}>
                        {[1,2,3,4,5].map((star) => (
                          <Ionicons 
                            key={star} 
                            name="star" 
                            size={12} 
                            color={star <= review.rating ? "#FFB800" : "#E0E0E0"} 
                          />
                        ))}
                      </View>
                      <ThemedText style={styles.reviewDate}>{review.date}</ThemedText>
                    </View>
                  </View>
                </View>
                <ThemedText style={styles.reviewText}>{review.comment}</ThemedText>
                {review.images && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages}>
                    {review.images.map((image, index) => (
                      <Image key={index} source={{ uri: image }} style={styles.reviewImage} />
                    ))}
                  </ScrollView>
                )}
              </View>
            ))}
          </View>
        );
      
      case 'Photos':
        return (
          <View style={styles.tabContent}>
            <View style={styles.photoCategories}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['All', 'Food', 'Interior', 'Ambiance'].map((category) => (
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
              {getFilteredPhotos().map((photo) => (
                <TouchableOpacity key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.image }} style={styles.photo} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case 'Info':
        return (
          <View style={styles.tabContent}>
            <View style={styles.infoSection}>
              <ThemedText style={styles.infoTitle}>Opening Hours</ThemedText>
              <View style={styles.hoursRow}>
                <ThemedText style={styles.dayText}>Monday - Friday</ThemedText>
                <ThemedText style={styles.timeText}>9:00 AM - 10:00 PM</ThemedText>
              </View>
              <View style={styles.hoursRow}>
                <ThemedText style={styles.dayText}>Saturday - Sunday</ThemedText>
                <ThemedText style={styles.timeText}>10:00 AM - 11:00 PM</ThemedText>
              </View>
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={styles.infoTitle}>Contact</ThemedText>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="call-outline" size={20} color="#666" />
                <ThemedText style={styles.contactText}>+1 (555) 123-4567</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <ThemedText style={styles.contactText}>contact@gastronomicgrove.com</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow}>
                <Ionicons name="globe-outline" size={20} color="#666" />
                <ThemedText style={styles.contactText}>www.gastronomicgrove.com</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={styles.infoTitle}>Facilities</ThemedText>
              <View style={styles.facilitiesGrid}>
                {['Parking', 'WiFi', 'Outdoor Seating', 'Air Conditioning'].map((facility) => (
                  <View key={facility} style={styles.facilityItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#6B4EFF" />
                    <ThemedText style={styles.facilityText}>{facility}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Image Slider */}
        <View style={styles.imageSliderContainer}>
          {/* Main Image Slider */}
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
            {GALLERY_IMAGES.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.mainImage}
              />
            ))}
          </ScrollView>

          {/* Navigation Buttons */}
          <View style={styles.navigationHeader}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.rightButtons}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Play Button Overlay */}
          <TouchableOpacity style={styles.playButton}>
            <View style={styles.playButtonCircle}>
              <Ionicons name="play" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Thumbnail Container */}
          <View style={styles.thumbnailOuterContainer}>
            <View style={styles.thumbnailBackground}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailContent}
                decelerationRate="fast"
                snapToInterval={64} // thumbnail width + gap
                snapToAlignment="center"
              >
                {GALLERY_IMAGES.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSnapToImage(index)}
                    style={[
                      styles.thumbnailWrapper,
                      currentImageIndex === index && styles.activeThumbnail
                    ]}
                  >
                    <Image
                      source={{ uri: image }}
                      style={styles.thumbnailImage}
                    />
                    <View style={[
                      styles.thumbnailOverlay,
                      currentImageIndex === index && styles.activeThumbnailOverlay
                    ]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Replace the old pagination dots with the new animated ones */}
          {renderPaginationDots()}
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          {/* Offer and Rating Row */}
          <View style={styles.statsRow}>
            <View style={styles.offerContainer}>
              <Ionicons name="pricetag" size={16} color="#6B4EFF" />
              <ThemedText style={styles.offerText}>10% OFF</ThemedText>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <ThemedText style={styles.ratingText}>4.8</ThemedText>
              <ThemedText style={styles.reviewCount}>(365 reviews)</ThemedText>
            </View>
          </View>

          {/* Restaurant Details */}
          <Text style={styles.restaurantName}>LibertyBite Bistro</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.detailText}>15 min</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text style={styles.detailText}>$$$</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="restaurant-outline" size={16} color="#666" />
              <Text style={styles.detailText}>Italian</Text>
            </View>
          </View>
          <Text style={styles.address}>1012 Ocean avenue, New york, USA</Text>

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
  mainImage: {
    width: width,
    height: width * 0.7,
    resizeMode: 'cover',
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
  restaurantName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
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
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
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
  },
  writeReviewText: {
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
}); 