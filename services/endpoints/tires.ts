/**
 * Tires API Endpoints
 *
 * Handles tire warehouse (lastik deposu) management operations.
 */

import api, { getErrorMessage } from '../api';
import { Pagination } from './vehicles';

/**
 * Tire status enum
 */
export type TireStatus = 'in_stock' | 'assigned' | 'maintenance' | 'retired';

/**
 * Tire condition enum
 */
export type TireCondition = 'new' | 'good' | 'fair' | 'worn' | 'damaged';

/**
 * Tire type enum
 */
export type TireType = 'summer' | 'winter' | 'all_season' | 'off_road';

/**
 * Tire entity
 */
export interface Tire {
  id: number;
  serial_number: string;
  brand: string;
  model: string | null;
  size: string;
  tire_type: TireType;
  dot_code: string | null;
  production_year: number | null;
  production_week: number | null;
  status: TireStatus;
  condition: TireCondition;
  tread_depth: number | null;
  pressure: number | null;
  warehouse_location: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  currency_type: string | null;
  exchange_rate: number | null;
  km_at_assignment: number | null;
  total_km_used: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  current_assignment?: VehicleTireAssignment;
  assignments?: VehicleTireAssignment[];
  maintenance_records?: TireMaintenanceRecord[];
}

/**
 * Vehicle tire assignment
 */
export interface VehicleTireAssignment {
  id: number;
  tire_id: number;
  vehicle_id: number;
  position: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  km_at_assignment: number | null;
  km_at_unassignment: number | null;
  notes: string | null;
  is_active: boolean;
  vehicle?: {
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
    total_km: number | null;
  };
}

/**
 * Tire maintenance record
 */
export interface TireMaintenanceRecord {
  id: number;
  tire_id: number;
  maintenance_type: string;
  maintenance_date: string;
  cost: number | null;
  currency_type: string | null;
  exchange_rate: number | null;
  description: string | null;
  performed_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Tire list filters
 */
export interface TireFilters {
  search?: string;
  status?: TireStatus;
  condition?: TireCondition;
  tire_type?: TireType;
  warehouse_location?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Tire form data
 */
export interface TireFormData {
  serial_number: string;
  brand: string;
  model?: string;
  size: string;
  tire_type: TireType;
  dot_code?: string;
  production_year?: number;
  production_week?: number;
  status?: TireStatus;
  condition?: TireCondition;
  tread_depth?: number;
  pressure?: number;
  warehouse_location?: string;
  purchase_date?: string;
  purchase_price?: number;
  currency_type?: string;
  notes?: string;
  is_active?: boolean;
}

/**
 * Get tires list with optional filters
 */
export async function getTires(
  filters?: TireFilters
): Promise<{ tires: Tire[]; pagination: Pagination }> {
  try {
    const response = await api.get<{
      success: boolean;
      data: { tires: Tire[]; pagination: Pagination };
    }>('/filo-yonetimi/lastik-deposu', { params: filters });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get single tire by ID
 */
export async function getTire(id: number): Promise<Tire> {
  try {
    const response = await api.get<{
      success: boolean;
      data: { tire: Tire };
    }>(`/filo-yonetimi/lastik-deposu/${id}`);
    return response.data.data.tire;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Create new tire
 */
export async function createTire(data: TireFormData): Promise<Tire> {
  try {
    const response = await api.post<{
      success: boolean;
      data: { tire: Tire };
      message: string;
    }>('/filo-yonetimi/lastik-deposu', data);
    return response.data.data.tire;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update existing tire
 */
export async function updateTire(id: number, data: Partial<TireFormData>): Promise<Tire> {
  try {
    const response = await api.put<{
      success: boolean;
      data: { tire: Tire };
      message: string;
    }>(`/filo-yonetimi/lastik-deposu/${id}`, data);
    return response.data.data.tire;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Delete tire
 */
export async function deleteTire(id: number): Promise<void> {
  try {
    await api.delete(`/filo-yonetimi/lastik-deposu/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Assign tire to vehicle
 */
export async function assignTire(
  tireId: number,
  data: {
    vehicle_id: number;
    position?: string;
    assigned_at: string;
    km_at_assignment?: number;
    notes?: string;
  }
): Promise<VehicleTireAssignment> {
  try {
    const response = await api.post<{
      success: boolean;
      data: { assignment: VehicleTireAssignment };
      message: string;
    }>(`/filo-yonetimi/lastik-deposu/${tireId}/ata`, data);
    return response.data.data.assignment;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Unassign tire from vehicle
 */
export async function unassignTire(
  tireId: number,
  data: {
    unassigned_at: string;
    km_at_unassignment?: number;
    notes?: string;
  }
): Promise<void> {
  try {
    await api.post(`/filo-yonetimi/lastik-deposu/${tireId}/cikar`, data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get tire status label in Turkish
 */
export function getTireStatusLabel(status: TireStatus): string {
  const labels: Record<TireStatus, string> = {
    in_stock: 'Depoda',
    assigned: 'Araçta',
    maintenance: 'Bakımda',
    retired: 'Kullanım Dışı',
  };
  return labels[status] || status;
}

/**
 * Get tire condition label in Turkish
 */
export function getTireConditionLabel(condition: TireCondition): string {
  const labels: Record<TireCondition, string> = {
    new: 'Yeni',
    good: 'İyi',
    fair: 'Orta',
    worn: 'Aşınmış',
    damaged: 'Hasarlı',
  };
  return labels[condition] || condition;
}

/**
 * Get tire type label in Turkish
 */
export function getTireTypeLabel(type: TireType): string {
  const labels: Record<TireType, string> = {
    summer: 'Yaz Lastiği',
    winter: 'Kış Lastiği',
    all_season: 'Dört Mevsim',
    off_road: 'Arazi',
  };
  return labels[type] || type;
}

/**
 * Get tire status color
 */
export function getTireStatusColor(status: TireStatus): string {
  const colors: Record<TireStatus, string> = {
    in_stock: '#22c55e',
    assigned: '#3b82f6',
    maintenance: '#f5a623',
    retired: '#6B7280',
  };
  return colors[status] || '#6B7280';
}

/**
 * Get tire condition color
 */
export function getTireConditionColor(condition: TireCondition): string {
  const colors: Record<TireCondition, string> = {
    new: '#22c55e',
    good: '#3b82f6',
    fair: '#f5a623',
    worn: '#f97316',
    damaged: '#ef4444',
  };
  return colors[condition] || '#6B7280';
}

/**
 * Create tire maintenance record
 */
export async function createTireMaintenance(
  tireId: number,
  data: Partial<TireMaintenanceRecord>
): Promise<TireMaintenanceRecord> {
  try {
    const response = await api.post<{
      success: boolean;
      data: { maintenance: TireMaintenanceRecord };
      message: string;
    }>(`/filo-yonetimi/lastik-deposu/${tireId}/bakimlar`, data);
    return response.data.data.maintenance;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update tire maintenance record
 */
export async function updateTireMaintenance(
  tireId: number,
  maintenanceId: number,
  data: Partial<TireMaintenanceRecord>
): Promise<TireMaintenanceRecord> {
  try {
    const response = await api.put<{
      success: boolean;
      data: { maintenance: TireMaintenanceRecord };
      message: string;
    }>(`/filo-yonetimi/lastik-deposu/${tireId}/bakimlar/${maintenanceId}`, data);
    return response.data.data.maintenance;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Delete tire maintenance record
 */
export async function deleteTireMaintenance(tireId: number, maintenanceId: number): Promise<void> {
  try {
    await api.delete(`/filo-yonetimi/lastik-deposu/${tireId}/bakimlar/${maintenanceId}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
