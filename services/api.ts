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

// Lazy import - döngüsel bağımlılığı önle
interface ErrorLogContext {
  errorType?: string
  screen?: string
  apiEndpoint?: string
  apiMethod?: string
  apiStatusCode?: number
  additionalData?: Record<string, unknown>
}
let _logError: ((error: unknown, context?: ErrorLogContext) => Promise<void>) | null = null
function getLogError() {
  if (!_logError) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@/utils/error-logger')
      _logError = mod.logError
    } catch {
      _logError = async () => {} // Modül yüklenemezse sessizce geç
    }
  }
  return _logError
}

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
 * Helper to safely parse JSON response
 * Handles cases where axios doesn't auto-parse JSON in React Native
 */
function safeJsonParse(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
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
 * Handles common error cases and ensures JSON parsing
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Ensure response data is parsed (React Native edge case fix)
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (parseError) {
        // Log parse error for debugging - this indicates malformed JSON from backend
        if (__DEV__) {
          console.warn('[API] JSON parse failed for response:', response.config?.url);
          console.warn('[API] Parse error:', parseError);
          console.warn('[API] Raw data (first 300 chars):', response.data.substring(0, 300));
        }
        // Keep original string if not valid JSON
      }
    }
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // Hata logla (error-logs endpoint'ini loglama - döngü önle)
    if (!requestUrl.includes('/error-logs')) {
      const logFn = getLogError()
      if (logFn) {
        if (error.response) {
          const responseData = safeJsonParse(error.response.data)
          const respMsg = typeof responseData === 'object' && responseData !== null
            ? (responseData as Record<string, unknown>).message
            : undefined
          const respErrors = typeof responseData === 'object' && responseData !== null
            ? (responseData as Record<string, unknown>).errors
            : undefined

          logFn(error, {
            errorType: 'api_error',
            screen: 'api_interceptor',
            apiEndpoint: requestUrl,
            apiMethod: error.config?.method?.toUpperCase(),
            apiStatusCode: status,
            additionalData: {
              response_message: respMsg,
              validation_errors: respErrors,
            },
          })
        } else if (error.request) {
          logFn(error, {
            errorType: 'network_error',
            screen: 'api_interceptor',
            apiEndpoint: requestUrl,
            apiMethod: error.config?.method?.toUpperCase(),
            additionalData: {
              code: error.code,
            },
          })
        }
      }
    }

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

/**
 * Flatten Laravel validation errors to Record<string, string>
 * Converts { field: ['error1', 'error2'] } to { field: 'error1' }
 * Takes only the first error message for each field
 */
export function flattenValidationErrors(
  error: unknown
): Record<string, string> | null {
  const validationErrors = getValidationErrors(error)
  if (!validationErrors) {
    return null
  }

  const flatErrors: Record<string, string> = {}
  Object.entries(validationErrors).forEach(([field, messages]) => {
    if (Array.isArray(messages) && messages.length > 0) {
      flatErrors[field] = messages[0]
    }
  })

  return Object.keys(flatErrors).length > 0 ? flatErrors : null
}

export default api;
