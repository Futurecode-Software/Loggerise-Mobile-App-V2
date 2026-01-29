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

import { AuthSessionResult } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";

// Complete auth session for web browser redirect
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

/**
 * Hook configuration for Google Auth Request
 * Use this with useAuthRequest hook in components
 */
export function useGoogleAuthRequest() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CONFIG.expoClientId,
    webClientId: GOOGLE_CONFIG.webClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    scopes: ["profile", "email"],
  });

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
