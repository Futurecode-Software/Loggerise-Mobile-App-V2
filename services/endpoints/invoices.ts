/**
 * Invoices API Endpoints
 *
 * Handles invoice management operations (Fatura Yönetimi).
 */

import api, { getErrorMessage } from '../api';
import { formatCurrency } from '@/utils/formatters';

/**
 * Invoice type enum
 */
export type InvoiceType = 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'service' | 'export' | 'proforma';

/**
 * Invoice status enum
 */
export type InvoiceStatus = 'draft' | 'approved' | 'cancelled';

/**
 * Payment status enum
 */
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

/**
 * Currency type enum (Tüm dövizler)
 */
export type CurrencyType = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'DKK' | 'CHF' | 'SEK' | 'CAD' | 'KWD' | 'NOK' | 'SAR' | 'JPY' | 'BGN' | 'RON' | 'RUB' | 'CNY' | 'PKR' | 'QAR' | 'KRW' | 'AZN' | 'AED' | 'XDR';

/**
 * Buyer type enum
 */
export type BuyerType = 'individual' | 'corporate';

/**
 * Invoice contact info (minimal)
 */
export interface InvoiceContact {
  id: number;
  name: string;
  code?: string;
  tax_number?: string;
  phone?: string;
}

/**
 * Invoice contact address (minimal)
 */
export interface InvoiceContactAddress {
  id: number;
  title: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Invoice warehouse (minimal)
 */
export interface InvoiceWarehouse {
  id: number;
  name: string;
  code?: string;
}

/**
 * Invoice item entity
 */
export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  product_id: number;
  product?: {
    id: number;
    code: string;
    name: string;
    unit: string;
  };
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_rate?: number;
  discount_amount?: number;
  vat_rate: number;
  vat_amount: number;
  sub_total: number;
  total: number;
  has_withholding?: boolean;
  withholding_rate?: number;
  withholding_code?: string;
  sort_order?: number;
}

/**
 * Invoice entity
 */
