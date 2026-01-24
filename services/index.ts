/**
 * Services Index
 *
 * Central export for all API services.
 */

// Core API client
export { default as api, getErrorMessage, getValidationErrors } from './api';
export type { ApiResponse, PaginatedResponse, ApiErrorResponse } from './api';

// Storage services
export { secureStorage, storage, clearAllStorage } from './storage';

// Configuration
export {
  API_BASE_URL,
  API_TIMEOUT,
  STORAGE_KEYS,
  GOOGLE_EXPO_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} from './config';

// Endpoint modules
export * as authApi from './endpoints/auth';
export type { AuthResult } from './endpoints/auth';
export * as dashboardApi from './endpoints/dashboard';
export * as contactsApi from './endpoints/contacts';
export * as loadsApi from './endpoints/loads';
export * as banksApi from './endpoints/banks';
export * as vehiclesApi from './endpoints/vehicles';
export * as employeesApi from './endpoints/employees';
export * as messagingApi from './endpoints/messaging';
export * as aiReportsApi from './endpoints/ai-reports';
export * as warehousesApi from './endpoints/warehouses';
export * as productsApi from './endpoints/products';
export * as cashRegistersApi from './endpoints/cash-registers';
export * as financialTransactionsApi from './endpoints/financial-transactions';
export * as crmApi from './endpoints/crm';
export * as quotesApi from './endpoints/quotes';
export * as notifications from './notifications';
export * as googleAuth from './google-auth';
