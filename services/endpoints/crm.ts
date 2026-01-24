/**
 * CRM API Endpoints
 *
 * Handles CRM dashboard operations.
 */

import api, { getErrorMessage } from '../api';

/**
 * Quote status type
 */
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

/**
 * Currency breakdown item
 */
export interface CurrencyBreakdown {
  count: number;
  amount: number;
  currency: string;
}

/**
 * Won quotes stats
 */
export interface WonQuotesStats {
  count: number;
  amount: number;
  growthPercentage: number;
  currency: string;
  breakdown?: CurrencyBreakdown[];
}

/**
 * Quote statistics
 */
export interface QuoteStats {
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
export interface CustomerStats {
  total: number;
  activeThisMonth: number;
}

/**
 * Recent quote item
 */
export interface RecentQuote {
  id: number;
  quote_number: string;
  customer_name: string;
  total_amount: number;
  currency: string;
  status: QuoteStatus;
  created_at: string;
}

/**
 * CRM Dashboard data
 */
export interface CrmDashboardData {
  wonQuotes: WonQuotesStats;
  quoteStats: QuoteStats;
  customerStats: CustomerStats;
  conversionRate: number;
  recentQuotes: RecentQuote[];
  pendingQuotes: RecentQuote[];
  expiringQuotes: RecentQuote[];
  currency: string;
}

/**
 * CRM Dashboard response
 */
interface CrmDashboardResponse {
  success: boolean;
  data: CrmDashboardData;
}

/**
 * Get CRM dashboard data
 */
export async function getCrmDashboard(): Promise<CrmDashboardData> {
  try {
    const response = await api.get<CrmDashboardResponse>('/dashboard/crm');
    return response.data.data;
  } catch (error) {
    const message = getErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Get quote status label in Turkish
 */
export function getQuoteStatusLabel(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    draft: 'Taslak',
    sent: 'Gonderildi',
    accepted: 'Kabul Edildi',
    rejected: 'Reddedildi',
    expired: 'Suresi Doldu',
  };
  return labels[status] || status;
}

/**
 * Get quote status color
 */
export function getQuoteStatusColor(status: QuoteStatus): string {
  const colors: Record<QuoteStatus, string> = {
    draft: 'default',
    sent: 'info',
    accepted: 'success',
    rejected: 'danger',
    expired: 'warning',
  };
  return colors[status] || 'default';
}

/**
 * Format currency amount (safe for undefined/null values)
 */
export function formatCurrency(amount: number | undefined | null, currency: string = 'TRY'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '-';
  }
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || currency;
  const formatted = amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
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
