/**
 * Quotes API Endpoints
 *
 * Handles quote management operations.
 * 100% compatible with backend QuoteController and QuoteResource.
 */

import api, { getErrorMessage } from '../api';
import { formatCurrency, getCurrencySymbol as getSymbol, formatDate as formatDateUtil } from '@/utils/formatters';
import { API_BASE_URL } from '../config';
import { secureStorage } from '../storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Quote status enum
 */
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

/**
 * Currency type
 */
export type CurrencyType = 'TRY' | 'USD' | 'EUR' | 'GBP';

/**
 * Load type enum
 */
export type LoadType = 'full' | 'partial';

/**
 * Address type enum
 */
export type AddressType = 'pickup' | 'delivery';

/**
 * Cargo item (nested within load item)
 */
export interface CargoItem {
  cargo_name?: string;
  cargo_name_foreign?: string;
  package_type?: string;
  package_count?: number;
  piece_count?: number;
  gross_weight?: number | string;
  net_weight?: number | string;
  volumetric_weight?: number | string;
  lademetre_weight?: number | string;
  total_chargeable_weight?: number | string;
  width?: number | string;
  height?: number | string;
  length?: number | string;
  volume?: number | string;
  lademetre?: number | string;
  is_stackable?: boolean;
  is_hazardous?: boolean;
  hazmat_un_no?: string;
  hazmat_class?: string;
  hazmat_page_no?: string;
  hazmat_packing_group?: string;
  hazmat_flash_point?: number | string;
  hazmat_description?: string;
}

/**
 * Pricing item (fiyatlandırma kalemi)
 */
