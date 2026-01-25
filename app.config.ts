import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo Configuration
 *
 * Environment variables are read from process.env
 * For local development, create a .env file with:
 *
 * EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
 * EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1/mobile
 */

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'loggerise_v2',
  slug: 'loggerise_v2',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'loggerisev2',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.loggerise.app',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.loggerise.app',
    // Chat ekranlarında klavye input'u düzgün göstermesi için kritik
    softwareKeyboardLayoutMode: 'resize',
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // Google OAuth Client IDs (from Google Cloud Console)
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    googleExpoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || '',
    // API Configuration
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api/v1/mobile',
    // WebSocket/Reverb Configuration (Laravel Reverb - Pusher compatible)
    reverbAppKey: process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'loggerise-reverb-key',
    reverbHost: process.env.EXPO_PUBLIC_REVERB_HOST || '10.0.2.2',
    reverbPort: process.env.EXPO_PUBLIC_REVERB_PORT || '8080',
    reverbScheme: process.env.EXPO_PUBLIC_REVERB_SCHEME || 'http',
    // EAS Project ID (for push notifications)
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '',
    },
  },
});
