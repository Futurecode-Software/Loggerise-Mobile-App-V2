import { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Expo Configuration
 *
 * Environment variables are read from process.env
 * For local development, create a .env file with:
 *
 * EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
 * EXPO_PUBLIC_API_URL=https://erp.loggerise.com/api/v1/mobile (opsiyonel, varsayılan bu)
 */

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: "futurecode_teknoloji_inovasyon_ve_yazilim_anonim_sirketi",
  name: "loggerise_v2",
  slug: "loggerise_v2",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "loggerisev2",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.loggerise.app",
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ["loggerisev2"],
          CFBundleURLName: "Main",
          CFBundleTypeRole: "Editor",
        },
        {
          CFBundleURLSchemes: [
            "com.googleusercontent.apps.729255118841-9qek2fqb8i951kn65s2s8b3k53j22ukn",
          ],
          CFBundleURLName: "Google OAuth",
          CFBundleTypeRole: "Editor",
        },
      ],
    },
  },
  android: {
    googleServicesFile: "./android/app/google-services.json",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.loggerise.app",
    // Chat ekranlarında klavye input'u düzgün göstermesi için kritik
    softwareKeyboardLayoutMode: "resize",
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.729255118841-9qek2fqb8i951kn65s2s8b3k53j22ukn",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    "expo-secure-store",
    [
      "expo-notifications",
      {
        defaultChannel: "default",
        color: "#ffffff",
        enableBackgroundRemoteNotifications: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    googleIosClientId:
      "729255118841-9qek2fqb8i951kn65s2s8b3k53j22ukn.apps.googleusercontent.com",
    googleAndroidClientId:
      "729255118841-0v3426977tjdh94rp7t04nplruq3ih1a.apps.googleusercontent.com",
    googleWebClientId:
      "729255118841-mtgt26tjv5lb0ngbk27ckabr5os0p77n.apps.googleusercontent.com",
    googleExpoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || "",
    // Google Maps API Key
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    // API Configuration (API_DOCS.json - tek URL geliştirme ve production)
    apiUrl:
      process.env.EXPO_PUBLIC_API_URL ||
      "https://erp.loggerise.com/api/v1/mobile",
    // WebSocket/Reverb Configuration (Laravel Reverb - Pusher compatible)
    reverbAppKey:
      process.env.EXPO_PUBLIC_REVERB_APP_KEY || "loggerise-reverb-key",
    reverbHost: process.env.EXPO_PUBLIC_REVERB_HOST || "10.0.2.2",
    reverbPort: process.env.EXPO_PUBLIC_REVERB_PORT || "8080",
    reverbScheme: process.env.EXPO_PUBLIC_REVERB_SCHEME || "http",
    // EAS Project ID (push + EAS Build) – futurecode_teknoloji... projesi (APNs/FCM ayarlı)
    eas: {
      projectId: "dcc2cd16-11ba-4bc7-ae40-489bf5401bea",
    },
  },
});
