/**
 * API Service
 *
 * Axios-based HTTP client for Loggerise Mobile API.
 * Handles authentication, error handling, and request/response interceptors.
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './config';
import { secureStorage, clearAllStorage } from './storage';

/**
 * API Error Response Type
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

/**
 * API Success Response Type
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}

/**
 * Paginated Response Type
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// Auth state change callback (set from AuthContext)
let onAuthStateChange: ((isAuthenticated: boolean) => void) | null = null;

/**
 * Set callback for auth state changes (called on 401 errors)
 */
export function setAuthStateChangeCallback(
  callback: (isAuthenticated: boolean) => void
): void {
  onAuthStateChange = callback;
}

/**
 * Create Axios instance with base configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds auth token to all requests
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get token from secure storage
    const token = await secureStorage.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in dev mode
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles common error cases
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;

    // Handle 401 Unauthorized - Token expired or invalid
    if (status === 401) {
      console.log('[API] Unauthorized - clearing auth state');

      // Clear all stored auth data
      await clearAllStorage();

      // Notify auth context
      if (onAuthStateChange) {
        onAuthStateChange(false);
      }
    }

    // Handle 403 Forbidden
    if (status === 403) {
      console.log('[API] Forbidden - insufficient permissions');
    }

    // Handle 422 Validation Error
    if (status === 422) {
      console.log('[API] Validation error:', error.response?.data?.errors);
    }

    // Handle 500 Server Error
    if (status && status >= 500) {
      console.log('[API] Server error:', error.response?.data?.message);
    }

    // Handle network errors
    if (!error.response) {
      console.log('[API] Network error - no response received');
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to extract error message from API response
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Check for validation errors
    if (axiosError.response?.data?.errors) {
      const errors = axiosError.response.data.errors;
      const firstField = Object.keys(errors)[0];
      if (firstField && errors[firstField]?.[0]) {
        return errors[firstField][0];
      }
    }

    // Check for message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Network error
    if (!axiosError.response) {
      return 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
    }

    // Status-based messages
    switch (axiosError.response?.status) {
      case 401:
        return 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
      case 403:
        return 'Bu işlemi yapmaya yetkiniz yok.';
      case 404:
        return 'İstenen kaynak bulunamadı.';
      case 422:
        return 'Girilen bilgiler geçersiz.';
      case 429:
        return 'Çok fazla istek gönderdiniz. Lütfen bekleyin.';
      case 500:
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      default:
        return 'Beklenmeyen bir hata oluştu.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Bilinmeyen bir hata oluştu.';
}

/**
 * Helper function to get validation errors from API response
 */
export function getValidationErrors(
  error: unknown
): Record<string, string[]> | null {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.errors) {
      return axiosError.response.data.errors;
    }
  }
  return null;
}

export default api;
