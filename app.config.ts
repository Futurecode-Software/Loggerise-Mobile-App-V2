import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo Configuration - Loggerise Lojistik ERP
 *
 * Production configuration with hard-coded values
 * All API endpoints and credentials are configured below
 */

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Loggerise - Lojistik ERP',
  slug: 'loggerise-lojistik-erp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'loggerisev2',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.loggerise.erp',
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
    package: 'com.loggerise.erp',
    // Chat ekranlarında klavye input'u düzgün göstermesi için kritik
    softwareKeyboardLayoutMode: 'resize',
    // Firebase Cloud Messaging için google-services.json
    googleServicesFile: './google-services.json',
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
    'expo-notifications',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // Google OAuth Client IDs
    googleWebClientId: '729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n.apps.googleusercontent.com',
    googleIosClientId: '729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n.apps.googleusercontent.com',
    googleAndroidClientId: '729255118841-339pa5b8nl0mskgrhj8mra1lqh9o2a6t.apps.googleusercontent.com',
    googleExpoClientId: '729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n.apps.googleusercontent.com',
    // Google Maps API Key
    googleMapsApiKey: '',
    // API Configuration - Production Backend
    apiUrl: 'https://erp.loggerise.com/api/v1/mobile',
    // WebSocket/Reverb Configuration (Laravel Reverb - Pusher compatible)
    reverbAppKey: 'reverb-app-key',
    reverbHost: 'erp.loggerise.com',
    reverbPort: '8080',
    reverbScheme: 'http',
    // EAS Project ID (for push notifications and EAS Build)
    eas: {
      projectId: '21fbcfee-331f-4207-b154-18042a685e95',
    },
  },
});
