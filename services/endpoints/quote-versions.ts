/**
 * Quote Versions API Endpoints
 *
 * Handles quote version history and management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Quote Version entity
 */
export interface QuoteVersion {
  id: number;
  quote_id: number;
  version_number: number;
  quote_data: Record<string, any>;
  change_reason?: string | null;
  created_by_user_id: number;
  created_by?: {
    id: number;
    name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

/**
 * Version list filters
 */
export interface VersionFilters {
  page?: number;
  per_page?: number;
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
 * Versions list response
 */
interface VersionsListResponse {
  success: boolean;
  data: {
    versions: QuoteVersion[];
    pagination: Pagination;
  };
}

/**
 * Single version response
 */
interface VersionResponse {
  success: boolean;
  data: {
    version: QuoteVersion;
  };
}

/**
 * Compare response
 */
interface CompareResponse {
  success: boolean;
  data: {
    version_1: QuoteVersion;
    version_2: QuoteVersion;
    differences: Record<string, { old: any; new: any }>;
  };
}

/**
 * Restore response
 */
interface RestoreResponse {
  success: boolean;
  message: string;
  data: {
    quote: any; // Full quote object
  };
}

/**
 * Export PDF response
 */
interface ExportPdfResponse {
  success: boolean;
  message: string;
  data: {
    version_id: number;
    version_number: number;
    pdf_url?: string | null;
  };
}

/**
 * Get versions list for a quote
 */
export async function getQuoteVersions(
  quoteId: number,
  filters?: VersionFilters
): Promise<{ versions: QuoteVersion[]; pagination: Pagination }> {
  try {
    const response = await api.get<VersionsListResponse>(
      `/quotes/${quoteId}/versions`,
      { params: filters }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create a new version from current quote state
 */
export async function createQuoteVersion(
  quoteId: number,
  changeReason?: string
): Promise<QuoteVersion> {
  try {
    const response = await api.post<VersionResponse>(
      `/quotes/${quoteId}/versions`,
      { change_reason: changeReason }
    );
    return response.data.data.version;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single version by ID
 */
export async function getQuoteVersion(
  quoteId: number,
  versionId: number
): Promise<QuoteVersion> {
  try {
    const response = await api.get<VersionResponse>(
      `/quotes/${quoteId}/versions/${versionId}`
    );
    return response.data.data.version;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Compare two versions
 */
export async function compareQuoteVersions(
  quoteId: number,
  version1Id: number,
  version2Id: number
): Promise<{
  version_1: QuoteVersion;
  version_2: QuoteVersion;
  differences: Record<string, { old: any; new: any }>;
}> {
  try {
    const response = await api.post<CompareResponse>(
      `/quotes/${quoteId}/versions/compare`,
      {
        version_1: version1Id,
        version_2: version2Id,
      }
    );
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Restore a specific version
 */
export async function restoreQuoteVersion(
  quoteId: number,
  versionId: number
): Promise<any> {
  try {
    const response = await api.post<RestoreResponse>(
      `/quotes/${quoteId}/versions/${versionId}/restore`
    );
    return response.data.data.quote;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Export version as PDF
 */
export async function exportVersionPdf(
  quoteId: number,
  versionId: number
): Promise<string> {
  try {
    const response = await api.get<ExportPdfResponse>(
      `/quotes/${quoteId}/versions/${versionId}/pdf`
    );
    return response.data.message;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get field name in Turkish for display
 */
export function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    quote_number: 'Teklif No',
    customer_id: 'Müşteri',
    status: 'Durum',
    currency_type: 'Para Birimi',
    subtotal: 'Ara Toplam',
    vat_total: 'KDV Tutarı',
    discount_total: 'İndirim Tutarı',
    grand_total: 'Genel Toplam',
    valid_until: 'Geçerlilik Tarihi',
    notes: 'Notlar',
    terms_and_conditions: 'Şartlar ve Koşullar',
    description: 'Açıklama',
    quote_date: 'Teklif Tarihi',
    pickup_address_id: 'Yükleme Adresi',
    delivery_address_id: 'Teslimat Adresi',
    payment_terms: 'Ödeme Koşulları',
    delivery_terms: 'Teslimat Koşulları',
    special_instructions: 'Özel Talimatlar',
  };
  return labels[fieldName] || fieldName;
}
