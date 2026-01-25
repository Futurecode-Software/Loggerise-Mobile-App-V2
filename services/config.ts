/**
 * API Configuration
 *
 * Loggerise Mobile API configuration settings.
 * Environment variables are loaded from app.config.ts via expo-constants.
 *
 * To configure, create a .env file:
 * EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1/mobile
 * EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-client-id.apps.googleusercontent.com
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
 */

import Constants from 'expo-constants';

// API Base URL from environment or default
// Development: http://localhost:8000/api/v1/mobile (iOS)
// Development: http://10.0.2.2:8000/api/v1/mobile (Android emulator)
// Production: https://api.loggerise.com/api/v1/mobile
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (__DEV__
    ? 'http://10.0.2.2:8000/api/v1/mobile'
    : 'https://api.loggerise.com/api/v1/mobile');

export const API_TIMEOUT = 30000; // 30 seconds

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
  REMEMBER_ME: 'remember_me',
} as const;

/**
 * Google OAuth Configuration
 * These are read from app.config.ts which reads from environment variables
 *
 * To configure, set these in your .env file:
 * - EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID (for Expo Go)
 * - EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (for web & ID token)
 * - EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (for Android)
 * - EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (for iOS)
 */
export const GOOGLE_EXPO_CLIENT_ID = Constants.expoConfig?.extra?.googleExpoClientId || '';
export const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || '';
export const GOOGLE_ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId || '';
export const GOOGLE_IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId || '';

/**
 * WebSocket/Reverb Configuration
 * Laravel Reverb is Pusher-compatible, so we use pusher-js client
 *
 * To configure, set these in your .env file:
 * - EXPO_PUBLIC_REVERB_APP_KEY
 * - EXPO_PUBLIC_REVERB_HOST
 * - EXPO_PUBLIC_REVERB_PORT
 * - EXPO_PUBLIC_REVERB_SCHEME (http or https)
 */
export const REVERB_APP_KEY = Constants.expoConfig?.extra?.reverbAppKey || 'loggerise-reverb-key';
export const REVERB_HOST = Constants.expoConfig?.extra?.reverbHost || (__DEV__ ? '10.0.2.2' : 'reverb.loggerise.com');
export const REVERB_PORT = parseInt(Constants.expoConfig?.extra?.reverbPort || (__DEV__ ? '8080' : '443'), 10);
export const REVERB_SCHEME = Constants.expoConfig?.extra?.reverbScheme || (__DEV__ ? 'http' : 'https');
