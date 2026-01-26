/**
 * Banks API Endpoints
 *
 * Handles bank account management operations.
 */

import api, { getErrorMessage } from '../api';
import { formatCurrency, getCurrencySymbol as getSymbol } from '@/utils/formatters';

/**
 * Currency type enum
 */
export type CurrencyType = 'TRY' | 'USD' | 'EUR' | 'GBP';

/**
 * Bank entity
 */
export interface Bank {
  id: number;
  name: string;
  bank_code?: string;
  branch?: string;
  branch_code?: string;
  account_number?: string;
  iban?: string;
  currency_type: CurrencyType;
  balance: number;
  opening_balance: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Bank list filters
 */
export interface BankFilters {
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
 * Banks list response
 */
interface BanksListResponse {
  success: boolean;
  data: {
    banks: Bank[];
    pagination: Pagination;
  };
}

/**
 * Single bank response
 */
interface BankResponse {
  success: boolean;
  data: {
    bank: Bank;
  };
}

/**
 * Create/Update bank data
 */
export interface BankFormData {
  name: string;
  bank_code?: string;
  branch?: string;
  branch_code?: string;
  account_number?: string;
  iban?: string;
  currency_type: CurrencyType;
  opening_balance?: number;
  description?: string;
  is_active?: boolean;
}

/**
 * Get banks list with optional filters
 */
export async function getBanks(
  filters?: BankFilters
): Promise<{ banks: Bank[]; pagination: Pagination }> {
  try {
    const response = await api.get<BanksListResponse>('/banks', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single bank by ID
 */
export async function getBank(id: number): Promise<Bank> {
  try {
    const response = await api.get<BankResponse>(`/banks/${id}`);
    return response.data.data.bank;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new bank
 */
export async function createBank(data: BankFormData): Promise<Bank> {
  try {
    const response = await api.post<BankResponse>('/banks', data);
    return response.data.data.bank;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing bank
 */
export async function updateBank(
  id: number,
  data: Partial<BankFormData>
): Promise<Bank> {
  try {
    const response = await api.put<BankResponse>(`/banks/${id}`, data);
    return response.data.data.bank;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete bank
 */
export async function deleteBank(id: number): Promise<void> {
  try {
    await api.delete(`/banks/${id}`);
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
 * @deprecated Use getCurrencySymbol from @/utils/formatters instead
 */
export function getCurrencySymbol(currency: CurrencyType): string {
  return getSymbol(currency);
}

/**
 * Format balance with currency (safe for undefined/null values)
 * @deprecated Use formatCurrency from @/utils/formatters instead
 */
export function formatBalance(amount: number | undefined | null, currency: CurrencyType): string {
  return formatCurrency(amount, currency);
}
