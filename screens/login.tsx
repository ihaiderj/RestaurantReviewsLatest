import { View, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { login, socialLogin } from '@/utils/api';
import { useAuth } from '@/contexts/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType } from 'expo-auth-session';

// Initialize WebBrowser
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Google Auth
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    responseType: ResponseType.Token,
  });

  // Facebook Auth
  const [fbRequest, fbResponse, promptFacebookAsync] = Facebook.useAuthRequest({
    clientId: "YOUR_FACEBOOK_APP_ID",
    responseType: ResponseType.Token,
  });

  const handleBack = () => {
    // Navigate to the tabs layout
    router.push('/(tabs)');
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      if (!emailOrUsername.trim() || !password.trim()) {
        throw new Error('Both email/username and password are required');
      }

      const response = await login(emailOrUsername, password);
      
      // First set the success message
      setSuccessMessage('Login successful!');
      
      // Then sign in
      await signIn(response);

      // Navigate directly to profile tab
      router.push('/(tabs)/profile');

    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await promptGoogleAsync();
      
      if (response?.type === 'success') {
        const { access_token } = response.params;
        
        // Send token to your backend
        const result = await socialLogin('google', access_token);
        
        // First set success message
        setSuccessMessage('Successfully logged in with Google');
        
        // Then sign in
        await signIn(result);

        // Navigate directly to profile tab
        router.push('/(tabs)/profile');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(error instanceof Error ? error.message : 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await promptFacebookAsync();
      
      if (response?.type === 'success') {
        const { access_token } = response.params;
        
        // Send token to your backend
        const result = await socialLogin('facebook', access_token);
        
        // First set success message
        setSuccessMessage('Successfully logged in with Facebook');
        
        // Then sign in
        await signIn(result);

        // Navigate directly to profile tab
        router.push('/(tabs)/profile');
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      setError(error instanceof Error ? error.message : 'Facebook login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = emailOrUsername.trim() !== '' && password.trim() !== '';

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBack}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.content}>
        <ThemedText style={styles.title}>Sign In</ThemedText>
        <ThemedText style={styles.subtitle}>Hi! Welcome back, you've been missed</ThemedText>

        {/* Show error message if exists */}
        {error && (
          <View style={styles.messageContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}

        {/* Show success message if exists */}
        {successMessage && (
          <View style={styles.messageContainer}>
            <ThemedText style={styles.successText}>{successMessage}</ThemedText>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email or Username</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter your email or username"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••••••••"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.signInButton,
              (!isFormValid || isLoading) && styles.signInButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.signInButtonText}>Sign In</ThemedText>
            )}
          </TouchableOpacity>

          <ThemedText style={styles.orText}>Or sign in with</ThemedText>

          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleFacebookLogin}
              disabled={isLoading}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.signUpContainer}>
            <ThemedText style={styles.signUpText}>Don't have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/terms')}>
            <ThemedText style={styles.termsLink}>Terms & Condition</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 16,
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
    paddingTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    height: 48,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#6B4EFF',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#6B4EFF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signInButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    color: '#666',
    fontSize: 14,
  },
  signUpLink: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
  },
  termsLink: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#D1FAE5',
    padding: 8,
    borderRadius: 8,
  },
  socialIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 