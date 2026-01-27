/**
 * Reports API Endpoints
 * Kar/Zarar, KDV, Cari ve Yurtiçi raporları için API servisleri
 */

import api from '../api';

// ============================================
// Types - Kar/Zarar Analizi
// ============================================

export interface ProfitLossSummary {
  period_start: string;
  period_end: string;
  load_count: number;
  total_revenue: number;
  total_costs: number;
  total_fuel: number;
  total_advance: number;
  total_expense: number;
  gross_profit: number;
  profit_margin: number;
  total_km: number;
  cost_per_km: number;
  revenue_per_km: number;
}

export interface ProfitLossTrend {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  load_count: number;
}

export interface ExpenseBreakdownItem {
  label: string;
  value: number;
}

export interface CustomerProfitability {
  customer_id: number;
  customer_name: string;
  load_count: number;
  total_revenue: number;
  total_costs: number;
  total_fuel: number;
  net_profit: number;
  profit_margin: number;
}

export interface ProfitLossLoad {
  load_number: string;
  cargo_name?: string;
  customer_name?: string;
  revenue: number;
  costs: number;
  net_profit: number;
  profit_margin: number;
}

export interface ProfitLossSummaryResponse {
  summary: ProfitLossSummary;
  top_profitable_loads: ProfitLossLoad[];
  top_unprofitable_loads: ProfitLossLoad[];
  period: {
    start_date: string;
    end_date: string;
  };
}

// ============================================
// Types - KDV Raporu
// ============================================

export interface VatRateData {
  amount: number;
  vat: number;
}

export interface VatSummaryData {
  invoice_count: number;
  total_amount: number;
  total_vat: number;
  vat_rates: {
    [key: string]: VatRateData;
  };
}

export interface KdvSummary {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  sales: VatSummaryData;
  purchases: VatSummaryData;
  summary: {
    total_calculated_vat: number;
    total_deductible_vat: number;
    payable_vat: number;
    carried_forward_vat: number;
  };
}

// ============================================
// Types - Cari Raporları
// ============================================

export interface ContactDashboardSummary {
  total_receivables: number;
  total_payables: number;
  net_position: number;
  overdue_receivables: number;
  contact_count: number;
}

export interface CurrencyPositionItem {
  currency: string;
  receivables: number;
  payables: number;
  net_position: number;
}

export interface AgingBucket {
  range: string;
  amount: number;
  percentage: number;
}

export interface ContactAgingItem {
  contact_id: number;
  contact_name: string;
  total_balance: number;
  aging_buckets: AgingBucket[];
}

export interface ContactAgingReport {
  summary: AgingBucket[];
  by_contact: ContactAgingItem[];
  total_try: number;
  filters: {
    type?: string;
  };
}

export interface DueTrackingItem {
  id: number;
  type: 'check' | 'promissory_note';
  number: string;
  contact_name: string;
  amount: number;
  currency: string;
  due_date: string;
  days_until_due: number;
  status: string;
}

// ============================================
// Types - Yurtiçi Raporları
// ============================================

