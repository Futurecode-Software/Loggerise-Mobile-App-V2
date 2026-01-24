/**
 * Loads API Endpoints
 *
 * Handles load (yuk) management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Load status enum
 */
export type LoadStatus =
  | 'pending'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

/**
 * Load type enum
 */
export type LoadType = 'ftl' | 'ltl' | 'groupage' | 'express' | 'other';

/**
 * Load entity
 */
export interface Load {
  id: number;
  load_number: string;
  cargo_name?: string;
  status: LoadStatus;
  load_type: LoadType;
  customer?: {
    id: number;
    name: string;
  };
  sender_company?: {
    id: number;
    name: string;
  };
  receiver_company?: {
    id: number;
    name: string;
  };
  manufacturer_company?: {
    id: number;
    name: string;
  };
  pickup_date?: string;
  delivery_date?: string;
  total_weight?: number;
  total_volume?: number;
  total_lademetre?: number;
  sale_price?: number;
  sale_currency?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Load with details (items and addresses)
 */
export interface LoadDetail extends Load {
  items: LoadItem[];
  addresses: LoadAddress[];
}

/**
 * Load item (package/piece info)
 */
export interface LoadItem {
  id: number;
  load_id: number;
  package_type?: string;
  package_count?: number;
  piece_count?: number;
  gross_weight?: number;
  net_weight?: number;
  volumetric_weight?: number;
  width?: number;
  height?: number;
  length?: number;
  volume?: number;
  is_stackable: boolean;
  is_hazardous: boolean;
  hazmat_un_no?: string;
  hazmat_class?: string;
  sort_order: number;
  is_active: boolean;
}

/**
 * Load address (loading/unloading points)
 */
export interface LoadAddress {
  id: number;
  load_id: number;
  address_type: 'loading' | 'unloading' | 'customs' | 'warehouse';
  sequence: number;
  loading_location?: { id: number; name: string };
  loading_company?: { id: number; name: string };
  unloading_location?: { id: number; name: string };
  unloading_company?: { id: number; name: string };
  destination_country?: { id: number; name: string };
  loading_date?: string;
  unloading_date?: string;
  notes?: string;
  is_active: boolean;
}

/**
 * Load list filters
 */
export interface LoadFilters {
  search?: string;
  load_number?: string;
  customer_id?: number;
  status?: LoadStatus;
  load_type?: LoadType;
  cargo_name?: string;
  is_active?: boolean;
  assigned_to_trip?: 'assigned' | 'not_assigned' | 'all';
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
 * Loads list response
 */
interface LoadsListResponse {
  success: boolean;
  data: {
    loads: Load[];
    pagination: Pagination;
  };
}

/**
 * Single load response
 */
interface LoadResponse {
  success: boolean;
  data: {
    load: LoadDetail;
  };
}

/**
 * Get loads list with optional filters
 */
export async function getLoads(
  filters?: LoadFilters
): Promise<{ loads: Load[]; pagination: Pagination }> {
  try {
    const response = await api.get<LoadsListResponse>('/loads', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single load by ID
 */
export async function getLoad(id: number): Promise<LoadDetail> {
  try {
    const response = await api.get<LoadResponse>(`/loads/${id}`);
    return response.data.data.load;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get status label in Turkish
 */
export function getStatusLabel(status: LoadStatus): string {
  const labels: Record<LoadStatus, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    in_transit: 'Yolda',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal',
  };
  return labels[status] || status;
}

/**
 * Get status color
 */
export function getStatusColor(status: LoadStatus): string {
  const colors: Record<LoadStatus, string> = {
    pending: '#f5a623',
    confirmed: '#3b82f6',
    in_transit: '#227d53',
    delivered: '#13452d',
    cancelled: '#d0021b',
  };
  return colors[status] || '#6B7280';
}
