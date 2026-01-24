/**
 * Cash Registers API Endpoints
 *
 * Handles cash register management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Currency type enum
 */
export type CurrencyType = 'TRY' | 'USD' | 'EUR' | 'GBP';

/**
 * Cash register entity
 */
export interface CashRegister {
  id: number;
  name: string;
  code?: string;
  location?: string;
  currency_type: CurrencyType;
  balance: number;
  opening_balance: number;
  responsible_user_id?: number;
  responsible_user?: { id: number; name: string; email: string } | null;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Cash register list filters
 */
export interface CashRegisterFilters {
  search?: string;
  currency_type?: CurrencyType;
  is_active?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Pagination info
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Cash registers list response
 */
interface CashRegistersListResponse {
  success: boolean;
  data: {
    cash_registers: CashRegister[];
    pagination: Pagination;
  };
}

/**
 * Single cash register response
 */
interface CashRegisterResponse {
  success: boolean;
  data: {
    cash_register: CashRegister;
  };
}

/**
 * Create/Update cash register data
 */
export interface CashRegisterFormData {
  name: string;
  code?: string;
  location?: string;
  currency_type: CurrencyType;
  opening_balance?: number;
  responsible_user_id?: number;
  description?: string;
  is_active?: boolean;
}

/**
 * Get cash registers list with optional filters
 */
export async function getCashRegisters(
  filters?: CashRegisterFilters
): Promise<{ cashRegisters: CashRegister[]; pagination: Pagination }> {
  try {
    const response = await api.get<CashRegistersListResponse>('/cash-registers', {
      params: filters,
    });
    return {
      cashRegisters: response.data.data.cash_registers,
      pagination: response.data.data.pagination,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single cash register by ID
 */
export async function getCashRegister(id: number): Promise<CashRegister> {
  try {
    const response = await api.get<CashRegisterResponse>(`/cash-registers/${id}`);
    return response.data.data.cash_register;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new cash register
 */
export async function createCashRegister(data: CashRegisterFormData): Promise<CashRegister> {
  try {
    const response = await api.post<CashRegisterResponse>('/cash-registers', data);
    return response.data.data.cash_register;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing cash register
 */
export async function updateCashRegister(
  id: number,
  data: Partial<CashRegisterFormData>
): Promise<CashRegister> {
  try {
    const response = await api.put<CashRegisterResponse>(`/cash-registers/${id}`, data);
    return response.data.data.cash_register;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete cash register
 */
export async function deleteCashRegister(id: number): Promise<void> {
  try {
    await api.delete(`/cash-registers/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get currency label in Turkish
 */
export function getCurrencyLabel(currency: CurrencyType): string {
  const labels: Record<CurrencyType, string> = {
    TRY: 'Turk Lirasi',
    USD: 'Amerikan Dolari',
    EUR: 'Euro',
    GBP: 'Ingiliz Sterlini',
  };
  return labels[currency] || currency;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyType): string {
  const symbols: Record<CurrencyType, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  return symbols[currency] || currency;
}

/**
 * Format balance with currency (safe for undefined/null values)
 */
export function formatBalance(amount: number | undefined | null, currency: CurrencyType): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '-';
  }
  const symbol = getCurrencySymbol(currency);
  const formatted = amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}
