# 📸 PHOTO DISPLAY FIXES APPLIED - Edit Form Issues

## 🚨 **Root Causes Identified:**

### ❌ **Problem 1**: Photos Not Passed to Edit Form
**Issue**: Edit navigation wasn't including `photos` in `existingData`
**Location**: `screens/review.tsx` and `screens/restaurant-profile.tsx`

### ❌ **Problem 2**: Incorrect Photo Structure Mapping  
**Issue**: Photos have `{id, image}` structure but mapping was incorrect
**Location**: `screens/write-review.tsx` photo pre-population

### ❌ **Problem 3**: No Debug Info for Photo Issues
**Issue**: No visibility into photo loading/display problems
**Location**: Missing debugging in photo display logic

## 🔧 **Fixes Applied:**

### 1. **Fixed Edit Navigation (Both Screens):**
```typescript
// ✅ FIXED: Added missing photos to existingData
existingData: JSON.stringify({
  overall_rating: review.overall_rating,
  comment: review.comment,
  category_ratings: review.category_ratings,
  photos: review.photos  // ← ADDED THIS!
})
```

### 2. **Improved Photo Mapping (write-review.tsx):**
```typescript
// ✅ FIXED: Better photo structure handling + debugging
const existingPhotos = existingData.photos.map((photo: any, index: number) => ({
  uri: getMediaUrl(photo.image || photo.photo || photo.url || photo.uri),
  type: 'image/jpeg',
  name: photo.name || `existing_photo_${index + 1}.jpg`,
  isExisting: true // Mark as existing photo for visual distinction
}));

console.log('📸 Raw existing photos data:', existingData.photos);
console.log('✏️ Pre-populated existing photos:', existingPhotos.length, existingPhotos);
```

### 3. **Added Photo Display Debugging:**
```typescript
// ✅ ADDED: Visual debugging in photo preview
<ThemedText style={styles.photoDebugText}>
  📸 Photos ({photos.length}): {photos.map(p => p.isExisting ? 'existing' : 'new').join(', ')}
</ThemedText>

// ✅ ADDED: Image load/error debugging
<Image 
  source={{ uri: photo.uri }} 
  onError={(e) => console.log(`📸 Image error for ${photo.name}:`, e.nativeEvent.error)}
  onLoad={() => console.log(`📸 Image loaded successfully: ${photo.name}`)}
/>

// ✅ ADDED: Visual badge for existing photos
{photo.isExisting && (
  <View style={styles.existingPhotoBadge}>
    <ThemedText style={styles.existingPhotoText}>📷</ThemedText>
  </View>
)}
```

### 4. **Enhanced EditReview Debugging:**
```typescript
// ✅ ADDED: Detailed photo debugging in API call
console.log('📤 Edit review data being sent:', {
  photos_count: reviewData.photos?.length || 0,
  photos_sample: reviewData.photos?.[0] ? {
    uri: reviewData.photos[0].uri?.substring(0, 50) + '...',
    type: reviewData.photos[0].type,
    name: reviewData.photos[0].name,
    isExisting: reviewData.photos[0].isExisting
  } : null
});
```

## 🧪 **Testing Instructions:**

### ✅ **Test Existing Photo Display:**
1. **Open a review with photos** for editing
2. **Check console logs** for:
   - `📸 Raw existing photos data: [...]`
   - `✏️ Pre-populated existing photos: X [...]`  
3. **Look for photos** in the edit form
4. **Check for existing photo badges** (📷 icon)

### ✅ **Test New Photo Upload:**
1. **Add new photos** to existing review
2. **Check visual distinction**: existing vs new photos
3. **Submit the edit** and verify both existing and new photos save

### ✅ **Debug Photo Issues:**
1. **Console logs show**:
   - Photo data structure
   - Image loading success/errors
   - Photo count and types
2. **Visual indicators show**:
   - Total photo count
   - Existing vs new photo types
   - Photo loading status

## 🎯 **Expected Results:**

### ✅ **Edit Form Should Now Show:**
- ✅ **Existing photos** from the review being edited
- ✅ **Visual badges** indicating existing photos (📷)
- ✅ **Debug info** showing photo count and types
- ✅ **Error handling** for broken image URLs

### ✅ **Edit Submission Should Handle:**
- ✅ **Existing photos** preserved correctly
- ✅ **New photos** added alongside existing ones
- ✅ **Mixed existing/new** photo combinations
- ✅ **Proper FormData** with all photos

## 📋 **Debug Output Examples:**

**If working correctly:**
```
📸 Raw existing photos data: [{id: 123, image: "photos/review_123.jpg"}]
✏️ Pre-populated existing photos: 1 [{uri: "https://api.../photos/review_123.jpg", isExisting: true}]
📸 Image loaded successfully: existing_photo_1.jpg
📸 Photos (1): existing
```

**If photos missing:**
```
📸 Raw existing photos data: undefined
✏️ Pre-populated existing photos: 0 []
📸 Photos (0): 
```

---

**Status**: ✅ **READY FOR TESTING**  
**Focus**: Photo display in edit form + submission handling  
**Debug**: Comprehensive logging for photo issues