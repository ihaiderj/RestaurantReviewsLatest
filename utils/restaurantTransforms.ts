import { ApiRestaurant, getMediaUrl, getRestaurantCoordinates } from './api';

export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  rating: number;
  review_count: number;
  image: { uri: string };
  distance: string;
  hasOffer: boolean;
  street_address: string;
  city: string;
  latitude: number;
  longitude: number;
  venue_types: string[];
  cuisine_styles: string[];
  logo: string | null;
  is_approved: boolean;
  discount?: string;
}

// Helper function to calculate distance between two coordinates
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

// Function to convert API restaurant to UI restaurant
export const transformApiRestaurant = (apiRestaurant: ApiRestaurant, userLat?: number, userLon?: number): Restaurant => {
  // Get the best image from the restaurant
  let imageUri = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&q=80';
  
  if (apiRestaurant.images && apiRestaurant.images.length > 0) {
    imageUri = getMediaUrl(apiRestaurant.images[0].image);
  } else if (apiRestaurant.logo) {
    imageUri = getMediaUrl(apiRestaurant.logo);
  }

  // Get coordinates using the helper function
  const coordinates = getRestaurantCoordinates(apiRestaurant);

  // Calculate distance if user location is available
  let distance = 'Unknown distance';
  if (userLat && userLon && coordinates) {
    const dist = calculateDistance(userLat, userLon, coordinates.latitude, coordinates.longitude);
    distance = `${dist.toFixed(1)} km away`;
  }

  // Create cuisine string from cuisine_styles
  const cuisineString = apiRestaurant.cuisine_styles && apiRestaurant.cuisine_styles.length > 0 
    ? apiRestaurant.cuisine_styles.map(style => typeof style === 'string' ? style : style.name).join(' • ')
    : 'Restaurant';

  return {
    id: apiRestaurant.id,
    name: apiRestaurant.name,
    cuisine: cuisineString,
    rating: typeof apiRestaurant.rating === 'number' && apiRestaurant.rating > 0 ? apiRestaurant.rating : 0,
    review_count: typeof apiRestaurant.review_count === 'number' && apiRestaurant.review_count > 0
      ? apiRestaurant.review_count
      : typeof apiRestaurant.total_reviews === 'number' && apiRestaurant.total_reviews > 0
      ? apiRestaurant.total_reviews
      : 0,
    image: { uri: imageUri },
    distance,
    hasOffer: Boolean(apiRestaurant.discount), // Convert discount to hasOffer
    street_address: apiRestaurant.street_address || '',
    city: apiRestaurant.city || '',
    latitude: coordinates?.latitude || 0,
    longitude: coordinates?.longitude || 0,
    venue_types: apiRestaurant.venue_types || [],
    cuisine_styles: apiRestaurant.cuisine_styles ? apiRestaurant.cuisine_styles.map((style: any) => typeof style === 'string' ? style : style.name) : [],
    logo: apiRestaurant.logo || null,
    is_approved: apiRestaurant.is_approved || false,
    discount: apiRestaurant.discount,
  };
};