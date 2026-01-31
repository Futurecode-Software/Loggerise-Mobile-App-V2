/**
 * Para Birimi Formatlama Yardımcıları
 *
 * Tüm uygulama genelinde tutarlı para formatı sağlar.
 * Android locale sorunlarını önlemek için manuel formatlama kullanır.
 */

export type CurrencyType =
  | 'TRY' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'CAD' | 'AUD'
  | 'CNY' | 'INR' | 'RUB' | 'BRL' | 'ZAR' | 'MXN' | 'SEK' | 'NOK'
  | 'DKK' | 'PLN' | 'THB' | 'IDR' | 'MYR' | 'PHP' | 'SGD' | 'HKD'
  | 'NZD' | 'KRW' | 'CLP' | 'ARS' | 'EGP' | 'SAR' | 'AED' | 'KWD'

/**
 * Para birimi sembolleri
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$',
  CNY: '¥',
  INR: '₹',
  RUB: '₽',
  BRL: 'R$',
  ZAR: 'R',
  MXN: 'MX$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  KRW: '₩',
  CLP: 'CLP$',
  ARS: 'AR$',
  EGP: 'E£',
  SAR: 'SR',
  AED: 'AED',
  KWD: 'KD'
}

/**
 * Para birimi sembolünü döndürür
 */
export function getCurrencySymbol(currency: CurrencyType | string): string {
  return CURRENCY_SYMBOLS[currency] || currency
}

/**
 * Sayıyı Türk formatında formatlar (1.234,56)
 * Android locale sorunlarını önlemek için manuel formatlama kullanır
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  const safeAmount = Number(amount) || 0
  const absAmount = Math.abs(safeAmount)
  const parts = absAmount.toFixed(decimals).split('.')
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Ondalık basamak yoksa sadece tam kısmı döndür
  if (decimals === 0) {
    return integerPart
  }

  const decimalPart = parts[1]
  return `${integerPart},${decimalPart}`
}

/**
 * Para tutarını formatlar (sembol ile)
 *
 * @param amount - Formatlanacak tutar
 * @param currency - Para birimi kodu (TRY, USD, EUR vb.)
 * @param options - Formatlama seçenekleri
 * @returns Formatlanmış para tutarı (örn: "₺ 1.234,56" veya "-$ 500,00")
 *
 * @example
 * formatCurrency(1234.56, 'TRY') // "₺ 1.234,56"
 * formatCurrency(-500, 'USD') // "-$ 500,00"
 * formatCurrency(1000, 'EUR', { showSign: true }) // "+€ 1.000,00"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyType | string,
  options?: {
    showSign?: boolean // Pozitif değerler için + işareti göster
    decimals?: number  // Ondalık basamak sayısı (varsayılan: 2)
    symbolPosition?: 'before' | 'after' // Sembol pozisyonu (varsayılan: before)
  }
): string {
  const { showSign = false, decimals = 2, symbolPosition = 'before' } = options || {}

  const safeAmount = Number(amount) || 0
  const symbol = getCurrencySymbol(currency)
  const formatted = formatNumber(Math.abs(safeAmount), decimals)

  let sign = ''
  if (safeAmount < 0) {
    sign = '-'
  } else if (showSign && safeAmount > 0) {
    sign = '+'
  }

  if (symbolPosition === 'after') {
    return `${sign}${formatted} ${symbol}`
  }

  return `${sign}${symbol} ${formatted}`
}

/**
 * Bakiye formatlar (kısa versiyon, pozitif/negatif renk için kullanışlı)
 *
 * @example
 * formatBalance(1234.56, 'TRY') // "₺1.234,56"
 */
export function formatBalance(amount: number, currency: CurrencyType | string): string {
  const safeAmount = Number(amount) || 0
  const symbol = getCurrencySymbol(currency)
  const formatted = formatNumber(Math.abs(safeAmount))
  const sign = safeAmount < 0 ? '-' : ''

  return `${sign}${symbol}${formatted}`
}

/**
 * Kompakt para formatı (büyük sayılar için K, M, B kısaltmaları)
 *
 * @example
 * formatCompactCurrency(1500, 'TRY') // "₺1,5K"
 * formatCompactCurrency(2500000, 'USD') // "$2,5M"
 */
export function formatCompactCurrency(
  amount: number,
  currency: CurrencyType | string
): string {
  const safeAmount = Number(amount) || 0
  const symbol = getCurrencySymbol(currency)
  const absAmount = Math.abs(safeAmount)
  const sign = safeAmount < 0 ? '-' : ''

  if (absAmount >= 1_000_000_000) {
    const value = (absAmount / 1_000_000_000).toFixed(1).replace('.', ',')
    return `${sign}${symbol}${value}B`
  }

  if (absAmount >= 1_000_000) {
    const value = (absAmount / 1_000_000).toFixed(1).replace('.', ',')
    return `${sign}${symbol}${value}M`
  }

  if (absAmount >= 1_000) {
    const value = (absAmount / 1_000).toFixed(1).replace('.', ',')
    return `${sign}${symbol}${value}K`
  }

  return formatBalance(safeAmount, currency)
}

/**
 * Tutar pozitif mi kontrol eder
 */
export function isPositiveAmount(amount: number): boolean {
  return (Number(amount) || 0) >= 0
}

/**
 * Tutar negatif mi kontrol eder
 */
export function isNegativeAmount(amount: number): boolean {
  return (Number(amount) || 0) < 0
}

/**
 * Kompakt sayı formatı (K, M, B kısaltmaları - sembol olmadan)
 * Dashboard metrik kartları için ideal
 *
 * @example
 * formatCompactNumber(1500) // "1,5K"
 * formatCompactNumber(2500000) // "2,5M"
 * formatCompactNumber(500) // "500"
 */
export function formatCompactNumber(amount: number): string {
  const safeAmount = Number(amount) || 0
  const absAmount = Math.abs(safeAmount)
  const sign = safeAmount < 0 ? '-' : ''

  if (absAmount >= 1_000_000_000) {
    const value = (absAmount / 1_000_000_000).toFixed(1).replace('.', ',')
    return `${sign}${value}B`
  }

  if (absAmount >= 1_000_000) {
    const value = (absAmount / 1_000_000).toFixed(1).replace('.', ',')
    return `${sign}${value}M`
  }

  if (absAmount >= 1_000) {
    const value = (absAmount / 1_000).toFixed(0)
    return `${sign}${value}K`
  }

  return formatNumber(safeAmount, 0)
}

/**
 * Dashboard için para tutarı formatlar (TRY varsayılan)
 * Kompakt format kullanır (K, M kısaltmaları)
 *
 * @example
 * formatDashboardCurrency(1500) // "₺1,5K"
 * formatDashboardCurrency(2500000, 'USD') // "$2,5M"
 */
export function formatDashboardCurrency(
  amount: number,
  currency: CurrencyType | string = 'TRY'
): string {
  const symbol = getCurrencySymbol(currency)
  const compact = formatCompactNumber(amount)
  const isNegative = amount < 0

  // Negatif işareti varsa sembolün önüne koy
  if (isNegative) {
    return `-${symbol}${compact.substring(1)}`
  }

  return `${symbol}${compact}`
}
