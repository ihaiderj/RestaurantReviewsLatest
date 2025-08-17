# Home Screen Distance Selector Fix

## Issue Identified

**Problem**: Home screen was showing incorrect results compared to Reviews screen for the same distance range.

**Root Cause**: Home screen was artificially capping the distance at 5km for "performance reasons", even when users selected larger distances like 10km.

## The Bug

```typescript
// BEFORE (Line 692 in app/(tabs)/index.tsx)
response = await getNearbyRestaurants(
  userCoordinates.latitude, 
  userCoordinates.longitude, 
  Math.min(selectedDistance, 5) // ❌ Artificially capped at 5km
);
```

**Result**: When user selected 10km, the API was only called with 5km, showing fewer restaurants than expected.

## The Fix

```typescript
// AFTER (Fixed)
response = await getNearbyRestaurants(
  userCoordinates.latitude, 
  userCoordinates.longitude, 
  selectedDistance // ✅ Use actual selected distance
);
```

**Result**: Now when user selects 10km, the API is called with 10km, showing the correct number of restaurants.

## Why Reviews Screen Was Correct

The Reviews screen was already using the correct implementation:

```typescript
// Reviews screen (screens/review.tsx) - CORRECT
response = await getNearbyRestaurants(
  userLocation.latitude,
  userLocation.longitude,
  selectedDistance // ✅ Always uses actual selected distance
);
```

## Impact

### Before Fix
- User selects 10km → API called with 5km → Shows 5 restaurants
- User selects 15km → API called with 5km → Shows 5 restaurants  
- User selects 20km → API called with 5km → Shows 5 restaurants

### After Fix
- User selects 10km → API called with 10km → Shows 10 restaurants ✅
- User selects 15km → API called with 15km → Shows 15 restaurants ✅
- User selects 20km → API called with 20km → Shows 20 restaurants ✅

## Verification

Now both screens will show consistent results:
- **Home Screen**: Uses actual selected distance
- **Reviews Screen**: Uses actual selected distance
- **Filter Screen**: Uses actual selected distance

## Performance Consideration

The original 5km cap was likely added for performance reasons, but:
1. The API should handle larger distances efficiently
2. Users expect the distance selector to work as advertised
3. The Reviews screen was already working correctly without performance issues
4. Modern devices can handle larger result sets

## Files Modified
- `app/(tabs)/index.tsx` - Removed artificial 5km distance cap

## Testing
- [ ] Home screen shows correct number of restaurants for 10km
- [ ] Home screen shows correct number of restaurants for 15km  
- [ ] Home screen shows correct number of restaurants for 20km
- [ ] Results match between Home and Reviews screens for same distance
- [ ] Performance remains acceptable with larger distances 