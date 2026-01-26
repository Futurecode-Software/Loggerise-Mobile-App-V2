/**
 * Financial Transactions API Endpoints
 *
 * Handles financial transaction management operations.
 */

import api, { getErrorMessage } from '../api';
import { formatCurrency, getCurrencySymbol as getSymbol, formatDate as formatDateUtil } from '@/utils/formatters';

/**
 * Currency type enum
 */
export type CurrencyType = 'TRY' | 'USD' | 'EUR' | 'GBP';

/**
 * Transaction type enum
 */
export type TransactionType = 'income' | 'expense' | 'transfer';

/**
 * Transaction status enum
 */
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/**
 * Financial transaction entity
 */
export interface FinancialTransaction {
  id: number;
  transaction_type: TransactionType;
  status: TransactionStatus;
  amount: number;
  base_amount: number;
  currency_type: CurrencyType;
  exchange_rate?: number;
  transaction_date: string;
  description?: string;
  reference_number?: string;
  category?: string;
  sub_category?: string;
  source_type?: string;
  source_id?: number;
  source?: { id: number; name?: string } | null;
  contact_id?: number;
  contact?: { id: number; name: string; code?: string } | null;
  user_id?: number;
  user?: { id: number; name: string; email: string } | null;
  approver_id?: number;
  approver?: { id: number; name: string; email: string } | null;
  is_reconciled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Transaction list filters
 */
export interface TransactionFilters {
  search?: string;
  transaction_type?: TransactionType;
  status?: TransactionStatus;
  currency_type?: CurrencyType;
  category?: string;
  contact_id?: number;
  is_reconciled?: boolean;
  transaction_date_from?: string;
  transaction_date_to?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Transaction summary
 */
export interface TransactionSummary {
  total_debit: number;
  total_credit: number;
  total_transactions: number;
  net_balance: number;
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
 * Transactions list response
 */
interface TransactionsListResponse {
  success: boolean;
  data: {
    financial_transactions: FinancialTransaction[];
    summary: TransactionSummary;
    pagination: Pagination;
  };
}

/**
 * Single transaction response
 */
interface TransactionResponse {
  success: boolean;
  data: {
    financial_transaction: FinancialTransaction;
  };
}

/**
 * Create/Update transaction data
 */
export interface TransactionFormData {
  transaction_type: TransactionType;
  status?: TransactionStatus;
  amount: number;
  currency_type: CurrencyType;
  exchange_rate?: number;
  transaction_date: string;
  description?: string;
  reference_number?: string;
  category?: string;
  sub_category?: string;
  source_type?: string;
  source_id?: number;
  contact_id?: number;
  is_reconciled?: boolean;
  is_active?: boolean;
}

/**
 * Get financial transactions list with optional filters
 */
export async function getFinancialTransactions(
  filters?: TransactionFilters
): Promise<{ transactions: FinancialTransaction[]; summary: TransactionSummary; pagination: Pagination }> {
  try {
    const response = await api.get<TransactionsListResponse>('/financial-transactions', {
      params: filters,
    });
    return {
      transactions: response.data.data.financial_transactions,
      summary: response.data.data.summary,
      pagination: response.data.data.pagination,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single financial transaction by ID
 */
export async function getFinancialTransaction(id: number): Promise<FinancialTransaction> {
  try {
    const response = await api.get<TransactionResponse>(`/financial-transactions/${id}`);
    return response.data.data.financial_transaction;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new financial transaction
 */
export async function createFinancialTransaction(data: TransactionFormData): Promise<FinancialTransaction> {
  try {
    const response = await api.post<TransactionResponse>('/financial-transactions', data);
    return response.data.data.financial_transaction;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing financial transaction
 */
export async function updateFinancialTransaction(
  id: number,
  data: Partial<TransactionFormData>
): Promise<FinancialTransaction> {
  try {
    const response = await api.put<TransactionResponse>(`/financial-transactions/${id}`, data);
    return response.data.data.financial_transaction;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete financial transaction
 */
export async function deleteFinancialTransaction(id: number): Promise<void> {
  try {
    await api.delete(`/financial-transactions/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get transaction type label in Turkish
 */
export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    income: 'Gelir',
    expense: 'Gider',
    transfer: 'Transfer',
  };
  return labels[type] || type;
}

/**
 * Get transaction status label in Turkish
 */
export function getTransactionStatusLabel(status: TransactionStatus): string {
  const labels: Record<TransactionStatus, string> = {
    pending: 'Beklemede',
    approved: 'Onaylandi',
    rejected: 'Reddedildi',
    cancelled: 'Iptal Edildi',
  };
  return labels[status] || status;
}

/**
 * Get currency symbol
 * @deprecated Use getCurrencySymbol from @/utils/formatters instead
 */
export function getCurrencySymbol(currency: CurrencyType): string {
  return getSymbol(currency);
}

/**
 * Format amount with currency (safe for undefined/null values)
 * @deprecated Use formatCurrency from @/utils/formatters instead
 */
export function formatAmount(amount: number | undefined | null, currency: CurrencyType): string {
  return formatCurrency(amount, currency);
}

/**
 * Format date for display
 * @deprecated Use formatDate from @/utils/formatters instead
 */
export function formatDate(dateString: string): string {
  return formatDateUtil(dateString, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
