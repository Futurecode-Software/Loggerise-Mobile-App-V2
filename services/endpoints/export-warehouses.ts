/**
 * Export Warehouses API Endpoints
 *
 * İhracat deposu yönetimi API işlemleri.
 * Backend ExportWarehouseController ile uyumlu.
 */

import api, { getErrorMessage } from '../api'

/**
 * İhracat deposu entity
 */
export interface ExportWarehouse {
  id: number
  code: string
  name: string
  address?: string
  contact_person?: string
  phone?: string
  is_active: boolean
  country?: { id: number; name: string } | null
  state?: { id: number; name: string } | null
  city?: { id: number; name: string } | null
  items_count?: number
  items?: ExportWarehouseItem[]
  created_at?: string
  updated_at?: string
}

/**
 * İhracat deposu malı entity
 */
export interface ExportWarehouseItem {
  id: number
  export_warehouse_id?: number
  position_id?: number
  load_id?: number
  status: string
  description?: string
  quantity?: number
  weight?: number
  load?: { id: number; load_number: string } | null
  position?: { id: number; position_number: string } | null
  customer?: { id: number; name: string; short_name?: string } | null
  warehouse?: { id: number; name: string; code: string } | null
  created_at?: string
  updated_at?: string
}

/**
 * İhracat deposu liste filtreleri
 */
export interface ExportWarehouseFilters {
  search?: string
  status?: boolean
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Sayfalama bilgisi
 */
export interface Pagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

/**
 * İstatistikler
 */
export interface ExportWarehouseStats {
  total_items: number
  items_received: number
  items_ready: number
  items_loaded: number
  total_warehouses: number
  active_warehouses: number
}

/**
 * Liste response
 */
interface ExportWarehousesListResponse {
  success: boolean
  data: ExportWarehouse[]
  stats: ExportWarehouseStats
  meta: Pagination
}

/**
 * Tekil response
 */
interface ExportWarehouseResponse {
  success: boolean
  data: ExportWarehouse
}

/**
 * Form verisi
 */
export interface ExportWarehouseFormData {
  code: string
  name: string
  address?: string
  country_id?: number | null
  state_id?: number | null
  city_id?: number | null
  total_capacity?: number | null
  total_area_m2?: number | null
  contact_person?: string
  phone?: string
  is_active?: boolean
}

/**
 * İhracat deposu listesini getir
 */
export async function getExportWarehouses(
  filters?: ExportWarehouseFilters
): Promise<{
  warehouses: ExportWarehouse[]
  pagination: Pagination
  stats: ExportWarehouseStats
}> {
  try {
    const response = await api.get<ExportWarehousesListResponse>(
      '/export-warehouses',
      { params: filters }
    )
    return {
      warehouses: response.data.data,
      pagination: response.data.meta,
      stats: response.data.stats,
    }
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Tekil ihracat deposu getir
 */
export async function getExportWarehouse(id: number): Promise<ExportWarehouse> {
  try {
    const response = await api.get<ExportWarehouseResponse>(
      `/export-warehouses/${id}`
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Yeni ihracat deposu oluştur
 */
export async function createExportWarehouse(
  data: ExportWarehouseFormData
): Promise<ExportWarehouse> {
  try {
    const response = await api.post<ExportWarehouseResponse>(
      '/export-warehouses',
      data
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * İhracat deposu güncelle
 */
export async function updateExportWarehouse(
  id: number,
  data: Partial<ExportWarehouseFormData>
): Promise<ExportWarehouse> {
  try {
    const response = await api.put<ExportWarehouseResponse>(
      `/export-warehouses/${id}`,
      data
    )
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * İhracat deposu sil
 */
export async function deleteExportWarehouse(id: number): Promise<void> {
  try {
    await api.delete(`/export-warehouses/${id}`)
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * İhracat deposu aktif/pasif toggle
 */
export async function toggleExportWarehouseActive(
  id: number
): Promise<{ is_active: boolean }> {
  try {
    const response = await api.patch<{
      success: boolean
      data: { is_active: boolean }
    }>(`/export-warehouses/${id}/toggle-active`)
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}
