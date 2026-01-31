/**
 * Dashboard API Endpoints
 *
 * Tum dashboard modulleri icin istatistik ve metrik endpoint'leri.
 * Backend: Laravel DashboardController
 */

import api, { getErrorMessage } from '../api'

// ============= INTERFACES =============

/**
 * Kullanicinin erisebilecegi dashboard'lar
 */
export interface AvailableDashboards {
  overview: boolean
  logistics: boolean
  warehouse: boolean
  domestic: boolean
  finance: boolean
  crm: boolean
  fleet: boolean
  stock: boolean
  hr: boolean
}

/**
 * Temel dashboard istatistikleri (backward compatible)
 */
export interface DashboardStats {
  monthly_revenue: number
  available_vehicles: number
  busy_vehicles: number
  total_trips: number
  active_loads: number
  total_vehicles: number
  total_contacts: number
}

/**
 * Genel Bakis Dashboard Istatistikleri
 */
export interface OverviewStats {
  activeTrips: number
  activeDomesticOrders: number
  pendingReceiving: number
  readyPositions: number
  inWarehouseItems: number
  completedTodayDomestic: number
  delayedDomestic: number
  monthlyRevenue: number
}

/**
 * Suresi dolan belge
 */
export interface ExpiringDocument {
  id: number
  name: string
  type: string
  expires_at: string
  days_until_expiry: number
}

/**
 * Sefer ozeti
 */
export interface TripSummary {
  id: number
  trip_number: string
  name: string
  status: string
  created_at: string
}

/**
 * Surucu konumu
 */
export interface DriverLocation {
  id: number
  driver_id: number
  driver_name: string
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  position_number: string | null
  trip_number: string | null
  recorded_at: string | null
}

/**
 * Lojistik Dashboard Istatistikleri
 */
export interface LogisticsStats {
  monthlyTripsCount: number
  monthlyTripsGrowth: number
  totalTripsCount: number
  activeTripsCount: number
  plannedTripsCount: number
  expiringDocuments: ExpiringDocument[]
  recentTrips: TripSummary[]
  plannedTrips: TripSummary[]
  driverLocations: DriverLocation[]
}

/**
 * Pozisyon hazirlik bilgisi
 */
export interface PositionReadiness {
  id: number
  position_number: string
  readiness_percentage: number
}

/**
 * Depo ozet istatistikleri
 */
export interface WarehouseSummaryStats {
  pending_pre_carriages: number
  pending_warehouse_receiving: number
  ready_for_disposition: number
  total_positions: number
}

/**
 * Depo Dashboard Istatistikleri
 */
export interface WarehouseStats {
  pendingPreCarriages: unknown[]
  pendingWarehouseReceiving: unknown[]
  positionReadiness: PositionReadiness[]
  readyForDisposition: unknown[]
  summaryStats: WarehouseSummaryStats
  threshold: number
}

/**
 * Yurtici siparis
 */
export interface DomesticOrder {
  id: number
  order_number: string
  status: string
  status_label: string
  order_type: string
  order_type_label: string
  customer_id: number | null
  customer: string | null
  pickup_city: string
  delivery_city: string
  pickup_expected_date: string | null
  delivery_expected_date: string | null
  vehicle_id: number | null
  vehicle_plate: string | null
  driver_id: number | null
  driver_name: string | null
  is_delayed: boolean
  is_assigned: boolean
}

/**
 * Yurtici ozet istatistikleri
 */
export interface DomesticSummaryStats {
  total_orders: number
  pending_orders: number
  assigned_orders: number
  in_transit_orders: number
  completed_today: number
  delayed_orders: number
  pre_carriage_count: number
  delivery_count: number
  pickup_count: number
}

/**
 * Yurtici Dashboard Istatistikleri
 */
export interface DomesticStats {
  activeOrders: DomesticOrder[]
  delayedOrders: DomesticOrder[]
  todayDeliveries: DomesticOrder[]
  summaryStats: DomesticSummaryStats
}

/**
 * Alacak/Borc ozeti
 */
export interface FinancialSummary {
  total: number
  overdue: number
  planned: number
  currency: string
}

/**
 * Nakit akisi veri noktasi
 */
export interface CashFlowDataPoint {
  date: string
  label: string
  inflow: number
  outflow: number
  balance: number
}

/**
 * Nakit akisi ozeti
 */
