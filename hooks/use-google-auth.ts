/**
 * Google Authentication Hook
 *
 * Native Google Sign-In kullanır (@react-native-google-signin/google-signin).
 * Web tarayıcı açmaz, native dialog gösterir.
 */

import { useState, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'
import {
  googleNativeSignIn,
  isGoogleSignInConfigured,
  isGoogleSignInAvailable,
  parseGoogleSignInError,
} from '@/services/google-auth'

interface UseGoogleAuthReturn {
  signIn: () => Promise<void>
  isLoading: boolean
  isAvailable: boolean
  isConfigured: boolean
  error: string | null
  clearError: () => void
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const { loginWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = useCallback(async () => {
    if (!isGoogleSignInAvailable) {
      setError('Google Sign-In bu ortamda kullanılamıyor.')
      return
    }

    if (!isGoogleSignInConfigured()) {
      setError('Google Sign-In yapılandırılmamış. webClientId eksik.')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      // Native Google Sign-In dialog'u göster
      const result = await googleNativeSignIn()

      // Backend'e idToken gönder
      await loginWithGoogle(result.idToken)
    } catch (err: unknown) {
      const parsed = parseGoogleSignInError(err)

      // Kullanıcı iptal ettiyse hata gösterme
      if (parsed.type === 'SIGN_IN_CANCELLED') {
        setIsLoading(false)
        return
      }

      setError(parsed.message)
    } finally {
      setIsLoading(false)
    }
  }, [loginWithGoogle])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    signIn,
    isLoading,
    isAvailable: isGoogleSignInAvailable,
    isConfigured: isGoogleSignInConfigured(),
    error,
    clearError,
  }
}
