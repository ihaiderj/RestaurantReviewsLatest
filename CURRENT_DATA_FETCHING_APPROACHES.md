# Current Data Fetching & Display Approaches

## 📊 **Overview of All Three Screens**

This document outlines the current implementation approaches for data fetching and display across the three main screens: **Home Screen**, **Filter Restaurants (Map Screen)**, and **Review Screen**.

---

## 🏠 **1. HOME SCREEN** (`app/(tabs)/index.tsx`)

### **📋 Current Approach: Lazy Loading with Pagination**

#### **Data Fetching Strategy:**
```typescript
// Primary API Call
response = await getNearbyRestaurants(
  userCoordinates.latitude, 
  userCoordinates.longitude, 
  selectedDistance, // Uses actual selected distance (no cap)
  page, // Current page number
  20 // 20 restaurants per page for lazy loading
);
```

#### **Key Features:**
- ✅ **Lazy Loading**: Loads 20 restaurants initially, then loads more on scroll
- ✅ **Pagination**: Uses `page` parameter for subsequent loads
- ✅ **Distance Filter**: Respects user's selected distance (no artificial caps)
- ✅ **Performance Monitoring**: Extensive logging for performance analysis
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Coordinate Validation**: Filters out restaurants without valid coordinates

#### **State Management:**
```typescript
const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const [isLoadingMore, setIsLoadingMore] = useState(false);
const [selectedDistance, setSelectedDistance] = useState(1);
```

#### **Loading More Data:**
```typescript
const loadMoreRestaurants = useCallback(async () => {
  if (!hasMore || isLoadingMore) return;
  
  const nextPage = page + 1;
  const response = await getNearbyRestaurants(
    userCoordinates.latitude,
    userCoordinates.longitude,
    selectedDistance,
    nextPage,
    20
  );
  
  // Append new restaurants to existing list
  setRestaurants(prev => [...prev, ...transformedRestaurants]);
  setPage(nextPage);
  setHasMore(!!response.next);
}, [hasMore, isLoadingMore, userCoordinates, page, selectedDistance]);
```

#### **Performance Metrics:**
- **Initial Load**: ~20 restaurants
- **Subsequent Loads**: 20 restaurants each
- **Total Time Target**: <1500ms for excellent UX
- **Memory Management**: Efficient state updates

---

## 🗺️ **2. FILTER RESTAURANTS SCREEN** (`screens/filter-restaurants.native.tsx`)

### **📋 Current Approach: Hybrid Loading (Temporarily Simplified)**

#### **Data Fetching Strategy:**
```typescript
// Currently using filtered restaurants only (viewport loading disabled)
const restaurantsToShow = filteredRestaurants;

// Viewport loading temporarily disabled to prevent conflicts
// TODO: Re-enable with proper conflict resolution
// loadRestaurantsInViewport(region);
```

#### **Key Features:**
- ✅ **Map-Based Display**: Shows restaurants as markers on map
- ✅ **List View**: Scrollable list of restaurants below map
- ✅ **Search Integration**: Supports keyword, cuisine, venue type, amenity searches
- ✅ **Distance Filtering**: Real-time distance-based filtering
- ✅ **Error Prevention**: Enhanced marker validation and unique keys
- ✅ **Memory Management**: Cleanup effects to prevent leaks

#### **State Management:**
```typescript
const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
const [viewportRestaurants, setViewportRestaurants] = useState<Restaurant[]>([]);
const [isViewportLoading, setIsViewportLoading] = useState(false);
const [currentViewport, setCurrentViewport] = useState(null);
```

#### **Map Marker Management:**
```typescript
const restaurantMarkers = useMemo(() => {
  const validRestaurants = restaurantsToShow.filter((restaurant, index, self) => 
    restaurant && restaurant.id && self.findIndex(r => r.id === restaurant.id) === index
  );
  
  const markers = validRestaurants.map((restaurant) => {
    // Enhanced validation
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      return null;
    }
    
    return (
      <MarkerComponent
        key={`restaurant-${restaurant.id}-${lat.toFixed(6)}-${lng.toFixed(6)}`}
        coordinate={{ latitude: lat, longitude: lng }}
        // ... other props
      />
    );
  }).filter(Boolean);
  
  return markers;
}, [filteredRestaurants]);
```

#### **Search & Filter Capabilities:**
- **Keyword Search**: Restaurant name, cuisine, address
- **Cuisine Filter**: Specific cuisine types
- **Venue Type Filter**: Restaurant, cafe, bar, etc.
- **Amenity Filter**: WiFi, parking, delivery, etc.
- **Distance Filter**: Real-time distance calculation
- **Location-Based**: Uses user's current location

#### **Performance Optimizations:**
- **Throttled Region Changes**: Prevents excessive API calls
- **Custom Map Style**: Reduced map features for better performance
- **Error Boundaries**: Graceful error handling
- **Memory Cleanup**: Proper component unmounting

