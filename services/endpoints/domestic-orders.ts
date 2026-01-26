/**
 * Domestic Transport Orders API Service
 *
 * Handles all domestic transport order (yurtiçi iş emri) related API calls for the mobile app.
 */

import api from '../api';

// Order status type
export type DomesticOrderStatus = 'draft' | 'planned' | 'assigned' | 'in_transit' | 'completed' | 'cancelled';

// Order type
export type DomesticOrderType = 'pre_carriage' | 'distribution' | 'city_delivery' | 'warehouse_transfer';

// Billing type
export type DomesticBillingType = 'included_in_main' | 'separate_invoice' | 'cost_center';

// Customer info
export interface Customer {
  id: number;
  name: string;
  code?: string;
  phone?: string;
}

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
  full_name?: string;
  phone_1?: string;
}

// Address info
export interface Address {
  id: number;
  title?: string;
  address?: string;
  formatted_address?: string;
  latitude?: number;
  longitude?: number;
}

// Order item
export interface DomesticOrderItem {
  id: number;
  description: string;
  package_type?: string;
  package_count?: number;
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  gross_weight?: number;
  net_weight?: number;
  requires_temperature_control?: boolean;
  min_temperature?: number;
  max_temperature?: number;
  is_fragile?: boolean;
  requires_insurance?: boolean;
  special_instructions?: string;
  sort_order?: number;
}

// Pricing item
export interface DomesticPricingItem {
  id: number;
  item_type?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total_amount: number;
  currency: string;
  exchange_rate: number;
  sort_order?: number;
}

// Expense
export interface DomesticExpense {
  id: number;
  expense_date?: string;
  expense_type?: string;
  description?: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_try: number;
  status: 'pending' | 'approved' | 'rejected';
}

// Main order interface
export interface DomesticTransportOrder {
  id: number;
  order_number: string;
  order_type: DomesticOrderType;
  status: DomesticOrderStatus;
  billing_type?: DomesticBillingType;
  parent_position_id?: number;
  parent_load_id?: number;
  cost_center_id?: number;
  customer_id: number;
  sender_company_id?: number;
  receiver_company_id?: number;
  pickup_address_id?: number;
  delivery_address_id?: number;
  pickup_expected_date?: string;
  pickup_actual_date?: string;
  delivery_expected_date?: string;
  delivery_actual_date?: string;
  vehicle_id?: number;
  driver_id?: number;
  notes?: string;
  sort_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relationships
  customer?: Customer;
  vehicle?: Vehicle;
  driver?: Driver;
  pickup_address?: Address;
  delivery_address?: Address;
  items?: DomesticOrderItem[];
  pricing_items?: DomesticPricingItem[];
  expenses?: DomesticExpense[];