export interface PricingItem {
  product_id?: number;
  product?: {
    id: number;
    name: string;
    code?: string;
  };
  description?: string;
  quantity: number | string;
  unit: string;
  unit_price: number | string;
  currency?: CurrencyType;
  exchange_rate?: number | string;
  vat_rate?: number | string;
  vat_amount?: number | string;
  discount_rate?: number | string;
  discount_amount?: number | string;
  sub_total: number | string;
  total: number | string;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Load address
 */
export interface LoadAddress {
  type: AddressType;
  address: string;
  country_id: number;
  state_id?: number;
  city_id?: number;
  postal_code?: string;
}

/**
 * Load item (cargo within quote)
 */
export interface LoadItem {
  cargo_name: string;
  cargo_name_foreign?: string;
  vehicle_type?: string;
  loading_type?: string;
  load_type?: LoadType;
  transport_speed?: string;
  cargo_class?: string;
  freight_price: number;
  items?: CargoItem[];
  addresses?: LoadAddress[];
}

/**
 * Quote entity (matches backend QuoteResource exactly)
 */
export interface Quote {
  id: number;
  quote_number: string;
  customer_id?: number;
  customer?: { id: number; name: string; code?: string } | null;
  contact?: { id: number; name: string; email?: string } | null;
  customer_name?: string | null;
  prepared_by_user_id?: number;
  prepared_by?: { id: number; name: string; email: string } | null;
  preparedBy?: { id: number; name: string; email: string } | null;
  quote_date?: string;
  valid_until?: string;
  status: QuoteStatus;
  currency: CurrencyType;
  exchange_rate: number | string;
  include_vat?: boolean;
  vat_rate?: number | string;
  load_items?: LoadItem[];
  cargo_items?: LoadItem[];
  subtotal: number | string;
  discount_percentage?: number | string;
  discount_amount?: number | string;
  vat_amount: number | string;
  total_amount: number | string;
  terms_conditions?: string;
  internal_notes?: string;
  customer_notes?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  sort_order?: number;
  is_active: boolean;
  has_converted_loads?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_convert_to_loads?: boolean;
  is_expired?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Quote list filters
 */
export interface QuoteFilters {
  search?: string;
  status?: QuoteStatus;
  customer_id?: number;
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
 * Quotes list response
 */
interface QuotesListResponse {
  success: boolean;
  data: {
    quotes: Quote[];
    pagination: Pagination;
  };
}

/**
 * Single quote response
 */
interface QuoteResponse {
  success: boolean;
  message?: string;
  data: {
    quote: Quote;
  };
}

/**
 * Create/Update quote data (matches MobileStoreQuoteRequest)
 */
export interface QuoteFormData {
  customer_id: number;
  quote_date: string;
  valid_until: string;
  currency: CurrencyType;
  currency_type?: CurrencyType;
  exchange_rate: number;
  include_vat?: boolean;
  vat_rate?: number;
  discount_percentage?: number;
  discount_amount?: number;
  discount_total?: number;
  subtotal?: number;
  terms_conditions?: string;
  terms_and_conditions?: string;
  internal_notes?: string;
  customer_notes?: string;
  notes?: string;
  description?: string;
  pickup_address_id?: number;
  delivery_address_id?: number;
  payment_terms?: string;
  delivery_terms?: string;
  special_instructions?: string;
  vat_total?: number;
  grand_total?: number;
  load_items: LoadItem[];
}

/**
 * Get quotes list with optional filters
 */
export async function getQuotes(
  filters?: QuoteFilters
): Promise<{ quotes: Quote[]; pagination: Pagination }> {
  try {
    const response = await api.get<QuotesListResponse>('/quotes', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single quote by ID
 */
export async function getQuote(id: number): Promise<Quote> {
  try {
    const response = await api.get<QuoteResponse>(`/quotes/${id}`);
    return response.data.data.quote;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new quote
 */
export async function createQuote(data: QuoteFormData): Promise<Quote> {
  try {
    const response = await api.post<QuoteResponse>('/quotes', data);
    return response.data.data.quote;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing quote
 */
export async function updateQuote(
  id: number,
  data: Partial<QuoteFormData>
): Promise<Quote> {
  try {
    const response = await api.put<QuoteResponse>(`/quotes/${id}`, data);
    return response.data.data.quote;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete quote
 */
export async function deleteQuote(id: number): Promise<void> {
  try {
    await api.delete(`/quotes/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
  id: number,
  status: QuoteStatus
): Promise<Quote> {
  try {
    const response = await api.patch<QuoteResponse>(
      `/quotes/${id}/status`,
      { status }
    );
    return response.data.data.quote;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Send quote to customer
 */
export async function sendQuote(id: number): Promise<Quote> {
  try {
    const response = await api.post<QuoteResponse>(`/quotes/${id}/send`);
    return response.data.data.quote;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Convert quote to loads
 */
export async function convertQuoteToLoads(
  id: number
): Promise<{ loads_count: number; load_ids: number[] }> {
  try {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: { loads_count: number; load_ids: number[] };
    }>(`/quotes/${id}/convert-to-loads`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Duplicate quote
 */
export async function duplicateQuote(id: number): Promise<Quote> {
  try {
    const response = await api.post<QuoteResponse>(`/quotes/${id}/duplicate`);
    return response.data.data.quote;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Export quote as PDF
 * Downloads PDF file and saves to device storage
 * Uses new expo-file-system API with File and Directory classes
 */
export async function exportQuotePdf(id: number): Promise<{ uri: string; fileName: string }> {
  try {
    // Get auth token
    const token = await secureStorage.getToken();
    if (!token) {
      throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    }

    const fileName = `teklif_${id}_${new Date().getTime()}.pdf`;

    // Create directory for PDFs in cache (idempotent: won't fail if exists)
    const pdfDirectory = new Directory(Paths.cache, 'pdfs');
    await pdfDirectory.create({ idempotent: true });

    console.log('[PDF Export] Downloading from:', `${API_BASE_URL}/quotes/${id}/pdf`);

    // Create the target file
    const targetFile = new File(pdfDirectory, fileName);

    // Delete if already exists
    if (await targetFile.exists) {
      console.log('[PDF Export] Deleting existing file:', targetFile.uri);
      await targetFile.delete();
    }

    // Download PDF directly to target file
    const downloadedFile = await File.downloadFileAsync(
      `${API_BASE_URL}/quotes/${id}/pdf`,
      targetFile,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        },
      }
    );

    console.log('[PDF Export] Downloaded file:', downloadedFile.uri);

    // Share/Open the downloaded PDF
    if (await Sharing.isAvailableAsync()) {
      console.log('[PDF Export] Sharing file...');
      await Sharing.shareAsync(downloadedFile.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Teklif PDF',
        UTI: 'com.adobe.pdf',
      });
    } else {
      console.warn('[PDF Export] Sharing not available on this device');
    }

    return { uri: downloadedFile.uri, fileName };
  } catch (error) {
    console.error('PDF download error:', error);
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get quote status label in Turkish
 */
export function getQuoteStatusLabel(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    draft: 'Taslak',
    sent: 'Gönderildi',
    viewed: 'Görüntülendi',
    accepted: 'Kabul Edildi',
    rejected: 'Reddedildi',
    expired: 'Süresi Doldu',
  };
  return labels[status] || status;
}

/**
 * Get quote status variant for Badge component
 */
export function getQuoteStatusVariant(
  status: QuoteStatus
): 'default' | 'info' | 'success' | 'danger' | 'warning' {
  const variants: Record<
    QuoteStatus,
    'default' | 'info' | 'success' | 'danger' | 'warning'
  > = {
    draft: 'default',
    sent: 'info',
    viewed: 'info',
    accepted: 'success',
    rejected: 'danger',
    expired: 'warning',
  };
  return variants[status] || 'default';
}

/**
 * Get currency symbol
 * @deprecated Use getCurrencySymbol from @/utils/formatters instead
 */
export function getCurrencySymbol(currency: CurrencyType): string {
  return getSymbol(currency);
}

/**
 * Format amount with currency (safe for undefined/null/string values)
 * @deprecated Use formatCurrency from @/utils/formatters instead
 */
export function formatAmount(
  amount: number | string | undefined | null,
  currency: CurrencyType
): string {
  // Convert string to number (Laravel decimal cast returns string)
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return formatCurrency(numericAmount, currency);
}

/**
 * Format date for display
 * @deprecated Use formatDate from @/utils/formatters instead
 */
export function formatDate(dateString?: string): string {
  return formatDateUtil(dateString, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date for input (YYYY-MM-DD)
 */
export function formatDateForInput(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}
