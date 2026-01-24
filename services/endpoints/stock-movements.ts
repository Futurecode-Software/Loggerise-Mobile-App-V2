/**
 * Stock Movements API Endpoints
 *
 * Handles stock movement operations including transfers between warehouses.
 */

import api, { getErrorMessage } from '../api';
import { Pagination } from './products';

/**
 * Stock movement types
 */
export type StockMovementType =
  | 'in'
  | 'out'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'opening_balance'
  | 'wastage'
  | 'production_in'
  | 'production_out'
  | 'return_in'
  | 'return_out';

/**
 * Stock movement entity
 */
export interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  currency_type?: string;
  exchange_rate?: number;
  reference_warehouse_id?: number;
  notes?: string;
  transaction_date: string;
  balance_after?: number;
  cost_after?: number;
  user_id?: number;
  product?: {
    id: number;
    name: string;
    code?: string;
    unit?: string;
  };
  warehouse?: {
    id: number;
    name: string;
    code?: string;
  };
  reference_warehouse?: {
    id: number;
    name: string;
    code?: string;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Stock movement list filters
 */
export interface StockMovementFilters {
  search?: string;
  warehouse_id?: number;
  product_id?: number;
  movement_type?: StockMovementType;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Stock movement form data for create
 */
export interface StockMovementFormData {
  product_id: number;
  warehouse_id: number;
  movement_type: StockMovementType;
  quantity: number;
  unit_cost?: number;
  currency_type?: string;
  exchange_rate?: number;
  reference_warehouse_id?: number;
  notes?: string;
  transaction_date?: string;
}

/**
 * Transfer form data
 */
export interface TransferFormData {
  from_warehouse_id: number;
  to_warehouse_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
}

/**
 * Stock movements list response
 */
interface StockMovementsListResponse {
  success: boolean;
  data: {
    movements: StockMovement[];
    pagination: Pagination;
  };
}

/**
 * Single stock movement response
 */
interface StockMovementResponse {
  success: boolean;
  data: {
    movement: StockMovement;
  };
}

/**
 * Get stock movements list with optional filters
 */
export async function getStockMovements(
  filters?: StockMovementFilters
): Promise<{ movements: StockMovement[]; pagination: Pagination }> {
  try {
    const response = await api.get<StockMovementsListResponse>('/stock-movements', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single stock movement by ID
 */
export async function getStockMovement(id: number): Promise<StockMovement> {
  try {
    const response = await api.get<StockMovementResponse>(`/stock-movements/${id}`);
    return response.data.data.movement;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new stock movement
 */
export async function createStockMovement(data: StockMovementFormData): Promise<StockMovement> {
  try {
    const response = await api.post<StockMovementResponse>('/stock-movements', data);
    return response.data.data.movement;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update stock movement
 */
export async function updateStockMovement(
  id: number,
  data: Partial<StockMovementFormData>
): Promise<StockMovement> {
  try {
    const response = await api.put<StockMovementResponse>(`/stock-movements/${id}`, data);
    return response.data.data.movement;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete stock movement
 */
export async function deleteStockMovement(id: number): Promise<void> {
  try {
    await api.delete(`/stock-movements/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Transfer stock between warehouses
 */
export async function transferStock(data: TransferFormData): Promise<StockMovement> {
  try {
    const response = await api.post<StockMovementResponse>('/stock-movements/transfer', data);
    return response.data.data.movement;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get movement type label in Turkish
 */
export function getMovementTypeLabel(type: StockMovementType): string {
  const labels: Record<StockMovementType, string> = {
    in: 'Giriş',
    out: 'Çıkış',
    transfer_out: 'Depolar Arası Çıkış',
    transfer_in: 'Depolar Arası Giriş',
    adjustment_in: 'Sayım Fazlası',
    adjustment_out: 'Sayım Eksiği',
    opening_balance: 'Dönem Başı Devir',
    wastage: 'Fire',
    production_in: 'Üretimden Giriş',
    production_out: 'Üretime Gönderilen',
    return_in: 'İade Kabul',
    return_out: 'İade Verme',
  };
  return labels[type] || type;
}

/**
 * Check if movement type is inbound (increases stock)
 */
export function isInboundMovement(type: StockMovementType): boolean {
  return ['in', 'transfer_in', 'adjustment_in', 'opening_balance', 'production_in', 'return_in'].includes(
    type
  );
}

/**
 * Check if movement type is outbound (decreases stock)
 */
export function isOutboundMovement(type: StockMovementType): boolean {
  return ['out', 'transfer_out', 'adjustment_out', 'wastage', 'production_out', 'return_out'].includes(
    type
  );
}

/**
 * Get movement type color for badges
 */
export function getMovementTypeColor(type: StockMovementType): string {
  if (isInboundMovement(type)) {
    return '#22c55e'; // Green for inbound
  }
  return '#ef4444'; // Red for outbound
}

/**
 * All movement types for selection (manual movements only)
 */
export const MANUAL_MOVEMENT_TYPES: { value: StockMovementType; label: string }[] = [
  { value: 'in', label: 'Giriş' },
  { value: 'out', label: 'Çıkış' },
  { value: 'adjustment_in', label: 'Sayım Fazlası' },
  { value: 'adjustment_out', label: 'Sayım Eksiği' },
  { value: 'opening_balance', label: 'Dönem Başı Devir' },
  { value: 'wastage', label: 'Fire' },
  { value: 'production_in', label: 'Üretimden Giriş' },
  { value: 'production_out', label: 'Üretime Gönderilen' },
  { value: 'return_in', label: 'İade Kabul' },
  { value: 'return_out', label: 'İade Verme' },
];
