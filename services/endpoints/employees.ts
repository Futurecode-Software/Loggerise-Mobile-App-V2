/**
 * Employees API Endpoints
 *
 * Handles employee (personel) management operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Employment status enum
 */
export type EmploymentStatus = 'active' | 'passive' | 'on_leave' | 'suspended' | 'terminated';

/**
 * Contract type enum
 */
export type ContractType = 'full_time' | 'part_time' | 'temporary' | 'seasonal' | 'internship' | 'freelance';

/**
 * Position enum
 */
export type Position =
  | 'office_staff'
  | 'driver'
  | 'white_collar'
  | 'blue_collar'
  | 'manager'
  | 'supervisor'
  | 'technician'
  | 'engineer'
  | 'accountant'
  | 'sales_representative'
  | 'customer_service'
  | 'warehouse_staff'
  | 'security'
  | 'cleaning_staff'
  | 'intern'
  | 'other';

/**
 * Gender enum
 */
export type Gender = 'male' | 'female' | 'other';

/**
 * Marital status enum
 */
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

/**
 * Military status enum
 */
export type MilitaryStatus = 'completed' | 'exempt' | 'postponed' | 'not_applicable';

/**
 * Blood type enum
 */
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

/**
 * Employee entity
 */
export interface Employee {
  id: number;
  citizenship_no: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_1: string;
  phone_2?: string;
  email: string;
  employee_code?: string;
  sgk_number?: string;
  start_date?: string;
  end_date?: string;
  employment_status: EmploymentStatus;
  contract_type?: ContractType;
  position?: Position;
  home_phone?: string;
  emergency_phone_1?: string;
  emergency_phone_2?: string;
  military_status?: MilitaryStatus;
  driving_license?: string[];
  mother_name?: string;
  father_name?: string;
  birth_date?: string;
  birth_place?: string;
  gender?: Gender;
  marital_status?: MaritalStatus;
  blood_type?: BloodType;
  nationality?: string;
  serial_number?: string;
  issue_place?: string;
  issue_date?: string;
  valid_until?: string;
  disability_status?: string;
  disability_code?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  // Relations (loaded on detail)
  addresses?: any[];
  bank_accounts?: any[];
  certificates?: any[];
  family_members?: any[];
}

/**
 * Employee list filters
 */
export interface EmployeeFilters {
  search?: string;
  employment_status?: EmploymentStatus;
  contract_type?: ContractType;
  position?: Position; // Pozisyon filtresi (örn: 'driver' - sürücüler için)
  status?: boolean; // Aktif/Pasif filtresi
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Pagination info (meta format from API)
 */
export interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/**
 * Employees list response
 */
interface EmployeesListResponse {
  data: Employee[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Single employee response
 */
interface EmployeeResponse {
  data: Employee;
}

/**
 * Create/Update employee data
 */
export interface EmployeeFormData {
  citizenship_no: string;
  first_name: string;
  last_name: string;
  phone_1: string;
  phone_2?: string;
  email: string;
  employee_code?: string;
  sgk_number?: string;
  start_date?: string;
  end_date?: string;
  employment_status: EmploymentStatus;
  contract_type?: ContractType;
  position?: Position;
  home_phone?: string;
  emergency_phone_1?: string;
  emergency_phone_2?: string;
  military_status?: MilitaryStatus;
  driving_license?: string[];
  mother_name?: string;
  father_name?: string;
  birth_date?: string;
  birth_place?: string;
  gender?: Gender;
  marital_status?: MaritalStatus;
  blood_type?: BloodType;
  nationality?: string;
  serial_number?: string;
  issue_place?: string;
  issue_date?: string;
  valid_until?: string;
  disability_status?: string;
  disability_code?: string;
  status?: boolean;
}

/**
 * Get employees list with optional filters
 */
export async function getEmployees(
  filters?: EmployeeFilters
): Promise<{ employees: Employee[]; pagination: Pagination }> {
  try {
    const response = await api.get<EmployeesListResponse>('/employees', {
      params: filters,
    });
    return {
      employees: response.data.data,
      pagination: {
        current_page: response.data.meta.current_page,
        last_page: response.data.meta.last_page,
        per_page: response.data.meta.per_page,
        total: response.data.meta.total,
      },
    };
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get single employee by ID
 */
export async function getEmployee(id: number): Promise<Employee> {
  try {
    const response = await api.get<EmployeeResponse>(`/employees/${id}`);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create new employee
 */
export async function createEmployee(data: EmployeeFormData): Promise<Employee> {
  try {
    const response = await api.post<EmployeeResponse>('/employees', data);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Update existing employee
 */
export async function updateEmployee(
  id: number,
  data: Partial<EmployeeFormData>
): Promise<Employee> {
  try {
    const response = await api.put<EmployeeResponse>(`/employees/${id}`, data);
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Delete employee
 */
export async function deleteEmployee(id: number): Promise<void> {
  try {
    await api.delete(`/employees/${id}`);
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get full name
 */
export function getFullName(employee: Employee | { first_name: string; last_name: string }): string {
  return `${employee.first_name} ${employee.last_name}`;
}

/**
 * Get employment status label in Turkish
 */
export function getEmploymentStatusLabel(status: EmploymentStatus): string {
  const labels: Record<EmploymentStatus, string> = {
    active: 'Aktif',
    passive: 'Pasif',
    on_leave: 'İzinde',
    suspended: 'Askıya Alındı',
    terminated: 'İşten Ayrıldı',
  };
  return labels[status] || status;
}

/**
 * Get contract type label in Turkish
 */
export function getContractTypeLabel(type: ContractType): string {
  const labels: Record<ContractType, string> = {
    full_time: 'Tam Zamanlı',
    part_time: 'Yarı Zamanlı',
    temporary: 'Geçici',
    seasonal: 'Sezonluk',
    internship: 'Stajyer',
    freelance: 'Serbest',
  };
  return labels[type] || type;
}

/**
 * Get position label in Turkish
 */
export function getPositionLabel(position: Position): string {
  const labels: Record<Position, string> = {
    office_staff: 'Ofis Personeli',
    driver: 'Sürücü',
    white_collar: 'Beyaz Yaka',
    blue_collar: 'Mavi Yaka',
    manager: 'Yönetici',
    supervisor: 'Süpervizör',
    technician: 'Teknisyen',
    engineer: 'Mühendis',
    accountant: 'Muhasebeci',
    sales_representative: 'Satış Temsilcisi',
    customer_service: 'Müşteri Hizmetleri',
    warehouse_staff: 'Depo Personeli',
    security: 'Güvenlik',
    cleaning_staff: 'Temizlik Personeli',
    intern: 'Stajyer',
    other: 'Diğer',
  };
  return labels[position] || position;
}

/**
 * Get gender label in Turkish
 */
export function getGenderLabel(gender: Gender): string {
  const labels: Record<Gender, string> = {
    male: 'Erkek',
    female: 'Kadın',
    other: 'Diğer',
  };
  return labels[gender] || gender;
}

/**
 * Get marital status label in Turkish
 */
export function getMaritalStatusLabel(status: MaritalStatus): string {
  const labels: Record<MaritalStatus, string> = {
    single: 'Bekar',
    married: 'Evli',
    divorced: 'Boşanmış',
    widowed: 'Dul',
  };
  return labels[status] || status;
}
