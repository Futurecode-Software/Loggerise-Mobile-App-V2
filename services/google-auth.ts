/**
 * Google Sign-In Service
 *
 * Handles Google OAuth authentication using expo-auth-session.
 * Works with Expo Go and production builds.
 *
 * Required Client IDs (from Google Cloud Console):
 * - expoClientId: For Expo Go development
 * - webClientId: For web and getting ID token
 * - androidClientId: For Android native builds
 * - iosClientId: For iOS native builds
 */

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { AuthSessionResult } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth Client IDs from environment
 */
const GOOGLE_CONFIG = {
  expoClientId: Constants.expoConfig?.extra?.googleExpoClientId || "",
  webClientId: Constants.expoConfig?.extra?.googleWebClientId || "",
  androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || "",
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId || "",
};

/**
 * Google Sign-In result
 */
export interface GoogleSignInResult {
  idToken: string;
  accessToken: string;
}

/**
 * Google Sign-In error types
 */
export type GoogleSignInErrorType =
  | "SIGN_IN_CANCELLED"
  | "NOT_CONFIGURED"
  | "NETWORK_ERROR"
  | "UNKNOWN";

/**
 * Custom error class for Google Sign-In errors
 */
export class GoogleSignInError extends Error {
  public readonly type: GoogleSignInErrorType;

  constructor(type: GoogleSignInErrorType, message: string) {
    super(message);
    this.name = "GoogleSignInError";
    this.type = type;
  }
}

/**
 * Check if Google Sign-In is configured for the current platform
 */
export function isGoogleSignInConfigured(): boolean {
  // At minimum, we need expoClientId for Expo Go or platform-specific ID
  return !!(
    GOOGLE_CONFIG.expoClientId ||
    GOOGLE_CONFIG.webClientId ||
    GOOGLE_CONFIG.androidClientId ||
    GOOGLE_CONFIG.iosClientId
  );
}

/**
 * Get Google OAuth configuration
 */
export function getGoogleAuthConfig() {
  return GOOGLE_CONFIG;
}

/** Android DEVELOPER_ERROR için kullanıcı mesajı (package + SHA-1 talimatı) */
export const ANDROID_DEVELOPER_ERROR_MESSAGE =
  "Google Cloud Console'da bu uygulama tanımlı değil.\n\n" +
  "1. Package name: com.loggerise.app\n" +
  "2. SHA-1 parmak izini alın: android/app dizininde 'npm run android:sha1' veya:\n" +
  "   keytool -keystore android/app/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android\n" +
  "3. Google Cloud Console → APIs & Credentials → Android OAuth client oluşturun/düzenleyin → Package name ve SHA-1 ekleyin.";

export function configureNativeGoogleSignIn(): void {
  const config: {
    webClientId: string;
    iosClientId?: string;
    offlineAccess?: boolean;
  } = {
    webClientId: GOOGLE_CONFIG.webClientId,
    offlineAccess: true,
  };
  if (Platform.OS === "ios" && GOOGLE_CONFIG.iosClientId) {
    config.iosClientId = GOOGLE_CONFIG.iosClientId;
  }
  GoogleSignin.configure(config);
}

export async function signInWithNativeGoogleSignIn(): Promise<{
  idToken: string;
} | null> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") return null;
  try {
    configureNativeGoogleSignIn();
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }
    const response = await GoogleSignin.signIn();
    // Kütüphane başarıda { type: 'success', data: User }, iptalde { type: 'cancelled', data: null } döner
    const isSuccess =
      response &&
      (response as { type?: string }).type === "success" &&
      (response as { data?: unknown }).data != null;
    if (!isSuccess) {
      console.warn("[GoogleAuth] signIn: no user (cancelled or no account)");
      try {
        await GoogleSignin.signOut();
      } catch {
        // Oturumu temizle ki bir sonraki tıklamada picker tekrar açılsın
      }
      return null;
    }
    let tokens: { idToken?: string };
    try {
      tokens = await GoogleSignin.getTokens();
    } catch (getTokensErr) {
      console.error("[GoogleAuth] getTokens error:", getTokensErr);
      if (getTokensErr instanceof Error) {
        console.error("[GoogleAuth] getTokens message:", getTokensErr.message);
        console.error("[GoogleAuth] getTokens stack:", getTokensErr.stack);
      }
      return null;
    }
    const idToken = tokens?.idToken;
    if (!idToken) {
      console.error("[GoogleAuth] getTokens returned no idToken");
      return null;
    }
    return { idToken };
  } catch (err) {
    console.error("[GoogleAuth] signInWithNativeGoogleSignIn error:", err);
    if (err instanceof Error) {
      console.error("[GoogleAuth] message:", err.message);
      console.error("[GoogleAuth] stack:", err.stack);
    }
    throw err;
  }
}

function getGoogleIosRedirectUri(iosClientId: string): string {
  const suffix = iosClientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${suffix}:/oauthredirect`;
}

export function useGoogleAuthRequest() {
  const iosRedirectUri =
    Platform.OS === "ios" && GOOGLE_CONFIG.iosClientId
      ? getGoogleIosRedirectUri(GOOGLE_CONFIG.iosClientId)
      : undefined;

  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      clientId: GOOGLE_CONFIG.expoClientId || undefined,
      webClientId: GOOGLE_CONFIG.webClientId || undefined,
      androidClientId: GOOGLE_CONFIG.androidClientId || undefined,
      iosClientId: GOOGLE_CONFIG.iosClientId || undefined,
      scopes: ["profile", "email"],
      ...(iosRedirectUri && { redirectUri: iosRedirectUri }),
    },
    {},
  );

  return { request, response, promptAsync };
}

/**
 * Extract tokens from Google auth response
 */
export function extractTokensFromResponse(
  response: AuthSessionResult | null,
): GoogleSignInResult | null {
  if (!response) return null;

  if (response.type === "success") {
    const { authentication } = response;

    if (!authentication?.idToken && !authentication?.accessToken) {
      return null;
    }

    return {
      idToken: authentication.idToken || "",
      accessToken: authentication.accessToken || "",
    };
  }

  return null;
}

/**
 * Check if response indicates user cancelled
 */
export function isUserCancellation(
  response: AuthSessionResult | null,
): boolean {
  return response?.type === "cancel" || response?.type === "dismiss";
}

/**
 * Get error message from response
 */
export function getErrorFromResponse(
  response: AuthSessionResult | null,
): GoogleSignInError | null {
  if (!response) return null;

  switch (response.type) {
    case "cancel":
    case "dismiss":
      return new GoogleSignInError("SIGN_IN_CANCELLED", "Giriş iptal edildi");
    case "error":
      return new GoogleSignInError(
        "UNKNOWN",
        response.error?.message || "Google ile giriş yapılamadı",
      );
    default:
      return null;
  }
}
