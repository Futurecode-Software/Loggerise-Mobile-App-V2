/**
 * Positions API Service
 *
 * Handles all position-related API calls for the mobile app.
 */

import api from '../api';

// Position status type
export type PositionStatus = 'active' | 'completed' | 'cancelled' | 'draft';

// Position type
export type PositionType = 'import' | 'export';

// Vehicle owner type
export type VehicleOwnerType = 'own' | 'contract_rental' | 'market_rental' | 'other';

// Insurance status
export type InsuranceStatus = 'done' | 'to_be_done' | 'not_required';

// Deck type
export type DeckType = 'alt_guverte' | 'ust_guverte';

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

// Port info
export interface Port {
  id: number;
  name: string;
  port_code?: string;
}

// Ferry company info
export interface FerryCompany {
  id: number;
  name: string;
  short_code?: string;
}

// Load item
export interface LoadItem {
  id: number;
  load_id: number;
  name: string;
  quantity: number;
  unit: string;
}

// Load address
export interface LoadAddress {
  id: number;
  load_id: number;
  address_type: 'pickup' | 'delivery';
  sort_order: number;
  loading_location_id?: number;
  unloading_location_id?: number;
  address_details?: string;
}

// Load
export interface Load {
  id: number;
  load_number: string;
  customer?: Contact;
  sender_company?: Contact;
  receiver_company?: Contact;
  items?: LoadItem[];
  addresses?: LoadAddress[];
}

// Fuel record
export interface FuelRecord {
  id: number;
  position_id: number;
  date?: string;
  fuel_date?: string;
  station_name?: string;
  liters: number | string;
  price_per_liter?: number | string;
  total_amount?: number | string;
  amount?: number | string;
  currency?: string;
  currency_type?: string;
  notes?: string;
  description?: string;
  fuel_type?: string;
}

// Advance
export interface Advance {
  id: number;
  position_id: number;
  date?: string;
  advance_date?: string;
  employee_id?: number;
  employee?: Driver;
  amount: number | string;
  currency?: string;
  currency_type?: string;
  payment_method?: string;
  description?: string;
}

// Expense
export interface Expense {
  id: number;
  position_id: number;
  date?: string;
  expense_date?: string;
  expense_type: string;
  contact_id?: number;
  contact?: Contact;
  amount: number | string;
  currency?: string;
  currency_type?: string;
  description?: string;
}

// Document
export interface PositionDocument {
  id: number;
  position_id: number;
  load_id?: number;
  file_name: string;
  original_file_name: string;
  file_path: string;
  file_type: string;
  mime_type?: string;
  file_size: number;
  category?: string;
  description?: string;
  document_number?: string;
  document_date?: string;
  created_at: string;
  load?: Load;
}

// Position interface (comprehensive)
export interface Position {
  id: number;
  trip_id?: number;
  position_type: PositionType;
  position_number: string;
  position_order?: number;
  name?: string; // Pozisyon adı

  // Vehicle Owner
  vehicle_owner_type?: VehicleOwnerType;
  vehicle_owner_contact_id?: number;
  vehicle_owner_contact?: Contact;
  vehicleOwnerContact?: Contact; // Alias for camelCase
  rental_invoice_id?: number;
  rentalInvoice?: { id: number; invoice_no: string };
  rental_fee?: number | null;
  rental_currency?: string | null;
  rental_exchange_rate?: number | null;

  // Vehicles
  trailer_id?: number;
  trailer?: Vehicle;
  trailer_class?: string;
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

  // RoRo fields
  departure_port_id?: number;
  arrival_port_id?: number;
  ferry_company_id?: number;
  roro_booking_reference?: string;
  roro_voyage_number?: string;
  roro_cutoff_date?: string;
  roro_departure_date?: string;
  roro_arrival_date?: string;
  roro_deck_type?: DeckType;
  roro_notes?: string;
  roro_country_code?: string;
  roro_ship_name?: string;
  roro_imo_number?: string;
  roro_entry_location?: string;
  roro_expected_entry_date?: string;
  roro_entry_date?: string;
  roro_exit_location?: string;
  roro_expected_exit_date?: string;
  roro_exit_date?: string;
  departurePort?: Port;
  arrivalPort?: Port;
  ferryCompany?: FerryCompany;

