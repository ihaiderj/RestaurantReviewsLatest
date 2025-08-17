import { View, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { register } from '@/utils/api';
import Constants from 'expo-constants';

type UserType = 'CUSTOMER' | 'OWNER';

// Get Google OAuth client IDs from app config
const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId || '';
const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId || '';
const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId || '';
const googleExpoClientId = Constants.expoConfig?.extra?.googleExpoClientId || '';

export default function SignUpScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('CUSTOMER');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update form validation to include username
  const isFormValid = 
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    email.trim() !== '' &&
    username.trim() !== '' &&
    password.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    password === confirmPassword;

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setResponse(null);

      if (!isFormValid) {
        throw new Error('Please fill in all required fields');
      }

      if (!agreeToTerms) {
        throw new Error('Please agree to the Terms & Conditions');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const userData = {
        username,
        email,
        password,
        confirm_password: confirmPassword,
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
      };

      const result = await register(userData);
      
      setResponse({
        type: 'success',
        message: `${result.message}\n\nAccount Details:\n` +
          `• Username: ${result.user.username}\n` +
          `• Name: ${result.user.first_name} ${result.user.last_name}\n` +
          `• Email: ${result.user.email}\n` +
          `• Account Type: ${result.user.user_type}`
      });

      // Automatically redirect to login after 2 seconds
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      setResponse({
        type: 'error',
        message: error instanceof Error ? error.message : 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Create Account</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <ThemedText style={styles.subtitle}>
          Fill your information below or register{'\n'}with your social account.
        </ThemedText>

        {response && (
          <View style={[
            styles.messageContainer,
            response.type === 'success' ? styles.successContainer : styles.errorContainer
          ]}>
            <ThemedText style={[
              styles.messageText,
              response.type === 'success' ? styles.successText : styles.errorText
            ]}>
              {response.message}
            </ThemedText>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <ThemedText style={styles.label}>First Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="John"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.halfInput}>
              <ThemedText style={styles.label}>Last Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Username</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
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

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••••••••"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.userTypeContainer}>
            <TouchableOpacity 
              style={[
                styles.radioOption,
                userType === 'CUSTOMER' && styles.radioOptionSelected
              ]}
              onPress={() => setUserType('CUSTOMER')}
            >
              <View style={styles.radioWrapper}>
                <View style={[
                  styles.radioOuter,
                  userType === 'CUSTOMER' && styles.radioOuterSelected
                ]}>
                  {userType === 'CUSTOMER' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <ThemedText style={[
                  styles.radioLabel,
                  userType === 'CUSTOMER' && styles.radioLabelSelected
                ]}>I am a customer</ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.radioOption,
                userType === 'OWNER' && styles.radioOptionSelected
              ]}
              onPress={() => setUserType('OWNER')}
            >
              <View style={styles.radioWrapper}>
                <View style={[
                  styles.radioOuter,
                  userType === 'OWNER' && styles.radioOuterSelected
                ]}>
                  {userType === 'OWNER' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <ThemedText style={[
                  styles.radioLabel,
                  userType === 'OWNER' && styles.radioLabelSelected
                ]}>I am a restaurant owner</ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.termsContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            <View style={[
              styles.checkbox,
              agreeToTerms && styles.checkboxSelected
            ]}>
              {agreeToTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <View style={styles.termsTextContainer}>
              <ThemedText style={styles.termsText}>Agree with </ThemedText>
              <TouchableOpacity onPress={() => router.push('/(auth)/terms')}>
                <ThemedText style={styles.termsLink}>Terms & Condition</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.signUpButton,
              (!isFormValid || !agreeToTerms) && styles.signUpButtonDisabled
            ]}
            disabled={!isFormValid || !agreeToTerms || isLoading}
            onPress={handleSignUp}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.signUpButtonText}>Create Account</ThemedText>
            )}
          </TouchableOpacity>

          <ThemedText style={styles.orText}>Or sign up with</ThemedText>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
          </View>

          <View style={styles.signInContainer}>
            <ThemedText style={styles.signInText}>Already have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <ThemedText style={styles.signInLink}>Sign In</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // To maintain header centering
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
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
  userTypeContainer: {
    marginVertical: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  radioOptionSelected: {
    borderColor: '#6B4EFF',
    backgroundColor: '#F8F7FF',
  },
  radioWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D1D1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#6B4EFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6B4EFF',
  },
  radioLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  radioLabelSelected: {
    color: '#6B4EFF',
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D1D1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: '#6B4EFF',
    borderColor: '#6B4EFF',
  },
  termsTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
  },
  termsLink: {
    fontSize: 14,
    color: '#6B4EFF',
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: '#6B4EFF',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signUpButtonDisabled: {
    backgroundColor: '#D1D1D1',
  },
  signUpButtonText: {
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: '#666',
    fontSize: 14,
  },
  signInLink: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  successContainer: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#166534',
  },
  errorText: {
    color: '#991B1B',
  },
}); 