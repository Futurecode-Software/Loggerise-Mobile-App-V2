/**
 * Dashboard API Endpoints
 *
 * Handles dashboard statistics and metrics for all dashboard modules.
 */

import api, { getErrorMessage } from '../api';

// ============= INTERFACES =============

/**
 * Available dashboards based on user permissions
 */
export interface AvailableDashboards {
  overview: boolean;
  logistics: boolean;
  warehouse: boolean;
  domestic: boolean;
  finance: boolean;
  crm: boolean;
  fleet: boolean;
  stock: boolean;
  hr: boolean;
}

/**
 * Basic dashboard stats (backward compatible)
 */
export interface DashboardStats {
  monthly_revenue: number;
  available_vehicles: number;
  busy_vehicles: number;
  total_trips: number;
  active_loads: number;
  total_vehicles: number;
  total_contacts: number;
}

/**
 * Overview Dashboard Stats
 */
export interface OverviewStats {
  activeTrips: number;
  activeDomesticOrders: number;
  pendingReceiving: number;
  readyPositions: number;
  inWarehouseItems: number;
  completedTodayDomestic: number;
  delayedDomestic: number;
  monthlyRevenue: number;
}

/**
 * Expiring document
 */
export interface ExpiringDocument {
  id: number;
  name: string;
  type: string;
  expires_at: string;
  days_until_expiry: number;
}

/**
 * Recent/Planned Trip
 */
export interface TripSummary {
  id: number;
  trip_number: string;
  name: string;
  status: string;
  created_at: string;
}

/**
 * Driver location
 */
export interface DriverLocation {
  id: number;
  driver_id: number;
  driver_name: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  position_number: string | null;
  trip_number: string | null;
  recorded_at: string | null;
}

/**
 * Logistics Dashboard Stats
 */
export interface LogisticsStats {
  monthlyTripsCount: number;
  monthlyTripsGrowth: number;
  totalTripsCount: number;
  activeTripsCount: number;
  plannedTripsCount: number;
  expiringDocuments: ExpiringDocument[];
  recentTrips: TripSummary[];
  plannedTrips: TripSummary[];
  driverLocations: DriverLocation[];
}

/**
 * Position readiness info
 */
export interface PositionReadiness {
  id: number;
  position_number: string;
  readiness_percentage: number;
}

/**
 * Summary stats for warehouse
 */
export interface WarehouseSummaryStats {
  pending_pre_carriages: number;
  pending_warehouse_receiving: number;
  ready_for_disposition: number;
  total_positions: number;
}

/**
 * Warehouse Dashboard Stats
 */
export interface WarehouseStats {
  pendingPreCarriages: any[];
  pendingWarehouseReceiving: any[];
  positionReadiness: PositionReadiness[];
  readyForDisposition: any[];
  summaryStats: WarehouseSummaryStats;
  threshold: number;
}

/**
 * Domestic order
 */
export interface DomesticOrder {
  id: number;
  order_number: string;
  status: string;
  status_label: string;
  order_type: string;
  order_type_label: string;
  customer_id: number | null;
  customer: string | null;
  pickup_city: string;
  delivery_city: string;
  pickup_expected_date: string | null;
  delivery_expected_date: string | null;
  vehicle_id: number | null;
  vehicle_plate: string | null;
  driver_id: number | null;
  driver_name: string | null;
  is_delayed: boolean;
  is_assigned: boolean;
}

/**
 * Domestic summary stats
 */
export interface DomesticSummaryStats {
  total_orders: number;
  pending_orders: number;
  assigned_orders: number;
  in_transit_orders: number;
  completed_today: number;
  delayed_orders: number;
  pre_carriage_count: number;
  delivery_count: number;
  pickup_count: number;
}

/**
 * Domestic Dashboard Stats
 */
export interface DomesticStats {
  activeOrders: DomesticOrder[];
  delayedOrders: DomesticOrder[];
  todayDeliveries: DomesticOrder[];
  summaryStats: DomesticSummaryStats;
}

/**
 * Receivables/Payables summary
 */
export interface FinancialSummary {
  total: number;
  overdue: number;
  planned: number;
  currency: string;
}

/**
 * Cash flow data point
 */
export interface CashFlowDataPoint {
  date: string;
  label: string;
  inflow: number;
  outflow: number;
  balance: number;
}

/**
 * Cash flow summary
 */
