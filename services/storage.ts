/**
 * Secure Storage Service
 *
 * Handles secure storage of sensitive data (tokens) using expo-secure-store
 * and regular data using AsyncStorage.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './config';

/**
 * Secure storage for sensitive data (tokens)
 * Uses expo-secure-store which encrypts data on device
 */
export const secureStorage = {
  /**
   * Save auth token securely
   */
  async setToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      if (__DEV__) console.error('Error saving token:', error);
      throw error;
    }
  },

  /**
   * Get stored auth token
   */
  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      if (__DEV__) console.error('Error getting token:', error);
      return null;
    }
  },

  /**
   * Remove auth token
   */
  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      if (__DEV__) console.error('Error removing token:', error);
    }
  },

  /**
   * Save refresh token securely
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      if (__DEV__) console.error('Error saving refresh token:', error);
      throw error;
    }
  },

  /**
   * Get stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      if (__DEV__) console.error('Error getting refresh token:', error);
      return null;
    }
  },

  /**
   * Remove refresh token
   */
  async removeRefreshToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      if (__DEV__) console.error('Error removing refresh token:', error);
    }
  },

  /**
   * Clear all secure storage (for logout)
   */
  async clearAll(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      if (__DEV__) console.error('Error clearing secure storage:', error);
    }
  },
};

/**
 * Regular storage for non-sensitive data
 * Uses AsyncStorage
 */
export const storage = {
  /**
   * Save user data
   */
  async setUserData<T>(data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
    } catch (error) {
      if (__DEV__) console.error('Error saving user data:', error);
      throw error;
    }
  },

  /**
   * Get stored user data
   */
  async getUserData<T>(): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      if (__DEV__) console.error('Error getting user data:', error);
      return null;
    }
  },

  /**
   * Remove user data
   */
  async removeUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      if (__DEV__) console.error('Error removing user data:', error);
    }
  },

  /**
   * Save remember me preference
   */
  async setRememberMe(value: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, JSON.stringify(value));
    } catch (error) {
      if (__DEV__) console.error('Error saving remember me:', error);
    }
  },

  /**
   * Get remember me preference
   */
  async getRememberMe(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      if (__DEV__) console.error('Error getting remember me:', error);
      return false;
    }
  },

  /**
   * Generic get method
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      if (__DEV__) console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  /**
   * Generic set method
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (__DEV__) console.error(`Error setting ${key}:`, error);
      throw error;
    }
  },

  /**
   * Generic remove method
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      if (__DEV__) console.error(`Error removing ${key}:`, error);
    }
  },

  /**
   * Clear all storage (for logout)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.REMEMBER_ME,
      ]);
    } catch (error) {
      if (__DEV__) console.error('Error clearing storage:', error);
    }
  },
};

/**
 * Clear all app data (for logout)
 */
export async function clearAllStorage(): Promise<void> {
  await Promise.all([
    secureStorage.clearAll(),
    storage.clearAll(),
  ]);
}
