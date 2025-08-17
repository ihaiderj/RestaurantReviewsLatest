import { View, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { login } from '@/utils/api';
import { useAuth } from '@/contexts/auth';
import Constants from 'expo-constants';

// Get Google OAuth client IDs from app config
const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId || '';
const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId || '';
const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId || '';
const googleExpoClientId = Constants.expoConfig?.extra?.googleExpoClientId || '';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleBack = () => {
    router.replace('/(tabs)');
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
      
      // First store the tokens and sign in
      await signIn(response);
      
      // Set success message
      setSuccessMessage('Login successful!');

      // Add a small delay to ensure tokens are stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then navigate
      router.replace('/(tabs)/profile');

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

  const isFormValid = emailOrUsername.trim() !== '' && password.trim() !== '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.title}>Welcome Back!</ThemedText>
            <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email or Username</ThemedText>
            <TextInput
              style={[styles.input, emailOrUsername.length > 0 && styles.inputFilled]}
              value={emailOrUsername}
              onChangeText={setEmailOrUsername}
              placeholder="Enter your email or username"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput, password.length > 0 && styles.inputFilled]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

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

          <View style={styles.signUpContainer}>
            <ThemedText style={styles.signUpText}>Don't have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.termsContainer}
            onPress={() => router.push('/(auth)/terms')}
          >
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
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 12,
  },
  backButton: {
    marginBottom: 32,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  header: {
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  titleContainer: {
    gap: 8,
  },
  title: {
    fontSize: 34,
    fontFamily: 'PoppinsBold',
    color: '#1A1A1A',
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'PoppinsRegular',
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'PoppinsMedium',
    color: '#1A1A1A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'PoppinsRegular',
    backgroundColor: '#F9FAFB',
    color: '#1A1A1A',
  },
  inputFilled: {
    backgroundColor: '#fff',
    borderColor: '#6B4EFF',
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
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  signInButton: {
    backgroundColor: '#6B4EFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#6B4EFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonDisabled: {
    backgroundColor: '#A5A6F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signUpText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'PoppinsRegular',
  },
  signUpLink: {
    fontSize: 14,
    color: '#6B4EFF',
    fontFamily: 'PoppinsSemiBold',
  },
  termsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  termsLink: {
    color: '#6B4EFF',
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    textDecorationLine: 'underline',
  },
}); 