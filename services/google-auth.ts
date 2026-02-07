/**
 * Google Sign-In Service
 *
 * Native Google Sign-In kullanır (@react-native-google-signin/google-signin).
 * Web tarayıcı açmaz, native dialog gösterir.
 *
 * Gerekli:
 * - google-services.json (Android)
 * - webClientId: idToken almak için zorunlu (Google Cloud Console > Web client)
 */

import {
  GoogleSignin,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import Constants from 'expo-constants'

/**
 * Google OAuth Client IDs
 */
const GOOGLE_CONFIG = {
  webClientId: Constants.expoConfig?.extra?.googleWebClientId || '',
  androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || '',
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId || '',
}

// Lazy configure - sadece ilk signIn çağrısında çalışır
let isConfigured = false

function ensureConfigured() {
  if (isConfigured) return
  GoogleSignin.configure({
    webClientId: GOOGLE_CONFIG.webClientId,
    offlineAccess: false,
    scopes: ['profile', 'email'],
  })
  isConfigured = true
}

/**
 * Google Sign-In sonucu
 */
export interface GoogleSignInResult {
  idToken: string
  user: {
    email: string
    name: string | null
    photo: string | null
  }
}

/**
 * Google Sign-In yapılandırılmış mı kontrol et
 */
export function isGoogleSignInConfigured(): boolean {
  return !!GOOGLE_CONFIG.webClientId
}

/**
 * Native Google Sign-In başlat
 * Web tarayıcı açmaz, native dialog gösterir.
 */
export async function googleNativeSignIn(): Promise<GoogleSignInResult> {
  // İlk çağrıda configure et
  ensureConfigured()

  // Play Services kontrolü (Android)
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })

  // Önceki oturumu temizle - her seferinde hesap seçici göstermek için
  try { await GoogleSignin.signOut() } catch { /* ilk kullanımda hata verebilir */ }

  const response = await GoogleSignin.signIn()

  if (isSuccessResponse(response)) {
    const { idToken, user } = response.data
    if (!idToken) {
      throw new GoogleSignInError(
        'NO_ID_TOKEN',
        'Google ile giriş yapılamadı: ID token alınamadı. webClientId yapılandırmasını kontrol edin.'
      )
    }

    return {
      idToken,
      user: {
        email: user.email,
        name: user.name,
        photo: user.photo,
      },
    }
  }

  if (isNoSavedCredentialFoundResponse(response)) {
    throw new GoogleSignInError(
      'NO_SAVED_CREDENTIAL',
      'Kayıtlı Google hesabı bulunamadı.'
    )
  }

  throw new GoogleSignInError('UNKNOWN', 'Google ile giriş yapılamadı.')
}

/**
 * Google Sign-In oturumunu kapat
 */
export async function googleSignOut(): Promise<void> {
  try {
    ensureConfigured()
    await GoogleSignin.signOut()
  } catch {
    // Sessizce devam et
  }
}

/**
 * Google Sign-In hata tipleri
 */
export type GoogleSignInErrorType =
  | 'SIGN_IN_CANCELLED'
  | 'IN_PROGRESS'
  | 'PLAY_SERVICES_NOT_AVAILABLE'
  | 'NO_ID_TOKEN'
  | 'NO_SAVED_CREDENTIAL'
  | 'NETWORK_ERROR'
  | 'NOT_CONFIGURED'
  | 'UNKNOWN'

/**
 * Google Sign-In hata sınıfı
 */
export class GoogleSignInError extends Error {
  public readonly type: GoogleSignInErrorType

  constructor(type: GoogleSignInErrorType, message: string) {
    super(message)
    this.name = 'GoogleSignInError'
    this.type = type
  }
}

/**
 * Native hataları anlamlı hata mesajlarına çevir
 */
export function parseGoogleSignInError(error: unknown): GoogleSignInError {
  if (error instanceof GoogleSignInError) {
    return error
  }

  // @react-native-google-signin status codes
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: string }).code

    switch (code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return new GoogleSignInError('SIGN_IN_CANCELLED', 'Giriş iptal edildi.')
      case statusCodes.IN_PROGRESS:
        return new GoogleSignInError('IN_PROGRESS', 'Giriş işlemi devam ediyor.')
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return new GoogleSignInError(
          'PLAY_SERVICES_NOT_AVAILABLE',
          'Google Play Services kullanılamıyor. Lütfen güncelleyin.'
        )
      default:
        break
    }
  }

  const message = error instanceof Error ? error.message : 'Google ile giriş yapılamadı.'
  return new GoogleSignInError('UNKNOWN', message)
}
