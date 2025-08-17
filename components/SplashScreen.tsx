import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '../components/ThemedText';

const { width } = Dimensions.get('window');

export function SplashScreen() {
  const router = useRouter();

  const handleExploreAsGuest = () => {
    router.push('/(tabs)');
  };

  const handleCreateAccount = () => {
    router.push('/(auth)/sign-up');
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={styles.imageWrapper}>
          <Image
            source={require('../assets/images/restaurant-1.jpg')}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.4)']}
            style={styles.gradient}
          />
          <Text style={styles.tag}>#Restaurant</Text>
        </View>
        <View style={styles.imageWrapper}>
          <Image
            source={require('../assets/images/food-1.jpg')}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.4)']}
            style={styles.gradient}
          />
          <Text style={styles.tag}>#Food</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>Find Your</ThemedText>
          <ThemedText style={styles.highlightedText}>Perfect Restaurant</ThemedText>
          <ThemedText style={styles.subtitle}>
            Discover amazing places to eat and drink around you
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleCreateAccount}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.primaryButtonText}>Create Account</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleExploreAsGuest}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.secondaryButtonText}>Explore as Guest</ThemedText>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <ThemedText style={styles.signInText}>Already have an account? </ThemedText>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <ThemedText style={styles.signInLink}>Sign In</ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    flexDirection: 'row',
    height: '45%',
  },
  imageWrapper: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  tag: {
    position: 'absolute',
    top: 20,
    left: 20,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 32,
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    color: '#000',
    lineHeight: 42,
  },
  highlightedText: {
    fontSize: 32,
    color: '#FF5B5B',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    lineHeight: 42,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 'auto',
    paddingHorizontal: 8,
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButton: {
    backgroundColor: '#6B4EFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6B4EFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  secondaryButtonText: {
    color: '#6B4EFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  signInLink: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#6B4EFF',
  },
}); 