export interface CashFlowSummary {
  totalBalance: number
  totalPayment: number
  totalCollection: number
  endBalance: number
  data: CashFlowDataPoint[]
  currency: string
}

/**
 * Gelir istatistikleri veri noktasi
 */
export interface IncomeDataPoint {
  month: string
  label: string
  income: number
}

/**
 * Gelir istatistikleri ozeti
 */
export interface IncomeStatsSummary {
  totalIncome: number
  growthPercentage: number
  data: IncomeDataPoint[]
  currency: string
}

/**
 * Tahsilat kalemi
 */
export interface CollectionItem {
  id: number
  date: string | null
  description: string
  amount: number
  currency: string
  type: string
  status: string
  daysUntil: number
}

/**
 * Finans Dashboard Istatistikleri
 */
export interface FinanceStats {
  receivables: FinancialSummary
  payables: FinancialSummary
  cashFlow: CashFlowSummary
  incomeStats: IncomeStatsSummary
  upcomingCollections: CollectionItem[]
  pastCollections: CollectionItem[]
  currency: string
}

/**
 * Kazanilan teklifler ozeti
 */
export interface WonQuotesSummary {
  count: number
  amount: number
  growthPercentage: number
  currency: string
}

/**
 * Teklif istatistikleri
 */
export interface QuoteStatistics {
  total: number
  draft: number
  sent: number
  accepted: number
  rejected: number
  expired: number
}

/**
 * Musteri istatistikleri
 */
export interface CustomerStatistics {
  total: number
  activeThisMonth: number
}

/**
 * Teklif ozeti
 */
export interface QuoteSummary {
  id: number
  quote_number: string
  contact_name: string | null
  total_amount: number
  currency: string
  status: string
  status_label: string
  valid_until: string | null
  created_at: string
}

/**
 * CRM Dashboard Istatistikleri
 */
export interface CRMStats {
  wonQuotes: WonQuotesSummary
  quoteStats: QuoteStatistics
  customerStats: CustomerStatistics
  conversionRate: number
  recentQuotes: QuoteSummary[]
  pendingQuotes: QuoteSummary[]
  expiringQuotes: QuoteSummary[]
  currency: string
}

/**
 * Arac istatistikleri
 */
export interface VehicleStatistics {
  total: number
  active: number
  inMaintenance: number
  inactive: number
}

/**
 * Surucu istatistikleri
 */
export interface DriverStatistics {
  total: number
  active: number
}

/**
 * Arac konumu
 */
export interface VehicleLocation {
  id: number
  vehicle_id: number | null
  plate_number: string
  driver_name: string | null
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  recorded_at: string | null
}

/**
 * Filo suresi dolan belge
 */
export interface FleetExpiringDocument {
  id: number
  type: string
  type_label: string
  name: string
  expires_at: string
  days_until_expiry: number
}

/**
 * Yaklasan bakim
 */
export interface UpcomingMaintenance {
  id: number
  vehicle_id: number
  plate_number: string
  maintenance_type: string
  scheduled_date: string
  status: string
}

/**
 * Filo Dashboard Istatistikleri
 */
export interface FleetStats {
  vehicleStats: VehicleStatistics
  driverStats: DriverStatistics
  expiringInsurances: number
  expiringInspections: number
  vehicleLocations: VehicleLocation[]
  expiringDocuments: FleetExpiringDocument[]
  upcomingMaintenances: UpcomingMaintenance[]
  recentFuelRecords: unknown[]
}

/**
 * Urun istatistikleri
 */
export interface ProductStatistics {
  total: number
  active: number
  lowStock: number
}

/**
 * Hareket istatistikleri
 */
export interface MovementStatistics {
  today: number
  inbound: number
  outbound: number
}

/**
 * Depo istatistikleri
 */
export interface WarehouseStatistics {
  total: number
  active: number
  utilizationRate: number
}

/**
 * Kategori dagilimi
 */
export interface CategoryDistributionItem {
  name: string
  count: number
  color: string
}

/**
 * Son stok hareketi
 */
export interface RecentMovement {
  id: number
  movement_number: string
  product_name: string
  movement_type: string
  movement_type_label: string
  quantity: number
  warehouse_name: string | null
  created_at: string
}

/**
 * Dusuk stoklu urun
 */
export interface LowStockProduct {
  id: number
  name: string
  sku: string
  current_stock: number
  min_stock: number
  unit: string
  warehouse_name: string | null
}

