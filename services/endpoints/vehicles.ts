/**
 * Vehicles API Endpoints
 *
 * Handles vehicle (arac) management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Vehicle type enum - web ile aynı
 */
export type VehicleType =
  | 'trailer'
  | 'car'
  | 'minibus'
  | 'bus'
  | 'light_truck'
  | 'truck'
  | 'truck_tractor'
  | 'tractor'
  | 'motorcycle'
  | 'construction_machine'
  | 'van'
  | 'pickup'
  | 'other';

/**
 * Vehicle status enum - web ile aynı
 */
export type VehicleStatus = 'available' | 'in_use' | 'in_maintenance' | 'maintenance' | 'out_of_service';

/**
 * Ownership type enum
 */
export type OwnershipType = 'owned' | 'leased' | 'rented' | 'subcontractor';

/**
 * Vehicle entity - web ile aynı alanlar
 */
export interface Vehicle {
  id: number;
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  model_year?: number;
  vehicle_type: VehicleType;
  vehicle_class?: string;
  vehicle_category?: string;
  commercial_name?: string;
  status: VehicleStatus;
  ownership_type: OwnershipType;
  chassis_number?: string;
  engine_number?: string;
  engine_power?: number;
  wheel_formula?: string;
  color?: string;
  gear_type?: string;
  document_type?: string;
  capacity_tons?: number;
  capacity_m3?: number;
  net_weight?: number;
  max_loaded_weight?: number;
  fuel_type?: string;
  km_counter?: number;
  total_km?: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  insurance_expiry_date?: string;
  inspection_expiry_date?: string;
  description?: string;
  license_info?: string;
  // Ruhsat bilgileri
  registration_serial_no?: string;
  first_registration_date?: string;
  registration_date?: string;
  // Sahiplik bilgileri
  full_name?: string;
  company_name?: string;
  id_or_tax_no?: string;
  notary_name?: string;
  notary_sale_date?: string;
  address?: string;
  // Çekici özel alanları
  euro_norm?: string;
  fuel_capacity?: number;
  has_gps_tracker?: boolean;
  gps_identity_no?: string;
  battery_capacity?: number;
  // Römork özel alanları
  trailer_width?: number;
  trailer_length?: number;
  trailer_height?: number;
  trailer_volume?: number;
  side_door_count?: string;
  has_xl_certificate?: boolean;
  is_double_deck?: boolean;
  has_p400?: boolean;
  has_sliding_curtain?: boolean;
  is_lightweight?: boolean;
  is_train_compatible?: boolean;
  has_tarpaulin?: boolean;
  has_roller?: boolean;
  has_electronic_scale?: boolean;
  // Yurtiçi taşımacılık
  domestic_transport_capable?: boolean;
  domestic_vehicle_class?: string;
  // Eşleştirme
  assignment_vehicle_id?: number;
  assigned_vehicle?: Vehicle;
  sort_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations (loaded on detail)
  insurances?: VehicleInsurance[];
  maintenances?: VehicleMaintenance[];
  inspections?: VehicleInspection[];
  faultReports?: VehicleFaultReport[];
}

/**
 * Vehicle maintenance
 */
export interface VehicleMaintenance {
  id: number;
  vehicle_id: number;
  maintenance_type: string;
  maintenance_date: string;
  km_at_maintenance?: number;
  cost?: number;
  description?: string;
  is_active: boolean;
}

/**
 * Vehicle list filters
 */
