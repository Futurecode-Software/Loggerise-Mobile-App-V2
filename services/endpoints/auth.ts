/**
 * Authentication API Endpoints
 *
 * Handles login, register, logout, and password reset.
 * Uses Laravel Sanctum for token-based authentication.
 */

import api, { ApiResponse, getErrorMessage } from '../api';
import { secureStorage, storage, clearAllStorage } from '../storage';

/**
 * User type returned from API
 */
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  tenant_id?: number;
  tenant_name?: string;
  email_verified_at?: string;
  created_at?: string;
}

/**
 * Auth result with setup status
 */
export interface AuthResult {
  user: User;
  setupStatus?: string;
  isSetupComplete: boolean;
}

/**
 * Login response from API
 * Backend returns: { success, message, data: { user, token, ... } }
 */
interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
    permissions?: Array<{ name: string; description: string }>;
    setup_status?: string;
    estimated_time?: string;
  };
}

/**
 * Register request data
 * Must match backend MobileRegisterRequest validation rules
 */
export interface RegisterData {
  name: string;
  company_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string,
  rememberMe: boolean = false
): Promise<AuthResult> {
  try {
    const response = await api.post<LoginResponse>('/login', {
      email,
      password,
      remember_me: rememberMe,
    });

    const { token, user, setup_status } = response.data.data;

    // Store token securely
    await secureStorage.setToken(token);

    // Store user data
    await storage.setUserData(user);

    // Store remember me preference
    await storage.setRememberMe(rememberMe);

    return {
      user,
      setupStatus: setup_status,
      isSetupComplete: setup_status === 'complete' || !setup_status,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Login with Google OAuth
 */
export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  try {
    const response = await api.post<LoginResponse>('/auth/google', {
      id_token: idToken,
    });

    const { token, user, setup_status } = response.data.data;

    // Store token securely
    await secureStorage.setToken(token);

    // Store user data
    await storage.setUserData(user);

    return {
      user,
      setupStatus: setup_status,
      isSetupComplete: setup_status === 'complete' || !setup_status,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Register a new user
 * Note: New registrations always need setup, so isSetupComplete will be false
 */
export async function register(data: RegisterData): Promise<AuthResult> {
  try {
    const response = await api.post<LoginResponse>('/register', data);

    const { token, user, setup_status } = response.data.data;

    // Store token securely
    await secureStorage.setToken(token);

    // Store user data
    await storage.setUserData(user);

    return {
      user,
      setupStatus: setup_status || 'pending',
      // New registrations always need setup
      isSetupComplete: false,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint to invalidate token
    await api.post('/logout');
  } catch (error) {
    // Continue with local logout even if API fails
    console.log('Logout API error:', error);
  } finally {
    // Always clear local storage
    await clearAllStorage();
  }
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<string> {
  try {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/forgot-password',
      { email }
    );
    return response.data.message || 'Şifre sıfırlama e-postası gönderildi.';
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  email: string,
  token: string,
  password: string,
  passwordConfirmation: string
): Promise<string> {
  try {
    const response = await api.post<ApiResponse<{ message: string }>>(
      '/reset-password',
      {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      }
    );
    return response.data.message || 'Şifreniz başarıyla sıfırlandı.';
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * User response from /user endpoint
 * Backend returns: { success, data: { user, permissions } }
 */
interface UserResponse {
  user: User;
  permissions?: Array<{ name: string; description: string }>;
}

/**
 * Get current user info from API
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await api.get<ApiResponse<UserResponse>>('/user');
    // Backend returns { data: { user: {...}, permissions: [...] } }
    const user = response.data.data?.user || response.data.data || response.data;

    // Update stored user data
    await storage.setUserData(user);

    return user as User;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Check if user has stored auth token
 */
export async function hasStoredAuth(): Promise<boolean> {
  const token = await secureStorage.getToken();
  return !!token;
}

/**
 * Get stored user data (for initial load without API call)
 */
export async function getStoredUser(): Promise<User | null> {
  return storage.getUserData<User>();
}

/**
 * Setup status response from backend
 */
interface SetupStatusResponse {
  success: boolean;
  setup_status: 'setting_up' | 'active' | 'failed';
  message?: string;
  estimated_time?: string;
  retry_after?: number;
  can_login?: boolean;
  error?: string;
}

/**
 * Setup status result
 */
export interface SetupStatusResult {
  is_setup_complete: boolean;
  setup_status: 'setting_up' | 'active' | 'failed';
  message?: string;
  estimated_time?: string;
  retry_after?: number;
  error?: string;
}

/**
 * Check tenant setup status
 */
export async function checkSetupStatus(): Promise<SetupStatusResult> {
  try {
    const response = await api.get<SetupStatusResponse>('/setup-status');

    return {
      is_setup_complete: response.data.setup_status === 'active',
      setup_status: response.data.setup_status,
      message: response.data.message,
      estimated_time: response.data.estimated_time,
      retry_after: response.data.retry_after,
      error: response.data.error,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
