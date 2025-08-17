import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "RestaurantReviews",
  slug: "RestaurantReviews",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  // splash: {
  //   image: "./assets/images/splash.png",
  //   resizeMode: "contain",
  //   backgroundColor: "#ffffff"
  // },

  assetBundlePatterns: [
    "**/*"
  ],
  scheme: "restaurantreviews",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.imran.restaurantreviews.preview",
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      usesNonExemptEncryption: false
      // googleSignIn: {
      //   reservedClientId: "YOUR_IOS_CLIENT_ID"
      // }
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: [],
      NSLocationWhenInUseUsageDescription: "Allow Restaurant Reviews to use your location to find nearby restaurants.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "Allow Restaurant Reviews to use your location to find nearby restaurants."
    }
  },
      android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ihaiderj.RestaurantReviews",

    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    permissions: [
      // Required for location-based features
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      // Optional: For background location (uncomment if needed)
      // "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.INTERNET"
    ],
    softwareKeyboardLayoutMode: "pan"
  },
  web: {
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Allow Restaurant Reviews to use your location."
      }
    ],
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 34,
          buildToolsVersion: "35.0.0",
          minSdkVersion: 24,
          // Fix Google Play Services compatibility
          googlePlayServicesLocationVersion: "21.0.1",
          googlePlayServicesMapsVersion: "18.1.0",
          // Exclude problematic modules
          packagingOptions: {
            pickFirst: [
              "lib/x86/libc++_shared.so",
              "lib/x86_64/libc++_shared.so",
              "lib/arm64-v8a/libc++_shared.so",
              "lib/armeabi-v7a/libc++_shared.so"
            ]
          }
        },
        ios: {
          deploymentTarget: "15.1"
        }
      }
    ]
  ],
  extra: {
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    googleExpoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    useMapsAPI: true,
    "eas": {
        "projectId": "cf0c1412-fd39-48ec-b0c6-f73f1f2c5d8b"
      }
  },
  owner: "restaurantreviewsapps"
}); 