export interface VehicleFilters {
  search?: string;
  plate?: string;
  vehicle_type?: VehicleType;
  status?: VehicleStatus;
  ownership_type?: OwnershipType;
  brand?: string;
  model?: string;
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
 * Vehicles list response
 */
interface VehiclesListResponse {
  success: boolean;
  data: {
    vehicles: Vehicle[];
    pagination: Pagination;
  };
}

/**
 * Single vehicle response
 */
interface VehicleResponse {
  success: boolean;
  data: {
    vehicle: Vehicle;
  };
}

/**
 * Create/Update vehicle data
 */
export interface VehicleFormData {
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicle_type: VehicleType;
  status?: VehicleStatus;
  ownership_type?: OwnershipType;
  chassis_number?: string;
  engine_number?: string;
  color?: string;
  capacity_tons?: number;
  capacity_m3?: number;
  fuel_type?: string;
  km_counter?: number;
  description?: string;
  is_active?: boolean;
  document_type?: string;
  gear_type?: string;
  model_year?: string;
  total_km?: string;
  notary_name?: string;
  notary_sale_date?: string;
  license_info?: string;
  full_name?: string;
  company_name?: string;
  id_or_tax_no?: string;
  address?: string;
  sort_order?: string;
}

/**
 * Get vehicles list with optional filters
 */
export async function getVehicles(
  filters?: VehicleFilters
): Promise<{ vehicles: Vehicle[]; pagination: Pagination }> {
  try {
    const response = await api.get<VehiclesListResponse>('/vehicles', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single vehicle by ID
 */
export async function getVehicle(id: number): Promise<Vehicle> {
  try {
    const response = await api.get<VehicleResponse>(`/vehicles/${id}`);
    return response.data.data.vehicle;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new vehicle - uses web endpoint for consistency
 */
export async function createVehicle(data: VehicleFormData): Promise<Vehicle> {
  try {
    // Use the same endpoint as web: POST /filo-yonetimi/araclar
    const response = await api.post<VehicleResponse>('/filo-yonetimi/araclar', data);
    return response.data.data.vehicle;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing vehicle
 */
export async function updateVehicle(
  id: number,
  data: Partial<VehicleFormData>
): Promise<Vehicle> {
  try {
    const response = await api.put<VehicleResponse>(`/vehicles/${id}`, data);
    return response.data.data.vehicle;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete vehicle
 */
export async function deleteVehicle(id: number): Promise<void> {
  try {
    await api.delete(`/vehicles/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get vehicle type label in Turkish
 */
export function getVehicleTypeLabel(type: VehicleType): string {
  const labels: Record<VehicleType, string> = {
    truck: 'Tır/Kamyon',
    trailer: 'Dorse',
    van: 'Kamyonet',
    pickup: 'Pikap',
    car: 'Otomobil',
    minibus: 'Minibüs',
    bus: 'Otobüs',
    light_truck: 'Hafif Kamyon',
    truck_tractor: 'Çekici',
    tractor: 'Traktör',
    motorcycle: 'Motosiklet',
    construction_machine: 'İş Makinesi',
    other: 'Diğer',
  };
  return labels[type] || type;
}

/**
 * Get vehicle status label in Turkish
 */
export function getStatusLabel(status: VehicleStatus): string {
  const labels: Record<VehicleStatus, string> = {
    available: 'Müsait',
    in_use: 'Kullanımda',
    in_maintenance: 'Bakımda',
    maintenance: 'Bakımda',
    out_of_service: 'Hizmet Dışı',
  };
  return labels[status] || status;
}

/**
 * Get vehicle status color
 */
export function getStatusColor(status: VehicleStatus): string {
  const colors: Record<VehicleStatus, string> = {
    available: '#22c55e',
    in_use: '#3b82f6',
    in_maintenance: '#f5a623',
    maintenance: '#f5a623',
    out_of_service: '#ef4444',
  };
  return colors[status] || '#6B7280';
}

/**
 * Vehicle Insurance management
 */

export interface VehicleInsurance {
  id: number;
  vehicle_id: number;
  insurance_type: 'comprehensive' | 'traffic' | 'other';
  policy_number: string;
  insurance_company?: string;
  start_date: string;
  end_date: string;
  insurance_amount?: number;
  currency_type?: string;
  exchange_rate?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create vehicle insurance
 */
export async function createVehicleInsurance(
  vehicleId: number,
  data: Partial<VehicleInsurance>
): Promise<VehicleInsurance> {
  try {
    const response = await api.post<{ success: boolean; data: { insurance: VehicleInsurance } }>(
      `/api/v1/mobile/vehicles/${vehicleId}/insurances`,
      data
    );
    return response.data.data.insurance;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update vehicle insurance
 */
export async function updateVehicleInsurance(
  vehicleId: number,
  insuranceId: number,
  data: Partial<VehicleInsurance>
): Promise<VehicleInsurance> {
  try {
    const response = await api.put<{ success: boolean; data: { insurance: VehicleInsurance } }>(
      `/api/v1/mobile/vehicles/${vehicleId}/insurances/${insuranceId}`,
      data
    );
    return response.data.data.insurance;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete vehicle insurance
 */
export async function deleteVehicleInsurance(vehicleId: number, insuranceId: number): Promise<void> {
  try {
    await api.delete(`/api/v1/mobile/vehicles/${vehicleId}/insurances/${insuranceId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Vehicle Maintenance management
 */

export interface VehicleMaintenance {
  id: number;
  vehicle_id: number;
  maintenance_date: string;
  maintenance_km: number;
  next_maintenance_km: number;
  oil_change?: boolean;
  oil_filter_change?: boolean;
  transmission_oil_change?: boolean;
  antifreeze_added?: boolean;
  tire_alignment?: boolean;
  brake_adjustment?: boolean;
  chassis_lubrication?: boolean;
  air_filter_change?: boolean;
  cooling_system_cleaning?: boolean;
  balance_adjustment?: boolean;
  tire_change?: boolean;
  valve_adjustment?: boolean;
  cost?: number;
  currency_type?: string;
  exchange_rate?: number;
  service_provider?: string;
  other?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create vehicle maintenance
 */
export async function createVehicleMaintenance(
  vehicleId: number,
  data: Partial<VehicleMaintenance>
): Promise<VehicleMaintenance> {
  try {
    const response = await api.post<{ success: boolean; data: { maintenance: VehicleMaintenance } }>(
      `/api/v1/mobile/vehicles/${vehicleId}/maintenances`,
      data
    );
    return response.data.data.maintenance;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update vehicle maintenance
 */
export async function updateVehicleMaintenance(
  vehicleId: number,
  maintenanceId: number,
  data: Partial<VehicleMaintenance>
): Promise<VehicleMaintenance> {
  try {
    const response = await api.put<{ success: boolean; data: { maintenance: VehicleMaintenance } }>(
      `/api/v1/mobile/vehicles/${vehicleId}/maintenances/${maintenanceId}`,
      data
    );
    return response.data.data.maintenance;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete vehicle maintenance
 */
export async function deleteVehicleMaintenance(vehicleId: number, maintenanceId: number): Promise<void> {
  try {
    await api.delete(`/api/v1/mobile/vehicles/${vehicleId}/maintenances/${maintenanceId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Vehicle Inspection management
 */

export interface VehicleInspection {
  id: number;
  vehicle_id: number;
  inspection_date: string;
  next_inspection_date: string;
  inspection_type?: string;
  status?: string;
  result: 'passed' | 'failed' | 'pending';
  fee?: number;
  currency?: string;
  exchange_rate?: number;
  station?: string;
  inspector?: string;
  odometer?: number;
  faults?: string;
  recommendations?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create vehicle inspection
 */
export async function createVehicleInspection(
  vehicleId: number,
  data: Partial<VehicleInspection>
): Promise<VehicleInspection> {
  try {
    const response = await api.post<{ success: boolean; data: { inspection: VehicleInspection } }>(
      `/api/v1/mobile/vehicles/${vehicleId}/inspections`,
      data
    );
    return response.data.data.inspection;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update vehicle inspection
 */
export async function updateVehicleInspection(
  vehicleId: number,
  inspectionId: number,
  data: Partial<VehicleInspection>
): Promise<VehicleInspection> {
  try {
    const response = await api.put<{ success: boolean; data: { inspection: VehicleInspection } }>(
      `/api/v1/mobile/vehicles/${vehicleId}/inspections/${inspectionId}`,
      data
    );
    return response.data.data.inspection;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete vehicle inspection
 */
export async function deleteVehicleInspection(vehicleId: number, inspectionId: number): Promise<void> {
  try {
    await api.delete(`/api/v1/mobile/vehicles/${vehicleId}/inspections/${inspectionId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Vehicle Fault Report management
 */

export interface VehicleFaultReport {
  id: number;
  vehicle_id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  reported_by_employee_id?: number;
  reported_by_user_id?: number;
  assigned_to_user_id?: number;
  reported_at?: string;
  resolved_at?: string;
  estimated_cost?: number;
  estimated_currency?: string;
  estimated_exchange_rate?: number;
  actual_cost?: number;
  actual_currency?: string;
  actual_exchange_rate?: number;
  sort_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create vehicle fault report
 */
export async function createVehicleFaultReport(
  vehicleId: number,
  data: Partial<VehicleFaultReport>
): Promise<VehicleFaultReport> {
  try {
    const response = await api.post<{ success: boolean; data: { fault_report: VehicleFaultReport } }>(
      `/api/v1/mobile/vehicles/${vehicleId}/fault-reports`,
      data
    );
    return response.data.data.fault_report;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update vehicle fault report
 */
export async function updateVehicleFaultReport(
  vehicleId: number,
  faultReportId: number,
  data: Partial<VehicleFaultReport>
): Promise<VehicleFaultReport> {
  try {
    const response = await api.put<{ success: boolean; data: { fault_report: VehicleFaultReport } }>(
      `/api/v1/mobile/vehicles/${vehicleId}/fault-reports/${faultReportId}`,
      data
    );
    return response.data.data.fault_report;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete vehicle fault report
 */
export async function deleteVehicleFaultReport(vehicleId: number, faultReportId: number): Promise<void> {
  try {
    await api.delete(`/api/v1/mobile/vehicles/${vehicleId}/fault-reports/${faultReportId}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get ownership type label in Turkish
 */
export function getOwnershipLabel(type: OwnershipType): string {
  const labels: Record<OwnershipType, string> = {
    owned: 'Özmal',
    leased: 'Kiralama',
    rented: 'Kiralık',
    subcontractor: 'Taşeron',
  };
  return labels[type] || type;
}