export interface CashFlowSummary {
  totalBalance: number;
  totalPayment: number;
  totalCollection: number;
  endBalance: number;
  data: CashFlowDataPoint[];
  currency: string;
}

/**
 * Income stats data point
 */
export interface IncomeDataPoint {
  month: string;
  label: string;
  income: number;
}

/**
 * Income stats summary
 */
export interface IncomeStatsSummary {
  totalIncome: number;
  growthPercentage: number;
  data: IncomeDataPoint[];
  currency: string;
}

/**
 * Collection item
 */
export interface CollectionItem {
  id: number;
  date: string | null;
  description: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  daysUntil: number;
}

/**
 * Finance Dashboard Stats
 */
export interface FinanceStats {
  receivables: FinancialSummary;
  payables: FinancialSummary;
  cashFlow: CashFlowSummary;
  incomeStats: IncomeStatsSummary;
  upcomingCollections: CollectionItem[];
  pastCollections: CollectionItem[];
  currency: string;
}

/**
 * Won quotes summary
 */
export interface WonQuotesSummary {
  count: number;
  amount: number;
  growthPercentage: number;
  currency: string;
}

/**
 * Quote statistics
 */
export interface QuoteStatistics {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
}

/**
 * Customer statistics
 */
export interface CustomerStatistics {
  total: number;
  activeThisMonth: number;
}

/**
 * Quote summary
 */
export interface QuoteSummary {
  id: number;
  quote_number: string;
  contact_name: string | null;
  total_amount: number;
  currency: string;
  status: string;
  status_label: string;
  valid_until: string | null;
  created_at: string;
}

/**
 * CRM Dashboard Stats
 */
export interface CRMStats {
  wonQuotes: WonQuotesSummary;
  quoteStats: QuoteStatistics;
  customerStats: CustomerStatistics;
  conversionRate: number;
  recentQuotes: QuoteSummary[];
  pendingQuotes: QuoteSummary[];
  expiringQuotes: QuoteSummary[];
  currency: string;
}

/**
 * Vehicle statistics
 */
export interface VehicleStatistics {
  total: number;
  active: number;
  inMaintenance: number;
  inactive: number;
}

/**
 * Driver statistics
 */
export interface DriverStatistics {
  total: number;
  active: number;
}

/**
 * Vehicle location
 */
export interface VehicleLocation {
  id: number;
  vehicle_id: number | null;
  plate_number: string;
  driver_name: string | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string | null;
}

/**
 * Fleet expiring document
 */
export interface FleetExpiringDocument {
  id: number;
  type: string;
  type_label: string;
  name: string;
  expires_at: string;
  days_until_expiry: number;
}

/**
 * Upcoming maintenance
 */
export interface UpcomingMaintenance {
  id: number;
  vehicle_id: number;
  plate_number: string;
  maintenance_type: string;
  scheduled_date: string;
  status: string;
}

/**
 * Fleet Dashboard Stats
 */
export interface FleetStats {
  vehicleStats: VehicleStatistics;
  driverStats: DriverStatistics;
  expiringInsurances: number;
  expiringInspections: number;
  vehicleLocations: VehicleLocation[];
  expiringDocuments: FleetExpiringDocument[];
  upcomingMaintenances: UpcomingMaintenance[];
  recentFuelRecords: any[];
}

/**
 * Product statistics
 */
export interface ProductStatistics {
  total: number;
  active: number;
  lowStock: number;
}

/**
 * Movement statistics
 */
export interface MovementStatistics {
  today: number;
  inbound: number;
  outbound: number;
}

/**
 * Warehouse statistics
 */
export interface WarehouseStatistics {
  total: number;
  active: number;
  utilizationRate: number;
}

/**
 * Category distribution item
 */
export interface CategoryDistributionItem {
  name: string;
  count: number;
  color: string;
}

/**
 * Recent stock movement
 */
export interface RecentMovement {
  id: number;
  movement_number: string;
  product_name: string;
  movement_type: string;
  movement_type_label: string;
  quantity: number;
  warehouse_name: string | null;
  created_at: string;
}

/**
 * Low stock product
 */
export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  warehouse_name: string | null;
}

/**
 * Stock Dashboard Stats
 */
