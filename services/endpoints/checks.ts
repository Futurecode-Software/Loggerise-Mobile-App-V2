/**
 * Checks API Endpoints
 *
 * Handles check (çek) management operations.
 */

import api, { getErrorMessage } from '../api';
import { formatCurrency } from '@/utils/formatters';

/**
 * Currency type enum
 */
export type CurrencyType = 'TRY' | 'USD' | 'EUR' | 'GBP';

/**
 * Check type enum
 */
export type CheckType = 'received' | 'issued';

/**
 * Check status enum
 */
export type CheckStatus = 'pending' | 'transferred' | 'cleared' | 'bounced' | 'cancelled';

/**
 * Transferred to type enum (polymorphic)
 */
export type TransferredToType = 'App\\Models\\Bank' | 'App\\Models\\CashRegister' | 'App\\Models\\Contact';

/**
 * Contact entity (simplified for relation)
 */
export interface Contact {
  id: number;
  name: string;
  code?: string;
}

/**
 * Transferred to entity (polymorphic relation)
 */
export interface TransferredTo {
  type: string;
  id: number;
  name: string;
}

/**
 * Check entity
 */
export interface Check {
  id: number;
  contact?: Contact;
  contact_id: number;
  check_number: string;
  bank_name: string;
  branch_name: string;
  account_number?: string;
  drawer_name?: string;
  endorser_name?: string;
  portfolio_number?: string;
  type: CheckType;
  issue_date: string;
  due_date: string;
  amount: number;
  currency_type: CurrencyType;
  status: CheckStatus;
  transferred_to?: TransferredTo | null;
  transferred_to_type?: TransferredToType | null;
  transferred_to_id?: number | null;
  transferred_date?: string | null;
  cleared_date?: string | null;
  bounced_date?: string | null;
  cancelled_date?: string | null;
  attached_document?: string | null;
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Check list filters
 */
export interface CheckFilters {
  search?: string;
  type?: CheckType;
  status?: CheckStatus;
  currency_type?: CurrencyType;
  contact_id?: number;
  due_date_from?: string;
  due_date_to?: string;
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
 * Checks list response
 */
interface ChecksListResponse {
  success: boolean;
  data: {
    checks: Check[];
    pagination: Pagination;
  };
}

/**
 * Single check response
 */
interface CheckResponse {
  success: boolean;
  data: {
    check: Check;
  };
}

/**
 * Create/Update check data
 */
export interface CheckFormData {
  contact_id: number;
  check_number: string;
  bank_name: string;
  branch_name: string;
  account_number?: string;
  drawer_name?: string;
  endorser_name?: string;
  portfolio_number?: string;
  type: CheckType;
  issue_date: string;
  due_date: string;
  amount: number;
  currency_type: CurrencyType;
  status: CheckStatus;
  transferred_to_type?: TransferredToType | null;
  transferred_to_id?: number | null;
  transferred_date?: string | null;
  cleared_date?: string | null;
  bounced_date?: string | null;
  cancelled_date?: string | null;
  attached_document?: string | null;
  description?: string;
}

/**
 * Get checks list with optional filters
 */
export async function getChecks(
  filters?: CheckFilters
): Promise<{ checks: Check[]; pagination: Pagination }> {
  try {
    const response = await api.get<ChecksListResponse>('/checks', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single check by ID
 */
export async function getCheck(id: number): Promise<Check> {
  try {
    const response = await api.get<CheckResponse>(`/checks/${id}`);
    return response.data.data.check;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new check
 */
export async function createCheck(data: CheckFormData): Promise<Check> {
  try {
    const response = await api.post<CheckResponse>('/checks', data);
    return response.data.data.check;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing check
 */
export async function updateCheck(
  id: number,
  data: Partial<CheckFormData>
): Promise<Check> {
  try {
    const response = await api.put<CheckResponse>(`/checks/${id}`, data);
    return response.data.data.check;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete check
 */
export async function deleteCheck(id: number): Promise<void> {
  try {
    await api.delete(`/checks/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get check type label in Turkish
 */
export function getCheckTypeLabel(type: CheckType): string {
  const labels: Record<CheckType, string> = {
    received: 'Alınan',
    issued: 'Verilen',
  };
  return labels[type] || type;
}

/**
 * Get check status label in Turkish
 */
export function getCheckStatusLabel(status: CheckStatus): string {
  const labels: Record<CheckStatus, string> = {
    pending: 'Beklemede',
    transferred: 'Transfer Edildi',
    cleared: 'Tahsil Edildi',
    bounced: 'Karşılıksız',
    cancelled: 'İptal Edildi',
  };
  return labels[status] || status;
}

/**
 * Get check status color for UI
 */
export function getCheckStatusColor(
  status: CheckStatus
): 'success' | 'warning' | 'danger' | 'default' | 'info' {
  const colors: Record<CheckStatus, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
    pending: 'warning',
    transferred: 'info',
    cleared: 'success',
    bounced: 'danger',
    cancelled: 'default',
  };
  return colors[status] || 'default';
}

/**
 * Get currency label in Turkish
 */
export function getCurrencyLabel(currency: CurrencyType): string {
  const labels: Record<CurrencyType, string> = {
    TRY: 'Türk Lirası',
    USD: 'Amerikan Doları',
    EUR: 'Euro',
    GBP: 'İngiliz Sterlini',
  };
  return labels[currency] || currency;
}

/**
 * Format check amount with currency
 */
export function formatCheckAmount(amount: number | undefined | null, currency: CurrencyType): string {
  return formatCurrency(amount, currency, 2);
}