  // Computed
  total_cost?: number;
  is_delayed?: boolean;
  is_assigned?: boolean;
  delivery_duration?: number;
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
export interface DomesticOrderFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: DomesticOrderStatus;
  order_type?: DomesticOrderType;
  customer_id?: number;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// API Response interfaces
interface OrdersResponse {
  success: boolean;
  data: {
    orders: DomesticTransportOrder[];
    pagination: Pagination;
  };
}

interface OrderResponse {
  success: boolean;
  data: {
    order: DomesticTransportOrder;
  };
}

/**
 * Get domestic transport orders list with filters
 */
export async function getDomesticOrders(
  filters: DomesticOrderFilters = {}
): Promise<{ orders: DomesticTransportOrder[]; pagination: Pagination }> {
  const response = await api.get<OrdersResponse>('/domestic-orders', {
    params: filters,
  });

  if (!response.data.success) {
    throw new Error('İş emirleri yüklenemedi');
  }

  return {
    orders: response.data.data.orders,
    pagination: response.data.data.pagination,
  };
}

/**
 * Get single domestic transport order by ID
 */
export async function getDomesticOrder(id: number): Promise<DomesticTransportOrder> {
  const response = await api.get<OrderResponse>(`/domestic-orders/${id}`);

  if (!response.data.success) {
    throw new Error('İş emri detayları yüklenemedi');
  }

  return response.data.data.order;
}

/**
 * Create new domestic transport order
 */
export async function createDomesticOrder(data: Partial<DomesticTransportOrder>): Promise<DomesticTransportOrder> {
  const response = await api.post<OrderResponse>('/domestic-orders', data);

  if (!response.data.success) {
    throw new Error('İş emri oluşturulamadı');
  }

  return response.data.data.order;
}

/**
 * Update domestic transport order
 */
export async function updateDomesticOrder(id: number, data: Partial<DomesticTransportOrder>): Promise<DomesticTransportOrder> {
  const response = await api.put<OrderResponse>(`/domestic-orders/${id}`, data);

  if (!response.data.success) {
    throw new Error('İş emri güncellenemedi');
  }

  return response.data.data.order;
}

/**
 * Delete domestic transport order
 */
export async function deleteDomesticOrder(id: number): Promise<void> {
  const response = await api.delete(`/domestic-orders/${id}`);

  if (!response.data.success) {
    throw new Error('İş emri silinemedi');
  }
}

/**
 * Update domestic transport order status
 */
export async function updateDomesticOrderStatus(
  id: number,
  status: DomesticOrderStatus,
  dates?: { pickup_actual_date?: string; delivery_actual_date?: string }
): Promise<DomesticTransportOrder> {
  const response = await api.patch<OrderResponse>(`/domestic-orders/${id}/status`, {
    status,
    ...dates,
  });

  if (!response.data.success) {
    throw new Error('İş emri durumu güncellenemedi');
  }

  return response.data.data.order;
}

/**
 * Assign driver and vehicle to order
 */
export async function assignDomesticOrder(
  id: number,
  data: { vehicle_id?: number; driver_id?: number }
): Promise<DomesticTransportOrder> {
  const response = await api.patch<OrderResponse>(`/domestic-orders/${id}/assign`, data);

  if (!response.data.success) {
    throw new Error('İş emri atanamadı');
  }

  return response.data.data.order;
}

/**
 * Get order status label
 */
export function getOrderStatusLabel(status?: DomesticOrderStatus): string {
  const labels: Record<DomesticOrderStatus, string> = {
    draft: 'Taslak',
    planned: 'Planlandı',
    assigned: 'Atandı',
    in_transit: 'Yolda',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
  };
  return status ? labels[status] || status : '-';
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status?: DomesticOrderStatus): string {
  const colors: Record<DomesticOrderStatus, string> = {
    draft: '#6B7280',
    planned: '#f5a623',
    assigned: '#3b82f6',
    in_transit: '#8b5cf6',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };
  return status ? colors[status] || '#6B7280' : '#6B7280';
}

/**
 * Get order status badge variant
 */
export function getOrderStatusVariant(status?: DomesticOrderStatus): 'warning' | 'info' | 'success' | 'destructive' | 'default' | 'secondary' {
  const variants: Record<DomesticOrderStatus, 'warning' | 'info' | 'success' | 'destructive' | 'default' | 'secondary'> = {
    draft: 'secondary',
    planned: 'warning',
    assigned: 'info',
    in_transit: 'default',
    completed: 'success',
    cancelled: 'destructive',
  };
  return status ? variants[status] || 'default' : 'default';
}

/**
 * Get order type label
 */
export function getOrderTypeLabel(type?: DomesticOrderType): string {
  const labels: Record<DomesticOrderType, string> = {
    pre_carriage: 'Ön Taşıma',
    distribution: 'Dağıtım',
    city_delivery: 'Şehir İçi Teslimat',
    warehouse_transfer: 'Depo Transferi',
  };
  return type ? labels[type] || type : '-';
}

/**
 * Get order type color
 */
export function getOrderTypeColor(type?: DomesticOrderType): string {
  const colors: Record<DomesticOrderType, string> = {
    pre_carriage: '#3b82f6',
    distribution: '#8b5cf6',
    city_delivery: '#f59e0b',
    warehouse_transfer: '#10b981',
  };
  return type ? colors[type] || '#6B7280' : '#6B7280';
}

/**
 * Get billing type label
 */
export function getBillingTypeLabel(type?: DomesticBillingType): string {
  const labels: Record<DomesticBillingType, string> = {
    included_in_main: 'Ana Faturaya Dahil',
    separate_invoice: 'Ayrı Fatura',
    cost_center: 'Masraf Merkezi',
  };
  return type ? labels[type] || type : '-';
}

/**
 * Get driver full name
 */
export function getDriverFullName(driver?: Driver): string {
  if (!driver) return '-';
  return driver.full_name || `${driver.first_name} ${driver.last_name}`.trim() || '-';
}

/**
 * Format date for display
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format datetime for display
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount?: number, currency: string = 'TRY'): string {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