export interface DomesticSummary {
  summary: {
    total_orders: number;
    total_revenue: number;
    total_km: number;
    active_drivers: number;
    active_vehicles: number;
  };
  status_distribution: {
    [status: string]: number;
  };
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface DomesticByStatus {
  status: string;
  count: number;
  total_revenue: number;
  total_km: number;
}

export interface DomesticByVehicle {
  vehicle_id: number;
  vehicle_plate: string;
  order_count: number;
  total_revenue: number;
  total_km: number;
  avg_revenue_per_order: number;
}

export interface DomesticByDriver {
  driver_id: number;
  driver_name: string;
  order_count: number;
  total_revenue: number;
  total_km: number;
  avg_revenue_per_order: number;
}

// ============================================
// API Functions - Kar/Zarar Analizi
// ============================================

/**
 * Kar/Zarar özet raporunu getirir
 */
export async function fetchProfitLossSummary(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<ProfitLossSummaryResponse> {
  const response = await api.get<{ success: boolean; data: ProfitLossSummaryResponse }>(
    '/reports/profit-loss/summary',
    { params }
  );
  return response.data.data;
}

/**
 * Kar/Zarar trend analizini getirir
 */
export async function fetchProfitLossTrend(params?: {
  start_date?: string;
  end_date?: string;
  interval?: 'daily' | 'weekly' | 'monthly';
}): Promise<ProfitLossTrend[]> {
  const response = await api.get<{ success: boolean; data: { trends: ProfitLossTrend[] } }>(
    '/reports/profit-loss/trend',
    { params }
  );
  return response.data.data.trends;
}

/**
 * Gider dağılımını getirir
 */
export async function fetchExpenseBreakdown(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<ExpenseBreakdownItem[]> {
  const response = await api.get<{
    success: boolean;
    data: { breakdown: ExpenseBreakdownItem[] };
  }>(`/reports/profit-loss/expense-breakdown`, { params });
  return response.data.data.breakdown;
}

/**
 * Müşteri bazlı karlılık raporunu getirir
 */
export async function fetchByCustomer(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<CustomerProfitability[]> {
  const response = await api.get<{
    success: boolean;
    data: { customers: CustomerProfitability[] };
  }>(`/reports/profit-loss/by-customer`, { params });
  return response.data.data.customers;
}

/**
 * Kar/Zarar raporunu PDF olarak indirir
 */
export async function downloadProfitLossPdf(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<Blob> {
  const response = await api.get(`/reports/profit-loss/export/pdf`, {
    params,
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Kar/Zarar raporunu Excel olarak indirir
 */
export async function downloadProfitLossExcel(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<Blob> {
  const response = await api.get(`/reports/profit-loss/export/excel`, {
    params,
    responseType: 'blob',
  });
  return response.data;
}

// ============================================
// API Functions - KDV Raporu
// ============================================

/**
 * KDV özet raporunu getirir
 */
export async function fetchKdvSummary(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<KdvSummary> {
  const response = await api.get<{ success: boolean; data: KdvSummary }>(
    `/reports/kdv/summary`,
    { params }
  );
  return response.data.data;
}

/**
 * Detaylı KDV raporunu getirir
 */
export async function fetchKdvDetailed(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<any> {
  const response = await api.get<{ success: boolean; data: any }>(
    `/reports/kdv/detailed`,
    { params }
  );
  return response.data.data;
}

/**
 * KDV raporunu PDF olarak indirir
 */
export async function downloadKdvPdf(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<Blob> {
  const response = await api.get(`/reports/kdv/export/pdf`, {
    params,
    responseType: 'blob',
  });
  return response.data;
}

// ============================================
// API Functions - Cari Raporları
// ============================================

/**
 * Cari dashboard özetini getirir
 */
export async function fetchContactDashboardSummary(): Promise<ContactDashboardSummary> {
  const response = await api.get<{ success: boolean; data: ContactDashboardSummary }>(
    `/reports/contact/dashboard-summary`
  );
  return response.data.data;
}

/**
 * Döviz pozisyon raporunu getirir
 */
export async function fetchCurrencyPosition(): Promise<{
  positions: CurrencyPositionItem[];
  totals: any;
}> {
  const response = await api.get<{
    success: boolean;
    data: { positions: CurrencyPositionItem[]; totals: any };
  }>(`/reports/contact/currency-position`);
  return response.data.data;
}

/**
 * Cari yaşlandırma raporunu getirir
 */
export async function fetchContactAging(params?: {
  type?: 'customer' | 'supplier' | 'all';
}): Promise<ContactAgingReport> {
  const response = await api.get<{ success: boolean; data: ContactAgingReport }>(
    `/reports/contact/aging`,
    { params }
  );
  return response.data.data;
}

/**
 * Vadeli takip raporunu getirir
 */
export async function fetchDueTracking(params?: { days?: number }): Promise<{
  items: DueTrackingItem[];
  summary: any;
}> {
  const response = await api.get<{
    success: boolean;
    data: { items: DueTrackingItem[]; summary: any };
  }>(`/reports/contact/due-tracking`, { params });
  return response.data.data;
}

/**
 * En borçlu cariler raporunu getirir
 */
export async function fetchTopDebtors(params?: { limit?: number }): Promise<any[]> {
  const response = await api.get<{ success: boolean; data: { debtors: any[] } }>(
    `/reports/contact/top-debtors`,
    { params }
  );
  return response.data.data.debtors;
}

/**
 * En alacaklı cariler raporunu getirir
 */
export async function fetchTopCreditors(params?: { limit?: number }): Promise<any[]> {
  const response = await api.get<{ success: boolean; data: { creditors: any[] } }>(
    `/reports/contact/top-creditors`,
    { params }
  );
  return response.data.data.creditors;
}

// ============================================
// API Functions - Yurtiçi Raporları
// ============================================

/**
 * Yurtiçi genel özet raporunu getirir
 */
export async function fetchDomesticSummary(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<DomesticSummary> {
  const response = await api.get<{ success: boolean; data: DomesticSummary }>(
    `/reports/domestic/summary`,
    { params }
  );
  return response.data.data;
}

/**
 * Yurtiçi durum bazlı raporu getirir
 */
export async function fetchDomesticByStatus(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<DomesticByStatus[]> {
  const response = await api.get<{
    success: boolean;
    data: { by_status: DomesticByStatus[] };
  }>(`/reports/domestic/by-status`, { params });
  return response.data.data.by_status;
}

/**
 * Yurtiçi araç bazlı raporu getirir
 */
export async function fetchDomesticByVehicle(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<DomesticByVehicle[]> {
  const response = await api.get<{
    success: boolean;
    data: { by_vehicle: DomesticByVehicle[] };
  }>(`/reports/domestic/by-vehicle`, { params });
  return response.data.data.by_vehicle;
}

/**
 * Yurtiçi sürücü bazlı raporu getirir
 */
export async function fetchDomesticByDriver(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<DomesticByDriver[]> {
  const response = await api.get<{
    success: boolean;
    data: { by_driver: DomesticByDriver[] };
  }>(`/reports/domestic/by-driver`, { params });
  return response.data.data.by_driver;
}
