/**
 * Loads API Endpoints
 *
 * Handles load (yuk) management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Load status enum
 */
export type LoadStatus =
  | 'pending'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'completed'
  | 'in_progress'
  | 'loading'
  | 'assigned'
  | 'loaded'
  | 'at_customs';

/**
 * Load type enum - Backend compatible
 */
export type LoadType = 'full' | 'partial';

/**
 * Load direction enum
 */
export type LoadDirection = 'import' | 'export';

/**
 * Load address type enum - Backend compatible
 */
export type LoadAddressType = 'pickup' | 'delivery';

/**
 * Load entity
 */
export interface Load {
  id: number;
  load_number: string;
  cargo_name?: string;
  cargo_name_foreign?: string;
  direction?: LoadDirection | null;
  status: LoadStatus;
  load_type?: LoadType;
  vehicle_type?: string;
  loading_type?: string;
  transport_speed?: string;
  cargo_class?: string;
  customer_id?: number;
  customer?: {
    id: number;
    code?: string;
    name: string;
  };
  sender_company_id?: number;
  sender_company?: {
    id: number;
    code?: string;
    name: string;
  };
  receiver_company_id?: number;
  receiver_company?: {
    id: number;
    code?: string;
    name: string;
  };
  manufacturer_company_id?: number;
  manufacturer_company?: {
    id: number;
    code?: string;
    name: string;
  };
  freight_fee?: number;
  freight_fee_currency?: string;
  freight_fee_exchange_rate?: number;
  // Beyanname bilgileri
  declaration_no?: string;
  declaration_submission_date?: string;
  declaration_ready_date?: string;
  declaration_inspection_date?: string;
  declaration_clearance_date?: string;
  // Fatura bilgileri
  cargo_invoice_no?: string;
  cargo_invoice_date?: string;
  // Mal bedeli
  estimated_cargo_value?: number;
  estimated_value_currency?: string;
  estimated_value_exchange_rate?: number;
  // Diğer bilgiler
  delivery_terms?: string;
  gtip_hs_code?: string;
  atr_no?: string;
  regime_no?: string;
  // Belge durumları
  invoice_document?: string;
  atr_document?: string;
  packing_list_document?: string;
  origin_certificate_document?: string;
  health_certificate_document?: string;
  eur1_document?: string;
  t1_t2_document?: string;
  sort_order?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

/**
 * Load with details (items and addresses)
 */
export interface LoadDetail extends Load {
  items: LoadItem[];
  addresses: LoadAddress[];
  pricing_items?: LoadPricingItem[];
}

/**
 * Load item (package/piece info)
 */
export interface LoadItem {
  id?: number;
  load_id?: number;
  cargo_name?: string;
  cargo_name_foreign?: string;
  package_type?: string;
  package_count?: number;
  piece_count?: number;
  gross_weight?: number;
  net_weight?: number;
  volumetric_weight?: number;
  lademetre_weight?: number;
  total_chargeable_weight?: number;
  width?: number;
  height?: number;
  length?: number;
  volume?: number;
  lademetre?: number;
  is_stackable?: boolean;
  stackable_rows?: number | null;
  is_hazardous?: boolean;
  hazmat_un_no?: string;
  hazmat_class?: string;
  hazmat_page_no?: string;
  hazmat_packing_group?: string;
  hazmat_flash_point?: string;
  hazmat_description?: string;
  sort_order?: number;
  is_active?: boolean;
}

/**
 * Load address (loading/unloading points)
 */
export interface LoadAddress {
  id: number;
  load_id: number;
  type: LoadAddressType;
  sort_order?: number | null;
  is_active?: boolean;
  // Geocoding
  latitude?: number;
  longitude?: number;
  geocoding_status?: string;
  // Pickup type
  pickup_type?: string | null;
  // Loading info
  loading_company_id?: number | null;
  loadingCompany?: { id: number; name: string };
  loading_location_id?: number | null;
  loadingLocation?: {
    id: number;
    title?: string;
    address?: string;
    city?: { id: number; name: string };
    state?: { id: number; name: string };
    country?: { id: number; name: string };
  };
  expected_loading_entry_date?: string;
  loading_entry_date?: string;
  loading_exit_date?: string;
  // Domestic warehouse
  domestic_warehouse_id?: number | null;
  domesticWarehouse?: {
    id: number;
    name?: string;
    code?: string;
    address?: string;
  };
  domestic_warehouse_expected_entry_date?: string;
  domestic_warehouse_expected_exit_date?: string;
  domestic_warehouse_entry_date?: string;
  domestic_warehouse_exit_date?: string;
  // Domestic customs
  domestic_customs_company_id?: number | null;
  domesticCustomsCompany?: { id: number; name: string };
  domestic_customs_location_id?: number | null;
  domesticCustomsLocation?: {
    id: number;
    title?: string;
    address?: string;
  };
  expected_domestic_customs_entry_date?: string;
  domestic_customs_date?: string;
  domestic_customs_entry_date?: string;
  domestic_customs_exit_date?: string;
  // Delivery type
  delivery_type?: string | null;
  // International customs
  intl_customs_company_id?: number | null;
  intlCustomsCompany?: { id: number; name: string };
  t1_number?: string;
  intl_customs_location_id?: number | null;
  intlCustomsLocation?: {
    id: number;
    title?: string;
    address?: string;
  };
  receiver_customs_location_id?: number | null;
  receiverCustomsLocation?: {
    id: number;
    title?: string;
    address?: string;
  };
  expected_intl_customs_entry_date?: string;
  intl_customs_entry_date?: string;
  intl_customs_exit_date?: string;
  // Unloading
  unloading_company_id?: number | null;
  unloadingCompany?: { id: number; name: string };
  unloading_location_id?: number | null;
  unloadingLocation?: {
    id: number;
    title?: string;
    address?: string;
    city?: { id: number; name: string };
    state?: { id: number; name: string };
    country?: { id: number; name: string };
  };
  destination_country_id?: number | null;
  destinationCountry?: { id: number; name: string };
  expected_unloading_entry_date?: string;
  unloading_arrival_date?: string;
  unloading_entry_date?: string;
  unloading_exit_date?: string;
  // International warehouse
  intl_warehouse_id?: number | null;
  intlWarehouse?: {
    id: number;
    name?: string;
    code?: string;
    address?: string;
  };
  intl_warehouse_entry_date?: string;
  intl_warehouse_exit_date?: string;
}

/**
 * Load list filters
 */
export interface LoadFilters {
  search?: string;
  load_number?: string;
  customer_id?: number;
  status?: LoadStatus;
  load_type?: LoadType;
  direction?: 'import' | 'export';
  cargo_name?: string;
  is_active?: boolean;
  assigned_to_trip?: 'assigned' | 'not_assigned' | 'all';
  date_from?: string;
  date_to?: string;
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
 * Loads list response
 */
interface LoadsListResponse {
  success: boolean;
  data: {
    loads: Load[];
    pagination: Pagination;
  };
}

/**
 * Single load response
 */
interface LoadResponse {
  success: boolean;
  data: {
    load: LoadDetail;
  };
}

/**
 * Delete response
 */
interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Get loads list with optional filters
 */
export async function getLoads(
  filters?: LoadFilters
): Promise<{ loads: Load[]; pagination: Pagination }> {
  try {
    const response = await api.get<LoadsListResponse>('/loads', {
      params: filters,
    });
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single load by ID
 */
export async function getLoad(id: number): Promise<LoadDetail> {
  try {
    const response = await api.get<LoadResponse>(`/loads/${id}`);
    return response.data.data.load;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete load by ID
 */
export async function deleteLoad(id: number): Promise<void> {
  try {
    await api.delete<DeleteResponse>(`/loads/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Load pricing item for create/update
 */
export interface LoadPricingItem {
  id?: number;
  load_id?: number;
  product_id?: number;
  description?: string;
  quantity: string;
  unit: string;
  unit_price: string;
  currency: string;
  exchange_rate: string;
  vat_rate: string;
  vat_amount: string;
  discount_rate: string;
  discount_amount: string;
  sub_total: string;
  total: string;
  sort_order?: number;
  is_active?: boolean;
  product?: { id: number; name: string; code?: string };
}

/**
 * Load form data for create/update - Web ile %100 uyumlu
 */
export interface LoadFormData {
  cargo_name?: string;
  cargo_name_foreign?: string;
  direction?: 'import' | 'export';
  vehicle_type?: string;
  loading_type?: string;
  transport_speed?: string;
  cargo_class?: string;
  load_type?: LoadType;
  status?: string;
  customer_id?: number;
  sender_company_id?: number;
  manufacturer_company_id?: number;
  receiver_company_id?: number;
  freight_fee?: number;
  freight_fee_currency?: string;
  freight_fee_exchange_rate?: number;
  // Beyanname bilgileri
  declaration_no?: string;
  declaration_submission_date?: string;
  declaration_acceptance_date?: string;
  declaration_closing_date?: string;
  declaration_ready_date?: string;
  declaration_inspection_date?: string;
  declaration_clearance_date?: string;
  customs_reference_no?: string;
  // Fatura bilgileri
  cargo_invoice_no?: string;
  cargo_invoice_date?: string;
  invoice_date?: string;
  // Mal bedeli
  estimated_cargo_value?: string;
  estimated_value_currency?: string;
  estimated_value_exchange_rate?: string;
  exchange_rate?: string;
  // Teslim şekilleri ve ödeme
  delivery_terms?: string;
  payment_method?: string;
  // Gümrük bilgileri
  gtip_hs_code?: string;
  atr_no?: string;
  eur1_no?: string;
  regime_no?: string;
  t1_t2_no?: string;
  // Belge durumları
  invoice_document?: string;
  atr_document?: string;
  packing_list_document?: string;
  origin_certificate_document?: string;
  health_certificate_document?: string;
  eur1_document?: string;
  t1_t2_document?: string;
  // Notlar
  customs_notes?: string;
  notes?: string;
  // Diğer
  publish_to_pool?: boolean;
  is_active: boolean;
  items?: Omit<LoadItem, 'id' | 'load_id'>[] | LoadItem[];
  addresses?: Partial<LoadAddress>[];
  pricing_items?: Partial<LoadPricingItem>[] | LoadPricingItem[];
}

/**
 * Address verisini backend'e göndermeden önce temizle
 * - İlişki nesnelerini (loadingCompany vb.) kaldır
 * - Boş string tarihleri null'a çevir
 * - Sadece backend validation'da tanımlı alanları gönder
 */
export function cleanAddressForSubmit(addr: Partial<LoadAddress> & { id?: number }): Record<string, unknown> {
  const cleanDate = (val: unknown) => (val && val !== '' ? val : null)

  return {
    ...(addr.id ? { id: addr.id } : {}),
    type: addr.type,
    pickup_type: addr.pickup_type || null,
    delivery_type: addr.delivery_type || null,
    loading_company_id: addr.loading_company_id || null,
    loading_location_id: addr.loading_location_id || null,
    domestic_warehouse_id: addr.domestic_warehouse_id || null,
    domestic_customs_company_id: addr.domestic_customs_company_id || null,
    domestic_customs_location_id: addr.domestic_customs_location_id || null,
    intl_customs_company_id: addr.intl_customs_company_id || null,
    intl_customs_location_id: addr.intl_customs_location_id || null,
    receiver_customs_location_id: addr.receiver_customs_location_id || null,
    unloading_company_id: addr.unloading_company_id || null,
    unloading_location_id: addr.unloading_location_id || null,
    intl_warehouse_id: addr.intl_warehouse_id || null,
    destination_country_id: addr.destination_country_id || null,
    sort_order: addr.sort_order ?? 0,
    is_active: addr.is_active !== false,
    // Tarih alanları - boş string → null
    expected_loading_entry_date: cleanDate(addr.expected_loading_entry_date),
    loading_entry_date: cleanDate(addr.loading_entry_date),
    loading_exit_date: cleanDate(addr.loading_exit_date),
    domestic_warehouse_expected_entry_date: cleanDate(addr.domestic_warehouse_expected_entry_date),
    domestic_warehouse_expected_exit_date: cleanDate(addr.domestic_warehouse_expected_exit_date),
    domestic_warehouse_entry_date: cleanDate(addr.domestic_warehouse_entry_date),
    domestic_warehouse_exit_date: cleanDate(addr.domestic_warehouse_exit_date),
    expected_domestic_customs_entry_date: cleanDate(addr.expected_domestic_customs_entry_date),
    domestic_customs_date: cleanDate((addr as any).domestic_customs_date),
    domestic_customs_entry_date: cleanDate(addr.domestic_customs_entry_date),
    domestic_customs_exit_date: cleanDate(addr.domestic_customs_exit_date),
    expected_intl_customs_entry_date: cleanDate(addr.expected_intl_customs_entry_date),
    intl_customs_entry_date: cleanDate(addr.intl_customs_entry_date),
    intl_customs_exit_date: cleanDate(addr.intl_customs_exit_date),
    expected_unloading_entry_date: cleanDate(addr.expected_unloading_entry_date),
    unloading_entry_date: cleanDate(addr.unloading_entry_date),
    unloading_exit_date: cleanDate(addr.unloading_exit_date),
    intl_warehouse_entry_date: cleanDate(addr.intl_warehouse_entry_date),
    intl_warehouse_exit_date: cleanDate(addr.intl_warehouse_exit_date),
    // Boolean bayraklar
    mahrece_iade: addr.mahrece_iade || false,
    kirmizi_beyanname: addr.kirmizi_beyanname || false,
    beyanname_acildi: addr.beyanname_acildi || false,
    talimat_geldi: addr.talimat_geldi || false,
    serbest_bolge: addr.serbest_bolge || false,
    transit: addr.transit || false,
    yys_sahip: addr.yys_sahip || false,
    mavi_hat: addr.mavi_hat || false,
    police: addr.police || false,
  }
}

/**
 * Hata response'unu güvenli şekilde parse et
 * React Native'de response data bazen string olarak gelebilir
 */
function parseErrorResponse(error: any): { errors?: Record<string, string[]>, message?: string } {
  let data = error?.response?.data
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return {}
    }
  }
  return data || {}
}

/**
 * Update existing load
 */
export async function updateLoad(id: number, data: LoadFormData): Promise<LoadDetail> {
  try {
    if (__DEV__) console.log('[API] Updating load', id)
    const response = await api.put<LoadResponse>(`/loads/${id}`, data)
    return response.data.data.load
  } catch (error: any) {
    if (__DEV__) {
      console.error('[API] Load update failed:', {
        code: error?.code,
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      })
    }
    const parsed = parseErrorResponse(error)
    if (parsed.errors) {
      const firstField = Object.keys(parsed.errors)[0]
      if (firstField) {
        throw new Error(`${firstField}: ${parsed.errors[firstField][0]}`)
      }
    }
    if (parsed.message) {
      throw new Error(parsed.message)
    }
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Create new load
 */
export async function createLoad(data: LoadFormData): Promise<LoadDetail> {
  try {
    if (__DEV__) console.log('[API] Creating load with data:', JSON.stringify(data, null, 2))
    const response = await api.post<LoadResponse>('/loads', data)
    return response.data.data.load
  } catch (error: any) {
    if (__DEV__) console.error('[API] Load creation failed:', error?.response?.data || error)
    const parsed = parseErrorResponse(error)
    if (parsed.errors) {
      const firstField = Object.keys(parsed.errors)[0]
      if (firstField) {
        throw new Error(`${firstField}: ${parsed.errors[firstField][0]}`)
      }
    }
    if (parsed.message) {
      throw new Error(parsed.message)
    }
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Get status label in Turkish
 */
export function getStatusLabel(status?: LoadStatus | string): string {
  if (!status) return '-';
  const labels: Record<string, string> = {
    // Temel status'lar
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    in_transit: 'Yolda',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal',
    // Ek status'lar
    completed: 'Tamamlandı',
    in_progress: 'İşlemde',
    loading: 'Yükleniyor',
    assigned: 'Atandı',
    loaded: 'Yüklendi',
    at_customs: 'Gümrükte',
    // Türkçe status'lar (backend'den gelebilir)
    'Beklemede': 'Beklemede',
    'Hazırlanıyor': 'Hazırlanıyor',
    'Hazır': 'Hazır',
    'Yükleniyor': 'Yükleniyor',
    'Yüklendi': 'Yüklendi',
    'Yolda': 'Yolda',
    'Gümrükte': 'Gümrükte',
    'Boşaltılıyor': 'Boşaltılıyor',
    'Teslim Edildi': 'Teslim Edildi',
    'Tamamlandı': 'Tamamlandı',
    'İptal Edildi': 'İptal Edildi',
    'Beklemede (Sorun)': 'Beklemede (Sorun)',
  };
  return labels[status] || status;
}

/**
 * Get status color
 */
export function getStatusColor(status?: LoadStatus | string): string {
  if (!status) return '#6B7280';
  const colors: Record<string, string> = {
    // Temel status'lar
    pending: '#f5a623',
    confirmed: '#3b82f6',
    in_transit: '#227d53',
    delivered: '#13452d',
    cancelled: '#d0021b',
    // Ek status'lar
    completed: '#13452d',
    in_progress: '#3b82f6',
    loading: '#f5a623',
    assigned: '#3b82f6',
    loaded: '#227d53',
    at_customs: '#f5a623',
    // Türkçe status'lar için renkler
    'Beklemede': '#f5a623',
    'Hazırlanıyor': '#f5a623',
    'Hazır': '#3b82f6',
    'Yükleniyor': '#f5a623',
    'Yüklendi': '#227d53',
    'Yolda': '#227d53',
    'Gümrükte': '#f5a623',
    'Boşaltılıyor': '#3b82f6',
    'Teslim Edildi': '#13452d',
    'Tamamlandı': '#13452d',
    'İptal Edildi': '#d0021b',
    'Beklemede (Sorun)': '#d0021b',
  };
  return colors[status] || '#6B7280';
}

/**
 * Get direction label in Turkish
 */
export function getDirectionLabel(direction?: LoadDirection): string {
  if (!direction) return '-';
  return direction === 'export' ? 'İhracat' : 'İthalat';
}

/**
 * Get direction color
 */
export function getDirectionColor(direction?: LoadDirection): string {
  if (!direction) return '#6B7280';
  return direction === 'export' ? '#227d53' : '#3b82f6';
}

/**
 * Get load type label in Turkish
 */
export function getLoadTypeLabel(loadType?: LoadType): string {
  if (!loadType) return '-';
  const labels: Record<LoadType, string> = {
    full: 'Komple',
    partial: 'Parsiyel',
  };
  return labels[loadType] || loadType;
}

/**
 * Get document status label in Turkish
 */
export function getDocumentStatusLabel(status?: string): string {
  if (!status) return '-';
  const labels: Record<string, string> = {
    none: 'Yok',
    original: 'Orijinal',
    copy: 'Kopya',
    digital: 'Dijital',
  };
  return labels[status] || status;
}
