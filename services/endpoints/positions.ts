/**
 * Positions API Service
 *
 * Handles all position-related API calls for the mobile app.
 */

import api from '../api';

// Position status type
export type PositionStatus = 'active' | 'completed' | 'cancelled';

// Position type
export type PositionType = 'international' | 'domestic' | 'warehouse';

// Vehicle owner type
export type VehicleOwnerType = 'own' | 'rental' | 'subcontractor';

// Vehicle info
export interface Vehicle {
  id: number;
  plate: string;
  brand?: string;
  model?: string;
}

// Driver info
export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
}

// Contact info
export interface Contact {
  id: number;
  name: string;
}

// Position interface
export interface Position {
  id: number;
  trip_id?: number;
  position_type?: PositionType;
  position_number?: string;
  position_order?: number;

  // Vehicle Owner
  vehicle_owner_type?: VehicleOwnerType;
  vehicle_owner_contact_id?: number;
  vehicle_owner_contact?: Contact;

  // Vehicles
  trailer_id?: number;
  trailer?: Vehicle;
  truck_tractor_id?: number;
  truck_tractor?: Vehicle;
  manual_location?: string;

  // Drivers
  driver_id?: number;
  driver?: Driver;
  second_driver_id?: number;
  second_driver?: Driver;

  // Route
  route?: string;
  is_roro?: boolean;
  is_train?: boolean;
  is_mafi?: boolean;
  estimated_arrival_date?: string;
  actual_arrival_date?: string;

  // Status
  status?: PositionStatus;
  is_active: boolean;

  // Garage
  garage_location?: string;
  garage_entry_date?: string;
  garage_exit_date?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// Pagination interface
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

// Filter interface
export interface PositionFilters {
  page?: number;
  per_page?: number;
  search?: string;
  position_type?: PositionType;
  position_number?: string;
  trip_id?: number;
  driver_id?: number;
  vehicle_owner_type?: VehicleOwnerType;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// API Response interface
interface PositionsResponse {
  success: boolean;
  data: {
    positions: Position[];
    pagination: Pagination;
  };
}

/**
 * Get positions list with filters
 */
export async function getPositions(
  filters: PositionFilters = {}
): Promise<{ positions: Position[]; pagination: Pagination }> {
  const response = await api.get<PositionsResponse>('/positions', {
    params: filters,
  });

  if (!response.data.success) {
    throw new Error('Pozisyonlar yüklenemedi');
  }

  return {
    positions: response.data.data.positions,
    pagination: response.data.data.pagination,
  };
}

/**
 * Get position type label
 */
export function getPositionTypeLabel(type?: PositionType): string {
  const labels: Record<PositionType, string> = {
    international: 'Uluslararası',
    domestic: 'Yurtiçi',
    warehouse: 'Depo',
  };
  return type ? labels[type] || type : '-';
}

/**
 * Get vehicle owner type label
 */
export function getVehicleOwnerTypeLabel(type?: VehicleOwnerType): string {
  const labels: Record<VehicleOwnerType, string> = {
    own: 'Öz Mal',
    rental: 'Kiralık',
    subcontractor: 'Taşeron',
  };
  return type ? labels[type] || type : '-';
}

/**
 * Get driver full name
 */
export function getDriverFullName(driver?: Driver): string {
  if (!driver) return '-';
  return `${driver.first_name} ${driver.last_name}`.trim() || '-';
}
