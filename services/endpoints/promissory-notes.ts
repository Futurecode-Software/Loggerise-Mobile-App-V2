/**
 * Promissory Notes API Endpoints
 *
 * Handles promissory note (senet) management operations.
 */

import api, { getErrorMessage } from '../api';
import { formatCurrency } from '@/utils/formatters';

/**
 * Currency type enum
 */
export type CurrencyType = 'TRY' | 'USD' | 'EUR' | 'GBP';

/**
 * Promissory note type enum
 */
export type PromissoryNoteType = 'received' | 'issued';

/**
 * Promissory note status enum
 */
export type PromissoryNoteStatus = 'pending' | 'transferred' | 'cleared' | 'protested' | 'cancelled';

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
 * Promissory Note entity
 */
export interface PromissoryNote {
  id: number;
  contact?: Contact;
  contact_id: number;
  promissory_note_number: string;
  bank_name: string;
  branch_name: string;
  account_number?: string;
  drawer_name?: string;
  endorser_name?: string;
  portfolio_number?: string;
  type: PromissoryNoteType;
  issue_date: string;
  due_date: string;
  amount: number;
  currency_type: CurrencyType;
  status: PromissoryNoteStatus;
  transferred_to?: TransferredTo | null;
  transferred_to_type?: TransferredToType | null;
  transferred_to_id?: number | null;
  transferred_date?: string | null;
  cleared_date?: string | null;
  protested_date?: string | null;
  cancelled_date?: string | null;
  attached_document?: string | null;
  description?: string;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Promissory note list filters
 */
export interface PromissoryNoteFilters {
  search?: string;
  type?: PromissoryNoteType;
  status?: PromissoryNoteStatus;
  currency_type?: CurrencyType;
  contact_id?: number;
  due_date_from?: string;
  due_date_to?: string;
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
 * Promissory notes list response
 */
interface PromissoryNotesListResponse {
  success: boolean;
  data: {
    promissory_notes: PromissoryNote[];
    pagination: Pagination;
  };
}

/**
 * Single promissory note response
 */
interface PromissoryNoteResponse {
  success: boolean;
  data: {
    promissory_note: PromissoryNote;
  };
}

/**
 * Create/Update promissory note data
 */
export interface PromissoryNoteFormData {
  contact_id: number;
  promissory_note_number: string;
  bank_name: string;
  branch_name: string;
  account_number?: string;
  drawer_name?: string;
  endorser_name?: string;
  portfolio_number?: string;
  type: PromissoryNoteType;
  issue_date: string;
  due_date: string;
  amount: number;
  currency_type: CurrencyType;
  status: PromissoryNoteStatus;
  transferred_to_type?: TransferredToType | null;
  transferred_to_id?: number | null;
  transferred_date?: string | null;
  cleared_date?: string | null;
  protested_date?: string | null;
  cancelled_date?: string | null;
  attached_document?: string | null;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Get promissory notes list with optional filters
 */
export async function getPromissoryNotes(
  filters?: PromissoryNoteFilters
): Promise<{ promissory_notes: PromissoryNote[]; pagination: Pagination }> {
  try {
    const response = await api.get<PromissoryNotesListResponse>('/promissory-notes', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single promissory note by ID
 */
export async function getPromissoryNote(id: number): Promise<PromissoryNote> {
  try {
    const response = await api.get<PromissoryNoteResponse>(`/promissory-notes/${id}`);
    return response.data.data.promissory_note;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new promissory note
 */
export async function createPromissoryNote(data: PromissoryNoteFormData): Promise<PromissoryNote> {
  try {
    const response = await api.post<PromissoryNoteResponse>('/promissory-notes', data);
    return response.data.data.promissory_note;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing promissory note
 */
export async function updatePromissoryNote(
  id: number,
  data: Partial<PromissoryNoteFormData>
): Promise<PromissoryNote> {
  try {
    const response = await api.put<PromissoryNoteResponse>(`/promissory-notes/${id}`, data);
    return response.data.data.promissory_note;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete promissory note
 */
export async function deletePromissoryNote(id: number): Promise<void> {
  try {
    await api.delete(`/promissory-notes/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get promissory note type label in Turkish
 */
export function getPromissoryNoteTypeLabel(type: PromissoryNoteType): string {
  const labels: Record<PromissoryNoteType, string> = {
    received: 'Alınan',
    issued: 'Verilen',
  };
  return labels[type] || type;
}

/**
 * Get promissory note status label in Turkish
 */
export function getPromissoryNoteStatusLabel(status: PromissoryNoteStatus): string {
  const labels: Record<PromissoryNoteStatus, string> = {
    pending: 'Beklemede',
    transferred: 'Transfer Edildi',
    cleared: 'Tahsil Edildi',
    protested: 'Protesto Edildi',
    cancelled: 'İptal Edildi',
  };
  return labels[status] || status;
}

/**
 * Get promissory note status color for UI
 */
export function getPromissoryNoteStatusColor(
  status: PromissoryNoteStatus
): 'success' | 'warning' | 'danger' | 'default' | 'info' {
  const colors: Record<PromissoryNoteStatus, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
    pending: 'warning',
    transferred: 'info',
    cleared: 'success',
    protested: 'danger',
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
 * Format promissory note amount with currency
 */
export function formatPromissoryNoteAmount(amount: number | undefined | null, currency: CurrencyType): string {
  return formatCurrency(amount, currency, 2);
}
