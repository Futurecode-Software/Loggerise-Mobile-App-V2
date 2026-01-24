/**
 * Google Authentication Hook
 *
 * Provides easy-to-use Google Sign-In functionality using expo-auth-session.
 * Works with Expo Go and production builds.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  useGoogleAuthRequest,
  extractTokensFromResponse,
  isUserCancellation,
  getErrorFromResponse,
  isGoogleSignInConfigured,
} from '@/services/google-auth';

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

  /**
   * Handle Google auth response
   */
  useEffect(() => {
    const handleResponse = async () => {
      if (!response) return;

      // Check for user cancellation
      if (isUserCancellation(response)) {
        setIsLoading(false);
        return;
      }

      // Check for errors
      const responseError = getErrorFromResponse(response);
      if (responseError) {
        setError(responseError.message);
        setIsLoading(false);
        return;
      }

      // Extract tokens
      const tokens = extractTokensFromResponse(response);
      if (!tokens) {
        setError('Google ile giris yapilamadi: Token alinamadi');
        setIsLoading(false);
        return;
      }

      try {
        // Send ID token to backend for verification
        await loginWithGoogle(tokens.idToken);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google ile giriş yapılamadı';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    handleResponse();
  }, [response, loginWithGoogle]);

  /**
   * Start Google Sign-In flow
   */
  const signIn = useCallback(async () => {
    if (!isGoogleSignInConfigured()) {
      setError(
        'Google Sign-In yapilandirilmamis. .env dosyasina Google Client ID\'leri ekleyin:\n' +
        '- EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID (Expo Go için)\n' +
        '- EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (Android için)\n' +
        '- EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (iOS için)'
      );
      return;
    }

    if (!request) {
      setError('Google Sign-In yükleniyor, lütfen bekleyin...');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await promptAsync();
      // Response will be handled by the useEffect above
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google ile giriş yapılamadı';
      setError(message);
      setIsLoading(false);
    }
  }, [request, promptAsync]);

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
