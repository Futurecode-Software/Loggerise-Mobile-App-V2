/**
 * Cash Registers API Endpoints
 *
 * Kasa yönetimi API işlemleri.
 * Backend MobileCashRegisterController ile uyumlu.
 */

import api, { getErrorMessage } from '../api'
import { formatCurrency } from '@/utils/formatters'
import type { CurrencyCode } from '@/constants/currencies'

/**
 * Kasa entity
 */
export interface CashRegister {
  id: number
  name: string
  code?: string
  location?: string
  currency_type: CurrencyCode
  balance: number
  opening_balance: number
  responsible_user_id?: number
  responsible_user?: { id: number; name: string; email: string } | null
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Kasa liste filtreleri
 */
export interface CashRegisterFilters {
  search?: string
  currency_type?: CurrencyCode
  is_active?: boolean
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
  from: number | null
  to: number | null
}

/**
 * Kasa liste response
 */
interface CashRegistersListResponse {
  success: boolean
  data: {
    cash_registers: CashRegister[]
    pagination: Pagination
  }
}

/**
 * Tekil kasa response
 */
interface CashRegisterResponse {
  success: boolean
  data: {
    cash_register: CashRegister
  }
}

/**
 * Kasa oluşturma/güncelleme form verisi
 */
export interface CashRegisterFormData {
  name: string
  code?: string
  location?: string
  currency_type: CurrencyCode
  opening_balance?: number
  responsible_user_id?: number
  description?: string
  is_active?: boolean
}

/**
 * Kasa listesini getir
 */
export async function getCashRegisters(
  filters?: CashRegisterFilters
): Promise<{ cashRegisters: CashRegister[]; pagination: Pagination }> {
  try {
    const response = await api.get<CashRegistersListResponse>('/cash-registers', {
      params: filters,
    })
    return {
      cashRegisters: response.data.data.cash_registers,
      pagination: response.data.data.pagination,
    }
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Tekil kasa getir
 */
export async function getCashRegister(id: number): Promise<CashRegister> {
  try {
    const response = await api.get<CashRegisterResponse>(`/cash-registers/${id}`)
    return response.data.data.cash_register
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Yeni kasa oluştur
 */
export async function createCashRegister(data: CashRegisterFormData): Promise<CashRegister> {
  try {
    const response = await api.post<CashRegisterResponse>('/cash-registers', data)
    return response.data.data.cash_register
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Kasa güncelle
 */
export async function updateCashRegister(
  id: number,
  data: Partial<CashRegisterFormData>
): Promise<CashRegister> {
  try {
    const response = await api.put<CashRegisterResponse>(`/cash-registers/${id}`, data)
    return response.data.data.cash_register
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Kasa sil
 */
export async function deleteCashRegister(id: number): Promise<void> {
  try {
    await api.delete(`/cash-registers/${id}`)
  } catch (error) {
    const message = getErrorMessage(error)
    throw new Error(message)
  }
}

/**
 * Bakiye formatla
 */
export function formatBalance(amount: number | undefined | null, currency: CurrencyCode): string {
  return formatCurrency(amount, currency)
}
