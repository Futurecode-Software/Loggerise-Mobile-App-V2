/**
 * Export Warehouse Items API Endpoints
 *
 * İhracat deposu malları API işlemleri.
 * Backend Mobile ExportWarehouseItemController ile uyumlu.
 */

import api, { getErrorMessage } from '../api'

// ─── Tipler ──────────────────────────────────────────────

export interface ExportWarehouseItemLoad {
  id: number
  load_number: string
}

export interface ExportWarehouseItemPosition {
  id: number
  position_number: string
  driver?: { id: number; name: string } | null
  second_driver?: { id: number; name: string } | null
  truck_tractor?: { id: number; plate: string; brand: string; model: string } | null
  trailer?: { id: number; plate: string; brand: string; model: string } | null
}

export interface ExportWarehouseItemCustomer {
  id: number
  name: string
  short_name?: string
}

export interface ExportWarehouseItemWarehouse {
  id: number
  name: string
  code: string
}

export interface ExportWarehouseItemStatusHistory {
  id: number
  old_status: string
  new_status: string
  notes?: string
  changed_by?: number
  user?: { id: number; name: string } | null
  created_at?: string
}

export interface ExportWarehouseItem {
  id: number
  item_number: string
  load_id?: number
  position_id?: number
  export_warehouse_id?: number
  customer_id?: number
  status: string
  description?: string
  customer_reference?: string
  declaration_no?: string
  package_type?: string
  package_count?: number
  gross_weight_kg?: number
  volume_m3?: number
  quantity?: number
  weight?: number
  volume?: number
  expected_arrival_date?: string
  actual_arrival_date?: string
  received_date?: string
  expected_loading_date?: string
  actual_loading_date?: string
  invoice_no?: string
  notes?: string
  load?: ExportWarehouseItemLoad | null
  position?: ExportWarehouseItemPosition | null
  customer?: ExportWarehouseItemCustomer | null
  warehouse?: ExportWarehouseItemWarehouse | null
  status_history?: ExportWarehouseItemStatusHistory[]
  created_by?: number
  created_at?: string
  updated_at?: string
}

export interface ExportWarehouseItemFilters {
  search?: string
  status?: string
  warehouse_id?: number
  position_id?: number
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface Pagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface ExportWarehouseItemFormData {
  load_id: number
  export_warehouse_id: number
  description: string
  package_type: string
  package_count: number
  gross_weight_kg: number
  volume_m3?: number | null
  customer_reference?: string
  invoice_no?: string
  declaration_no?: string
  declaration_date?: string
  notes?: string
  expected_loading_date?: string
}

export interface ExportWarehouseItemUpdateData {
  export_warehouse_id?: number
  description?: string
  package_type?: string
  package_count?: number
  gross_weight_kg?: number
  volume_m3?: number | null
  customer_reference?: string
  invoice_no?: string
  declaration_no?: string
  declaration_date?: string
  notes?: string
  expected_loading_date?: string
}

export interface LoadSearchResult {
  id: number
  load_number: string
  cargo_name?: string | null
  declaration_no?: string
  status?: string
  customer?: { id: number; name: string; short_name?: string } | null
  position?: { id: number; position_number: string; position_type?: string } | null
}

// ─── Paket Tipleri ────────────────────────────────────────

export const PACKAGE_TYPES = [
  { value: 'pallet', label: 'Palet' },
  { value: 'box', label: 'Kutu' },
  { value: 'bag', label: 'Çuval' },
  { value: 'crate', label: 'Kasa' },
  { value: 'drum', label: 'Varil' },
  { value: 'tank', label: 'Depo/Tank' },
  { value: 'container', label: 'Konteyner' },
  { value: 'roll', label: 'Rulo' },
  { value: 'other', label: 'Diğer' },
] as const

export function getPackageTypeLabel(value: string): string {
  return PACKAGE_TYPES.find(t => t.value === value)?.label || value
}

// ─── Durum Bilgileri ──────────────────────────────────────

export const ITEM_STATUSES = [
  { value: 'expected', label: 'Bekleniyor', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
  { value: 'pending_receiving', label: 'Kabul Bekliyor', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { value: 'waiting', label: 'Beklemede', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  { value: 'received', label: 'Teslim Alındı', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  { value: 'ready', label: 'Hazır', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  { value: 'loaded', label: 'Yüklendi', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  { value: 'shipped', label: 'Sevk Edildi', color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.1)' },
] as const

export function getStatusInfo(status: string) {
  return ITEM_STATUSES.find(s => s.value === status) || {
    value: status,
    label: status,
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.1)',
  }
}

// ─── API Response Tipleri ────────────────────────────────

interface ItemsListResponse {
  success: boolean
  data: ExportWarehouseItem[]
  meta: Pagination
}

interface ItemResponse {
  success: boolean
  data: ExportWarehouseItem
  message?: string
}

interface LoadSearchResponse {
  success: boolean
  data: LoadSearchResult
}

// ─── API Fonksiyonları ───────────────────────────────────

/**
 * Mal listesini getir
 */
export async function getExportWarehouseItems(
  filters?: ExportWarehouseItemFilters
): Promise<{
  items: ExportWarehouseItem[]
  pagination: Pagination
}> {
  try {
    const response = await api.get<ItemsListResponse>(
      '/export-warehouse-items',
      { params: filters }
    )
    return {
      items: response.data.data,
      pagination: response.data.meta,
    }
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Tekil mal getir
 */
export async function getExportWarehouseItem(id: number): Promise<ExportWarehouseItem> {
  try {
    const response = await api.get<ItemResponse>(
      `/export-warehouse-items/${id}`
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Yeni mal oluştur
 */
export async function createExportWarehouseItem(
  data: ExportWarehouseItemFormData
): Promise<ExportWarehouseItem> {
  try {
    const response = await api.post<ItemResponse>(
      '/export-warehouse-items',
      data
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Mal güncelle
 */
export async function updateExportWarehouseItem(
  id: number,
  data: ExportWarehouseItemUpdateData
): Promise<ExportWarehouseItem> {
  try {
    const response = await api.put<ItemResponse>(
      `/export-warehouse-items/${id}`,
      data
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Mal sil
 */
export async function deleteExportWarehouseItem(id: number): Promise<void> {
  try {
    await api.delete(`/export-warehouse-items/${id}`)
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Yük numarasıyla ara
 */
export async function searchLoad(loadNumber: string): Promise<LoadSearchResult> {
  try {
    const response = await api.get<LoadSearchResponse>(
      `/export-warehouse-items/search-load/${encodeURIComponent(loadNumber)}`
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Malı hazır işaretle (received → ready)
 */
export async function markItemReady(id: number): Promise<ExportWarehouseItem> {
  try {
    const response = await api.patch<ItemResponse>(
      `/export-warehouse-items/${id}/mark-ready`
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Malı yüklendi işaretle (ready → loaded)
 */
export async function markItemLoaded(id: number): Promise<ExportWarehouseItem> {
  try {
    const response = await api.patch<ItemResponse>(
      `/export-warehouse-items/${id}/mark-loaded`
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Mal durumunu güncelle
 */
export async function updateItemStatus(
  id: number,
  status: string,
  notes?: string
): Promise<ExportWarehouseItem> {
  try {
    const response = await api.patch<ItemResponse>(
      `/export-warehouse-items/${id}/status`,
      { status, notes }
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}
