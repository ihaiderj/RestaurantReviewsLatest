import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Web storage fallback implementation
class WebStorage {
  async getItemAsync(key: string): Promise<string | null> {
    try {
      const value = localStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Error getting item from web storage:', error);
      return null;
    }
  }

  async setItemAsync(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in web storage:', error);
      throw error;
    }
  }

  async deleteItemAsync(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting item from web storage:', error);
      throw error;
    }
  }
}

interface StorageInterface {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

// Platform-specific storage
const storage: StorageInterface = Platform.OS === 'web' ? new WebStorage() : SecureStore;

export const Storage = {
  get: async (key: string): Promise<string | null> => {
    try {
      return await storage.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  },
  
  set: async (key: string, value: string): Promise<boolean> => {
    try {
      await storage.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  },
  
  delete: async (key: string): Promise<boolean> => {
    try {
      await storage.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`Error deleting ${key} from storage:`, error);
      return false;
    }
  }
}; 