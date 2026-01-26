/**
 * Trips API Service
 *
 * Handles all trip (sefer) related API calls for the mobile app.
 */

import api from '../api';

// Trip status type
export type TripStatus = 'planning' | 'active' | 'completed' | 'cancelled';

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

// Load info
export interface Load {
  id: number;
  load_number: string;
  cargo_name?: string;
  load_type?: string;
  status?: string;
}

// Trip interface
export interface Trip {
  id: number;
  trip_number: string;
  trip_type?: string;
  name?: string;
  description?: string;

  // Route and Transport Type
  route?: string;
  is_roro?: boolean;
  is_train?: boolean;
  is_mafi?: boolean;
  estimated_arrival_date?: string;
  actual_arrival_date?: string;

  // Vehicle Owner Info
  vehicle_owner_type?: VehicleOwnerType;
  vehicle_owner_contact_id?: number;
  vehicle_owner_contact?: Contact;
  rental_invoice_id?: number;
  rental_fee?: number;
  rental_currency?: string;
  rental_exchange_rate?: number;

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

  // Garage Info
  garage_location?: string;
  garage_entry_date?: string;
  garage_exit_date?: string;

  // Border Crossing - Exit
  border_exit_gate?: string;
  border_exit_date?: string;
  border_exit_manifest_no?: string;
  border_exit_manifest_date?: string;

  // Border Crossing - Entry
  border_entry_gate?: string;
  border_entry_date?: string;
  border_entry_manifest_no?: string;
  border_entry_manifest_date?: string;

  // Status and Seal
  status?: TripStatus;
  seal_no?: string;
  sealing_person?: string;

  // Insurance
  insurance_status?: string;
  insurance_date?: string;
  insurance_amount?: number;
  insurance_currency?: string;
  insurance_exchange_rate?: number;

  // Fuel
  current_fuel_liters?: number;
  fuel_added_liters?: number;
  remaining_fuel_liters?: number;
  fuel_consumption_percentage?: number;

  notes?: string;
  sort_order?: number;
  is_active: boolean;

  // Nested resources
  loads?: Load[];

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string;
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
export interface TripFilters {
  page?: number;
  per_page?: number;
  search?: string;
  trip_number?: string;
  status?: TripStatus;
  driver_id?: number;
  vehicle_owner_type?: VehicleOwnerType;
  route?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// API Response interface
interface TripsResponse {
  success: boolean;
  data: {
    trips: Trip[];
    pagination: Pagination;
  };
}

interface TripResponse {
  success: boolean;
  data: {
    trip: Trip;
  };
}

/**
 * Get trips list with filters
 */
export async function getTrips(
  filters: TripFilters = {}
): Promise<{ trips: Trip[]; pagination: Pagination }> {
  const response = await api.get<TripsResponse>('/trips', {
    params: filters,
  });

  if (!response.data.success) {
    throw new Error('Seferler yüklenemedi');
  }

  return {
    trips: response.data.data.trips,
    pagination: response.data.data.pagination,
  };
}

/**
 * Get single trip by ID
 */
export async function getTrip(id: number): Promise<Trip> {
  const response = await api.get<TripResponse>(`/trips/${id}`);

  if (!response.data.success) {
    throw new Error('Sefer detayları yüklenemedi');
  }

  return response.data.data.trip;
}

/**
 * Create new trip
 */
export async function createTrip(data: Partial<Trip>): Promise<Trip> {
  const response = await api.post<TripResponse>('/trips', data);

  if (!response.data.success) {
    throw new Error('Sefer oluşturulamadı');
  }

  return response.data.data.trip;
}

/**
 * Update trip
 */
export async function updateTrip(id: number, data: Partial<Trip>): Promise<Trip> {
  const response = await api.put<TripResponse>(`/trips/${id}`, data);

  if (!response.data.success) {
    throw new Error('Sefer güncellenemedi');
  }

  return response.data.data.trip;
}

/**
 * Delete trip
 */
export async function deleteTrip(id: number): Promise<void> {
  const response = await api.delete(`/trips/${id}`);

  if (!response.data.success) {
    throw new Error('Sefer silinemedi');
  }
}

/**
 * Get trip status label
 */
export function getTripStatusLabel(status?: TripStatus): string {
  const labels: Record<TripStatus, string> = {
    planning: 'Planlama',
    active: 'Aktif',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
  };
  return status ? labels[status] || status : '-';
}

/**
 * Get trip status color
 */
export function getTripStatusColor(status?: TripStatus): string {
  const colors: Record<TripStatus, string> = {
    planning: '#f5a623',
    active: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };
  return status ? colors[status] || '#6B7280' : '#6B7280';
}

/**
 * Get trip status badge variant
 */
export function getTripStatusVariant(status?: TripStatus): 'warning' | 'info' | 'success' | 'destructive' | 'default' {
  const variants: Record<TripStatus, 'warning' | 'info' | 'success' | 'destructive'> = {
    planning: 'warning',
    active: 'info',
    completed: 'success',
    cancelled: 'destructive',
  };
  return status ? variants[status] || 'default' : 'default';
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

/**
 * Get trip type label
 */
export function getTripTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    export: 'İhracat',
    import: 'İthalat',
    mixed: 'Karma',
  };
  return type ? labels[type] || type : '-';
}
