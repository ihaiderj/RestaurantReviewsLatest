# Hamza Hotel Debugging and Fixes

## Issue Description
Hamza Hotel (coordinates: 12.9861564, 77.604844) is not appearing in search results within 10km range, even though it used to appear before.

## Root Causes Identified and Fixed

### 1. **API Function Distance Cap** ✅ FIXED
**Problem**: The `getNearbyRestaurants` function was artificially capping the radius at 10km
```typescript
// BEFORE (utils/api.ts line 370)
Math.min(radius, 10) // ❌ Capped at 10km
```
**Fix**: Removed the artificial cap
```typescript
// AFTER
radius.toString() // ✅ Use actual radius
```

### 2. **Home Screen Distance Cap** ✅ FIXED
**Problem**: Home screen was capping distance at 5km (already fixed in previous update)
```typescript
// BEFORE (app/(tabs)/index.tsx line 692)
Math.min(selectedDistance, 5) // ❌ Capped at 5km
```
**Fix**: Use actual selected distance
```typescript
// AFTER
selectedDistance // ✅ Use actual selected distance
```

### 3. **Result Limit Too Low** ✅ FIXED
**Problem**: API was limited to only 20 results
```typescript
// BEFORE (utils/api.ts line 365)
limit: '20' // ❌ Only 20 restaurants
```
**Fix**: Increased limit to get more restaurants
```typescript
// AFTER
limit: '50' // ✅ 50 restaurants
```

## Potential Issues Still Being Investigated

### 4. **Coordinate Format Issues**
**Possible Problem**: Hamza Hotel might have coordinates in a format that's not being parsed correctly
**Debugging Added**: Special logging for restaurants with "hamza" or "hotel" in the name

### 5. **Approval Status**
**Possible Problem**: Hamza Hotel might not be approved (`is_approved: false`)
**Debugging Added**: Checking approval status in API response

### 6. **Distance Calculation Issues**
**Possible Problem**: The distance calculation might be incorrect for this specific location
**Debugging Added**: Logging actual coordinates and distance calculations

## Debugging Features Added

### API Level Debugging (utils/api.ts)
```typescript
// Added to getNearbyRestaurants function
console.log(`🔍 [${requestId}] Requesting radius: ${radius}km`);

// Special Hamza Hotel detection
const hamzaHotel = response.data.results.find((restaurant: any) => 
  restaurant.name.toLowerCase().includes('hamza') || 
  restaurant.name.toLowerCase().includes('hotel')
);
if (hamzaHotel) {
  console.log(`🏨 [${requestId}] Found Hamza Hotel or similar:`, {
    name: hamzaHotel.name,
    id: hamzaHotel.id,
    coordinates: hamzaHotel.coordinates,
    latitude: hamzaHotel.latitude,
    longitude: hamzaHotel.longitude,
    is_approved: hamzaHotel.is_approved
  });
}
```

### Home Screen Debugging (app/(tabs)/index.tsx)
```typescript
// Special debugging for Hamza Hotel during coordinate filtering
if (restaurant.name.toLowerCase().includes('hamza') || restaurant.name.toLowerCase().includes('hotel')) {
  console.log(`🏨 [${fetchId}] Hamza Hotel check:`, {
    name: restaurant.name,
    coordinates: coordinates,
    hasValidCoordinates: hasValidCoordinates,
    raw_coordinates: restaurant.coordinates,
    raw_latitude: restaurant.latitude,
    raw_longitude: restaurant.longitude
  });
}
```

## Testing Steps

1. **Check Console Logs**: Look for Hamza Hotel debugging messages
2. **Test Different Distances**: Try 5km, 10km, 15km to see if it appears
3. **Check API Response**: Verify if Hamza Hotel is in the raw API response
4. **Verify Coordinates**: Check if coordinates are being parsed correctly
5. **Check Approval Status**: Verify if the restaurant is approved

## Expected Results After Fixes

- **10km Search**: Should now actually search within 10km (not capped)
- **More Results**: Should get up to 50 restaurants instead of 20
- **Better Debugging**: Console logs will show exactly what's happening with Hamza Hotel

## Files Modified
- `utils/api.ts` - Removed 10km cap, increased limit to 50, added debugging
- `app/(tabs)/index.tsx` - Added Hamza Hotel specific debugging

## Next Steps
1. Test the app with the fixes
2. Check console logs for Hamza Hotel debugging messages
3. If still not appearing, the issue might be:
   - Restaurant not in database
   - Restaurant not approved
   - Coordinate format issues
   - Backend filtering issues 