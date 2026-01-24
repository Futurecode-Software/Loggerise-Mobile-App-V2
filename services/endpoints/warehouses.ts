/**
 * Warehouses API Endpoints
 *
 * Handles warehouse management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Warehouse entity
 */
export interface Warehouse {
  id: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  country?: string;
  manager?: string;
  phone?: string;
  email?: string;
  country_id?: number;
  city_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Warehouse list filters
 */
export interface WarehouseFilters {
  search?: string;
  is_active?: boolean;
  country_id?: number;
  city_id?: number;
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
 * Warehouses list response
 */
interface WarehousesListResponse {
  success: boolean;
  data: {
    warehouses: Warehouse[];
    pagination: Pagination;
  };
}

/**
 * Single warehouse response
 */
interface WarehouseResponse {
  success: boolean;
  data: {
    warehouse: Warehouse;
  };
}

/**
 * Create/Update warehouse data
 */
export interface WarehouseFormData {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  country?: string;
  manager?: string;
  phone?: string;
  email?: string;
  country_id?: number;
  city_id?: number;
  is_active?: boolean;
}

/**
 * Get warehouses list with optional filters
 */
export async function getWarehouses(
  filters?: WarehouseFilters
): Promise<{ warehouses: Warehouse[]; pagination: Pagination }> {
  try {
    const response = await api.get<WarehousesListResponse>('/warehouses', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single warehouse by ID
 */
export async function getWarehouse(id: number): Promise<Warehouse> {
  try {
    const response = await api.get<WarehouseResponse>(`/warehouses/${id}`);
    return response.data.data.warehouse;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new warehouse
 */
export async function createWarehouse(data: WarehouseFormData): Promise<Warehouse> {
  try {
    const response = await api.post<WarehouseResponse>('/warehouses', data);
    return response.data.data.warehouse;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing warehouse
 */
export async function updateWarehouse(
  id: number,
  data: Partial<WarehouseFormData>
): Promise<Warehouse> {
  try {
    const response = await api.put<WarehouseResponse>(`/warehouses/${id}`, data);
    return response.data.data.warehouse;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete warehouse
 */
export async function deleteWarehouse(id: number): Promise<void> {
  try {
    await api.delete(`/warehouses/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
