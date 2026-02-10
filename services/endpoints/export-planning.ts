/**
 * Export Planning API Endpoints
 *
 * İhracat Planlama API işlemleri.
 * Backend ExportPlanningController ile uyumlu.
 */

import api, { getErrorMessage } from '../api'

// =====================================================
// Types
// =====================================================

export type ResourceType = 'driver' | 'second_driver' | 'truck_tractor' | 'trailer'

export interface DriverLicense {
  id: number
  license_class: string
  expiry_date?: string
  is_active: boolean
}

export interface DriverDocument {
  id: number
  document_type: string
  expiry_date?: string
  is_active: boolean
}

export interface PlanningDriver {
  id: number
  employee_code?: string
  first_name: string
  last_name: string
  full_name?: string
  phone_1?: string
  phone_2?: string
  position?: string
  status: boolean
  driver_licenses?: DriverLicense[]
  driver_documents?: DriverDocument[]
  created_at: string
  updated_at: string
}

export interface VehicleInsurance {
  id: number
  insurance_type?: string
  end_date?: string
  is_active: boolean
}

export interface VehicleInspection {
  id: number
  next_inspection_date?: string
  is_active: boolean
}

export interface PlanningVehicle {
  id: number
  plate: string
  brand?: string
  model?: string
  model_year?: number
  vehicle_type: 'truck_tractor' | 'trailer'
  is_active: boolean
  insurances?: VehicleInsurance[]
  inspections?: VehicleInspection[]
  created_at: string
  updated_at: string
}

export interface LoadCustomer {
  id: number
  name: string
  short_name?: string
}

export interface LoadItem {
  id: number
  cargo_name?: string
  package_count?: number
  gross_weight?: number
  volume?: number
  package_type?: string
}

export interface PositionLoad {
  id: number
  load_number?: string
  customer_id?: number
  customer?: LoadCustomer
  items?: LoadItem[]
}

export interface PlanningPosition {
  id: number
  position_type: 'export' | 'import'
  position_number: string
  position_code?: string
  name?: string
  status?: string
  route?: string
  garage_location?: string
  estimated_arrival_date?: string
  border_exit_gate?: string
  border_entry_gate?: string
  notes?: string
  driver_id?: number
  driver?: PlanningDriver
  second_driver_id?: number
  second_driver?: PlanningDriver
  truck_tractor_id?: number
  truck_tractor?: PlanningVehicle
  trailer_id?: number
  trailer?: PlanningVehicle
  loads?: PositionLoad[]
  loads_count?: number
  sent_to_warehouse_at?: string
  created_at: string
  updated_at: string
}

export interface Pagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number | null
  to: number | null
}

// =====================================================
// Response Types
// =====================================================

interface PositionsListResponse {
  success: boolean
  data: {
    positions: PlanningPosition[]
    pagination: Pagination
  }
}

interface AssignResponse {
  success: boolean
  message: string
  data: {
    position: PlanningPosition
  }
}

interface SendToWarehouseResponse {
  success: boolean
  message: string
  data: {
    position: PlanningPosition
  }
}

interface SearchDriversResponse {
  success: boolean
  data: {
    drivers: PlanningDriver[]
  }
}

interface SearchVehiclesResponse {
  success: boolean
  data: {
    vehicles: PlanningVehicle[]
  }
}

// =====================================================
// API Functions
// =====================================================

/**
 * İhracat planlama pozisyon listesi
 */
export async function getExportPlanningPositions(
  page: number = 1,
  perPage: number = 15
): Promise<{ positions: PlanningPosition[]; pagination: Pagination }> {
  try {
    const response = await api.get<PositionsListResponse>('/filo-yonetimi/ihracat-planlama', {
      params: { page, per_page: perPage }
    })
    return {
      positions: response.data.data.positions,
      pagination: response.data.data.pagination
    }
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Pozisyona kaynak ata (sürücü/araç)
 */
export async function assignResource(
  positionId: number,
  resourceType: ResourceType,
  resourceId: number
): Promise<PlanningPosition> {
  try {
    const response = await api.post<AssignResponse>(
      `/filo-yonetimi/ihracat-planlama/${positionId}/ata`,
      { resource_type: resourceType, resource_id: resourceId }
    )
    return response.data.data.position
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Pozisyondan kaynak çıkar
 */
export async function unassignResource(
  positionId: number,
  resourceType: ResourceType
): Promise<PlanningPosition> {
  try {
    const response = await api.post<AssignResponse>(
      `/filo-yonetimi/ihracat-planlama/${positionId}/cikar`,
      { resource_type: resourceType }
    )
    return response.data.data.position
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Pozisyonu depoya gönder
 */
export async function sendToWarehouse(
  positionId: number
): Promise<PlanningPosition> {
  try {
    const response = await api.post<SendToWarehouseResponse>(
      `/filo-yonetimi/ihracat-planlama/${positionId}/depoya-gonder`
    )
    return response.data.data.position
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Sürücü ara
 */
export async function searchDrivers(
  search: string = ''
): Promise<PlanningDriver[]> {
  try {
    const response = await api.get<SearchDriversResponse>(
      '/filo-yonetimi/ihracat-planlama/ara/surucu',
      { params: { search } }
    )
    return response.data.data.drivers
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Araç ara (çekici veya römork)
 */
export async function searchVehicles(
  search: string = '',
  vehicleType?: 'truck_tractor' | 'trailer'
): Promise<PlanningVehicle[]> {
  try {
    const response = await api.get<SearchVehiclesResponse>(
      '/filo-yonetimi/ihracat-planlama/ara/arac',
      { params: { search, vehicle_type: vehicleType } }
    )
    return response.data.data.vehicles
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

// =====================================================
// Helpers
// =====================================================

/**
 * Sürücü tam adını döndür
 */
export function getDriverFullName(driver: PlanningDriver): string {
  if (driver.full_name) return driver.full_name
  return `${driver.first_name} ${driver.last_name}`.trim()
}

/**
 * Araç bilgisini döndür (Plaka - Marka Model)
 */
export function getVehicleLabel(vehicle: PlanningVehicle): string {
  const parts = [vehicle.plate]
  if (vehicle.brand) parts.push(vehicle.brand)
  if (vehicle.model) parts.push(vehicle.model)
  return parts.join(' - ')
}

/**
 * Pozisyon atama durumu
 */
export function getAssignmentStatus(position: PlanningPosition): {
  driverAssigned: boolean
  truckAssigned: boolean
  trailerAssigned: boolean
  allAssigned: boolean
  assignedCount: number
} {
  const driverAssigned = !!position.driver_id
  const truckAssigned = !!position.truck_tractor_id
  const trailerAssigned = !!position.trailer_id
  const assignedCount = [driverAssigned, truckAssigned, trailerAssigned].filter(Boolean).length

  return {
    driverAssigned,
    truckAssigned,
    trailerAssigned,
    allAssigned: assignedCount === 3,
    assignedCount
  }
}