export interface StockStats {
  totalStockValue: number;
  stockValueGrowth: number;
  currency: string;
  productStats: ProductStatistics;
  movementStats: MovementStatistics;
  warehouseStats: WarehouseStatistics;
  categoryDistribution: CategoryDistributionItem[];
  recentMovements: RecentMovement[];
  lowStockProducts: LowStockProduct[];
  topMovingProducts: any[];
}

/**
 * HR expiring document
 */
export interface HRExpiringDocument {
  id: number;
  employee_id: number;
  employee_name: string;
  document_type: string;
  document_detail: string;
  expiry_date: string;
  days_until_expiry: number;
}

/**
 * Upcoming birthday
 */
export interface UpcomingBirthday {
  id: number;
  name: string;
  position: string;
  department: string | null;
  birth_date: string;
  days_until: number;
  age: number;
}

/**
 * Recent employee
 */
export interface RecentEmployee {
  id: number;
  name: string;
  position: string;
  department: string | null;
  start_date: string | null;
  created_at: string;
}

/**
 * Recent job application
 */
export interface RecentApplication {
  id: number;
  applicant_name: string;
  email: string;
  job_title: string;
  status: string;
  status_label: string;
  created_at: string;
}

/**
 * HR Dashboard Stats
 */
export interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  hiredThisMonth: number;
  leftThisMonth: number;
  activeJobPostings: number;
  pendingApplications: number;
  interviewScheduled: number;
  applicationsThisMonth: number;
  expiringLicenses: HRExpiringDocument[];
  expiringPassports: HRExpiringDocument[];
  expiringVisas: HRExpiringDocument[];
  expiringCertificates: HRExpiringDocument[];
  allExpiringDocuments: HRExpiringDocument[];
  expiringLicensesCount: number;
  expiringPassportsCount: number;
  expiringVisasCount: number;
  expiringCertificatesCount: number;
  upcomingBirthdays: UpcomingBirthday[];
  recentEmployees: RecentEmployee[];
  recentApplications: RecentApplication[];
}

// ============= API RESPONSE WRAPPERS =============

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============= API FUNCTIONS =============

/**
 * Get available dashboards based on user permissions
 */
export async function getAvailableDashboards(): Promise<AvailableDashboards> {
  try {
    const response = await api.get<ApiResponse<AvailableDashboards>>('/dashboard/available');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get basic dashboard statistics (backward compatible)
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get Overview Dashboard stats
 * Requires: dashboard.overview.view permission
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  try {
    const response = await api.get<ApiResponse<OverviewStats>>('/dashboard/overview');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get Logistics Dashboard stats
 * Requires: dashboard.logistics.view permission
 */
export async function getLogisticsStats(): Promise<LogisticsStats> {
  try {
    const response = await api.get<ApiResponse<LogisticsStats>>('/dashboard/logistics');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get Warehouse Dashboard stats
 * Requires: dashboard.warehouse.view permission
 */
export async function getWarehouseStats(): Promise<WarehouseStats> {
  try {
    const response = await api.get<ApiResponse<WarehouseStats>>('/dashboard/warehouse');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get Domestic Dashboard stats
 * Requires: dashboard.domestic.view permission
 */
export async function getDomesticStats(): Promise<DomesticStats> {
  try {
    const response = await api.get<ApiResponse<DomesticStats>>('/dashboard/domestic');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get Finance Dashboard stats
 * Requires: dashboard.finance.view permission
 */
export async function getFinanceStats(): Promise<FinanceStats> {
  try {
    const response = await api.get<ApiResponse<FinanceStats>>('/dashboard/finance');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get CRM Dashboard stats
 * Requires: dashboard.crm.view permission
 */
export async function getCRMStats(): Promise<CRMStats> {
  try {
    const response = await api.get<ApiResponse<CRMStats>>('/dashboard/crm');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get Fleet Dashboard stats
 * Requires: dashboard.fleet.view permission
 */
export async function getFleetStats(): Promise<FleetStats> {
  try {
    const response = await api.get<ApiResponse<FleetStats>>('/dashboard/fleet');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get Stock Dashboard stats
 * Requires: dashboard.stock.view permission
 */
export async function getStockStats(): Promise<StockStats> {
  try {
    const response = await api.get<ApiResponse<StockStats>>('/dashboard/stock');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get HR Dashboard stats
 * Requires: dashboard.hr.view permission
 */
export async function getHRStats(): Promise<HRStats> {
  try {
    const response = await api.get<ApiResponse<HRStats>>('/dashboard/hr');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}
