/**
 * Güvenli sayı ve para birimi formatlama yardımcı fonksiyonları
 * Safe number and currency formatting utility functions
 */

/**
 * Sayıyı Türkçe yerel ayarlarında formatlar (güvenli)
 * Safely formats a number using Turkish locale
 *
 * @param value - Formatlanacak sayı (optional)
 * @param unit - Opsiyonel birim (örn: 'km', 'kg')
 * @param decimals - Ondalık basamak sayısı (varsayılan: 0)
 * @returns Formatlanmış string veya '-' (undefined/null ise)
 *
 * @example
 * formatNumber(1234.56) // "1.234,56"
 * formatNumber(1000, 'km') // "1.000 km"
 * formatNumber(undefined) // "-"
 */
export const formatNumber = (
  value?: number | null,
  unit?: string,
  decimals: number = 0
): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }

  const formatted = value.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Para birimini kompakt formatta gösterir (K/M kısaltmaları ile)
 * Formats currency in compact format with K/M suffixes
 *
 * @param amount - Miktar (optional)
 * @param currency - Para birimi kodu (varsayılan: 'TRY')
 * @returns Formatlanmış string veya '-' (undefined/null ise)
 *
 * @example
 * formatCurrencyCompact(1500000) // "1.5M ₺"
 * formatCurrencyCompact(2500, 'USD') // "2K $"
 * formatCurrencyCompact(undefined) // "-"
 */
export const formatCurrencyCompact = (
  amount?: number | null,
  currency: string = 'TRY'
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '-';
  }

  const symbol = getCurrencySymbol(currency);

  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${symbol}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${symbol}`;
  }

  return `${amount.toLocaleString('tr-TR')} ${symbol}`;
};

/**
 * Para birimini tam formatta gösterir
 * Formats currency in full format
 *
 * @param amount - Miktar (optional)
 * @param currency - Para birimi kodu (varsayılan: 'TRY')
 * @param decimals - Ondalık basamak sayısı (varsayılan: 2)
 * @returns Formatlanmış string veya '-' (undefined/null ise)
 *
 * @example
 * formatCurrency(1234.56, 'TRY') // "1.234,56 ₺"
 * formatCurrency(1000, 'USD', 0) // "1.000 $"
 * formatCurrency(null) // "-"
 */
export const formatCurrency = (
  amount?: number | null,
  currency: string = 'TRY',
  decimals: number = 2
): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '-';
  }

  // Ensure amount is a number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return '-';
  }

  // Manual formatting for React Native compatibility (Hermes engine)
  // Split integer and decimal parts
  const fixedAmount = numAmount.toFixed(decimals);
  const [integerPart, decimalPart] = fixedAmount.split('.');

  // Add thousand separators (Turkish format: dot for thousands)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Combine with comma as decimal separator (Turkish format)
  const formatted = decimals > 0
    ? `${formattedInteger},${decimalPart}`
    : formattedInteger;

  const symbol = getCurrencySymbol(currency);
  return `${formatted} ${symbol}`;
};

/**
 * Para birimi kodunu sembole çevirir
 * Converts currency code to symbol
 *
 * @param currency - Para birimi kodu
 * @returns Para birimi sembolü
 */
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'TRY': '₺',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
  };

  return symbols[currency.toUpperCase()] || currency;
};

/**
 * Tarihi Türkçe formatında gösterir
 * Formats date in Turkish locale
 *
 * @param date - Tarih (Date, string, veya number)
 * @param options - Intl.DateTimeFormatOptions (opsiyonel)
 * @returns Formatlanmış tarih string veya '-' (undefined/null ise)
 *
 * @example
 * formatDate(new Date()) // "23.01.2026"
 * formatDate('2026-01-23') // "23.01.2026"
 * formatDate(undefined) // "-"
 */
export const formatDate = (
  date?: Date | string | number | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) {
    return '-';
  }

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    return dateObj.toLocaleDateString('tr-TR', options);
  } catch {
    return '-';
  }
};

/**
 * Tarih ve saati Türkçe formatında gösterir
 * Formats date and time in Turkish locale
 *
 * @param date - Tarih (Date, string, veya number)
 * @returns Formatlanmış tarih-saat string veya '-' (undefined/null ise)
 *
 * @example
 * formatDateTime(new Date()) // "23.01.2026 14:30:45"
 * formatDateTime(undefined) // "-"
 */
export const formatDateTime = (
  date?: Date | string | number | null
): string => {
  if (!date) {
    return '-';
  }

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    return dateObj.toLocaleString('tr-TR');
  } catch {
    return '-';
  }
};