  // Train fields
  train_voyage_number?: string;
  train_wagon_number?: string;
  train_departure_terminal?: string;
  train_expected_departure_date?: string;
  train_departure_date?: string;
  train_arrival_terminal?: string;
  train_expected_arrival_date?: string;
  train_arrival_date?: string;
  train_seal_number?: string;

  // Border crossing
  border_exit_gate?: string;
  border_exit_date?: string;
  border_exit_manifest_no?: string;
  border_exit_manifest_date?: string;
  border_entry_gate?: string;
  border_entry_date?: string;
  border_entry_manifest_no?: string;
  border_entry_manifest_date?: string;

  // Seal info
  status?: string;
  seal_no?: string;
  sealing_person?: string;

  // Insurance
  insurance_status?: InsuranceStatus;
  insurance_date?: string;
  insurance_amount?: string;
  insurance_currency?: string;
  insurance_exchange_rate?: string;

  // Fuel
  current_fuel_liters?: string;
  fuel_added_liters?: string;
  remaining_fuel_liters?: string;
  fuel_consumption_percentage?: string;

  // Other
  notes?: string;
  is_active: boolean;

  // Garage
  garage_location?: string;
  garage_entry_date?: string;
  garage_exit_date?: string;

  // Relations
  truckTractor?: Vehicle;
  secondDriver?: Driver;
  loads?: Load[];
  loads_count?: number; // withCount ile gelen yük sayısı
  fuel_records?: FuelRecord[];
  advances?: AdvanceResponse[];
  expenses?: Expense[];
  documents?: PositionDocument[];

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

// API Response interfaces
interface PositionsResponse {
  success: boolean;
  data: {
    positions: Position[];
    pagination: Pagination;
  };
}

interface PositionResponse {
  success: boolean;
  data: {
    position: Position;
  };
}

interface MessageResponse {
  success: boolean;
  message: string;
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
 * Get single position with all relations
 */
export async function getPosition(id: number): Promise<Position> {
  const response = await api.get<PositionResponse>(`/positions/${id}`);

  if (!response.data.success) {
    throw new Error('Pozisyon bilgisi yüklenemedi');
  }

  return response.data.data.position;
}

/**
 * Update position
 */
export async function updatePosition(id: number, data: Partial<Position>): Promise<Position> {
  const response = await api.put<PositionResponse>(`/positions/${id}`, data);

  if (!response.data.success) {
    throw new Error('Pozisyon güncellenemedi');
  }

  return response.data.data.position;
}

/**
 * Attach load to position
 */
export async function attachLoad(positionId: number, loadId: number): Promise<void> {
  const response = await api.post<MessageResponse>(`/positions/${positionId}/attach-load`, {
    load_id: loadId,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Yük eklenemedi');
  }
}

/**
 * Detach load from position
 */
export async function detachLoad(positionId: number, loadId: number): Promise<void> {
  const response = await api.delete<MessageResponse>(
    `/positions/${positionId}/detach-load/${loadId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Yük çıkarılamadı');
  }
}

/**
 * Get position type label
 */
export function getPositionTypeLabel(type?: PositionType): string {
  const labels: Record<PositionType, string> = {
    import: 'İTHALAT',
    export: 'İHRACAT',
  };
  return type ? labels[type] : '-';
}

/**
 * Get vehicle owner type label
 */
export function getVehicleOwnerTypeLabel(type?: VehicleOwnerType): string {
  const labels: Record<VehicleOwnerType, string> = {
    own: 'Özmal',
    contract_rental: 'Sözleşmeli',
    market_rental: 'Piyasa',
    other: 'Diğer',
  };
  return type ? labels[type] : '-';
}

/**
 * Get insurance status label and color
 */
export function getInsuranceStatusLabel(status?: InsuranceStatus): { label: string; variant: 'success' | 'warning' | 'default' } {
  const statuses: Record<InsuranceStatus, { label: string; variant: 'success' | 'warning' | 'default' }> = {
    done: { label: 'Yapıldı', variant: 'success' },
    to_be_done: { label: 'Yapılacak', variant: 'warning' },
    not_required: { label: 'Gerek Yok', variant: 'default' },
  };
  return status ? statuses[status] : { label: '-', variant: 'default' };
}

/**
 * Get deck type label
 */
export function getDeckTypeLabel(type?: DeckType): string {
  const labels: Record<DeckType, string> = {
    alt_guverte: 'Alt Güverte',
    ust_guverte: 'Üst Güverte',
  };
  return type ? labels[type] : '-';
}

/**
 * Get driver full name
 */
export function getDriverFullName(driver?: Driver): string {
  if (!driver) return '-';
  return `${driver.first_name} ${driver.last_name}`.trim() || '-';
}

// ===============================
// FUEL RECORDS CRUD
// ===============================

export interface FuelRecordInput {
  fuel_date: string;
  fuel_type?: string;
  liters: number;
  amount: number;
  currency_type: string;
  exchange_rate?: number;
  description?: string;
  load_id?: number;
}

export interface FuelRecordResponse {
  id: number;
  position_id: number;
  load_id?: number;
  fuel_date: string;
  fuel_type?: string;
  liters: string;
  amount: string;
  currency_type: string;
  exchange_rate: string;
  base_amount: string;
  description?: string;
  load?: Load;
}

interface FuelRecordsListResponse {
  success: boolean;
  data: {
    fuel_records: FuelRecordResponse[];
  };
}

interface FuelRecordSingleResponse {
  success: boolean;
  message?: string;
  data: {
    fuel_record: FuelRecordResponse;
  };
}

/**
 * Get fuel records for a position
 */
export async function getFuelRecords(positionId: number): Promise<FuelRecordResponse[]> {
  const response = await api.get<FuelRecordsListResponse>(`/positions/${positionId}/fuel-records`);
  if (!response.data.success) {
    throw new Error('Yakıt kayıtları yüklenemedi');
  }
  return response.data.data.fuel_records;
}

/**
 * Create a fuel record
 */
export async function createFuelRecord(positionId: number, data: FuelRecordInput): Promise<FuelRecordResponse> {
  const response = await api.post<FuelRecordSingleResponse>(`/positions/${positionId}/fuel-records`, data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Yakıt kaydı oluşturulamadı');
  }
  return response.data.data.fuel_record;
}

/**
 * Update a fuel record
 */
export async function updateFuelRecord(positionId: number, recordId: number, data: Partial<FuelRecordInput>): Promise<FuelRecordResponse> {
  const response = await api.put<FuelRecordSingleResponse>(`/positions/${positionId}/fuel-records/${recordId}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Yakıt kaydı güncellenemedi');
  }
  return response.data.data.fuel_record;
}

/**
 * Delete a fuel record
 */
export async function deleteFuelRecord(positionId: number, recordId: number): Promise<void> {
  const response = await api.delete<MessageResponse>(`/positions/${positionId}/fuel-records/${recordId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Yakıt kaydı silinemedi');
  }
}

// ===============================
// ADVANCES CRUD
// ===============================

export interface AdvanceInput {
  advance_date: string;
  payment_method?: string;
  amount: number;
  currency_type: string;
  exchange_rate?: number;
  description?: string;
  employee_id?: number;
  load_id?: number;
}

export interface AdvanceResponse {
  id: number;
  position_id: number;
  load_id?: number;
  employee_id?: number;
  advance_date: string;
  payment_method?: string;
  amount: string;
  currency_type: string;
  exchange_rate: string;
  base_amount: string;
  description?: string;
  employee?: Driver;
  load?: Load;
}

interface AdvancesListResponse {
  success: boolean;
  data: {
    advances: AdvanceResponse[];
  };
}

interface AdvanceSingleResponse {
  success: boolean;
  message?: string;
  data: {
    advance: AdvanceResponse;
  };
}

/**
 * Get advances for a position
 */
export async function getAdvances(positionId: number): Promise<AdvanceResponse[]> {
  const response = await api.get<AdvancesListResponse>(`/positions/${positionId}/advances`);
  if (!response.data.success) {
    throw new Error('Avans kayıtları yüklenemedi');
  }
  return response.data.data.advances;
}

/**
 * Create an advance
 */
export async function createAdvance(positionId: number, data: AdvanceInput): Promise<AdvanceResponse> {
  const response = await api.post<AdvanceSingleResponse>(`/positions/${positionId}/advances`, data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Avans kaydı oluşturulamadı');
  }
  return response.data.data.advance;
}

/**
 * Update an advance
 */
export async function updateAdvance(positionId: number, advanceId: number, data: Partial<AdvanceInput>): Promise<AdvanceResponse> {
  const response = await api.put<AdvanceSingleResponse>(`/positions/${positionId}/advances/${advanceId}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Avans kaydı güncellenemedi');
  }
  return response.data.data.advance;
}

/**
 * Delete an advance
 */
export async function deleteAdvance(positionId: number, advanceId: number): Promise<void> {
  const response = await api.delete<MessageResponse>(`/positions/${positionId}/advances/${advanceId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Avans kaydı silinemedi');
  }
}

// ===============================
// EXPENSES CRUD
// ===============================

export interface ExpenseInput {
  expense_date: string;
  expense_type: string;
  amount: number;
  currency_type: string;
  exchange_rate?: number;
  description?: string;
  contact_id?: number;
  load_id?: number;
}

export interface ExpenseResponse {
  id: number;
  position_id: number;
  load_id?: number;
  contact_id?: number;
  expense_date: string;
  expense_type: string;
  amount: string;
  currency_type: string;
  exchange_rate: string;
  base_amount: string;
  description?: string;
  contact?: Contact;
  load?: Load;
}

interface ExpensesListResponse {
  success: boolean;
  data: {
    expenses: ExpenseResponse[];
  };
}

interface ExpenseSingleResponse {
  success: boolean;
  message?: string;
  data: {
    expense: ExpenseResponse;
  };
}

/**
 * Get expenses for a position
 */
export async function getExpenses(positionId: number): Promise<ExpenseResponse[]> {
  const response = await api.get<ExpensesListResponse>(`/positions/${positionId}/expenses`);
  if (!response.data.success) {
    throw new Error('Masraf kayıtları yüklenemedi');
  }
  return response.data.data.expenses;
}

/**
 * Create an expense
 */
export async function createExpense(positionId: number, data: ExpenseInput): Promise<ExpenseResponse> {
  const response = await api.post<ExpenseSingleResponse>(`/positions/${positionId}/expenses`, data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Masraf kaydı oluşturulamadı');
  }
  return response.data.data.expense;
}

/**
 * Update an expense
 */
export async function updateExpense(positionId: number, expenseId: number, data: Partial<ExpenseInput>): Promise<ExpenseResponse> {
  const response = await api.put<ExpenseSingleResponse>(`/positions/${positionId}/expenses/${expenseId}`, data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Masraf kaydı güncellenemedi');
  }
  return response.data.data.expense;
}

/**
 * Delete an expense
 */
export async function deleteExpense(positionId: number, expenseId: number): Promise<void> {
  const response = await api.delete<MessageResponse>(`/positions/${positionId}/expenses/${expenseId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Masraf kaydı silinemedi');
  }
}

// ===============================
// DOCUMENTS CRUD
// ===============================

export interface DocumentResponse {
  id: number;
  position_id: number;
  load_id?: number;
  file_name: string;
  original_file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type?: string;
  category?: string;
  description?: string;
  document_number?: string;
  document_date?: string;
  created_at: string;
  load?: Load;
}

interface DocumentsListResponse {
  success: boolean;
  data: {
    documents: DocumentResponse[];
    pagination: Pagination;
  };
}

interface DocumentSingleResponse {
  success: boolean;
  message?: string;
  data: {
    document: DocumentResponse;
  };
}

export interface DocumentFilters {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  load_id?: number;
}

/**
 * Get documents for a position
 */
export async function getDocuments(positionId: number, filters: DocumentFilters = {}): Promise<{ documents: DocumentResponse[]; pagination: Pagination }> {
  const response = await api.get<DocumentsListResponse>(`/positions/${positionId}/documents`, { params: filters });
  if (!response.data.success) {
    throw new Error('Evraklar yüklenemedi');
  }
  return {
    documents: response.data.data.documents,
    pagination: response.data.data.pagination,
  };
}

/**
 * Upload a document
 */
export async function uploadDocument(
  positionId: number,
  file: { uri: string; name: string; type: string },
  data?: { category?: string; description?: string; load_id?: number }
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  if (data?.category) formData.append('category', data.category);
  if (data?.description) formData.append('description', data.description);
  if (data?.load_id) formData.append('load_id', String(data.load_id));

  const response = await api.post<DocumentSingleResponse>(`/positions/${positionId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Evrak yüklenemedi');
  }
  return response.data.data.document;
}

/**
 * Delete a document
 */
export async function deleteDocument(positionId: number, documentId: number): Promise<void> {
  const response = await api.delete<MessageResponse>(`/positions/${positionId}/documents/${documentId}`);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Evrak silinemedi');
  }
}

/**
 * Get document download URL
 */
export function getDocumentDownloadUrl(positionId: number, documentId: number): string {
  return `/positions/${positionId}/documents/${documentId}/download`;
}

// ===============================
// EXPENSE TYPES (for dropdown)
// ===============================

export const EXPENSE_TYPES = [
  { value: 'fuel', label: 'Yakıt' },
  { value: 'toll', label: 'Geçiş Ücreti' },
  { value: 'parking', label: 'Park' },
  { value: 'food', label: 'Yemek' },
  { value: 'accommodation', label: 'Konaklama' },
  { value: 'repair', label: 'Tamir' },
  { value: 'ferry', label: 'Feribot' },
  { value: 'customs', label: 'Gümrük' },
  { value: 'other', label: 'Diğer' },
];

export function getExpenseTypeLabel(type?: string): string {
  if (!type) return '-';
  const found = EXPENSE_TYPES.find((t) => t.value === type);
  return found?.label || type;
}

// ===============================
// FUEL TYPES (for dropdown)
// ===============================

export const FUEL_TYPES = [
  { value: 'diesel', label: 'Dizel' },
  { value: 'gasoline', label: 'Benzin' },
  { value: 'lpg', label: 'LPG' },
  { value: 'adblue', label: 'AdBlue' },
];

export function getFuelTypeLabel(type?: string): string {
  if (!type) return '-';
  const found = FUEL_TYPES.find((t) => t.value === type);
  return found?.label || type;
}

// ===============================
// PAYMENT METHODS (for dropdown)
// ===============================

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'bank_transfer', label: 'Banka Transferi' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'check', label: 'Çek' },
];

export function getPaymentMethodLabel(method?: string): string {
  if (!method) return '-';
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found?.label || method;
}

// ===============================
// CURRENCY TYPES (for dropdown)
// ===============================

export const CURRENCY_TYPES = [
  { value: 'TRY', label: 'TRY - Türk Lirası' },
  { value: 'USD', label: 'USD - Amerikan Doları' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - İngiliz Sterlini' },
];

// ===============================
// DOCUMENT CATEGORIES (for dropdown)
// ===============================

export const DOCUMENT_CATEGORIES = [
  { value: 'cmr', label: 'CMR' },
  { value: 'invoice', label: 'Fatura' },
  { value: 'customs', label: 'Gümrük Evrakı' },
  { value: 'delivery_note', label: 'Teslimat Belgesi' },
  { value: 'packing_list', label: 'Paketleme Listesi' },
  { value: 'photo', label: 'Fotoğraf' },
  { value: 'other', label: 'Diğer' },
];

export function getDocumentCategoryLabel(category?: string): string {
  if (!category) return '-';
  const found = DOCUMENT_CATEGORIES.find((c) => c.value === category);
  return found?.label || category;
}
