import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationContextType {
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  locationError: string | null;
  isLocationReady: boolean;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_LOCATION = {
  latitude: 26.8467, // Lucknow, India coordinates
  longitude: 80.9462,
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  // Helper function for distance calculation
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async function getCurrentLocation() {
    try {
      console.log('🌍 Starting location request...');
      
      // Check if location services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        console.log('📍 Location services not enabled, using default location');
        setUserLocation(DEFAULT_LOCATION);
        setIsLocationLoading(false);
        return;
      }

      // Check permissions
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('🔐 Requesting location permission...');
        const permission = await Location.requestForegroundPermissionsAsync();
        status = permission.status;
      }

      if (status !== 'granted') {
        console.log('❌ Location permission denied, using default location');
        setUserLocation(DEFAULT_LOCATION);
        setIsLocationLoading(false);
        return;
      }

      console.log('📍 Getting current position with high accuracy...');
      
      // Get location with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation, // Highest accuracy
        timeInterval: 5000, // Reduced from 10s to 5s
        distanceInterval: 1, // Reduced from 10m to 1m for better precision
      });

      console.log('✅ Location obtained:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString()
      });

      // Validate location is reasonable (within India bounds for your use case)
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      
      if (lat < 6 || lat > 37 || lon < 68 || lon > 98) {
        console.log('⚠️ Location seems outside India, this might be inaccurate:', { lat, lon });
        console.log('🔧 Consider using default location if this is incorrect');
      }

      // Calculate distance from default location for reference
      const distanceFromDefault = calculateDistance(
        lat, 
        lon, 
        DEFAULT_LOCATION.latitude, 
        DEFAULT_LOCATION.longitude
      );
      
      console.log('📏 Distance from Lucknow center:', distanceFromDefault.toFixed(2), 'km');
      
      // If location is very far from expected area, warn
      if (distanceFromDefault > 100) {
        console.log('⚠️ Your location is', distanceFromDefault.toFixed(2), 'km from Lucknow - this might affect restaurant results');
      }

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setIsLocationLoading(false);
      
    } catch (error) {
      console.error('❌ Location error:', error);
      console.log('🔄 Using default Lucknow location due to error');
      setUserLocation(DEFAULT_LOCATION);
      setIsLocationLoading(false);
    }
  }

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        locationError: null, // No longer needed as per new logic
        isLocationReady: !isLocationLoading, // Updated based on new state
        refreshLocation: getCurrentLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
} 