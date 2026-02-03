/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app.
 * Uses Laravel Sanctum for token-based authentication.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { setAuthStateChangeCallback } from '../services/api';
import {
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  register as apiRegister,
  logout as apiLogout,
  forgotPassword as apiForgotPassword,
  getCurrentUser,
  getStoredUser,
  hasStoredAuth,
  User as ApiUser,
  RegisterData as ApiRegisterData,
  AuthResult,
} from '../services/endpoints/auth';

/**
 * User interface for the app
 */
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  tenantId?: string;
  tenantName?: string;
}

/**
 * Register data interface
 * Must match backend MobileRegisterRequest validation rules
 */
export interface RegisterData {
  fullName: string;
  companyName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Auth context type
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  isAuthenticated: boolean;
  isSetupComplete: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ isSetupComplete: boolean }>;
  loginWithGoogle: (idToken: string) => Promise<{ isSetupComplete: boolean }>;
  register: (data: RegisterData) => Promise<{ isSetupComplete: boolean }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Transform API user to app user format
 */
function transformUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    fullName: apiUser.name,
    phone: apiUser.phone,
    avatar: apiUser.avatar,
    tenantId: apiUser.tenant_id ? String(apiUser.tenant_id) : undefined,
    tenantName: apiUser.tenant_name,
  };
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle auth state changes from API interceptor
   */
  const handleAuthStateChange = useCallback((isAuthenticated: boolean) => {
    if (!isAuthenticated) {
      setUser(null);
    }
  }, []);

  /**
   * Initialize auth state on app start
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Set up callback for 401 errors
        setAuthStateChangeCallback(handleAuthStateChange);

        // Check for stored auth token
        const hasToken = await hasStoredAuth();

        if (hasToken) {
          // Try to get stored user data first (for faster UI)
          const storedUser = await getStoredUser();
          if (storedUser) {
            setUser(transformUser(storedUser));
          }

          // Then refresh from API to ensure data is current
          try {
            const currentUser = await getCurrentUser();
            setUser(transformUser(currentUser));
          } catch (err) {
            // Token may be invalid, clear auth state
            console.log('Token validation failed:', err);
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [handleAuthStateChange]);

  /**
   * Login with email and password
   */
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<{ isSetupComplete: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiLogin(email, password, rememberMe);
      setUser(transformUser(result.user));
      setIsSetupComplete(result.isSetupComplete);
      return { isSetupComplete: result.isSetupComplete };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Giris yapilamadi';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with Google OAuth
   */
  const loginWithGoogle = async (idToken: string): Promise<{ isSetupComplete: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiLoginWithGoogle(idToken);
      setUser(transformUser(result.user));
      setIsSetupComplete(result.isSetupComplete);
      return { isSetupComplete: result.isSetupComplete };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Google ile giris yapilamadi';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register a new user
   */
  const register = async (data: RegisterData): Promise<{ isSetupComplete: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const apiData: ApiRegisterData = {
        name: data.fullName,
        company_name: data.companyName,
        email: data.email,
        password: data.password,
        password_confirmation: data.passwordConfirmation,
      };

      const result = await apiRegister(apiData);
      setUser(transformUser(result.user));
      setIsSetupComplete(result.isSetupComplete);
      return { isSetupComplete: result.isSetupComplete };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayıt oluşturulamadı';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    setIsLoading(true);

    try {
      await apiLogout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Reset all auth state
      setUser(null);
      setIsSetupComplete(true); // Reset to true for next login
      setError(null);
      setIsLoading(false);
    }
  };

  /**
   * Request password reset
   */
  const forgotPassword = async (email: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const message = await apiForgotPassword(email);
      return message;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Şifre sıfırlama isteği gönderilemedi';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user data from API
   */
  const refreshUser = async () => {
    if (!user) return;

    try {
      console.log('🔄 getCurrentUser API çağrısı yapılıyor...');
      const currentUser = await getCurrentUser();
      console.log('✅ API yanıtı alındı:', {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar
      });
      setUser(transformUser(currentUser));
      console.log('✅ User state güncellendi');
    } catch (err) {
      console.error('❌ Refresh user error:', err);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isInitializing,
        isAuthenticated: !!user,
        isSetupComplete,
        error,
        login,
        loginWithGoogle,
        register,
        logout,
        forgotPassword,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
