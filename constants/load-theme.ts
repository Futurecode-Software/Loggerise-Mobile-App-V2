/**
 * Yük Modülü Tema Sabitleri
 *
 * Durum renkleri, yön renkleri ve diğer özel stiller
 */

import type { LoadStatus, LoadDirection, DocumentStatus } from '@/types/load'

// Durum renkleri
export const LoadStatusColors: Record<LoadStatus, string> = {
  pending: '#F59E0B',      // Turuncu - Beklemede
  confirmed: '#3B82F6',    // Mavi - Onaylandı
  in_progress: '#3B82F6',  // Mavi - İşlemde
  in_transit: '#10B981',   // Yeşil - Yolda
  delivered: '#065F46',    // Koyu Yeşil - Teslim Edildi
  completed: '#065F46',    // Koyu Yeşil - Tamamlandı
  cancelled: '#EF4444',    // Kırmızı - İptal
}

// Durum arka plan renkleri
export const LoadStatusBgColors: Record<LoadStatus, string> = {
  pending: 'rgba(245, 158, 11, 0.12)',
  confirmed: 'rgba(59, 130, 246, 0.12)',
  in_progress: 'rgba(59, 130, 246, 0.12)',
  in_transit: 'rgba(16, 185, 129, 0.12)',
  delivered: 'rgba(6, 95, 70, 0.12)',
  completed: 'rgba(6, 95, 70, 0.12)',
  cancelled: 'rgba(239, 68, 68, 0.12)',
}

// Durum etiketleri
export const LoadStatusLabels: Record<LoadStatus, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  in_progress: 'İşlemde',
  in_transit: 'Yolda',
  delivered: 'Teslim Edildi',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

// Yön renkleri
export const LoadDirectionColors: Record<LoadDirection, string> = {
  export: '#10B981',  // Yeşil - İhracat
  import: '#3B82F6',  // Mavi - İthalat
}

// Yön arka plan renkleri
export const LoadDirectionBgColors: Record<LoadDirection, string> = {
  export: 'rgba(16, 185, 129, 0.12)',
  import: 'rgba(59, 130, 246, 0.12)',
}

// Yön etiketleri
export const LoadDirectionLabels: Record<LoadDirection, string> = {
  export: 'İhracat',
  import: 'İthalat',
}

// Belge durumu etiketleri
export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  none: 'Yok',
  original: 'Orijinal',
  copy: 'Kopya',
  digital: 'Dijital',
}

// Filtre seçenekleri - Durum
export const STATUS_FILTER_OPTIONS = [
  { id: 'all', label: 'Tümü' },
  { id: 'pending', label: 'Beklemede' },
  { id: 'confirmed', label: 'Onaylandı' },
  { id: 'in_progress', label: 'İşlemde' },
  { id: 'in_transit', label: 'Yolda' },
  { id: 'delivered', label: 'Teslim Edildi' },
  { id: 'completed', label: 'Tamamlandı' },
  { id: 'cancelled', label: 'İptal' },
] as const

// Filtre seçenekleri - Yön
export const DIRECTION_FILTER_OPTIONS = [
  { id: 'all', label: 'Tümü' },
  { id: 'export', label: 'İhracat' },
  { id: 'import', label: 'İthalat' },
] as const

// Araç tipleri
export const VEHICLE_TYPES = [
  'Tır (TIR)',
  'Kamyon',
  'Kamyonet',
  'Frigorifik',
  'Tanker',
  'Lowbed',
  'Konteyner',
] as const

// Yükleme tipleri
export const LOADING_TYPES = [
  'Palet',
  'Koli',
  'Dökme',
  'Konteyner',
  'Bigbag',
  'Rulo',
  'Paket',
] as const

// Taşıma hızları
export const TRANSPORT_SPEEDS = [
  'Normal',
  'Ekspres',
  'Acil',
] as const

// Kargo sınıfları
export const CARGO_CLASSES = [
  'Standart',
  'Tehlikeli',
  'Soğuk Zincir',
  'Değerli',
  'Kırılgan',
  'Canlı',
] as const

// Teslim şartları (Incoterms)
export const DELIVERY_TERMS = [
  'EXW',
  'FCA',
  'FAS',
  'FOB',
  'CFR',
  'CIF',
  'CPT',
  'CIP',
  'DAP',
  'DPU',
  'DDP',
] as const

// Para birimleri
export const CURRENCIES = [
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'USD', symbol: '$', name: 'ABD Doları' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini' },
] as const
