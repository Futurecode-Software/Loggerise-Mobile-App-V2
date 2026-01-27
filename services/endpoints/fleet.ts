/**
 * Fleet Management API Endpoints
 *
 * Handles export planning, vehicle assignments, tire warehouse, and fault reports.
 */

import api, { getErrorMessage } from '../api';
import { Pagination } from './vehicles';
export { Pagination };

/**
 * ==========================================
 * TRACTOR-TRAILER ASSIGNMENTS
 * ==========================================
 */

export interface TractorTrailerAssignment {
  id: number;
  tractor_id: number;
  trailer_id: number;
  is_active: boolean;
  assigned_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  tractor?: {
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
    model_year: number | null;
  };
  trailer?: {
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
    model_year: number | null;
  };
}

export interface TractorTrailerAssignmentFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface TractorTrailerAssignmentFormData {
  tractor_id: number;
  trailer_id: number;
  assigned_at: string;
  notes?: string;
}

export async function getTractorTrailerAssignments(
  filters?: TractorTrailerAssignmentFilters
): Promise<{ assignments: TractorTrailerAssignment[]; pagination: Pagination }> {
  try {
    const response = await api.get<{
      success: boolean;
      data: { assignments: TractorTrailerAssignment[]; pagination: Pagination };
    }>('/filo-yonetimi/cekici-romork-eslestirme', { params: filters });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createTractorTrailerAssignment(
  data: TractorTrailerAssignmentFormData
): Promise<TractorTrailerAssignment> {
  try {
    const response = await api.post<{
      success: boolean;
      data: { assignment: TractorTrailerAssignment };
      message: string;
    }>('/filo-yonetimi/cekici-romork-eslestirme', data);
    return response.data.data.assignment;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateTractorTrailerAssignment(
  id: number,
  data: Partial<TractorTrailerAssignmentFormData> & { is_active: boolean }
): Promise<TractorTrailerAssignment> {
  try {
    const response = await api.put<{
      success: boolean;
      data: { assignment: TractorTrailerAssignment };
      message: string;
    }>(`/filo-yonetimi/cekici-romork-eslestirme/${id}`, data);
    return response.data.data.assignment;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteTractorTrailerAssignment(id: number): Promise<void> {
  try {
    await api.delete(`/filo-yonetimi/cekici-romork-eslestirme/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function toggleTractorTrailerAssignment(id: number): Promise<TractorTrailerAssignment> {
  try {
    const response = await api.post<{
      success: boolean;
      data: { assignment: TractorTrailerAssignment };
      message: string;
    }>(`/filo-yonetimi/cekici-romork-eslestirme/${id}/toggle`);
    return response.data.data.assignment;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * ==========================================
 * DRIVER-TRACTOR ASSIGNMENTS
 * ==========================================
 */

export interface DriverTractorAssignment {
  id: number;
  employee_id: number;
  tractor_id: number;
  is_active: boolean;
  assigned_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    employee_code: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_1: string | null;
  };
  tractor?: {
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
    model_year: number | null;
  };
}

export interface DriverTractorAssignmentFilters {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface DriverTractorAssignmentFormData {
  employee_id: number;
  tractor_id: number;
  assigned_at: string;
  notes?: string;
}

export async function getDriverTractorAssignments(
  filters?: DriverTractorAssignmentFilters
): Promise<{ assignments: DriverTractorAssignment[]; pagination: Pagination }> {
  try {
    const response = await api.get<{
      success: boolean;
      data: { assignments: DriverTractorAssignment[]; pagination: Pagination };
    }>('/filo-yonetimi/surucu-cekici-eslestirme', { params: filters });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createDriverTractorAssignment(
  data: DriverTractorAssignmentFormData
): Promise<DriverTractorAssignment> {
  try {
    const response = await api.post<{
      success: boolean;
      data: { assignment: DriverTractorAssignment };
      message: string;
    }>('/filo-yonetimi/surucu-cekici-eslestirme', data);
    return response.data.data.assignment;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateDriverTractorAssignment(
  id: number,
  data: Partial<DriverTractorAssignmentFormData> & { is_active: boolean }
): Promise<DriverTractorAssignment> {
  try {
    const response = await api.put<{
      success: boolean;
      data: { assignment: DriverTractorAssignment };
      message: string;
    }>(`/filo-yonetimi/surucu-cekici-eslestirme/${id}`, data);
    return response.data.data.assignment;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteDriverTractorAssignment(id: number): Promise<void> {
  try {
    await api.delete(`/filo-yonetimi/surucu-cekici-eslestirme/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function toggleDriverTractorAssignment(id: number): Promise<DriverTractorAssignment> {
  try {
    const response = await api.post<{
      success: boolean;
      data: { assignment: DriverTractorAssignment };
      message: string;
    }>(`/filo-yonetimi/surucu-cekici-eslestirme/${id}/toggle`);
    return response.data.data.assignment;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * ==========================================
 * FAULT REPORTS (Liste Sayfası)
 * ==========================================
 */

export interface FaultReport {
  id: number;
  vehicle_id: number;
  fault_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  description: string;
  reported_by_employee_id: number | null;
  reported_by_user_id: number | null;
  assigned_to_user_id: number | null;
  reported_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
  };
  reported_by_employee?: {
    id: number;
    full_name: string;
  };
  reported_by_user?: {
    id: number;
    name: string;
  };
  assigned_to_user?: {
    id: number;
    name: string;
  };
}

export interface FaultReportFilters {
  search?: string;
  fault_type?: string;
  severity?: string;
  status?: string;
  vehicle_id?: number;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export async function getFaultReports(
  filters?: FaultReportFilters
): Promise<{ fault_reports: FaultReport[]; pagination: Pagination }> {
  try {
    const response = await api.get<{
      success: boolean;
      data: { fault_reports: FaultReport[]; pagination: Pagination };
    }>('/filo-yonetimi/ariza-bildirimleri', { params: filters });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get fault type label in Turkish
 */
export function getFaultTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    engine: 'Motor',
    transmission: 'Şanzıman',
    electrical: 'Elektrik',
    brake: 'Fren',
    suspension: 'Süspansiyon',
    tire: 'Lastik',
    body: 'Kaporta',
    other: 'Diğer',
  };
  return labels[type] || type;
}

/**
 * Get severity label in Turkish
 */
export function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik',
  };
  return labels[severity] || severity;
}

/**
 * Get fault status label in Turkish
 */
export function getFaultStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Beklemede',
    in_progress: 'İşlemde',
    resolved: 'Çözüldü',
    cancelled: 'İptal Edildi',
  };
  return labels[status] || status;
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: '#22c55e',
    medium: '#f5a623',
    high: '#f97316',
    critical: '#ef4444',
  };
  return colors[severity] || '#6B7280';
}

/**
 * Get fault status color
 */
export function getFaultStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#f5a623',
    in_progress: '#3b82f6',
    resolved: '#22c55e',
    cancelled: '#6B7280',
  };
  return colors[status] || '#6B7280';
}
