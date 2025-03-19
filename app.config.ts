import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Restaurant Reviews",
  slug: "restaurant-reviews",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.restaurantreviews",
    config: {
      googleMapsApiKey: "YOUR_IOS_API_KEY" // Replace with your iOS API key
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.yourcompany.restaurantreviews",
    config: {
      googleMaps: {
        apiKey: "AIzaSyD3i0OrUWuNYcf3M3CZYv12jJUXhv0Nylg"
      }
    },
    permissions: [
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.FOREGROUND_SERVICE"
    ]
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Allow Restaurant Reviews to use your location."
      }
    ]
  ],
  extra: {
    googleMapsApiKey: "AIzaSyD3i0OrUWuNYcf3M3CZYv12jJUXhv0Nylg",
    eas: {
      projectId: "your-project-id"
    }
  }
}); 