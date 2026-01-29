/**
 * Google Authentication Hook
 *
 * Provides easy-to-use Google Sign-In functionality using expo-auth-session.
 * Works with Expo Go and production builds.
 */

import { useAuth } from "@/context/auth-context";
import {
  ANDROID_DEVELOPER_ERROR_MESSAGE,
  extractTokensFromResponse,
  getErrorFromResponse,
  isGoogleSignInConfigured,
  isUserCancellation,
  signInWithNativeGoogleSignIn,
  useGoogleAuthRequest,
} from "@/services/google-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

/**
 * Hook return type
 */
interface UseGoogleAuthReturn {
  signIn: () => Promise<void>;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for Google Sign-In
 *
 * @example
 * const { signIn, isLoading, error, isConfigured } = useGoogleAuth();
 *
 * // Check if configured
 * if (!isConfigured) {
 *   console.warn('Google Sign-In is not configured');
 * }
 *
 * const handleGoogleLogin = async () => {
 *   await signIn();
 *   // If successful, user is now authenticated
 * };
 */
export function useGoogleAuth(): UseGoogleAuthReturn {
  const { loginWithGoogle } = useAuth();
  const { request, response, promptAsync } = useGoogleAuthRequest();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const responseProcessedRef = useRef(false);

  /**
   * Handle Google auth response (sadece iOS web/expo-auth-session fallback için; native kullanıldığında tetiklenmez)
   */
  useEffect(() => {
    if (!response || Platform.OS !== "ios") return;

    const handleResponse = async () => {
      if (!response) return;
      if (responseProcessedRef.current) return;
      responseProcessedRef.current = true;

      if (isUserCancellation(response)) {
        setIsLoading(false);
        return;
      }

      const responseError = getErrorFromResponse(response);
      if (responseError) {
        console.error(
          "[useGoogleAuth] iOS auth response error:",
          responseError.message,
          response,
        );
        setError(responseError.message);
        setIsLoading(false);
        return;
      }

      const tokens = extractTokensFromResponse(response);
      if (!tokens) {
        setError("Google ile giris yapilamadi: Token alinamadi");
        setIsLoading(false);
        return;
      }

      try {
        await loginWithGoogle(tokens.idToken);
        setError(null);
      } catch (err) {
        console.error("[useGoogleAuth] loginWithGoogle (iOS) error:", err);
        if (err instanceof Error)
          console.error("[useGoogleAuth] stack:", err.stack);
        const message =
          err instanceof Error ? err.message : "Google ile giriş yapılamadı";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    handleResponse();
  }, [response, loginWithGoogle]);

  const signIn = useCallback(async () => {
    if (!isGoogleSignInConfigured()) {
      setError(
        "Google Sign-In yapilandirilmamis. .env dosyasina Google Client ID'leri ekleyin:\n" +
          "- EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID (Expo Go için)\n" +
          "- EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (Android için)\n" +
          "- EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (iOS için)",
      );
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      if (Platform.OS === "android" || Platform.OS === "ios") {
        const result = await signInWithNativeGoogleSignIn();
        if (!result) {
          setIsLoading(false);
          return;
        }
        await loginWithGoogle(result.idToken);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!request) {
        setError("Google Sign-In yükleniyor, lütfen bekleyin...");
        setIsLoading(false);
        return;
      }
      responseProcessedRef.current = false;
      await promptAsync();
    } catch (err) {
      console.error("[useGoogleAuth] signIn error:", err);
      if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response?: { data?: unknown } }).response;
        if (res?.data)
          console.error("[useGoogleAuth] API response data:", res.data);
      }
      if (err instanceof Error) {
        console.error("[useGoogleAuth] message:", err.message);
        console.error("[useGoogleAuth] stack:", err.stack);
      }
      const rawMessage =
        err instanceof Error ? err.message : "Google ile giriş yapılamadı";
      const message =
        Platform.OS === "android" && rawMessage.includes("DEVELOPER_ERROR")
          ? ANDROID_DEVELOPER_ERROR_MESSAGE
          : rawMessage;
      setError(message);
      setIsLoading(false);
    }
  }, [request, promptAsync, loginWithGoogle]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    signIn,
    isLoading,
    isConfigured: isGoogleSignInConfigured(),
    error,
    clearError,
  };
}
