import React, { useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth';
import { useState } from 'react';
import { getMediaUrl, getProfile, updateProfile } from '@/utils/api';
import * as ImagePicker from 'expo-image-picker';
import { withProtectedRoute } from '@/utils/protected-route';
import type { UpdateProfileRequest } from '@/types/auth';
import { Storage } from '@/utils/storage';

const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
  { value: 'N', label: 'Prefer not to say' },
] as const;

function EditProfileScreen() {
  const router = useRouter();
  const { user: authUser, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [gender, setGender] = useState<(typeof GENDER_OPTIONS)[number]['value']>('N');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.first_name || '');
      setLastName(authUser.last_name || '');
      setEmail(authUser.email || '');
      setPhone(authUser.phone_number || '');
      setAboutMe(authUser.about_me || '');
      setGender(authUser.gender || 'N');
      setProfileImage(authUser.profile_picture);
    }
    fetchProfile();
  }, [authUser]);

  const fetchProfile = async () => {
    try {
      const { user } = await getProfile();
      console.log('Profile data:', user);
      
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone_number || '');
      setAboutMe(user.about_me || '');
      setGender(user.gender || 'N');
      setProfileImage(user.profile_picture);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsFetching(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setNewImageUri(imageUri);
        
        // Create profile update data
        let updateData: UpdateProfileRequest;
        
        if (Platform.OS === 'web') {
          try {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            
            // Create a File object with proper MIME type
            const file = new File([blob], 'profile.jpg', { 
              type: blob.type || 'image/jpeg'
            });
            
            updateData = {
              profile_picture: file
            };
          } catch (error) {
            console.error('Error creating file from blob:', error);
            throw new Error('Failed to process image for upload');
          }
        } else {
          // For React Native, create FormData compatible object
          updateData = {
            profile_picture: {
              uri: imageUri,
              type: 'image/jpeg',
              name: 'profile.jpg',
            } as any
          };
        }

        try {
          const { user } = await updateProfile(updateData);
          
          // Get the current tokens from storage
          const currentAccessToken = await Storage.get('accessToken');
          const currentRefreshToken = await Storage.get('refreshToken');

          // Update auth context with new user data while preserving tokens
          await signIn({
            status: 'success',
            user,
            access: currentAccessToken || '',
            refresh: currentRefreshToken || ''
          });

          setProfileImage(user.profile_picture);
          setUpdateMessage({
            type: 'success',
            text: 'Profile picture updated successfully'
          });
        } catch (error) {
          console.error('Profile picture update error:', error);
          throw new Error(error instanceof Error ? error.message : 'Failed to update profile picture');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setUpdateMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile picture'
      });
    }
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      setUpdateMessage(null);

      const updateData: UpdateProfileRequest = {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        phone_number: phone || undefined,
        about_me: aboutMe || undefined,
        gender: gender as 'M' | 'F' | 'O' | 'N'
      };

      const { user, message } = await updateProfile(updateData);
      
      // Get the current tokens from storage
      const currentAccessToken = await Storage.get('accessToken');
      const currentRefreshToken = await Storage.get('refreshToken');

      // Update the auth context with the new user data while preserving tokens
      if (user) {
        await signIn({
          status: 'success',
          user,
          access: currentAccessToken || '',
          refresh: currentRefreshToken || ''
        });
      }

      setUpdateMessage({
        type: 'success',
        text: `${message || 'Profile updated successfully'}\n\nUpdated Details:\n` +
          `• Name: ${user.first_name} ${user.last_name}\n` +
          `• Phone: ${user.phone_number}\n` +
          `• Gender: ${GENDER_OPTIONS.find(g => g.value === user.gender)?.label || 'Not specified'}\n` +
          (user.about_me ? `• About Me has been updated` : '')
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B4EFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {updateMessage && (
          <View style={[
            styles.messageContainer,
            updateMessage.type === 'success' ? styles.successContainer : styles.errorContainer
          ]}>
            <ThemedText style={[
              styles.messageText,
              updateMessage.type === 'success' ? styles.successText : styles.errorText
            ]}>
              {updateMessage.text}
            </ThemedText>
          </View>
        )}

        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image 
                source={{ uri: getMediaUrl(profileImage) }}
                style={styles.profileImage}
                onError={(e) => {
                  console.error('Profile image load error:', e.nativeEvent.error);
                  // When image fails to load, show placeholder
                  const img = e.target as any;
                  if (img) {
                    img.onerror = null; // Prevent infinite error loop
                  }
                  setUpdateMessage({
                    type: 'error',
                    text: 'Failed to load profile image'
                  });
                }}
                defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' }}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={handleImagePick}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <ThemedText style={styles.label}>First Name</ThemedText>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.halfInput}>
              <ThemedText style={styles.label}>Last Name</ThemedText>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Phone</ThemedText>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>About Me</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={aboutMe}
              onChangeText={setAboutMe}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Gender</ThemedText>
            <View style={styles.genderGrid}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    gender === option.value && styles.genderOptionSelected
                  ]}
                  onPress={() => setGender(option.value)}
                >
                  <ThemedText style={[
                    styles.genderOptionText,
                    gender === option.value && styles.genderOptionTextSelected
                  ]}>
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
          onPress={handleUpdate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <ThemedText style={styles.updateButtonText}>Update Profile</ThemedText>
            </>
          )}
        </TouchableOpacity>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40, // To maintain header centering
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#6B4EFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  form: {
    padding: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  halfInput: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  input: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  disabledInput: {
    backgroundColor: '#E0E0E0',
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#6B4EFF',
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  genderOption: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#6B4EFF15',
    borderColor: '#6B4EFF',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#666',
  },
  genderOptionTextSelected: {
    color: '#6B4EFF',
    fontWeight: '500',
  },
  profileImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default withProtectedRoute(EditProfileScreen); 