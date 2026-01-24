/**
 * CRM Customers API Endpoints
 *
 * Handles CRM customer (potential customers) management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * CRM Customer status enum
 */
export type CrmCustomerStatus = 'active' | 'passive' | 'lost' | 'converted';

/**
 * Customer segment enum
 */
export type CustomerSegment = 'enterprise' | 'mid_market' | 'small_business' | 'individual';

/**
 * Legal type enum
 */
export type LegalType = 'company' | 'individual';

/**
 * CRM Customer entity
 */
export interface CrmCustomer {
  id: number;
  code: string;
  type: 'potential' | 'customer';
  legal_type: LegalType;
  name: string;
  short_name?: string;
  category?: string;
  customer_segment?: CustomerSegment;
  credit_rating?: number;
  credit_rating_label?: string;
  email?: string;
  phone?: string;
  fax?: string;
  iban?: string[];
  tax_number?: string;
  tax_office_id?: number;
  tax_office?: { id: number; name: string } | null;
  currency_type?: string;
  status: CrmCustomerStatus;
  is_active: boolean;

  // CRM-specific fields
  interactions_count?: number;
  quotes_count?: number;
  last_interaction?: {
    id: number;
    interaction_type: string;
    interaction_date: string;
    status: string;
    subject?: string;
  } | null;
  has_recent_activity?: boolean;
  has_pending_followups?: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * CRM Customer list filters
 */
export interface CrmCustomerFilters {
  search?: string;
  category?: string;
  status?: CrmCustomerStatus;
  type?: 'potential' | 'customer';
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
 * CRM Customers list response
 */
interface CrmCustomersListResponse {
  success: boolean;
  data: {
    customers: CrmCustomer[];
    pagination: Pagination;
  };
}

/**
 * Single CRM customer response
 */
interface CrmCustomerResponse {
  success: boolean;
  data: {
    customer: CrmCustomer;
  };
}

/**
 * Create/Update CRM customer data
 */
export interface CrmCustomerFormData {
  type?: 'potential' | 'customer';
  legal_type: LegalType;
  name: string;
  short_name?: string;
  code?: string;
  category?: string;
  customer_segment?: CustomerSegment;
  email?: string;
  phone?: string;
  fax?: string;
  tax_number?: string;
  tax_office_id?: number;
  currency_type?: string;
  status?: CrmCustomerStatus;
  is_active?: boolean;
  main_address?: string;
  country_id?: number;
  main_state_id?: number;
  main_city_id?: number;
}

/**
 * Get CRM customers list with optional filters
 */
export async function getCrmCustomers(
  filters?: CrmCustomerFilters
): Promise<{ customers: CrmCustomer[]; pagination: Pagination }> {
  try {
    const response = await api.get<CrmCustomersListResponse>('/crm/customers', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single CRM customer by ID
 */
export async function getCrmCustomer(id: number): Promise<CrmCustomer> {
  try {
    const response = await api.get<CrmCustomerResponse>(`/crm/customers/${id}`);
    return response.data.data.customer;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new CRM customer
 */
export async function createCrmCustomer(data: CrmCustomerFormData): Promise<CrmCustomer> {
  try {
    const response = await api.post<CrmCustomerResponse>('/crm/customers', data);
    return response.data.data.customer;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing CRM customer
 */
export async function updateCrmCustomer(
  id: number,
  data: Partial<CrmCustomerFormData>
): Promise<CrmCustomer> {
  try {
    const response = await api.put<CrmCustomerResponse>(`/crm/customers/${id}`, data);
    return response.data.data.customer;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete CRM customer
 */
export async function deleteCrmCustomer(id: number): Promise<void> {
  try {
    await api.delete(`/crm/customers/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get CRM customer status label in Turkish
 */
export function getCrmCustomerStatusLabel(status: CrmCustomerStatus): string {
  const labels: Record<CrmCustomerStatus, string> = {
    active: 'Aktif',
    passive: 'Pasif',
    lost: 'Kaybedildi',
    converted: 'Dönüştürüldü',
  };
  return labels[status] || status;
}

/**
 * Get CRM customer status variant for Badge component
 */
export function getCrmCustomerStatusVariant(
  status: CrmCustomerStatus
): 'default' | 'info' | 'success' | 'danger' | 'warning' {
  const variants: Record<CrmCustomerStatus, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
    active: 'success',
    passive: 'default',
    lost: 'danger',
    converted: 'info',
  };
  return variants[status] || 'default';
}

/**
 * Get customer segment label in Turkish
 */
export function getCustomerSegmentLabel(segment?: CustomerSegment): string {
  if (!segment) return '-';
  const labels: Record<CustomerSegment, string> = {
    enterprise: 'Kurumsal',
    mid_market: 'Orta Ölçek',
    small_business: 'Küçük İşletme',
    individual: 'Bireysel',
  };
  return labels[segment] || segment;
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
    });
  } catch {
    return dateString;
  }
}