---

## 📝 **3. REVIEW SCREEN** (`screens/review.tsx`)

### **📋 Current Approach: Hybrid Loading (50 Initial + Distance Filtering)**

#### **Data Fetching Strategy:**
```typescript
// Load restaurants based on search mode
if (searchMode === 'near_me') {
  console.log(`📏 Loading ALL restaurants within ${selectedDistance}km`);
  response = await getNearbyRestaurants(
    userLocation.latitude,
    userLocation.longitude,
    selectedDistance
  );
} else {
  console.log('🌍 Loading all restaurants');
  response = await searchRestaurantsByLocation(
    userLocation.latitude,
    userLocation.longitude,
    50 // Large radius for "all" mode
  );
}
```

#### **Key Features:**
- ✅ **Dual Tab Interface**: "Post Review" and "My Reviews" tabs
- ✅ **Distance-Based Filtering**: Real-time distance calculation
- ✅ **Search Integration**: Restaurant name and cuisine search
- ✅ **User Review Management**: Load and display user's existing reviews
- ✅ **Authentication Required**: Login check for review functionality
- ✅ **Real-Time Filtering**: Client-side filtering for immediate results

#### **State Management:**
```typescript
const [activeTab, setActiveTab] = useState<TabType>('post');
const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
const [userReviews, setUserReviews] = useState<UserReview[]>([]);
const [selectedDistance, setSelectedDistance] = useState(1);
const [searchMode, setSearchMode] = useState<'near_me' | 'all'>('near_me');
```

#### **Distance Filtering:**
```typescript
// Real-time distance filtering
useEffect(() => {
  let filtered = restaurants;
  
  // Apply search filter
  if (searchQuery.trim() !== '') {
    filtered = filtered.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Apply distance filter for "near_me" mode
  if (searchMode === 'near_me' && userLocation) {
    filtered = filtered.filter(restaurant => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurant.latitude,
        restaurant.longitude
      );
      return distance <= selectedDistance;
    });
  }
  
  setFilteredRestaurants(filtered);
}, [searchQuery, restaurants, searchMode, selectedDistance, userLocation]);
```

#### **User Review Management:**
```typescript
const loadUserReviews = async () => {
  try {
    setLoading(true);
    const reviews = await getUserReviews();
    setUserReviews(reviews);
  } catch (error) {
    console.error('❌ Error loading user reviews:', error);
    Alert.alert('Error', 'Failed to load your reviews');
  } finally {
    setLoading(false);
  }
};
```

---

## 🔄 **Comparison Summary**

| Feature | Home Screen | Filter Screen | Review Screen |
|---------|-------------|---------------|---------------|
| **Loading Strategy** | Lazy Loading (20/page) | Hybrid (Temporarily Simplified) | Hybrid (50 initial) |
| **Pagination** | ✅ Infinite Scroll | 🔄 Viewport-based (disabled) | ❌ Single load |
| **Distance Filter** | ✅ Real-time | ✅ Real-time | ✅ Real-time |
| **Search** | ✅ Basic search | ✅ Advanced search | ✅ Basic search |
| **Map Display** | ❌ List only | ✅ Map + List | ❌ List only |
| **Performance** | ✅ Optimized | 🔄 Under optimization | ⚠️ Needs improvement |
| **Error Handling** | ✅ Comprehensive | ✅ Enhanced | ⚠️ Basic |

---

## 🎯 **Current Status & Next Steps**

### **✅ Working Well:**
1. **Home Screen**: Fully optimized with lazy loading
2. **Distance Filtering**: Consistent across all screens
3. **Error Handling**: Robust error management
4. **Default Images**: Consistent fallback images

### **🔄 In Progress:**
1. **Filter Screen**: Viewport loading temporarily disabled for stability
2. **Map Performance**: Under optimization
3. **Review Screen**: Needs pagination implementation

### **📋 Next Steps:**
1. **Re-enable Viewport Loading**: Once conflicts are resolved
2. **Implement Review Pagination**: Add lazy loading to review screen
3. **Performance Optimization**: Further optimize map rendering
4. **Unified Approach**: Standardize loading strategies across screens

---

## 🚀 **Recommended Improvements**

### **1. Standardize Pagination:**
- Implement consistent lazy loading across all screens
- Use similar page sizes (20-50 restaurants per load)

### **2. Optimize Map Performance:**
- Implement proper viewport-based loading
- Add marker clustering for large datasets
- Optimize map region change handling

### **3. Enhance Search:**
- Implement unified search across all screens
- Add search history and suggestions
- Optimize search performance

### **4. Improve Error Handling:**
- Standardize error messages across screens
- Add retry mechanisms
- Implement offline support

The current approaches provide a solid foundation with room for optimization and standardization! 🎉