/**
 * Stok Dashboard Istatistikleri
 */
export interface StockStats {
  totalStockValue: number
  stockValueGrowth: number
  currency: string
  productStats: ProductStatistics
  movementStats: MovementStatistics
  warehouseStats: WarehouseStatistics
  categoryDistribution: CategoryDistributionItem[]
  recentMovements: RecentMovement[]
  lowStockProducts: LowStockProduct[]
  topMovingProducts: unknown[]
}

/**
 * IK suresi dolan belge
 */
export interface HRExpiringDocument {
  id: number
  employee_id: number
  employee_name: string
  document_type: string
  document_detail: string
  expiry_date: string
  days_until_expiry: number
}

/**
 * Yaklasan dogum gunu
 */
export interface UpcomingBirthday {
  id: number
  name: string
  position: string
  department: string | null
  birth_date: string
  days_until: number
  age: number
}

/**
 * Son calisan
 */
export interface RecentEmployee {
  id: number
  name: string
  position: string
  department: string | null
  start_date: string | null
  created_at: string
}

/**
 * Son is basvurusu
 */
export interface RecentApplication {
  id: number
  applicant_name: string
  email: string
  job_title: string
  status: string
  status_label: string
  created_at: string
}

/**
 * IK Dashboard Istatistikleri
 */
export interface HRStats {
  totalEmployees: number
  activeEmployees: number
  hiredThisMonth: number
  leftThisMonth: number
  activeJobPostings: number
  pendingApplications: number
  interviewScheduled: number
  applicationsThisMonth: number
  expiringLicenses: HRExpiringDocument[]
  expiringPassports: HRExpiringDocument[]
  expiringVisas: HRExpiringDocument[]
  expiringCertificates: HRExpiringDocument[]
  allExpiringDocuments: HRExpiringDocument[]
  expiringLicensesCount: number
  expiringPassportsCount: number
  expiringVisasCount: number
  expiringCertificatesCount: number
  upcomingBirthdays: UpcomingBirthday[]
  recentEmployees: RecentEmployee[]
  recentApplications: RecentApplication[]
}

// ============= API RESPONSE WRAPPER =============

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ============= API FONKSIYONLARI =============

/**
 * Kullanicinin erisebilecegi dashboard'lari getir
 */
export async function getAvailableDashboards(): Promise<AvailableDashboards> {
  try {
    const response = await api.get<ApiResponse<AvailableDashboards>>('/dashboard/available')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Temel dashboard istatistiklerini getir (backward compatible)
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Genel Bakis Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.overview.view
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  try {
    const response = await api.get<ApiResponse<OverviewStats>>('/dashboard/overview')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Lojistik Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.logistics.view
 */
export async function getLogisticsStats(): Promise<LogisticsStats> {
  try {
    const response = await api.get<ApiResponse<LogisticsStats>>('/dashboard/logistics')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Depo Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.warehouse.view
 */
export async function getWarehouseStats(): Promise<WarehouseStats> {
  try {
    const response = await api.get<ApiResponse<WarehouseStats>>('/dashboard/warehouse')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Yurtici Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.domestic.view
 */
export async function getDomesticStats(): Promise<DomesticStats> {
  try {
    const response = await api.get<ApiResponse<DomesticStats>>('/dashboard/domestic')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Finans Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.finance.view
 */
export async function getFinanceStats(): Promise<FinanceStats> {
  try {
    const response = await api.get<ApiResponse<FinanceStats>>('/dashboard/finance')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * CRM Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.crm.view
 */
export async function getCRMStats(): Promise<CRMStats> {
  try {
    const response = await api.get<ApiResponse<CRMStats>>('/dashboard/crm')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Filo Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.fleet.view
 */
export async function getFleetStats(): Promise<FleetStats> {
  try {
    const response = await api.get<ApiResponse<FleetStats>>('/dashboard/fleet')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Stok Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.stock.view
 */
export async function getStockStats(): Promise<StockStats> {
  try {
    const response = await api.get<ApiResponse<StockStats>>('/dashboard/stock')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * IK Dashboard istatistiklerini getir
 * Gerekli izin: dashboard.hr.view
 */
export async function getHRStats(): Promise<HRStats> {
  try {
    const response = await api.get<ApiResponse<HRStats>>('/dashboard/hr')
    return response.data.data
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}