export interface Invoice {
  id: number;
  contact_id: number;
  contact?: InvoiceContact;
  contact_address_id?: number;
  contact_address?: InvoiceContactAddress;
  warehouse_id: number;
  warehouse?: InvoiceWarehouse;
  invoice_no?: string;
  invoice_series?: string;
  type: InvoiceType;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  invoice_date: string;
  due_date?: string;
  delivery_date?: string;
  currency_type: CurrencyType;
  currency_rate: number;
  sub_total: number;
  discount_rate?: number;
  discount_amount?: number;
  vat_amount: number;
  withholding_amount?: number;
  withholding_base?: number;
  withholding_vat?: number;
  withholding_net?: number;
  total: number;
  has_withholding?: boolean;
  is_withholding_applicable?: boolean;
  withholding_rate?: number;
  withholding_code?: string;
  payment_method?: string;
  notes?: string;
  document_type?: string;
  e_invoice_uuid?: string;
  is_e_archive_required?: boolean;
  items?: InvoiceItem[];
  is_cancelled: boolean;
  is_correction: boolean;
  is_e_archive: boolean;
  is_e_invoice: boolean;
  is_approved: boolean;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Invoice list filters
 */
export interface InvoiceFilters {
  search?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
  payment_status?: PaymentStatus;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
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
 * Invoices list response
 */
interface InvoicesListResponse {
  success: boolean;
  data: {
    invoices: Invoice[];
    pagination: Pagination;
  };
}

/**
 * Single invoice response
 */
interface InvoiceResponse {
  success: boolean;
  data: {
    invoice: Invoice;
  };
  message?: string;
}

/**
 * PDF response
 */
interface InvoicePdfResponse {
  success: boolean;
  data: {
    pdf_base64: string;
    file_name: string;
    mime_type: string;
  };
  message?: string;
}

/**
 * Send email response
 */
interface SendInvoiceResponse {
  success: boolean;
  message: string;
}

/**
 * Create invoice data
 */
export interface InvoiceFormData {
  contact_id: number;
  contact_address_id: number; // Backend'de ZORUNLU alan
  warehouse_id: number;
  type: InvoiceType;
  invoice_series?: string;
  invoice_no?: string;
  invoice_date: string;
  due_date?: string;
  delivery_date?: string;
  currency_type: CurrencyType;
  currency_rate: number;
  payment_status: PaymentStatus;
  payment_method?: string;
  status: InvoiceStatus;
  sub_total: number;
  discount_rate?: number;
  discount_amount?: number;
  vat_amount: number;
  total: number;
  has_withholding?: boolean;
  withholding_code?: string;
  withholding_rate?: number;
  withholding_amount?: number;
  notes?: string;
  buyer_type?: BuyerType;
  items: InvoiceItem[];
}

/**
 * Send invoice email data
 */
export interface SendInvoiceData {
  email: string;
  subject?: string;
  message?: string;
  cc?: string[];
}

/**
 * Get invoices list with optional filters
 */
export async function getInvoices(
  filters?: InvoiceFilters
): Promise<{ invoices: Invoice[]; pagination: Pagination }> {
  try {
    const response = await api.get<InvoicesListResponse>('/invoices', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single invoice by ID
 */
export async function getInvoice(id: number): Promise<Invoice> {
  try {
    const response = await api.get<InvoiceResponse>(`/invoices/${id}`);
    return response.data.data.invoice;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new invoice
 */
export async function createInvoice(data: InvoiceFormData): Promise<Invoice> {
  try {
    const response = await api.post<InvoiceResponse>('/invoices', data);
    return response.data.data.invoice;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing invoice
 */
export async function updateInvoice(
  id: number,
  data: Partial<InvoiceFormData>
): Promise<Invoice> {
  try {
    const response = await api.put<InvoiceResponse>(`/invoices/${id}`, data);
    return response.data.data.invoice;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete invoice
 */
export async function deleteInvoice(id: number): Promise<void> {
  try {
    await api.delete(`/invoices/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Generate PDF for invoice
 */
export async function getInvoicePdf(id: number): Promise<{ pdfBase64: string; fileName: string }> {
  try {
    const response = await api.get<InvoicePdfResponse>(`/invoices/${id}/pdf`);
    return {
      pdfBase64: response.data.data.pdf_base64,
      fileName: response.data.data.file_name,
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Send invoice via email
 */
export async function sendInvoice(id: number, data: SendInvoiceData): Promise<string> {
  try {
    const response = await api.post<SendInvoiceResponse>(`/invoices/${id}/send`, data);
    return response.data.message;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get invoice type label in Turkish
 */
export function getInvoiceTypeLabel(type: InvoiceType): string {
  const labels: Record<InvoiceType, string> = {
    sale: 'Satış Faturası',
    purchase: 'Alış Faturası',
    sale_return: 'Satış İade Faturası',
    purchase_return: 'Alış İade Faturası',
    service: 'Hizmet Faturası',
    export: 'İhracat Faturası',
    proforma: 'Proforma Fatura',
  };
  return labels[type] || type;
}

/**
 * Get invoice status label in Turkish
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    draft: 'Taslak',
    approved: 'Onaylandı',
    cancelled: 'İptal Edildi',
  };
  return labels[status] || status;
}

/**
 * Get payment status label in Turkish
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Ödeme Bekliyor',
    partial: 'Kısmi Ödendi',
    paid: 'Ödendi',
    overdue: 'Vadesi Geçti',
  };
  return labels[status] || status;
}

/**
 * Get invoice status color
 */
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    draft: '#6B7280', // gray
    approved: '#10B981', // green
    cancelled: '#EF4444', // red
  };
  return colors[status] || '#6B7280';
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    pending: '#F59E0B', // amber
    partial: '#3B82F6', // blue
    paid: '#10B981', // green
    overdue: '#EF4444', // red
  };
  return colors[status] || '#6B7280';
}

/**
 * Format invoice total with currency
 */
export function formatInvoiceTotal(invoice: Invoice): string {
  return formatCurrency(invoice.total, invoice.currency_type);
}
