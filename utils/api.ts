import * as SecureStore from 'expo-secure-store';
import type { 
  LoginResponse, 
  RefreshTokenResponse, 
  LoginError, 
  User,
  RegisterRequest,
  RegisterResponse,
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ProfileError
} from '@/types/auth';
import Constants from 'expo-constants';
import { Storage } from '@/utils/storage';
import axios from 'axios';
import { Platform } from 'react-native';

// Get the local IP address for development
const LOCAL_IP = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
export const BASE_URL = __DEV__ 
  ? `http://35.92.149.12:8000/`  // Development
  : 'http://35.92.149.12:8000/'; // Production

// Helper function to get complete media URL
export function getMediaUrl(path: string | null): string {
  if (!path) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&q=80';
  if (path.startsWith('http')) return path;
  // Remove any leading slash from the path and ensure BASE_URL ends with a slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  return `${baseUrl}${cleanPath}`;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  const token = await Storage.get('accessToken');
  console.log('Request interceptor - token:', token ? 'present' : 'missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add token refresh interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log('Response interceptor - error status:', error.response?.status);

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('Attempting token refresh...');

      try {
        // Get the refresh token
        const refreshTokenValue = await Storage.get('refreshToken');
        console.log('Refresh token:', refreshTokenValue ? 'present' : 'missing');
        
        if (!refreshTokenValue) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await refreshToken(refreshTokenValue);
        console.log('Token refresh successful');
        
        // Store the new access token
        await Storage.set('accessToken', response.access);

        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${response.access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, clear storage and throw error
        await Storage.delete('accessToken');
        await Storage.delete('refreshToken');
        await Storage.delete('user');
        throw error;
      }
    }

    return Promise.reject(error);
  }
);

export async function login(emailOrUsername: string, password: string): Promise<LoginResponse> {
  try {
    const response = await api.post('/api/auth/login/', {
      email_or_username: emailOrUsername,
      password
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error?.error || 'Login failed');
    }
    throw error;
  }
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await api.post('/api/auth/register/', data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorData = error.response.data;
      // Check if the error response has a structured error object
      if (typeof errorData === 'object' && errorData !== null) {
        // Convert all error messages to a single string
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
          })
          .join('\n');
        throw new Error(errorMessages || 'Registration failed');
      }
      throw new Error(errorData.error || errorData.message || 'Registration failed');
    }
    throw error;
  }
}

export async function refreshToken(refresh: string): Promise<RefreshTokenResponse> {
  try {
    const response = await api.post('/api/auth/refresh/', { refresh });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Token refresh failed');
    }
    throw error;
  }
}

export async function getProfile(): Promise<ProfileResponse> {
  try {
    const response = await api.get('/api/profile/');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Failed to fetch profile');
    }
    throw error;
  }
}

export async function updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  try {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'profile_picture') {
        formData.append(key, value.toString());
      }
    });

    // Add profile picture if provided
    if (data.profile_picture) {
      // Ensure we're sending the file with the correct field name
      formData.append('profile_picture', data.profile_picture);
    }

    const response = await api.patch('/api/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // Remove any existing Content-Type header that axios might set
        ...(Platform.OS === 'web' ? { 'Accept': 'application/json' } : {})
      },
      transformRequest: (data, headers) => {
        // Prevent axios from trying to transform FormData
        return data;
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const errorMessage = error.response.data.error || error.response.data.message || 'Failed to update profile';
      console.error('Profile update error:', error.response.data);
      throw new Error(errorMessage);
    }
    throw error;
  }
}

// Add these types and functions for social login
interface SocialLoginResponse {
  user: User;
  access: string;
  refresh: string;
  message: string;
}

export async function socialLogin(provider: 'google' | 'facebook', token: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/${provider}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ access_token: token }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || `${provider} login failed`);
    }

    // Add status field to match LoginResponse type
    return {
      ...result,
      status: 'success'
    };
  } catch (error) {
    console.error(`${provider} login error:`, error);
    throw error;
  }
} 