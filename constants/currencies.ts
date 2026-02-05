/**
 * Para Birimi Tanımları
 *
 * Tüm projede kullanılan döviz kodları, etiketleri ve renk şemaları.
 * Backend CurrencyType enum ile %100 uyumlu - 23 para birimi.
 *
 * STANDART: Bu dosya tüm projede tek currency kaynağıdır.
 * Backend validation: 'in:TRY,USD,EUR,GBP,AUD,DKK,CHF,SEK,CAD,KWD,NOK,SAR,JPY,BGN,RON,RUB,CNY,PKR,QAR,KRW,AZN,AED,XDR'
 */

export type CurrencyCode =
  | 'TRY' | 'USD' | 'EUR' | 'GBP'
  | 'AUD' | 'DKK' | 'CHF' | 'SEK'
  | 'CAD' | 'KWD' | 'NOK' | 'SAR'
  | 'JPY' | 'BGN' | 'RON' | 'RUB'
  | 'CNY' | 'PKR' | 'QAR' | 'KRW'
  | 'AZN' | 'AED' | 'XDR'

export interface CurrencyOption {
  label: string
  value: CurrencyCode
  symbol?: string
}

// Select input için kullanılacak döviz seçenekleri
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { label: 'Türk Lirası (TRY)', value: 'TRY', symbol: '₺' },
  { label: 'Amerikan Doları (USD)', value: 'USD', symbol: '$' },
  { label: 'Euro (EUR)', value: 'EUR', symbol: '€' },
  { label: 'İngiliz Sterlini (GBP)', value: 'GBP', symbol: '£' },
  { label: 'Avustralya Doları (AUD)', value: 'AUD', symbol: 'A$' },
  { label: 'Danimarka Kronu (DKK)', value: 'DKK', symbol: 'kr' },
  { label: 'İsviçre Frangı (CHF)', value: 'CHF', symbol: 'CHF' },
  { label: 'İsveç Kronu (SEK)', value: 'SEK', symbol: 'kr' },
  { label: 'Kanada Doları (CAD)', value: 'CAD', symbol: 'C$' },
  { label: 'Kuveyt Dinarı (KWD)', value: 'KWD', symbol: 'KD' },
  { label: 'Norveç Kronu (NOK)', value: 'NOK', symbol: 'kr' },
  { label: 'Suudi Arabistan Riyali (SAR)', value: 'SAR', symbol: 'SR' },
  { label: 'Japon Yeni (JPY)', value: 'JPY', symbol: '¥' },
  { label: 'Bulgar Levası (BGN)', value: 'BGN', symbol: 'лв' },
  { label: 'Rumen Leyi (RON)', value: 'RON', symbol: 'lei' },
  { label: 'Rus Rublesi (RUB)', value: 'RUB', symbol: '₽' },
  { label: 'Çin Yuanı (CNY)', value: 'CNY', symbol: '¥' },
  { label: 'Pakistan Rupisi (PKR)', value: 'PKR', symbol: '₨' },
  { label: 'Katar Riyali (QAR)', value: 'QAR', symbol: 'QR' },
  { label: 'Güney Kore Wonu (KRW)', value: 'KRW', symbol: '₩' },
  { label: 'Azerbaycan Manatı (AZN)', value: 'AZN', symbol: '₼' },
  { label: 'BAE Dirhemi (AED)', value: 'AED', symbol: 'AED' },
  { label: 'IMF Özel Çekme Hakkı (XDR)', value: 'XDR', symbol: 'XDR' }
]

// Para birimi renk şeması (Liste sayfaları için badge renkleri)
export const CURRENCY_COLORS: Record<string, { primary: string; bg: string }> = {
  TRY: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  USD: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  EUR: { primary: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  GBP: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  AUD: { primary: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
  DKK: { primary: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' },
  CHF: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  SEK: { primary: '#14B8A6', bg: 'rgba(20, 184, 166, 0.12)' },
  CAD: { primary: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
  KWD: { primary: '#84CC16', bg: 'rgba(132, 204, 22, 0.12)' },
  NOK: { primary: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' },
  SAR: { primary: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  JPY: { primary: '#A855F7', bg: 'rgba(168, 85, 247, 0.12)' },
  BGN: { primary: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  RON: { primary: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.12)' },
  RUB: { primary: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
  CNY: { primary: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
  PKR: { primary: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' },
  QAR: { primary: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' },
  KRW: { primary: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' },
  AZN: { primary: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)' },
  AED: { primary: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' },
  XDR: { primary: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' }
}

// Utility functions
export const getCurrencyLabel = (code: string): string => {
  const option = CURRENCY_OPTIONS.find(opt => opt.value === code)
  return option?.label || code
}

export const getCurrencySymbol = (code: string): string => {
  const option = CURRENCY_OPTIONS.find(opt => opt.value === code)
  return option?.symbol || code
}

export const getCurrencyColors = (code: string) => {
  return CURRENCY_COLORS[code] || CURRENCY_COLORS.TRY
}
