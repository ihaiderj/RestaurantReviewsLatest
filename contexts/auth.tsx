import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Storage } from '@/utils/storage';
import type { User, LoginResponse } from '@/types/auth';
import { refreshToken } from '@/utils/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (response: LoginResponse) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const isSigningIn = useRef(false);

  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const [userData, accessToken, refreshTokenValue] = await Promise.all([
        Storage.get('user'),
        Storage.get('accessToken'),
        Storage.get('refreshToken'),
      ]);

      if (userData && accessToken && refreshTokenValue) {
        try {
          // Try to refresh the token
          const response = await refreshToken(refreshTokenValue);
          await Storage.set('accessToken', response.access);
          setUser(JSON.parse(userData));
        } catch (error) {
          // If refresh fails, clear storage
          await Promise.all([
            Storage.delete('user'),
            Storage.delete('accessToken'),
            Storage.delete('refreshToken'),
          ]);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const signIn = useCallback(async (response: LoginResponse) => {
    // Prevent multiple simultaneous sign-in attempts
    if (isSigningIn.current) {
      console.log('Sign-in already in progress');
      return;
    }

    try {
      isSigningIn.current = true;
      setIsLoading(true);
      console.log('Storing auth data:', {
        access: response.access ? 'present' : 'missing',
        refresh: response.refresh ? 'present' : 'missing',
        user: response.user ? 'present' : 'missing'
      });

      // Store tokens and user data
      await Promise.all([
        Storage.set('accessToken', response.access),
        Storage.set('refreshToken', response.refresh),
        Storage.set('user', JSON.stringify(response.user)),
      ]);

      // Small delay to ensure storage is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify tokens were stored
      const [storedAccess, storedRefresh] = await Promise.all([
        Storage.get('accessToken'),
        Storage.get('refreshToken'),
      ]);

      console.log('Token verification:', {
        access: storedAccess ? 'present' : 'missing',
        refresh: storedRefresh ? 'present' : 'missing'
      });

      if (!storedAccess || !storedRefresh) {
        throw new Error('Failed to store authentication tokens');
      }

      setUser(response.user);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setIsLoading(false);
      isSigningIn.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      // Clear user state first to prevent any authenticated API calls
      setUser(null);
      
      // Clear all tokens
      await Promise.all([
        Storage.delete('accessToken'),
        Storage.delete('refreshToken'),
        Storage.delete('user'),
      ]);

      // Verify tokens are cleared
      const [accessToken, refreshToken] = await Promise.all([
        Storage.get('accessToken'),
        Storage.get('refreshToken'),
      ]);

      if (accessToken || refreshToken) {
        throw new Error('Failed to clear authentication tokens');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Don't render anything until we've initialized auth
  if (!isInitialized) {
    return null;
  }

  const value = {
    user,
    isLoading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 